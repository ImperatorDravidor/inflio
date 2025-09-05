import { NextRequest, NextResponse } from 'next/server'
import { auth } from "@clerk/nextjs/server"
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: projectId } = await params

    // Verify project ownership
    const { data: project } = await supabaseAdmin
      .from('projects')
      .select('user_id')
      .eq('id', projectId)
      .single()

    if (!project || project.user_id !== userId) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Get graphics from database
    const { data: dbGraphics, error: dbError } = await supabaseAdmin
      .from('social_graphics')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })

    if (dbError && dbError.code !== 'PGRST116') { // Ignore table not found error
      throw dbError
    }

    // Also get graphics from project folders (legacy)
    const { data: projectData } = await supabaseAdmin
      .from('projects')
      .select('folders')
      .eq('id', projectId)
      .single()

    const folderGraphics = projectData?.folders?.socialGraphics || []

    // Combine both sources
    const allGraphics = [
      ...(dbGraphics || []),
      ...folderGraphics.map((g: any) => ({
        ...g,
        created_at: g.createdAt || g.timestamp
      }))
    ]

    // Remove duplicates based on URL
    const uniqueGraphics = Array.from(
      new Map(allGraphics.map(g => [g.url, g])).values()
    )

    return NextResponse.json({ 
      graphics: uniqueGraphics,
      count: uniqueGraphics.length 
    })

  } catch (error) {
    console.error('Error fetching graphics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch graphics' },
      { status: 500 }
    )
  }
} 