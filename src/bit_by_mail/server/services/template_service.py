import aiosqlite

class TemplateService:
    def __init__(self, db_path):
        self.db_path = db_path

    async def get_template(self, campaign_id):
        async with aiosqlite.connect(self.db_path) as db:
            async with db.execute("SELECT body FROM campaigns WHERE id = ?", (campaign_id,)) as cursor:
                row = await cursor.fetchone()
                return row[0] if row and row[0] else ""

    async def save_template(self, campaign_id, content):
        async with aiosqlite.connect(self.db_path) as db:
            await db.execute("UPDATE campaigns SET body = ? WHERE id = ?", (content, campaign_id))
            await db.commit()
