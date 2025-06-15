# Environment Variables Setup Guide

This guide explains all the environment variables required for the Inflio video processing platform to work in production.

## Required Environment Variables

Create a `.env.local` file in the root of your project with the following variables:

```bash
# Clerk Authentication (Required)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
CLERK_SECRET_KEY=sk_test_xxxxx
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding

# Supabase (Required)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxxxx

# OpenAI API (Required for Transcription)
OPENAI_API_KEY=sk-xxxxx

# Klap API (Required for Video Clips)
KLAP_API_KEY=klap_xxxxx

# Optional - Klap API Configuration
KLAP_API_URL=https://api.klap.app/v2  # Default value, can be omitted

# Optional - File Size Configuration
NEXT_PUBLIC_MAX_FILE_SIZE=524288000  # Max upload size in bytes (default: 500MB)
```

## Getting Your API Keys

### 1. Clerk Authentication
1. Sign up at [clerk.com](https://clerk.com)
2. Create a new application
3. Copy the publishable and secret keys from the API Keys section

### 2. Supabase
1. Create an account at [supabase.com](https://supabase.com)
2. Create a new project
3. Go to Settings → API
4. Copy the Project URL and anon/public key

### 3. OpenAI API
1. Sign up at [platform.openai.com](https://platform.openai.com)
2. Go to API Keys section
3. Create a new secret key
4. **Important**: OpenAI charges for API usage. Whisper API costs ~$0.006 per minute of audio

### 4. Klap API
1. Sign up at [klap.app](https://klap.app)
2. Go to your developer settings
3. Generate an API key
4. **Note**: Klap API has usage limits based on your plan

## Environment Variables by Feature

### Core Features (Required)
- `NEXT_PUBLIC_CLERK_*` - User authentication
- `NEXT_PUBLIC_SUPABASE_*` - Database and file storage

### Video Processing Features
- `OPENAI_API_KEY` - Video transcription using Whisper
- `KLAP_API_KEY` - AI-powered clip generation

### Optional Features
- Additional AI services can be configured as needed

## Testing Your Setup

Run this test script to verify all required environment variables are set:

```javascript
// test-env.js
const required = [
  'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
  'CLERK_SECRET_KEY',
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'OPENAI_API_KEY',
  'KLAP_API_KEY'
]

const missing = required.filter(key => !process.env[key])

if (missing.length > 0) {
  console.error('❌ Missing required environment variables:')
  missing.forEach(key => console.error(`   - ${key}`))
  process.exit(1)
} else {
  console.log('✅ All required environment variables are set!')
}
```

## Production Deployment

When deploying to production (Vercel, Netlify, etc.):

1. Add all environment variables to your hosting platform
2. Remove any test/development keys
3. Use production API keys from each service
4. Enable rate limiting and monitoring

## Security Best Practices

1. **Never commit `.env.local` to git** - It's already in `.gitignore`
2. **Use different API keys for development and production**
3. **Set up spending limits** on OpenAI and other paid services
4. **Monitor API usage** to prevent unexpected charges
5. **Rotate keys regularly** for security

## Troubleshooting

### "OpenAI API key not configured"
- Ensure `OPENAI_API_KEY` is set in `.env.local`
- Restart your development server after adding the key

### "Klap API key not configured"
- Ensure `KLAP_API_KEY` is set in `.env.local`
- Check that your Klap account is active

### "Failed to upload to storage"
- Verify Supabase keys are correct
- Check that storage buckets are created (see storage setup guide)

## Cost Estimation

- **OpenAI Whisper**: ~$0.36 per hour of video
- **Klap API**: Based on your plan (typically per video processed)
- **Supabase**: Free tier includes 1GB storage, 2GB bandwidth
- **Clerk**: Free tier includes 5,000 monthly active users