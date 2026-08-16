from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from app.services.welcome_service import welcome_manager

router = APIRouter()


@router.websocket("/ws/events/{event_id}/welcome")
async def welcome_screen_websocket(websocket: WebSocket, event_id: str):
    await welcome_manager.connect(event_id, websocket)
    try:
        while True:
            # Keep connection open & listen for client pings/messages
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        welcome_manager.disconnect(event_id, websocket)
