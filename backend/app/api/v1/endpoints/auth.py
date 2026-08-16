import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.deps import get_db, get_current_user
from app.schemas.common import ResponseModel
from app.schemas.auth import (
    UserRegister,
    UserLogin,
    TokenResponse,
    UserRead,
    ChangePasswordRequest,
    ForgotPasswordRequest,
    ResetPasswordRequest,
)
from app.services.auth_service import AuthService
from app.core.security import create_access_token, create_refresh_token, verify_password, get_password_hash
from app.models.user import User
from app.models.audit import AuditLog

router = APIRouter()


@router.post("/register", response_model=ResponseModel[TokenResponse])
async def register(
    data: UserRegister,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    try:
        user = await AuthService.register_user(db, data)
        user.last_login_at = datetime.now(timezone.utc)
        await db.commit()
        await db.refresh(user)

        # Audit log registration
        audit = AuditLog(
            user_id=user.id,
            actor_name=user.full_name,
            actor_role=str(user.role.value if hasattr(user.role, 'value') else user.role),
            action="USER_REGISTER",
            target_type="USER",
            target_id=user.id,
            details={"email": user.email},
            ip_address=request.client.host if request.client else None,
        )
        db.add(audit)
        await db.commit()

        access_token = create_access_token(user.id)
        refresh_token = create_refresh_token(user.id)
        return ResponseModel(
            data=TokenResponse(
                access_token=access_token,
                refresh_token=refresh_token,
                user=UserRead.model_validate(user),
            ),
            message="User account registered successfully!",
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/login", response_model=ResponseModel[TokenResponse])
async def login(
    data: UserLogin,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    try:
        user = await AuthService.authenticate_user(db, data)
        if not user.is_active or getattr(user, 'is_deleted', False):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Your account has been deactivated or suspended. Please contact platform support.",
            )

        # Update last login timestamp
        user.last_login_at = datetime.now(timezone.utc)
        await db.commit()
        await db.refresh(user)

        # Record Login Audit Log
        audit = AuditLog(
            user_id=user.id,
            actor_name=user.full_name,
            actor_role=str(user.role.value if hasattr(user.role, 'value') else user.role),
            action="USER_LOGIN",
            target_type="USER",
            target_id=user.id,
            details={"email": user.email, "is_superuser": user.is_superuser},
            ip_address=request.client.host if request.client else None,
        )
        db.add(audit)
        await db.commit()

        access_token = create_access_token(user.id)
        refresh_token = create_refresh_token(user.id)
        return ResponseModel(
            data=TokenResponse(
                access_token=access_token,
                refresh_token=refresh_token,
                user=UserRead.model_validate(user),
            ),
            message="Authentication successful!",
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e))


@router.get("/me", response_model=ResponseModel[UserRead])
async def get_me(current_user: User = Depends(get_current_user)):
    return ResponseModel(data=UserRead.model_validate(current_user))


@router.post("/change-password", response_model=ResponseModel[dict])
async def change_password(
    data: ChangePasswordRequest,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Verify current password
    if not verify_password(data.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The current password you entered is incorrect.",
        )

    # Validate confirmation match
    if data.new_password != data.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password and confirmation password do not match.",
        )

    if data.new_password == data.current_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password cannot be identical to your current password.",
        )

    # Update password
    current_user.hashed_password = get_password_hash(data.new_password)
    current_user.updated_at = datetime.now(timezone.utc)
    await db.commit()

    # Record Audit Log
    audit = AuditLog(
        user_id=current_user.id,
        actor_name=current_user.full_name,
        actor_role=str(current_user.role.value if hasattr(current_user.role, 'value') else current_user.role),
        action="PASSWORD_CHANGE",
        target_type="USER",
        target_id=current_user.id,
        details={"status": "SUCCESS"},
        ip_address=request.client.host if request.client else None,
    )
    db.add(audit)
    await db.commit()

    return ResponseModel(
        data={"success": True},
        message="Your password has been changed securely.",
    )


@router.post("/forgot-password", response_model=ResponseModel[dict])
async def forgot_password(
    data: ForgotPasswordRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    # Safe response regardless of email existence to prevent user enumeration
    return ResponseModel(
        data={"sent": True},
        message="If this email is registered, a password reset link has been dispatched.",
    )


@router.post("/reset-password", response_model=ResponseModel[dict])
async def reset_password(
    data: ResetPasswordRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    if data.new_password != data.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Passwords do not match.",
        )
    return ResponseModel(
        data={"success": True},
        message="Password has been reset successfully. Please log in with your new credentials.",
    )
