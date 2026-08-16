from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.credit import CreditWallet, CreditTransaction, TransactionType, AIUsage


class CreditService:
    @staticmethod
    async def get_or_create_wallet(db: AsyncSession, user_id: str) -> CreditWallet:
        stmt = select(CreditWallet).where(CreditWallet.user_id == user_id)
        res = await db.execute(stmt)
        wallet = res.scalars().first()
        if not wallet:
            wallet = CreditWallet(user_id=user_id, balance=50)
            db.add(wallet)
            await db.flush()
        return wallet

    @staticmethod
    async def deduct_credits(
        db: AsyncSession,
        user_id: str,
        amount: int,
        description: str,
        transaction_type: TransactionType = TransactionType.CONSUMPTION,
        reference_id: str = None,
    ) -> CreditWallet:
        wallet = await CreditService.get_or_create_wallet(db, user_id)
        if wallet.balance < amount:
            raise ValueError(f"Insufficient AI credits. Required: {amount}, Available: {wallet.balance}")

        wallet.balance -= amount
        tx = CreditTransaction(
            wallet_id=wallet.id,
            user_id=user_id,
            amount=-amount,
            transaction_type=transaction_type,
            balance_after=wallet.balance,
            description=description,
            reference_id=reference_id,
        )
        db.add(tx)
        await db.commit()
        await db.refresh(wallet)
        return wallet

    @staticmethod
    async def grant_credits(
        db: AsyncSession,
        user_id: str,
        amount: int,
        description: str,
        transaction_type: TransactionType = TransactionType.PURCHASE,
        reference_id: str = None,
    ) -> CreditWallet:
        wallet = await CreditService.get_or_create_wallet(db, user_id)
        wallet.balance += amount
        tx = CreditTransaction(
            wallet_id=wallet.id,
            user_id=user_id,
            amount=amount,
            transaction_type=transaction_type,
            balance_after=wallet.balance,
            description=description,
            reference_id=reference_id,
        )
        db.add(tx)
        await db.commit()
        await db.refresh(wallet)
        return wallet
