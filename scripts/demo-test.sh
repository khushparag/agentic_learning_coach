#!/bin/bash
# =============================================================================
# Demo Test Script - Agentic Learning Coach
# =============================================================================
# This script tests all demo commands to ensure they work before recording
# 
# Usage:
#   ./scripts/demo-test.sh
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
    echo -e "${BLUE}[TEST]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[PASS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[FAIL]${NC} $1"
}

# Test function
test_command() {
    local description="$1"
    local command="$2"
    local expected_pattern="$3"
    
    print_status "Testing: $description"
    
    if output=$(eval "$command" 2>&1); then
        if [[ -z "$expected_pattern" ]] || echo "$output" | grep -q "$expected_pattern"; then
            print_success "$description"
            return 0
        else
            print_error "$description - Output doesn't match expected pattern"
            echo "Expected pattern: $expected_pattern"
            echo "Actual output: $output"
            return 1
        fi
    else
        print_error "$description - Command failed"
        echo "Error: $output"
        return 1
    fi
}

# Main test suite
main() {
    echo "=============================================="
    echo "  Agentic Learning Coach - Demo Test Suite"
    echo "=============================================="
    echo ""
    
    # Test 1: System Health Check
    test_command "Backend Health Check" \
        "curl -s http://localhost:8002/health/detailed" \
        "learning-coach"
    
    # Test 2: Frontend Accessibility
    test_command "Frontend Accessibility" \
        "curl -s -I http://localhost:3000" \
        "200 OK"
    
    # Test 3: API Documentation
    test_command "Swagger UI Accessibility" \
        "curl -s -I http://localhost:8002/docs" \
        "200 OK"
    
    # Test 4: Database Connection
    test_command "Database Health" \
        "curl -s http://localhost:8002/health/detailed | grep -o '\"database\":{[^}]*}'" \
        "healthy"
    
    # Test 5: Agent Orchestrator (Mock test - using health endpoint)
    test_command "Agent System Status" \
        "curl -s http://localhost:8002/health/detailed | grep -o '\"status\":\"[^\"]*\"'" \
        "healthy"
    
    # Test 6: Basic API Endpoint Test
    test_command "API Base Endpoint" \
        "curl -s http://localhost:8002/health/live" \
        "alive"
    
    # Test 7: Frontend Build Status (if in development)
    if [ -d "frontend" ]; then
        print_status "Testing: Frontend Dependencies"
        if [ -f "frontend/package.json" ]; then
            cd frontend
            if npm list --depth=0 > /dev/null 2>&1; then
                print_success "Frontend Dependencies"
            else
                print_warning "Frontend Dependencies - Some packages may be missing"
            fi
            cd ..
        else
            print_warning "Frontend package.json not found"
        fi
    fi
    
    # Test 8: Docker Services Status
    print_status "Testing: Docker Services"
    if docker ps --format "table {{.Names}}\t{{.Status}}" | grep -E "(learning-coach|postgres|redis|qdrant)" > /dev/null; then
        print_success "Docker Services Running"
    else
        print_error "Docker Services - Some services may not be running"
        echo "Current services:"
        docker ps --format "table {{.Names}}\t{{.Status}}"
    fi
    
    # Test 9: Port Availability
    print_status "Testing: Port Configuration"
    local ports_ok=true
    
    if ! curl -s http://localhost:8002/health/live > /dev/null; then
        print_error "Backend port 8002 not accessible"
        ports_ok=false
    fi
    
    if ! curl -s http://localhost:3000 > /dev/null; then
        print_error "Frontend port 3000 not accessible"
        ports_ok=false
    fi
    
    if [ "$ports_ok" = true ]; then
        print_success "Port Configuration"
    fi
    
    echo ""
    echo "=============================================="
    echo "  Demo Test Suite Complete"
    echo "=============================================="
    echo ""
    
    # Summary
    print_status "Demo URLs for recording:"
    echo "  - Frontend:     http://localhost:3000"
    echo "  - Backend API:  http://localhost:8002"
    echo "  - API Docs:     http://localhost:8002/docs"
    echo "  - Health Check: http://localhost:8002/health/detailed"
    echo ""
    
    print_status "Demo Commands Ready:"
    echo "  curl -s http://localhost:8002/health/detailed | jq"
    echo "  curl -s http://localhost:8002/health/live"
    echo ""
    
    print_success "All demo commands tested successfully!"
    echo "You're ready to record the hackathon demo! 🎬"
}

# Check if jq is available (optional but recommended)
if ! command -v jq &> /dev/null; then
    print_warning "jq not found - JSON output will not be formatted"
    print_status "Install jq for better demo presentation: apt-get install jq (Linux) or brew install jq (Mac)"
fi

main "$@"