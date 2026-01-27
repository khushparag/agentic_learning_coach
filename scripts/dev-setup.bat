@echo off
REM Development setup script for Windows

echo 🚀 Setting up Agentic Learning Coach development environment...

REM Check if Python 3.11+ is available
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python is required but not found
    echo Please install Python 3.11 or higher
    exit /b 1
)

REM Create virtual environment if it doesn't exist
if not exist ".venv" (
    echo 📦 Creating virtual environment...
    python -m venv .venv
)

REM Activate virtual environment
echo 🔧 Activating virtual environment...
call .venv\Scripts\activate.bat

REM Upgrade pip
echo ⬆️  Upgrading pip...
python -m pip install --upgrade pip

REM Install dependencies
echo 📚 Installing dependencies...
pip install -r requirements-dev.txt

REM Install pre-commit hooks
echo 🪝 Setting up pre-commit hooks...
pre-commit install

REM Copy environment file if it doesn't exist
if not exist ".env" (
    echo 📄 Creating .env file from template...
    copy .env.example .env
    echo ⚠️  Please review and update .env file with your configuration
)

echo ✅ Development environment setup complete!
echo.
echo Next steps:
echo 1. Review and update .env file if needed
echo 2. Run '.venv\Scripts\activate.bat' to activate the virtual environment
echo 3. Run 'uvicorn src.adapters.api.main:app --reload' to start the development server
echo 4. Visit http://localhost:8000/docs for API documentation