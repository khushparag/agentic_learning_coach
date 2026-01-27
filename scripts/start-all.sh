#!/bin/bash
# =============================================================================
# Agentic Learning Coach - Full Stack Startup Script
# =============================================================================
# This script starts all services needed for the Learning Coach application.
# 
# Usage:
#   ./scripts/start-all.sh          # Start all services
#   ./scripts/start-all.sh --dev    # Start in development mode (with hot reload)
#   ./scripts/start-all.sh --stop   # Stop all services
#   ./scripts/start-all.sh --status # Check service status
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print colored message
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker first."
        exit 1
    fi
    print_success "Docker is running"
}

# Check if .env file exists
check_env() {
    if [ ! -f ".env" ]; then
        print_warning ".env file not found. Creating from .env.example..."
        if [ -f ".env.example" ]; then
            cp .env.example .env
            print_success "Created .env file from .env.example"
            print_warning "Please configure your API keys in .env for full functionality"
        else
            print_error ".env.example not found. Please create .env manually."
            exit 1
        fi
    else
        print_success ".env file found"
    fi
}

# Check LLM configuration
check_llm_config() {
    if grep -q "OPENAI_API_KEY=your-" .env 2>/dev/null || grep -q "ANTHROPIC_API_KEY=your-" .env 2>/dev/null; then
        print_warning "LLM API keys not configured. The system will use mock/rule-based responses."
        print_warning "For AI-powered features, add your API key to .env:"
        echo "  - OPENAI_API_KEY=sk-your-key-here"
        echo "  - OR ANTHROPIC_API_KEY=your-key-here"
    elif grep -q "^OPENAI_API_KEY=" .env 2>/dev/null || grep -q "^ANTHROPIC_API_KEY=" .env 2>/dev/null; then
        print_success "LLM API key configured"
    else
        print_warning "No LLM API key found. System will use mock responses."
    fi
}

# Start all services
start_services() {
    print_status "Starting all services..."
    
    # Start infrastructure services first
    print_status "Starting database and cache services..."
    docker-compose up -d postgres redis qdrant
    
    # Wait for database to be ready
    print_status "Waiting for database to be ready..."
    sleep 5
    
    # Check if database is healthy
    until docker-compose exec -T postgres pg_isready -U postgres > /dev/null 2>&1; do
        print_status "Waiting for PostgreSQL..."
        sleep 2
    done
    print_success "PostgreSQL is ready"
    
    # Start backend services
    print_status "Starting backend services..."
    docker-compose up -d coach-service runner-service
    
    # Wait for backend to be ready
    print_status "Waiting for backend API to be ready..."
    sleep 10
    
    # Check backend health
    for i in {1..30}; do
        if curl -s http://localhost:8000/health/live > /dev/null 2>&1; then
            print_success "Backend API is ready"
            break
        fi
        if [ $i -eq 30 ]; then
            print_warning "Backend API may not be fully ready yet"
        fi
        sleep 2
    done
    
    # Start frontend
    print_status "Starting frontend..."
    docker-compose up -d frontend
    
    print_success "All services started!"
    echo ""
    print_status "Service URLs:"
    echo "  - Frontend:     http://localhost:3000"
    echo "  - Backend API:  http://localhost:8000"
    echo "  - API Docs:     http://localhost:8000/docs"
    echo "  - Qdrant:       http://localhost:6333"
    echo ""
}

# Start in development mode
start_dev() {
    print_status "Starting in development mode..."
    
    # Start infrastructure
    docker-compose up -d postgres redis qdrant
    
    # Wait for database
    print_status "Waiting for database..."
    sleep 5
    
    print_success "Infrastructure services started"
    echo ""
    print_status "To start the backend manually:"
    echo "  cd . && python -m uvicorn src.adapters.api.main:app --reload --host 0.0.0.0 --port 8000"
    echo ""
    print_status "To start the frontend manually:"
    echo "  cd frontend && npm run dev"
    echo ""
}

# Stop all services
stop_services() {
    print_status "Stopping all services..."
    docker-compose down
    print_success "All services stopped"
}

# Check service status
check_status() {
    print_status "Checking service status..."
    echo ""
    docker-compose ps
    echo ""
    
    # Check individual services
    print_status "Service health checks:"
    
    # PostgreSQL
    if docker-compose exec -T postgres pg_isready -U postgres > /dev/null 2>&1; then
        print_success "PostgreSQL: Running"
    else
        print_error "PostgreSQL: Not running"
    fi
    
    # Redis
    if docker-compose exec -T redis redis-cli ping > /dev/null 2>&1; then
        print_success "Redis: Running"
    else
        print_error "Redis: Not running"
    fi
    
    # Backend API
    if curl -s http://localhost:8000/health/live > /dev/null 2>&1; then
        print_success "Backend API: Running"
    else
        print_error "Backend API: Not running"
    fi
    
    # Frontend
    if curl -s http://localhost:3000 > /dev/null 2>&1; then
        print_success "Frontend: Running"
    else
        print_error "Frontend: Not running"
    fi
    
    # Qdrant
    if curl -s http://localhost:6333/health > /dev/null 2>&1; then
        print_success "Qdrant: Running"
    else
        print_error "Qdrant: Not running"
    fi
}

# Show logs
show_logs() {
    service=$1
    if [ -z "$service" ]; then
        docker-compose logs -f
    else
        docker-compose logs -f $service
    fi
}

# Main script
main() {
    echo "=============================================="
    echo "  Agentic Learning Coach - Startup Script"
    echo "=============================================="
    echo ""
    
    case "${1:-}" in
        --stop)
            stop_services
            ;;
        --status)
            check_status
            ;;
        --dev)
            check_docker
            check_env
            check_llm_config
            start_dev
            ;;
        --logs)
            show_logs "${2:-}"
            ;;
        *)
            check_docker
            check_env
            check_llm_config
            start_services
            ;;
    esac
}

main "$@"
