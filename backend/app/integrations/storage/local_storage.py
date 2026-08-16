import os
import uuid
import aiofiles
from app.core.config import settings
from app.integrations.storage.base import StorageProvider


class LocalStorageProvider(StorageProvider):
    def __init__(self):
        self.upload_dir = settings.LOCAL_STORAGE_DIR
        os.makedirs(self.upload_dir, exist_ok=True)

    async def upload_file(
        self, file_bytes: bytes, filename: str, content_type: str = "image/jpeg"
    ) -> str:
        ext = os.path.splitext(filename)[1] or ".jpg"
        unique_name = f"{uuid.uuid4().hex}{ext}"
        target_path = os.path.join(self.upload_dir, unique_name)
        
        async with aiofiles.open(target_path, "wb") as f:
            await f.write(file_bytes)
            
        return f"{settings.PUBLIC_BASE_URL}/uploads/{unique_name}"

    async def delete_file(self, file_url: str) -> bool:
        filename = os.path.basename(file_url)
        target_path = os.path.join(self.upload_dir, filename)
        if os.path.exists(target_path):
            os.remove(target_path)
            return True
        return False
