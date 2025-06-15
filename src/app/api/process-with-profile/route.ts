import { NextRequest, NextResponse } from 'next/server'
import { createClient } from "@supabase/supabase-js"
import { AIProfileService } from "@/lib/ai-profile-service"
import { UserProfile } from "@/hooks/use-user-profile"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface ProcessingRequest {
  videoId: string
  processingType: 'transcription' | 'clips' | 'ideas' | 'blog' | 'social'
  clerkUserId: string
  transcription?: string
}

interface ProfileData {
  id: string
  brand_voice: string
  company_name: string
  video_style: string
  transition_style: string
  primary_platforms: string[]
  preferred_clip_length?: number
  target_audience: {
    description: string
    interests: string[]
  }
  content_goals: string[]
  industry: string
  content_types: string[]
  brand_colors: {
    primary: string
    accent: string
  }
  posting_schedule: {
    frequency: string
    preferred_times: string[]
  }
}

interface Clip {
  id: string
  title: string
  startTime: number
  endTime: number
  thumbnail: string
  highlights: string[]
  style?: string
  transition?: string
  platforms?: string[]
  suggestedCaption?: string
}

interface Blog {
  title: string
  content: string
  tags: string[]
  estimatedReadTime: string
  seoKeywords?: string[]
  tone?: string
  targetAudience?: string
}

interface SocialPosts {
  [platform: string]: {
    text?: string
    caption?: string
    title?: string
    description?: string
    hashtags?: string[]
    thread?: boolean
    includeLink?: boolean
    visualStyle?: {
      primaryColor: string
      accentColor: string
    }
    trending?: boolean
    tags?: string[]
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: ProcessingRequest = await request.json()
    const { videoId, processingType, clerkUserId, transcription } = body

    if (!videoId || !processingType || !clerkUserId) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    // Fetch user profile
    const { data: profile, error: profileError } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("clerk_user_id", clerkUserId)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      )
    }

    // Initialize AI service with user profile
    const aiService = new AIProfileService(profile as UserProfile)

    let result

    switch (processingType) {
      case 'clips':
        result = await processClipsWithProfile(videoId, transcription || "", aiService, profile as ProfileData)
        break
      case 'blog':
        result = await processBlogWithProfile(videoId, transcription || "", aiService, profile as ProfileData)
        break
      case 'social':
        result = await processSocialWithProfile(videoId, transcription || "", aiService, profile as ProfileData)
        break
      default:
        return NextResponse.json(
          { error: 'Invalid processing type for profile-based processing' },
          { status: 400 }
        )
    }

    // Track the content generation
    await supabase
      .from("user_content_history")
      .insert({
        user_profile_id: profile.id,
        content_type: processingType,
        content_data: result,
        performance_metrics: {},
        user_feedback: { action: "generated" }
      })

    return NextResponse.json({
      success: true,
      videoId,
      processingType,
      result,
      processedAt: new Date().toISOString(),
      userProfileApplied: true
    })

  } catch (error) {
    console.error('Processing error:', error)
    return NextResponse.json(
      { error: 'Processing failed' },
      { status: 500 }
    )
  }
}

async function processClipsWithProfile(
  videoId: string,
  transcription: string,
  aiService: AIProfileService,
  profile: ProfileData
): Promise<{
  clips: Clip[]
  aiSuggestions: unknown
  similarSuccessful: unknown
  appliedPreferences: unknown
}> {
  // Get AI suggestions based on user profile
  const suggestions = await aiService.generateContentSuggestions(transcription, "clip")
  
  // Get similar successful content
  const similarContent = await aiService.getSimilarSuccessfulContent("clip", transcription)

  // Generate clips with user preferences
  const clipDuration = profile.preferred_clip_length || 60
  const platforms = profile.primary_platforms || ["youtube"]
  
  // Mock clip generation with profile preferences
  const clips = [
    {
      id: "clip1",
      title: "Introduction - " + profile.brand_voice + " style",
      startTime: 0,
      endTime: Math.min(30, clipDuration),
      thumbnail: "/api/placeholder/320/180",
      highlights: ["Welcome", "Overview"],
      style: profile.video_style,
      transition: profile.transition_style,
      platforms: platforms,
      suggestedCaption: generateCaption(profile.brand_voice, "introduction")
    },
    {
      id: "clip2",
      title: "Key Concept - Optimized for " + platforms.join(", "),
      startTime: 45,
      endTime: Math.min(45 + clipDuration, 120),
      thumbnail: "/api/placeholder/320/180",
      highlights: ["Important point", "Example"],
      style: profile.video_style,
      transition: profile.transition_style,
      platforms: platforms,
      suggestedCaption: generateCaption(profile.brand_voice, "key concept")
    }
  ]

  // Apply brand styling
  const styledClips = clips.map(clip => aiService.applyBrandStyling(clip)) as Clip[]

  return {
    clips: styledClips,
    aiSuggestions: suggestions,
    similarSuccessful: similarContent,
    appliedPreferences: {
      clipDuration,
      platforms,
      videoStyle: profile.video_style,
      brandVoice: profile.brand_voice
    }
  }
}

async function processBlogWithProfile(
  videoId: string,
  transcription: string,
  aiService: AIProfileService,
  profile: ProfileData
): Promise<{
  blog: Blog
  aiSuggestions: unknown
  appliedPreferences: unknown
}> {
  // Get AI suggestions for blog content
  const suggestions = await aiService.generateContentSuggestions(transcription, "blog")
  
  // Generate blog with brand voice
  const blog = {
    title: generateTitle(profile.brand_voice, profile.company_name),
    content: generateBlogContent(
      transcription,
      profile.brand_voice,
      profile.target_audience,
      profile.content_goals
    ),
    tags: extractTags(profile.industry, profile.content_types),
    estimatedReadTime: "5 min",
    seoKeywords: generateSEOKeywords(profile.target_audience.interests),
    tone: profile.brand_voice,
    targetAudience: profile.target_audience.description
  }

  // Apply brand styling
  const styledBlog = aiService.applyBrandStyling(blog)

  return {
    blog: styledBlog,
    aiSuggestions: suggestions,
    appliedPreferences: {
      brandVoice: profile.brand_voice,
      targetAudience: profile.target_audience,
      contentGoals: profile.content_goals
    }
  }
}

async function processSocialWithProfile(
  videoId: string,
  transcription: string,
  aiService: AIProfileService,
  profile: ProfileData
): Promise<{
  posts: SocialPosts
  aiSuggestions: unknown
  scheduleSuggestions: unknown
  appliedPreferences: unknown
}> {
  // Get AI suggestions for social posts
  const suggestions = await aiService.generateContentSuggestions(transcription, "social")
  
  const posts: SocialPosts = {}
  
  // Generate platform-specific posts
  for (const platform of profile.primary_platforms) {
    posts[platform] = generatePlatformPost(
      platform,
      transcription,
      profile.brand_voice,
      profile.content_goals,
      profile.brand_colors
    )
  }

  // Apply brand styling
  const styledPosts = aiService.applyBrandStyling({ posts }) as { posts: SocialPosts }

  return {
    ...styledPosts,
    aiSuggestions: suggestions,
    scheduleSuggestions: generateScheduleSuggestions(profile.posting_schedule),
    appliedPreferences: {
      platforms: profile.primary_platforms,
      brandVoice: profile.brand_voice,
      postingSchedule: profile.posting_schedule
    }
  }
}

// Helper functions
function generateCaption(brandVoice: string, contentType: string): string {
  const captions: Record<string, Record<string, string>> = {
    professional: {
      introduction: "Discover key insights in our latest video presentation.",
      "key concept": "Essential concepts explained with clarity and precision."
    },
    casual: {
      introduction: "Hey! Check out what we've been working on 👋",
      "key concept": "Here's the good stuff you've been waiting for!"
    },
    friendly: {
      introduction: "Welcome! We're excited to share this with you 😊",
      "key concept": "Let's dive into something really interesting!"
    },
    playful: {
      introduction: "Ready for something awesome? Let's go! 🚀",
      "key concept": "Mind = Blown 🤯 Check this out!"
    },
    inspirational: {
      introduction: "Your journey to excellence starts here ✨",
      "key concept": "Transform your perspective with these powerful insights"
    }
  }

  return captions[brandVoice]?.[contentType] || "Check out our latest content!"
}

function generateTitle(brandVoice: string, companyName: string): string {
  const templates: Record<string, string> = {
    professional: `${companyName} Insights: Key Takeaways from Our Latest Analysis`,
    casual: `What We Learned This Week at ${companyName}`,
    friendly: `${companyName} Shares: Important Updates You'll Love`,
    playful: `${companyName}'s Latest Adventure: You Won't Believe What Happened!`,
    inspirational: `Empowering Change: ${companyName}'s Vision for Success`
  }

  return templates[brandVoice] || `${companyName} Blog Post`
}

function generateBlogContent(
  transcription: string,
  brandVoice: string,
  targetAudience: ProfileData['target_audience'],
  contentGoals: string[]
): string {
  // This would be enhanced with actual AI generation
  return `# Introduction

This content is tailored for ${targetAudience.description} with a ${brandVoice} tone.

## Key Points

Based on our goals to ${contentGoals.join(", ")}, here are the main takeaways:

1. First important point from the video
2. Second important point
3. Third insight

## Deep Dive

[Content extracted and styled from transcription]

## Conclusion

Thank you for reading! Stay tuned for more content designed specifically for our audience.`
}

function extractTags(industry: string, contentTypes: string[]): string[] {
  const tags = [industry.toLowerCase().replace(/\s+/g, "-")]
  tags.push(...contentTypes)
  return tags
}

function generateSEOKeywords(interests: string[]): string[] {
  return interests.map(interest => interest.toLowerCase())
}

function generatePlatformPost(
  platform: string,
  transcription: string,
  brandVoice: string,
  contentGoals: string[],
  brandColors: ProfileData['brand_colors']
): SocialPosts[string] {
  const posts: SocialPosts = {
    twitter: {
      text: `🎯 ${generateShortMessage(brandVoice, 280)}`,
      hashtags: generateHashtags(contentGoals, 3),
      thread: false
    },
    linkedin: {
      text: generateProfessionalPost(brandVoice, contentGoals),
      hashtags: generateHashtags(contentGoals, 5),
      includeLink: true
    },
    instagram: {
      caption: generateInstagramCaption(brandVoice),
      hashtags: generateHashtags(contentGoals, 10),
      visualStyle: {
        primaryColor: brandColors.primary,
        accentColor: brandColors.accent
      }
    },
    tiktok: {
      caption: generateTikTokCaption(brandVoice),
      hashtags: generateHashtags(contentGoals, 5),
      trending: true
    },
    youtube: {
      title: generateYouTubeTitle(brandVoice),
      description: generateYouTubeDescription(brandVoice, contentGoals),
      tags: generateHashtags(contentGoals, 10)
    }
  }

  return posts[platform] || posts.twitter
}

function generateShortMessage(brandVoice: string, maxLength: number): string {
  const messages: Record<string, string> = {
    professional: "New insights on industry best practices now available.",
    casual: "Just dropped some knowledge! Check it out 👀",
    friendly: "We've got something special to share with you today!",
    playful: "Plot twist: This content is actually awesome 🎉",
    inspirational: "Every great journey begins with a single step. Take yours today."
  }

  return messages[brandVoice] || "Check out our latest content!"
}

function generateHashtags(contentGoals: string[], count: number): string[] {
  const hashtagMap: Record<string, string[]> = {
    increase_engagement: ["#CommunityFirst", "#EngageWithUs", "#JoinTheConversation"],
    build_brand: ["#BrandAwareness", "#OurStory", "#BrandBuilding"],
    educate: ["#LearnWithUs", "#EducationalContent", "#KnowledgeSharing"],
    drive_sales: ["#NewProduct", "#LimitedOffer", "#ShopNow"],
    thought_leadership: ["#ThoughtLeadership", "#IndustryInsights", "#Innovation"],
    community: ["#CommunityLove", "#TogetherStrong", "#OurTribe"]
  }

  const hashtags: string[] = []
  contentGoals.forEach(goal => {
    if (hashtagMap[goal]) {
      hashtags.push(...hashtagMap[goal])
    }
  })

  return hashtags.slice(0, count)
}

function generateProfessionalPost(brandVoice: string, contentGoals: string[]): string {
  return `In today's rapidly evolving landscape, we're excited to share insights that align with our mission to ${contentGoals.join(" and ")}.

Key takeaways from our latest content:
• Strategic insights for growth
• Practical applications
• Future-forward thinking

What are your thoughts on these developments?`
}

function generateInstagramCaption(brandVoice: string): string {
  const captions: Record<string, string> = {
    professional: "Transforming insights into action. Swipe to learn more →",
    casual: "Real talk: This is the content you've been waiting for 💯",
    friendly: "Hey friends! We've got something exciting to share 💫",
    playful: "Warning: Mind-blowing content ahead! 🚨✨",
    inspirational: "Your potential is limitless. Let's unlock it together 🔓"
  }

  return captions[brandVoice] || "Check out our latest post!"
}

function generateTikTokCaption(brandVoice: string): string {
  const captions: Record<string, string> = {
    professional: "Professional tips in 60 seconds ⏰",
    casual: "POV: You just found the best content 👀",
    friendly: "Come hang out while we share something cool!",
    playful: "Wait for it... 🤯 #MindBlown",
    inspirational: "This is your sign to level up ⬆️"
  }

  return captions[brandVoice] || "Don't miss this!"
}

function generateYouTubeTitle(brandVoice: string): string {
  const titles: Record<string, string> = {
    professional: "Expert Analysis: Key Industry Insights Revealed",
    casual: "You Won't Believe What We Discovered (Seriously!)",
    friendly: "Let's Talk About This Important Topic Together",
    playful: "This Changed Everything! (Not Clickbait)",
    inspirational: "Transform Your Life With These Powerful Strategies"
  }

  return titles[brandVoice] || "Must-Watch Video"
}

function generateYouTubeDescription(brandVoice: string, contentGoals: string[]): string {
  return `In this video, we explore topics aligned with our goals to ${contentGoals.join(", ")}.

🎯 What you'll learn:
• Key insights and takeaways
• Practical applications
• Expert perspectives

📌 Timestamps:
00:00 Introduction
[Auto-generated based on content]

🔔 Subscribe for more content tailored to your success!

#YourSuccess #ContentCreation #Innovation`
}

function generateScheduleSuggestions(schedule: ProfileData['posting_schedule']): {
  bestTimes: string[]
  frequency: string
  platformSpecific: Record<string, string>
} {
  const { frequency, preferred_times } = schedule
  
  const suggestions = {
    bestTimes: preferred_times || ["Morning (9-11 AM)", "Evening (5-7 PM)"],
    frequency: frequency || "weekly",
    platformSpecific: {
      twitter: "2-3 times daily",
      linkedin: "2-3 times weekly",
      instagram: "Daily",
      tiktok: "1-2 times daily",
      youtube: "Weekly"
    }
  }

  return suggestions
} 
