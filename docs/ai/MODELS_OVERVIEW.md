### Models Overview (MVP)

Goal: Document baseline and fallback models for Images and Social Copy to enable fast iteration and safe rollbacks.

#### Images (Thumbnails, Posts)
- Primary: Flux via FAL (realistic / illustration styles)
- Persona: Flux with LoRA adapter (post‑MVP training), MVP uses reference‑image blending
- Fallback: OpenAI Images (gpt‑image‑1)

Key params
- image_size: 1280×720+ for thumbnails, 1080×1350/1080×1080/1200×628 for socials
- num_inference_steps: 35–50 (quality vs speed)
- guidance_scale: ~8.0
- strength: 0.6–0.7 for image‑to‑image

#### Social Copy
- Primary: GPT‑4.1 (required by user preference)
- Response: JSON enforced (per‑platform fields)
- Limits: enforce character caps and hashtag counts per platform pre‑publish

#### Safety & Moderation
- Text: basic moderation + profanity filter
- Images: NSFW classifier; block/flag unsafe outputs

#### Notes
- Store prompts and params with every generation for reproducibility.
- Emit events (generated|failed) with model + params snapshot.

