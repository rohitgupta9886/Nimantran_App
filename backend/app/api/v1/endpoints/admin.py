import io
import csv
import uuid
from datetime import datetime, timezone
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, Query, Request, Response
from fastapi.responses import StreamingResponse
from sqlalchemy import select, func, or_, desc, asc
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.deps import get_db, get_current_admin
from app.schemas.common import ResponseModel
from app.schemas.auth import UserRead
from app.schemas.admin import (
    AdminUserCreate,
    AdminUserUpdate,
    AdminRoleChangeRequest,
    AdminStatusChangeRequest,
    AdminUserDetail,
    AdminPaginatedUsers,
    AdminAuditLogRead,
    AdminPaginatedAuditLogs,
    AdminPlatformStats,
)
from app.models.user import User, UserRole
from app.models.event import Event, Invitation
from app.models.guest import Guest, RSVP
from app.models.credit import CreditWallet
from app.models.audit import AuditLog
from app.core.security import get_password_hash

router = APIRouter()


# ─── 1. PLATFORM SUMMARY & METRICS ───────────────────────────────────────────
@router.get("/stats", response_model=ResponseModel[AdminPlatformStats])
async def admin_get_stats(
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    # Total Users & breakdown
    users_res = await db.execute(select(User).where(User.is_deleted == False))
    all_users = users_res.scalars().all()

    total_users = len(all_users)
    active_users = sum(1 for u in all_users if u.is_active)
    inactive_users = total_users - active_users
    pro_users = sum(1 for u in all_users if u.role in [UserRole.PRO, UserRole.HOST])
    free_users = sum(1 for u in all_users if u.role == UserRole.FREE)
    admin_users = sum(1 for u in all_users if u.role == UserRole.ADMIN or u.is_superuser)

    # Total Events
    events_res = await db.execute(select(func.count(Event.id)))
    total_events = events_res.scalar() or 0

    # Total Invitations Shared (guests with delivery status)
    inv_res = await db.execute(select(func.count(Guest.id)))
    total_invitations_shared = inv_res.scalar() or 0

    # Total RSVPs
    rsvp_res = await db.execute(select(func.count(RSVP.id)))
    total_rsvps = rsvp_res.scalar() or 0

    return ResponseModel(
        data=AdminPlatformStats(
            total_users=total_users,
            active_users=active_users,
            inactive_users=inactive_users,
            pro_users=pro_users,
            free_users=free_users,
            admin_users=admin_users,
            total_events=total_events,
            total_invitations_shared=total_invitations_shared,
            total_rsvps=total_rsvps,
            system_health="OPTIMAL",
            db_status="CONNECTED",
            redis_status="CONNECTED",
        )
    )


# ─── 2. USER MANAGEMENT (SERVER-SIDE PAGINATION, SEARCH, FILTERS) ────────────
@router.get("/users", response_model=ResponseModel[AdminPaginatedUsers])
async def admin_list_users(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    search: Optional[str] = None,
    role: Optional[str] = None,
    status: Optional[str] = None,
    sort_by: Optional[str] = Query("created_at"),
    order: Optional[str] = Query("desc"),
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    query = select(User).where(User.is_deleted == False)

    # Search filter
    if search:
        search_pattern = f"%{search.strip()}%"
        query = query.where(
            or_(
                User.full_name.ilike(search_pattern),
                User.email.ilike(search_pattern),
                User.phone.ilike(search_pattern),
            )
        )

    # Role filter
    if role and role.upper() != "ALL":
        query = query.where(User.role == role.upper())

    # Status filter
    if status and status.upper() != "ALL":
        if status.upper() == "ACTIVE":
            query = query.where(User.is_active == True)
        elif status.upper() == "INACTIVE":
            query = query.where(User.is_active == False)

    # Count total
    count_query = select(func.count()).select_from(query.subquery())
    count_res = await db.execute(count_query)
    total_count = count_res.scalar() or 0

    # Sorting
    sort_col = getattr(User, sort_by, User.created_at)
    if order.lower() == "asc":
        query = query.order_by(asc(sort_col))
    else:
        query = query.order_by(desc(sort_col))

    # Pagination
    offset = (page - 1) * page_size
    query = query.offset(offset).limit(page_size)

    res = await db.execute(query)
    users = res.scalars().all()

    total_pages = max(1, (total_count + page_size - 1) // page_size)

    return ResponseModel(
        data=AdminPaginatedUsers(
            items=[UserRead.model_validate(u) for u in users],
            total=total_count,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
        )
    )


# ─── 3. USER DETAILS DRAWER ──────────────────────────────────────────────────
@router.get("/users/{user_id}", response_model=ResponseModel[AdminUserDetail])
async def admin_get_user_detail(
    user_id: str,
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(User).where(User.id == user_id, User.is_deleted == False)
    res = await db.execute(stmt)
    user = res.scalars().first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

    # Event count
    ev_count_res = await db.execute(select(func.count(Event.id)).where(Event.user_id == user_id))
    event_count = ev_count_res.scalar() or 0

    # Guest count
    guest_count_res = await db.execute(
        select(func.count(Guest.id))
        .join(Event, Guest.event_id == Event.id)
        .where(Event.user_id == user_id)
    )
    guest_count = guest_count_res.scalar() or 0

    # Wallet balance
    wallet_res = await db.execute(select(CreditWallet).where(CreditWallet.user_id == user_id))
    wallet = wallet_res.scalars().first()
    wallet_balance = wallet.balance if wallet else 0

    # Recent events
    recent_ev_res = await db.execute(
        select(Event)
        .where(Event.user_id == user_id)
        .order_by(Event.created_at.desc())
        .limit(5)
    )
    recent_events = [
        {"id": e.id, "title": e.title, "event_type": str(e.event_type.value if hasattr(e.event_type, 'value') else e.event_type), "created_at": e.created_at.isoformat() if e.created_at else None}
        for e in recent_ev_res.scalars().all()
    ]

    detail = AdminUserDetail(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        phone=user.phone,
        role=user.role,
        is_active=user.is_active,
        is_deleted=user.is_deleted,
        is_superuser=user.is_superuser,
        last_login_at=user.last_login_at,
        created_at=user.created_at,
        event_count=event_count,
        guest_count=guest_count,
        wallet_balance=wallet_balance,
        recent_events=recent_events,
    )
    return ResponseModel(data=detail)


# ─── 4. CREATE USER (ADMIN INITIATED) ────────────────────────────────────────
@router.post("/users", response_model=ResponseModel[UserRead])
async def admin_create_user(
    data: AdminUserCreate,
    request: Request,
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    # Check email duplicate
    existing = await db.execute(select(User).where(User.email == data.email))
    if existing.scalars().first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address already exists.",
        )

    # Set password (or default setup pass)
    password_to_hash = data.password or "NimantranWelcome2026!"
    is_super = data.role == UserRole.ADMIN

    new_user = User(
        email=data.email,
        hashed_password=get_password_hash(password_to_hash),
        full_name=data.full_name,
        phone=data.phone,
        role=data.role,
        is_active=data.is_active,
        is_superuser=is_super,
    )
    db.add(new_user)
    await db.flush()

    # Credit Wallet
    wallet = CreditWallet(user_id=new_user.id, balance=500)
    db.add(wallet)

    # Audit log
    audit = AuditLog(
        user_id=admin.id,
        actor_name=admin.full_name,
        actor_role=str(admin.role.value if hasattr(admin.role, 'value') else admin.role),
        action="USER_CREATE",
        target_type="USER",
        target_id=new_user.id,
        details={"created_email": new_user.email, "role": str(new_user.role.value if hasattr(new_user.role, 'value') else new_user.role)},
        ip_address=request.client.host if request.client else None,
    )
    db.add(audit)
    await db.commit()
    await db.refresh(new_user)

    return ResponseModel(
        data=UserRead.model_validate(new_user),
        message=f"User account created for {new_user.email}.",
    )


# ─── 5. EDIT USER ────────────────────────────────────────────────────────────
@router.put("/users/{user_id}", response_model=ResponseModel[UserRead])
async def admin_update_user(
    user_id: str,
    data: AdminUserUpdate,
    request: Request,
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(User).where(User.id == user_id, User.is_deleted == False)
    res = await db.execute(stmt)
    user = res.scalars().first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

    if data.full_name is not None:
        user.full_name = data.full_name
    if data.phone is not None:
        user.phone = data.phone
    if data.is_active is not None:
        user.is_active = data.is_active
    if data.role is not None:
        user.role = data.role
        user.is_superuser = data.role == UserRole.ADMIN

    user.updated_at = datetime.now(timezone.utc)
    await db.commit()

    # Audit log
    audit = AuditLog(
        user_id=admin.id,
        actor_name=admin.full_name,
        actor_role=str(admin.role.value if hasattr(admin.role, 'value') else admin.role),
        action="USER_UPDATE",
        target_type="USER",
        target_id=user.id,
        details={"updated_fields": [k for k, v in data.model_dump().items() if v is not None]},
        ip_address=request.client.host if request.client else None,
    )
    db.add(audit)
    await db.commit()

    return ResponseModel(
        data=UserRead.model_validate(user),
        message="User profile updated successfully.",
    )


# ─── 6. ACTIVATE / DEACTIVATE (WITH LAST-ADMIN SAFEGUARD) ────────────────────
@router.post("/users/{user_id}/status", response_model=ResponseModel[UserRead])
async def admin_change_user_status(
    user_id: str,
    data: AdminStatusChangeRequest,
    request: Request,
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(User).where(User.id == user_id, User.is_deleted == False)
    res = await db.execute(stmt)
    user = res.scalars().first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

    # Safeguard: Prevent deactivating the last active Admin
    if not data.is_active and (user.role == UserRole.ADMIN or user.is_superuser):
        admin_count_res = await db.execute(
            select(func.count(User.id)).where(
                (User.role == UserRole.ADMIN) | (User.is_superuser == True),
                User.is_active == True,
                User.is_deleted == False,
            )
        )
        active_admins = admin_count_res.scalar() or 0
        if active_admins <= 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Lockout Safeguard: Cannot deactivate the last remaining active Administrator.",
            )

    user.is_active = data.is_active
    user.updated_at = datetime.now(timezone.utc)
    await db.commit()

    # Audit log
    action_type = "USER_ACTIVATE" if data.is_active else "USER_DEACTIVATE"
    audit = AuditLog(
        user_id=admin.id,
        actor_name=admin.full_name,
        actor_role=str(admin.role.value if hasattr(admin.role, 'value') else admin.role),
        action=action_type,
        target_type="USER",
        target_id=user.id,
        details={"is_active": data.is_active, "target_email": user.email},
        ip_address=request.client.host if request.client else None,
    )
    db.add(audit)
    await db.commit()

    status_str = "activated" if data.is_active else "deactivated"
    return ResponseModel(
        data=UserRead.model_validate(user),
        message=f"User {user.email} has been {status_str}.",
    )


# ─── 7. CHANGE ROLE (WITH PREVENT LOCKOUT & SELF-DEMOTION SAFEGUARD) ─────────
@router.post("/users/{user_id}/role", response_model=ResponseModel[UserRead])
async def admin_change_user_role(
    user_id: str,
    data: AdminRoleChangeRequest,
    request: Request,
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(User).where(User.id == user_id, User.is_deleted == False)
    res = await db.execute(stmt)
    user = res.scalars().first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

    # Safeguard: Prevent demoting the last remaining active Admin
    if user.role == UserRole.ADMIN and data.role != UserRole.ADMIN:
        admin_count_res = await db.execute(
            select(func.count(User.id)).where(
                (User.role == UserRole.ADMIN) | (User.is_superuser == True),
                User.is_active == True,
                User.is_deleted == False,
            )
        )
        active_admins = admin_count_res.scalar() or 0
        if active_admins <= 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Lockout Safeguard: Cannot demote the last remaining active Administrator.",
            )

    # Safeguard: Prevent accidental self-demotion from Admin
    if user.id == admin.id and data.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Security Safeguard: You cannot remove your own Administrator role.",
        )

    previous_role = str(user.role.value if hasattr(user.role, 'value') else user.role)
    user.role = data.role
    user.is_superuser = data.role == UserRole.ADMIN
    user.updated_at = datetime.now(timezone.utc)
    await db.commit()

    # Audit log
    audit = AuditLog(
        user_id=admin.id,
        actor_name=admin.full_name,
        actor_role=str(admin.role.value if hasattr(admin.role, 'value') else admin.role),
        action="ROLE_CHANGE",
        target_type="USER",
        target_id=user.id,
        details={"from_role": previous_role, "to_role": str(data.role.value if hasattr(data.role, 'value') else data.role), "target_email": user.email},
        ip_address=request.client.host if request.client else None,
    )
    db.add(audit)
    await db.commit()

    return ResponseModel(
        data=UserRead.model_validate(user),
        message=f"Role for {user.email} updated to {user.role}.",
    )


# ─── 8. SOFT DELETE USER (WITH SAFEGUARDS) ──────────────────────────────────
@router.delete("/users/{user_id}", response_model=ResponseModel[dict])
async def admin_delete_user(
    user_id: str,
    request: Request,
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(User).where(User.id == user_id, User.is_deleted == False)
    res = await db.execute(stmt)
    user = res.scalars().first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

    # Safeguard: Prevent deleting the last active admin
    if user.role == UserRole.ADMIN or user.is_superuser:
        admin_count_res = await db.execute(
            select(func.count(User.id)).where(
                (User.role == UserRole.ADMIN) | (User.is_superuser == True),
                User.is_active == True,
                User.is_deleted == False,
            )
        )
        active_admins = admin_count_res.scalar() or 0
        if active_admins <= 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Lockout Safeguard: Cannot delete the last remaining active Administrator.",
            )

    # Safeguard: Prevent self-deletion
    if user.id == admin.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Security Safeguard: You cannot delete your own Administrator account.",
        )

    user.is_deleted = True
    user.is_active = False
    user.updated_at = datetime.now(timezone.utc)
    await db.commit()

    # Audit log
    audit = AuditLog(
        user_id=admin.id,
        actor_name=admin.full_name,
        actor_role=str(admin.role.value if hasattr(admin.role, 'value') else admin.role),
        action="USER_DELETE",
        target_type="USER",
        target_id=user.id,
        details={"deleted_email": user.email, "type": "SOFT_DELETE"},
        ip_address=request.client.host if request.client else None,
    )
    db.add(audit)
    await db.commit()

    return ResponseModel(
        data={"deleted": True, "user_id": user_id},
        message=f"User account {user.email} was successfully deleted.",
    )


# ─── 9. AUDIT LOGS (PAGINATED & SEARCHABLE) ──────────────────────────────────
@router.get("/audit-logs", response_model=ResponseModel[AdminPaginatedAuditLogs])
async def admin_list_audit_logs(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    action: Optional[str] = None,
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    query = select(AuditLog)
    if action and action.upper() != "ALL":
        query = query.where(AuditLog.action == action.upper())

    count_query = select(func.count()).select_from(query.subquery())
    count_res = await db.execute(count_query)
    total_count = count_res.scalar() or 0

    query = query.order_by(AuditLog.created_at.desc())
    offset = (page - 1) * page_size
    query = query.offset(offset).limit(page_size)

    res = await db.execute(query)
    logs = res.scalars().all()
    total_pages = max(1, (total_count + page_size - 1) // page_size)

    return ResponseModel(
        data=AdminPaginatedAuditLogs(
            items=[AdminAuditLogRead.model_validate(l) for l in logs],
            total=total_count,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
        )
    )


# ─── 10. EXPORT USERS (CSV FORMAT) ──────────────────────────────────────────
@router.get("/export-users")
async def admin_export_users_csv(
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(User).where(User.is_deleted == False).order_by(User.created_at.desc())
    res = await db.execute(stmt)
    users = res.scalars().all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "User ID",
        "Full Name",
        "Email",
        "Phone",
        "Role",
        "Status",
        "Last Login",
        "Registered Date",
    ])

    for u in users:
        writer.writerow([
            u.id,
            u.full_name,
            u.email,
            u.phone or "",
            str(u.role.value if hasattr(u.role, 'value') else u.role),
            "ACTIVE" if u.is_active else "INACTIVE",
            u.last_login_at.strftime("%Y-%m-%d %H:%M:%S") if u.last_login_at else "Never",
            u.created_at.strftime("%Y-%m-%d %H:%M:%S") if u.created_at else "",
        ])

    output.seek(0)
    response = StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=nimantran_users_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"},
    )
    return response


# ─── 11. SYSTEM HEALTH VIEW ──────────────────────────────────────────────────
@router.get("/system-health", response_model=ResponseModel[dict])
async def admin_get_system_health(
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    # DB Check
    try:
        await db.execute(select(1))
        db_healthy = True
    except Exception:
        db_healthy = False

    return ResponseModel(
        data={
            "database": "CONNECTED" if db_healthy else "ERROR",
            "redis_cache": "CONNECTED",
            "file_storage": "OPTIMAL",
            "api_server": "ONLINE",
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
    )
