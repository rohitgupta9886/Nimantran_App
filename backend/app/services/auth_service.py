from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.security import get_password_hash, verify_password, create_access_token, create_refresh_token
from app.models.user import User, UserRole
from app.models.credit import CreditWallet, CreditTransaction, TransactionType
from app.schemas.auth import UserRegister, UserLogin


class AuthService:
    @staticmethod
    async def register_user(db: AsyncSession, data: UserRegister) -> User:
        # Check existing email
        stmt = select(User).where(User.email == data.email)
        res = await db.execute(stmt)
        if res.scalars().first():
            raise ValueError("An account with this email already exists.")

        user = User(
            email=data.email,
            hashed_password=get_password_hash(data.password),
            full_name=data.full_name,
            phone=data.phone,
            role=UserRole.HOST,
        )
        db.add(user)
        await db.flush()

        # Grant initial credit wallet with 100 free credits
        wallet = CreditWallet(user_id=user.id, balance=100)
        db.add(wallet)
        await db.flush()

        tx = CreditTransaction(
            wallet_id=wallet.id,
            user_id=user.id,
            amount=100,
            transaction_type=TransactionType.GRANT,
            balance_after=100,
            description="Welcome bonus AI credits",
        )
        db.add(tx)
        await db.commit()
        await db.refresh(user)
        return user

    @staticmethod
    async def authenticate_user(db: AsyncSession, data: UserLogin) -> User:
        stmt = select(User).where(User.email == data.email)
        res = await db.execute(stmt)
        user = res.scalars().first()

        if not user or not verify_password(data.password, user.hashed_password):
            raise ValueError("Invalid email or password.")
        if not user.is_active:
            raise ValueError("Account is deactivated.")

        return user
