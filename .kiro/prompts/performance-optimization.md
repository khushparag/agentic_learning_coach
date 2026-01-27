---
description: Performance monitoring and optimization for multi-agent learning system
---

# Performance Optimization Prompt

Monitor, analyze, and optimize performance across the Agentic Learning Coach system including agent response times, database queries, API endpoints, and resource utilization.

## Context
You are optimizing a multi-agent learning system with:
- 7 specialized agents with complex interactions
- 47+ API endpoints with varying load patterns
- PostgreSQL with complex queries and joins
- Qdrant vector database for semantic search
- Code execution service with resource constraints
- React frontend with real-time features

## Input Parameters
- **component**: Component to optimize (agents, api, database, frontend, all)
- **metric**: Target metric (response_time, throughput, memory, cpu, all)
- **threshold**: Performance threshold to maintain
- **duration**: Monitoring duration in minutes (default: 60)
- **environment**: Environment to monitor (local, staging, production)

## Performance Monitoring

### 1. Agent Performance Analysis
```bash
echo "🤖 Analyzing agent performance..."

# Monitor agent response times
monitor_agent_performance() {
    local agent_name=$1
    echo "Monitoring ${agent_name} agent..."
    
    # Measure response times over time
    for i in {1..100}; do
        start_time=$(date +%s%N)
        
        # Test agent endpoint
        curl -s -X POST http://localhost:8000/api/v1/agents/${agent_name}/process \
            -H "Content-Type: application/json" \
            -d '{"intent": "test", "payload": {}}' > /dev/null
        
        end_time=$(date +%s%N)
        response_time=$(( (end_time - start_time) / 1000000 ))
        
        echo "${i},${response_time}" >> agent_${agent_name}_times.csv
        sleep 1
    done
    
    # Calculate statistics
    avg_time=$(awk -F',' '{sum+=$2} END {print sum/NR}' agent_${agent_name}_times.csv)
    p95_time=$(sort -t',' -k2 -n agent_${agent_name}_times.csv | tail -n 5 | head -n 1 | cut -d',' -f2)
    
    echo "Agent ${agent_name} Performance:"
    echo "  Average Response Time: ${avg_time}ms"
    echo "  95th Percentile: ${p95_time}ms"
    
    if (( $(echo "$avg_time > 2000" | bc -l) )); then
        echo "  ⚠️ Warning: Average response time exceeds 2s threshold"
        suggest_agent_optimizations $agent_name
    fi
}

# Test all agents
for agent in profile curriculum exercise reviewer resources progress orchestrator; do
    monitor_agent_performance $agent
done
```

### 2. Database Performance Optimization
```bash
echo "🗄️ Analyzing database performance..."

# Query performance analysis
analyze_slow_queries() {
    echo "Analyzing slow queries..."
    
    # Enable query logging
    docker exec learning-coach-postgres psql -U postgres -c "
        ALTER SYSTEM SET log_min_duration_statement = 1000;
        SELECT pg_reload_conf();
    "
    
    # Run typical workload
    python scripts/simulate_workload.py --duration 300 --users 50
    
    # Analyze slow queries
    docker exec learning-coach-postgres psql -U postgres -c "
        SELECT query, mean_exec_time, calls, total_exec_time
        FROM pg_stat_statements
        WHERE mean_exec_time > 1000
        ORDER BY mean_exec_time DESC
        LIMIT 10;
    "
}

# Index optimization
optimize_indexes() {
    echo "Optimizing database indexes..."
    
    # Find missing indexes
    docker exec learning-coach-postgres psql -U postgres learning_coach -c "
        SELECT schemaname, tablename, attname, n_distinct, correlation
        FROM pg_stats
        WHERE schemaname = 'public'
        AND n_distinct > 100
        AND correlation < 0.1;
    "
    
    # Suggest index improvements
    echo "Suggested index optimizations:"
    echo "1. CREATE INDEX CONCURRENTLY idx_submissions_user_exercise ON submissions(user_id, exercise_id);"
    echo "2. CREATE INDEX CONCURRENTLY idx_progress_user_topic ON progress_tracking(user_id, topic_id);"
    echo "3. CREATE INDEX CONCURRENTLY idx_evaluations_submission_created ON evaluations(submission_id, created_at);"
}

# Connection pool optimization
optimize_connection_pool() {
    echo "Optimizing connection pool..."
    
    # Monitor connection usage
    docker exec learning-coach-postgres psql -U postgres -c "
        SELECT state, count(*)
        FROM pg_stat_activity
        WHERE datname = 'learning_coach'
        GROUP BY state;
    "
    
    # Suggest pool size adjustments
    active_connections=$(docker exec learning-coach-postgres psql -U postgres -t -c "
        SELECT count(*) FROM pg_stat_activity WHERE datname = 'learning_coach' AND state = 'active';
    " | xargs)
    
    if [[ $active_connections -gt 20 ]]; then
        echo "⚠️ High connection count: $active_connections"
        echo "Consider increasing pool size or optimizing query patterns"
    fi
}
```

### 3. API Performance Optimization
```bash
echo "🌐 Analyzing API performance..."

# Endpoint response time analysis
analyze_api_performance() {
    echo "Testing API endpoint performance..."
    
    # Test critical endpoints
    endpoints=(
        "/api/v1/health"
        "/api/v1/goals"
        "/api/v1/curriculum"
        "/api/v1/tasks"
        "/api/v1/submissions"
        "/api/v1/progress"
        "/api/v1/analytics/insights"
        "/api/v1/gamification/profile"
    )
    
    for endpoint in "${endpoints[@]}"; do
        echo "Testing $endpoint..."
        
        # Use Apache Bench for load testing
        ab -n 1000 -c 10 -g ${endpoint//\//_}.tsv http://localhost:8000$endpoint > ${endpoint//\//_}_results.txt
        
        # Extract key metrics
        avg_time=$(grep "Time per request" ${endpoint//\//_}_results.txt | head -1 | awk '{print $4}')
        throughput=$(grep "Requests per second" ${endpoint//\//_}_results.txt | awk '{print $4}')
        
        echo "  Average Response Time: ${avg_time}ms"
        echo "  Throughput: ${throughput} req/s"
        
        if (( $(echo "$avg_time > 500" | bc -l) )); then
            echo "  ⚠️ Warning: Response time exceeds 500ms threshold"
            suggest_api_optimizations $endpoint
        fi
    done
}

# Memory usage analysis
analyze_memory_usage() {
    echo "Analyzing memory usage..."
    
    # Monitor Python process memory
    docker exec learning-coach-api python -c "
    import psutil
    import os
    
    process = psutil.Process(os.getpid())
    memory_info = process.memory_info()
    
    print(f'RSS Memory: {memory_info.rss / 1024 / 1024:.2f} MB')
    print(f'VMS Memory: {memory_info.vms / 1024 / 1024:.2f} MB')
    print(f'Memory Percent: {process.memory_percent():.2f}%')
    "
    
    # Check for memory leaks
    for i in {1..10}; do
        memory_usage=$(docker stats --no-stream --format "{{.MemUsage}}" learning-coach-api | cut -d'/' -f1)
        echo "Memory usage sample $i: $memory_usage"
        sleep 30
    done
}
```

### 4. Vector Database Optimization
```bash
echo "🔍 Optimizing vector database performance..."

# Qdrant performance analysis
optimize_qdrant() {
    echo "Analyzing Qdrant performance..."
    
    # Test search performance
    python -c "
import time
import requests
import numpy as np

# Generate test vectors
test_vectors = [np.random.rand(1536).tolist() for _ in range(100)]

search_times = []
for vector in test_vectors:
    start_time = time.time()
    
    response = requests.post('http://localhost:6333/collections/learning_resources/points/search', 
                           json={'vector': vector, 'limit': 10})
    
    end_time = time.time()
    search_times.append((end_time - start_time) * 1000)

avg_search_time = sum(search_times) / len(search_times)
p95_search_time = sorted(search_times)[95]

print(f'Average search time: {avg_search_time:.2f}ms')
print(f'95th percentile: {p95_search_time:.2f}ms')

if avg_search_time > 100:
    print('⚠️ Warning: Search time exceeds 100ms threshold')
    print('Consider optimizing HNSW parameters or increasing resources')
"
    
    # Optimize HNSW parameters
    curl -X PUT http://localhost:6333/collections/learning_resources \
        -H "Content-Type: application/json" \
        -d '{
            "hnsw_config": {
                "m": 32,
                "ef_construct": 400,
                "full_scan_threshold": 20000
            }
        }'
}
```

### 5. Frontend Performance Optimization
```bash
echo "🎨 Analyzing frontend performance..."

# Bundle size analysis
analyze_bundle_size() {
    cd frontend
    
    echo "Analyzing bundle size..."
    npm run build
    
    # Use webpack-bundle-analyzer
    npx webpack-bundle-analyzer build/static/js/*.js --mode static --report bundle-report.html
    
    # Check bundle sizes
    total_size=$(du -sh build/ | cut -f1)
    js_size=$(du -sh build/static/js/ | cut -f1)
    css_size=$(du -sh build/static/css/ | cut -f1)
    
    echo "Bundle Analysis:"
    echo "  Total Size: $total_size"
    echo "  JavaScript: $js_size"
    echo "  CSS: $css_size"
    
    # Check for large dependencies
    echo "Largest dependencies:"
    npx bundlephobia-cli --json package.json | jq -r '.[] | select(.size > 100000) | "\(.name): \(.size/1024|round)KB"'
}

# Performance metrics
measure_frontend_performance() {
    echo "Measuring frontend performance..."
    
    # Use Lighthouse for performance audit
    npx lighthouse http://localhost:3000 \
        --output json \
        --output-path lighthouse-report.json \
        --chrome-flags="--headless"
    
    # Extract key metrics
    performance_score=$(jq '.categories.performance.score * 100' lighthouse-report.json)
    fcp=$(jq '.audits["first-contentful-paint"].numericValue' lighthouse-report.json)
    lcp=$(jq '.audits["largest-contentful-paint"].numericValue' lighthouse-report.json)
    
    echo "Performance Metrics:"
    echo "  Performance Score: ${performance_score}%"
    echo "  First Contentful Paint: ${fcp}ms"
    echo "  Largest Contentful Paint: ${lcp}ms"
    
    if (( $(echo "$performance_score < 90" | bc -l) )); then
        echo "⚠️ Warning: Performance score below 90%"
        suggest_frontend_optimizations
    fi
}
```

## Optimization Suggestions

### Agent Optimization
```bash
suggest_agent_optimizations() {
    local agent_name=$1
    echo "Optimization suggestions for ${agent_name} agent:"
    
    case $agent_name in
        "profile")
            echo "  - Cache skill assessment results"
            echo "  - Optimize goal parsing with compiled regex"
            echo "  - Use connection pooling for database queries"
            ;;
        "curriculum")
            echo "  - Cache curriculum templates"
            echo "  - Optimize dependency resolution algorithm"
            echo "  - Pre-compute difficulty progressions"
            ;;
        "exercise")
            echo "  - Cache generated exercises by difficulty/topic"
            echo "  - Optimize LLM prompt templates"
            echo "  - Use async processing for exercise generation"
            ;;
        "reviewer")
            echo "  - Cache common code patterns and feedback"
            echo "  - Optimize test execution with parallel runners"
            echo "  - Pre-compile feedback templates"
            ;;
    esac
}
```

### Database Optimization
```bash
suggest_database_optimizations() {
    echo "Database optimization suggestions:"
    echo "  - Add composite indexes on frequently queried columns"
    echo "  - Implement query result caching with Redis"
    echo "  - Use read replicas for analytics queries"
    echo "  - Optimize JOIN operations with proper indexing"
    echo "  - Consider partitioning large tables (submissions, progress)"
    echo "  - Implement connection pooling with pgbouncer"
}
```

### API Optimization
```bash
suggest_api_optimizations() {
    local endpoint=$1
    echo "API optimization suggestions for $endpoint:"
    echo "  - Implement response caching with appropriate TTL"
    echo "  - Add request/response compression (gzip)"
    echo "  - Optimize serialization with faster JSON libraries"
    echo "  - Implement pagination for large result sets"
    echo "  - Use async/await for I/O operations"
    echo "  - Add rate limiting to prevent abuse"
}
```

## Performance Monitoring Dashboard

### Real-time Metrics
```bash
create_performance_dashboard() {
    echo "📊 Creating performance monitoring dashboard..."
    
    # Collect metrics
    cat > performance_metrics.json << EOF
{
    "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "agents": {
        "profile": {"avg_response_time": 150, "p95_response_time": 300},
        "curriculum": {"avg_response_time": 200, "p95_response_time": 450},
        "exercise": {"avg_response_time": 800, "p95_response_time": 1200},
        "reviewer": {"avg_response_time": 1200, "p95_response_time": 2000}
    },
    "database": {
        "active_connections": 15,
        "avg_query_time": 45,
        "slow_queries": 2
    },
    "api": {
        "requests_per_second": 120,
        "avg_response_time": 180,
        "error_rate": 0.02
    },
    "system": {
        "cpu_usage": 65,
        "memory_usage": 78,
        "disk_usage": 45
    }
}
EOF
    
    echo "Performance dashboard data generated"
}
```

## Expected Output

### Performance Analysis Report
```
🤖 Agent Performance Analysis:
✅ Profile Agent: 150ms avg, 300ms p95
✅ Curriculum Agent: 200ms avg, 450ms p95
⚠️ Exercise Agent: 800ms avg, 1200ms p95 (exceeds threshold)
⚠️ Reviewer Agent: 1200ms avg, 2000ms p95 (exceeds threshold)

🗄️ Database Performance:
✅ Connection Pool: 15/50 active connections
⚠️ Slow Queries: 3 queries > 1s detected
✅ Index Usage: 95% queries using indexes

🌐 API Performance:
✅ Average Response Time: 180ms
✅ Throughput: 120 req/s
✅ Error Rate: 0.02%

🔍 Vector Database:
✅ Search Performance: 45ms avg, 85ms p95
✅ Memory Usage: 2.1GB / 4GB

🎨 Frontend Performance:
✅ Performance Score: 92%
✅ First Contentful Paint: 1.2s
⚠️ Largest Contentful Paint: 2.8s (exceeds 2.5s threshold)

📊 Optimization Recommendations:
1. Cache exercise generation results (Exercise Agent)
2. Optimize code execution timeout (Reviewer Agent)
3. Add composite index on submissions(user_id, created_at)
4. Implement lazy loading for frontend components
5. Enable gzip compression for API responses

🎯 Performance Score: 87/100
```

## Usage Examples

### Monitor All Components
```bash
kiro performance-optimization --component all --duration 60
```

### Focus on Agents
```bash
kiro performance-optimization --component agents --metric response_time --threshold 1000
```

### Database Optimization
```bash
kiro performance-optimization --component database --metric all --environment production
```

This comprehensive performance optimization prompt helps maintain optimal system performance across all components of the learning coach platform.