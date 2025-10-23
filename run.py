import asyncio
import signal
import os
import sys
from server.server import make_app

from dotenv import load_dotenv

load_dotenv()


def main():
    if not os.environ.get("SECRET_KEY"):
        print("\n--- FATAL ERROR ---")
        print("The 'SECRET_KEY' environment variable is not set.")
        print("This key is required for encrypting and decrypting credentials.")
        print("Please set it before running the application.")
        print("-------------------\n")
        sys.exit(1)

    app = make_app()

    static_path = app.settings.get("static_path") or ""
    index_html_path = os.path.join(static_path, "index.html")
    if not os.path.exists(index_html_path):
        print("\n--- ERROR ---")
        print(
            "Frontend has not been built. The 'frontend/dist/index.html' file is missing."
        )
        print("Please run 'make build' before running the server in production mode.")
        print("For development, use the 'make dev' command.")
        print("-------------\n")
        sys.exit(1)

    port = 8888
    app.listen(port)
    print(f"Server is running on http://localhost:{port}")

    loop = asyncio.get_event_loop()

    def shutdown_handler():
        print("Shutting down server...")
        mailer_service = app.settings.get("mailer_service")
        if mailer_service:
            mailer_service.stop()
        loop.stop()

    signal.signal(signal.SIGINT, lambda sig, frame: shutdown_handler())
    signal.signal(signal.SIGTERM, lambda sig, frame: shutdown_handler())

    try:
        loop.run_forever()
    except KeyboardInterrupt:
        pass
    finally:
        shutdown_handler()


if __name__ == "__main__":
    main()
