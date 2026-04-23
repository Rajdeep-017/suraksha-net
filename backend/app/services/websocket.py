"""
WebSocket manager for real-time push notifications.

Supports:
- Driver connections tracked by session ID
- Zone-specific broadcasts from Admin
- Targeted alerts (zone_entry, weather_warning, sos_nearby)
"""

from datetime import datetime
from fastapi import WebSocket


class ConnectionManager:
    """Manages active WebSocket connections for real-time alerts."""

    def __init__(self):
        # session_id → WebSocket
        self.active_connections: dict[str, WebSocket] = {}
        # In-memory alert log (most recent 100)
        self.alert_log: list[dict] = []

    async def connect(self, session_id: str, websocket: WebSocket):
        await websocket.accept()
        self.active_connections[session_id] = websocket
        print(f"[WS] Driver connected: {session_id} (total: {len(self.active_connections)})")

    def disconnect(self, session_id: str):
        self.active_connections.pop(session_id, None)
        print(f"[WS] Driver disconnected: {session_id} (total: {len(self.active_connections)})")

    async def send_to_driver(self, session_id: str, alert: dict):
        """Send alert to a specific driver."""
        ws = self.active_connections.get(session_id)
        if ws:
            try:
                await ws.send_json(alert)
            except Exception:
                self.disconnect(session_id)

    async def broadcast(self, alert: dict):
        """Send alert to ALL connected drivers."""
        self._log_alert(alert)
        disconnected = []
        for sid, ws in self.active_connections.items():
            try:
                await ws.send_json(alert)
            except Exception:
                disconnected.append(sid)
        for sid in disconnected:
            self.disconnect(sid)

    async def broadcast_zone(self, zone: str, alert: dict):
        """Broadcast to all drivers (zone filtering done client-side for simplicity)."""
        alert["zone"] = zone
        await self.broadcast(alert)

    def _log_alert(self, alert: dict):
        alert["logged_at"] = datetime.now().isoformat()
        self.alert_log.append(alert)
        if len(self.alert_log) > 100:
            self.alert_log = self.alert_log[-100:]

    def get_recent_alerts(self, limit: int = 20) -> list[dict]:
        return self.alert_log[-limit:]

    @property
    def connected_count(self) -> int:
        return len(self.active_connections)


# Singleton instance
manager = ConnectionManager()


def build_alert(
    alert_type: str,
    message: str,
    severity: str = "info",
    zone: str = "",
    data: dict | None = None,
) -> dict:
    """
    Build a standardized alert payload.

    alert_type: zone_entry | weather_warning | admin_broadcast | sos_nearby
    severity: info | warning | critical
    """
    return {
        "type": alert_type,
        "message": message,
        "severity": severity,
        "zone": zone,
        "timestamp": datetime.now().isoformat(),
        "data": data or {},
    }
