import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all personas for the user
    const { data: personas, error: personasError } = await supabaseAdmin
      .from('personas')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (personasError) {
      console.error('Error fetching personas:', personasError)
      return NextResponse.json({ error: 'Failed to fetch personas' }, { status: 500 })
    }

    // Get user profile to check default persona
    const { data: profile } = await supabaseAdmin
      .from('user_profiles')
      .select('default_persona_id, persona_training_images, persona_lora_model')
      .eq('clerk_user_id', userId)
      .single()

    // Get persona images for each persona
    const personasWithImages = await Promise.all(
      (personas || []).map(async (persona) => {
        const { data: images } = await supabaseAdmin
          .from('persona_images')
          .select('*')
          .eq('persona_id', persona.id)
          .order('created_at', { ascending: true })

        return {
          ...persona,
          images: images || []
        }
      })
    )

    return NextResponse.json({
      personas: personasWithImages,
      defaultPersonaId: profile?.default_persona_id,
      profile: {
        hasTrainingImages: !!profile?.persona_training_images,
        hasLoraModel: !!profile?.persona_lora_model
      }
    })
  } catch (error) {
    console.error('Error in check-persona:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}