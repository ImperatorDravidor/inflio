import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const projectId = searchParams.get('projectId')

    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      )
    }

    console.log('[suggestions API] Fetching suggestions for project:', projectId, 'user:', userId)
    
    // First verify the project belongs to the user
    const { data: project } = await supabaseAdmin
      .from('projects')
      .select('id, user_id')
      .eq('id', projectId)
      .eq('user_id', userId)
      .single()
    
    if (!project) {
      console.log('[suggestions API] Project not found or not owned by user')
      return NextResponse.json(
        { error: 'Project not found or unauthorized' },
        { status: 404 }
      )
    }
    
    // Get all post suggestions for the project (without user_id filter since it might be stored differently)
    const { data: suggestions, error } = await supabaseAdmin
      .from('post_suggestions')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })

    console.log('[suggestions API] Query result:', { 
      count: suggestions?.length || 0, 
      error: error?.message 
    })

    if (error) {
      console.error('[suggestions API] Database error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch suggestions', details: error.message },
        { status: 500 }
      )
    }

    // Also get any associated copy data if the post_copy table exists
    let copyData: any[] = []
    try {
      const suggestionIds = suggestions?.map(s => s.id) || []
      if (suggestionIds.length > 0) {
        const { data } = await supabaseAdmin
          .from('post_copy')
          .select('*')
          .in('suggestion_id', suggestionIds)
        
        copyData = data || []
      }
    } catch (copyError) {
      // Ignore if post_copy table doesn't exist
      console.log('post_copy table might not exist, continuing without it')
    }

    // Merge copy data with suggestions
    const suggestionsWithCopy = suggestions?.map(suggestion => {
      const copies = copyData.filter(c => c.suggestion_id === suggestion.id)
      const copy_variants: Record<string, any> = {}
      
      copies.forEach(copy => {
        copy_variants[copy.platform] = {
          caption: copy.caption || '',
          hashtags: copy.hashtags || [],
          cta: copy.cta || '',
          title: copy.title || '',
          description: copy.description || ''
        }
      })

      // If no copy data exists, use the existing copy_variants from the suggestion
      return {
        ...suggestion,
        copy_variants: Object.keys(copy_variants).length > 0 ? copy_variants : suggestion.copy_variants
      }
    }) || []

    return NextResponse.json({
      success: true,
      suggestions: suggestionsWithCopy,
      count: suggestionsWithCopy.length
    })

  } catch (error) {
    console.error('Error fetching post suggestions:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch post suggestions',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}