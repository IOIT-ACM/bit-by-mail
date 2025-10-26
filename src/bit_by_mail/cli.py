import asyncio
import signal
import os
import sys
from cryptography.fernet import Fernet
from .server.server import make_app


def main():
    data_dir = os.path.join(os.getcwd(), "data")
    key_path = os.path.join(data_dir, "fernet.key")
    secret_key = None

    try:
        os.makedirs(data_dir, exist_ok=True)

        if os.path.exists(key_path):
            with open(key_path, "r") as f:
                secret_key = f.read().strip()

        if not secret_key:
            secret_key = Fernet.generate_key().decode()
            with open(key_path, "w") as f:
                f.write(secret_key)

    except IOError as e:
        print(f"\n--- FATAL ERROR ---")
        print(f"Could not read or write the secret key at: {key_path}")
        print(f"Error: {e}")
        print("Please check file permissions for the 'data' directory.")
        print("-------------------\n")
        sys.exit(1)

    os.environ["SECRET_KEY"] = secret_key

    if not os.environ.get("SECRET_KEY"):
        print("\n--- FATAL ERROR ---")
        print("The 'SECRET_KEY' could not be configured.")
        print("Please ensure the 'data/fernet.key' file is readable.")
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
