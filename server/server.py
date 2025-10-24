import os
import tornado.web
import tornado.ioloop
from .handlers.websocket_handler import WebSocketHandler, WebSocketManager
from .handlers.attachment_handler import AttachmentHandler
from .services.settings_service import SettingsService
from .services.recipient_service import RecipientService
from .services.template_service import TemplateService
from .services.mailer_service import MailerService
from .services.preflight_service import PreflightService
from .services.campaign_service import CampaignService


def make_app():
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    static_path = os.path.join(base_dir, "frontend/dist")

    settings_service = SettingsService(base_dir)
    campaign_service = CampaignService(base_dir)
    recipient_service = RecipientService(campaign_service)
    template_service = TemplateService(campaign_service)
    preflight_service = PreflightService(base_dir, recipient_service, template_service)
    websocket_manager = WebSocketManager()

    ioloop = tornado.ioloop.IOLoop.current()
    mailer_service = MailerService(
        template_service, recipient_service, websocket_manager, ioloop
    )

    settings = {
        "static_path": static_path,
        "template_path": static_path,
        "debug": os.environ.get("DEBUG") == "1",
        "settings_service": settings_service,
        "recipient_service": recipient_service,
        "template_service": template_service,
        "mailer_service": mailer_service,
        "preflight_service": preflight_service,
        "campaign_service": campaign_service,
        "websocket_manager": websocket_manager,
    }

    return tornado.web.Application(
        [
            (r"/ws", WebSocketHandler),
            (
                r"/attachments/(.*)",
                AttachmentHandler,
                {"settings_service": settings_service, "base_dir": base_dir},
            ),
            (
                r"/(.*)",
                tornado.web.StaticFileHandler,
                {"path": static_path, "default_filename": "index.html"},
            ),
        ],
        **settings,
    )
