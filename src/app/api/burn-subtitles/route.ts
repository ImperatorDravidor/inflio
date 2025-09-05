import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { exec } from 'child_process'
import { promisify } from 'util'
import { writeFile, unlink, mkdir } from 'fs/promises'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'
import os from 'os'

const execAsync = promisify(exec)

interface BurnSubtitlesRequest {
  projectId: string
  videoUrl: string
  subtitles?: {
    text: string
    start: number
    end: number
  }[]
  style?: {
    fontFamily?: string
    fontSize?: string
    fontColor?: string
    backgroundColor?: string
    position?: 'bottom' | 'top' | 'center'
    outline?: boolean
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: BurnSubtitlesRequest = await req.json()
    const { projectId, videoUrl, subtitles, style = {} } = body

    if (!projectId || !videoUrl) {
      return NextResponse.json(
        { error: 'Project ID and video URL are required' },
        { status: 400 }
      )
    }

    // Get project to access transcription
    const { data: project, error: projectError } = await supabaseAdmin
      .from('projects')
      .select('transcription, title')
      .eq('id', projectId)
      .eq('user_id', userId)
      .single()

    if (projectError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Use provided subtitles or get from transcription
    let srtSubtitles = subtitles
    if (!srtSubtitles && project.transcription?.segments) {
      srtSubtitles = project.transcription.segments.map((seg: any) => ({
        text: seg.text,
        start: seg.start,
        end: seg.end
      }))
    }

    if (!srtSubtitles || srtSubtitles.length === 0) {
      return NextResponse.json(
        { error: 'No subtitles available for this video' },
        { status: 400 }
      )
    }

    // Create temp directory
    const tempDir = path.join(os.tmpdir(), `subtitles-${uuidv4()}`)
    await mkdir(tempDir, { recursive: true })

    // Create SRT file
    const srtPath = path.join(tempDir, 'subtitles.srt')
    const srtContent = createSRTContent(srtSubtitles)
    await writeFile(srtPath, srtContent, 'utf-8')

    // Download video to temp location
    const videoPath = path.join(tempDir, 'input.mp4')
    const outputPath = path.join(tempDir, 'output.mp4')

    // Download video using curl
    await execAsync(`curl -o "${videoPath}" "${videoUrl}"`)

    // Determine subtitle style parameters
    const fontFamily = style.fontFamily || 'Arial'
    const fontSize = style.fontSize || '24'
    const fontColor = style.fontColor || 'white'
    const backgroundColor = style.backgroundColor || 'black@0.5'
    const position = style.position || 'bottom'
    const outline = style.outline !== false

    // Build FFmpeg filter for subtitles
    let subtitleFilter = `subtitles='${srtPath}':force_style='`
    subtitleFilter += `FontName=${fontFamily},`
    subtitleFilter += `FontSize=${fontSize},`
    subtitleFilter += `PrimaryColour=&H${colorToHex(fontColor)}&,`
    subtitleFilter += `BackColour=&H${colorToHex(backgroundColor)}&,`
    
    if (outline) {
      subtitleFilter += `OutlineColour=&H00000000&,Outline=2,`
    }
    
    // Position
    if (position === 'top') {
      subtitleFilter += `Alignment=2,MarginV=20`
    } else if (position === 'center') {
      subtitleFilter += `Alignment=5`
    } else {
      subtitleFilter += `Alignment=2,MarginV=20`
    }
    
    subtitleFilter += `'`

    // Run FFmpeg to burn subtitles
    const ffmpegCommand = `ffmpeg -i "${videoPath}" -vf "${subtitleFilter}" -c:a copy -c:v libx264 -preset fast "${outputPath}"`
    
    try {
      await execAsync(ffmpegCommand)
    } catch (ffmpegError) {
      console.error('FFmpeg error:', ffmpegError)
      // Clean up temp files
      await cleanupTempFiles(tempDir)
      return NextResponse.json(
        { error: 'Failed to burn subtitles into video' },
        { status: 500 }
      )
    }

    // Upload processed video to Supabase storage
    const processedFileName = `${projectId}/processed/video-with-subtitles-${Date.now()}.mp4`
    const videoBuffer = await require('fs').promises.readFile(outputPath)
    
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('videos')
      .upload(processedFileName, videoBuffer, {
        contentType: 'video/mp4',
        upsert: false
      })

    if (uploadError) {
      // Clean up temp files
      await cleanupTempFiles(tempDir)
      return NextResponse.json(
        { error: 'Failed to upload processed video' },
        { status: 500 }
      )
    }

    // Get public URL
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('videos')
      .getPublicUrl(processedFileName)

    // Update project with processed video URL
    await supabaseAdmin
      .from('projects')
      .update({
        processed_video_url: publicUrl,
        has_burned_subtitles: true,
        processed_at: new Date().toISOString()
      })
      .eq('id', projectId)

    // Clean up temp files
    await cleanupTempFiles(tempDir)

    return NextResponse.json({
      success: true,
      processedVideoUrl: publicUrl,
      message: 'Subtitles burned successfully'
    })

  } catch (error) {
    console.error('Burn subtitles error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to burn subtitles',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Create SRT content from segments
function createSRTContent(segments: Array<{ text: string; start: number; end: number }>): string {
  return segments.map((seg, index) => {
    const startTime = formatSRTTime(seg.start)
    const endTime = formatSRTTime(seg.end)
    return `${index + 1}\n${startTime} --> ${endTime}\n${seg.text}\n`
  }).join('\n')
}

// Format time for SRT (HH:MM:SS,mmm)
function formatSRTTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)
  const millis = Math.floor((seconds % 1) * 1000)
  
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')},${String(millis).padStart(3, '0')}`
}

// Convert color name/hex to BGR hex for FFmpeg
function colorToHex(color: string): string {
  const colors: Record<string, string> = {
    white: 'FFFFFF',
    black: '000000',
    red: '0000FF',
    blue: 'FF0000',
    green: '00FF00',
    yellow: '00FFFF'
  }
  
  if (colors[color]) return colors[color]
  if (color.startsWith('#')) {
    // Convert RGB to BGR for FFmpeg
    const rgb = color.slice(1)
    const r = rgb.slice(0, 2)
    const g = rgb.slice(2, 4)
    const b = rgb.slice(4, 6)
    return b + g + r
  }
  
  return 'FFFFFF' // Default to white
}

// Clean up temporary files
async function cleanupTempFiles(tempDir: string) {
  try {
    const files = await require('fs').promises.readdir(tempDir)
    for (const file of files) {
      await unlink(path.join(tempDir, file))
    }
    await require('fs').promises.rmdir(tempDir)
  } catch (error) {
    console.error('Error cleaning up temp files:', error)
  }
}

