#!/bin/bash
# =============================================================================
# Docker Deployment Script for Agentic Learning Coach
# =============================================================================
# This script handles deployment of the entire Learning Coach system using Docker
# with proper security, monitoring, and health checks.
# =============================================================================

set -euo pipefail

# Colors for output
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly NC='\033[0m' # No Color

# Configuration
readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
readonly COMPOSE_PROJECT_NAME="learning-coach"
readonly DEFAULT_ENVIRONMENT="development"

# Environment configuration
ENVIRONMENT="${1:-$DEFAULT_ENVIRONMENT}"
COMPOSE_FILES=()
BUILD_ARGS=()
DEPLOY_OPTIONS=()

# Logging functions
log() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

debug() {
    if [[ "${DEBUG:-false}" == "true" ]]; then
        echo -e "${BLUE}[DEBUG]${NC} $1"
    fi
}

# Function to validate environment
validate_environment() {
    log "Validating environment: $ENVIRONMENT"
    
    case "$ENVIRONMENT" in
        "development"|"dev")
            ENVIRONMENT="development"
            COMPOSE_FILES=("docker-compose.yml" "docker-compose.override.yml")
            ;;
        "staging"|"stage")
            ENVIRONMENT="staging"
            COMPOSE_FILES=("docker-compose.yml" "docker-compose.staging.yml")
            ;;
        "production"|"prod")
            ENVIRONMENT="production"
            COMPOSE_FILES=("docker-compose.yml" "docker-compose.prod.yml")
            ;;
        *)
            error "Invalid environment: $ENVIRONMENT"
            error "Valid environments: development, staging, production"
            exit 1
            ;;
    esac
    
    log "✅ Environment validated: $ENVIRONMENT"
}

# Function to check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        error "Docker is not installed or not in PATH"
        exit 1
    fi
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        error "Docker Compose is not installed or not in PATH"
        exit 1
    fi
    
    # Check Docker daemon
    if ! docker info &> /dev/null; then
        error "Docker daemon is not running"
        exit 1
    fi
    
    # Check available disk space (minimum 2GB)
    available_space=$(df "$PROJECT_ROOT" | awk 'NR==2 {print $4}')
    if [[ $available_space -lt 2097152 ]]; then  # 2GB in KB
        warn "Low disk space available: $(($available_space / 1024))MB"
        warn "Recommended minimum: 2GB"
    fi
    
    log "✅ Prerequisites check passed"
}

# Function to validate configuration files
validate_config() {
    log "Validating configuration files..."
    
    # Check if compose files exist
    for compose_file in "${COMPOSE_FILES[@]}"; do
        if [[ ! -f "$PROJECT_ROOT/$compose_file" ]]; then
            error "Compose file not found: $compose_file"
            exit 1
        fi
        debug "Found compose file: $compose_file"
    done
    
    # Validate Docker Compose configuration
    local compose_cmd="docker-compose"
    if docker compose version &> /dev/null; then
        compose_cmd="docker compose"
    fi
    
    local compose_args=""
    for compose_file in "${COMPOSE_FILES[@]}"; do
        compose_args="$compose_args -f $compose_file"
    done
    
    if ! $compose_cmd $compose_args config &> /dev/null; then
        error "Invalid Docker Compose configuration"
        $compose_cmd $compose_args config
        exit 1
    fi
    
    log "✅ Configuration validation passed"
}

# Function to setup environment variables
setup_environment() {
    log "Setting up environment variables..."
    
    # Load environment-specific variables
    local env_file="$PROJECT_ROOT/.env.$ENVIRONMENT"
    if [[ -f "$env_file" ]]; then
        log "Loading environment file: $env_file"
        set -a
        source "$env_file"
        set +a
    else
        warn "Environment file not found: $env_file"
        warn "Using default environment variables"
    fi
    
    # Set deployment-specific variables
    export COMPOSE_PROJECT_NAME="$COMPOSE_PROJECT_NAME"
    export ENVIRONMENT="$ENVIRONMENT"
    export DEPLOY_TIMESTAMP="$(date -u +%Y%m%d_%H%M%S)"
    export GIT_COMMIT="${GIT_COMMIT:-$(git rev-parse --short HEAD 2>/dev/null || echo 'unknown')}"
    
    # Security: Generate secrets if not provided
    if [[ -z "${SECRET_KEY:-}" ]]; then
        export SECRET_KEY="$(openssl rand -hex 32)"
        warn "Generated SECRET_KEY (set in environment for production)"
    fi
    
    if [[ -z "${JWT_SECRET_KEY:-}" ]]; then
        export JWT_SECRET_KEY="$(openssl rand -hex 32)"
        warn "Generated JWT_SECRET_KEY (set in environment for production)"
    fi
    
    log "✅ Environment setup completed"
}

# Function to build images
build_images() {
    log "Building Docker images..."
    
    local compose_cmd="docker-compose"
    if docker compose version &> /dev/null; then
        compose_cmd="docker compose"
    fi
    
    local compose_args=""
    for compose_file in "${COMPOSE_FILES[@]}"; do
        compose_args="$compose_args -f $compose_file"
    done
    
    # Build with cache optimization
    BUILD_ARGS+=(
        "--build-arg" "BUILDKIT_INLINE_CACHE=1"
        "--build-arg" "ENVIRONMENT=$ENVIRONMENT"
        "--build-arg" "GIT_COMMIT=$GIT_COMMIT"
        "--build-arg" "BUILD_TIMESTAMP=$DEPLOY_TIMESTAMP"
    )
    
    if [[ "$ENVIRONMENT" == "production" ]]; then
        BUILD_ARGS+=(
            "--build-arg" "VITE_DEBUG=false"
            "--build-arg" "VITE_APP_ENV=production"
        )
    fi
    
    # Build images
    $compose_cmd $compose_args build "${BUILD_ARGS[@]}" || {
        error "Failed to build Docker images"
        exit 1
    }
    
    log "✅ Docker images built successfully"
}

# Function to run security checks
security_check() {
    log "Running security checks..."
    
    # Check for secrets in environment files
    if command -v grep &> /dev/null; then
        local secret_patterns=("password" "secret" "key" "token")
        for pattern in "${secret_patterns[@]}"; do
            if grep -ri "$pattern" "$PROJECT_ROOT/.env"* 2>/dev/null | grep -v ".example" | grep -v ".docker"; then
                warn "Potential secrets found in environment files"
                warn "Ensure sensitive data is properly secured"
            fi
        done
    fi
    
    # Check Docker image vulnerabilities (if trivy is available)
    if command -v trivy &> /dev/null; then
        log "Scanning images for vulnerabilities..."
        trivy image --exit-code 1 --severity HIGH,CRITICAL "$COMPOSE_PROJECT_NAME-frontend:latest" || {
            warn "Security vulnerabilities found in frontend image"
        }
        trivy image --exit-code 1 --severity HIGH,CRITICAL "$COMPOSE_PROJECT_NAME-coach-service:latest" || {
            warn "Security vulnerabilities found in backend image"
        }
    else
        warn "Trivy not found - skipping vulnerability scan"
        warn "Install trivy for security scanning: https://github.com/aquasecurity/trivy"
    fi
    
    log "✅ Security checks completed"
}

# Function to deploy services
deploy_services() {
    log "Deploying services..."
    
    local compose_cmd="docker-compose"
    if docker compose version &> /dev/null; then
        compose_cmd="docker compose"
    fi
    
    local compose_args=""
    for compose_file in "${COMPOSE_FILES[@]}"; do
        compose_args="$compose_args -f $compose_file"
    done
    
    # Deploy with proper ordering
    DEPLOY_OPTIONS+=(
        "--remove-orphans"
        "--force-recreate"
    )
    
    if [[ "$ENVIRONMENT" == "production" ]]; then
        DEPLOY_OPTIONS+=("--no-build")
    fi
    
    # Start infrastructure services first
    log "Starting infrastructure services..."
    $compose_cmd $compose_args up -d postgres redis qdrant || {
        error "Failed to start infrastructure services"
        exit 1
    }
    
    # Wait for infrastructure to be ready
    log "Waiting for infrastructure services to be ready..."
    sleep 10
    
    # Start application services
    log "Starting application services..."
    $compose_cmd $compose_args up -d "${DEPLOY_OPTIONS[@]}" || {
        error "Failed to start application services"
        exit 1
    }
    
    log "✅ Services deployed successfully"
}

# Function to run health checks
health_check() {
    log "Running health checks..."
    
    local max_attempts=30
    local attempt=1
    local services=("postgres" "redis" "qdrant" "coach-service" "runner-service" "frontend")
    
    for service in "${services[@]}"; do
        log "Checking health of $service..."
        
        while [[ $attempt -le $max_attempts ]]; do
            if docker-compose ps "$service" | grep -q "healthy\|Up"; then
                log "✅ $service is healthy"
                break
            fi
            
            if [[ $attempt -eq $max_attempts ]]; then
                error "❌ $service failed health check after $max_attempts attempts"
                docker-compose logs --tail=20 "$service"
                return 1
            fi
            
            debug "Health check attempt $attempt/$max_attempts for $service"
            sleep 5
            ((attempt++))
        done
        
        attempt=1
    done
    
    log "✅ All services are healthy"
}

# Function to show deployment status
show_status() {
    log "Deployment Status:"
    echo "===================="
    
    # Show service status
    docker-compose ps
    
    echo ""
    log "Service URLs:"
    echo "Frontend:    http://localhost:${FRONTEND_PORT:-3000}"
    echo "Backend API: http://localhost:${COACH_PORT:-8000}"
    echo "Runner API:  http://localhost:${RUNNER_PORT:-8001}"
    
    if [[ "$ENVIRONMENT" == "development" ]]; then
        echo "PostgreSQL:  localhost:${POSTGRES_PORT:-5432}"
        echo "Redis:       localhost:${REDIS_PORT:-6379}"
        echo "Qdrant:      http://localhost:${QDRANT_PORT:-6333}"
    fi
    
    echo ""
    log "Logs:"
    echo "View logs: docker-compose logs -f [service_name]"
    echo "All logs:  docker-compose logs -f"
    
    echo ""
    log "Management:"
    echo "Stop:      docker-compose down"
    echo "Restart:   docker-compose restart [service_name]"
    echo "Scale:     docker-compose up -d --scale frontend=2"
}

# Function to cleanup on failure
cleanup_on_failure() {
    error "Deployment failed. Cleaning up..."
    
    # Stop services
    docker-compose down --remove-orphans || true
    
    # Remove dangling images
    docker image prune -f || true
    
    error "Cleanup completed"
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [ENVIRONMENT] [OPTIONS]"
    echo ""
    echo "ENVIRONMENT:"
    echo "  development  - Development environment (default)"
    echo "  staging      - Staging environment"
    echo "  production   - Production environment"
    echo ""
    echo "OPTIONS:"
    echo "  --no-build   - Skip building images"
    echo "  --no-health  - Skip health checks"
    echo "  --debug      - Enable debug output"
    echo "  --help       - Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0                    # Deploy development environment"
    echo "  $0 production         # Deploy production environment"
    echo "  $0 staging --debug    # Deploy staging with debug output"
}

# Main deployment function
main() {
    log "🚀 Starting Agentic Learning Coach deployment..."
    log "Environment: $ENVIRONMENT"
    log "Timestamp: $DEPLOY_TIMESTAMP"
    
    # Set trap for cleanup on failure
    trap cleanup_on_failure ERR
    
    # Run deployment steps
    validate_environment
    check_prerequisites
    validate_config
    setup_environment
    
    if [[ "${NO_BUILD:-false}" != "true" ]]; then
        build_images
        security_check
    fi
    
    deploy_services
    
    if [[ "${NO_HEALTH:-false}" != "true" ]]; then
        health_check
    fi
    
    show_status
    
    log "🎉 Deployment completed successfully!"
    log "Environment: $ENVIRONMENT"
    log "Project: $COMPOSE_PROJECT_NAME"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --no-build)
            NO_BUILD=true
            shift
            ;;
        --no-health)
            NO_HEALTH=true
            shift
            ;;
        --debug)
            DEBUG=true
            shift
            ;;
        --help|-h)
            show_usage
            exit 0
            ;;
        -*)
            error "Unknown option: $1"
            show_usage
            exit 1
            ;;
        *)
            if [[ -z "${ENVIRONMENT:-}" ]] || [[ "$ENVIRONMENT" == "$DEFAULT_ENVIRONMENT" ]]; then
                ENVIRONMENT="$1"
            else
                error "Multiple environments specified"
                show_usage
                exit 1
            fi
            shift
            ;;
    esac
done

# Change to project root directory
cd "$PROJECT_ROOT"

# Run main deployment
main