import asyncio
import os
import sys
import json
from cryptography.fernet import Fernet
from src.bit_by_mail.server.server import make_app


def setup_environment():
    """
    Ensures the SECRET_KEY is set, which is required by the crypto_service.
    This logic is borrowed from your cli.py for consistency.
    """
    settings_path = os.path.join(os.getcwd(), "settings.json")
    settings_data = {}
    secret_key = None

    if os.path.exists(settings_path):
        try:
            with open(settings_path, "r") as f:
                settings_data = json.load(f)
                secret_key = settings_data.get("SECRET_KEY")
        except (json.JSONDecodeError, IOError):
            settings_data = {}

    if not secret_key:
        print("SECRET_KEY not found in settings.json. Generating a new one...")
        secret_key = Fernet.generate_key().decode()
        settings_data["SECRET_KEY"] = secret_key
        try:
            with open(settings_path, "w") as f:
                json.dump(settings_data, f, indent=2)
            print("New SECRET_KEY saved to settings.json")
        except IOError as e:
            print(f"FATAL: Could not write to settings.json: {e}", file=sys.stderr)
            sys.exit(1)

    os.environ["SECRET_KEY"] = secret_key


def main():
    """
    Development server entry point.
    Enables Tornado's debug mode for auto-reloading on code changes.
    """
    setup_environment()

    app = make_app()

    app.settings["debug"] = True

    port = 8888
    app.listen(port)

    print("====================================================")
    print(f"Backend development server running on http://localhost:{port}")
    print("Tornado auto-reloading is enabled.")
    print("====================================================")

    try:
        asyncio.get_event_loop().run_forever()
    except KeyboardInterrupt:
        print("\nShutting down server.")


if __name__ == "__main__":
    main()
