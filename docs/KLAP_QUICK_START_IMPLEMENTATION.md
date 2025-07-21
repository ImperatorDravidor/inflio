# Klap Service Quick Start Implementation Guide

## Immediate Actions Required

### 1. First, let's verify your current setup

Run this diagnostic script to check your environment:

```bash
node scripts/diagnose-klap-processing.js <your-project-id>
```

### 2. Set Up Missing Environment Variables

Based on the diagnostic results, add any missing variables to `.env.local`:

```env
# Required for current implementation
KLAP_API_KEY=klap_xxxxx
UPSTASH_REDIS_REST_URL=https://your-redis-url.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-redis-token
WORKER_SECRET=generate-with-openssl-rand-base64-32
```

### 3. Quick Fix: Make Current System Work

If you need the current system working immediately:

1. **Ensure Redis is connected:**
   ```bash
   node scripts/test-redis-connection.js
   ```

2. **Manually trigger the worker:**
   ```bash
   curl -X POST http://localhost:3000/api/worker/klap \
     -H "Authorization: Bearer YOUR_WORKER_SECRET"
   ```

3. **Check cron job in Vercel Dashboard:**
   - Go to Functions → Cron Jobs
   - Verify `/api/cron/klap` is running every 5 minutes

### 4. Better Solution: Implement Simplified Processing

Here's a minimal implementation that's more reliable:

#### Option A: Direct Processing (For Testing)

```typescript
// src/app/api/process-klap/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { KlapAPIService } from '@/lib/klap-api'
import { ProjectService } from '@/lib/services'
import { auth } from '@clerk/nextjs/server'

export const maxDuration = 60 // 1 minute for creating task

export async function POST(request: NextRequest) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { projectId } = await request.json()
  const project = await ProjectService.getProject(projectId)
  
  if (!project?.video_url) {
    return NextResponse.json({ error: 'Invalid project' }, { status: 400 })
  }

  try {
    // Create Klap task
    const task = await KlapAPIService.createVideoTask(project.video_url)
    
    // Store task ID in database
    await ProjectService.updateProject(projectId, {
      klap_project_id: task.id
    })
    
    // Update task progress
    await ProjectService.updateTaskProgress(projectId, 'clips', 10, 'processing')
    
    return NextResponse.json({ 
      success: true,
      taskId: task.id,
      message: 'Processing started. Check back in 10-15 minutes.'
    })
  } catch (error) {
    console.error('[Process Klap] Error:', error)
    return NextResponse.json({ error: 'Failed to start processing' }, { status: 500 })
  }
}

// Add status checking
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const projectId = searchParams.get('projectId')
  
  const project = await ProjectService.getProject(projectId)
  if (!project?.klap_project_id) {
    return NextResponse.json({ status: 'not_started' })
  }

  try {
    // Check Klap status
    const status = await KlapAPIService.getTaskStatus(project.klap_project_id)
    
    if (status.ready && status.output_id) {
      // Get clips
      const clips = await KlapAPIService.getClipsFromFolder(status.output_id)
      
      // Update project
      await ProjectService.updateProject(projectId, {
        folders: { clips }
      })
      
      await ProjectService.updateTaskProgress(projectId, 'clips', 100, 'completed')
      
      return NextResponse.json({ 
        status: 'completed',
        clips 
      })
    }
    
    return NextResponse.json({ 
      status: 'processing',
      progress: 50 
    })
  } catch (error) {
    return NextResponse.json({ 
      status: 'error',
      error: error.message 
    })
  }
}
```

#### Option B: Use Vercel Background Functions (Beta)

```typescript
// src/app/api/process-klap/route.ts
import { waitUntil } from '@vercel/functions'

export async function POST(request: NextRequest) {
  // ... authentication and validation ...

  // Start task immediately
  const task = await KlapAPIService.createVideoTask(project.video_url)
  
  // Process in background
  waitUntil(
    processClipsInBackground(projectId, task.id)
  )
  
  return NextResponse.json({ 
    success: true,
    message: 'Processing started'
  })
}

async function processClipsInBackground(projectId: string, taskId: string) {
  // This runs after the response is sent
  try {
    // Wait for completion
    const result = await KlapAPIService.pollTaskUntilReady(taskId)
    
    // Process clips
    const clips = await KlapAPIService.getClipsFromFolder(result.output_id)
    
    // Update project
    await ProjectService.updateProject(projectId, {
      folders: { clips }
    })
  } catch (error) {
    console.error('Background processing failed:', error)
  }
}
```

### 5. Production-Ready Solution (Recommended)

For a truly robust solution, implement one of these:

#### Option 1: Use Inngest (Recommended for Vercel)

```bash
npm install inngest
```

```typescript
// src/inngest/functions.ts
import { inngest } from './client'

export const processKlapVideo = inngest.createFunction(
  { id: 'process-klap-video' },
  { event: 'klap/video.process' },
  async ({ event, step }) => {
    // Step 1: Create Klap task
    const task = await step.run('create-task', async () => {
      return await KlapAPIService.createVideoTask(event.data.videoUrl)
    })

    // Step 2: Wait for completion (Inngest handles the waiting)
    const result = await step.waitForEvent('klap.task.complete', {
      match: 'data.taskId',
      timeout: '30m'
    })

    // Step 3: Process clips
    await step.run('process-clips', async () => {
      const clips = await KlapAPIService.getClipsFromFolder(result.data.outputId)
      await ProjectService.updateProject(event.data.projectId, {
        folders: { clips }
      })
    })
  }
)
```

#### Option 2: Use Trigger.dev

```bash
npm install @trigger.dev/sdk @trigger.dev/nextjs
```

```typescript
// src/jobs/klap.ts
import { Job } from '@trigger.dev/sdk'

export const processKlapJob = new Job({
  id: 'process-klap-video',
  name: 'Process Klap Video',
  version: '1.0.0',
  trigger: eventTrigger({
    name: 'klap.process',
  }),
  run: async (payload, io, ctx) => {
    // Create task
    const task = await io.runTask('create-klap-task', async () => {
      return await KlapAPIService.createVideoTask(payload.videoUrl)
    })

    // Wait and poll
    const result = await io.waitUntil('wait-for-klap', async () => {
      const status = await KlapAPIService.getTaskStatus(task.id)
      return status.ready ? status : undefined
    }, {
      pollingInterval: 30, // 30 seconds
      timeout: 1800, // 30 minutes
    })

    // Process clips
    await io.runTask('process-clips', async () => {
      const clips = await KlapAPIService.getClipsFromFolder(result.output_id)
      await ProjectService.updateProject(payload.projectId, {
        folders: { clips }
      })
    })
  }
})
```

### 6. Database Migration (Required for any solution)

Run this migration to add proper tracking:

```sql
-- Add Klap status tracking
ALTER TABLE projects 
ADD COLUMN klap_status TEXT DEFAULT 'idle',
ADD COLUMN klap_task_id TEXT,
ADD COLUMN klap_started_at TIMESTAMP,
ADD COLUMN klap_completed_at TIMESTAMP;
```

### 7. Frontend Updates

Update your project page to show proper status:

```typescript
// src/app/(dashboard)/projects/[id]/page.tsx
export function ProjectPage() {
  const { data: status } = useSWR(
    `/api/process-klap?projectId=${projectId}`,
    fetcher,
    { 
      refreshInterval: status?.status === 'processing' ? 10000 : null 
    }
  )

  return (
    <div>
      {status?.status === 'processing' && (
        <div>Processing clips... This may take 10-15 minutes.</div>
      )}
      {status?.status === 'completed' && (
        <div>{status.clips.length} clips ready!</div>
      )}
    </div>
  )
}
```

## Summary

1. **Quick Fix**: Ensure Redis and cron are working
2. **Better**: Use simplified polling approach
3. **Best**: Implement proper async processing with Inngest or Trigger.dev

The key is to move away from trying to make serverless functions act like persistent workers. Instead, embrace the serverless model with proper async job processing tools. 