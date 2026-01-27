# Learning Path Scroll Redirect - Debugging Guide

## Issue Description
When scrolling on the learning path page, 404 errors occur for non-existent files (like `curriculum-style.tsx`), causing redirects back to the start button page.

## Root Cause Analysis

### Symptoms
1. Network tab shows 404 errors for `.tsx` files when scrolling
2. Files requested: `curriculum-style.tsx`, `curriculum-style-id-...`
3. Page redirects back to start button after scroll
4. Issue occurs in development mode (Vite dev server)

### Likely Causes
1. **Source Maps**: Vite might be trying to load source maps for files that don't exist
2. **Dynamic Imports**: Lazy loading or code splitting might be referencing wrong paths
3. **CSS Modules**: CSS module references might be malformed
4. **React DevTools**: Browser extensions might be trying to load source files

## Immediate Fixes Applied

### 1. Nginx Configuration (Production)
Updated `frontend/nginx.prod.conf` to block source file requests:
- Added rules to deny `.tsx`, `.ts`, `.jsx`, `.js` source files
- Added rules to deny `.map` files
- Enhanced SPA routing for React Router

### 2. Vite Configuration Check
- Verified Vite config is correct
- Source maps are enabled (which is fine for development)
- No obvious misconfigurations

## Next Steps for Debugging

### Step 1: Check Browser Console
Open the browser console (F12) and look for:
1. Any error messages before the 404s
2. Stack traces that show where the requests originate
3. React component errors

### Step 2: Disable Browser Extensions
Temporarily disable all browser extensions, especially:
- React DevTools
- Redux DevTools
- Any code inspection tools

### Step 3: Check Network Tab Details
For each 404 request, check:
1. **Initiator**: What triggered the request?
2. **Request Headers**: Are there any unusual headers?
3. **Timing**: When does it happen (on scroll, on load, etc.)?

### Step 4: Verify Source Maps
Check if disabling source maps helps:

```typescript
// In vite.config.ts
build: {
  sourcemap: false, // Try disabling
  // ...
}
```

### Step 5: Check for CSS Module Issues
Search for any CSS imports that might be malformed:

```bash
# Search for CSS imports
grep -r "import.*\.module\." frontend/src/
```

### Step 6: Add Error Boundary Logging
Add detailed logging to the ErrorBoundary component to catch any rendering errors.

## Temporary Workaround

If the issue persists, you can add a global error handler to prevent redirects:

```typescript
// In frontend/src/main.tsx or App.tsx
window.addEventListener('error', (event) => {
  // Check if it's a 404 for a source file
  if (event.message && event.message.includes('.tsx')) {
    event.preventDefault();
    console.warn('Prevented redirect due to source file 404:', event.message);
  }
});
```

## Production Deployment

For production, the nginx configuration changes will prevent these issues:
1. Source files are blocked at the nginx level
2. All SPA routes properly fall back to index.html
3. No 404 errors will reach the browser

## Testing Checklist

- [ ] Clear browser cache and hard reload (Ctrl+Shift+R)
- [ ] Test in incognito mode (no extensions)
- [ ] Test in different browser (Chrome, Firefox, Edge)
- [ ] Check if issue occurs on initial load or only on scroll
- [ ] Verify API calls are working correctly
- [ ] Check if issue occurs with network throttling disabled

## Contact Points

If the issue persists after trying these steps:
1. Capture a HAR file from the network tab
2. Take screenshots of the console errors
3. Note the exact steps to reproduce
4. Check if it happens with specific content or all content

## Status
🔍 **INVESTIGATING** - Nginx fixes applied for production, investigating development mode issue.

## Date
January 15, 2026
