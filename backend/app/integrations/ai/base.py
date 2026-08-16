from abc import ABC, abstractmethod
from typing import Dict, Any, Optional


class AIProvider(ABC):
    @abstractmethod
    async def generate_invitation_wording(
        self, event_type: str, host_name: str, venue: str, tone: str = "EMOTIONAL", language: str = "HI_EN"
    ) -> Dict[str, str]:
        """Generate structured invitation wording in multiple tones and languages."""
        pass

    @abstractmethod
    async def generate_welcome_quote(
        self, guest_name: str, relationship: str, event_type: str, tone: str = "WARM"
    ) -> str:
        """Generate personalized guest welcome quote for smart welcome screen."""
        pass

    @abstractmethod
    async def generate_our_story(
        self, prompt_info: str, style: str = "ROMANTIC"
    ) -> Dict[str, Any]:
        """Generate story timeline based on user inputs."""
        pass

    @abstractmethod
    async def generate_thank_you_message(
        self, guest_name: str, relationship: str, language: str = "HI"
    ) -> str:
        """Generate personalized post-event thank you message."""
        pass

    @abstractmethod
    async def analyze_guest_duplicates(
        self, guest_list: list
    ) -> list:
        """Analyze guest list and return suspected duplicate pairs."""
        pass

    @abstractmethod
    async def generate_ai_card_on_the_fly(
        self, event_type: str, title: str, host_name: str, venue: str, date_str: str
    ) -> Dict[str, Any]:
        """Generate structured AI invitation card design and wording on the fly."""
        pass

