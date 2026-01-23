import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { PersonaServiceV2 } from '@/lib/services/persona-service-v2'

export const runtime = 'nodejs'
export const maxDuration = 300 // 5 minutes for portrait generation

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { personaId } = await request.json()

    if (!personaId) {
      return NextResponse.json(
        { error: 'personaId is required' },
        { status: 400 }
      )
    }

    // Regenerate portraits using PersonaServiceV2
    const success = await PersonaServiceV2.regeneratePortraits(personaId, userId)

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to regenerate portraits' },
        { status: 500 }
      )
    }

    // Get updated portraits
    const portraits = await PersonaServiceV2.getPersonaPortraits(personaId)

    return NextResponse.json({
      success: true,
      portraits,
      message: 'Portraits regenerated successfully'
    })

  } catch (error) {
    console.error('Regenerate portraits error:', error)
    return NextResponse.json(
      {
        error: 'Failed to regenerate portraits',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
