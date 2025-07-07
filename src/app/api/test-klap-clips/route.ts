import { NextRequest, NextResponse } from 'next/server'
import { KlapAPIService } from '@/lib/klap-api'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const folderId = searchParams.get('folderId')
  const projectId = searchParams.get('projectId')
  
  if (!folderId && !projectId) {
    return NextResponse.json({ 
      error: 'Please provide either folderId or projectId as query parameter',
      usage: {
        byFolderId: '/api/test-klap-clips?folderId=YOUR_FOLDER_ID',
        byProjectId: '/api/test-klap-clips?projectId=YOUR_PROJECT_ID'
      }
    }, { status: 400 })
  }

  try {
    let folderIdToUse: string | null = folderId
    
    // If projectId provided, get the folder ID from the project
    if (projectId && !folderId) {
      const { ProjectService } = await import('@/lib/services')
      const project = await ProjectService.getProject(projectId)
      
      if (!project) {
        return NextResponse.json({ error: 'Project not found' }, { status: 404 })
      }
      
      folderIdToUse = project.klap_folder_id || project.klap_project_id || null
      
      if (!folderIdToUse) {
        return NextResponse.json({ 
          error: 'No Klap folder ID found in project',
          project: {
            id: project.id,
            klap_project_id: project.klap_project_id,
            klap_folder_id: project.klap_folder_id
          }
        }, { status: 404 })
      }
    }
    
    if (!folderIdToUse) {
      return NextResponse.json({ error: 'No folder ID available' }, { status: 400 })
    }
    
    console.log(`[Test Klap Clips] Testing folder ID: ${folderIdToUse}`)
    
    // Try to get clips
    const clips = await KlapAPIService.getClipsFromFolder(folderIdToUse)
    
    // Also try the raw API call to see what we get
    const rawResponse = await fetch(`https://api.klap.app/v2/projects/${folderIdToUse}`, {
      headers: {
        'Authorization': `Bearer ${process.env.KLAP_API_KEY}`,
      }
    })
    
    const rawData = await rawResponse.json()
    
    return NextResponse.json({
      success: true,
      folderId: folderIdToUse,
      clipsFound: clips.length,
      clips: clips.slice(0, 3), // Show first 3 clips
      rawApiResponse: {
        status: rawResponse.status,
        headers: Object.fromEntries(rawResponse.headers.entries()),
        data: rawData
      },
      debug: {
        hasApiKey: !!process.env.KLAP_API_KEY,
        apiKeyPrefix: process.env.KLAP_API_KEY?.substring(0, 10) + '...'
      }
    })
  } catch (error) {
    console.error('Test Klap Clips error:', error)
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to fetch clips',
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
} 