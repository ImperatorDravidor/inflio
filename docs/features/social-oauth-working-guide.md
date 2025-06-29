# Social Media OAuth - Working Implementation Guide

## ✅ Current Status

Based on your configuration:
- **Google (YouTube)**: ✅ Ready to connect
- **Facebook & Instagram**: ✅ Ready to connect
- **X (Twitter)**: ❌ Not configured
- **LinkedIn**: ❌ Not configured

## 🚀 Quick Fix

Add this to your `.env.local`:
```bash
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 📋 How It Works

### 1. OAuth Flow Architecture

```
User clicks "Connect" → /api/social/connect → OAuth Provider → /api/social/callback/[platform] → Success
```

### 2. File Structure
- `/api/social/connect` - Initiates OAuth flow
- `/api/social/callback/[platform]` - Handles OAuth callback
- `/lib/social/oauth-config.ts` - Platform configurations
- `/components/social/social-account-connector.tsx` - UI component

### 3. Database Storage
Connected accounts are stored in `social_integrations` table with:
- OAuth tokens (encrypted)
- User profile info
- Token expiration tracking
- Refresh token support

## 🎯 Testing Your Setup

### 1. For Google (YouTube)
```bash
# Your callback URL:
http://localhost:3000/api/social/callback/youtube

# In Google Cloud Console:
1. Go to APIs & Services > Credentials
2. Edit your OAuth 2.0 Client
3. Add authorized redirect URI (exactly as above)
4. Save
```

### 2. For Facebook & Instagram
```bash
# Your callback URL:
http://localhost:3000/api/social/callback/facebook

# In Facebook Developers:
1. Go to Facebook Login > Settings
2. Add Valid OAuth Redirect URI (exactly as above)
3. Save Changes
```

## 🔧 Troubleshooting

### Common Issues

1. **"redirect_uri_mismatch" error**
   - The callback URL must match EXACTLY
   - No trailing slashes
   - Check http vs https
   - Platform name must match (youtube, not google)

2. **"Invalid client" error**
   - Check credentials are copied correctly
   - No extra spaces or quotes
   - Refresh the page and try again

3. **Connection hangs**
   - Check browser console for errors
   - Ensure popup blockers are disabled
   - Try in incognito mode

### Debug Checklist

1. Run `npm run test:oauth` to verify configuration
2. Check browser console for errors
3. Check network tab for failed requests
4. Verify callback URLs in platform settings
5. Check Supabase logs for database errors

## 📝 Platform-Specific Notes

### Google/YouTube
- Requires "YouTube Data API v3" enabled
- May need to verify domain ownership
- Test mode allows up to 100 users

### Facebook/Instagram
- Requires Business verification for production
- Instagram needs Facebook Page connection
- Test mode works without review

## 🚦 Next Steps

1. **Connect Your Accounts**
   - Go to `/social` → Accounts tab
   - Click "Connect Account" on Google or Facebook
   - Authorize the app
   - You'll be redirected back with success message

2. **Verify Connection**
   - Check for green "Connected" badge
   - See your profile info displayed
   - Try the "View Profile" button

3. **Start Publishing**
   - Create content
   - Select connected platforms
   - Schedule or publish immediately

## 💻 Development Tips

### Testing OAuth Locally
```bash
# 1. Start dev server
npm run dev

# 2. Open browser
http://localhost:3000/social

# 3. Go to Accounts tab
# 4. Click Connect on configured platforms
```

### Checking Logs
```bash
# Browser console for frontend errors
# Terminal for API route errors
# Supabase dashboard for database errors
```

### Reset Connection
```sql
-- If you need to reset a connection
DELETE FROM social_integrations 
WHERE user_id = 'your-clerk-user-id' 
AND platform = 'youtube';
```

## 🔐 Security Notes

- Tokens are stored encrypted in Supabase
- Refresh tokens enable long-term access
- HTTPS required in production
- CSRF protection via state parameter

---

**Working Platforms**: Google (YouTube) ✅ | Facebook & Instagram ✅

For X and LinkedIn setup, add their OAuth credentials to `.env.local` following the same pattern. 