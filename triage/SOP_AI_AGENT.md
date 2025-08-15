### SOP: Inflio AI Agent Development Runbook

This SOP defines how an AI coding agent executes features for Inflio end-to-end with fast feedback, high quality, and production readiness. It avoids repeated re-explanations and encodes preferences: implement one feature at a time [[memory:4558372]], the agent defines and executes the next step [[memory:3054147]], env files are user-managed [[memory:3054140]], and GPT‑4.1 is used for AI generation [[memory:5154269]].

### Guiding principles
- **Production quality**: Ship vertical slices that build, run, and satisfy acceptance criteria.
- **One feature at a time**: Complete and stabilize before starting the next [[memory:4558372]].
- **Self-directed execution**: Propose next step and do it; ask only when blocked [[memory:3054147]].
- **Environment safety**: Never edit `.env*`; assume keys are provided by the user [[memory:3054140]].
- **Model selection**: Use GPT‑4.1 for text; Flux/FAL for images [[memory:5154269]].
- **Security**: Auth checks in routes, RLS in DB, redact secrets, protect dev endpoints.
- **Observability**: Sentry spans + app events for all long-running or generation flows.

### Standard feature cycle (repeat per feature)
1) Scope and acceptance (5–10 min)
   - Restate goal and constraints. Draft crisp acceptance criteria and a test plan.
   - Identify vertical slices (API, job, UI) that deliver value incrementally.
2) Design note (10–20 min)
   - Outline: data model deltas (tables, columns, RLS), endpoints, services, jobs, UI, analytics, moderation, error handling.
   - Call out risks, fallbacks, performance budgets.
3) Implement slice 1 → test → demo
   - Add migrations, endpoints, services, job skeletons, minimal UI.
   - Run build/lint; manual route check; log key outputs.
   - Share short demo note; collect feedback; iterate.
4) Implement slice 2+ (iterate) until acceptance met
   - Add iterations, validation, editing UX, and instrumentation.
5) Stabilize and document
   - Update docs in `triage/` and `docs/`; summarize DB/API, toggles, and runbook.

### Global guardrails
- Do not modify `.env` or secrets; user configures them [[memory:3054140]].
- Add auth checks (`requireAuth`, ownership) in all API routes.
- Ensure RLS policies exist for new tables; add indices for query paths.
- Long jobs via Inngest; include idempotency, backoff, and status fields.
- Respect platform limits for content; preflight validate before publish.

### Module SOPs

#### A. AI Thumbnails (with feedback/iteration)
- Scope
  - Project view UI for prompt/style/quality/persona/reference image; show history.
  - Generate via Flux (FAL); fallback to OpenAI Images on failure.
  - Feedback loop: star rating + free-text → iteration (delta prompt + tuned params).
- Data
  - `thumbnail_history`: id, project_id, type(generate|iterate|variation), prompt/base_prompt/edit_prompt, params, model, lora_ref, seed, input_image_url, output_url, file_size, width, height, job_id, status, error, parent_id, chosen, used_in_posts, created_at, created_by.
  - `thumbnail_feedback`: id, generation_id, project_id, rating, feedback_text, created_by, created_at.
- APIs & Jobs
  - POST `/api/generate-thumbnail` → returns `generation_id` + progress; writes history.
  - POST `/api/thumbnail/iterate` → parent + feedback → new history node.
  - GET `/api/thumbnail/history` → recent history with lineage.
  - Inngest: `thumbnail.generate`, `thumbnail.iterate` with retries.
- Quality gates
  - Min 1280×720; text-safe area; NSFW check; dimension/format validator.
- Acceptance
  - Can rate/iterate; lineage visible; set-as-project-thumbnail; errors are actionable.

#### B. Posts (images + per-platform copy + eligibility)
- Scope
  - Suggestion planner builds a batch (carousel/quote/single/thread) using project analysis.
  - Generate images (Flux + persona LoRA) per size; generate copy (GPT‑4.1) per platform.
  - Compute eligibility (dimensions/limits); UI grid with icons, edit/regenerate/approve.
- Data
  - `post_suggestions`: id, project_id, type, images JSON[], platform_copy JSON, eligibility JSON, persona_id, status(suggested|edited|approved|staged|discarded), version, parent_id, metadata(prompts,seeds,scores), created_at, created_by.
  - `image_generations`: id, suggestion_id, project_id, model, params JSON, prompt, output_urls JSON, job_id, status, error, created_at.
- APIs & Jobs
  - POST `/api/projects/:id/posts/suggest` → planner + enqueue; returns `suggestion_batch_id`.
  - POST `/api/posts/generate-images`, `/api/posts/generate-copy`, `/api/posts/improve`.
  - GET `/api/posts/batch/:id` for streaming progress; GET `/api/posts/:id` for detail.
  - Inngest: `posts.generate` (fan-out/fan-in), `posts.improve`.
- Moderation
  - Text moderation for copy; image safety; warn + block publish when unsafe.
- Acceptance
  - ≥6 suggestions < 90s with progress; edits/improve create new versions; approval moves to Staging.

#### C. Long‑form workflow (viewer/editor)
- Player with transcript timeline; segment editing; auto-save with debounce.
- Chapters: AI suggestions, manual edit, store `content_analysis.chapters`, export YouTube format.
- Subtitles: VTT overlay and export SRT/VTT; store in Supabase storage.
- Acceptance: Edits persist; exports valid and downloadable.

#### D. Stage → Smart Schedule → Publish
- Selection modal: choose assets (clips, images, posts) with warnings for invalid combos.
- Staging validation: per-platform limits, dimensions, ratio, min/max images.
- Smart schedule: timezone-aware slots, conflict avoidance, drag/drop reordering.
- Publish: enqueue per platform; refresh tokens; backoff; idempotency; statuses → calendar.
- Acceptance: Calendar reflects scheduled and published states; errors actionable.

#### E. Personas (training + usage)
- Intake: 10–20 images; guidance; quality checks; consent/privacy note.
- Training: Inngest `persona.train` → Flux LoRA; poll; store `personas` (model_ref, version, status).
- Usage: persona toggle; blend strength; version selection.
- Acceptance: Persona renders stable, photorealistic variants; fallback when missing.

#### F. Calendar
- Views (Month/Week/Agenda), filters (platform/status), drag to reschedule (updates jobs).
- Performance: virtualized list, server pagination.

### Checklists (apply per change)
- Data migrations
  - [ ] Create tables/columns with indices; RLS; ownership constraints.
  - [ ] Backfill scripts (if needed) and rollbacks.
- API & services
  - [ ] Auth + ownership checks; input validation; typed responses.
  - [ ] Idempotency keys on mutation; rate limits; clear error messages.
- Jobs (Inngest)
  - [ ] Retries with backoff; status updates; correlation IDs; logs.
- UI
  - [ ] Loading/empty/error states; optimistic updates; accessibility basics.
- Moderation & safety
  - [ ] Text/image checks; block dangerous outputs; user-facing guidance.
- Observability
  - [ ] Sentry spans; app events (`*.generated`, `*.staged`, `*.published|failed`).
- Build & QA
  - [ ] `npm run build` clean; lint clean; manual happy-path demo.

### Feedback cadence
- Gate 1 (Scope): Confirm acceptance criteria and slices.
- Gate 2 (First slice demo): Review API response/UI mock; adjust.
- Gate 3 (Pre-merge): Walkthrough + metrics; sign-off or changes.
Proceed automatically between gates unless user feedback requests changes [[memory:3054147]].

### Reusable prompt patterns (concise)
- Copy generation (JSON output enforced):
```
System: You are a senior social strategist. Return JSON only.
User: Using this context {title, topics, mood, key_points}, generate per-platform copy obeying limits.
Schema: { instagram:{caption,hashtags,cta}, linkedin:{...}, x:{...}, youtube:{title,description,tags} }
```
- Image iteration (thumbnail):
```
System: You refine an image prompt based on feedback. Return delta changes only.
User: Base prompt: "{base}". Feedback: "{feedback}". Constraints: preserve subject, improve {issues}.
Output: { delta_prompt, params_patch }
```

### Handoff template
- Summary: scope, acceptance, status.
- Links: routes touched, migrations, Inngest functions.
- Ops: feature flags, envs required (user-provided), rollbacks.
- Metrics: events emitted, dashboards to check.

### Appendix – Acceptance by milestone
- M1 Thumbnails: generation + iteration + history + set-as-thumbnail passes.
- M2 Posts: suggestions + edits + approvals + staging ready.
- M3 Long‑form: transcript/chapters/subtitles edit + export.
- M4 Schedule/Publish: validation + calendar population + publish statuses.

