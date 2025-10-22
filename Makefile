.PHONY: install dev build run start

install:
	@echo "Installing backend dependencies..."
	@if [ ! -d "venv" ]; then \
		python3 -m venv venv; \
	fi
	. venv/bin/activate && pip install -r requirements.txt
	@echo "Installing frontend dependencies..."
	cd frontend && npm install

dev:
	@echo "Starting frontend dev server (hot-reloading)..."
	cd frontend && npm start & \
	echo "Starting backend server..." && \
	. venv/bin/activate && python run.py

build:
	@echo "Building frontend for production..."
	cd frontend && npm run build

run: build
	@echo "Starting backend server for production..."
	. venv/bin/activate && python run.py

start: install run
