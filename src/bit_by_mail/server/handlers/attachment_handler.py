import os
import mimetypes
import tornado.web


class AttachmentHandler(tornado.web.RequestHandler):
    def initialize(self, settings_service, base_dir):
        self.settings_service = settings_service
        self.base_dir = base_dir

    async def get(self, filename):
        config = await self.settings_service.get_config()
        attachment_folder = config.get("attachment_folder", "attachments")

        if ".." in filename or filename.startswith("/"):
            raise tornado.web.HTTPError(403, "Forbidden")

        file_path = os.path.join(self.base_dir, attachment_folder, filename)

        if not os.path.exists(file_path) or not os.path.isfile(file_path):
            raise tornado.web.HTTPError(404, "File not found")

        content_type, _ = mimetypes.guess_type(file_path)
        self.set_header("Content-Type", content_type or "application/octet-stream")
        self.set_header(
            "Content-Disposition", f'inline; filename="{os.path.basename(filename)}"'
        )

        with open(file_path, "rb") as f:
            self.write(f.read())
