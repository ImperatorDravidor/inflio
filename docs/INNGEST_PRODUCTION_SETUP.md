# Inngest Production Setup (Required for Persona Generation)

Persona portrait generation uses **Inngest** for durable background jobs. Without proper setup, events are sent but never processed — you'll see 0/10 portraits indefinitely.

## Standard Fix: Use the Inngest Vercel Integration

1. **Install the integration**: [Vercel → Inngest Integration](https://app.inngest.com/settings/integrations/vercel/connect)
   - Connects your Vercel project to Inngest
   - Automatically sets `INNGEST_SIGNING_KEY` and `INNGEST_EVENT_KEY` in Vercel
   - Auto-syncs your app to Inngest on every deploy

2. **Deployment Protection** (critical): If you use Vercel Deployment Protection:
   - Either **disable it** for production, or
   - On Pro plan: enable "Protection Bypass for Automation", copy the secret, and add it in [Inngest Vercel integration settings](https://app.inngest.com/settings/integrations/vercel) under "Deployment protection key"

## Manual Setup (if not using the integration)

1. **Create Event Key** in [Inngest Dashboard](https://app.inngest.com) → Settings → Event Keys  
2. **Add to Vercel** env vars:
   - `INNGEST_EVENT_KEY` (enables sending events)
   - `INNGEST_SIGNING_KEY` (enables Inngest to invoke your functions)
3. **Sync your app**: In Inngest Cloud → Apps → "Sync New App" → paste `https://inflio.ai/api/inngest` (or your production URL)

## Verify It Works

1. Deploy to production
2. Create a persona (upload photos) — event is sent
3. Check [Inngest Dashboard](https://app.inngest.com) → Events (should see `persona/generate.portraits`)
4. Check Function Runs — should show `generate-persona-portraits` running

## Resync After Deploy

If you synced manually (no Vercel integration), resync after each deploy:

```bash
curl -X PUT https://inflio.ai/api/inngest --fail-with-body
```

Or use the "Resync" button in Inngest Dashboard → Apps.
