# =============================================================================
# Multi-stage Dockerfile for the Learning Coach Service
# =============================================================================
# This Dockerfile builds the main Learning Coach API service.
#
# Stages:
#   - base: Common dependencies and setup
#   - development: Full development environment with hot reload
#   - production: Optimized production build
#
# Usage:
#   Development: docker build --target development -t learning-coach:dev .
#   Production:  docker build --target production -t learning-coach:latest .
# =============================================================================

# -----------------------------------------------------------------------------
# Base Stage - Common dependencies
# -----------------------------------------------------------------------------
FROM python:3.11-slim as base

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PYTHONPATH=/app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Create app user for security
RUN groupadd -r appuser && useradd -r -g appuser appuser

# Set work directory
WORKDIR /app

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# -----------------------------------------------------------------------------
# Development Stage - Full development environment
# -----------------------------------------------------------------------------
FROM base as development

# Install development dependencies
COPY requirements-dev.txt .
RUN pip install --no-cache-dir -r requirements-dev.txt

# Copy source code
COPY . .

# Change ownership to app user
RUN chown -R appuser:appuser /app

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:8000/health/live || exit 1

# Default command for development (with hot reload)
CMD ["uvicorn", "src.adapters.api.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]

# -----------------------------------------------------------------------------
# Production Stage - Optimized production build
# -----------------------------------------------------------------------------
FROM base as production

# Copy only necessary files for production
COPY requirements.txt .
COPY src/ ./src/
COPY alembic.ini .
COPY alembic/ ./alembic/
COPY scripts/init-db.sql ./scripts/

# Change ownership to app user
RUN chown -R appuser:appuser /app

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 8000

# Health check (more aggressive for production)
HEALTHCHECK --interval=15s --timeout=5s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8000/health/ready || exit 1

# Production startup script
# 1. Run database migrations
# 2. Start the server with multiple workers
CMD ["sh", "-c", "alembic upgrade head && uvicorn src.adapters.api.main:app --host 0.0.0.0 --port 8000 --workers 4"]