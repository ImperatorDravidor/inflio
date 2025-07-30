import { NextRequest, NextResponse } from 'next/server'
import { auth } from "@clerk/nextjs/server"

export async function requireDevelopmentOrAdmin(req: NextRequest) {
  // Allow in development
  if (process.env.NODE_ENV !== 'production') {
    return null
  }

  // In production, require authentication and admin role
  const { userId } = await auth()
  
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check for admin role or specific allowed users
  const allowedUsers = process.env.ADMIN_USER_IDS?.split(',') || []
  
  if (!allowedUsers.includes(userId)) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 })
  }

  return null
} 