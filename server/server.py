import os
import tornado.web
import tornado.ioloop
from .handlers.main_handler import MainHandler
from .handlers.websocket_handler import WebSocketHandler
from .services.config_service import ConfigService
from .services.mailer_service import MailerService
from .services.preflight_service import PreflightService


def make_app():
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    static_path = os.path.join(base_dir, "frontend/dist")

    config_service = ConfigService(base_dir)
    preflight_service = PreflightService(base_dir)
    websocket_manager = set()

    ioloop = tornado.ioloop.IOLoop.current()
    mailer_service = MailerService(config_service, websocket_manager, ioloop)

    settings = {
        "static_path": static_path,
        "template_path": static_path,
        "debug": True,
        "config_service": config_service,
        "mailer_service": mailer_service,
        "preflight_service": preflight_service,
        "websocket_manager": websocket_manager,
    }

    return tornado.web.Application(
        [
            (r"/ws", WebSocketHandler),
            (r"/", MainHandler),
            (
                r"/(.*)",
                tornado.web.StaticFileHandler,
                {"path": static_path, "default_filename": "index.html"},
            ),
        ],
        **settings,
    )
