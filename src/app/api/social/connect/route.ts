import { NextRequest, NextResponse } from 'next/server'
import { auth as clerkAuth } from '@clerk/nextjs/server'
import { generateOAuthUrl, validatePlatformConfig } from '@/lib/social/oauth-config'
import { z } from 'zod'
import { cookies } from 'next/headers'
import crypto from 'crypto'

const connectSchema = z.object({
  platform: z.enum(['instagram', 'facebook', 'x', 'linkedin', 'youtube', 'tiktok', 'threads'])
})

export async function POST(request: NextRequest) {
  try {
    // Auth check with Clerk
    const { userId } = await clerkAuth()
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
        { error: `${platform} is not configured. Please add OAuth credentials to your environment variables.` },
        { status: 400 }
      )
    }

    // Generate state for CSRF protection
    const state = crypto.randomBytes(32).toString('hex')

    // Store state and user info in cookies for the callback
    const cookieStore = await cookies()
    
    // Set cookies with proper options
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      maxAge: 60 * 10, // 10 minutes
      path: '/'
    }
    
    cookieStore.set('oauth_state', state, cookieOptions)
    cookieStore.set('clerk_user_id', userId, cookieOptions)
    cookieStore.set('connecting_platform', platform, cookieOptions)

    // Generate OAuth URL directly
    const authUrl = generateOAuthUrl(platform, state)

    return NextResponse.json({
      authUrl,
      platform
    })

  } catch (error) {
    console.error('Social connect error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to initiate OAuth connection',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    )
  }
} 