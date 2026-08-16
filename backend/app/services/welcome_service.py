import json
import logging
from typing import Dict, List
from fastapi import WebSocket

logger = logging.getLogger("nimantran_ai")


class WelcomeConnectionManager:
    """Manages active WebSockets for Smart Welcome Screen display per event."""
    def __init__(self):
        # event_id -> List[WebSocket]
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, event_id: str, websocket: WebSocket):
        await websocket.accept()
        if event_id not in self.active_connections:
            self.active_connections[event_id] = []
        self.active_connections[event_id].append(websocket)
        logger.info(f"WebSocket connected for Welcome Screen (Event: {event_id})")

    def disconnect(self, event_id: str, websocket: WebSocket):
        if event_id in self.active_connections:
            if websocket in self.active_connections[event_id]:
                self.active_connections[event_id].remove(websocket)
            if not self.active_connections[event_id]:
                del self.active_connections[event_id]

    async def broadcast_checkin(self, event_id: str, payload: dict):
        """Broadcast real-time checkin payload to all connected TV/LED welcome screens for this event."""
        if event_id in self.active_connections:
            disconnected = []
            for ws in self.active_connections[event_id]:
                try:
                    await ws.send_text(json.dumps(payload))
                except Exception as e:
                    logger.warning(f"Error sending WebSocket message: {e}")
                    disconnected.append(ws)
            for ws in disconnected:
                self.disconnect(event_id, ws)


welcome_manager = WelcomeConnectionManager()
