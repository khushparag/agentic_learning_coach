# Development Mode 404 Fix - Complete Solution

## Problem Summary
When scrolling on the learning path page in **development mode**, the browser makes requests for non-existent source files (like `curriculum-style.tsx`), resulting in 404 errors that trigger redirects back to the start button page.

## Root Cause
- **Environment**: Development mode using Vite dev server (not nginx)
- **Trigger**: Browser or browser extensions trying to load source files during scroll
- **Impact**: 404 errors cause React Router to redirect to fallback route

## Solution Implemented

### 1. Vite Plugin - 404 Handler
**File**: `frontend/vite-plugins/handle-404.ts`

Created a custom Vite plugin that intercepts requests for non-existent source files and returns `204 No Content` instead of `404 Not Found`. This prevents the browser from treating these as errors.

**Features**:
- Intercepts `.tsx`, `.ts`, `.jsx`, `.js` file requests
- Intercepts `.map` file requests (source maps)
- Logs suspicious requests for debugging
- Returns 204 status code (silent success)

### 2. Vite Configuration Updates
**File**: `frontend/vite.config.ts`

**Changes**:
- Added the `handle404Plugin()` to the plugins array
- Added `fs.strict: false` to allow flexible file system access
- Added `fs.allow: ['..']` to prevent overly strict file access restrictions

### 3. Global Error Handler
**File**: `frontend/src/main.tsx`

Added two global event listeners:

**Error Handler**:
- Catches resource loading errors (404s)
- Checks if the error is for a source file
- Prevents default behavior (redirect)
- Logs warning for debugging

**Unhandled Rejection Handler**:
- Catches promise rejections related to source files
- Prevents these from causing navigation issues
- Logs warnings for debugging

## How It Works

```
User scrolls page
    ↓
Browser/Extension tries to load source file
    ↓
Vite Plugin intercepts request
    ↓
Returns 204 No Content (instead of 404)
    ↓
Browser treats as success (no error)
    ↓
No redirect occurs
    ↓
User continues scrolling normally
```

## Testing Instructions

### Step 1: Restart Frontend Container
```bash
docker-compose restart frontend
```

### Step 2: Clear Browser Cache
- Press `Ctrl + Shift + R` (Windows/Linux)
- Press `Cmd + Shift + R` (Mac)

### Step 3: Test Scrolling
1. Navigate to the learning path page
2. Click "Start" button to view study material
3. Scroll up and down the page
4. Verify no redirects occur

### Step 4: Check Console
Open browser console (F12) and look for:
- `[404-Handler] Blocked request for non-existent file:` messages
- `[Error Handler] Prevented redirect due to missing source file:` messages

These messages indicate the fix is working correctly.

## Additional Debugging

### If Issue Persists

1. **Try Incognito Mode**
   - Disables browser extensions
   - Rules out extension interference

2. **Check Network Tab**
   - Open DevTools → Network tab
   - Look for requests with 204 status (success)
   - Check "Initiator" column to see what triggered requests

3. **Disable Source Maps Temporarily**
   ```typescript
   // In vite.config.ts
   build: {
     sourcemap: false
   }
   ```

4. **Check for CSS Module Issues**
   ```bash
   grep -r "import.*\.module\." frontend/src/
   ```

## Production Deployment

For production, the nginx configuration in `frontend/nginx.prod.conf` already handles this:
- Blocks source file requests at nginx level
- Returns 444 (connection closed) for `.tsx`, `.ts`, `.jsx`, `.map` files
- Proper SPA routing with fallback to `index.html`

## Files Modified

1. ✅ `frontend/vite-plugins/handle-404.ts` (created)
2. ✅ `frontend/vite.config.ts` (updated)
3. ✅ `frontend/src/main.tsx` (updated)

## Status
✅ **IMPLEMENTED** - Ready for testing

## Next Steps

1. Restart frontend container: `docker-compose restart frontend`
2. Clear browser cache and test
3. If issue persists, try incognito mode
4. Check console for debug messages
5. Report results for further investigation if needed

## Date
January 15, 2026

## Notes
- This fix is specific to development mode
- Production mode uses nginx configuration (already implemented)
- The fix is non-invasive and doesn't affect normal application behavior
- All 404s for source files are logged for debugging purposes
