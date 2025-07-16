# Usage Limit Reset Guide

Since usage tracking is currently using localStorage (browser storage), here are several ways to reset your usage limit:

## Method 1: Settings Page (Recommended)
1. Go to Settings → Data Management
2. Click on "Reset Usage Limit"
3. Click either button to reset your usage

## Method 2: Direct URL
Navigate to: `/settings/reset-usage`

## Method 3: Browser Console (Quick Fix)
Open your browser console (F12) and run:
```javascript
// Reset usage to Pro plan with 100 videos
localStorage.setItem('inflio_usage', JSON.stringify({
  used: 0,
  limit: 100,
  plan: 'pro',
  resetDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString()
}));
location.reload();
```

## Method 4: URL Parameter Bypass
Add `?bypass_usage=true` to any upload URL to bypass the limit check:
- Example: `/studio/upload?bypass_usage=true`

## Method 5: Clear Browser Data
1. Open browser settings
2. Clear cookies and site data for this website
3. This will reset all localStorage data including usage

## Production Notes
⚠️ **Important**: This localStorage-based usage tracking is temporary and has these issues:
- Not synced across devices
- Can be easily manipulated
- Lost when clearing browser data
- Not suitable for production

In production, usage should be tracked in the database per user account.

## Environment Variables (For Deployment)
You can set these in Vercel:
- `BYPASS_USAGE_LIMITS=true` - Bypass all usage checks
- `USAGE_LIMIT_OVERRIDE=1000` - Set custom limit
- `BYPASS_USAGE_USER_IDS=user_123,user_456` - Bypass for specific users 