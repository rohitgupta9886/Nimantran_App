from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel
from app.models.credit import TransactionType


class CreditWalletRead(BaseModel):
    id: str
    user_id: str
    balance: int
    updated_at: datetime

    class Config:
        from_attributes = True


class TransactionRead(BaseModel):
    id: str
    amount: int
    transaction_type: TransactionType
    balance_after: int
    description: str
    created_at: datetime

    class Config:
        from_attributes = True


class PurchaseCreditRequest(BaseModel):
    package_code: str  # 500_CREDITS, 2000_CREDITS, 5000_CREDITS
