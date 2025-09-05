import { NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import { addDays, addHours, setHours, setMinutes, subDays } from 'date-fns'

export async function POST() {
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createSupabaseBrowserClient()
    
    // Get current date for September 2024
    const now = new Date()
    const september2024 = new Date(2024, 8, 1) // September 1, 2024
    
    // Create diverse demo posts for September
    const demoPosts = []
    
    // Video clips throughout the month
    for (let i = 2; i <= 28; i += 3) {
      const scheduleDate = new Date(2024, 8, i) // September dates
      const hour = [9, 12, 15, 18, 20][Math.floor(Math.random() * 5)]
      
      demoPosts.push({
        user_id: user.id,
        project_id: null,
        content: [
          "🎬 New video alert! Check out this amazing behind-the-scenes footage from our latest shoot. The team outdid themselves! #BTS #ContentCreation",
          "🚀 Just dropped: Our most requested tutorial is finally here! Learn how to master video editing in under 10 minutes. #Tutorial #VideoEditing",
          "✨ Transform your content game with these 5 pro tips! Swipe to see the full breakdown. Which one will you try first?",
          "🔥 This technique changed everything for me! Here's how I increased engagement by 300% with one simple trick.",
          "💡 Monday motivation: Remember why you started. Every expert was once a beginner. Keep pushing! #MondayMotivation"
        ][i % 5],
        media_urls: [`https://images.unsplash.com/photo-${1600000000000 + i * 100000000}?w=800&h=450`],
        publish_date: setMinutes(setHours(scheduleDate, hour), Math.random() * 59),
        state: 'scheduled',
        hashtags: ['contentcreator', 'videotips', 'socialmedia', 'marketing'],
        metadata: {
          type: 'clip',
          platforms: i % 3 === 0 ? ['instagram', 'tiktok'] : i % 3 === 1 ? ['youtube', 'instagram'] : ['tiktok'],
          thumbnail: `https://images.unsplash.com/photo-${1600000000000 + i * 100000000}?w=800&h=450`,
          duration: 30 + Math.floor(Math.random() * 30),
          title: `Viral Clip #${i}`,
          engagementPrediction: {
            score: 70 + Math.floor(Math.random() * 30),
            factors: ['trending audio', 'optimal timing', 'high-quality visuals'],
            reasoning: 'Posted during peak engagement hours with trending hashtags'
          },
          optimizationReason: 'AI detected high engagement potential based on current trends'
        },
        settings: {},
        created_at: now.toISOString(),
        updated_at: now.toISOString()
      })
    }
    
    // Blog posts - weekly
    for (let week = 1; week <= 4; week++) {
      const blogDate = new Date(2024, 8, week * 7 - 2) // Thursdays
      
      demoPosts.push({
        user_id: user.id,
        project_id: null,
        content: [
          "📝 New blog post: '10 Ways to Boost Your Productivity in 2024' - Learn evidence-based strategies that actually work! Read more on our website.",
          "🎯 Just published: 'The Complete Guide to Content Strategy' - Everything you need to know to build a winning content plan.",
          "💼 Blog alert: 'How We Grew Our Audience by 500% in 6 Months' - Sharing our exact playbook and strategies.",
          "🌟 Fresh content: 'The Future of Digital Marketing: AI and Beyond' - Exploring what's next in the industry."
        ][week - 1],
        media_urls: [`https://images.unsplash.com/photo-${1500000000000 + week * 100000000}?w=1200&h=630`],
        publish_date: setHours(blogDate, 10),
        state: 'scheduled',
        hashtags: ['blogging', 'contentmarketing', 'digitalmarketing', 'growth'],
        metadata: {
          type: 'blog',
          platforms: ['linkedin', 'x', 'facebook'],
          thumbnail: `https://images.unsplash.com/photo-${1500000000000 + week * 100000000}?w=1200&h=630`,
          wordCount: 1200 + week * 300,
          title: `In-Depth Article Week ${week}`,
          engagementPrediction: {
            score: 80 + week * 2,
            factors: ['SEO optimized', 'comprehensive content', 'expert insights']
          }
        },
        settings: {},
        created_at: now.toISOString(),
        updated_at: now.toISOString()
      })
    }
    
    // Long form videos - twice a month
    for (let i = 0; i < 2; i++) {
      const longformDate = new Date(2024, 8, i === 0 ? 10 : 24)
      
      demoPosts.push({
        user_id: user.id,
        project_id: null,
        content: i === 0 
          ? "🎥 NEW VIDEO: 'The Complete Masterclass' - 45 minutes of pure value! We cover everything from basics to advanced techniques. Perfect for your weekend watch!"
          : "📺 Documentary Release: 'Behind the Success' - An intimate look at what it really takes to build something meaningful. Now streaming!",
        media_urls: [`https://images.unsplash.com/photo-${1700000000000 + i * 200000000}?w=1920&h=1080`],
        publish_date: setHours(longformDate, 14),
        state: 'scheduled',
        hashtags: ['youtube', 'documentary', 'educational', 'longform'],
        metadata: {
          type: 'longform',
          platforms: ['youtube', 'facebook'],
          thumbnail: `https://images.unsplash.com/photo-${1700000000000 + i * 200000000}?w=1920&h=1080`,
          duration: i === 0 ? 2700 : 3600, // 45 min and 60 min
          title: i === 0 ? 'Complete Masterclass' : 'Documentary Special',
          engagementPrediction: {
            score: 90 + i * 5,
            factors: ['high production value', 'comprehensive content', 'perfect length'],
            reasoning: 'Long-form content performs exceptionally well with engaged audiences'
          }
        },
        settings: {},
        created_at: now.toISOString(),
        updated_at: now.toISOString()
      })
    }
    
    // Social posts scattered throughout
    const socialDays = [3, 5, 8, 11, 14, 17, 19, 22, 25, 27]
    socialDays.forEach((day, index) => {
      const socialDate = new Date(2024, 8, day)
      const platforms = index % 3 === 0 ? ['x'] : index % 3 === 1 ? ['threads'] : ['instagram', 'threads']
      
      demoPosts.push({
        user_id: user.id,
        project_id: null,
        content: [
          "💭 Quick thought: Success isn't about perfection, it's about progress. What small win are you celebrating today?",
          "🌈 Good vibes only! Spreading positivity and creative energy your way. What's inspiring you today?",
          "⚡ Hot take: The best content is authentic content. Stop trying to be perfect and start being real.",
          "🎨 Creating magic today! Sometimes the best ideas come when you least expect them.",
          "🔮 Prediction: This is going to be your breakthrough month. I can feel it! Who's ready?",
          "☕ Coffee chat: What's one thing you wish you knew when you started your journey?",
          "🌟 Reminder: You're doing better than you think. Keep going!",
          "🚀 Big announcement coming soon... Can you guess what it is? 👀",
          "💪 Challenge accepted! Trying something new every day this week. Join me?",
          "🎯 Focus tip: One thing at a time. Multitasking is a myth. What's your ONE thing today?"
        ][index],
        media_urls: index % 2 === 0 ? [`https://images.unsplash.com/photo-${1400000000000 + day * 100000000}?w=1080&h=1080`] : [],
        publish_date: setMinutes(setHours(socialDate, [11, 15, 19][index % 3]), Math.random() * 59),
        state: 'scheduled',
        hashtags: ['motivation', 'creativity', 'community'],
        metadata: {
          type: 'social',
          platforms: platforms,
          thumbnail: index % 2 === 0 ? `https://images.unsplash.com/photo-${1400000000000 + day * 100000000}?w=1080&h=1080` : null,
          engagementPrediction: {
            score: 75 + Math.floor(Math.random() * 20),
            factors: ['authentic voice', 'community engagement', 'conversation starter']
          }
        },
        settings: {},
        created_at: now.toISOString(),
        updated_at: now.toISOString()
      })
    })
    
    // Insert all demo posts
    const { data, error } = await supabase
      .from('social_posts')
      .insert(demoPosts)
      .select()

    if (error) {
      console.error('Error inserting demo posts:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: `Created ${demoPosts.length} demo posts for September 2024`,
      count: demoPosts.length
    })
  } catch (error) {
    console.error('Error in populate-demo-calendar:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}