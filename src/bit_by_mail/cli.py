import asyncio
import signal
import os
import sys
import logging
from .server.server import make_app

def main():
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(message)s"
    )
    logging.getLogger("tornado.access").setLevel(logging.WARNING)

    app = make_app()

    base_dir = os.path.dirname(os.path.abspath(__file__))
    static_path = os.path.join(base_dir, "frontend", "dist")

    if not os.path.exists(os.path.join(static_path, "index.html")):
        logging.error(f"Static web assets not found at {static_path}. Build the frontend first.")
        sys.exit(1)

    port = 8888
    app.listen(port)
    logging.info(f"Server started in production mode on port {port}")
    loop = asyncio.get_event_loop()

    def shutdown_handler():
        logging.info("Shutdown signal received")
        mailer_service = app.settings.get("mailer_service")
        if mailer_service:
            mailer_service.stop()
        if loop.is_running():
            loop.stop()

    for sig in (signal.SIGINT, signal.SIGTERM):
        loop.add_signal_handler(sig, shutdown_handler)

    try:
        loop.run_forever()
    except KeyboardInterrupt:
        pass
    finally:
        tasks = asyncio.all_tasks(loop=loop)
        for task in tasks:
            task.cancel()

        async def gather_cancelled():
            await asyncio.gather(*tasks, return_exceptions=True)

        if tasks:
            loop.run_until_complete(gather_cancelled())

        loop.close()
        logging.info("Server shutdown complete")

if __name__ == "__main__":
    main()
