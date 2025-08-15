import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')

    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      )
    }

    const supabase = await createSupabaseServerClient()
    
    // Get suggestions with related data
    const { data: suggestions, error } = await supabase
      .from('post_suggestions')
      .select(`
        *,
        post_images (
          id,
          url,
          position,
          platform,
          dimensions
        ),
        post_copy (
          platform,
          caption,
          hashtags,
          cta,
          title,
          description,
          is_edited,
          edited_caption,
          edited_hashtags,
          edited_cta
        )
      `)
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Failed to fetch suggestions:', error)
      return NextResponse.json(
        { error: 'Failed to fetch suggestions' },
        { status: 500 }
      )
    }

    // Transform the data to match the expected format
    const transformedSuggestions = suggestions?.map(suggestion => {
      // Build copy variants object from post_copy array
      const copyVariants: Record<string, any> = {}
      suggestion.post_copy?.forEach((copy: any) => {
        copyVariants[copy.platform] = {
          caption: copy.is_edited ? copy.edited_caption : copy.caption,
          hashtags: copy.is_edited ? copy.edited_hashtags : copy.hashtags,
          cta: copy.is_edited ? copy.edited_cta : copy.cta,
          title: copy.title,
          description: copy.description
        }
      })

      return {
        ...suggestion,
        images: suggestion.post_images || [],
        copy_variants: copyVariants
      }
    })

    return NextResponse.json({ suggestions: transformedSuggestions || [] })
  } catch (error) {
    console.error('Error fetching suggestions:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}