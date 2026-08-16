from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel


class MasterContactCreate(BaseModel):
    name: str
    phone: Optional[str] = None
    email: Optional[str] = None
    group_name: Optional[str] = "General"
    relationship: Optional[str] = None
    notes: Optional[str] = None
    source: str = "MANUAL"  # MANUAL, MOBILE_SYNC, CSV_IMPORT


class MasterContactUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    group_name: Optional[str] = None
    relationship: Optional[str] = None
    notes: Optional[str] = None


class MasterContactRead(BaseModel):
    id: str
    user_id: str
    name: str
    phone: Optional[str] = None
    email: Optional[str] = None
    group_name: Optional[str] = "General"
    relationship: Optional[str] = None
    notes: Optional[str] = None
    source: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class MasterContactSyncPayload(BaseModel):
    contacts: List[MasterContactCreate]


class AddFromMasterListPayload(BaseModel):
    contact_ids: List[str]
