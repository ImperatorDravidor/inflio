import { NextRequest, NextResponse } from 'next/server'
import { KlapAPIService } from '@/lib/klap-api'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { auth } from '@clerk/nextjs/server'

export const maxDuration = 60; // 1 minute timeout
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Authenticate
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { projectId, clipId, folderId } = await request.json()
    
    if (!clipId || !projectId) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 })
    }

    // Get project to verify clip exists (use admin client — server-side route)
    const { data: project, error: projectError } = await supabaseAdmin
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single()
    
    if (projectError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const folders = project.folders || { clips: [], blog: [], social: [] }

    // Find the clip in the project
    const clip = (folders.clips || []).find((c: any) => c.id === clipId || c.klapProjectId === clipId)
    if (!clip) {
      return NextResponse.json({ error: 'Clip not found in project' }, { status: 404 })
    }

    // Check if already downloaded
    const clipData = clip as any
    if (clipData.storedInSupabase && clipData.exportUrl && !clipData.exportUrl.includes('klap.app') && !clipData.exportUrl.includes('amazonaws.com')) {
      return NextResponse.json({ 
        success: true, 
        url: clipData.exportUrl,
        message: 'Clip already downloaded'
      })
    }

    // Get folder ID from project or parameter
    const klapFolderId = folderId || project.klap_folder_id || project.klap_project_id
    if (!klapFolderId) {
      return NextResponse.json({ error: 'No Klap folder ID found' }, { status: 400 })
    }

    try {
      // Export the clip from Klap
      const exportedData = await KlapAPIService.exportMultipleClips(klapFolderId, [clipId])
      
      if (!exportedData || exportedData.length === 0 || !exportedData[0].url) {
        throw new Error('Failed to export clip from Klap')
      }

      const exportUrl = exportedData[0].url

      // Download the video
      const response = await fetch(exportUrl)
      if (!response.ok) {
        throw new Error(`Failed to download video: ${response.statusText}`)
      }

      const clipBuffer = await response.arrayBuffer()
      const clipBlob = Buffer.from(clipBuffer)
      
      // Upload to Supabase
      const clipFileName = `${projectId}/clips/clip_${clipId}_${Date.now()}.mp4`
      
      const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
        .from('videos')
        .upload(clipFileName, clipBlob, {
          contentType: 'video/mp4',
          upsert: true
        })
      
      if (uploadError) {
        throw uploadError
      }

      // Get public URL
      const { data: { publicUrl } } = supabaseAdmin.storage
        .from('videos')
        .getPublicUrl(clipFileName)
      

      // Update the clip in the project (use admin client)
      const updatedClips = (folders.clips || []).map((c: any) => 
        c.id === clipId 
          ? { ...c, exportUrl: publicUrl, storedInSupabase: true }
          : c
      )

      await supabaseAdmin
        .from('projects')
        .update({
          folders: { ...folders, clips: updatedClips },
          updated_at: new Date().toISOString()
        })
        .eq('id', projectId)

      return NextResponse.json({
        success: true,
        url: publicUrl,
        message: 'Clip downloaded and stored successfully'
      })

    } catch (error) {
      console.error(`[Download Clip] Error downloading clip:`, error)
      return NextResponse.json(
        { 
          error: 'Failed to download clip', 
          details: error instanceof Error ? error.message : 'Unknown error' 
        },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('[Download Clip] Error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}

// GET endpoint to check if a clip needs downloading
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const clipId = searchParams.get('clipId')
    const projectId = searchParams.get('projectId')
    
    if (!clipId || !projectId) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 })
    }

    // Get project (use admin client)
    const { data: project, error: projectError } = await supabaseAdmin
      .from('projects')
      .select('folders')
      .eq('id', projectId)
      .single()
    
    if (projectError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Find clip
    const clip = project.folders?.clips?.find((c: any) => c.id === clipId)
    if (!clip) {
      return NextResponse.json({ error: 'Clip not found' }, { status: 404 })
    }

    const clipInfo = clip as any
    return NextResponse.json({
      needsDownload: !clipInfo.storedInSupabase || clipInfo.exportUrl?.includes('klap.app'),
      currentUrl: clipInfo.exportUrl,
      storedInSupabase: clipInfo.storedInSupabase || false
    })

  } catch (error) {
    console.error('[Download Clip] GET Error:', error)
    return NextResponse.json(
      { error: 'Failed to check clip status' },
      { status: 500 }
    )
  }
} 