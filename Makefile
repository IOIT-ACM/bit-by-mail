.PHONY: install build-frontend package run-prod dev-backend dev-frontend help

# ==============================================================================
# SETUP
# ==============================================================================
install:
	@echo "Installing backend dependencies for development..."
	@if [ ! -d "venv" ]; then \
		python3 -m venv venv; \
	fi
	. venv/bin/activate && pip install -e .
	@echo "Installing frontend dependencies..."
	cd frontend && npm install

# ==============================================================================
# DEVELOPMENT
# ==============================================================================
dev-backend:
	@echo "Starting backend server in DEVELOPMENT mode (http://localhost:8888)..."
	@echo "Auto-reloading is ON."
	. venv/bin/activate && python run.py

dev-frontend:
	@echo "Starting frontend dev server in DEVELOPMENT mode (http://localhost:3000)..."
	@echo "Hot-reloading is ON."
	cd frontend && npm run dev

# ==============================================================================
# PRODUCTION
# ==============================================================================
build-frontend:
	@echo "Building frontend for production..."
	cd frontend && npm run build

package: build-frontend
	@echo "Preparing assets for packaging..."
	@rm -rf src/bit_by_mail/frontend/dist
	@mkdir -p src/bit_by_mail/frontend
	@cp -r frontend/dist src/bit_by_mail/frontend/
	@echo "Building Python package..."
	@pip install --upgrade build
	@python -m build

run-prod: package
	@echo "Installing the newly built package..."
	. venv/bin/activate && pip install dist/*.whl --force-reinstall
	@echo "Starting backend server in PRODUCTION mode (http://localhost:8888)..."
	. venv/bin/activate && bit-by-mail

# ==============================================================================
# HELP
# ==============================================================================
help:
	@echo "Available commands:"
	@echo "  install            - Install all backend and frontend dependencies."
	@echo "  dev-backend        - Start the backend server for development (with auto-reload)."
	@echo "  dev-frontend       - Start the frontend server for development (with hot-reload)."
	@echo "  run-prod           - Build, package, and run the application for production."
	@echo "  build-frontend     - Build the frontend assets for production."
	@echo "  package            - Build the final Python package for distribution."
