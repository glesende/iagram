# Testing Guide: Likes Functionality Fix

## Overview
This guide explains how to test the likes functionality fix for anonymous users (task #309).

## What Was Fixed

The likes functionality was broken for anonymous users because API routes didn't have session middleware enabled. This fix:

1. **Backend Changes:**
   - Added session middleware to API routes (`Kernel.php`)
   - Configured sessions for cross-origin requests (`session.php`)
   - Added session environment variables to `docker-compose.yml`

2. **Frontend Changes:**
   - Added `credentials: 'include'` to API requests to send cookies

## How to Test

### Prerequisites
```bash
# Rebuild containers to apply environment variable changes
make down
make build
make up
```

### Test Steps

1. **Open the application:**
   - Navigate to `http://localhost:3000`

2. **Test Like Functionality:**
   - Click the heart icon on any post
   - ✅ The heart should turn red
   - ✅ The likes count should increment
   - ✅ No errors should appear in browser console

3. **Test Unlike Functionality:**
   - Click the heart icon again on the same post
   - ✅ The heart should turn gray
   - ✅ The likes count should decrement

4. **Test Session Persistence:**
   - Like a post
   - Refresh the page (F5)
   - ✅ The post should still show as liked (red heart)
   - ✅ The likes count should remain the same

5. **Test Multiple Sessions:**
   - Like a post in one browser
   - Open the same URL in a private/incognito window
   - Like the same post
   - ✅ Both sessions should be able to like independently
   - ✅ Likes count should show total from all sessions

### Expected Behavior

**Before the fix:**
- Clicking like/unlike would fail silently or show errors
- Sessions were not created for anonymous users
- `$request->session()->getId()` would fail

**After the fix:**
- Likes work seamlessly for anonymous users
- Sessions are created automatically via cookies
- Each browser session can like/unlike independently
- Likes persist across page refreshes within the same session

### Troubleshooting

If likes still don't work:

1. **Check browser console for errors:**
   ```
   Open DevTools (F12) → Console tab
   Look for any red error messages
   ```

2. **Verify cookies are being sent:**
   ```
   Open DevTools (F12) → Network tab
   Click like on a post
   Find the POST request to /api/posts/{id}/like
   Check Headers → Request Headers → Cookie
   Should contain "iagram_session=..."
   ```

3. **Check backend logs:**
   ```bash
   make logs
   # Look for any errors when liking posts
   ```

4. **Verify CORS configuration:**
   ```bash
   # Check that backend/config/cors.php has:
   # 'supports_credentials' => true
   # 'allowed_origins' includes http://localhost:3000
   ```

## Technical Details

### Session Flow
1. Frontend makes API request with `credentials: 'include'`
2. Backend `StartSession` middleware creates/loads session
3. Session ID stored in encrypted cookie `iagram_session`
4. Cookie sent automatically with subsequent requests
5. Backend uses `$request->session()->getId()` to track likes

### Database Schema
Likes are stored with multiple identifiers for redundancy:
- `user_id`: For authenticated users (future feature)
- `session_id`: For anonymous users via session
- `ip_address`: Fallback identifier

### Security Considerations
- Sessions use `SameSite=None` for cross-origin support (localhost:3000 → localhost:8000)
- Cookies are encrypted via `EncryptCookies` middleware
- `SESSION_SECURE_COOKIE=false` in development (use `true` in production with HTTPS)

## Next Steps

After testing, if everything works:
1. ✅ Mark task #309 as completed
2. 🚀 Consider adding user authentication for persistent likes
3. 📊 Track like engagement metrics with analytics

---
Generated for task #309: Fix likes functionality for anonymous users
