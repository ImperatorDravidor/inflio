# Environment Setup

## Required Environment Variables

Create a `.env.local` file in your project root with the following variables:

```bash
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Klap API
NEXT_PUBLIC_KLAP_API_KEY=your_klap_api_key
NEXT_PUBLIC_KLAP_API_URL=https://api.klap.pro

# Optional: OpenAI for blog generation
OPENAI_API_KEY=your_openai_api_key

# Optional: Whisper API for transcription fallback
WHISPER_API_KEY=your_whisper_api_key
```

## Getting API Keys

### Supabase
1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Create a new project
3. Go to Settings → API
4. Copy your project URL and anon key

### Klap API
1. Sign up at [Klap.pro](https://klap.pro)
2. Go to your dashboard
3. Navigate to API settings
4. Generate and copy your API key

### Clerk
1. Sign up at [Clerk.com](https://clerk.com)
2. Create a new application
3. Go to API Keys
4. Copy your publishable and secret keys

## Storage Setup

After setting up Supabase, make sure to:
1. Create a `videos` bucket in Storage
2. Set it as public
3. Configure the RLS policies as described in [Supabase Storage Setup](./supabase-storage-setup.md) 