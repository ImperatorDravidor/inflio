import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

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

const ignoredRoutes = createRouteMatcher([
  '/api/webhooks(.*)',
  '/api/upload',
  '/examples/transcription-demo',
  '/api/onboarding'
])

const isOnboardingRoute = createRouteMatcher([
  '/onboarding(.*)'
])

export default clerkMiddleware(async (auth, req) => {
  const { userId, sessionClaims, orgId } = await auth()

  // For public routes, allow access
  if (isPublicRoute(req)) {
    return NextResponse.next()
  }

  // If the user is not logged in and tries to access a protected route, redirect to sign-in
  if (!userId && !isPublicRoute(req)) {
    return (await auth()).redirectToSignIn({ returnBackUrl: req.url })
  }
  
  // For all other cases (logged in users accessing protected routes), 
  // allow the request to proceed. The OnboardingCheck component will handle
  // redirecting to onboarding if needed
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