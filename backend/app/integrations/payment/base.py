from abc import ABC, abstractmethod
from typing import Dict, Any


class PaymentProvider(ABC):
    @abstractmethod
    async def create_order(
        self, amount_inr: float, currency: str = "INR", receipt: str = ""
    ) -> Dict[str, Any]:
        """Create payment order."""
        pass

    @abstractmethod
    async def verify_signature(
        self, order_id: str, payment_id: str, signature: str
    ) -> bool:
        """Verify provider signature for webhook/callback security."""
        pass
