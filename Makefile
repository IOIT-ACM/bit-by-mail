.PHONY: install build run start

install:
	@echo "Installing backend dependencies..."
	@if [ ! -d "venv" ]; then \
		python3 -m venv venv; \
	fi
	. venv/bin/activate && pip install .
	@echo "Installing frontend dependencies..."
	cd frontend && npm install

build:
	@echo "Building frontend for production..."
	cd frontend && npm run build

run: build
	@echo "Starting backend server for production..."
	. venv/bin/activate && python run.py

start: install run
