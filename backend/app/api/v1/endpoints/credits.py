from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.deps import get_db, get_current_user
from app.schemas.common import ResponseModel
from app.schemas.credit import CreditWalletRead, TransactionRead, PurchaseCreditRequest
from app.services.credit_service import CreditService
from app.models.credit import CreditWallet, CreditTransaction, TransactionType
from app.models.user import User

router = APIRouter()


@router.get("", response_model=ResponseModel[CreditWalletRead])
async def get_credit_wallet(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    wallet = await CreditService.get_or_create_wallet(db, current_user.id)
    return ResponseModel(data=CreditWalletRead.model_validate(wallet))


@router.get("/transactions", response_model=ResponseModel[List[TransactionRead]])
async def get_credit_transactions(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    wallet = await CreditService.get_or_create_wallet(db, current_user.id)
    stmt = (
        select(CreditTransaction)
        .where(CreditTransaction.wallet_id == wallet.id)
        .order_by(CreditTransaction.created_at.desc())
    )
    res = await db.execute(stmt)
    txs = res.scalars().all()
    return ResponseModel(data=[TransactionRead.model_validate(tx) for tx in txs])


@router.post("/purchase", response_model=ResponseModel[CreditWalletRead])
async def purchase_credits(
    data: PurchaseCreditRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    packages = {
        "500_CREDITS": (500, "Purchased 500 AI Credits (₹99)"),
        "2000_CREDITS": (2000, "Purchased 2,000 AI Credits (₹299)"),
        "5000_CREDITS": (5000, "Purchased 5,000 AI Credits (₹599)"),
    }
    if data.package_code not in packages:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid credit package code")

    amount, desc = packages[data.package_code]
    wallet = await CreditService.grant_credits(
        db, current_user.id, amount, desc, TransactionType.PURCHASE
    )
    return ResponseModel(data=CreditWalletRead.model_validate(wallet), message=f"Successfully added {amount} AI credits!")
