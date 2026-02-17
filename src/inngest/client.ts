import { Inngest } from 'inngest'

// Check if Inngest is configured
// In development, inngest dev CLI doesn't need keys
// In production, we need INNGEST_EVENT_KEY or INNGEST_SIGNING_KEY
const isInngestConfigured = () => {
  const isDev = process.env.NODE_ENV === 'development'
  const hasKeys = !!(process.env.INNGEST_EVENT_KEY || process.env.INNGEST_SIGNING_KEY)
  
  // In dev mode, Inngest is always enabled (auto-discovery via inngest dev CLI)
  // In production, we need keys
  return isDev || hasKeys
}

export const inngest = new Inngest({
  id: 'inflio',
  eventKey: process.env.INNGEST_EVENT_KEY,
  // Inngest will automatically detect your environment
  // and use the appropriate API key
})

export const INNGEST_ENABLED = isInngestConfigured() 