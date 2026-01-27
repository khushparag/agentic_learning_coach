#!/bin/sh
# =============================================================================
# Frontend Health Check Script
# =============================================================================
# Comprehensive health check for the frontend container
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
HEALTH_ENDPOINT="http://localhost:3000/health"
TIMEOUT=5
MAX_RETRIES=3
RETRY_DELAY=1

# Function to log messages
log() {
    echo "${GREEN}[HEALTH]${NC} $1"
}

warn() {
    echo "${YELLOW}[WARN]${NC} $1"
}

error() {
    echo "${RED}[ERROR]${NC} $1"
}

# Function to check HTTP endpoint
check_http() {
    local url="$1"
    local expected_status="${2:-200}"
    
    log "Checking HTTP endpoint: $url"
    
    # Use curl with timeout and follow redirects
    response=$(curl -s -w "%{http_code}" -o /dev/null --max-time $TIMEOUT "$url" 2>/dev/null || echo "000")
    
    if [ "$response" = "$expected_status" ]; then
        log "✅ HTTP check passed (status: $response)"
        return 0
    else
        error "❌ HTTP check failed (status: $response, expected: $expected_status)"
        return 1
    fi
}

# Function to check if nginx is running
check_nginx() {
    log "Checking nginx process..."
    
    if pgrep nginx > /dev/null; then
        log "✅ Nginx process is running"
        return 0
    else
        error "❌ Nginx process not found"
        return 1
    fi
}

# Function to check nginx configuration
check_nginx_config() {
    log "Checking nginx configuration..."
    
    if nginx -t 2>/dev/null; then
        log "✅ Nginx configuration is valid"
        return 0
    else
        error "❌ Nginx configuration is invalid"
        return 1
    fi
}

# Function to check file permissions
check_permissions() {
    log "Checking file permissions..."
    
    # Check if we can read the main index file
    if [ -r "/usr/share/nginx/html/index.html" ]; then
        log "✅ Static files are readable"
    else
        error "❌ Cannot read static files"
        return 1
    fi
    
    # Check if nginx can write to log directory
    if [ -w "/var/log/nginx" ]; then
        log "✅ Log directory is writable"
    else
        warn "⚠️ Log directory may not be writable"
    fi
    
    return 0
}

# Function to check disk space
check_disk_space() {
    log "Checking disk space..."
    
    # Get disk usage percentage for root filesystem
    usage=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
    
    if [ "$usage" -lt 90 ]; then
        log "✅ Disk space OK (${usage}% used)"
        return 0
    elif [ "$usage" -lt 95 ]; then
        warn "⚠️ Disk space getting low (${usage}% used)"
        return 0
    else
        error "❌ Disk space critical (${usage}% used)"
        return 1
    fi
}

# Function to check memory usage
check_memory() {
    log "Checking memory usage..."
    
    # Get memory usage percentage
    if [ -f "/proc/meminfo" ]; then
        total=$(grep MemTotal /proc/meminfo | awk '{print $2}')
        available=$(grep MemAvailable /proc/meminfo | awk '{print $2}')
        used=$((total - available))
        usage=$((used * 100 / total))
        
        if [ "$usage" -lt 90 ]; then
            log "✅ Memory usage OK (${usage}% used)"
            return 0
        elif [ "$usage" -lt 95 ]; then
            warn "⚠️ Memory usage high (${usage}% used)"
            return 0
        else
            error "❌ Memory usage critical (${usage}% used)"
            return 1
        fi
    else
        warn "⚠️ Cannot read memory information"
        return 0
    fi
}

# Function to perform comprehensive health check
health_check() {
    local retry_count=0
    local checks_passed=0
    local total_checks=6
    
    log "Starting comprehensive health check..."
    
    while [ $retry_count -lt $MAX_RETRIES ]; do
        checks_passed=0
        
        # Run all health checks
        check_nginx && checks_passed=$((checks_passed + 1))
        check_nginx_config && checks_passed=$((checks_passed + 1))
        check_permissions && checks_passed=$((checks_passed + 1))
        check_disk_space && checks_passed=$((checks_passed + 1))
        check_memory && checks_passed=$((checks_passed + 1))
        check_http "$HEALTH_ENDPOINT" && checks_passed=$((checks_passed + 1))
        
        # Check if all tests passed
        if [ $checks_passed -eq $total_checks ]; then
            log "🎉 All health checks passed ($checks_passed/$total_checks)"
            return 0
        fi
        
        retry_count=$((retry_count + 1))
        if [ $retry_count -lt $MAX_RETRIES ]; then
            warn "Health check failed ($checks_passed/$total_checks passed). Retrying in ${RETRY_DELAY}s... (attempt $retry_count/$MAX_RETRIES)"
            sleep $RETRY_DELAY
        fi
    done
    
    error "Health check failed after $MAX_RETRIES attempts ($checks_passed/$total_checks checks passed)"
    return 1
}

# Function to show detailed status
show_status() {
    log "=== Frontend Container Status ==="
    
    # Show nginx status
    if pgrep nginx > /dev/null; then
        log "Nginx: Running (PID: $(pgrep nginx | head -1))"
    else
        error "Nginx: Not running"
    fi
    
    # Show listening ports
    if command -v netstat > /dev/null; then
        log "Listening ports:"
        netstat -tlnp 2>/dev/null | grep :3000 || warn "Port 3000 not listening"
    fi
    
    # Show disk usage
    log "Disk usage:"
    df -h / 2>/dev/null || warn "Cannot get disk usage"
    
    # Show memory usage
    if [ -f "/proc/meminfo" ]; then
        log "Memory usage:"
        free -h 2>/dev/null || warn "Cannot get memory usage"
    fi
    
    log "=== End Status ==="
}

# Main execution
case "${1:-check}" in
    "check")
        health_check
        ;;
    "status")
        show_status
        ;;
    "quick")
        check_http "$HEALTH_ENDPOINT"
        ;;
    *)
        echo "Usage: $0 {check|status|quick}"
        echo "  check  - Run comprehensive health check (default)"
        echo "  status - Show detailed container status"
        echo "  quick  - Quick HTTP health check only"
        exit 1
        ;;
esac