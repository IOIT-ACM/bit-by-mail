import os
import mimetypes
import tornado.web

class AttachmentHandler(tornado.web.RequestHandler):
    def initialize(self, campaign_service, recipient_service):
        self.campaign_service = campaign_service
        self.recipient_service = recipient_service

    async def get(self, campaign_id, recipient_index_str):
        try:
            recipient_index = int(recipient_index_str)
        except ValueError:
            raise tornado.web.HTTPError(400)
        recipients = await self.recipient_service.get_recipients(campaign_id)
        if not (0 <= recipient_index < len(recipients)):
            raise tornado.web.HTTPError(404)
        recipient = recipients[recipient_index]
        files = [f.strip() for f in str(recipient.get("AttachmentFile", "")).split(";") if f.strip()]
        req_file = self.get_argument("file", None)
        filename = req_file if req_file and req_file in files else (files[0] if files else None)
        if not filename:
            raise tornado.web.HTTPError(404)
        campaigns = await self.campaign_service.get_campaigns()
        campaign = next((c for c in campaigns if c["id"] == campaign_id), {})
        path = os.path.join(campaign.get("attachment_folder", ""), os.path.basename(filename))
        if not os.path.exists(path):
            raise tornado.web.HTTPError(404)
        content_type, _ = mimetypes.guess_type(path)
        self.set_header("Content-Type", content_type or "application/octet-stream")
        self.set_header("Content-Disposition", f'inline; filename="{os.path.basename(filename)}"')
        with open(path, "rb") as f:
            self.write(f.read())
