# Docker Deployment Guide - Agentic Learning Coach

## Overview

This guide provides comprehensive instructions for deploying the Agentic Learning Coach system using Docker, following security best practices, clean architecture principles, and production-ready configurations.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Start](#quick-start)
3. [Environment Configuration](#environment-configuration)
4. [Security Configuration](#security-configuration)
5. [Monitoring and Observability](#monitoring-and-observability)
6. [Production Deployment](#production-deployment)
7. [Troubleshooting](#troubleshooting)
8. [Maintenance](#maintenance)

## Prerequisites

### System Requirements

- **Docker**: Version 20.10+ with BuildKit support
- **Docker Compose**: Version 2.0+ (or Docker Compose Plugin)
- **System Resources**:
  - Minimum: 4GB RAM, 2 CPU cores, 20GB disk space
  - Recommended: 8GB RAM, 4 CPU cores, 50GB disk space
- **Operating System**: Linux (Ubuntu 20.04+), macOS, or Windows with WSL2

### Security Requirements

- **Non-root user** with Docker permissions
- **Firewall** configured to restrict external access
- **SSL/TLS certificates** for production deployment
- **Secrets management** system (recommended for production)

### Network Requirements

- **Ports**: 3000 (frontend), 8000 (API), 8001 (runner), 5432 (postgres), 6379 (redis), 6333 (qdrant)
- **Internet access** for image downloads and external API calls
- **Internal network** for service communication

## Quick Start

### Development Environment

```bash
# Clone the repository
git clone <repository-url>
cd agentic-learning-coach

# Start development environment
./scripts/docker-deploy.sh development

# Or using docker-compose directly
docker-compose up -d
```

### Access the Application

- **Frontend**: http://localhost:3000
- **API Documentation**: http://localhost:8000/docs
- **Health Checks**: http://localhost:3000/health

## Environment Configuration

### Environment Files

Create environment-specific configuration files:

```bash
# Development
cp .env.example .env.development

# Staging
cp .env.example .env.staging

# Production
cp .env.example .env.production
```

### Key Configuration Variables

#### Application Settings
```bash
# Environment
ENVIRONMENT=production
DEBUG=false
LOG_LEVEL=INFO

# Security
SECRET_KEY=your-secret-key-here
JWT_SECRET_KEY=your-jwt-secret-here
JWT_EXPIRE_MINUTES=30

# Database
POSTGRES_DB=learning_coach
POSTGRES_USER=postgres
POSTGRES_PASSWORD=secure-password
DATABASE_URL=postgresql://user:pass@postgres:5432/db

# Redis
REDIS_URL=redis://redis:6379
REDIS_PASSWORD=secure-redis-password

# Qdrant
QDRANT_URL=http://qdrant:6333
QDRANT_API_KEY=your-qdrant-api-key
```

#### Frontend Settings
```bash
# API Configuration
VITE_API_BASE_URL=https://api.your-domain.com
VITE_WS_URL=wss://api.your-domain.com

# Feature Flags
VITE_FEATURE_SOCIAL_LEARNING=true
VITE_FEATURE_GAMIFICATION=true
VITE_FEATURE_ANALYTICS=true

# Performance
VITE_API_TIMEOUT=15000
VITE_MAX_FILE_SIZE=5242880
```

## Security Configuration

### Container Security

The system implements multiple security layers:

#### 1. User Security
- All containers run as **non-root users**
- Minimal user privileges with specific UIDs/GIDs
- No unnecessary capabilities granted

#### 2. Filesystem Security
- **Read-only root filesystems** where possible
- Temporary filesystems for writable areas
- Secure file permissions and ownership

#### 3. Network Security
- **Isolated Docker networks** for service communication
- No unnecessary port exposure
- Rate limiting and request filtering

#### 4. Resource Security
- **Resource limits** to prevent DoS attacks
- Process limits (PID limits)
- Memory and CPU constraints

### Security Deployment

```bash
# Deploy with security hardening
docker-compose -f docker-compose.yml -f docker-security.yml up -d

# Run security scan (requires trivy)
trivy image learning-coach-frontend:latest
trivy image learning-coach-coach-service:latest
```

### Security Monitoring

Enable security monitoring features:

```bash
# Environment variables for security monitoring
SECURITY_MONITORING=true
INTRUSION_DETECTION=true
SUSPICIOUS_REQUEST_LOGGING=true
RATE_LIMIT_MONITORING=true
```

## Monitoring and Observability

### Monitoring Stack

Deploy comprehensive monitoring:

```bash
# Start with monitoring
docker-compose -f docker-compose.yml -f docker-compose.monitoring.yml up -d
```

### Monitoring Services

- **Prometheus**: Metrics collection (http://localhost:9090)
- **Grafana**: Visualization dashboards (http://localhost:3001)
- **Loki**: Log aggregation (http://localhost:3100)
- **Jaeger**: Distributed tracing (http://localhost:16686)
- **AlertManager**: Alert management (http://localhost:9093)

### Key Metrics

#### Application Metrics
- Request rate and response times
- Error rates and status codes
- Agent communication success/failure
- Learning progress velocity
- Code execution metrics

#### System Metrics
- CPU, memory, and disk usage
- Container health and restarts
- Network latency and throughput
- Database connection pools

#### Security Metrics
- Failed authentication attempts
- Rate limit violations
- Suspicious code execution patterns
- Unauthorized access attempts

### Alerting Rules

Configure alerts for:
- **Critical**: Service down, high error rates, security incidents
- **Warning**: High resource usage, performance degradation
- **Info**: Learning progress insights, system updates

## Production Deployment

### Pre-deployment Checklist

- [ ] **Environment variables** configured and secured
- [ ] **SSL/TLS certificates** obtained and configured
- [ ] **Database backups** configured
- [ ] **Monitoring** and alerting set up
- [ ] **Security scanning** completed
- [ ] **Load testing** performed
- [ ] **Disaster recovery** plan documented

### Production Deployment Steps

```bash
# 1. Prepare production environment
export ENVIRONMENT=production
cp .env.example .env.production
# Edit .env.production with production values

# 2. Deploy with production configuration
./scripts/docker-deploy.sh production

# 3. Verify deployment
./scripts/docker-deploy.sh production --no-build --health-check

# 4. Enable monitoring
docker-compose -f docker-compose.yml -f docker-compose.prod.yml -f docker-compose.monitoring.yml up -d
```

### Reverse Proxy Configuration

Use nginx or similar for SSL termination:

```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    location /api/ {
        proxy_pass http://localhost:8000/;
        # Additional API-specific configuration
    }
}
```

### Database Configuration

#### PostgreSQL Production Settings

```sql
-- Performance tuning
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
ALTER SYSTEM SET maintenance_work_mem = '64MB';
ALTER SYSTEM SET checkpoint_completion_target = 0.9;
ALTER SYSTEM SET wal_buffers = '16MB';
ALTER SYSTEM SET default_statistics_target = 100;

-- Security settings
ALTER SYSTEM SET ssl = on;
ALTER SYSTEM SET log_connections = on;
ALTER SYSTEM SET log_disconnections = on;
ALTER SYSTEM SET log_statement = 'all';

SELECT pg_reload_conf();
```

#### Backup Configuration

```bash
# Automated backup script
#!/bin/bash
BACKUP_DIR="/backups/postgres"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/learning_coach_$DATE.sql"

# Create backup
docker exec learning-coach-postgres pg_dump -U postgres learning_coach > "$BACKUP_FILE"

# Compress backup
gzip "$BACKUP_FILE"

# Retain only last 7 days
find "$BACKUP_DIR" -name "*.sql.gz" -mtime +7 -delete
```

## Troubleshooting

### Common Issues

#### 1. Service Won't Start

```bash
# Check service logs
docker-compose logs service-name

# Check service health
docker-compose ps

# Restart specific service
docker-compose restart service-name
```

#### 2. Database Connection Issues

```bash
# Check database logs
docker-compose logs postgres

# Test database connection
docker exec -it learning-coach-postgres psql -U postgres -d learning_coach

# Check network connectivity
docker exec learning-coach-coach-service ping postgres
```

#### 3. Frontend Build Issues

```bash
# Rebuild frontend with verbose output
docker-compose build --no-cache frontend

# Check build logs
docker-compose logs frontend

# Test frontend health
curl http://localhost:3000/health
```

#### 4. Performance Issues

```bash
# Check resource usage
docker stats

# Check system metrics
docker exec learning-coach-node-exporter curl localhost:9100/metrics

# Review monitoring dashboards
# Open http://localhost:3001 (Grafana)
```

### Debug Mode

Enable debug mode for detailed logging:

```bash
# Set debug environment
export DEBUG=true
export LOG_LEVEL=DEBUG

# Deploy with debug
./scripts/docker-deploy.sh development --debug
```

### Health Checks

Run comprehensive health checks:

```bash
# Quick health check
curl http://localhost:3000/health
curl http://localhost:8000/health/live
curl http://localhost:8001/health

# Detailed health check
./frontend/healthcheck.sh status
```

## Maintenance

### Regular Maintenance Tasks

#### Daily
- [ ] Check service health and logs
- [ ] Monitor resource usage
- [ ] Review security alerts

#### Weekly
- [ ] Update Docker images
- [ ] Clean up unused containers and images
- [ ] Review performance metrics
- [ ] Test backup restoration

#### Monthly
- [ ] Security vulnerability scan
- [ ] Performance optimization review
- [ ] Capacity planning assessment
- [ ] Documentation updates

### Update Procedures

#### Application Updates

```bash
# 1. Backup current state
docker-compose exec postgres pg_dump -U postgres learning_coach > backup.sql

# 2. Pull latest changes
git pull origin main

# 3. Rebuild and deploy
./scripts/docker-deploy.sh production

# 4. Run database migrations
docker-compose exec coach-service alembic upgrade head

# 5. Verify deployment
./scripts/docker-deploy.sh production --no-build --health-check
```

#### Security Updates

```bash
# Update base images
docker-compose pull

# Rebuild with latest security patches
docker-compose build --no-cache

# Deploy updated images
docker-compose up -d
```

### Cleanup Procedures

```bash
# Remove unused containers
docker container prune -f

# Remove unused images
docker image prune -f

# Remove unused volumes (CAUTION: This removes data)
docker volume prune -f

# Remove unused networks
docker network prune -f

# Complete cleanup (CAUTION: This removes everything)
docker system prune -a -f
```

## Support and Resources

### Documentation
- [Architecture Guide](./docs/architecture.md)
- [API Documentation](http://localhost:8000/docs)
- [Security Guidelines](./docs/security.md)

### Monitoring
- [Grafana Dashboards](http://localhost:3001)
- [Prometheus Metrics](http://localhost:9090)
- [Log Analysis](http://localhost:3100)

### Community
- [GitHub Issues](https://github.com/learning-coach/issues)
- [Discord Community](https://discord.gg/learning-coach)
- [Documentation Wiki](https://wiki.learning-coach.com)

---

**Note**: This deployment guide follows the clean architecture principles and security guidelines outlined in the project's steering documents. Always review and adapt configurations based on your specific security and compliance requirements.