import asyncio
import os
import sys
from cryptography.fernet import Fernet
from src.bit_by_mail.server.server import make_app


def setup_environment():
    data_dir = os.path.join(os.getcwd(), "data")
    key_path = os.path.join(data_dir, "fernet.key")
    secret_key = None

    try:
        os.makedirs(data_dir, exist_ok=True)

        if os.path.exists(key_path):
            with open(key_path, "r") as f:
                secret_key = f.read().strip()

        if not secret_key:
            print("Secret key not found. Generating a new one...")
            secret_key = Fernet.generate_key().decode()
            with open(key_path, "w") as f:
                f.write(secret_key)
            print(f"New secret key saved to {key_path}")

    except IOError as e:
        print(f"FATAL: Could not read/write secret key: {e}", file=sys.stderr)
        sys.exit(1)

    os.environ["SECRET_KEY"] = secret_key


def main():
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
