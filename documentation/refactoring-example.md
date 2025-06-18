# Refactoring Example: Cleaning Up API Routes

## Before: Multiple Confusing Routes

Currently, you have these scattered API routes:
- `/api/process`
- `/api/process-klap`
- `/api/process-transcription`
- `/api/process-with-profile`

Each does similar things but with slight variations. This is confusing!

## After: Single Clean Endpoint

Here's how to consolidate them into one clean API route:

### 1. Create a Unified Process Route

```typescript
// src/app/api/v2/process/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { VideoProcessor } from '@/lib/services/video-processor'
import { auth } from '@clerk/nextjs'

export async function POST(req: NextRequest) {
  try {
    // Get user authentication
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse request body
    const body = await req.json()
    const { 
      projectId, 
      workflows = {
        transcription: true,
        clips: true,
        blog: false,
        social: false
      },
      options = {
        useProfile: true,
        clipDuration: 60,
        language: 'en'
      }
    } = body

    // Create processor instance
    const processor = new VideoProcessor({
      projectId,
      userId,
      workflows,
      options
    })

    // Start processing
    const result = await processor.execute()

    return NextResponse.json({
      success: true,
      projectId,
      message: 'Processing started',
      result
    })

  } catch (error) {
    console.error('Processing error:', error)
    return NextResponse.json(
      { error: 'Processing failed', details: error.message },
      { status: 500 }
    )
  }
}
```

### 2. Create the Video Processor Service

```typescript
// src/lib/services/video-processor.ts
import { supabase } from '@/lib/supabase/client'
import { TranscriptionService } from './transcription'
import { ClipGeneratorService } from './clip-generator'
import { ContentCreatorService } from './content-creator'
import { BlogGeneratorService } from './blog-generator'

interface ProcessorConfig {
  projectId: string
  userId: string
  workflows: {
    transcription?: boolean
    clips?: boolean
    blog?: boolean
    social?: boolean
  }
  options: {
    useProfile?: boolean
    clipDuration?: number
    language?: string
  }
}

export class VideoProcessor {
  private config: ProcessorConfig
  private transcriptionService: TranscriptionService
  private clipGenerator: ClipGeneratorService
  private contentCreator: ContentCreatorService
  private blogGenerator: BlogGeneratorService

  constructor(config: ProcessorConfig) {
    this.config = config
    this.transcriptionService = new TranscriptionService()
    this.clipGenerator = new ClipGeneratorService()
    this.contentCreator = new ContentCreatorService()
    this.blogGenerator = new BlogGeneratorService()
  }

  async execute() {
    // Update project status
    await this.updateProjectStatus('processing')

    try {
      // Get project details from Supabase
      const project = await this.getProject()
      if (!project) throw new Error('Project not found')

      // Execute workflows in order
      const results: any = {}

      // 1. Transcription (needed for other workflows)
      if (this.config.workflows.transcription) {
        results.transcription = await this.processTranscription(project)
      }

      // 2. Generate clips (can run in parallel with blog/social)
      const parallelTasks = []
      
      if (this.config.workflows.clips) {
        parallelTasks.push(
          this.processClips(project, results.transcription)
            .then(clips => { results.clips = clips })
        )
      }

      if (this.config.workflows.blog && results.transcription) {
        parallelTasks.push(
          this.processBlog(project, results.transcription)
            .then(blog => { results.blog = blog })
        )
      }

      if (this.config.workflows.social && results.transcription) {
        parallelTasks.push(
          this.processSocial(project, results.transcription)
            .then(social => { results.social = social })
        )
      }

      // Wait for all parallel tasks
      await Promise.all(parallelTasks)

      // Update project with results
      await this.saveResults(results)
      await this.updateProjectStatus('completed')

      return results

    } catch (error) {
      await this.updateProjectStatus('error')
      throw error
    }
  }

  private async getProject() {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', this.config.projectId)
      .single()

    if (error) throw error
    return data
  }

  private async updateProjectStatus(status: string) {
    await supabase
      .from('projects')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', this.config.projectId)
  }

  private async processTranscription(project: any) {
    return await this.transcriptionService.transcribe({
      videoUrl: project.video_url,
      language: this.config.options.language
    })
  }

  private async processClips(project: any, transcription?: any) {
    return await this.clipGenerator.generateClips({
      videoUrl: project.video_url,
      transcription,
      duration: this.config.options.clipDuration
    })
  }

  private async processBlog(project: any, transcription: any) {
    return await this.blogGenerator.generateBlog({
      transcription,
      title: project.title,
      useProfile: this.config.options.useProfile
    })
  }

  private async processSocial(project: any, transcription: any) {
    return await this.contentCreator.generateSocialContent({
      transcription,
      clips: await this.getProjectClips(),
      platforms: ['twitter', 'linkedin', 'instagram']
    })
  }

  private async saveResults(results: any) {
    // Save to Supabase
    await supabase
      .from('project_results')
      .upsert({
        project_id: this.config.projectId,
        results: JSON.stringify(results),
        updated_at: new Date().toISOString()
      })
  }

  private async getProjectClips() {
    const { data } = await supabase
      .from('clips')
      .select('*')
      .eq('project_id', this.config.projectId)
    
    return data || []
  }
}
```

### 3. Update Frontend to Use New API

```typescript
// src/lib/api-client.ts
export class APIClient {
  private baseUrl = '/api/v2'

  async processVideo(projectId: string, options?: ProcessOptions) {
    const response = await fetch(`${this.baseUrl}/process`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectId,
        workflows: options?.workflows || {
          transcription: true,
          clips: true,
          blog: true,
          social: true
        },
        options: options?.settings || {}
      })
    })

    if (!response.ok) {
      throw new Error('Processing failed')
    }

    return response.json()
  }

  async getProject(projectId: string) {
    const response = await fetch(`${this.baseUrl}/projects/${projectId}`)
    if (!response.ok) {
      throw new Error('Failed to fetch project')
    }
    return response.json()
  }

  async getProjectStatus(projectId: string) {
    const response = await fetch(`${this.baseUrl}/projects/${projectId}/status`)
    if (!response.ok) {
      throw new Error('Failed to fetch status')
    }
    return response.json()
  }
}

// Usage in components
const apiClient = new APIClient()

// Start processing
await apiClient.processVideo(projectId, {
  workflows: {
    transcription: true,
    clips: true,
    blog: false,
    social: true
  },
  settings: {
    clipDuration: 30,
    useProfile: true
  }
})
```

### 4. Remove Old Routes

After implementing and testing the new structure, delete these files:
- `src/app/api/process/route.ts`
- `src/app/api/process-klap/route.ts`
- `src/app/api/process-transcription/route.ts`
- `src/app/api/process-with-profile/route.ts`

### 5. Benefits of This Approach

1. **Single Entry Point**: One API route handles all processing
2. **Flexible Workflows**: Easy to enable/disable features
3. **Parallel Processing**: Clips, blog, and social content generate simultaneously
4. **Clear Error Handling**: Centralized error management
5. **Progress Tracking**: Easy to add real-time updates
6. **Testable**: Each service can be tested independently

This refactoring turns "vibe coded" chaos into a clean, maintainable structure! 