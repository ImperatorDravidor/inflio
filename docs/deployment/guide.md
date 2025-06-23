# Inflio Deployment Guide

## Pre-deployment Checklist

### 1. Database Setup (Supabase)
- [ ] Create a Supabase project at [supabase.com](https://supabase.com)
- [ ] Run all SQL migrations in order:
  1. `migrations/supabase-auth-migration.sql`
  2. `migrations/supabase-schema.sql`
  3. `migrations/supabase-user-profiles-schema.sql`
  4. `migrations/fix-missing-user-profiles.sql` (if you have existing users)
- [ ] Enable pgvector extension: `CREATE EXTENSION IF NOT EXISTS vector;`
- [ ] Create storage bucket named "videos" (make it public)

### 2. Environment Variables
Required for deployment:
```env
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
CLERK_WEBHOOK_SECRET=

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# OpenAI
OPENAI_API_KEY=

# Klap (optional)
KLAP_API_KEY=
```

### 3. Clerk Setup
1. Create app at [clerk.com](https://clerk.com)
2. Enable authentication methods (email, Google, etc.)
3. Set up webhook:
   - URL: `https://your-app.vercel.app/api/webhooks/clerk`
   - Events: user.created, user.updated, user.deleted

### 4. Deploy to Vercel
1. Push code to GitHub
2. Import to Vercel
3. Add all environment variables
4. Deploy!

### 5. Post-deployment
1. Test user registration → should redirect to /onboarding
2. Complete onboarding flow
3. Test video upload and processing

## Troubleshooting

### Users not redirected to onboarding
- Check Clerk webhook is configured correctly
- Verify webhook logs in Clerk dashboard
- Check Supabase for user_profiles records

### Database connection issues
- Verify Supabase URL and keys
- Check RLS policies are not blocking access
- Ensure tables were created successfully 