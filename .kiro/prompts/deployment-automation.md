---
description: Automate deployment process with health checks and rollback capability
---

# Deployment Automation Prompt

Automate the deployment process for the Agentic Learning Coach application with comprehensive health checks and rollback capability.

## Context
You are deploying a multi-service application with:
- FastAPI backend with 7 specialized agents
- PostgreSQL database with migrations
- Qdrant vector database
- Code runner service
- Frontend React application

## Input Parameters
- **environment**: Target environment (staging, production)
- **version**: Application version to deploy
- **rollback_version**: Previous version for rollback (optional)
- **health_check_timeout**: Maximum time to wait for health checks (default: 300s)

## Deployment Process

### 1. Pre-Deployment Validation
```bash
# Validate environment configuration
echo "🔍 Validating deployment environment: ${environment}"

# Check required environment variables
required_vars=("DATABASE_URL" "QDRANT_URL" "OPENAI_API_KEY" "JWT_SECRET")
for var in "${required_vars[@]}"; do
    if [[ -z "${!var}" ]]; then
        echo "❌ Missing required environment variable: $var"
        exit 1
    fi
done

# Validate Docker images exist
docker pull learning-coach-api:${version}
docker pull learning-coach-frontend:${version}
docker pull learning-coach-runner:${version}
```

### 2. Database Migration
```bash
# Run database migrations
echo "🗄️ Running database migrations..."
docker run --rm \
    --network learning-coach-network \
    -e DATABASE_URL="${DATABASE_URL}" \
    learning-coach-api:${version} \
    alembic upgrade head

if [[ $? -ne 0 ]]; then
    echo "❌ Database migration failed"
    exit 1
fi
```

### 3. Service Deployment
```bash
# Deploy services with rolling update
echo "🚀 Deploying services..."

# Update docker-compose with new version
sed -i "s/image: learning-coach-api:.*/image: learning-coach-api:${version}/" docker-compose.${environment}.yml
sed -i "s/image: learning-coach-frontend:.*/image: learning-coach-frontend:${version}/" docker-compose.${environment}.yml
sed -i "s/image: learning-coach-runner:.*/image: learning-coach-runner:${version}/" docker-compose.${environment}.yml

# Deploy with zero-downtime strategy
docker-compose -f docker-compose.${environment}.yml up -d --no-deps --scale api=2 api
sleep 30
docker-compose -f docker-compose.${environment}.yml up -d --no-deps --scale api=1 api
```

### 4. Health Check Validation
```bash
# Comprehensive health checks
echo "🏥 Running health checks..."

health_check_url="http://localhost:8000/health/detailed"
timeout=${health_check_timeout:-300}
start_time=$(date +%s)

while true; do
    current_time=$(date +%s)
    elapsed=$((current_time - start_time))
    
    if [[ $elapsed -gt $timeout ]]; then
        echo "❌ Health check timeout after ${timeout}s"
        exit 1
    fi
    
    response=$(curl -s -o /dev/null -w "%{http_code}" $health_check_url)
    if [[ $response -eq 200 ]]; then
        echo "✅ Health check passed"
        break
    fi
    
    echo "⏳ Waiting for services to be healthy... (${elapsed}s/${timeout}s)"
    sleep 10
done
```

### 5. Functional Testing
```bash
# Run smoke tests
echo "🧪 Running smoke tests..."

# Test API endpoints
curl -f http://localhost:8000/api/v1/health || exit 1
curl -f http://localhost:8000/api/v1/goals || exit 1
curl -f http://localhost:8000/api/v1/curriculum || exit 1

# Test agent communication
curl -f -X POST http://localhost:8000/api/v1/agents/orchestrator/route \
    -H "Content-Type: application/json" \
    -d '{"intent": "health_check", "payload": {}}' || exit 1

echo "✅ Smoke tests passed"
```

### 6. Performance Validation
```bash
# Basic performance test
echo "⚡ Running performance validation..."

# Test response times
response_time=$(curl -o /dev/null -s -w "%{time_total}" http://localhost:8000/health)
if (( $(echo "$response_time > 2.0" | bc -l) )); then
    echo "⚠️ Warning: Health endpoint response time: ${response_time}s (>2s)"
fi

# Test concurrent requests
ab -n 100 -c 10 http://localhost:8000/health > /dev/null
if [[ $? -eq 0 ]]; then
    echo "✅ Performance validation passed"
else
    echo "⚠️ Performance validation failed"
fi
```

## Rollback Process

### Automatic Rollback Triggers
- Health checks fail after deployment
- Critical errors in application logs
- Performance degradation >50%
- Database connection failures

### Rollback Execution
```bash
if [[ -n "$rollback_version" ]]; then
    echo "🔄 Rolling back to version: $rollback_version"
    
    # Update images to rollback version
    sed -i "s/image: learning-coach-api:.*/image: learning-coach-api:${rollback_version}/" docker-compose.${environment}.yml
    sed -i "s/image: learning-coach-frontend:.*/image: learning-coach-frontend:${rollback_version}/" docker-compose.${environment}.yml
    sed -i "s/image: learning-coach-runner:.*/image: learning-coach-runner:${rollback_version}/" docker-compose.${environment}.yml
    
    # Deploy rollback version
    docker-compose -f docker-compose.${environment}.yml up -d
    
    # Verify rollback health
    sleep 30
    curl -f http://localhost:8000/health || exit 1
    
    echo "✅ Rollback completed successfully"
fi
```

## Monitoring & Alerts

### Post-Deployment Monitoring
```bash
# Set up monitoring alerts
echo "📊 Configuring post-deployment monitoring..."

# Check error rates
error_rate=$(curl -s http://localhost:8000/metrics | grep error_rate | awk '{print $2}')
if (( $(echo "$error_rate > 0.05" | bc -l) )); then
    echo "⚠️ High error rate detected: ${error_rate}"
fi

# Monitor memory usage
memory_usage=$(docker stats --no-stream --format "table {{.Container}}\t{{.MemUsage}}" | grep learning-coach)
echo "💾 Memory usage: $memory_usage"

# Check database connections
db_connections=$(docker exec learning-coach-postgres psql -U postgres -c "SELECT count(*) FROM pg_stat_activity;" -t | xargs)
echo "🔗 Database connections: $db_connections"
```

## Expected Output

### Successful Deployment
```
🔍 Validating deployment environment: production
✅ All environment variables present
✅ Docker images validated
🗄️ Running database migrations...
✅ Database migrations completed
🚀 Deploying services...
✅ Services deployed successfully
🏥 Running health checks...
✅ Health check passed
🧪 Running smoke tests...
✅ Smoke tests passed
⚡ Running performance validation...
✅ Performance validation passed
📊 Configuring post-deployment monitoring...
💾 Memory usage: learning-coach-api: 256MB / 512MB
🔗 Database connections: 5

🎉 Deployment completed successfully!
Version: v1.2.3
Environment: production
Health Status: ✅ All systems operational
```

### Rollback Scenario
```
❌ Health check timeout after 300s
🔄 Rolling back to version: v1.2.2
✅ Rollback completed successfully

📧 Alert sent to deployment team
📋 Incident report created: DEPLOY-2026-001
```

## Usage Examples

### Production Deployment
```bash
kiro deployment-automation \
    --environment production \
    --version v1.2.3 \
    --rollback_version v1.2.2 \
    --health_check_timeout 600
```

### Staging Deployment
```bash
kiro deployment-automation \
    --environment staging \
    --version v1.2.3-rc1
```

## Integration with CI/CD

### GitHub Actions Integration
```yaml
- name: Deploy to Production
  uses: kiro-ai/deployment-automation@v1
  with:
    environment: production
    version: ${{ github.sha }}
    rollback_version: ${{ env.PREVIOUS_VERSION }}
```

### Jenkins Integration
```groovy
stage('Deploy') {
    steps {
        sh """
            kiro deployment-automation \
                --environment ${ENVIRONMENT} \
                --version ${BUILD_NUMBER} \
                --rollback_version ${PREVIOUS_BUILD}
        """
    }
}
```

This prompt provides comprehensive deployment automation with health checks, rollback capability, and monitoring integration for production-ready deployments.