import os
import mimetypes
import tornado.web


class AttachmentHandler(tornado.web.RequestHandler):
    def initialize(self, settings_service, recipient_service, base_dir):
        self.settings_service = settings_service
        self.recipient_service = recipient_service
        self.base_dir = base_dir

    async def get(self, campaign_id, recipient_index_str):
        try:
            recipient_index = int(recipient_index_str)
        except ValueError:
            raise tornado.web.HTTPError(400, "Invalid recipient index")

        recipients = await self.recipient_service.get_recipients(campaign_id)
        if not (0 <= recipient_index < len(recipients)):
            raise tornado.web.HTTPError(404, "Recipient not found")

        recipient = recipients[recipient_index]
        attachment_files_str = str(recipient.get("AttachmentFile", "")).strip()

        if not attachment_files_str:
            raise tornado.web.HTTPError(
                404, "Attachment filename not specified for this recipient"
            )

        available_files = [
            f.strip() for f in attachment_files_str.split(";") if f.strip()
        ]

        requested_file = self.get_argument("file", None)

        if requested_file:
            if requested_file not in available_files:
                raise tornado.web.HTTPError(
                    403, "Requested file is not associated with this recipient"
                )
            filename = requested_file
        else:
            if not available_files:
                raise tornado.web.HTTPError(404, "No valid attachments found")
            filename = available_files[0]

        config = await self.settings_service.get_config()
        attachment_folder = config.get("attachment_folder", "attachments")

        if ".." in filename or filename.startswith("/"):
            raise tornado.web.HTTPError(403, "Forbidden")

        file_path = os.path.join(self.base_dir, attachment_folder, filename)

        if not os.path.exists(file_path) or not os.path.isfile(file_path):
            raise tornado.web.HTTPError(404, "File not found on server")

        content_type, _ = mimetypes.guess_type(file_path)
        self.set_header("Content-Type", content_type or "application/octet-stream")
        self.set_header(
            "Content-Disposition", f'inline; filename="{os.path.basename(filename)}"'
        )

        with open(file_path, "rb") as f:
            self.write(f.read())
