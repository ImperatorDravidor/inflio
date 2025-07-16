import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Check auth
    const { userId } = await auth()
    const isAuthenticated = !!userId
    
    // Check environment variables
    const envCheck = {
      // Core
      NODE_ENV: process.env.NODE_ENV,
      VERCEL: !!process.env.VERCEL,
      VERCEL_ENV: process.env.VERCEL_ENV,
      VERCEL_URL: process.env.VERCEL_URL,
      NEXT_PUBLIC_VERCEL_URL: process.env.NEXT_PUBLIC_VERCEL_URL,
      
      // App URLs
      NEXT_PUBLIC_APP_URL: !!process.env.NEXT_PUBLIC_APP_URL,
      
      // Authentication
      isAuthenticated,
      userId: isAuthenticated ? userId : 'Not authenticated',
      
      // API Keys
      KLAP_API_KEY: !!process.env.KLAP_API_KEY,
      OPENAI_API_KEY: !!process.env.OPENAI_API_KEY,
      
      // Redis Configuration (for Klap job queue)
      UPSTASH_REDIS_REST_URL: !!process.env.UPSTASH_REDIS_REST_URL,
      UPSTASH_REDIS_REST_TOKEN: !!process.env.UPSTASH_REDIS_REST_TOKEN,
      
      // Worker Configuration
      WORKER_SECRET: !!process.env.WORKER_SECRET,
      
      // Supabase
      NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      
      // Optional
      SKIP_KLAP_VIDEO_REUPLOAD: process.env.SKIP_KLAP_VIDEO_REUPLOAD,
      
      // Computed URLs
      computedWorkerUrl: process.env.VERCEL_URL 
        ? `https://${process.env.VERCEL_URL}/api/worker/klap`
        : process.env.NEXT_PUBLIC_VERCEL_URL
        ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}/api/worker/klap`
        : 'http://localhost:3000/api/worker/klap'
    }
    
    // Check for missing critical variables
    const missingCritical = []
    if (!envCheck.KLAP_API_KEY) missingCritical.push('KLAP_API_KEY')
    if (!envCheck.UPSTASH_REDIS_REST_URL) missingCritical.push('UPSTASH_REDIS_REST_URL')
    if (!envCheck.UPSTASH_REDIS_REST_TOKEN) missingCritical.push('UPSTASH_REDIS_REST_TOKEN')
    if (!envCheck.WORKER_SECRET) missingCritical.push('WORKER_SECRET')
    
    // Test Redis connection if configured
    let redisStatus = 'Not configured'
    if (envCheck.UPSTASH_REDIS_REST_URL && envCheck.UPSTASH_REDIS_REST_TOKEN) {
      try {
        const { Redis } = await import('@upstash/redis')
        const redis = new Redis({
          url: process.env.UPSTASH_REDIS_REST_URL!,
          token: process.env.UPSTASH_REDIS_REST_TOKEN!,
        })
        await redis.ping()
        redisStatus = 'Connected successfully'
      } catch (error) {
        redisStatus = `Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
    
    return NextResponse.json({
      status: 'Debug information',
      environment: envCheck,
      missingCritical: missingCritical.length > 0 ? missingCritical : 'None',
      redisStatus,
      recommendations: missingCritical.length > 0 ? [
        'Add missing environment variables in Vercel Dashboard:',
        '1. Go to your project settings',
        '2. Navigate to Environment Variables',
        '3. Add the missing variables listed above',
        '',
        'For Redis (required for Klap job queue):',
        '- Sign up at https://upstash.com',
        '- Create a Redis database',
        '- Copy the REST URL and token',
        '',
        'For Worker Secret:',
        '- Generate a random string: openssl rand -base64 32',
        '- Or use any secure random string'
      ] : 'All critical variables are configured'
    })
  } catch (error) {
    return NextResponse.json({
      error: 'Debug endpoint error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 