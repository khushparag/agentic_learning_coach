# =============================================================================
# Multi-stage Dockerfile for Learning Coach Frontend
# =============================================================================
# This Dockerfile builds the React frontend with optimized production builds.
#
# Stages:
#   - base: Common Node.js setup and dependencies
#   - development: Full development environment with hot reload
#   - build: Production build stage
#   - production: Optimized nginx-based production serving
#
# Usage:
#   Development: docker build --target development -t learning-coach-ui:dev .
#   Production:  docker build --target production -t learning-coach-ui:latest .
# =============================================================================

# -----------------------------------------------------------------------------
# Base Stage - Common Node.js setup
# -----------------------------------------------------------------------------
FROM node:18-alpine AS base

# Set environment variables for Node.js optimization
ENV NODE_ENV=development \
    NPM_CONFIG_LOGLEVEL=warn \
    NPM_CONFIG_FUND=false \
    NPM_CONFIG_AUDIT=false \
    NPM_CONFIG_UPDATE_NOTIFIER=false

# Install system dependencies for native modules and security tools
RUN apk add --no-cache \
    git \
    python3 \
    make \
    g++ \
    curl \
    dumb-init \
    && rm -rf /var/cache/apk/*

# Create app user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 -G nodejs

# Set work directory
WORKDIR /app

# Copy package files with proper ownership (exclude package-lock.json for cross-platform)
COPY --chown=nodejs:nodejs package.json ./

# Install all dependencies (fresh install for Linux platform)
RUN npm install --legacy-peer-deps && npm cache clean --force

# -----------------------------------------------------------------------------
# Development Stage - Full development environment
# -----------------------------------------------------------------------------
FROM base AS development

# Copy source code with proper ownership
COPY --chown=nodejs:nodejs . .

# Create necessary directories with proper permissions
RUN mkdir -p /app/node_modules/.cache && \
    mkdir -p /app/.vite && \
    chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3000

# Health check for development (Vite dev server responds on root)
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=5 \
    CMD curl -f http://localhost:3000/ || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Default command for development (with hot reload)
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

# -----------------------------------------------------------------------------
# Build Stage - Production build
# -----------------------------------------------------------------------------
FROM base AS build

# Set production environment
ENV NODE_ENV=production

# Copy source code with proper ownership
COPY --chown=nodejs:nodejs . .

# Build arguments for environment configuration
ARG VITE_API_BASE_URL=http://localhost:8000
ARG VITE_WS_URL=ws://localhost:8000
ARG VITE_APP_ENV=production
ARG VITE_APP_NAME="Agentic Learning Coach"
ARG VITE_APP_VERSION=1.0.0
ARG VITE_DEBUG=false

# Feature flags build args
ARG VITE_FEATURE_SOCIAL_LEARNING=true
ARG VITE_FEATURE_GAMIFICATION=true
ARG VITE_FEATURE_ANALYTICS=true
ARG VITE_FEATURE_REAL_TIME_UPDATES=true

# Set build-time environment variables
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL \
    VITE_WS_URL=$VITE_WS_URL \
    VITE_APP_ENV=$VITE_APP_ENV \
    VITE_APP_NAME=$VITE_APP_NAME \
    VITE_APP_VERSION=$VITE_APP_VERSION \
    VITE_DEBUG=$VITE_DEBUG \
    VITE_FEATURE_SOCIAL_LEARNING=$VITE_FEATURE_SOCIAL_LEARNING \
    VITE_FEATURE_GAMIFICATION=$VITE_FEATURE_GAMIFICATION \
    VITE_FEATURE_ANALYTICS=$VITE_FEATURE_ANALYTICS \
    VITE_FEATURE_REAL_TIME_UPDATES=$VITE_FEATURE_REAL_TIME_UPDATES

# Switch to non-root user for build
USER nodejs

# Build the application
RUN npm run build || (echo "Build failed, trying without type-check" && npm run build -- --mode production)

# Verify build output
RUN ls -la dist/ && \
    test -f dist/index.html || (echo "Build failed: index.html not found" && exit 1)

# -----------------------------------------------------------------------------
# Production Stage - Nginx-based serving
# -----------------------------------------------------------------------------
FROM nginx:1.25-alpine AS production

# Install security tools and curl for health checks
RUN apk add --no-cache \
    curl \
    dumb-init \
    && rm -rf /var/cache/apk/*

# Remove default nginx configuration and content
RUN rm /etc/nginx/conf.d/default.conf && \
    rm -rf /usr/share/nginx/html/*

# Copy custom nginx configuration
COPY --chown=root:root nginx.conf /etc/nginx/nginx.conf
COPY --chown=root:root nginx.prod.conf /etc/nginx/conf.d/default.conf

# Copy built application from build stage
COPY --from=build --chown=nginx:nginx /app/dist /usr/share/nginx/html

# Copy environment configuration script
COPY --chown=root:root docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Create nginx user and set secure permissions
RUN addgroup -g 101 -S nginx || true && \
    adduser -S -D -H -u 101 -h /var/cache/nginx -s /sbin/nologin -G nginx -g nginx nginx || true && \
    chown -R nginx:nginx /usr/share/nginx/html && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    chown -R nginx:nginx /etc/nginx/conf.d && \
    touch /var/run/nginx.pid && \
    chown nginx:nginx /var/run/nginx.pid

# Create necessary directories for nginx
RUN mkdir -p /var/cache/nginx/client_temp && \
    mkdir -p /var/cache/nginx/proxy_temp && \
    mkdir -p /var/cache/nginx/fastcgi_temp && \
    mkdir -p /var/cache/nginx/uwsgi_temp && \
    mkdir -p /var/cache/nginx/scgi_temp && \
    chown -R nginx:nginx /var/cache/nginx

# Security: Remove unnecessary packages and files
RUN apk del --no-cache \
    && rm -rf /tmp/* /var/tmp/* \
    && find /usr/share/nginx/html -name "*.map" -delete

# Switch to non-root user
USER nginx

# Expose port
EXPOSE 3000

# Health check for production with better error handling
HEALTHCHECK --interval=15s --timeout=5s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--", "/docker-entrypoint.sh"]

# Default command
CMD ["nginx", "-g", "daemon off;"]

# -----------------------------------------------------------------------------
# Metadata
# -----------------------------------------------------------------------------
LABEL maintainer="Learning Coach Team" \
      description="Frontend for Agentic Learning Coach" \
      version="1.0.0" \
      org.opencontainers.image.source="https://github.com/learning-coach/frontend"