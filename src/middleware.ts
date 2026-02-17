import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { isDevRoute } from '@/app/api/middleware-protect-dev-routes'

// Define public routes that don't require authentication
const isPublicRoute = createRouteMatcher([
  '/',
  '/login(.*)',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhooks(.*)',
  '/api/upload',
  '/api/cron(.*)',  // Allow cron jobs
  '/api/worker(.*)', // Allow worker endpoints
  '/api/inngest(.*)', // Allow Inngest endpoint
  '/api/dev-bypass-onboarding', // Allow dev bypass
  '/settings/skip-onboarding', // Allow skip page
  '/examples/transcription-demo'
])

// Define protected routes that require authentication
const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/projects(.*)',
  '/studio(.*)',
  '/personas(.*)',
  '/social(.*)',
  '/onboarding(.*)'
])

const isOnboardingRoute = createRouteMatcher([
  '/onboarding(.*)'
])

export default clerkMiddleware(async (auth, req) => {
  const { userId, sessionClaims } = await auth()

  const onboardingUrl = new URL('/onboarding', req.url)
  
  // Check if this is a development/test route in production
  if (process.env.NODE_ENV === 'production' && isDevRoute(req.url)) {
    // In production, only allow admin access to dev routes
    if (!userId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    
    // Check if user is admin (via environment variable)
    const adminEmails = process.env.ADMIN_EMAILS?.split(',') || []
    const userEmail = sessionClaims?.email as string
    
    if (!adminEmails.includes(userEmail)) {
      console.warn(`[Security] Non-admin access attempt to ${req.url} by ${userEmail}`)
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
  }

  // For public routes, allow access without a user
  if (isPublicRoute(req)) {
    return NextResponse.next()
  }

  // For any non-public route, require authentication
  if (!userId) {
    const signInUrl = new URL('/sign-in', req.url)
    signInUrl.searchParams.set('redirect_url', req.url)
    return NextResponse.redirect(signInUrl)
  }
  
  // If we have a userId, check onboarding status
  if (userId) {
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

      // Log errors but don't block navigation
      if (error && error.code !== 'PGRST116') {
        console.error('[Middleware] Supabase profile check failed:', error.message)
      }

      // Development bypass: skip onboarding enforcement in development mode
      const isDevelopment = process.env.NODE_ENV === 'development'
      const skipOnboarding = req.nextUrl.searchParams.get('skip_onboarding') === 'true'
      
      // If they have not completed onboarding and are not on the onboarding page, redirect them
      // Unless in development mode or explicitly skipping
      if (profile && !profile.onboarding_completed && !isOnboardingRoute(req) && !isDevelopment && !skipOnboarding) {
        return NextResponse.redirect(onboardingUrl);
      }

      // If onboarding is complete and they try to access the onboarding page
      // In development mode, always allow access to onboarding for testing
      if (profile && profile.onboarding_completed && isOnboardingRoute(req) && !isDevelopment) {
        return NextResponse.redirect(new URL('/dashboard', req.url));
      }
    } catch (middlewareError) {
      console.error('[Middleware] Error checking onboarding status:', middlewareError)
      // Don't block navigation on middleware errors in development
      if (process.env.NODE_ENV === 'development') {
        console.warn('[Middleware] Allowing navigation despite error (development mode)')
      }
    }
  }

  // Otherwise, allow the request to proceed
  return NextResponse.next()
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
} 
