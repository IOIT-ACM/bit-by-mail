@echo off
if "%1"=="install" goto install
if "%1"=="dev-backend" goto dev-backend
if "%1"=="dev-web" goto dev-web
if "%1"=="build-web" goto build-web
if "%1"=="package" goto package
if "%1"=="run-prod" goto run-prod
if "%1"=="help" goto help
if "%1"=="" goto help

:install
if not exist venv (
    python -m venv venv
)
call venv\Scripts\activate
pip install -e .
cd web && bun install
goto :eof

:dev-backend
call venv\Scripts\activate
python run.py
goto :eof

:dev-web
cd web && bun run dev
goto :eof

:build-web
cd web && bun run build
goto :eof

:package
call :build-web
if exist src\bit_by_mail\frontend\dist rmdir /s /q src\bit_by_mail\frontend\dist
if not exist src\bit_by_mail\frontend mkdir src\bit_by_mail\frontend
xcopy web\dist src\bit_by_mail\frontend\dist\ /E /I /H /Y
if exist venv (
    call venv\Scripts\activate
    pip install --upgrade build
    python -m build
) else (
    pip install --upgrade build
    python -m build
)
goto :eof

:run-prod
call :package
call venv\Scripts\activate
for %%f in (dist\*.whl) do pip install "%%f" --force-reinstall
bit-by-mail
goto :eof

:help
echo Available commands:
echo   install            - Install all backend and web dependencies.
echo   dev-backend        - Start the backend server for development.
echo   dev-web            - Start the web server for development.
echo   run-prod           - Build, package, and run the application for production.
echo   build-web          - Build the web assets for production.
echo   package            - Build the final Python package for distribution.
goto :eof
