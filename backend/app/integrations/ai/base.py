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

    @abstractmethod
    async def generate_structured_invitation(
        self,
        event_type: str,
        host_name: str,
        venue: str,
        date_str: str = "",
        tone: str = "EMOTIONAL",
        language: str = "HI_EN",
        style: str = "Traditional Indian",
        extra_context: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """Generate a complete structured invitation payload."""
        pass

    @abstractmethod
    async def improve_or_rewrite_invitation(
        self,
        original_text: str,
        instruction: str,
        target_tone: Optional[str] = None,
        target_language: Optional[str] = None,
    ) -> Dict[str, str]:
        """Rewrite or improve invitation text according to specific tone or language instructions."""
        pass

    @abstractmethod
    async def chat_invitation_assistant(
        self,
        messages: list,
        context: Optional[Dict[str, Any]] = None,
    ) -> str:
        """Provide interactive conversational assistance for invitation creation and refinement."""
        pass

    @abstractmethod
    async def generate_personalized_guest_invitation(
        self,
        guest_name: str,
        event_title: str,
        host_name: str,
        venue: str,
        date_str: str,
        invitation_link: str,
        relationship: str = "",
        tone: str = "WARM",
        language: str = "HI_EN",
    ) -> str:
        """Generate culturally tailored personal message for a guest."""
        pass


