import { NextResponse } from 'next/server'
import { VideoProcessingService } from '@/lib/video-processing-service'

export async function GET() {
  try {
    const available = await VideoProcessingService.checkFFmpegAvailable()
    
    return NextResponse.json({
      available,
      provider: available ? 'ffmpeg' : 'cloud',
      message: available 
        ? 'FFmpeg is available for subtitle burning' 
        : 'FFmpeg not available, will use cloud services or VTT overlay'
    })
  } catch (error) {
    console.error('Check FFmpeg error:', error)
    return NextResponse.json({
      available: false,
      provider: 'cloud',
      error: error instanceof Error ? error.message : 'Failed to check FFmpeg'
    })
  }
} 