#!/bin/sh
# =============================================================================
# Docker Entrypoint Script for Learning Coach Frontend
# =============================================================================
# This script injects environment variables into the built React app at runtime
# and starts nginx. This allows for dynamic configuration without rebuilding.
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "${GREEN}🚀 Starting Learning Coach Frontend...${NC}"

# Default environment variables
export VITE_API_BASE_URL=${VITE_API_BASE_URL:-"http://localhost:8000"}
export VITE_WS_URL=${VITE_WS_URL:-"ws://localhost:8000"}
export VITE_APP_ENV=${VITE_APP_ENV:-"production"}
export VITE_APP_NAME=${VITE_APP_NAME:-"Agentic Learning Coach"}
export VITE_APP_VERSION=${VITE_APP_VERSION:-"1.0.0"}
export VITE_DEBUG=${VITE_DEBUG:-"false"}

# Feature flags with defaults
export VITE_FEATURE_SOCIAL_LEARNING=${VITE_FEATURE_SOCIAL_LEARNING:-"true"}
export VITE_FEATURE_GAMIFICATION=${VITE_FEATURE_GAMIFICATION:-"true"}
export VITE_FEATURE_ANALYTICS=${VITE_FEATURE_ANALYTICS:-"true"}
export VITE_FEATURE_REAL_TIME_UPDATES=${VITE_FEATURE_REAL_TIME_UPDATES:-"true"}
export VITE_FEATURE_CODE_SHARING=${VITE_FEATURE_CODE_SHARING:-"true"}
export VITE_FEATURE_PEER_CHALLENGES=${VITE_FEATURE_PEER_CHALLENGES:-"true"}
export VITE_FEATURE_WEBSOCKET_RECONNECT=${VITE_FEATURE_WEBSOCKET_RECONNECT:-"true"}
export VITE_FEATURE_LIVE_COLLABORATION=${VITE_FEATURE_LIVE_COLLABORATION:-"true"}
export VITE_FEATURE_REAL_TIME_LEADERBOARD=${VITE_FEATURE_REAL_TIME_LEADERBOARD:-"true"}

# Performance settings
export VITE_API_TIMEOUT=${VITE_API_TIMEOUT:-"30000"}
export VITE_MAX_FILE_SIZE=${VITE_MAX_FILE_SIZE:-"10485760"}
export VITE_IMAGE_QUALITY=${VITE_IMAGE_QUALITY:-"80"}

# UI settings
export VITE_DEFAULT_THEME=${VITE_DEFAULT_THEME:-"system"}
export VITE_ENABLE_ANIMATIONS=${VITE_ENABLE_ANIMATIONS:-"true"}
export VITE_DEFAULT_LOCALE=${VITE_DEFAULT_LOCALE:-"en-US"}

# Code editor settings
export VITE_DEFAULT_LANGUAGE=${VITE_DEFAULT_LANGUAGE:-"javascript"}
export VITE_EDITOR_MINIMAP=${VITE_EDITOR_MINIMAP:-"false"}
export VITE_EDITOR_THEME=${VITE_EDITOR_THEME:-"vs-dark"}

# Learning settings
export VITE_DEFAULT_SESSION_LENGTH=${VITE_DEFAULT_SESSION_LENGTH:-"60"}
export VITE_MAX_HINTS_PER_EXERCISE=${VITE_MAX_HINTS_PER_EXERCISE:-"3"}
export VITE_AUTOSAVE_INTERVAL=${VITE_AUTOSAVE_INTERVAL:-"30000"}

# Gamification settings
export VITE_ENABLE_XP_ANIMATIONS=${VITE_ENABLE_XP_ANIMATIONS:-"true"}
export VITE_ENABLE_ACHIEVEMENT_NOTIFICATIONS=${VITE_ENABLE_ACHIEVEMENT_NOTIFICATIONS:-"true"}
export VITE_STREAK_REMINDER_TIME=${VITE_STREAK_REMINDER_TIME:-"20:00"}

# Social features settings
export VITE_MAX_SOLUTIONS_PER_DAY=${VITE_MAX_SOLUTIONS_PER_DAY:-"10"}
export VITE_MAX_CHALLENGES_PER_DAY=${VITE_MAX_CHALLENGES_PER_DAY:-"5"}
export VITE_MAX_STUDY_GROUP_MEMBERS=${VITE_MAX_STUDY_GROUP_MEMBERS:-"20"}

echo "${YELLOW}📋 Environment Configuration:${NC}"
echo "  API Base URL: ${VITE_API_BASE_URL}"
echo "  WebSocket URL: ${VITE_WS_URL}"
echo "  Environment: ${VITE_APP_ENV}"
echo "  Debug Mode: ${VITE_DEBUG}"
echo "  Social Learning: ${VITE_FEATURE_SOCIAL_LEARNING}"
echo "  Gamification: ${VITE_FEATURE_GAMIFICATION}"
echo "  Real-time Updates: ${VITE_FEATURE_REAL_TIME_UPDATES}"

# Function to replace environment variables in JavaScript files
replace_env_vars() {
    local file="$1"
    echo "${YELLOW}🔧 Injecting environment variables into ${file}...${NC}"
    
    # Create a temporary file with environment variable substitutions
    envsubst '
        $VITE_API_BASE_URL
        $VITE_WS_URL
        $VITE_APP_ENV
        $VITE_APP_NAME
        $VITE_APP_VERSION
        $VITE_DEBUG
        $VITE_FEATURE_SOCIAL_LEARNING
        $VITE_FEATURE_GAMIFICATION
        $VITE_FEATURE_ANALYTICS
        $VITE_FEATURE_REAL_TIME_UPDATES
        $VITE_FEATURE_CODE_SHARING
        $VITE_FEATURE_PEER_CHALLENGES
        $VITE_FEATURE_WEBSOCKET_RECONNECT
        $VITE_FEATURE_LIVE_COLLABORATION
        $VITE_FEATURE_REAL_TIME_LEADERBOARD
        $VITE_API_TIMEOUT
        $VITE_MAX_FILE_SIZE
        $VITE_IMAGE_QUALITY
        $VITE_DEFAULT_THEME
        $VITE_ENABLE_ANIMATIONS
        $VITE_DEFAULT_LOCALE
        $VITE_DEFAULT_LANGUAGE
        $VITE_EDITOR_MINIMAP
        $VITE_EDITOR_THEME
        $VITE_DEFAULT_SESSION_LENGTH
        $VITE_MAX_HINTS_PER_EXERCISE
        $VITE_AUTOSAVE_INTERVAL
        $VITE_ENABLE_XP_ANIMATIONS
        $VITE_ENABLE_ACHIEVEMENT_NOTIFICATIONS
        $VITE_STREAK_REMINDER_TIME
        $VITE_MAX_SOLUTIONS_PER_DAY
        $VITE_MAX_CHALLENGES_PER_DAY
        $VITE_MAX_STUDY_GROUP_MEMBERS
    ' < "$file" > "${file}.tmp"
    
    # Replace the original file
    mv "${file}.tmp" "$file"
}

# Create environment configuration file for runtime access
echo "${YELLOW}📝 Creating runtime environment configuration...${NC}"
cat > /usr/share/nginx/html/env-config.js << EOF
// Runtime Environment Configuration
// This file is generated at container startup and contains environment variables
window.__ENV__ = {
  VITE_API_BASE_URL: "${VITE_API_BASE_URL}",
  VITE_WS_URL: "${VITE_WS_URL}",
  VITE_APP_ENV: "${VITE_APP_ENV}",
  VITE_APP_NAME: "${VITE_APP_NAME}",
  VITE_APP_VERSION: "${VITE_APP_VERSION}",
  VITE_DEBUG: ${VITE_DEBUG},
  VITE_FEATURE_SOCIAL_LEARNING: ${VITE_FEATURE_SOCIAL_LEARNING},
  VITE_FEATURE_GAMIFICATION: ${VITE_FEATURE_GAMIFICATION},
  VITE_FEATURE_ANALYTICS: ${VITE_FEATURE_ANALYTICS},
  VITE_FEATURE_REAL_TIME_UPDATES: ${VITE_FEATURE_REAL_TIME_UPDATES},
  VITE_FEATURE_CODE_SHARING: ${VITE_FEATURE_CODE_SHARING},
  VITE_FEATURE_PEER_CHALLENGES: ${VITE_FEATURE_PEER_CHALLENGES},
  VITE_FEATURE_WEBSOCKET_RECONNECT: ${VITE_FEATURE_WEBSOCKET_RECONNECT},
  VITE_FEATURE_LIVE_COLLABORATION: ${VITE_FEATURE_LIVE_COLLABORATION},
  VITE_FEATURE_REAL_TIME_LEADERBOARD: ${VITE_FEATURE_REAL_TIME_LEADERBOARD},
  VITE_API_TIMEOUT: ${VITE_API_TIMEOUT},
  VITE_MAX_FILE_SIZE: ${VITE_MAX_FILE_SIZE},
  VITE_IMAGE_QUALITY: ${VITE_IMAGE_QUALITY},
  VITE_DEFAULT_THEME: "${VITE_DEFAULT_THEME}",
  VITE_ENABLE_ANIMATIONS: ${VITE_ENABLE_ANIMATIONS},
  VITE_DEFAULT_LOCALE: "${VITE_DEFAULT_LOCALE}",
  VITE_DEFAULT_LANGUAGE: "${VITE_DEFAULT_LANGUAGE}",
  VITE_EDITOR_MINIMAP: ${VITE_EDITOR_MINIMAP},
  VITE_EDITOR_THEME: "${VITE_EDITOR_THEME}",
  VITE_DEFAULT_SESSION_LENGTH: ${VITE_DEFAULT_SESSION_LENGTH},
  VITE_MAX_HINTS_PER_EXERCISE: ${VITE_MAX_HINTS_PER_EXERCISE},
  VITE_AUTOSAVE_INTERVAL: ${VITE_AUTOSAVE_INTERVAL},
  VITE_ENABLE_XP_ANIMATIONS: ${VITE_ENABLE_XP_ANIMATIONS},
  VITE_ENABLE_ACHIEVEMENT_NOTIFICATIONS: ${VITE_ENABLE_ACHIEVEMENT_NOTIFICATIONS},
  VITE_STREAK_REMINDER_TIME: "${VITE_STREAK_REMINDER_TIME}",
  VITE_MAX_SOLUTIONS_PER_DAY: ${VITE_MAX_SOLUTIONS_PER_DAY},
  VITE_MAX_CHALLENGES_PER_DAY: ${VITE_MAX_CHALLENGES_PER_DAY},
  VITE_MAX_STUDY_GROUP_MEMBERS: ${VITE_MAX_STUDY_GROUP_MEMBERS}
};
EOF

# Create error pages
echo "${YELLOW}📄 Creating error pages...${NC}"
cat > /usr/share/nginx/html/api-error.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>API Error - Learning Coach</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 2rem; background: #f8fafc; }
        .container { max-width: 600px; margin: 0 auto; text-align: center; }
        .error-code { font-size: 4rem; font-weight: bold; color: #ef4444; margin-bottom: 1rem; }
        .error-message { font-size: 1.5rem; color: #374151; margin-bottom: 2rem; }
        .error-description { color: #6b7280; margin-bottom: 2rem; }
        .retry-button { background: #3b82f6; color: white; padding: 0.75rem 1.5rem; border: none; border-radius: 0.5rem; cursor: pointer; font-size: 1rem; }
        .retry-button:hover { background: #2563eb; }
    </style>
</head>
<body>
    <div class="container">
        <div class="error-code">🔌</div>
        <div class="error-message">API Connection Error</div>
        <div class="error-description">
            We're having trouble connecting to our servers. This might be a temporary issue.
        </div>
        <button class="retry-button" onclick="window.location.reload()">Try Again</button>
    </div>
</body>
</html>
EOF

cat > /usr/share/nginx/html/404.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Page Not Found - Learning Coach</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 2rem; background: #f8fafc; }
        .container { max-width: 600px; margin: 0 auto; text-align: center; }
        .error-code { font-size: 4rem; font-weight: bold; color: #ef4444; margin-bottom: 1rem; }
        .error-message { font-size: 1.5rem; color: #374151; margin-bottom: 2rem; }
        .error-description { color: #6b7280; margin-bottom: 2rem; }
        .home-button { background: #3b82f6; color: white; padding: 0.75rem 1.5rem; border: none; border-radius: 0.5rem; cursor: pointer; font-size: 1rem; text-decoration: none; display: inline-block; }
        .home-button:hover { background: #2563eb; }
    </style>
</head>
<body>
    <div class="container">
        <div class="error-code">404</div>
        <div class="error-message">Page Not Found</div>
        <div class="error-description">
            The page you're looking for doesn't exist or has been moved.
        </div>
        <a href="/" class="home-button">Go Home</a>
    </div>
</body>
</html>
EOF

cat > /usr/share/nginx/html/50x.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Server Error - Learning Coach</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 2rem; background: #f8fafc; }
        .container { max-width: 600px; margin: 0 auto; text-align: center; }
        .error-code { font-size: 4rem; font-weight: bold; color: #ef4444; margin-bottom: 1rem; }
        .error-message { font-size: 1.5rem; color: #374151; margin-bottom: 2rem; }
        .error-description { color: #6b7280; margin-bottom: 2rem; }
        .retry-button { background: #3b82f6; color: white; padding: 0.75rem 1.5rem; border: none; border-radius: 0.5rem; cursor: pointer; font-size: 1rem; }
        .retry-button:hover { background: #2563eb; }
    </style>
</head>
<body>
    <div class="container">
        <div class="error-code">⚠️</div>
        <div class="error-message">Server Error</div>
        <div class="error-description">
            Something went wrong on our end. We're working to fix it.
        </div>
        <button class="retry-button" onclick="window.location.reload()">Try Again</button>
    </div>
</body>
</html>
EOF

# Validate nginx configuration
echo "${YELLOW}🔍 Validating nginx configuration...${NC}"
nginx -t

if [ $? -eq 0 ]; then
    echo "${GREEN}✅ Nginx configuration is valid${NC}"
else
    echo "${RED}❌ Nginx configuration is invalid${NC}"
    exit 1
fi

# Start nginx
echo "${GREEN}🌐 Starting nginx server...${NC}"
exec "$@"