# Fix Auth Issue - System Clock Problem

## Root Cause
Your system clock is incorrect, causing Clerk JWT tokens to be rejected as "not yet valid".

**Your system clock**: Wed, Nov 5, 2025 23:45:38 GMT  
**JWT token date**: Thu, Nov 6, 2025 21:11:04 GMT  
**Difference**: ~21 hours behind

## Steps to Fix

### 1. Fix Your System Clock (CRITICAL)

**Windows 10/11:**
```
1. Right-click on the clock in the taskbar
2. Select "Adjust date/time"
3. Turn OFF "Set time automatically"
4. Wait 5 seconds
5. Turn ON "Set time automatically"
6. Click "Sync now" under "Synchronize your clock"
```

**Alternative Command Line Fix:**
```powershell
# Run PowerShell as Administrator
Stop-Service w32time
w32tm /unregister
w32tm /register
Start-Service w32time
w32tm /resync /force
```

### 2. Clear Browser Data

**Chrome/Edge:**
```
1. Press Ctrl+Shift+Delete
2. Select "All time" for time range
3. Check:
   - Cookies and other site data
   - Cached images and files
4. Click "Clear data"
```

**Or manually:**
```
1. Open DevTools (F12)
2. Go to Application tab
3. Storage → Clear site data
4. Close all browser tabs for localhost:3000
```

### 3. Restart Dev Server

```bash
# Stop the current server (Ctrl+C)
# Then restart
npm run dev
```

### 4. Test Again

1. Go to http://localhost:3000
2. Sign in fresh
3. Should redirect to dashboard properly

## Why This Happened

Clerk uses JWT tokens with time-based claims:
- `nbf` (not before): Token not valid before this time
- `exp` (expiration): Token expires after this time
- `iat` (issued at): When token was created

When your system clock is wrong, tokens appear to be "from the future" and get rejected, causing:
- Authentication failures
- Infinite redirect loops  
- "Unexpected token '<'" errors (because auth fails, returning HTML error pages instead of JSON)

## Verification

After fixing, check the debug endpoint:
```
http://localhost:3000/api/debug-auth
```

Should show:
```json
{
  "clerkAuth": {
    "authenticated": true,
    "userId": "user_...",
    "email": "your@email.com"
  },
  "environment": {
    "supabaseUrl": true,
    "supabaseKey": true,
    "clerkPublishable": true,
    "clerkSecret": true
  },
  "supabase": {
    "canConnect": true,
    "profileExists": true or false,
    "error": null
  }
}
```


