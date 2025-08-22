import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params
    
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const projectId = params.id

    // Verify ownership
    const { data: project, error: fetchError } = await supabase
      .from('projects')
      .select('id, user_id, video_url, thumbnail_url')
      .eq('id', projectId)
      .eq('user_id', userId)
      .single()

    if (fetchError || !project) {
      console.error('Error fetching project:', fetchError)
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Delete related data in order (due to foreign key constraints)
    // Delete in parallel where possible
    const deletionPromises = [
      supabase.from('clips').delete().eq('project_id', projectId),
      supabase.from('chapters').delete().eq('project_id', projectId),
      supabase.from('thumbnail_history').delete().eq('project_id', projectId)
    ]

    await Promise.all(deletionPromises)

    // Delete storage files if they exist
    if (project.video_url) {
      try {
        const videoPath = project.video_url.split('/').pop()
        if (videoPath) {
          await supabase.storage
            .from('videos')
            .remove([`${userId}/${videoPath}`])
        }
      } catch (storageError) {
        console.error('Error deleting video file:', storageError)
        // Continue with project deletion even if storage deletion fails
      }
    }

    if (project.thumbnail_url) {
      try {
        const thumbnailPath = project.thumbnail_url.split('/').pop()
        if (thumbnailPath) {
          await supabase.storage
            .from('thumbnails')
            .remove([`${userId}/${thumbnailPath}`])
        }
      } catch (storageError) {
        console.error('Error deleting thumbnail file:', storageError)
        // Continue with project deletion even if storage deletion fails
      }
    }

    // Finally delete the project itself
    const { error: deleteError } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId)
      .eq('user_id', userId)

    if (deleteError) {
      console.error('Error deleting project:', deleteError)
      return NextResponse.json({ error: 'Failed to delete project' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Project deleted successfully' 
    })

  } catch (error) {
    console.error('Error in delete project:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET endpoint to fetch project details
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params
    
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const projectId = params.id

    const { data: project, error } = await supabase
      .from('projects')
      .select(`
        *,
        clips:clips(*),
        chapters:chapters(*)
      `)
      .eq('id', projectId)
      .eq('user_id', userId)
      .single()

    if (error || !project) {
      console.error('Error fetching project:', error)
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    return NextResponse.json(project)

  } catch (error) {
    console.error('Error fetching project:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH endpoint to update project
export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params
    
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const projectId = params.id
    const updates = await req.json()

    // Remove fields that shouldn't be updated directly
    delete updates.id
    delete updates.user_id
    delete updates.created_at

    // Add updated_at timestamp
    updates.updated_at = new Date().toISOString()

    const { data: project, error } = await supabase
      .from('projects')
      .update(updates)
      .eq('id', projectId)
      .eq('user_id', userId)
      .select()
      .single()

    if (error || !project) {
      console.error('Error updating project:', error)
      return NextResponse.json({ error: 'Failed to update project' }, { status: 500 })
    }

    return NextResponse.json(project)

  } catch (error) {
    console.error('Error updating project:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}