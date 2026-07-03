import asyncio
import logging
from src.bit_by_mail.server.server import make_app


def main():
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(message)s"
    )
    logging.getLogger("tornado.access").setLevel(logging.WARNING)

    app = make_app()
    app.settings["debug"] = True

    port = 8888
    app.listen(port)

    logging.info(f"Server started in development mode on port {port}")
    try:
        asyncio.get_event_loop().run_forever()
    except KeyboardInterrupt:
        logging.info("Server shutting down")

if __name__ == "__main__":
    main()
