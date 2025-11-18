# Inflio Services, Environment, and Integration Playbook

> This document is the single source of truth for wiring up external services, environment variables, APIs, and enabling end-to-end workflows in test mode. Keep this updated when adding or changing providers.

---

## 1) High-level Architecture and Services

- Core stack: Next.js App Router, TypeScript, Clerk (auth), Supabase (DB + Storage), Inngest (background events), Sentry (monitoring)
- AI/Media services (optional/toggleable via env):
  - OpenAI: content analysis and generation in project flows
  - AssemblyAI: transcription for videos
  - Klap API: clips generation from long videos
  - FAL (fal.ai): thumbnail/image generation utilities
  - Cloudinary/Mux/Shotstack (detected by env): video post-processing provider selection
- Storage and queues:
  - Supabase Storage buckets: `videos`, `ai-generated-images`
  - Upstash Redis: Klap job queue and background processing helpers

---

## 2) Environment Variables (validated in `src/lib/env-validation.ts` and referenced across services)

Required for baseline (DB + Auth + App):
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`

Recommended app config:
- `NEXT_PUBLIC_APP_URL` (e.g., http://localhost:3000 in dev)
- `NODE_ENV` (development | production)
- `SENTRY_DSN` (optional, for monitoring)

AI/Media (optional, feature-gated):
- OpenAI: `OPENAI_API_KEY`
- AssemblyAI: `ASSEMBLYAI_API_KEY`
- Klap: `KLAP_API_KEY`, optional `KLAP_API_URL` (defaults to https://api.klap.app/v2)
- FAL: `FAL_KEY` (used by API routes), `FAL_API_KEY` (used by service)
- Cloudinary (auto-detected for provider): `CLOUDINARY_URL`
- Mux (auto-detected): `MUX_TOKEN_ID`, `MUX_TOKEN_SECRET`
- Shotstack (auto-detected): `SHOTSTACK_API_KEY`

Queues / Workers / Internal:
- Upstash Redis: `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`
- Worker auth for internal jobs/cron: `WORKER_SECRET`
- Internal service-to-service requests: `INTERNAL_API_KEY`

Social OAuth (present but you asked to skip for now):
- `FACEBOOK_APP_ID`, `FACEBOOK_APP_SECRET`
- `INSTAGRAM_CLIENT_ID`, `INSTAGRAM_CLIENT_SECRET`
- `TWITTER_CLIENT_ID`/`X_API_KEY`, `TWITTER_CLIENT_SECRET`/`X_API_SECRET`
- `LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET`
- `YOUTUBE_CLIENT_ID`/`GOOGLE_CLIENT_ID`, `YOUTUBE_CLIENT_SECRET`/`GOOGLE_CLIENT_SECRET`
- `TIKTOK_CLIENT_KEY`, `TIKTOK_CLIENT_SECRET`
- Threads (Meta): `THREADS_CLIENT_ID`, `THREADS_CLIENT_SECRET`

Video/FFmpeg (optional):
- `VIDEO_TEMP_DIR`, `FFMPEG_PATH`, `FFPROBE_PATH`

Feature flags (optional, defaults exist):
- `SKIP_KLAP_VIDEO_REUPLOAD`, `SKIP_KLAP_PROCESSING`

Notes:
- See `src/lib/env-check.ts` for additional optional keys and feature toggles.
- Do not commit secrets; manage via your environment providers.

---

## 3) Authentication and Users

- Clerk is the source of truth for auth.
- Webhook sync: `POST /api/webhooks/clerk` (validated via `CLERK_WEBHOOK_SECRET`) upserts records into Supabase tables `users` and `user_profiles`.
- Onboarding progress is persisted in `user_profiles.onboarding_progress` via `OnboardingService` and APIs in `src/app/api/onboarding`.

---

## 4) Data and Storage

- Supabase clients:
  - Browser: `src/lib/supabase/client.ts`
  - Admin/server: `src/lib/supabase/admin.ts`
  - Clerk-auth-aware browser client: `src/lib/supabase/client-with-clerk.ts`
- Storage buckets used:
  - `videos`: raw uploads and processed media
  - `ai-generated-images`: managed by `SupabaseImageStorage`
- Large uploads: `supabase-video-storage` supports chunked uploading with `NEXT_PUBLIC_MAX_FILE_SIZE`.

---

## 5) Background Processing and Jobs

- Inngest (`src/inngest/client.ts`, `src/inngest/functions.ts`) triggers and throttles long-running tasks, e.g., Klap processing.
- Internal workers:
  - `POST /api/worker/klap` secured with `Authorization: Bearer ${WORKER_SECRET}`
  - Cron: `POST /api/cron/klap` (same auth header)
- Upstash Redis (`src/lib/redis.ts`) powers a Klap job queue (ids, status, processing lists).

---

## 6) AI and Media Workflows

Transcription (AssemblyAI):
- Service entry: `src/lib/transcription-processor.ts`
- Requires `ASSEMBLYAI_API_KEY`
- Flow: create signed Supabase video URL -> call AssemblyAI -> convert to internal segments -> persist to project -> optionally trigger AI post generation

AI Content Analysis and Generation (OpenAI):
- `src/lib/ai-content-service.ts`, `src/lib/openai.ts`
- Requires `OPENAI_API_KEY`
- Used after successful transcription to extract topics, keywords, summaries, suggestions

Clips Generation (Klap):
- `src/lib/klap-api.ts` with retries and polling
- Requires `KLAP_API_KEY` (and optional `KLAP_API_URL`)
- Orchestrated via Inngest from `src/app/api/projects/[id]/process/route.ts`

Thumbnails/Images (FAL):
- API routes use `FAL_KEY`; service uses `FAL_API_KEY`
- Endpoints: see `src/app/api/thumbnail/*` and `src/lib/services/thumbnail-service.ts`

Video provider detection:
- `CloudVideoService` chooses among Cloudinary/Mux/Shotstack based on env.

---

## 7) API Surface (selected endpoints)

Creation/Processing:
- `POST /api/upload` (signed uploads)
- `POST /api/process` and `POST /api/projects/[id]/process` (kick off transcription + Klap)
- `POST /api/process-klap` (direct Klap trigger)
- `POST /api/process-transcription` (transcription only)

AI Generation:
- `POST /api/generate-chapters`, `/api/generate-blog`, `/api/generate-thread`, `/api/generate-quote-cards`, `/api/generate-social`, `/api/generate-images` etc.
- `POST /api/posts/generate-smart` (auto-post suggestions after transcription)

Thumbnails:
- `POST /api/generate-thumbnail`, `/api/generate-thumbnail/iterate`, `/api/thumbnail/*`

Health/Debug:
- `GET /api/health`, `/api/env-check`, `/api/debug-production`, `/api/debug-storage`, `/api/check-ffmpeg`

Workers/Cron:
- `POST /api/worker/klap`, `POST /api/worker/cleanup`, `POST /api/cron/klap` (require `WORKER_SECRET`)

Note: See `src/app/api/*/route.ts` for the full list.

---

## 8) Stripe (Test Mode Only) – Minimal, Production-Ready Plan

Targets:
- Billing in test mode with Customer Portal and Webhooks wired.
- No live mode keys in this phase.

Stripe resources to create:
- Dashboard setup (test mode):
  - Products/Prices (e.g., Basic, Pro), recurring monthly
  - Webhook endpoint: `https://<your-test-host>/api/webhooks/stripe` (later implemented)
  - Customer Portal configuration enabled
- API keys (test): `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
- Optional: `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (for client-side payment elements if used)

App changes to implement now:
1) Environment
- Add test keys to your environment (you manage secrets; this doc lists names only):
  - `STRIPE_SECRET_KEY`
  - `STRIPE_WEBHOOK_SECRET`
  - `NEXT_PUBLIC_APP_URL` must be set

2) Server-side client
- Create `src/lib/stripe.ts`:
```ts
import Stripe from 'stripe'
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-06-20' })
```

3) Checkout and Portal endpoints
- Add API routes:
  - `POST /api/stripe/create-checkout-session` (accepts priceId, success/cancel URLs, creates session, returns url)
  - `POST /api/stripe/create-portal-session` (creates billing portal for current user)
- Both check Clerk auth and associate `clerk_user_id` with `customer` via `metadata`.

4) Webhooks
- `POST /api/webhooks/stripe` verifies using `STRIPE_WEBHOOK_SECRET`.
- Handle at minimum:
  - `checkout.session.completed`: persist subscription status to `user_usage` and/or a `subscriptions` table
  - `customer.subscription.updated|deleted`: keep plan and limits in sync

5) Usage gates
- Map plan -> limits in server-side `ServerUsageService` (it already has plan limits). On successful subscription, set plan accordingly and reset limits/date.

6) Testing
- Use Stripe test cards (e.g., 4242 4242 4242 4242)
- Verify webhook processing via `stripe cli` tunnel or test host URL

De-scoped (future/live): taxes, invoices customization, SCA edge cases, metered billing

---

## 9) End-to-End Test Run (Dev/Test)

- Pre-check:
  - `NEXT_PUBLIC_APP_URL`, Supabase keys, Clerk keys present
  - Optional keys toggled depending on which features you’re testing (OpenAI, AssemblyAI, Klap, FAL, Redis)

- Flow walkthrough:
  1. Sign in (Clerk). Clerk webhook creates/updates Supabase `users`/`user_profiles`.
  2. Onboarding via UI (`SeamlessOnboarding`), data persisted to `user_profiles.onboarding_progress`.
  3. Upload video -> stored in Supabase Storage `videos` bucket.
  4. Transcription job: `processTranscription` uses AssemblyAI; updates project tasks and saves transcript + content analysis (OpenAI if enabled).
  5. Klap flow (optional): project process endpoint emits Inngest event; Klap task created, polled, clips retrieved.
  6. Thumbnails (optional): FAL endpoints create images; `ai-generated-images` bucket used for outputs where applicable.
  7. Usage tracked via `ServerUsageService` and Supabase tables.
  8. Stripe (test): create checkout session -> subscribe -> webhook updates plan -> verify new limits.

---

## 10) Completion Checklist

- Env baseline:
  - [ ] `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
  - [ ] `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`
  - [ ] `NEXT_PUBLIC_APP_URL`
- Monitoring:
  - [ ] `SENTRY_DSN` (optional)
- AI/Media (toggle as needed):
  - [ ] `OPENAI_API_KEY`
  - [ ] `ASSEMBLYAI_API_KEY`
  - [ ] `KLAP_API_KEY` (and optional `KLAP_API_URL`)
  - [ ] `FAL_KEY` / `FAL_API_KEY`
  - [ ] `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` (if using workers/queues)
  - [ ] Video provider (one of): `CLOUDINARY_URL` or `MUX_TOKEN_ID`+`MUX_TOKEN_SECRET` or `SHOTSTACK_API_KEY`
- Workers/Internal:
  - [ ] `WORKER_SECRET`, `INTERNAL_API_KEY`
- Stripe (test only):
  - [ ] `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
  - [ ] Products/Prices created in test mode
  - [ ] Webhook endpoint configured to test URL

When all boxes are checked and keys configured, the app should run end-to-end in test mode, including onboarding, transcription, AI analysis, optional clips/thumbnails, and subscription management.

