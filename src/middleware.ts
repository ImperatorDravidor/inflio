import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

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
  '/api/debug-production', // Debug endpoint (protected by auth internally)
  '/examples/transcription-demo'
])

const isOnboardingRoute = createRouteMatcher([
  '/onboarding(.*)'
])

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth()

  const onboardingUrl = new URL('/onboarding', req.url)

  // For public routes, allow access without a user
  if (isPublicRoute(req)) {
    return NextResponse.next()
  }

  // If the user is not logged in and tries to access a protected route, redirect to sign-in
  if (!userId) {
    const signInUrl = new URL('/sign-in', req.url)
    signInUrl.searchParams.set('redirect_url', req.url)
    return NextResponse.redirect(signInUrl)
  }
  
  // If the user is logged in, check if their onboarding is complete
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

  const { data: profile } = await supabase
      .from('user_profiles')
      .select('onboarding_completed')
      .eq('clerk_user_id', userId)
      .single();

    // If they have not completed onboarding and are not on the onboarding page, redirect them
    if (profile && !profile.onboarding_completed && !isOnboardingRoute(req)) {
    return NextResponse.redirect(onboardingUrl);
    }

    // If onboarding is complete and they somehow land on the onboarding page, redirect to dashboard
    if (profile && profile.onboarding_completed && isOnboardingRoute(req)) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
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
