import uuid
from typing import Dict, Any
from app.integrations.payment.base import PaymentProvider


class MockPaymentProvider(PaymentProvider):
    async def create_order(
        self, amount_inr: float, currency: str = "INR", receipt: str = ""
    ) -> Dict[str, Any]:
        order_id = f"order_MOCK_{uuid.uuid4().hex[:12]}"
        return {
            "order_id": order_id,
            "amount": int(amount_inr * 100),  # in paise
            "currency": currency,
            "receipt": receipt or order_id,
            "status": "created",
            "mock": True,
        }

    async def verify_signature(
        self, order_id: str, payment_id: str, signature: str
    ) -> bool:
        # In mock mode, allow any validly formatted signature or non-empty string
        return len(signature) > 0
