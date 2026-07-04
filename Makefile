.PHONY: install build-web package run-prod dev-backend dev-web help

# ==============================================================================
# SETUP
# ==============================================================================
install:
	@echo "Installing backend dependencies for development..."
	@if [ ! -d "venv" ]; then \
		python3 -m venv venv; \
	fi
	. venv/bin/activate && pip install -e .
	@echo "Installing web dependencies..."
	cd web && bun install

# ==============================================================================
# DEVELOPMENT
# ==============================================================================
dev-backend:
	@echo "Starting backend server in DEVELOPMENT mode (http://localhost:8888)..."
	@echo "Auto-reloading is ON."
	. venv/bin/activate && python3 run.py

dev-web:
	@echo "Starting web dev server in DEVELOPMENT mode (http://localhost:3000)..."
	@echo "Hot-reloading is ON."
	cd web && bun run dev

# ==============================================================================
# PRODUCTION
# ==============================================================================
build-web:
	@echo "Building web for production..."
	cd web && bun run build

package: build-web
	@echo "Preparing assets for packaging..."
	@rm -rf src/bit_by_mail/frontend/dist
	@mkdir -p src/bit_by_mail/frontend
	@cp -r web/dist src/bit_by_mail/frontend/
	@echo "Building Python package..."
	@if [ -d "venv" ]; then \
		. venv/bin/activate && pip install --upgrade build && python -m build; \
	else \
		pip install --upgrade build && python -m build; \
	fi

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
	@echo "  install            - Install all backend and web dependencies."
	@echo "  dev-backend        - Start the backend server for development (with auto-reload)."
	@echo "  dev-web       - Start the web server for development (with hot-reload)."
	@echo "  run-prod           - Build, package, and run the application for production."
	@echo "  build-web     - Build the web assets for production."
	@echo "  package            - Build the final Python package for distribution."
