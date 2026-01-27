# =============================================================================
# Makefile for Agentic Learning Coach
# =============================================================================
# This Makefile provides convenient commands for development, testing,
# and deployment of the Learning Coach system.
#
# Usage:
#   make help        - Show all available commands
#   make dev         - Start development environment
#   make test        - Run all tests
#   make demo        - Run demo script
# =============================================================================

.PHONY: help install dev-install test lint format clean \
        docker-up docker-down docker-logs docker-build \
        migrate migrate-create migrate-downgrade \
        dev dev-server dev-setup dev-stop \
        demo health db-init db-seed db-reset \
        test-unit test-integration test-coverage

# Default target
help:
	@echo "╔═══════════════════════════════════════════════════════════════╗"
	@echo "║     🎓 Agentic Learning Coach - Makefile Commands             ║"
	@echo "╚═══════════════════════════════════════════════════════════════╝"
	@echo ""
	@echo "📦 Installation:"
	@echo "  install        - Install production dependencies"
	@echo "  dev-install    - Install development dependencies"
	@echo "  dev-setup      - Complete development setup"
	@echo ""
	@echo "🚀 Development:"
	@echo "  dev            - Start development environment (Docker)"
	@echo "  dev-server     - Start local development server"
	@echo "  dev-stop       - Stop development environment"
	@echo "  dev-restart    - Restart development environment"
	@echo "  dev-logs       - View development logs"
	@echo "  dev-frontend   - Start frontend development server"
	@echo "  dev-full       - Start full stack (backend + frontend)"
	@echo ""
	@echo "🐳 Docker:"
	@echo "  docker-up      - Start Docker services"
	@echo "  docker-down    - Stop Docker services"
	@echo "  docker-build   - Build Docker images"
	@echo "  docker-logs    - View Docker logs"
	@echo "  docker-clean   - Remove Docker volumes and images"
	@echo ""
	@echo "🗄️  Database:"
	@echo "  migrate        - Run database migrations"
	@echo "  migrate-create - Create new migration (name=<message>)"
	@echo "  migrate-down   - Downgrade one migration"
	@echo "  db-init        - Initialize database"
	@echo "  db-seed        - Seed sample data"
	@echo "  db-reset       - Reset database (WARNING: deletes data)"
	@echo "  db-shell       - Open PostgreSQL shell"
	@echo ""
	@echo "🧪 Testing:"
	@echo "  test           - Run all tests"
	@echo "  test-unit      - Run unit tests only"
	@echo "  test-integration - Run integration tests only"
	@echo "  test-coverage  - Run tests with coverage report"
	@echo "  test-watch     - Run tests in watch mode"
	@echo ""
	@echo "🔍 Code Quality:"
	@echo "  lint           - Run linting"
	@echo "  format         - Format code"
	@echo "  type-check     - Run type checking"
	@echo ""
	@echo "🎬 Demo & Health:"
	@echo "  demo           - Run demo script"
	@echo "  demo-quick     - Run quick demo"
	@echo "  health         - Check system health"
	@echo ""
	@echo "🧹 Cleanup:"
	@echo "  clean          - Clean temporary files"
	@echo "  clean-all      - Clean everything including Docker"

# =============================================================================
# Installation
# =============================================================================
install:
	pip install -r requirements.txt

dev-install:
	pip install -r requirements-dev.txt
	pre-commit install || true

dev-setup:
	chmod +x scripts/dev-setup.sh
	./scripts/dev-setup.sh

# =============================================================================
# Development
# =============================================================================
dev: docker-up
	@echo "✅ Development environment started"
	@echo "   Coach API:    http://localhost:8000"
	@echo "   API Docs:     http://localhost:8000/docs"
	@echo "   Runner API:   http://localhost:8001"

dev-server:
	uvicorn src.adapters.api.main:app --reload --host 0.0.0.0 --port 8000

dev-stop: docker-down
	@echo "✅ Development environment stopped"

dev-restart:
	docker-compose down
	docker-compose up -d --build
	@echo "✅ Development environment restarted"

dev-logs:
	docker-compose logs -f

# =============================================================================
# Docker
# =============================================================================
docker-up:
	docker-compose up -d
	@echo "⏳ Waiting for services to be ready..."
	@sleep 10
	@echo "✅ Docker services started"

docker-down:
	docker-compose down

docker-build:
	docker-compose build

docker-logs:
	docker-compose logs -f

docker-clean:
	docker-compose down -v --rmi local
	@echo "✅ Docker volumes and images cleaned"

docker-ps:
	docker-compose ps

# =============================================================================
# Database
# =============================================================================
migrate:
	alembic upgrade head
	@echo "✅ Migrations applied"

migrate-create:
ifndef name
	$(error name is required. Usage: make migrate-create name="migration message")
endif
	alembic revision --autogenerate -m "$(name)"
	@echo "✅ Migration created"

migrate-down:
	alembic downgrade -1
	@echo "✅ Downgraded one migration"

migrate-status:
	python scripts/manage_db.py status

db-init:
	python scripts/init_db.py init
	@echo "✅ Database initialized"

db-seed:
	python scripts/init_db.py seed
	@echo "✅ Sample data seeded"

db-reset:
	python scripts/init_db.py reset
	@echo "✅ Database reset"

db-check:
	python scripts/init_db.py check

db-shell:
	docker-compose exec postgres psql -U postgres -d learning_coach

db-tables:
	python scripts/init_db.py tables

# =============================================================================
# Testing
# =============================================================================
test:
	pytest tests/ -v

test-unit:
	pytest tests/unit/ -v

test-integration:
	pytest tests/integration/ -v

test-coverage:
	pytest tests/ -v --cov=src --cov-report=term-missing --cov-report=html
	@echo "✅ Coverage report generated in htmlcov/"

test-watch:
	pytest-watch tests/ -- -v

test-fast:
	pytest tests/ -v -x --tb=short

# =============================================================================
# Code Quality
# =============================================================================
lint:
	flake8 src tests --max-line-length=100 || true
	mypy src --ignore-missing-imports || true

format:
	black src tests scripts --line-length=100
	isort src tests scripts

type-check:
	mypy src --ignore-missing-imports

check: lint type-check test
	@echo "✅ All checks passed"

# =============================================================================
# Demo & Health
# =============================================================================
demo:
	python scripts/demo.py run

demo-quick:
	python scripts/demo.py run --quick

demo-agents:
	python scripts/demo.py agents

health:
	python scripts/cli.py health

health-detailed:
	curl -s http://localhost:8000/health/detailed | python -m json.tool || echo "Service not running"

# =============================================================================
# CLI
# =============================================================================
cli:
	python scripts/cli.py --help

# =============================================================================
# Cleanup
# =============================================================================
clean:
	find . -type f -name "*.pyc" -delete
	find . -type d -name "__pycache__" -delete
	find . -type d -name "*.egg-info" -exec rm -rf {} + 2>/dev/null || true
	find . -type f -name ".coverage" -delete
	find . -type d -name ".pytest_cache" -exec rm -rf {} + 2>/dev/null || true
	find . -type f -name "test.db" -delete
	@echo "✅ Temporary files cleaned"

clean-coverage:
	rm -rf htmlcov/
	rm -f .coverage
	@echo "✅ Coverage files cleaned"

clean-all: clean clean-coverage docker-clean
	@echo "✅ All cleaned"

# =============================================================================
# Production
# =============================================================================
build-prod:
	docker build --target production -t learning-coach:latest .
	@echo "✅ Production image built"

# =============================================================================
# Shortcuts
# =============================================================================
up: dev
down: dev-stop
restart: dev-restart
logs: dev-logs
ps: docker-ps
shell: db-shell