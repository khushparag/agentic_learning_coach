#!/bin/bash
# Test environment setup script

set -e

echo "🧪 Setting up test environment..."

# Activate virtual environment
if [ -d ".venv" ]; then
    source .venv/bin/activate
fi

# Set test environment
export ENVIRONMENT=test
export DATABASE_URL="sqlite:///./test.db"

# Run tests
echo "🏃 Running tests..."
pytest tests/ -v --cov=src --cov-report=term-missing

echo "✅ Tests completed!"