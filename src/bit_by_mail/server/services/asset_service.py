import uuid
import re
from datetime import datetime, timezone
import aiosqlite

class AssetService:
    def __init__(self, db_path):
        self.db_path = db_path

    async def get_assets(self):
        async with aiosqlite.connect(self.db_path) as db:
            db.row_factory = aiosqlite.Row
            async with db.execute("SELECT * FROM assets ORDER BY created_at DESC") as cursor:
                rows = await cursor.fetchall()
                return [{"id": r["id"], "name": r["name"], "url": r["url"], "is_gdrive": bool(r["is_gdrive"]), "createdAt": r["created_at"]} for r in rows]

    async def create_asset(self, name, url, is_gdrive):
        if is_gdrive:
            match = re.search(r'(?:id=|/d/)([a-zA-Z0-9_-]+)', url)
            if match:
                url = f"https://drive.google.com/thumbnail?id={match.group(1)}&sz=w800"
        new_id = str(uuid.uuid4())
        created_at = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
        async with aiosqlite.connect(self.db_path) as db:
            await db.execute("INSERT INTO assets (id, name, url, is_gdrive, created_at) VALUES (?, ?, ?, ?, ?)", (new_id, name, url, is_gdrive, created_at))
            await db.commit()
        return await self.get_assets()

    async def delete_assets(self, asset_ids):
        async with aiosqlite.connect(self.db_path) as db:
            query = f"DELETE FROM assets WHERE id IN ({','.join('?' * len(asset_ids))})"
            await db.execute(query, asset_ids)
            await db.commit()
        return await self.get_assets()

    async def update_asset(self, asset_id, updates):
        async with aiosqlite.connect(self.db_path) as db:
            for k, v in updates.items():
                if k in ["name", "url"]:
                    await db.execute(f"UPDATE assets SET {k} = ? WHERE id = ?", (v, asset_id))
            await db.commit()
        return await self.get_assets()
