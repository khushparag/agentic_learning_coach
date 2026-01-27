# Agentic Learning Coach - Setup Guide

This guide walks you through setting up and running the complete Agentic Learning Coach system.

## Prerequisites

Before starting, ensure you have:

- **Docker Desktop** (v20.10+) - [Install Docker](https://docs.docker.com/get-docker/)
- **Docker Compose** (v2.0+) - Usually included with Docker Desktop
- **Node.js** (v18+) - For frontend development [Install Node.js](https://nodejs.org/)
- **Python** (v3.11+) - For backend development [Install Python](https://python.org/)

## Quick Start

### Option 1: One-Command Startup (Recommended)

```bash
# Make the script executable (first time only)
chmod +x scripts/start-all.sh

# Start all services
./scripts/start-all.sh
```

This will:
1. Check Docker is running
2. Create `.env` from `.env.example` if needed
3. Start PostgreSQL, Redis, and Qdrant
4. Start the backend API service
5. Start the frontend application

### Option 2: Manual Startup

```bash
# 1. Copy environment file
cp .env.example .env

# 2. Start infrastructure services
docker-compose up -d postgres redis qdrant

# 3. Start backend (in one terminal)
cd . && python -m uvicorn src.adapters.api.main:app --reload --host 0.0.0.0 --port 8000

# 4. Start frontend (in another terminal)
cd frontend && npm install && npm run dev
```

## Service URLs

Once running, access the services at:

| Service | URL | Description |
|---------|-----|-------------|
| Frontend | http://localhost:3000 | Web application |
| Backend API | http://localhost:8000 | REST API |
| API Documentation | http://localhost:8000/docs | Swagger UI |
| Qdrant Dashboard | http://localhost:6333/dashboard | Vector DB UI |

## LLM Configuration (AI Features)

The system supports AI-powered features using OpenAI or Anthropic. Without an API key, the system uses intelligent mock responses.

### Option A: OpenAI

1. Get an API key from [OpenAI Platform](https://platform.openai.com/api-keys)
2. Add to your `.env` file:

```bash
OPENAI_API_KEY=sk-your-api-key-here
OPENAI_MODEL=gpt-4o-mini  # or gpt-4, gpt-3.5-turbo
```

### Option B: Anthropic

1. Get an API key from [Anthropic Console](https://console.anthropic.com/)
2. Add to your `.env` file:

```bash
ANTHROPIC_API_KEY=your-api-key-here
ANTHROPIC_MODEL=claude-3-haiku-20240307  # or claude-3-sonnet, claude-3-opus
```

### Option C: Mock Mode (No API Key)

If no API key is configured, the system automatically uses mock mode:
- Exercise generation uses templates
- Feedback uses rule-based responses
- All features remain functional

## Checking System Status

```bash
# Check all service status
./scripts/start-all.sh --status

# View service logs
./scripts/start-all.sh --logs

# View specific service logs
./scripts/start-all.sh --logs coach-service
```

## Stopping Services

```bash
# Stop all services
./scripts/start-all.sh --stop

# Or using docker-compose directly
docker-compose down
```

## Development Mode

For active development with hot reload:

```bash
# Start only infrastructure
./scripts/start-all.sh --dev

# Then manually start backend with reload
python -m uvicorn src.adapters.api.main:app --reload --host 0.0.0.0 --port 8000

# And frontend with hot reload
cd frontend && npm run dev
```

## Database Management

### Initialize Database

```bash
python scripts/init_db.py
```

### Run Migrations

```bash
alembic upgrade head
```

### Reset Database

```bash
docker-compose down -v  # Removes volumes
docker-compose up -d postgres
python scripts/init_db.py
```

## Troubleshooting

### Docker Issues

**Problem:** Docker is not running
```bash
# Start Docker Desktop, then retry
./scripts/start-all.sh
```

**Problem:** Port already in use
```bash
# Find and stop the process using the port
# On Windows:
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# On Mac/Linux:
lsof -i :8000
kill -9 <PID>
```

### Database Issues

**Problem:** Database connection failed
```bash
# Check if PostgreSQL is running
docker-compose ps postgres

# Restart PostgreSQL
docker-compose restart postgres
```

**Problem:** Migration errors
```bash
# Reset and reinitialize
docker-compose down -v
docker-compose up -d postgres
sleep 5
python scripts/init_db.py
```

### Frontend Issues

**Problem:** API connection failed
1. Verify backend is running: http://localhost:8000/health/live
2. Check `frontend/.env.development` has correct `VITE_API_BASE_URL`
3. Clear browser cache and reload

**Problem:** npm install fails
```bash
# Clear npm cache
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### LLM Issues

**Problem:** LLM responses not working
1. Check API key is set in `.env`
2. Verify key format (OpenAI starts with `sk-`)
3. Check API key has credits/quota
4. View logs for error details: `./scripts/start-all.sh --logs coach-service`

## Environment Variables Reference

### Required

| Variable | Description | Default |
|----------|-------------|---------|
| `POSTGRES_DB` | Database name | `learning_coach` |
| `POSTGRES_USER` | Database user | `postgres` |
| `POSTGRES_PASSWORD` | Database password | `postgres` |
| `DATABASE_URL` | Full connection string | Auto-generated |

### Optional (LLM)

| Variable | Description | Default |
|----------|-------------|---------|
| `OPENAI_API_KEY` | OpenAI API key | None (mock mode) |
| `OPENAI_MODEL` | OpenAI model | `gpt-4o-mini` |
| `ANTHROPIC_API_KEY` | Anthropic API key | None (mock mode) |
| `ANTHROPIC_MODEL` | Anthropic model | `claude-3-haiku-20240307` |
| `LLM_MAX_TOKENS` | Max response tokens | `2000` |
| `LLM_TEMPERATURE` | Response creativity | `0.7` |

### Optional (Services)

| Variable | Description | Default |
|----------|-------------|---------|
| `COACH_PORT` | Backend API port | `8000` |
| `FRONTEND_PORT` | Frontend port | `3000` |
| `REDIS_URL` | Redis connection | `redis://localhost:6379` |
| `QDRANT_URL` | Qdrant connection | `http://localhost:6333` |

## Getting Help

- Check the [API Documentation](http://localhost:8000/docs) for endpoint details
- Review [DEVLOG.md](./DEVLOG.md) for development notes
- See [README.md](./README.md) for project overview
