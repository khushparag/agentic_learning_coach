# Testing Guide - Scroll Redirect Fix

## What Was Fixed

We've implemented a comprehensive solution to prevent 404 errors for non-existent source files from causing page redirects when scrolling on the learning path page.

## Changes Made

### 1. Vite Plugin (Server-Side)
- **File**: `frontend/vite-plugins/handle-404.ts`
- **Purpose**: Intercepts 404 requests for source files at the Vite dev server level
- **Behavior**: Returns 204 No Content instead of 404 for non-existent `.tsx`, `.ts`, `.jsx`, `.map` files

### 2. Global Error Handler (Client-Side)
- **File**: `frontend/src/main.tsx`
- **Purpose**: Catches resource loading errors in the browser
- **Behavior**: Prevents 404 errors from triggering React Router redirects

### 3. Vite Configuration
- **File**: `frontend/vite.config.ts`
- **Changes**: Added the 404 handler plugin and relaxed file system restrictions

## Testing Steps

### Step 1: Clear Browser Cache
**Important**: Old cached files might cause issues

**Windows/Linux**:
```
Ctrl + Shift + R (hard reload)
```

**Mac**:
```
Cmd + Shift + R (hard reload)
```

Or manually:
1. Open DevTools (F12)
2. Right-click the refresh button
3. Select "Empty Cache and Hard Reload"

### Step 2: Navigate to Learning Path
1. Open your browser to `http://localhost:3000`
2. Log in if needed
3. Navigate to the Learning Path page
4. Click the "Start" button to view study material

### Step 3: Test Scrolling
1. **Scroll down slowly** - Check if page stays stable
2. **Scroll up slowly** - Check if page stays stable
3. **Scroll rapidly** - Check if page stays stable
4. **Scroll to bottom** - Check if page stays stable
5. **Scroll to top** - Check if page stays stable

### Step 4: Check Browser Console
Open the browser console (F12) and look for:

**Expected Messages** (these are GOOD):
```
[404-Handler] Blocked 404 for non-existent file: /curriculum-style.tsx
[Error Handler] Prevented redirect due to missing source file: ...
```

**Unexpected Messages** (these are BAD):
```
404 (Not Found)
Failed to load resource: the server responded with a status of 404
```

### Step 5: Check Network Tab
1. Open DevTools (F12)
2. Go to "Network" tab
3. Scroll the page
4. Look for requests with:
   - **Status 204**: Good! The fix is working
   - **Status 404**: Bad! The fix isn't catching these

### Step 6: Test Different Scenarios

#### Scenario A: Initial Load
- Refresh the page
- Check if content loads correctly
- Verify no redirects occur

#### Scenario B: Navigation
- Navigate away from learning path
- Navigate back to learning path
- Check if content loads correctly

#### Scenario C: Scroll Patterns
- Scroll down → wait 2 seconds → scroll up
- Rapid scroll down
- Rapid scroll up
- Scroll with mouse wheel
- Scroll with scrollbar
- Scroll with keyboard (Page Down/Up)

## Troubleshooting

### Issue: Still Getting Redirects

**Solution 1: Try Incognito Mode**
```
Ctrl + Shift + N (Windows/Linux)
Cmd + Shift + N (Mac)
```
This disables browser extensions that might interfere.

**Solution 2: Disable Browser Extensions**
1. Open Extensions page
2. Temporarily disable:
   - React DevTools
   - Redux DevTools
   - Any code inspection tools

**Solution 3: Check Different Browser**
- Try Chrome, Firefox, or Edge
- This helps identify browser-specific issues

### Issue: Console Shows 404 Errors

**Check the file path**:
- If it's `curriculum-style.tsx` → This is the bug we're fixing
- If it's a real file → There might be a build issue

**Solution**:
```bash
# Rebuild the frontend
docker-compose restart frontend

# Or rebuild from scratch
docker-compose down
docker-compose up -d --build frontend
```

### Issue: Page Loads Slowly

**This is normal** after the fix because:
- Vite is checking if files exist before serving
- First load might be slower
- Subsequent loads should be fast

## Success Criteria

✅ **Fix is working if**:
1. No redirects occur when scrolling
2. Console shows `[404-Handler]` messages for blocked files
3. Network tab shows 204 status for non-existent files
4. Page remains stable during all scroll patterns

❌ **Fix is NOT working if**:
1. Page redirects back to start button when scrolling
2. Console shows 404 errors for source files
3. Network tab shows 404 status for source files
4. Page becomes unresponsive

## Reporting Results

### If Fix Works
Please confirm:
- ✅ Scrolling works without redirects
- ✅ Console shows expected messages
- ✅ Network tab shows 204 status

### If Fix Doesn't Work
Please provide:
1. **Screenshot of console errors**
2. **Screenshot of Network tab** (showing the 404 request)
3. **Browser and version** (e.g., Chrome 120)
4. **Steps to reproduce** (exact sequence of actions)
5. **HAR file** (optional, for detailed analysis)
   - Network tab → Right-click → "Save all as HAR with content"

## Additional Notes

### Development vs Production
- **Development**: Uses Vite dev server with our custom plugin
- **Production**: Uses nginx with configuration in `frontend/nginx.prod.conf`
- Both environments are now protected against this issue

### Performance Impact
- Minimal impact on performance
- File existence checks are fast
- Only affects source file requests (rare in normal usage)

### Future Improvements
If the issue persists, we can:
1. Add more aggressive caching
2. Implement request debouncing
3. Add source map configuration
4. Investigate specific browser extensions

## Date
January 15, 2026

## Status
🧪 **READY FOR TESTING**
