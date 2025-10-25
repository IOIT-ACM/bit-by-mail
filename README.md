# bit-by-mail

A simple, self-hosted bulk mailing application.

## Prerequisites

- Python 3.9+
- Node.js 16+ and npm

## Setup

1.  **Install all dependencies:**
    This command sets up the Python virtual environment and installs both backend and frontend dependencies.
    ```bash
    make install
    ```

## Development

For local development with live reloading for both the frontend and backend.

1.  **Start the backend server:**
    In your first terminal, run:

    ```bash
    make dev-backend
    ```

    The backend will be available at `http://localhost:8888`.

2.  **Start the frontend server:**
    In a second terminal, run:
    ```bash
    make dev-frontend
    ```
    This will open the application in your browser at `http://localhost:3000`.

## Production

To build the frontend, create a Python package, and run it like a final user would:

```bash
make run-prod
```

## Configuration

- Initial SMTP and application settings are configured through the web UI after starting the application.

## Application Screenshots

### Dashboard

![Dashboard](docs/dashboard.png)

### Editor

![Editor](docs/editor.png)

### Email Editor

![Email Editor](docs/email_editor.png)

### Email Preview

![Email Preview](docs/email_preview.png)

### Settings

![Settings](docs/settings.png)
