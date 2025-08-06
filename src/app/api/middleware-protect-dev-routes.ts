import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

/**
 * List of route patterns that should be protected in production
 * These are development/debugging endpoints that shouldn't be publicly accessible
 */
const PROTECTED_ROUTE_PATTERNS = [
  '/api/test-',
  '/api/debug-',
  '/api/diagnose-',
  '/api/fix-',
  '/api/check-klap-',
  '/api/restart-',
  '/api/process-klap-direct',
  '/api/process-klap-force',
  '/api/add-clips-task',
  '/api/env-check',
  '/api/test/',
  '/api/debug/',
  '/api/diagnose/',
  '/api/fix/',
];

/**
 * Middleware to protect development/debug routes in production
 * Returns 404 for non-admin users in production environment
 */
export async function protectDevRoutes(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  // Check if this is a protected route
  const isProtectedRoute = PROTECTED_ROUTE_PATTERNS.some(pattern => 
    pathname.includes(pattern)
  );
  
  if (!isProtectedRoute) {
    return null; // Not a protected route, continue normally
  }
  
  // In development, allow all access
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Dev Route] Allowing access to ${pathname} in development`);
    return null;
  }
  
  // In production, check for admin access
  try {
    const session = await auth();
    
    // Check if user is authenticated
    if (!session?.userId) {
      console.warn(`[Security] Unauthorized access attempt to ${pathname}`);
      return NextResponse.json(
        { error: 'Not found' },
        { status: 404 }
      );
    }
    
    // Check for admin role (you can customize this based on your user model)
    // For now, we'll use an environment variable to specify admin emails
    const adminEmails = process.env.ADMIN_EMAILS?.split(',') || [];
    const userEmail = session.sessionClaims?.email as string;
    
    if (!adminEmails.includes(userEmail)) {
      console.warn(`[Security] Non-admin access attempt to ${pathname} by ${userEmail}`);
      return NextResponse.json(
        { error: 'Not found' },
        { status: 404 }
      );
    }
    
    console.log(`[Admin Route] Admin access granted to ${pathname} for ${userEmail}`);
    return null; // Allow admin access
    
  } catch (error) {
    console.error(`[Security] Error checking auth for ${pathname}:`, error);
    return NextResponse.json(
      { error: 'Not found' },
      { status: 404 }
    );
  }
}

/**
 * Helper function to check if a route should be protected
 * Can be used in individual route handlers as well
 */
export function isDevRoute(pathname: string): boolean {
  return PROTECTED_ROUTE_PATTERNS.some(pattern => pathname.includes(pattern));
}

/**
 * Helper function to create a standard protected route handler
 * Use this wrapper for all test/debug endpoints
 */
export function createProtectedDevHandler(
  handler: (request: NextRequest) => Promise<NextResponse>
) {
  return async (request: NextRequest) => {
    // Check protection
    const protectionResponse = await protectDevRoutes(request);
    if (protectionResponse) {
      return protectionResponse;
    }
    
    // Execute the actual handler
    return handler(request);
  };
}