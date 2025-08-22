/**
 * ⚠️ PROTECTED ROUTE - This endpoint is protected in production
 * Only accessible in development or by admin users
 * Protection handled by middleware-protect-dev-routes.ts
 */

import { NextResponse } from 'next/server'
import { auth } from "@clerk/nextjs/server"
import { checkRequiredEnvVars, features } from '@/lib/env-check'

export async function GET() {
  try {
    // Check authentication
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check environment variables
    const envCheck = checkRequiredEnvVars()
    
    // Get feature status
    const featureStatus = {
      core: {
        supabase: envCheck.missing.filter(m => m.includes('SUPABASE')).length === 0,
        clerk: envCheck.missing.filter(m => m.includes('CLERK')).length === 0,
        appUrl: !!process.env.NEXT_PUBLIC_APP_URL
      },
      ai: features.ai,
      socialAuth: features.socialAuth,
      storage: features.storage,
      monitoring: features.monitoring,
      rateLimit: features.rateLimit,
      video: {
        klap: features.klap,
        transcription: features.ai.assemblyai,
        processing: true // Always available via browser
      }
    }
    
    // Calculate overall health
    const health = {
      status: envCheck.isValid ? 'healthy' : 'degraded',
      percentage: Math.round(
        ((Object.keys(process.env).length - envCheck.missing.length) / 
        Object.keys(process.env).length) * 100
      )
    }

    return NextResponse.json({
      health,
      environment: process.env.NODE_ENV,
      required: {
        valid: envCheck.isValid,
        missing: envCheck.missing
      },
      warnings: envCheck.warnings,
      features: featureStatus,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Environment check error:', error)
    return NextResponse.json(
      { error: 'Failed to check environment' },
      { status: 500 }
    )
  }
} 