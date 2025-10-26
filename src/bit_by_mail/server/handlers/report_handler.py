import os
import tornado.web


class ReportHandler(tornado.web.RequestHandler):
    def initialize(self, campaign_service):
        self.campaign_service = campaign_service

    async def get(self, campaign_id, filename):
        if ".." in filename or filename.startswith("/"):
            raise tornado.web.HTTPError(403, "Forbidden")

        campaign_path = self.campaign_service.get_campaign_path(campaign_id)
        file_path = os.path.join(campaign_path, filename)

        if not os.path.exists(file_path) or not os.path.isfile(file_path):
            raise tornado.web.HTTPError(404, "File not found")

        self.set_header("Content-Type", "text/csv")
        self.set_header(
            "Content-Disposition",
            f'attachment; filename="{os.path.basename(filename)}"',
        )

        with open(file_path, "rb") as f:
            self.write(f.read())
