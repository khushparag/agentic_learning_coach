# CORS and Port Configuration Fix - Complete

## Issue Summary
User reported that clicking the "Start" button showed fallback content instead of AI-generated content from the backend LLM. Network logs showed CORS errors.

## Root Cause Analysis
The issue was caused by **port mismatch and configuration override conflicts**:

1. **Backend Port**: Backend runs on port 8002 (as configured in `.env` with `COACH_PORT=8002`)
2. **Frontend Configuration Conflict**: Multiple configuration files had conflicting port settings
3. **Docker Compose Override**: The `docker-compose.override.yml` file was overriding environment variables with port 8000

## Files Modified

### 1. `docker-compose.yml`
**Changed**: Updated default port from 8000 to 8002 in frontend build args and environment variables
```yaml
# Build args
- VITE_API_BASE_URL=http://localhost:${COACH_PORT:-8002}  # Was 8000
- VITE_WS_URL=ws://localhost:${COACH_PORT:-8002}          # Was 8000

# Environment variables
- VITE_API_BASE_URL=http://localhost:${COACH_PORT:-8002}  # Was 8000
- VITE_WS_URL=ws://localhost:${COACH_PORT:-8002}          # Was 8000
- VITE_WS_BASE_URL=ws://localhost:${COACH_PORT:-8002}     # Was 8000
```

### 2. `docker-compose.override.yml`
**Changed**: Updated development override to use port 8002
```yaml
environment:
  - VITE_API_BASE_URL=http://localhost:8002  # Was 8000
  - VITE_WS_URL=ws://localhost:8002          # Was 8000
```

### 3. `frontend/.env.development`
**Already Fixed**: This file was already updated to port 8002 in previous fix

### 4. `src/adapters/api/settings.py`
**Already Fixed**: CORS allowed_origins already includes port 8002

## Configuration Hierarchy
Docker Compose loads configuration files in this order (later files override earlier ones):
1. `docker-compose.yml` (base configuration)
2. `docker-compose.override.yml` (development overrides) ← **This was the culprit**
3. Environment variables from `.env` file
4. Shell environment variables

## Verification Steps Completed

### 1. Backend Configuration ✅
```bash
docker exec learning-coach-service env | grep OPENAI
# Output: OPENAI_API_KEY=sk-proj-... (present and valid)
```

### 2. Backend Port Mapping ✅
```bash
docker ps | grep coach-service
# Output: 0.0.0.0:8002->8000/tcp (correctly mapped)
```

### 3. Backend Health Check ✅
```bash
curl http://localhost:8002/health/live
# Output: {"alive":true,"timestamp":"...","service":"learning-coach"}
```

### 4. CORS Configuration ✅
```bash
curl -X OPTIONS http://localhost:8002/api/v1/content/lesson/generate \
  -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: POST"
# Output: access-control-allow-origin: http://localhost:3000 ✅
```

### 5. Frontend Environment Variables ✅
```bash
docker exec learning-coach-frontend env | grep VITE_API
# Output: VITE_API_BASE_URL=http://localhost:8002 ✅
```

## Current System State

### Backend (coach-service)
- **Container Port**: 8000 (internal)
- **Host Port**: 8002 (external)
- **OpenAI API Key**: Present and valid
- **CORS Origins**: Includes http://localhost:3000, http://localhost:8000, http://localhost:8002
- **Status**: Healthy ✅

### Frontend (frontend)
- **Container Port**: 3000
- **Host Port**: 3000
- **API Base URL**: http://localhost:8002 ✅
- **WebSocket URL**: ws://localhost:8002 ✅
- **Status**: Healthy ✅

## Expected Behavior Now
1. User opens frontend at `http://localhost:3000`
2. User clicks "Start" button
3. Frontend sends POST request to `http://localhost:8002/api/v1/content/lesson/generate`
4. Backend receives request with valid CORS headers
5. Backend uses OpenAI API key to generate content
6. Backend returns AI-generated content (not fallback templates)
7. Frontend displays the AI-generated learning content

## Testing Instructions for User
1. **Clear browser cache**: Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
2. **Open browser DevTools**: F12 → Network tab
3. **Navigate to**: http://localhost:3000
4. **Click "Start" button**
5. **Verify in Network tab**:
   - Request URL should be `http://localhost:8002/api/v1/content/lesson/generate`
   - Status should be `200 OK` (not CORS error)
   - Response should contain AI-generated content

## Troubleshooting

### If still seeing CORS errors:
1. Check browser console for exact error message
2. Verify frontend container environment: `docker exec learning-coach-frontend env | grep VITE_API`
3. Verify backend CORS config: Check `src/adapters/api/settings.py` allowed_origins
4. Restart both containers: `docker-compose restart frontend coach-service`

### If seeing fallback content:
1. Check backend logs: `docker logs learning-coach-service`
2. Verify OpenAI API key is valid: `docker exec learning-coach-service env | grep OPENAI`
3. Test backend endpoint directly: `curl -X POST http://localhost:8002/api/v1/content/lesson/generate -H "Content-Type: application/json" -d '{"topic":"test"}'`

## Related Files
- `.env` - Root environment variables (COACH_PORT=8002)
- `docker-compose.yml` - Base Docker configuration
- `docker-compose.override.yml` - Development overrides
- `frontend/.env.development` - Frontend development config
- `src/adapters/api/settings.py` - Backend CORS configuration
- `src/adapters/api/main.py` - FastAPI application with CORS middleware

## Lessons Learned
1. **Docker Compose Override Files**: Always check `docker-compose.override.yml` as it takes precedence
2. **Configuration Hierarchy**: Understand the order in which Docker Compose loads configuration
3. **Container Rebuilds**: When changing environment variables, use `--force-recreate` and `--no-cache`
4. **CORS Testing**: Use OPTIONS requests to verify CORS configuration before testing actual endpoints
5. **Port Mapping**: Distinguish between container internal ports and host external ports
