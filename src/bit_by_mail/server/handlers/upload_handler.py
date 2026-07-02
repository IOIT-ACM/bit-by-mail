import tornado.web
import base64
from urllib.parse import urlparse

class BaseUploadHandler(tornado.web.RequestHandler):
    def set_default_headers(self):
        origin = self.request.headers.get("Origin", "")
        if origin:
            parsed = urlparse(origin)
            if parsed.netloc.startswith("localhost") or parsed.netloc.startswith("127.0.0.1"):
                self.set_header("Access-Control-Allow-Origin", origin)
                self.set_header("Access-Control-Allow-Methods", "POST, GET, OPTIONS")
                self.set_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
                self.set_header("Access-Control-Allow-Credentials", "true")

    def options(self, *args, **kwargs):
        self.set_status(204)
        self.finish()

    def check_origin(self, origin):
        parsed_origin = urlparse(origin)
        origin_host = parsed_origin.netloc.lower()
        if origin_host.startswith("localhost") or origin_host.startswith("127.0.0.1"):
            return True
        return False

class RecipientUploadHandler(BaseUploadHandler):
    def initialize(self, recipient_service):
        self.recipient_service = recipient_service

    async def post(self, campaign_id):
        if not self.request.files or "file" not in self.request.files:
            raise tornado.web.HTTPError(400, "No file uploaded")

        fileinfo = self.request.files["file"][0]
        b64_content = base64.b64encode(fileinfo["body"]).decode("utf-8")

        await self.recipient_service.save_recipients_from_base64(campaign_id, b64_content)
        recipients = await self.recipient_service.get_recipients(campaign_id)

        self.write({"recipients": recipients})

class DatabaseUploadHandler(BaseUploadHandler):
    def initialize(self, database_service):
        self.database_service = database_service

    async def post(self, db_id):
        mode = self.get_argument("mode", "replace")
        if not self.request.files or "file" not in self.request.files:
            raise tornado.web.HTTPError(400, "No file uploaded")

        fileinfo = self.request.files["file"][0]
        b64_content = base64.b64encode(fileinfo["body"]).decode("utf-8")

        await self.database_service.import_csv_to_database(db_id, b64_content, mode)
        recipients = await self.database_service.get_database_data(db_id)

        self.write({"recipients": recipients})
