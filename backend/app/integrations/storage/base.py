from abc import ABC, abstractmethod
from typing import Optional


class StorageProvider(ABC):
    @abstractmethod
    async def upload_file(
        self, file_bytes: bytes, filename: str, content_type: str = "image/jpeg"
    ) -> str:
        """Upload file and return accessible URL."""
        pass

    @abstractmethod
    async def delete_file(self, file_url: str) -> bool:
        """Delete stored file."""
        pass
