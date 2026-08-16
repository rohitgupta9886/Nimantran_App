from fastapi import APIRouter
from app.api.v1.endpoints import (
    auth,
    events,
    guests,
    qr_pass,
    welcome,
    public,
    credits,
    admin,
    master_contacts,
    campaigns,
    whatsapp_campaigns,
    webhooks,
)

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(events.router, prefix="/events", tags=["Events"])
api_router.include_router(campaigns.router, tags=["Broadcasting & Multi-Channel Messaging"])
api_router.include_router(guests.router, tags=["Guests"])
api_router.include_router(master_contacts.router, tags=["Master Contacts"])
api_router.include_router(whatsapp_campaigns.router, tags=["WhatsApp Broadcast Campaigns"])
api_router.include_router(webhooks.router, tags=["Meta WhatsApp Webhooks"])
api_router.include_router(qr_pass.router, tags=["QR Scanner & Pass"])
api_router.include_router(welcome.router, tags=["Welcome Screen WebSocket"])
api_router.include_router(public.router, prefix="/public", tags=["Public Permanent Link"])
api_router.include_router(credits.router, prefix="/credits", tags=["AI Credits & Ledger"])
api_router.include_router(admin.router, prefix="/admin", tags=["Admin Panel"])

