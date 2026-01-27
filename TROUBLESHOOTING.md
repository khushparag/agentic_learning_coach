# Troubleshooting Guide

## Common Issues and Solutions

### 🚀 Startup Issues

#### Docker Services Won't Start
**Problem:** `make docker-up` fails or services don't start properly

**Solutions:**
1. **Check Docker is running:**
   ```bash
   docker --version
   docker-compose --version
   ```

2. **Clean up existing containers:**
   ```bash
   make docker-clean
   docker system prune -f
   ```

3. **Check port conflicts:**
   ```bash
   # Check if ports are in use
   netstat -tulpn | grep :8000
   netstat -tulpn | grep :5432
   netstat -tulpn | grep :6333
   ```

4. **Restart with fresh state:**
   ```bash
   make docker-down
   make docker-clean
   make docker-up
   ```

#### Database Connection Issues
**Problem:** `FATAL: database "learning_coach" does not exist`

**Solutions:**
1. **Wait for PostgreSQL to initialize:**
   ```bash
   # Check PostgreSQL logs
   make docker-logs | grep postgres
   ```

2. **Run database initialization:**
   ```bash
   make migrate
   make db-seed
   ```

3. **Manual database creation:**
   ```bash
   docker exec -it learning-coach-postgres psql -U postgres -c "CREATE DATABASE learning_coach;"
   ```

### 🔧 Development Issues

#### Tests Failing
**Problem:** `pytest` shows failing tests

**Solutions:**
1. **Check test database:**
   ```bash
   # Ensure test database is clean
   make test-db-reset
   ```

2. **Run specific test categories:**
   ```bash
   pytest tests/unit/ -v          # Unit tests only
   pytest tests/integration/ -v   # Integration tests only
   ```

3. **Check test dependencies:**
   ```bash
   pip install -r requirements-dev.txt
   ```

#### Import Errors
**Problem:** `ModuleNotFoundError` when running the application

**Solutions:**
1. **Check Python path:**
   ```bash
   export PYTHONPATH="${PYTHONPATH}:$(pwd)/src"
   ```

2. **Verify virtual environment:**
   ```bash
   which python
   pip list | grep fastapi
   ```

3. **Reinstall dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

### 🌐 Frontend Issues

#### Frontend Won't Load
**Problem:** React app shows blank page or errors

**Solutions:**
1. **Check Node.js version:**
   ```bash
   node --version  # Should be 18+
   npm --version
   ```

2. **Clear cache and reinstall:**
   ```bash
   cd frontend
   rm -rf node_modules package-lock.json
   npm install
   ```

3. **Check environment variables:**
   ```bash
   # Ensure .env.development exists
   cp .env.example .env.development
   ```

#### API Connection Issues
**Problem:** Frontend can't connect to backend API

**Solutions:**
1. **Check CORS configuration:**
   - Verify `CORS_ORIGINS` in `.env`
   - Ensure backend is running on correct port

2. **Check API endpoints:**
   ```bash
   curl http://localhost:8000/health
   ```

3. **Verify proxy configuration:**
   - Check `vite.config.ts` proxy settings
   - Ensure API base URL is correct

### 🤖 Agent Issues

#### Agent Communication Failures
**Problem:** Agents not responding or timing out

**Solutions:**
1. **Check agent health:**
   ```bash
   curl http://localhost:8000/health/detailed
   ```

2. **Review agent logs:**
   ```bash
   make docker-logs | grep -E "(agent|orchestrator)"
   ```

3. **Restart specific services:**
   ```bash
   docker restart learning-coach-api
   ```

#### LLM Integration Issues
**Problem:** AI features not working properly

**Solutions:**
1. **Check API keys:**
   ```bash
   # Verify environment variables
   echo $OPENAI_API_KEY
   echo $ANTHROPIC_API_KEY
   ```

2. **Test LLM connectivity:**
   ```bash
   curl -H "Authorization: Bearer $OPENAI_API_KEY" \
        https://api.openai.com/v1/models
   ```

3. **Use mock mode for testing:**
   ```bash
   export LLM_PROVIDER=mock
   ```

### 🗄️ Database Issues

#### Migration Failures
**Problem:** Alembic migrations fail to run

**Solutions:**
1. **Check migration status:**
   ```bash
   make migrate-status
   ```

2. **Reset migrations:**
   ```bash
   make migrate-reset
   make migrate
   ```

3. **Manual migration:**
   ```bash
   docker exec -it learning-coach-postgres psql -U postgres learning_coach
   # Check tables manually
   \dt
   ```

#### Data Corruption
**Problem:** Inconsistent data or foreign key errors

**Solutions:**
1. **Reset database:**
   ```bash
   make db-reset
   make migrate
   make db-seed
   ```

2. **Check data integrity:**
   ```bash
   make db-check-integrity
   ```

### 🔍 Vector Database Issues

#### Qdrant Connection Problems
**Problem:** Vector search not working

**Solutions:**
1. **Check Qdrant health:**
   ```bash
   curl http://localhost:6333/health
   ```

2. **Verify collections:**
   ```bash
   curl http://localhost:6333/collections
   ```

3. **Recreate collections:**
   ```bash
   make qdrant-reset
   ```

### 🏃 Code Runner Issues

#### Code Execution Failures
**Problem:** User code submissions fail to execute

**Solutions:**
1. **Check runner service:**
   ```bash
   curl http://localhost:8001/health
   ```

2. **Verify Docker-in-Docker:**
   ```bash
   docker exec -it learning-coach-runner docker ps
   ```

3. **Check resource limits:**
   - Verify memory and CPU limits
   - Check timeout configurations

### 📊 Performance Issues

#### Slow Response Times
**Problem:** API responses are slow (>2 seconds)

**Solutions:**
1. **Check database queries:**
   ```bash
   # Enable query logging
   export LOG_LEVEL=DEBUG
   ```

2. **Monitor resource usage:**
   ```bash
   docker stats
   ```

3. **Optimize database:**
   ```bash
   make db-analyze
   make db-vacuum
   ```

#### Memory Issues
**Problem:** High memory usage or out-of-memory errors

**Solutions:**
1. **Check memory limits:**
   ```bash
   docker-compose config | grep mem_limit
   ```

2. **Monitor memory usage:**
   ```bash
   docker exec -it learning-coach-api python -c "
   import psutil
   print(f'Memory: {psutil.virtual_memory().percent}%')
   "
   ```

3. **Adjust container limits:**
   - Increase memory limits in `docker-compose.yml`
   - Optimize Python memory usage

## 🔧 Development Tools

### Useful Commands
```bash
# Health check all services
make health-check

# View all logs
make logs

# Reset everything
make clean-reset

# Run specific tests
make test-unit
make test-integration
make test-property

# Database operations
make db-shell
make db-backup
make db-restore

# Code quality
make lint-fix
make format
make security-scan
```

### Debug Mode
```bash
# Enable debug logging
export LOG_LEVEL=DEBUG
export PYTHONPATH="${PYTHONPATH}:$(pwd)/src"

# Run with debugger
python -m pdb src/adapters/api/main.py
```

### Performance Monitoring
```bash
# Monitor API performance
curl -w "@curl-format.txt" -o /dev/null -s http://localhost:8000/health

# Database performance
docker exec -it learning-coach-postgres pg_stat_activity
```

## 🆘 Getting Help

### Log Analysis
1. **Check application logs:**
   ```bash
   make docker-logs | grep ERROR
   ```

2. **Check specific service logs:**
   ```bash
   docker logs learning-coach-api --tail 100
   ```

3. **Export logs for analysis:**
   ```bash
   make docker-logs > debug.log
   ```

### Reporting Issues
When reporting issues, include:
- Error messages (full stack trace)
- Steps to reproduce
- Environment details (`make env-info`)
- Log excerpts
- System specifications

### Community Support
- Check existing issues in the repository
- Search documentation and troubleshooting guide
- Join community discussions
- Contact maintainers with detailed bug reports

---

*Last Updated: January 27, 2026*