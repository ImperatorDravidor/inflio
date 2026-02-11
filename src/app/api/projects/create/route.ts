import { NextRequest, NextResponse } from 'next/server'
import { ProjectService } from '@/lib/services'
import { ServerUsageService } from '@/lib/server-usage-service'
import { requireAuth } from '@/lib/auth-utils'
import { VideoMetadata } from '@/lib/project-types'
import { supabaseAdmin } from '@/lib/supabase/admin'

// Brand settings type for enhanced content generation
interface BrandSettings {
  name?: string
  voice?: string
  colors?: {
    primary: string
    secondary: string
    accent: string
  }
  targetAudience?: string
}

export async function POST(request: NextRequest) {
  try {
    // Validate authentication
    const { isValid, userId, errorResponse } = await requireAuth()
    if (!isValid || !userId) {
      return errorResponse || NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      title,
      videoUrl,
      thumbnailUrl,
      metadata,
      workflowOptions,
      description,
      // Enhanced content generation settings
      personaId,
      brandSettings
    }: {
      title: string
      videoUrl: string
      thumbnailUrl: string
      metadata: VideoMetadata
      workflowOptions?: any
      description?: string
      personaId?: string | null
      brandSettings?: BrandSettings | null
    } = body

    // Validate required fields
    if (!title || !videoUrl || !metadata) {
      return NextResponse.json(
        { error: 'Missing required fields: title, videoUrl, metadata' },
        { status: 400 }
      )
    }

    // Check server-side usage limits
    const canProcess = await ServerUsageService.canProcessVideo(userId)
    if (!canProcess) {
      const usage = await ServerUsageService.getUsage(userId)
      return NextResponse.json(
        { 
          error: `You've reached your monthly limit of ${usage.usage_limit} videos. Please upgrade your plan to continue.`,
          usage: {
            used: usage.used,
            limit: usage.usage_limit,
            plan: usage.plan
          }
        },
        { status: 403 }
      )
    }

    // Create the project
    const project = await ProjectService.createProject(
      title,
      null as any, // File not needed for server-side creation
      videoUrl,
      thumbnailUrl,
      metadata,
      workflowOptions,
      userId
    )

    // Update with additional fields: description, personaId, brandSettings
    const additionalUpdates: Record<string, any> = {}

    if (description) {
      additionalUpdates.description = description
    }

    // Store persona and brand settings for enhanced content generation
    if (personaId || brandSettings) {
      additionalUpdates.metadata = {
        ...project.metadata,
        enhancedGeneration: {
          personaId: personaId || null,
          brandSettings: brandSettings || null,
          enabledAt: new Date().toISOString()
        }
      }
    }

    if (Object.keys(additionalUpdates).length > 0) {
      // Use admin client for server-side route
      await supabaseAdmin
        .from('projects')
        .update({ ...additionalUpdates, updated_at: new Date().toISOString() })
        .eq('id', project.id)
    }

    // Increment usage after successful project creation
    const incrementSuccess = await ServerUsageService.incrementUsage(userId)
    if (!incrementSuccess) {
      console.warn('Failed to increment usage for user:', userId)
    }

    return NextResponse.json({ 
      project,
      usage: await ServerUsageService.getUsage(userId)
    })

  } catch (error) {
    console.error('Error creating project:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create project' },
      { status: 500 }
    )
  }
}