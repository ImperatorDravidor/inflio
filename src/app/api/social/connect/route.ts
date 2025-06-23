import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { generateOAuthUrl, validatePlatformConfig } from '@/lib/social/oauth-config'
import { handleError, AppError } from '@/lib/error-handler'
import { z } from 'zod'

const connectSchema = z.object({
  platform: z.enum(['instagram', 'facebook', 'x', 'linkedin', 'youtube', 'tiktok', 'threads'])
})

export async function POST(request: NextRequest) {
  try {
    // Auth check
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Validate request
    const body = await request.json()
    const validation = connectSchema.safeParse(body)
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid platform', details: validation.error.errors },
        { status: 400 }
      )
    }

    const { platform } = validation.data

    // Check if platform is configured
    if (!validatePlatformConfig(platform)) {
      return NextResponse.json(
        { 
          error: 'Platform not configured',
          message: `Missing OAuth credentials for ${platform}. Please add them to your environment variables.`
        },
        { status: 503 }
      )
    }

    // Generate state parameter for CSRF protection
    const state = generateStateParam(userId, platform)
    
    // Store state in session/cache for validation
    // In production, use Redis or similar
    // await storeState(state, userId, platform)

    // Generate OAuth URL
    const authUrl = generateOAuthUrl(platform, state)

    return NextResponse.json({
      authUrl,
      platform
    })

  } catch (error) {
    handleError(error, 'social-connect')
    
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode || 500 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to initiate connection' },
      { status: 500 }
    )
  }
}

function generateStateParam(userId: string, platform: string): string {
  // In production, use a proper state generation method
  const timestamp = Date.now()
  const data = `${userId}:${platform}:${timestamp}`
  
  // Simple base64 encoding for demo - use proper encryption in production
  return Buffer.from(data).toString('base64')
} 