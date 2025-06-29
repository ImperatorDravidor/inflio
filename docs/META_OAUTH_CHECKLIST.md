# Meta (Facebook/Instagram) OAuth Setup Checklist

## Prerequisites
- [ ] Facebook account
- [ ] Instagram account (for Instagram features)
- [ ] Business/Creator account on Instagram (for API access)

## App Creation
- [ ] Created app at developers.facebook.com
- [ ] Selected "Business" app type
- [ ] Added Facebook Login product
- [ ] Added Instagram Basic Display product
- [ ] Added Instagram Graph API product

## OAuth Configuration
- [ ] Added redirect URIs for development:
  - `http://localhost:3000/api/auth/callback/facebook`
- [ ] Added redirect URIs for production:
  - `https://yourdomain.com/api/auth/callback/facebook`
- [ ] Enabled Client OAuth Login
- [ ] Enabled Web OAuth Login

## Credentials
- [ ] Copied App ID to `FACEBOOK_APP_ID`
- [ ] Copied App Secret to `FACEBOOK_APP_SECRET`
- [ ] Added both to `.env.local`

## Testing
- [ ] Added test users (or using own account)
- [ ] Test user has Instagram account connected
- [ ] App is in Development mode for testing

## Permissions Needed
For Facebook:
- [ ] `pages_show_list`
- [ ] `pages_read_engagement`
- [ ] `pages_manage_posts`

For Instagram:
- [ ] `instagram_basic`
- [ ] `instagram_content_publish`
- [ ] `instagram_manage_insights`

## Important URLs
- Developer Dashboard: https://developers.facebook.com/apps/YOUR_APP_ID
- App Settings: https://developers.facebook.com/apps/YOUR_APP_ID/settings/basic/
- Test Users: https://developers.facebook.com/apps/YOUR_APP_ID/roles/test-users/

## Troubleshooting
- If "Invalid OAuth redirect URI": Check URLs match exactly
- If "App not active": Switch to Development mode
- If "Permissions denied": User needs Business/Creator account
- If can't see Instagram: Ensure Facebook & Instagram accounts are linked 