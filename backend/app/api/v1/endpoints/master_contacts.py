from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.schemas.common import ResponseModel
from app.schemas.master_contact import (
    MasterContactCreate,
    MasterContactUpdate,
    MasterContactRead,
    MasterContactSyncPayload,
    AddFromMasterListPayload,
)
from app.services.master_contact_service import MasterContactService
from app.services.event_service import EventService

router = APIRouter()


@router.get("/master-contacts", response_model=ResponseModel[List[MasterContactRead]])
async def list_master_contacts(
    search: Optional[str] = None,
    group: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve Host's permanent Master Contact List with optional search/group filtering."""
    contacts = await MasterContactService.get_user_contacts(
        db, user_id=current_user.id, search_query=search, group_filter=group
    )
    return ResponseModel(data=[MasterContactRead.model_validate(c) for c in contacts])


@router.post("/master-contacts", response_model=ResponseModel[MasterContactRead])
async def create_master_contact(
    data: MasterContactCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Add a new contact manually to the Host's permanent Master Contact List."""
    contact = await MasterContactService.create_contact(db, user_id=current_user.id, data=data)
    return ResponseModel(
        data=MasterContactRead.model_validate(contact),
        message=f"Contact '{contact.name}' saved to your Master List!",
    )


@router.post("/master-contacts/sync", response_model=ResponseModel[dict])
async def sync_mobile_contacts(
    payload: MasterContactSyncPayload,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Idempotently sync/import mobile phone contacts into the Host's Master List."""
    result = await MasterContactService.sync_contacts(
        db, user_id=current_user.id, contacts_data=payload.contacts
    )
    return ResponseModel(
        data=result,
        message=f"Successfully synced contacts! ({result['added_count']} new added, {result['updated_count']} updated)",
    )


@router.put("/master-contacts/{contact_id}", response_model=ResponseModel[MasterContactRead])
async def update_master_contact(
    contact_id: str,
    data: MasterContactUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Edit details of an existing contact in the Host's Master List."""
    contact = await MasterContactService.update_contact(
        db, user_id=current_user.id, contact_id=contact_id, data=data
    )
    if not contact:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contact not found")
    return ResponseModel(
        data=MasterContactRead.model_validate(contact),
        message="Master contact updated successfully!",
    )


@router.delete("/master-contacts/{contact_id}", response_model=ResponseModel[dict])
async def delete_master_contact(
    contact_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a contact from the Host's Master List. (Historical event guest data remains intact!)"""
    success = await MasterContactService.delete_contact(
        db, user_id=current_user.id, contact_id=contact_id
    )
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contact not found")
    return ResponseModel(
        data={"deleted": True},
        message="Contact removed from your Master List! (Past event records preserved)",
    )


@router.post("/events/{event_id}/guests/from-master-list", response_model=ResponseModel[dict])
async def add_guests_from_master_list(
    event_id: str,
    payload: AddFromMasterListPayload,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Bulk add selected contacts from Host's Master List to a specific event's guest list."""
    event = await EventService.get_event_by_id(db, event_id)
    if not event or event.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")

    result = await MasterContactService.add_contacts_to_event(
        db, user_id=current_user.id, event_id=event_id, contact_ids=payload.contact_ids
    )
    return ResponseModel(
        data=result,
        message=f"Added {result['added_count']} guests from Master List to {event.title}!",
    )
