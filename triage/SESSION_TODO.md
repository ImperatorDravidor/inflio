# Inflio Triage – Current Session To‑Do

Goal: Ship a functional, production-ready flow from Upload → Process → Project (analysis + transcript + clips) → Generate AI thumbnails and Posts (images + copy) → Select → Stage → Smart Schedule → Publish → Calendar.

## P0 Now – Must Land This Iteration

- [ ] M0a Onboarding Wizard (MVP – pre-platform gate)
  - [ ] Multi-step wizard at `/onboarding` with autosave, resume, and progress
  - [ ] Copy includes “why we ask” for best AI output (persona photos, brand, pillars, platforms)
  - [ ] Steps
    1) Access & Permissions (MVP = collect handles/links; “Connect later” toggle, no OAuth yet)
       - Platforms: Instagram, Facebook, LinkedIn, TikTok, X, YouTube, Threads, Pinterest, Reddit
       - File sources: Google Drive/Dropbox (collect URLs now; full connect later)
       - Calendar + Email platform: optional placeholders
    2) Creator Profile & Content Identity
       - Fields: name, title, company, bio, industry, audience, mission, content purpose, 3–5 content pillars
    3) Brand Identity & Creative Guidelines
       - Brand colors (HEX), fonts (Google font or upload), logo, brand voice, tagline/mission, inspirations/competitors
    4) Visual Asset Repository
       - Photo album bulk upload (10–20 high-res face photos recommended), optional b‑roll/intros
       - Store privately; quality checks (min resolution, face present) – soft warnings in MVP
    5) Content Intake Preferences
       - Short/Mid/Long-form; auto-distribute vs QA vs approval; upload historical content links
    6) AI Personalization Settings
       - Caption style (Smart/Hype/Edu/Funny), CTAs, newsletter style, language/slang, competitor handles for tone
    7) Legal & Permissions
       - Consent to repurpose; media release for likeness; privacy policy acceptance
  - [ ] Data persistence
    - Extend `user_profiles` to store: profile, preferences, pillars, voice
    - Add `brand_profiles` (colors, fonts, logo, messaging) or serialize under `user_profiles.brand`
    - Reuse `personas` + `persona_images` for photo uploads (private)
  - [ ] Completion sets `user_profiles.onboarding_completed=true` → allows dashboard access
  - [ ] Acceptance: All steps save; summary screen; “Start Inflio” leads to dashboard; redirect enforced by middleware

- [ ] AI Thumbnail Generation (project-level)
  - [ ] Verify API `POST /api/generate-thumbnail` end-to-end with Supabase storage and history
  - [ ] UI: Project view “Generate Thumbnail” section with: prompt, style, quality, persona merge toggle, reference image, recent history
  - [ ] Persona merge: accept persona face (if available) and blend with video context (first frame) for realism
  - [ ] Store artifacts to `images` bucket; persist generation metadata on `projects.thumbnail_history` (or dedicated table)
  - [ ] Acceptance: Image visibly updates project thumbnail; retry + error messaging; analytics event recorded

- [ ] M0b Model Strategy & Persona Training (prep)
  - [ ] Create docs under `docs/ai/` capturing MVP model choices and prompts
    - [ ] `MODELS_OVERVIEW.md`: multi-model approach (images vs social copy), fallbacks, safety
    - [ ] `IMAGE_GENERATION.md`: Flux variants, parameters, persona blending toggle, iteration strategy
    - [ ] `SOCIAL_COPY_GENERATION.md`: GPT-4.1 prompt schemas, platform limits, JSON outputs
    - [ ] `PERSONA_TRAINING.md`: intake (min 5 images, 10+ recommended), training, storage, trigger word = persona name
  - [ ] Plan data model deltas (no migration yet): `personas` (model_ref, status, version), `persona_images`, `persona_training_jobs`
  - [ ] Define “trigger usage”: after initial training, internal workflows reference `model_ref` and do not require typing the trigger again (unless regenerating)
  - [ ] Acceptance: docs present with sample prompts and parameters; clear integration points in MVP scope

- [x] Posts Feature (MVP) – image + copy suggestions from project data
  - [x] New Project tab: "Posts" with suggestions grid (carousel, quote, single-image, thread)
  - [x] Enhanced UI with smooth animations, grid/list view, filtering, and sorting
  - [x] Platform eligibility badges with visual indicators for all 6+ platforms
  - [x] Engagement prediction metrics and quality scoring
  - [x] Advanced generation settings: creativity slider, persona toggle, auto-hashtags, CTA
  - [x] Batch operations: select multiple, bulk approve, export
  - [x] Beautiful detail view with platform previews, copy editing, image management
  - [x] Real-time progress tracking with celebration effects
  - [x] Background generation jobs: parallel image + copy generation with progress indicators
  - [ ] Acceptance: At least 6 suggestions generated per project with persona variant if available; per-platform copy generated and within limits

- [ ] Long‑form Workflow (viewer/editor)
  - [ ] Project video player with transcript timeline (“video line”)
  - [ ] Chapters editor (YouTube chapters export); persists to project metadata
  - [ ] Apply subtitles (VTT) preview toggle; export VTT
  - [ ] Acceptance: Chapters saved; transcript synced; usable export for YT

- [ ] Stage → Smart Schedule → Publish
  - [ ] “Publish Content” selection modal in Project view (select/deselect assets: clips, images, posts)
  - [ ] Staging screen: validate per-platform fields; warn on missing media/caption limits; bulk edits
  - [ ] Smart Schedule: propose optimal times; allow manual tweak; show conflicts
  - [ ] Publish: enqueue per-platform jobs; calendar populated; status badges (scheduled, published, failed)
  - [ ] Acceptance: Items appear on calendar and transition to published via OAuth for configured platforms

## Posts Feature – Detailed Brainstorm (Spec v0)

### Content types
- Carousel (3–8 slides)
- Quote card (speaker quote + branding)
- Single “cover” image (hook visual)
- Thread-ready set (X/Threads text sequence paired with 1–3 assets)

### Inputs
- Project: title, description, transcript, content_analysis (topics, keywords, mood)
- Clips: thumbnails, virality score, transcript segments
- Persona (optional): trained face model for the main speaker

### Image generation
- Models: Flux (via FAL) + optional LoRA persona adapter
- Prompt framework (condensed example):
  - Base: “Create a platform-ready [type] visual for video ‘{title}’. Topics: {topics}. Mood: {mood}. Key elements: {keywords}.”
  - Persona: “Feature {personaName} photorealistically; studio-quality lighting; coherent brand color; high contrast; text-safe composition.”
  - Output: 1080×1350 (IG), 1080×1080, 1920×1080 (YT/Twitter), 1200×628 (LinkedIn) – generate per-target
- Storage: `images` bucket; persist metadata (model, prompts, size, persona used)

### Copy generation (per-platform)
- Model: gpt-4.1 with platform constraints (character limits, tone)
- Fields: caption, hashtags (count per platform), CTA, optional title/description for YouTube/LinkedIn
- Validation: trim to limits; auto-hashtag extraction; unsafe text filtering

### Eligibility logic (icons on cards)
- IG: square/portrait ≤10 images (carousels), caption ≤2200
- X: 1–4 images, 280 chars
- LinkedIn: 1–9 images, 3000 chars
- YouTube Short: portrait video ≤60s; for image-only, mark “not eligible”
- TikTok: video only → image posts suggest “convert to video” CTA

### APIs (MVP)
- POST `/api/personas/train` → enqueue training with user photos; returns `persona_id`
- GET `/api/personas` → list user personas and status
- POST `/api/projects/[id]/posts/suggest` → create batch suggestions (images + copy)
- POST `/api/posts/generate-images` → image batch (with persona flags)
- POST `/api/posts/generate-copy` → per-platform copy
- GET `/api/posts/preview` → hydrate cards with eligibility + thumbnails

### Data model (proposed)
- `personas` (exists): id, user_id, name, status, model_ref, created_at
- `social_graphics` (exists): link images to project and suggestion set
- `social_posts`: add `state: draft|staged|scheduled|published|failed`, `settings` for metadata
- Optional: `thumbnail_history`

### Background jobs (Inngest)
- `persona.train` queue (LoRA fine-tune, status polling)
- `posts.generate` (fan out: images, then copy; consolidate suggestions)
- `posts.publish` (per-platform workers, retries, status updates)

### UI
- Project → Posts tab: grid of suggestions with social badges, persona badge, regenerate, edit, approve
- Quick editor drawer: per-platform copy with live character count and warnings
- Batch select → Stage

### Acceptance criteria (MVP)
- Generate ≥6 suggestions within 90s (with progress feedback)
- Each suggestion: at least IG+LinkedIn-eligible; copy within limits
- Persona applied when available; graceful fallback when not
- Approving suggestions moves them to Staging with all metadata

## Long‑form Workflow – Details
- Player with transcript timeline; click-to-seek per segment
- Chapters editor with YouTube export format; saved to `projects.content_analysis.chapters`
- Apply subtitles (VTT) overlay; export SRT/VTT

## P1 Polish (Post-MVP)
- Moderation of generated copy/images (basic unsafe content filter)
- Rate limiting + backoff (Upstash Redis)
- Sentry spans for generation steps; user-facing error toasts with retry

## Instrumentation & QA
- Events: `thumbnail.generated`, `posts.suggested`, `post.staged`, `post.scheduled`, `post.published|failed`
- Dashboard counters: staged, scheduled, published per platform; avg generation time

## Dependencies (you manage env keys)
- FAL AI / Flux API key, OpenAI API key, Supabase keys, Clerk, Social OAuth creds

## Milestones
- [ ] M1: Thumbnails (UI + storage + history)
- [ ] M2: Posts MVP (generation + UI + staging integration)
- [ ] M3: Long‑form viewer (transcript + chapters)
- [ ] M4: Smart scheduling + calendar + publish via OAuth

---

## Expanded P0 Breakdown

### P0.1 AI Thumbnail Generation – Expanded

- UI/UX
  - [ ] Inputs: prompt, persona toggle, style presets (modern, vibrant, professional, dramatic), quality (fast/balanced/high), reference image
  - [ ] History panel: show latest 10 with params; “Set as Project Thumbnail”, “Open in Posts”, “Download”, “Copy Prompt”
  - [ ] Feedback & Iteration: star rating (1–5), free-text feedback, “Iterate” button creates a new version using an iteration prompt
  - [ ] Variations: “Generate 4 variations” with seed linking to parent
  - [ ] A/B mark: tag two items as Variant A/B, pipe into future post A/B (P1)

- API & Jobs
  - [ ] POST `/api/generate-thumbnail` (exists): ensure returns generation id, streams progress
  - [ ] POST `/api/thumbnail/iterate` with `{projectId, parentGenerationId, feedback, deltaPrompt, params}`
  - [ ] GET `/api/thumbnail/history?projectId=...` returns rich history (with feedback stats)
  - [ ] Inngest `thumbnail.generate` and `thumbnail.iterate` for long jobs + retries
  - [ ] Fallback path to OpenAI Images if Flux fails; capture reason

- Data Model (migrations)
  - [ ] `thumbnail_history`
    - id, project_id, type: generate|iterate|variation, prompt, base_prompt, edit_prompt, params (JSON), model, lora_ref, seed,
      input_image_url, output_url, file_size, width, height, job_id, status, error, parent_id, chosen (bool), used_in_posts (bool), created_at, created_by
  - [ ] `thumbnail_feedback`
    - id, generation_id, project_id, rating (1–5), feedback_text, created_by, created_at
  - [ ] Indexes on project_id, parent_id, created_at

- Feedback-driven iteration
  - [ ] LLM prompt refiner: converts feedback into delta prompt (style, focal point, palette, composition)
  - [ ] Parameter tuning: adjust guidance, steps, strength based on feedback tags (too dark → increase exposure compensation, etc.)
  - [ ] Persona blending strength heuristic (faces cropped/blurred → increase weight, adjust ref image placing)

- Quality gates & evaluation
  - [ ] Basic aesthetic score via model API or simple heuristics (contrast, text-safe area)
  - [ ] Dimension & format validators (1280×720 minimum, safe margins for text)
  - [ ] NSFW check (moderation) before surfacing

- Observability
  - [ ] Sentry spans: request → generation → upload → DB write
  - [ ] Audit log event `thumbnail.generated|iterated` with params snapshot

- Acceptance
  - [ ] Can iterate with feedback and see a linked version chain
  - [ ] History shows lineage; revert/pin works; invalid generations hidden by default

### P0.2 Posts Feature – Expanded

- Suggestion pipeline
  - [ ] Planner: build “suggestion plan” from content_analysis (types, count, persona usage)
  - [ ] Generate images (Flux + persona LoRA) per type/size; store artifacts + params
  - [ ] Generate per-platform copy with constraints and tone; validate/trim
  - [ ] Compute eligibility and annotate suggestion with icons
  - [ ] Assemble cards (cover image, type badge, social icons, persona badge)

- UI/UX
  - [ ] Grid with filters (type, social eligibility, persona-only), search by topic
  - [ ] Card actions: Regenerate, Improve (free text), Edit (copy + hashtags + CTA + alt text), Approve → Stage
  - [ ] Bulk actions: Approve, Delete, Re-run with Persona, Re-run without Persona
  - [ ] Per-platform live counters (remaining chars), warnings (links, mentions), preview on background mock frames

- APIs & Jobs
  - [ ] POST `/api/projects/[id]/posts/suggest` (planner + enqueue) → returns suggestion_batch_id
  - [ ] POST `/api/posts/generate-images` (batch)
  - [ ] POST `/api/posts/generate-copy` (batch)
  - [ ] POST `/api/posts/improve` with `suggestion_id` and `feedback`
  - [ ] GET `/api/posts/batch/:id` streams progress; GET `/api/posts/:id` fetch detail
  - [ ] Inngest `posts.generate` → fan-out/fan-in; `posts.improve`

- Data Model (migrations)
  - [ ] `post_suggestions`
    - id, project_id, type (carousel|quote|single|thread), images JSON[], platform_copy JSON,
      eligibility JSON, persona_id, status (suggested|edited|approved|staged|discarded), version, parent_id,
      metadata JSON (scores, prompts, seeds), created_at, created_by
  - [ ] `image_generations`
    - id, suggestion_id (nullable), project_id, model, params JSON, prompt, output_urls JSON,
      job_id, status, error, created_at

- Moderation & compliance
  - [ ] Run text moderation on copy; hide/sanitize as needed
  - [ ] Image safety check; redact/flag if unsafe

- Acceptance
  - [ ] ≥6 suggestions in <90s with progress; editing and improve loops persist new versions
  - [ ] Approvals move items to Staging with full metadata

### P0.3 Long‑form Workflow – Expanded

- Player + timeline
  - [ ] Waveform or keyframe strip; click-to-seek; segment hover
  - [ ] Transcript segment list; edit text; sync back to `transcription`
  - [ ] Auto-save with debounce; optimistic UI with rollback

- Chapters
  - [ ] AI chapter suggestions (title + timestamp); accept/merge; manual add/remove
  - [ ] Export YouTube chapter format; persist to `content_analysis.chapters`

- Subtitles
  - [ ] Apply VTT overlay; style controls (size, background)
  - [ ] Export VTT/SRT; ensure Supabase storage + signed URLs

- Acceptance
  - [ ] Edits survive refresh; exports valid and downloadable

### P0.4 Stage → Smart Schedule → Publish – Expanded

- Selection modal
  - [ ] Multi-type picker (clips, images, post suggestions); show warnings for ineligible combos

- Staging screen
  - [ ] Per-platform validation: character limits, media dimensions, ratio, image count
  - [ ] Bulk operations: prepend/append hashtags; add mentions; UTM builder; alt-text helper
  - [ ] Brand guidelines: color palette reference, tone reminders

- Smart Schedule
  - [ ] Suggest slots (timezone-aware); avoid conflicts; frequency capping
  - [ ] Manual drag/drop reordering; conflict resolution prompts

- Publish pipeline
  - [ ] Enqueue per platform; token refresh; exponential backoff; idempotency keys
  - [ ] Status updates (scheduled→publishing→published|failed); error surfaces
  - [ ] Calendar write + notifications on success/failure

- Acceptance
  - [ ] Items appear on calendar; publishing works for configured OAuth accounts; errors actionable

### P0.5 Calendar – Expanded

- Views: Month, Week, Agenda; platform filters; status filters
- Drag to reschedule (updates schedule + job); conflict badges; hover preview
- Performance: virtualized lists; server pagination

### P0.6 Personas – Training & Usage – Expanded

- Intake
  - [ ] Upload flow requesting 10–20 images; guidance (angles, lighting); quality checks (resolution, blur)
  - [ ] Consent acknowledgment; deletion policy; privacy notice

- Training
  - [ ] Inngest `persona.train` job: package dataset; call Flux LoRA training; poll status
  - [ ] Evaluation set: auto-generate test renders (portrait, mid-shot, varied lighting) for QA
  - [ ] Store `personas` (id, name, status, model_ref, version, created_at)

- Usage
  - [ ] Persona toggle in thumbnails and posts; parameterize blend strength; guardrails on mismatch
  - [ ] Versioning: allow switching between persona model versions

### P0.7 Moderation & Compliance – Expanded

- Text moderation pre-publish; image safety checks; profanity filters
- Audit log for generated content; traceability from post to underlying generations
- RLS on all tables; per-user scoping; admin override via env list

### P0.8 Telemetry, Rate Limits, Quotas – Expanded

- Telemetry
  - [ ] Sentry spans for long jobs; correlation id from UI → API → job
  - [ ] App events: `posts.suggested`, `post.approved`, `publish.failed` with metadata

- Limits
  - [ ] Upstash Redis for per-user generation rate limit and burst caps
  - [ ] Quotas integrated with `user_usage`; soft-block with upsell message

## Database – Migration Plan (draft)

- [ ] `thumbnail_history`, `thumbnail_feedback`
- [ ] `post_suggestions`, `image_generations`
- [ ] `personas` (if not persisted), `persona_training_jobs`, `persona_images`
- [ ] `publishing_jobs` (optional) or extend `social_posts` with job metadata
- [ ] Add missing indices and FKs; RLS policies for all new tables

