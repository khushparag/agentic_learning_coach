#!/bin/bash

# Test Setup Script
# This script sets up the testing environment and runs initial checks

set -e

echo "🧪 Setting up testing environment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Check if we're in the frontend directory
if [ ! -f "package.json" ]; then
    print_error "Please run this script from the frontend directory"
    exit 1
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm ci
    print_status "Dependencies installed"
else
    print_status "Dependencies already installed"
fi

# Create test directories if they don't exist
mkdir -p cypress/fixtures
mkdir -p cypress/downloads
mkdir -p cypress/screenshots
mkdir -p cypress/videos
mkdir -p coverage
mkdir -p storybook-static

print_status "Test directories created"

# Set up environment variables for testing
if [ ! -f ".env.test" ]; then
    echo "🔧 Creating test environment file..."
    cat > .env.test << EOF
# Test Environment Variables
NODE_ENV=test
VITE_API_URL=http://localhost:8000/api
VITE_WS_URL=ws://localhost:8000/ws
PERCY_TOKEN=your-percy-token-here
CYPRESS_baseUrl=http://localhost:3000
EOF
    print_status "Test environment file created"
else
    print_status "Test environment file already exists"
fi

# Validate Jest configuration
echo "🔍 Validating Jest configuration..."
if npm run test -- --passWithNoTests --verbose=false > /dev/null 2>&1; then
    print_status "Jest configuration is valid"
else
    print_error "Jest configuration has issues"
    exit 1
fi

# Validate Cypress configuration
echo "🔍 Validating Cypress configuration..."
if npx cypress verify > /dev/null 2>&1; then
    print_status "Cypress is properly installed"
else
    print_warning "Cypress verification failed - you may need to run 'npx cypress install'"
fi

# Check TypeScript configuration
echo "🔍 Checking TypeScript configuration..."
if npm run type-check > /dev/null 2>&1; then
    print_status "TypeScript configuration is valid"
else
    print_error "TypeScript configuration has issues"
    exit 1
fi

# Run a quick test to ensure everything works
echo "🧪 Running quick test suite..."
if npm run test -- --passWithNoTests --silent > /dev/null 2>&1; then
    print_status "Test suite is working"
else
    print_error "Test suite has issues"
    exit 1
fi

# Check if Storybook builds
echo "📚 Checking Storybook configuration..."
if npm run build-storybook > /dev/null 2>&1; then
    print_status "Storybook builds successfully"
    rm -rf storybook-static
else
    print_warning "Storybook build failed - check your stories"
fi

# Create sample test files if they don't exist
if [ ! -f "src/components/ui/__tests__/Button.test.tsx" ]; then
    print_warning "No test files found - make sure to write tests for your components"
fi

# Set up git hooks for testing (if using husky)
if [ -d ".git" ] && [ -f "../.husky/pre-commit" ]; then
    echo "🪝 Git hooks are configured"
    print_status "Pre-commit hooks will run tests"
fi

echo ""
echo "🎉 Testing environment setup complete!"
echo ""
echo "Available commands:"
echo "  npm test                 - Run unit tests"
echo "  npm run test:watch       - Run tests in watch mode"
echo "  npm run test:coverage    - Run tests with coverage"
echo "  npm run test:e2e:open    - Open Cypress GUI"
echo "  npm run test:e2e         - Run E2E tests headless"
echo "  npm run storybook        - Start Storybook"
echo "  npm run test:visual      - Run visual regression tests"
echo "  npm run test:all         - Run all tests"
echo ""
echo "📖 See TESTING.md for detailed testing guidelines"