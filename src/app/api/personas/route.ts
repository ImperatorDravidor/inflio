import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'

/**
 * GET /api/personas - List all personas for the current user
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createSupabaseServerClient()

    // Fetch all personas for this user
    const { data: personas, error } = await supabase
      .from('personas')
      .select('id, name, description, status, metadata, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching personas:', error)
      return NextResponse.json({ error: 'Failed to fetch personas' }, { status: 500 })
    }

    // Transform personas to include avatar_url and training progress from metadata
    const transformedPersonas = (personas || []).map(persona => {
      // Get avatar from metadata portraits
      let avatar_url = null
      if (persona.metadata?.portraits && persona.metadata.portraits.length > 0) {
        // Use the first portrait as avatar
        avatar_url = persona.metadata.portraits[0].url
      } else if (persona.metadata?.generalPortraitUrls && persona.metadata.generalPortraitUrls.length > 0) {
        avatar_url = persona.metadata.generalPortraitUrls[0]
      } else if (persona.metadata?.portraitUrls && persona.metadata.portraitUrls.length > 0) {
        avatar_url = persona.metadata.portraitUrls[0]
      }

      // Calculate training progress from metadata
      const photoCount = persona.metadata?.photoCount || 0
      const portraitsGenerated = persona.metadata?.portraits?.length || 
                                 persona.metadata?.generalPortraitUrls?.length || 
                                 persona.metadata?.portraitUrls?.length || 0

      return {
        id: persona.id,
        name: persona.name,
        description: persona.description,
        status: persona.status,
        avatar_url,
        created_at: persona.created_at,
        // Training progress info
        photoCount,
        portraitsGenerated
      }
    })

    return NextResponse.json({
      personas: transformedPersonas,
      count: transformedPersonas.length
    })
  } catch (error) {
    console.error('Personas API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
