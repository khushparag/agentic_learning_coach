# CORS and API Key Configuration Fix

## Issues Identified

Based on the network screenshot showing CORS errors, there were **three critical issues**:

### 1. CORS Configuration Missing Port 8002
**Problem**: The backend's CORS `allowed_origins` only included:
- `http://localhost:3000`
- `http://localhost:8000`

But the frontend is connecting to `http://localhost:8002` (the actual backend port).

**Impact**: Browser blocks all API requests due to CORS policy violation.

### 2. Port Mismatch (Already Fixed)
**Problem**: Frontend was configured to use port 8000, but backend runs on port 8002.

**Status**: ✅ Already fixed in previous step.

### 3. OpenAI API Key Configuration (Already Fixed)
**Problem**: OpenAI API key wasn't being passed to Docker container.

**Status**: ✅ Already fixed in previous step.

## Fixes Applied

### Fix 1: Updated CORS Configuration
**File**: `src/adapters/api/settings.py`

```python
# Before
allowed_origins: List[str] = Field(
    default=["http://localhost:3000", "http://localhost:8000"],
    description="Allowed CORS origins"
)

# After
allowed_origins: List[str] = Field(
    default=["http://localhost:3000", "http://localhost:8000", "http://localhost:8002"],
    description="Allowed CORS origins"
)
```

### Fix 2: Restarted Backend Service
```bash
docker-compose restart coach-service
```

## Verification Steps

### 1. Verify CORS Fix
Open browser DevTools (F12) → Network tab → Try the "Start" button again.

**Expected**: 
- ✅ No CORS errors
- ✅ Request reaches backend successfully
- ✅ Response status 200 OK

### 2. Verify OpenAI API Key
```bash
docker exec learning-coach-service env | grep OPENAI
```

**Expected Output**:
```
OPENAI_API_KEY=sk-proj-...
OPENAI_MODEL=gpt-4o-mini
```

### 3. Test Learning Content Generation
1. Open `http://localhost:3000`
2. Navigate to Exercises page
3. Click "Start" button
4. **Expected**: Rich, AI-generated content (not fallback templates)

### 4. Monitor Backend Logs
```bash
docker logs -f learning-coach-service
```

**Look for**:
- API request to `/api/v1/content/lesson/generate`
- LLM service calls
- Content generation success messages

## Complete Configuration Summary

### Frontend Configuration
- **URL**: `http://localhost:3000`
- **API Base URL**: `http://localhost:8002` (fixed)
- **WebSocket URL**: `ws://localhost:8002` (fixed)

### Backend Configuration
- **Internal Port**: `8000` (inside container)
- **External Port**: `8002` (host machine)
- **CORS Origins**: 
  - `http://localhost:3000` ✅
  - `http://localhost:8000` ✅
  - `http://localhost:8002` ✅ (newly added)

### Environment Variables
- **OpenAI API Key**: ✅ Configured in `.env`
- **OpenAI Model**: `gpt-4o-mini`
- **Environment**: `development`
- **Debug**: `true`

## Testing Checklist

- [ ] **CORS Error Resolved**: No CORS errors in browser console
- [ ] **API Requests Successful**: Network tab shows 200 OK responses
- [ ] **OpenAI Key Present**: Verified in container environment
- [ ] **Content Generation Works**: AI-generated content appears (not fallback)
- [ ] **Backend Logs Show Requests**: API calls visible in logs

## Troubleshooting

### If CORS Errors Persist

1. **Clear browser cache**: Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
2. **Check backend logs**: Verify service restarted successfully
3. **Verify CORS settings**: 
   ```bash
   docker exec learning-coach-service cat /app/src/adapters/api/settings.py | grep -A 3 "allowed_origins"
   ```

### If Still Showing Fallback Content

1. **Check OpenAI API Key Validity**:
   - The key might be expired or invalid
   - Test the key directly with OpenAI API
   - Check OpenAI dashboard for API usage/errors

2. **Check Backend LLM Service**:
   ```bash
   docker logs learning-coach-service | grep -i "llm\|openai\|content"
   ```

3. **Verify API Key Format**:
   - OpenAI keys should start with `sk-proj-` or `sk-`
   - Should be at least 40 characters long

### If Network Requests Fail

1. **Verify backend is running**:
   ```bash
   curl http://localhost:8002/health/live
   ```
   Should return: `{"alive":true,...}`

2. **Check Docker containers**:
   ```bash
   docker ps | grep learning-coach
   ```
   All containers should show "healthy" status

3. **Restart all services**:
   ```bash
   docker-compose down
   docker-compose up -d
   ```

## Expected Behavior After All Fixes

### Request Flow
1. **Frontend** (`http://localhost:3000`) 
2. → Makes API request to `http://localhost:8002/api/v1/content/lesson/generate`
3. → **Backend** receives request (CORS allows origin)
4. → Backend calls **OpenAI API** with configured key
5. → OpenAI returns AI-generated content
6. → Backend returns rich content to frontend
7. → **Frontend displays** AI-generated learning material

### Success Indicators
- ✅ No CORS errors in browser console
- ✅ Network tab shows successful API calls
- ✅ Backend logs show LLM service activity
- ✅ Content is detailed, contextual, and personalized
- ✅ Multiple sections with explanations and examples

## Next Steps

1. **Test the fix**: Click "Start" button in the UI
2. **Verify content quality**: Ensure it's AI-generated (rich and detailed)
3. **Monitor for errors**: Watch browser console and backend logs
4. **Report results**: Let me know if you see AI-generated content or still getting fallback

## Status

✅ **CORS Configuration**: Fixed - Added `http://localhost:8002` to allowed origins  
✅ **Frontend API URL**: Fixed - Updated to port 8002  
✅ **OpenAI API Key**: Fixed - Added to docker-compose.yml  
✅ **Backend Service**: Restarted with new configuration  

**Ready for testing!** Please try clicking the "Start" button now and check if you see AI-generated content.
