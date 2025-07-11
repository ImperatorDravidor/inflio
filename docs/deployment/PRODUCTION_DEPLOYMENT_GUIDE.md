# 🚀 Production Deployment Guide - Inflio

## ✅ Pre-Deployment Checklist

### 1. Build Status
- [x] **Build passes locally**: `npm run build` ✅
- [ ] **TypeScript errors resolved**: No type errors
- [ ] **Linting passes**: `npm run lint`
- [ ] **Tests pass**: All tests green (if applicable)

### 2. Environment Variables
Ensure ALL these are configured in your deployment platform:

#### Core Requirements
```bash
# Database
DATABASE_URL=                    # Supabase PostgreSQL connection string
NEXT_PUBLIC_SUPABASE_URL=       # Your Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=  # Supabase anonymous key
SUPABASE_SERVICE_ROLE_KEY=      # Supabase service role key

# Authentication
CLERK_SECRET_KEY=               # Clerk secret key
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY= # Clerk publishable key
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_SIGN_IN_FORCE_REDIRECT_URL=/dashboard
NEXT_PUBLIC_CLERK_SIGN_UP_FORCE_REDIRECT_URL=/onboarding

# AI Services
OPENAI_API_KEY=                 # OpenAI API key
REPLICATE_API_TOKEN=            # Replicate API token (for video processing)

# Video Processing
KLAP_API_URL=https://klap.app/api/v1
KLAP_API_KEY=                   # Your Klap API key

# App Configuration
NEXT_PUBLIC_APP_URL=https://your-domain.com  # Your production URL
```

#### Social Media OAuth (Optional but Recommended)
```bash
# Facebook & Instagram
FACEBOOK_APP_ID=
FACEBOOK_APP_SECRET=
INSTAGRAM_CLIENT_ID=            # Same as Facebook App ID
INSTAGRAM_CLIENT_SECRET=        # Same as Facebook App Secret

# YouTube
YOUTUBE_CLIENT_ID=
YOUTUBE_CLIENT_SECRET=

# X (Twitter)
TWITTER_CLIENT_ID=
TWITTER_CLIENT_SECRET=

# LinkedIn
LINKEDIN_CLIENT_ID=
LINKEDIN_CLIENT_SECRET=
```

#### Additional Services (Optional)
```bash
# Error Tracking
SENTRY_DSN=
SENTRY_AUTH_TOKEN=
NEXT_PUBLIC_SENTRY_DSN=

# Analytics
NEXT_PUBLIC_GA_MEASUREMENT_ID=
NEXT_PUBLIC_MIXPANEL_TOKEN=
```

### 3. Database Migrations
Run all migrations in order:

```bash
# 1. Core schema
supabase db push < migrations/supabase-schema.sql

# 2. User profiles
supabase db push < migrations/supabase-user-profiles-schema-no-vector.sql

# 3. Social media features
supabase db push < migrations/social-media-schema.sql

# 4. Publishing workflow
supabase db push < migrations/complete-publishing-workflow.sql

# 5. Staging sessions
supabase db push < migrations/staging-sessions.sql

# 6. Analytics
supabase db push < migrations/social-media-analytics.sql

# 7. Content analysis
supabase db push < migrations/add-content-analysis.sql

# 8. Blog structure fix
supabase db push < migrations/fix-blog-structure.sql

# 9. Project deletion cascade
supabase db push < migrations/fix-project-deletion-cascade.sql

# 10. Large file support
supabase db push < migrations/supabase-large-files.sql

# 11. Subtitle storage
supabase db push < migrations/supabase-subtitle-storage.sql
```

### 4. Supabase Storage Buckets
Create these storage buckets in Supabase:

1. **project-media** (Public)
   - For video files, thumbnails, and clips
   - Set max file size: 5GB
   
2. **ai-images** (Public)
   - For AI-generated images
   - Set max file size: 50MB

3. **subtitles** (Public)
   - For VTT subtitle files
   - Set max file size: 10MB

### 5. OAuth Redirect URLs
Update all platform OAuth settings with production URLs:

- Facebook/Instagram: `https://your-domain.com/api/social/callback/facebook`
- YouTube: `https://your-domain.com/api/social/callback/youtube`
- X/Twitter: `https://your-domain.com/api/social/callback/x`
- LinkedIn: `https://your-domain.com/api/social/callback/linkedin`

## 🚀 Deployment to Vercel

### Step 1: Prepare Repository
```bash
# Ensure latest changes are committed
git add .
git commit -m "Prepare for production deployment"
git push origin main
```

### Step 2: Import to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click "Import Project"
3. Connect your GitHub repository
4. Select your repository

### Step 3: Configure Project

1. **Framework Preset**: Next.js (Auto-detected)
2. **Root Directory**: `./` (leave as is)
3. **Build Command**: `npm run build`
4. **Output Directory**: `.next` (leave as is)
5. **Install Command**: `npm install`

### Step 4: Environment Variables

1. Click "Environment Variables"
2. Add ALL variables from the checklist above
3. Ensure proper formatting (no quotes needed in Vercel)

### Step 5: Deploy

1. Click "Deploy"
2. Wait for build to complete (5-10 minutes)
3. Check build logs for any errors

## 📊 Post-Deployment Verification

### 1. Core Functionality
- [ ] **Homepage loads**: Check landing page
- [ ] **Authentication works**: Sign up/Sign in flow
- [ ] **Onboarding completes**: New user flow
- [ ] **Dashboard accessible**: User can see dashboard

### 2. Video Processing
- [ ] **Upload works**: Can upload video files
- [ ] **Transcription runs**: Video gets transcribed
- [ ] **Clips generate**: Klap processing works
- [ ] **Subtitles apply**: Can add subtitles

### 3. Content Generation
- [ ] **Blog generation**: AI creates blog posts
- [ ] **Social captions**: Generates platform captions
- [ ] **Image generation**: AI images work
- [ ] **Publishing flow**: Can publish content

### 4. Social Media
- [ ] **OAuth connects**: Can connect social accounts
- [ ] **Analytics load**: Social analytics display
- [ ] **Publishing works**: Can schedule posts

## 🔧 Troubleshooting

### Build Failures

1. **Module not found**
   - Check all imports are correct
   - Ensure all dependencies in package.json

2. **TypeScript errors**
   - Run `npm run build` locally first
   - Fix all type errors before deploying

3. **Environment variable missing**
   - Double-check all vars in Vercel
   - Check for typos in variable names

### Runtime Errors

1. **Database connection failed**
   - Verify DATABASE_URL is correct
   - Check Supabase project is active
   - Ensure connection pooling enabled

2. **OAuth redirect fails**
   - Update redirect URLs in platform settings
   - Ensure NEXT_PUBLIC_APP_URL is set correctly
   - Check platform app is in production mode

3. **File upload fails**
   - Verify storage buckets exist
   - Check file size limits
   - Ensure CORS configured properly

### Performance Issues

1. **Slow page loads**
   - Enable Vercel Edge Functions
   - Check for large bundle sizes
   - Optimize images and videos

2. **API timeouts**
   - Increase function timeout in vercel.json
   - Optimize database queries
   - Add proper caching

## 📈 Monitoring

### 1. Set Up Monitoring
- Enable Vercel Analytics
- Configure Sentry error tracking
- Set up uptime monitoring

### 2. Regular Checks
- Monitor error rates
- Check performance metrics
- Review user feedback

## 🔐 Security

### 1. API Keys
- Rotate keys regularly
- Use environment-specific keys
- Never commit secrets to git

### 2. Database
- Enable Row Level Security (RLS)
- Regular backups
- Monitor for suspicious activity

### 3. File Uploads
- Validate file types
- Scan for malware
- Limit file sizes

## 📝 Maintenance

### Regular Updates
```bash
# Update dependencies
npm update

# Check for vulnerabilities
npm audit

# Fix vulnerabilities
npm audit fix
```

### Database Maintenance
- Regular backups
- Clean old files
- Optimize queries

## 🎉 Launch Checklist

- [ ] All features tested
- [ ] Performance acceptable
- [ ] Security reviewed
- [ ] Monitoring active
- [ ] Documentation updated
- [ ] Team trained
- [ ] Backup plan ready
- [ ] Support channels open

## 📞 Support

If you encounter issues:

1. Check build logs in Vercel
2. Review error tracking in Sentry
3. Check Supabase logs
4. Contact support with:
   - Error messages
   - Steps to reproduce
   - Environment details

---

**Remember**: Always test in a staging environment first before deploying to production! 