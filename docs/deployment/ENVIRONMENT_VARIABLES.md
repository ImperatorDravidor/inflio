# Production Environment Variables Guide

## 🔐 Security First

**NEVER commit `.env.local` or any file with real credentials to version control!**

## 📋 Complete Configuration Template

Copy this configuration to your `.env.local` file and fill in your production values:

```bash
# ============================================
# CORE APPLICATION
# ============================================

# Your production domain (no trailing slash)
NEXT_PUBLIC_APP_URL=https://your-domain.com

# Node environment
NODE_ENV=production

# ============================================
# SECURITY & ADMIN ACCESS
# ============================================

# Comma-separated list of admin email addresses
# These users can access debug/test endpoints in production
ADMIN_EMAILS=admin@example.com,developer@example.com

# ============================================
# DATABASE - SUPABASE (REQUIRED)
# ============================================

# Get these from: https://app.supabase.com/project/YOUR_PROJECT/settings/api
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...your-anon-key
SUPABASE_SERVICE_ROLE_KEY=eyJ...your-service-role-key

# Database connection string (for migrations)
DATABASE_URL=postgresql://postgres:password@db.your-project.supabase.co:5432/postgres

# ============================================
# AUTHENTICATION - CLERK (REQUIRED)
# ============================================

# Get these from: https://dashboard.clerk.com/apps/YOUR_APP/instances
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...

# Clerk URLs (update domain)
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding

# Webhook signing secret (for user sync)
CLERK_WEBHOOK_SECRET=whsec_...

# ============================================
# AI SERVICES (REQUIRED FOR CORE FEATURES)
# ============================================

# OpenAI - For transcription and content analysis
# Get from: https://platform.openai.com/api-keys
OPENAI_API_KEY=sk-proj-...

# Klap AI - For video clip generation (REQUIRED)
# Get from: https://klap.app/developers
KLAP_API_KEY=kak_...

# Google Gemini - For content generation
# Get from: https://makersuite.google.com/app/apikey
GOOGLE_GENERATIVE_AI_API_KEY=AIza...

# Replicate - For advanced AI features (optional)
# Get from: https://replicate.com/account/api-tokens
REPLICATE_API_TOKEN=r8_...

# FAL AI - For thumbnail generation (optional)
# Get from: https://fal.ai/dashboard/keys
FAL_KEY=fal_...

# ============================================
# SOCIAL MEDIA OAUTH (Add as needed)
# ============================================

# Twitter/X
# Create app at: https://developer.twitter.com/en/apps
TWITTER_CLIENT_ID=
TWITTER_CLIENT_SECRET=
TWITTER_BEARER_TOKEN=

# Facebook/Instagram
# Create app at: https://developers.facebook.com/apps
FACEBOOK_APP_ID=
FACEBOOK_APP_SECRET=
FACEBOOK_ACCESS_TOKEN=

# LinkedIn
# Create app at: https://www.linkedin.com/developers/apps
LINKEDIN_CLIENT_ID=
LINKEDIN_CLIENT_SECRET=

# YouTube
# Create project at: https://console.cloud.google.com
YOUTUBE_CLIENT_ID=
YOUTUBE_CLIENT_SECRET=
YOUTUBE_API_KEY=

# TikTok
# Create app at: https://developers.tiktok.com/apps
TIKTOK_CLIENT_KEY=
TIKTOK_CLIENT_SECRET=

# ============================================
# MONITORING & ANALYTICS (Optional)
# ============================================

# Sentry - Error tracking
# Get from: https://sentry.io/settings/YOUR_ORG/projects/YOUR_PROJECT/keys/
SENTRY_DSN=https://...@sentry.io/...
SENTRY_AUTH_TOKEN=
SENTRY_ORG=
SENTRY_PROJECT=

# Upstash Redis - Rate limiting
# Get from: https://console.upstash.com
UPSTASH_REDIS_REST_URL=https://...upstash.io
UPSTASH_REDIS_REST_TOKEN=

# QStash - Background jobs
# Get from: https://console.upstash.com/qstash
QSTASH_URL=https://qstash.upstash.io
QSTASH_TOKEN=
QSTASH_CURRENT_SIGNING_KEY=
QSTASH_NEXT_SIGNING_KEY=

# ============================================
# MEDIA & STORAGE
# ============================================

# Cloudinary - Image processing (optional)
# Get from: https://cloudinary.com/console
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Maximum file sizes
NEXT_PUBLIC_MAX_FILE_SIZE=2147483648  # 2GB in bytes
NEXT_PUBLIC_MAX_VIDEO_DURATION=7200   # 2 hours in seconds

# ============================================
# FEATURE FLAGS
# ============================================

# Enable/disable features
NEXT_PUBLIC_ENABLE_SOCIAL_PUBLISHING=true
NEXT_PUBLIC_ENABLE_AI_THUMBNAILS=true
NEXT_PUBLIC_ENABLE_BLOG_GENERATION=true
NEXT_PUBLIC_ENABLE_ANALYTICS=true
```

## 🚀 Quick Start (Minimum Required)

For a basic working deployment, you need at least:

```bash
# Core
NEXT_PUBLIC_APP_URL=https://your-domain.com
NODE_ENV=production

# Supabase (all required)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Clerk (all required)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=

# Klap AI (required for video processing)
KLAP_API_KEY=

# Admin access
ADMIN_EMAILS=your-email@example.com
```

## 📦 Service Setup Guides

### Supabase Setup
1. Create account at [supabase.com](https://supabase.com)
2. Create new project
3. Go to Settings → API
4. Copy the URL and keys
5. Run migrations from `/migrations` folder

### Clerk Setup
1. Create account at [clerk.com](https://clerk.com)
2. Create new application
3. Go to API Keys
4. Copy publishable and secret keys
5. Configure OAuth providers if needed

### Klap AI Setup
1. Sign up at [klap.app](https://klap.app)
2. Go to Developer settings
3. Generate API key
4. Note: This is required for video processing

### Social Media OAuth Setup

Each platform requires:
1. Creating a developer app
2. Setting callback URL: `https://your-domain.com/api/social/callback/[platform]`
3. Getting client ID and secret
4. Adding to environment variables

Platform-specific guides:
- [Twitter Developer Portal](https://developer.twitter.com/en/docs/authentication/oauth-2-0)
- [Facebook for Developers](https://developers.facebook.com/docs/facebook-login)
- [LinkedIn OAuth](https://docs.microsoft.com/en-us/linkedin/shared/authentication/authorization-code-flow)
- [YouTube Data API](https://developers.google.com/youtube/v3/getting-started)
- [TikTok for Developers](https://developers.tiktok.com/doc/login-kit-web)

## 🔒 Security Best Practices

1. **Never commit credentials**
   - Use `.env.local` (it's in .gitignore)
   - Never commit even example files with real values

2. **Use different credentials per environment**
   - Separate keys for development/staging/production
   - Rotate keys regularly

3. **Restrict admin access**
   - Only add trusted emails to `ADMIN_EMAILS`
   - Remove unused admin accounts

4. **Enable 2FA**
   - On all service accounts (Supabase, Clerk, etc.)
   - On your deployment platform (Vercel, etc.)

5. **Monitor usage**
   - Set up alerts for unusual API usage
   - Review logs regularly
   - Use rate limiting

## 🚀 Deployment Platforms

### Vercel
1. Import your GitHub repository
2. Go to Settings → Environment Variables
3. Add all variables (no quotes needed)
4. Deploy

### Netlify
1. Import from Git
2. Site settings → Environment variables
3. Add all variables
4. Deploy

### Self-hosted
1. Create `.env.local` file
2. Add all variables
3. Run `npm run build && npm start`

## 🧪 Testing Your Configuration

After adding environment variables, test:

```bash
# 1. Check environment variables are loaded
npm run dev
# Visit /api/env-check (only in dev mode)

# 2. Test database connection
# Try to sign up a new user

# 3. Test video upload
# Upload a small test video

# 4. Test social OAuth (if configured)
# Try connecting a social account
```

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Clerk Documentation](https://clerk.com/docs)
- [Klap API Documentation](https://klap.app/developers)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)

## ❓ Common Issues

### "Missing environment variable" error
- Ensure all required variables are set
- Restart your development server after adding variables
- Check for typos in variable names

### "Invalid API key" errors
- Verify keys are copied correctly (no extra spaces)
- Check you're using production keys in production
- Ensure API services are activated

### Social OAuth not working
- Verify callback URLs match exactly
- Check OAuth app is approved/published
- Ensure all required scopes are requested

### Database connection issues
- Verify Supabase project is active
- Check connection pooling settings
- Ensure RLS policies are configured

## 📞 Support

If you need help with configuration:
1. Check service-specific documentation
2. Review error logs in your deployment platform
3. Test with minimal configuration first
4. Add services incrementally