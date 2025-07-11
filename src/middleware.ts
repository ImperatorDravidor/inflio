import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { rateLimit, apiRateLimits, securityHeaders } from '@/lib/security'
import { logger } from '@/lib/logger'

// Define public routes that don't require authentication
const isPublicRoute = createRouteMatcher([
  '/',
  '/login(.*)',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhooks(.*)',
  '/api/upload',
  '/examples/transcription-demo'
])

const isOnboardingRoute = createRouteMatcher([
  '/onboarding(.*)'
])

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth()

  // Apply rate limiting for API routes
  if (req.nextUrl.pathname.startsWith('/api/')) {
    const rateLimitConfig = apiRateLimits[req.nextUrl.pathname]
    const rateLimitResult = await rateLimit(req, rateLimitConfig)
    
    if (rateLimitResult) {
      // Add security headers to rate limit response
      Object.entries(securityHeaders).forEach(([key, value]) => {
        rateLimitResult.headers.set(key, value)
      })
      return rateLimitResult
    }
  }

  const onboardingUrl = new URL('/onboarding', req.url)

  // For public routes, allow access without a user
  if (isPublicRoute(req)) {
    const response = NextResponse.next()
    // Add security headers
    Object.entries(securityHeaders).forEach(([key, value]) => {
      response.headers.set(key, value)
    })
    return response
  }

  // If the user is not logged in and tries to access a protected route, redirect to sign-in
  if (!userId) {
    const signInUrl = new URL('/sign-in', req.url)
    signInUrl.searchParams.set('redirect_url', req.url)
    const response = NextResponse.redirect(signInUrl)
    // Add security headers
    Object.entries(securityHeaders).forEach(([key, value]) => {
      response.headers.set(key, value)
    })
    return response
  }
  
  // If the user is logged in, check if their onboarding is complete
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('onboarding_completed')
      .eq('clerk_user_id', userId)
      .single();

    if (error) {
      logger.warn('Failed to fetch user profile in middleware', {
        action: 'middleware_profile_check',
        userId,
        metadata: { error: error.message }
      })
    }

    // If they have not completed onboarding and are not on the onboarding page, redirect them
    if (profile && !profile.onboarding_completed && !isOnboardingRoute(req)) {
      const response = NextResponse.redirect(onboardingUrl);
      // Add security headers
      Object.entries(securityHeaders).forEach(([key, value]) => {
        response.headers.set(key, value)
      })
      return response
    }

    // If onboarding is complete and they somehow land on the onboarding page, redirect to dashboard
    if (profile && profile.onboarding_completed && isOnboardingRoute(req)) {
      const response = NextResponse.redirect(new URL('/dashboard', req.url));
      // Add security headers
      Object.entries(securityHeaders).forEach(([key, value]) => {
        response.headers.set(key, value)
      })
      return response
    }

    // Otherwise, allow the request to proceed
    const response = NextResponse.next()
    // Add security headers
    Object.entries(securityHeaders).forEach(([key, value]) => {
      response.headers.set(key, value)
    })
    return response
  } catch (error) {
    logger.error('Middleware error', {
      action: 'middleware_error',
      userId,
      metadata: { 
        path: req.url,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }, error as Error)
    
    // On error, allow the request to proceed but log it
    const response = NextResponse.next()
    Object.entries(securityHeaders).forEach(([key, value]) => {
      response.headers.set(key, value)
    })
    return response
  }
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
} 
