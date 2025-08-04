import { NextRequest, NextResponse } from 'next/server'
import { auth } from "@clerk/nextjs/server"
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; graphicId: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: projectId, graphicId } = await params

    // Verify project ownership
    const { data: project } = await supabaseAdmin
      .from('projects')
      .select('user_id, folders')
      .eq('id', projectId)
      .single()

    if (!project || project.user_id !== userId) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Try to delete from database first
    const { error: dbError } = await supabaseAdmin
      .from('social_graphics')
      .delete()
      .eq('id', graphicId)
      .eq('project_id', projectId)

    if (dbError && dbError.code !== 'PGRST116') { // Ignore table not found error
      throw dbError
    }

    // Also remove from project folders (legacy)
    if (project.folders?.socialGraphics) {
      const updatedGraphics = project.folders.socialGraphics.filter(
        (g: any) => g.id !== graphicId
      )
      
      await supabaseAdmin
        .from('projects')
        .update({
          folders: {
            ...project.folders,
            socialGraphics: updatedGraphics
          }
        })
        .eq('id', projectId)
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error deleting graphic:', error)
    return NextResponse.json(
      { error: 'Failed to delete graphic' },
      { status: 500 }
    )
  }
} 