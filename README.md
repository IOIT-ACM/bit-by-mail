# bit-by-mail

A simple, self-hosted bulk mailing application with a modern web UI.

## Features

- **Web-Based UI:** Manage campaigns, recipients, and email templates from your browser.
- **Live Preview:** Instantly see how your emails will look with placeholder substitution for each recipient.
- **Preflight Checks:** Validate your configuration, recipient data, and attachments before sending to catch errors early.
- **Live Logging:** Monitor the mailing process in real-time directly in the UI.
- **Self-Hosted:** Your data, your server. Keep your mailing lists and configurations private.

## Installation & Usage

1.  **Install the package from PyPI:**

    ```bash
    pip install bit-by-mail
    ```

2.  **Run the application:**

    ```bash
    bit-by-mail
    ```

3.  **Open your browser:**
    Navigate to `http://localhost:8888` to access the web UI and configure your first campaign.

## Application Screenshots

### Dashboard

![Dashboard](https://raw.githubusercontent.com/IOIT-ACM/bit-by-mail/refs/heads/webclient/docs/dashboard.png)

### Editor

![Editor](https://raw.githubusercontent.com/IOIT-ACM/bit-by-mail/refs/heads/webclient/docs/editor.png)

### Email Editor

![Email Editor](https://raw.githubusercontent.com/IOIT-ACM/bit-by-mail/refs/heads/webclient/docs/email_editor.png)

### Email Preview

![Email Preview](https://raw.githubusercontent.com/IOIT-ACM/bit-by-mail/refs/heads/webclient/docs/email_preview.png)

### Settings

![Settings](https://raw.githubusercontent.com/IOIT-ACM/bit-by-mail/refs/heads/webclient/docs/settings.png)

---

## For Developers

### Development Setup

If you want to contribute to the project, you'll need to set up the development environment.

**Prerequisites:**

- Python 3.9+
- Node.js 20+ and npm

1.  **Clone the repository and install dependencies:**
    This command sets up the Python virtual environment and installs both backend and frontend dependencies.

    ```bash
    git clone https://github.com/IOIT-ACM/bit-by-mail.git
    cd bit-by-mail
    make install
    ```

2.  **Run the development servers:**
    For local development with live reloading, run the frontend and backend servers in separate terminals.

    - **Backend Server:**

      ```bash
      make dev-backend
      ```

      The backend will be available at `http://localhost:8888`.

    - **Frontend Server:**
      ```bash
      make dev-frontend
      ```
      This will open the application in your browser at `http://localhost:3000`, which proxies requests to the backend.

### Building for Production

To build the frontend, create a Python package, and run it like a final user would:

```bash
make run-prod
```

This command is useful for testing the final packaged application locally before publishing.
