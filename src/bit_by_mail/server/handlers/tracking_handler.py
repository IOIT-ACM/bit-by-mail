import tornado.web
import base64
from urllib.parse import unquote

class TrackingHandler(tornado.web.RequestHandler):
    def initialize(self, analytics_service):
        self.analytics_service = analytics_service

class OpenTrackingHandler(TrackingHandler):
    async def get(self, campaign_id, b64_email):
        try:
            email = base64.b64decode(b64_email).decode('utf-8')
            if email.endswith(".gif"):
                email = email[:-4]
            await self.analytics_service.log_event(campaign_id, email, "OPEN", "")
        except Exception:
            pass

        pixel = b'\x47\x49\x46\x38\x39\x61\x01\x00\x01\x00\x80\x00\x00\xff\xff\xff\x00\x00\x00\x21\xf9\x04\x01\x00\x00\x00\x00\x2c\x00\x00\x00\x00\x01\x00\x01\x00\x00\x02\x02\x44\x01\x00\x3b'
        self.set_header("Content-Type", "image/gif")
        self.set_header("Cache-Control", "no-cache, no-store, must-revalidate")
        self.set_header("Pragma", "no-cache")
        self.set_header("Expires", "0")
        self.write(pixel)

class ClickTrackingHandler(TrackingHandler):
    async def get(self, campaign_id, b64_email):
        url = self.get_argument("url", "")
        if not url:
            raise tornado.web.HTTPError(400)
        try:
            email = base64.b64decode(b64_email).decode('utf-8')
            await self.analytics_service.log_event(campaign_id, email, "CLICK", url)
        except Exception:
            pass
        self.redirect(unquote(url))
