# Klap Clip Service - Production-Ready Solution

## Executive Summary

The current Klap implementation has fundamental architectural issues that make it unsuitable for production SaaS use. This document provides a complete, production-ready solution.

## Core Problems with Current Implementation

1. **Unreliable Processing**: Depends on cron jobs that may not fire
2. **Complex Setup**: Requires Redis, worker secrets, and multiple services
3. **Poor UX**: Users wait 15-20 minutes with uncertain results
4. **No Recovery**: Failed jobs may be lost forever
5. **Synchronous Polling**: Worker still blocks for entire processing time

## Recommended Solution: QStash + Webhooks

### Why This Approach?

- **Guaranteed Delivery**: QStash ensures jobs are processed
- **True Async**: No blocking or polling required
- **Simple Setup**: Fewer moving parts
- **Better UX**: Users get notified when clips are ready
- **Cost Effective**: Pay only for what you use

## Implementation Guide

### Step 1: Simplify the Architecture

Replace the complex Redis queue system with QStash for reliable async processing.

### Step 2: Update Environment Variables

```env
# Keep existing
KLAP_API_KEY=klap_xxxxx
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=xxxxx

# Add QStash (from Upstash console)
QSTASH_URL=https://qstash.upstash.io/v2/publish/
QSTASH_TOKEN=xxxxx
QSTASH_CURRENT_SIGNING_KEY=xxxxx

# Add for webhooks
NEXT_PUBLIC_APP_URL=https://inflio.ai
```

### Step 3: Implement QStash-Based Processing

```typescript
// src/app/api/process-klap/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { Client } from '@upstash/qstash'
import { auth } from '@clerk/nextjs/server'
import { ProjectService } from '@/lib/services'

const qstash = new Client({
  token: process.env.QSTASH_TOKEN!
})

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { projectId } = await request.json()
    const project = await ProjectService.getProject(projectId)
    
    if (!project?.video_url) {
      return NextResponse.json({ error: 'Invalid project' }, { status: 400 })
    }

    // Create job in database
    await ProjectService.updateProject(projectId, {
      klap_status: 'queued',
      klap_queued_at: new Date().toISOString()
    })

    // Queue with QStash - guaranteed delivery
    const response = await qstash.publishJSON({
      url: `${process.env.NEXT_PUBLIC_APP_URL}/api/worker/process-klap`,
      body: {
        projectId,
        videoUrl: project.video_url,
        userId
      },
      retries: 3,
      delay: '10s', // Start after 10 seconds
      headers: {
        'Content-Type': 'application/json'
      }
    })

    // Update task progress
    await ProjectService.updateTaskProgress(projectId, 'clips', 5, 'processing')

    return NextResponse.json({ 
      success: true,
      message: 'Clip generation queued',
      queueId: response.messageId
    })
  } catch (error) {
    console.error('[Process Klap] Error:', error)
    return NextResponse.json({ error: 'Failed to queue' }, { status: 500 })
  }
}
```

### Step 4: Create Reliable Worker

```typescript
// src/app/api/worker/process-klap/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { verifySignatureEdge } from '@upstash/qstash/nextjs'
import { KlapAPIService } from '@/lib/klap-api'
import { ProjectService } from '@/lib/services'

// This runs on edge - no timeout!
export const runtime = 'edge'

async function handler(request: NextRequest) {
  const body = await request.json()
  const { projectId, videoUrl, userId } = body

  try {
    // Update status
    await ProjectService.updateProject(projectId, {
      klap_status: 'processing',
      klap_started_at: new Date().toISOString()
    })

    // Start Klap processing
    const task = await KlapAPIService.createVideoTask(videoUrl)
    
    // Store task ID
    await ProjectService.updateProject(projectId, {
      klap_task_id: task.id
    })

    // Instead of polling, register a webhook
    await KlapAPIService.registerWebhook(task.id, {
      url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/klap`,
      projectId,
      userId
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    // QStash will retry automatically
    throw error
  }
}

// Verify QStash signature
export const POST = verifySignatureEdge(handler)
```

### Step 5: Handle Klap Webhooks

```typescript
// src/app/api/webhooks/klap/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { KlapAPIService } from '@/lib/klap-api'
import { ProjectService } from '@/lib/services'
import { sendNotification } from '@/lib/notifications'

export async function POST(request: NextRequest) {
  const { taskId, status, projectId, userId, clips } = await request.json()

  if (status === 'completed') {
    // Process and store clips
    const processedClips = await processClips(projectId, clips)
    
    // Update project
    await ProjectService.updateProject(projectId, {
      klap_status: 'completed',
      klap_completed_at: new Date().toISOString(),
      folders: {
        clips: processedClips
      }
    })

    // Update task
    await ProjectService.updateTaskProgress(projectId, 'clips', 100, 'completed')

    // Notify user
    await sendNotification(userId, {
      type: 'clips_ready',
      projectId,
      clipCount: processedClips.length
    })
  } else if (status === 'failed') {
    await ProjectService.updateProject(projectId, {
      klap_status: 'failed',
      klap_error: 'Processing failed'
    })
  }

  return NextResponse.json({ received: true })
}
```

### Step 6: Add Status Checking

```typescript
// src/app/api/process-klap/route.ts (add GET method)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const projectId = searchParams.get('projectId')
  
  if (!projectId) {
    return NextResponse.json({ error: 'Missing projectId' }, { status: 400 })
  }

  const project = await ProjectService.getProject(projectId)
  
  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  }

  // Return current status from database
  return NextResponse.json({
    status: project.klap_status || 'idle',
    queuedAt: project.klap_queued_at,
    startedAt: project.klap_started_at,
    completedAt: project.klap_completed_at,
    error: project.klap_error,
    clips: project.folders?.clips || []
  })
}
```

### Step 7: Update Database Schema

```sql
-- Add Klap tracking columns
ALTER TABLE projects ADD COLUMN klap_status TEXT DEFAULT 'idle';
ALTER TABLE projects ADD COLUMN klap_task_id TEXT;
ALTER TABLE projects ADD COLUMN klap_queued_at TIMESTAMP;
ALTER TABLE projects ADD COLUMN klap_started_at TIMESTAMP;
ALTER TABLE projects ADD COLUMN klap_completed_at TIMESTAMP;
ALTER TABLE projects ADD COLUMN klap_error TEXT;

-- Add index for status queries
CREATE INDEX idx_projects_klap_status ON projects(klap_status);
```

## Alternative: Polling with Better UX

If webhooks aren't available, here's an improved polling approach:

```typescript
// src/lib/klap-polling-service.ts
export class KlapPollingService {
  static async checkAndProcessPendingJobs() {
    // Get all projects with processing status
    const processingProjects = await supabase
      .from('projects')
      .select('*')
      .eq('klap_status', 'processing')
      .not('klap_task_id', 'is', null)

    for (const project of processingProjects.data || []) {
      try {
        const status = await KlapAPIService.getTaskStatus(project.klap_task_id)
        
        if (status.ready) {
          // Process in background using QStash
          await qstash.publishJSON({
            url: `${process.env.NEXT_PUBLIC_APP_URL}/api/worker/process-clips`,
            body: {
              projectId: project.id,
              taskId: project.klap_task_id,
              folderId: status.output_id
            }
          })
        }
      } catch (error) {
        console.error(`Failed to check project ${project.id}:`, error)
      }
    }
  }
}

// Run via cron every 2 minutes
```

## User Experience Improvements

### 1. Progress Indicators

```typescript
// Show estimated time based on video length
const estimatedMinutes = Math.ceil(videoLengthInMinutes * 2.5)
```

### 2. Email Notifications

```typescript
// When clips are ready
await resend.emails.send({
  to: user.email,
  subject: 'Your clips are ready! 🎬',
  html: `Your ${clipCount} clips are ready to view and share.`
})
```

### 3. Dashboard Status

```typescript
// Real-time status component
export function ClipStatus({ projectId }) {
  const { data: status } = useSWR(
    `/api/process-klap?projectId=${projectId}`,
    fetcher,
    { refreshInterval: 10000 } // Check every 10 seconds
  )
  
  return <StatusIndicator status={status} />
}
```

## Migration Path

1. **Phase 1**: Implement QStash alongside existing system
2. **Phase 2**: Migrate new projects to QStash
3. **Phase 3**: Migrate existing queued jobs
4. **Phase 4**: Remove old Redis implementation

## Cost Analysis

### Current System
- Upstash Redis: ~$10-50/month
- Failed jobs: Lost revenue
- Support time: High

### New System
- QStash: ~$5-20/month (pay per message)
- Better reliability: Increased revenue
- Support time: Minimal

## Summary

This solution provides:
- ✅ Reliable clip processing
- ✅ Better user experience
- ✅ Simpler architecture
- ✅ Lower operational costs
- ✅ Production-ready scalability

The key is moving from a complex polling system to a simple, event-driven architecture that leverages managed services for reliability. 