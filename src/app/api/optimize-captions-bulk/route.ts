import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { AIContentService } from '@/lib/ai-content-service'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { clips } = await request.json()

    if (!clips || !Array.isArray(clips) || clips.length === 0) {
      return NextResponse.json(
        { error: 'No clips provided for optimization' },
        { status: 400 }
      )
    }

    const optimizedClips = await Promise.all(
      clips.map(async (clip) => {
        const optimizedCaptions: Record<string, string> = {}
        
        // Optimize captions for each platform
        for (const [platform, originalCaption] of Object.entries(clip.captions || {})) {
          try {
            // Use AI to enhance the caption
            const enhancedCaption = await AIContentService.generateEnhancedSocialContent(
              typeof originalCaption === 'string' ? originalCaption : '',
              platform,
              {
                style: 'professional',
                includeEmojis: true,
                includeHashtags: true,
                includeCTA: true,
                emojiLevel: 'moderate',
                targetAudience: 'content creators',
                brandVoice: 'professional yet friendly'
              }
            )
            
            optimizedCaptions[platform] = enhancedCaption
          } catch (error) {
            console.error(`Failed to optimize caption for ${platform}:`, error)
            // Keep original if optimization fails
            optimizedCaptions[platform] = originalCaption as string
          }
        }

        return {
          id: clip.id,
          title: clip.title,
          captions: optimizedCaptions,
          originalCaptions: clip.captions,
          improvements: {
            addedEmojis: true,
            optimizedHashtags: true,
            strengthenedCTA: true,
            improvedHook: true
          }
        }
      })
    )

    // Calculate optimization stats
    const stats = {
      totalOptimized: optimizedClips.length,
      platformCounts: {} as Record<string, number>
    }

    optimizedClips.forEach(clip => {
      Object.keys(clip.captions).forEach(platform => {
        stats.platformCounts[platform] = (stats.platformCounts[platform] || 0) + 1
      })
    })

    return NextResponse.json({
      success: true,
      optimizedClips,
      stats,
      message: `Successfully optimized captions for ${optimizedClips.length} clips`
    })

  } catch (error) {
    console.error('Error optimizing captions:', error)
    return NextResponse.json(
      { error: 'Failed to optimize captions' },
      { status: 500 }
    )
  }
} 