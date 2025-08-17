import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { projectId } = await req.json()
    if (!projectId) {
      return NextResponse.json({ error: 'Project ID required' }, { status: 400 })
    }

    // Fetch the original project
    const { data: originalProject, error: fetchError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .eq('user_id', userId)
      .single()

    if (fetchError || !originalProject) {
      console.error('Error fetching project:', fetchError)
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Create a duplicate with modified title
    const duplicateData = {
      ...originalProject,
      id: undefined, // Let Supabase generate new ID
      title: `${originalProject.title} (Copy)`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      status: 'ready',
      // Keep the same transcription and analysis but clear scheduled posts
      scheduled_posts: [],
      published_posts: []
    }

    // Insert the duplicate
    const { data: newProject, error: insertError } = await supabase
      .from('projects')
      .insert(duplicateData)
      .select()
      .single()

    if (insertError || !newProject) {
      console.error('Error duplicating project:', insertError)
      return NextResponse.json({ error: 'Failed to duplicate project' }, { status: 500 })
    }

    // Duplicate related data (clips, chapters)
    if (originalProject.clips) {
      const { data: originalClips } = await supabase
        .from('clips')
        .select('*')
        .eq('project_id', projectId)

      if (originalClips && originalClips.length > 0) {
        const duplicateClips = originalClips.map(clip => ({
          ...clip,
          id: undefined,
          project_id: newProject.id,
          created_at: new Date().toISOString()
        }))

        await supabase
          .from('clips')
          .insert(duplicateClips)
      }
    }

    if (originalProject.chapters) {
      const { data: originalChapters } = await supabase
        .from('chapters')
        .select('*')
        .eq('project_id', projectId)

      if (originalChapters && originalChapters.length > 0) {
        const duplicateChapters = originalChapters.map(chapter => ({
          ...chapter,
          id: undefined,
          project_id: newProject.id,
          created_at: new Date().toISOString()
        }))

        await supabase
          .from('chapters')
          .insert(duplicateChapters)
      }
    }

    return NextResponse.json({ 
      success: true, 
      newProjectId: newProject.id,
      message: 'Project duplicated successfully' 
    })

  } catch (error) {
    console.error('Error in duplicate project:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}