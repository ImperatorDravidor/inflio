import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Please sign in first' }, { status: 401 })
    }
    
    const { ProjectService } = await import('@/lib/services')
    
    // Get all projects for this user
    const projects = await ProjectService.getAllProjects(userId)
    
    const projectsWithKlapStatus = projects.map(project => {
      const clipsTask = project.tasks?.find(t => t.type === 'clips')
      
      return {
        id: project.id,
        title: project.title,
        status: project.status,
        createdAt: project.created_at,
        hasVideo: !!project.video_url,
        klap: {
          hasProjectId: !!project.klap_project_id,
          hasFolderId: !!project.klap_folder_id,
          projectId: project.klap_project_id || 'Not set',
          folderId: project.klap_folder_id || 'Not set',
          taskStatus: clipsTask?.status || 'No task',
          taskProgress: clipsTask?.progress || 0,
          clipsCount: project.folders?.clips?.length || 0
        }
      }
    })
    
    // Find projects that might be stuck
    const klapProjects = projectsWithKlapStatus.filter(p => 
      p.klap.hasProjectId || p.klap.hasFolderId || p.klap.taskStatus === 'processing'
    )
    
    return NextResponse.json({
      success: true,
      userId,
      totalProjects: projects.length,
      projectsWithKlap: klapProjects.length,
      projects: projectsWithKlapStatus.slice(0, 10), // Show first 10
      klapProjects: klapProjects,
      testUrls: klapProjects.length > 0 ? {
        testClips: `/api/test-klap-clips?projectId=${klapProjects[0].id}`,
        debugStatus: `/api/process-klap?projectId=${klapProjects[0].id}&debug=true`,
        forceProcess: klapProjects[0].klap.hasFolderId ? 
          `/api/process-klap-force (POST with projectId: ${klapProjects[0].id}, folderId: ${klapProjects[0].klap.folderId})` : 
          'No folder ID available'
      } : 'No projects with Klap data found'
    })
  } catch (error) {
    console.error('List projects error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to list projects' },
      { status: 500 }
    )
  }
} 