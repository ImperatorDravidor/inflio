import { serve } from 'inngest/next'
import { inngest } from '@/inngest/client'
import { processKlapVideo, checkKlapStatus } from '@/inngest/functions'

// Create an API route handler for Inngest
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    processKlapVideo,
    checkKlapStatus,
  ],
}) 