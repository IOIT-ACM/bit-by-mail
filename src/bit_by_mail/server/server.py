import os
import tornado.web
import tornado.ioloop
import importlib.resources
from .db import init_db
from .handlers.websocket_handler import WebSocketHandler, WebSocketManager
from .handlers.attachment_handler import AttachmentHandler
from .handlers.report_handler import ReportHandler
from .handlers.upload_handler import RecipientUploadHandler, DatabaseUploadHandler
from .services.settings_service import SettingsService
from .services.recipient_service import RecipientService
from .services.template_service import TemplateService
from .services.mailer_service import MailerService
from .services.preflight_service import PreflightService
from .services.campaign_service import CampaignService
from .services.database_service import DatabaseService
from .services.global_template_service import GlobalTemplateService
from .services.asset_service import AssetService
from .services.analytics_service import AnalyticsService
from .services.seeder_service import SeederService

class SPAStaticFileHandler(tornado.web.StaticFileHandler):
    def validate_absolute_path(self, root, absolute_path):
        try:
            return super().validate_absolute_path(root, absolute_path)
        except tornado.web.HTTPError as e:
            if e.status_code == 404 and self.default_filename:
                return super().validate_absolute_path(root, os.path.join(root, self.default_filename))
            raise

def make_app():
    try:
        static_path = str(importlib.resources.files("bit_by_mail").joinpath("frontend/dist"))
    except AttributeError:
        with importlib.resources.path("bit_by_mail", "") as p:
            static_path = os.path.join(p, "frontend/dist")

    base_dir = os.path.join(os.path.expanduser("~"), ".bit_by_mail")
    data_dir = os.path.join(base_dir, "data")
    os.makedirs(data_dir, exist_ok=True)
    db_path = os.path.join(data_dir, "app.db")
    init_db(db_path)

    settings_service = SettingsService(db_path)
    campaign_service = CampaignService(db_path, base_dir)
    database_service = DatabaseService(db_path)
    global_template_service = GlobalTemplateService(db_path)
    asset_service = AssetService(db_path)
    recipient_service = RecipientService(db_path)
    template_service = TemplateService(db_path)
    analytics_service = AnalyticsService(db_path)
    preflight_service = PreflightService(campaign_service, recipient_service, template_service)
    websocket_manager = WebSocketManager()
    ioloop = tornado.ioloop.IOLoop.current()
    mailer_service = MailerService(template_service, recipient_service, campaign_service, analytics_service, websocket_manager, ioloop, db_path)

    seeder_service = SeederService(db_path, global_template_service, asset_service)
    ioloop.add_callback(seeder_service.seed)

    settings = {
        "static_path": static_path,
        "template_path": static_path,
        "debug": False,
        "settings_service": settings_service,
        "recipient_service": recipient_service,
        "template_service": template_service,
        "mailer_service": mailer_service,
        "preflight_service": preflight_service,
        "campaign_service": campaign_service,
        "database_service": database_service,
        "global_template_service": global_template_service,
        "asset_service": asset_service,
        "analytics_service": analytics_service,
        "websocket_manager": websocket_manager,
        "seeder_service": seeder_service,
    }

    return tornado.web.Application([
        (r"/ws", WebSocketHandler),
        (r"/api/upload/recipients/(.*)", RecipientUploadHandler, {"recipient_service": recipient_service}),
        (r"/api/upload/database/(.*)", DatabaseUploadHandler, {"database_service": database_service}),
        (r"/attachments/(.*)/(.*)", AttachmentHandler, {"campaign_service": campaign_service, "recipient_service": recipient_service}),
        (r"/reports/(.*)/(.*)", ReportHandler, {"db_path": db_path}),
        (r"/(.*)", SPAStaticFileHandler, {"path": static_path, "default_filename": "index.html"}),
    ], **settings)

