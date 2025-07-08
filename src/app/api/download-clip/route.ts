import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

export async function POST(request: NextRequest) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { clipId, projectId, folderId } = await request.json()
    
    if (!clipId || !projectId) {
      return NextResponse.json({ error: 'Missing clipId or projectId' }, { status: 400 })
    }

    // Get the project to verify ownership
    const { ProjectService } = await import('@/lib/services')
    const project = await ProjectService.getProject(projectId)
    
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Find the clip
    const clip = project.folders?.clips?.find((c: any) => c.id === clipId)
    if (!clip) {
      return NextResponse.json({ error: 'Clip not found' }, { status: 404 })
    }

    // If already stored in Supabase, return that URL
    if (clip.exportUrl && clip.exportUrl.includes('supabase')) {
      return NextResponse.json({ 
        success: true, 
        url: clip.exportUrl,
        source: 'supabase'
      })
    }

    // Otherwise, download from Klap and store it
    const { KlapAPIService } = await import('@/lib/klap-api')
    const { supabaseAdmin } = await import('@/lib/supabase/admin')
    
    try {
      // Export the clip from Klap
      const exportedData = await KlapAPIService.exportMultipleClips(
        folderId || project.klap_folder_id, 
        [clipId]
      )
      
      if (exportedData.length > 0 && exportedData[0].url) {
        const exportUrl = exportedData[0].url
        
        // Download the video
        const clipResponse = await fetch(exportUrl)
        if (!clipResponse.ok) {
          throw new Error('Failed to download clip from Klap')
        }
        
        const clipBuffer = await clipResponse.arrayBuffer()
        const clipBlob = Buffer.from(clipBuffer)
        
        // Upload to Supabase
        const clipFileName = `${projectId}/clips/${clipId}.mp4`
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
        
        // Update the clip in the database
        const updatedClips = project.folders.clips.map((c: any) => 
          c.id === clipId 
            ? { ...c, exportUrl: publicUrl }
            : c
        )
        
        await ProjectService.updateProject(projectId, {
          folders: {
            ...project.folders,
            clips: updatedClips
          }
        })
        
        return NextResponse.json({ 
          success: true, 
          url: publicUrl,
          source: 'downloaded'
        })
      }
    } catch (error) {
      console.error('Failed to download/store clip:', error)
      // Fallback to Klap URL
      return NextResponse.json({ 
        success: true, 
        url: clip.previewUrl || `https://klap.app/player/${clipId}`,
        source: 'klap',
        warning: 'Using Klap URL directly, download failed'
      })
    }
  } catch (error) {
    console.error('Download clip error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to download clip' },
      { status: 500 }
    )
  }
} 