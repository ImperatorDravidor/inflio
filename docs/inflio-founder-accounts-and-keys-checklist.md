## Inflio – Accounts and API Keys Setup (Founder Checklist)

Audience: Non-technical. Use this to set up company accounts and send our team the credentials/keys. Test-mode first. Do not share keys in email; use a secure channel we provide.

What you’ll deliver back to the team: The specific keys/IDs listed under “Send us” for each service.

---

### 1) OpenAI (AI content generation)
- Purpose: AI analysis/generation in projects.
- Create account: `https://platform.openai.com/signup`
- After signup:
  - Add billing: Dashboard → Billing → Add payment method
  - Create key: Dashboard → API Keys → “Create new secret key”
- Send us:
  - OPENAI_API_KEY (secret key)

Notes: Keep keys private; use secure vault we share.

---

### 2) Anthropic (Claude) – optional now
- Purpose: Possible use in onboarding flows if we enable it.
- Create account: `https://console.anthropic.com/`
- After signup:
  - Add billing (Plans & billing)
  - Create key: Console → API Keys → Create
- Send us (only if we greenlight use):
  - ANTHROPIC_API_KEY

---

### 3) AssemblyAI (Transcription)
- Purpose: Converts uploaded video/audio to text.
- Create account: `https://www.assemblyai.com/signup`
- After signup:
  - Dashboard → API Keys → Create
- Send us:
  - ASSEMBLYAI_API_KEY

---

### 4) Klap (Auto video clips)
- Purpose: Generates short clips from long videos.
- Create account: `https://www.klap.app/`
- After signup:
  - Find API area (Account/API) → Generate API key
- Send us:
  - KLAP_API_KEY

---

### 5) Stripe (Payments) – Test mode only
- Purpose: Subscriptions and billing.
- Create account: `https://dashboard.stripe.com/register`
- After signup:
  - Activate account (business details)
  - Use Test mode (toggle on top-right)
  - Developers → API keys → Copy “Publishable key” and “Secret key” (Test)
  - Developers → Webhooks → Add endpoint (we’ll supply URL after deploy)
- Send us:
  - STRIPE_SECRET_KEY (test)
  - STRIPE_PUBLISHABLE_KEY (test) – if available
  - We’ll provide the webhook URL when ready; then send us the STRIPE_WEBHOOK_SECRET

---

### 6) Supabase (Database + Storage)
- Purpose: Our database and file storage.
- Create account: `https://supabase.com/`
- After signup:
  - Create new project
  - Project Settings → API → copy:
    - Project URL
    - anon public key
    - service_role key
- Send us:
  - NEXT_PUBLIC_SUPABASE_URL (Project URL)
  - NEXT_PUBLIC_SUPABASE_ANON_KEY (anon key)
  - SUPABASE_SERVICE_ROLE_KEY (service role key)

---

### 7) Clerk (Authentication)
- Purpose: Sign-in, users, webhooks.
- Create account: `https://clerk.com/` (or `https://dashboard.clerk.com/`)
- After signup:
  - Create new application
  - Dashboard → API Keys → copy:
    - Publishable key
    - Secret key
  - Webhooks: We’ll provide a URL later; you’ll generate a webhook secret
- Send us:
  - NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
  - CLERK_SECRET_KEY
  - When we provide webhook URL: CLERK_WEBHOOK_SECRET

---

### 8) Upstash Redis (Background jobs)
- Purpose: Queueing/background processing via Redis REST.
- Create account: `https://console.upstash.com/`
- After signup:
  - Create Redis database → Details page shows:
    - REST URL
    - REST TOKEN
- Send us:
  - UPSTASH_REDIS_REST_URL
  - UPSTASH_REDIS_REST_TOKEN

---

### 9) Cloudinary (Optional video/image processing)
- Purpose: If we choose Cloudinary provider for media.
- Create account: `https://cloudinary.com/users/register/free`
- After signup:
  - Dashboard → Account Details → copy “CLOUDINARY_URL” or Cloud name + API keys
- Send us (only if we choose Cloudinary):
  - CLOUDINARY_URL

Alternative providers we may use instead of Cloudinary:
- Mux: `https://dashboard.mux.com/` → Settings → Access Tokens → Token ID + Token Secret
  - Send us: MUX_TOKEN_ID, MUX_TOKEN_SECRET
- Shotstack: `https://shotstack.io/signup` → Dashboard → API Keys
  - Send us: SHOTSTACK_API_KEY

---

### 10) FAL (Image generation helper)
- Purpose: Used for thumbnail/image generation workflows.
- Create account: `https://fal.ai/`
- After signup:
  - Dashboard → API Keys → Create
- Send us:
  - FAL_KEY (or FAL_API_KEY if dashboard names it that way)

---

### 11) Platform base URLs we need from you
- Our app URL for test: share the canonical domain we should treat as app’s base URL (e.g., staging domain). We’ll derive redirects and links.
- Send us:
  - NEXT_PUBLIC_APP_URL (e.g., https://staging.inflio.app or http://localhost:3000)

---

### 12) Secure sharing
- Do not email keys. Use our secure vault link (we’ll provide) or password manager item transfer.
- If you must send a document: split values in two channels (SMS + Slack) and set an expiry.

---

### Quick Recap – What to send back
- OpenAI: OPENAI_API_KEY
- AssemblyAI: ASSEMBLYAI_API_KEY
- Klap: KLAP_API_KEY
- Stripe (test): STRIPE_SECRET_KEY (test), STRIPE_PUBLISHABLE_KEY (test); later STRIPE_WEBHOOK_SECRET
- Supabase: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
- Clerk: NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY, CLERK_SECRET_KEY; later CLERK_WEBHOOK_SECRET
- Upstash Redis: UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN
- Optional media provider: CLOUDINARY_URL or MUX_TOKEN_ID + MUX_TOKEN_SECRET or SHOTSTACK_API_KEY
- FAL: FAL_KEY (or FAL_API_KEY)
- App base: NEXT_PUBLIC_APP_URL

If any platform asks for business verification or KYC, complete it so keys are unrestricted. We’ll confirm once we receive the keys and flip on features accordingly.

