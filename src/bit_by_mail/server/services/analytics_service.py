import aiosqlite
from datetime import datetime, timezone

class AnalyticsService:
    def __init__(self, db_path):
        self.db_path = db_path

    async def log_event(self, campaign_id, recipient_email, event_type, event_data=""):
        created_at = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
        async with aiosqlite.connect(self.db_path) as db:
            await db.execute("INSERT INTO campaign_events (campaign_id, recipient_email, event_type, event_data, created_at) VALUES (?, ?, ?, ?, ?)", (campaign_id, recipient_email, event_type, event_data, created_at))
            await db.commit()

    async def get_campaign_analytics(self, campaign_id):
        async with aiosqlite.connect(self.db_path) as db:
            db.row_factory = aiosqlite.Row
            async with db.execute("SELECT event_type, COUNT(*) as count FROM campaign_events WHERE campaign_id = ? GROUP BY event_type", (campaign_id,)) as cursor:
                rows = await cursor.fetchall()
                return {r["event_type"]: r["count"] for r in rows}

    async def get_campaign_events(self, campaign_id):
        async with aiosqlite.connect(self.db_path) as db:
            db.row_factory = aiosqlite.Row
            async with db.execute("SELECT * FROM campaign_events WHERE campaign_id = ? ORDER BY created_at DESC", (campaign_id,)) as cursor:
                rows = await cursor.fetchall()
                return [dict(r) for r in rows]
