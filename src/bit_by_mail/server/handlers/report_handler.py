import tornado.web
import aiosqlite
import csv
import io

class ReportHandler(tornado.web.RequestHandler):
    def initialize(self, db_path):
        self.db_path = db_path

    async def get(self, campaign_id, filename):
        async with aiosqlite.connect(self.db_path) as db:
            db.row_factory = aiosqlite.Row
            async with db.execute("SELECT name as Name, email as Email, attachment_file as AttachmentFile, status as Status, sent_timestamp as SentTimestamp FROM campaign_recipients WHERE campaign_id = ?", (campaign_id,)) as cursor:
                rows = await cursor.fetchall()
                if not rows:
                    raise tornado.web.HTTPError(404)
                output = io.StringIO()
                writer = csv.DictWriter(output, fieldnames=["Name", "Email", "AttachmentFile", "Status", "SentTimestamp"])
                writer.writeheader()
                for r in rows:
                    writer.writerow(dict(r))
                self.set_header("Content-Type", "text/csv")
                self.set_header("Content-Disposition", f'attachment; filename="report_{campaign_id}.csv"')
                self.write(output.getvalue())
