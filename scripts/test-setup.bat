@echo off
REM Test environment setup script for Windows

echo 🧪 Setting up test environment...

REM Activate virtual environment
if exist ".venv" (
    call .venv\Scripts\activate.bat
)

REM Set test environment
set ENVIRONMENT=test
set DATABASE_URL=sqlite:///./test.db

REM Run tests
echo 🏃 Running tests...
pytest tests/ -v --cov=src --cov-report=term-missing

echo ✅ Tests completed!