# bit-by-mail

A simple, self-hosted bulk mailing application with a web-based UI for sending personalized emails with attachments.

## Prerequisites

- Python 3.9+
- Node.js 16+ and npm

## Setup and Installation

1.  **Create the environment file:**
    Copy the example environment file:

    ```bash
    cp .env.example .env
    ```

1.  **Generate a Secret Key:**
    Run the following command to generate a secure encryption key:

    ```bash
    python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
    ```

    Copy the output and paste it into your `.env` file as the value for `SECRET_KEY`.

    ```
    # .env
    SECRET_KEY=your-generated-key-here
    ```

1.  **Install dependencies:**
    This command will set up a Python virtual environment, install backend dependencies, and install frontend dependencies.
    ```bash
    make install
    ```

## Running the Application

### Production Mode

This command will first build the frontend assets and then start the backend server.

```bash
make run
```

The application will be available at `http://localhost:8888`.

### Development Mode

To run the frontend and backend servers separately for development with hot-reloading:

1.  **Start the backend server:**

    ```bash
    . venv/bin/activate
    python run.py
    ```

2.  **In a new terminal, start the frontend dev server:**
    ```bash
    cd frontend
    npm run dev
    ```
    The frontend will be available at `http://localhost:3000` and will proxy WebSocket requests to the backend server running on port `8888`.

## Configuration

All configuration is done through the web UI after starting the application.

1.  Click the **Settings** button.
2.  Fill in your SMTP server details, sender email, and password.
3.  Specify the path to the folder containing your attachments (e.g., `attachments/`).
4.  Save the configuration.

## Recipient Data Format

Your `recipients.csv` file should have the following columns. You can upload this file via the UI.

- `Name`: The recipient's name.
- `Email`: The recipient's email address.
- `AttachmentFile`: The filename of the attachment for this recipient (must exist in your configured attachment folder).
- `Status`: The initial status, typically `PENDING`.

Any other columns you add can be used as placeholders in your email template (e.g., a column named `EventName` can be used as `{EventName}`).
