import asyncio
import signal
import os
import sys
import json
from cryptography.fernet import Fernet
from .server.server import make_app


def main():
    settings_path = os.path.join(os.getcwd(), "settings.json")
    secret_key = None
    settings_data = {}

    if os.path.exists(settings_path):
        try:
            with open(settings_path, "r") as f:
                settings_data = json.load(f)
                secret_key = settings_data.get("SECRET_KEY")
        except (json.JSONDecodeError, IOError):
            settings_data = {}

    if not secret_key:
        secret_key = Fernet.generate_key().decode()
        settings_data["SECRET_KEY"] = secret_key
        try:
            with open(settings_path, "w") as f:
                json.dump(settings_data, f, indent=2)
        except IOError as e:
            print(f"\n--- FATAL ERROR ---")
            print(f"Could not write to settings.json: {e}")
            print("Please check file permissions.")
            print("-------------------\n")
            sys.exit(1)

    os.environ["SECRET_KEY"] = secret_key

    if not os.environ.get("SECRET_KEY"):
        print("\n--- FATAL ERROR ---")
        print("The 'SECRET_KEY' could not be configured.")
        print("Please ensure settings.json is writable.")
        print("-------------------\n")
        sys.exit(1)

    app = make_app()

    static_path = app.settings.get("static_path")
    if not static_path or not os.path.exists(os.path.join(static_path, "index.html")):
        print("\n--- ERROR ---")
        print("Frontend assets are missing from the package.")
        print("This is an installation issue. Please try reinstalling the package.")
        print("If developing, ensure you have run the build process correctly.")
        print("-------------\n")
        sys.exit(1)

    port = 8888
    app.listen(port)
    print(f"Server is running on http://localhost:{port}")
    print("Access the application in your browser.")

    loop = asyncio.get_event_loop()

    def shutdown_handler():
        print("Shutting down server...")
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
        print("Server shut down gracefully.")


if __name__ == "__main__":
    main()
