import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

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

    // Fetch the project with all related data
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .eq('user_id', userId)
      .single()

    if (projectError || !project) {
      console.error('Error fetching project:', projectError)
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Extract data from JSONB folders (clips and other content are stored here, not separate tables)
    const folders = project.folders || { clips: [], blog: [], social: [], images: [] }

    // Compile export data
    const exportData = {
      version: '1.0.0',
      exportDate: new Date().toISOString(),
      project: {
        ...project,
        // Remove sensitive or user-specific data
        user_id: undefined,
        id: undefined
      },
      clips: folders.clips || [],
      chapters: [],
      metadata: {
        originalId: projectId,
        originalUserId: userId,
        totalClips: folders.clips?.length || 0,
        totalChapters: 0,
        totalBlogs: folders.blog?.length || 0,
        totalSocialPosts: folders.social?.length || 0
      }
    }

    // Convert to JSON string
    const jsonString = JSON.stringify(exportData, null, 2)
    
    // Create blob response
    return new Response(jsonString, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${project.title || 'project'}-export-${Date.now()}.json"`
      }
    })

  } catch (error) {
    console.error('Error exporting project:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}