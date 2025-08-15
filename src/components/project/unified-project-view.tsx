"use client"

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Sparkles, Image, Share2, Video, Calendar, Settings,
  ChevronRight, Play, Clock, FileText, Hash, Users,
  TrendingUp, Zap, Palette, Brain, Wand2, BarChart3
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import { FeatureCard } from '@/components/ui/feature-card'
import { UnifiedPortal } from '@/components/ui/unified-portal'
import { designSystem } from '@/lib/design-system'
import { EnhancedThumbnailGenerator } from '@/components/thumbnail/enhanced-thumbnail-generator'
import { EnhancedPostsGenerator } from '@/components/posts/enhanced-posts-generator'
import { EnhancedTranscriptEditor } from '@/components/enhanced-transcript-editor'
import { EnhancedContentStager } from '@/components/staging/enhanced-content-stager'
import { VideoChapters } from '@/components/video-chapters'

interface UnifiedProjectViewProps {
  project: any
  user: any
  onUpdate?: (updatedProject: any) => void
}

export function UnifiedProjectView({ project, user, onUpdate }: UnifiedProjectViewProps) {
  const [activeFeature, setActiveFeature] = useState<string | null>(null)
  const [projectStats, setProjectStats] = useState({
    thumbnails: 0,
    posts: 0,
    clips: 0,
    scheduled: 0,
    published: 0,
    engagement: 0
  })
  const [processingProgress, setProcessingProgress] = useState(0)

  // Calculate project completion
  const completion = {
    transcript: project.transcription ? 100 : 0,
    thumbnail: project.thumbnail_url ? 100 : 0,
    posts: project.post_suggestions?.length > 0 ? 100 : 0,
    chapters: project.chapters?.length > 0 ? 100 : 0,
    scheduled: project.scheduled_posts?.length > 0 ? 100 : 0
  }
  const overallCompletion = Object.values(completion).reduce((a, b) => a + b, 0) / 5

  // Feature configurations
  const features = [
    {
      id: 'thumbnail',
      title: 'AI Thumbnails',
      description: 'Generate eye-catching thumbnails with AI',
      icon: <Image className="h-5 w-5" />,
      gradient: 'purple' as const,
      badge: completion.thumbnail === 100 ? { text: 'Complete', variant: 'success' as const } : undefined,
      stats: [
        { label: 'Generated', value: projectStats.thumbnails, trend: 'up' as const },
        { label: 'Quality', value: '95%', trend: 'up' as const },
        { label: 'Variations', value: 4, trend: 'neutral' as const }
      ],
      isNew: true
    },
    {
      id: 'posts',
      title: 'Social Posts',
      description: 'Create platform-optimized content',
      icon: <Share2 className="h-5 w-5" />,
      gradient: 'sunset' as const,
      badge: completion.posts === 100 ? { text: 'Ready', variant: 'success' as const } : undefined,
      stats: [
        { label: 'Suggestions', value: projectStats.posts, trend: 'up' as const },
        { label: 'Platforms', value: 6, trend: 'neutral' as const },
        { label: 'Approved', value: 0, trend: 'neutral' as const }
      ],
      isPremium: true
    },
    {
      id: 'longform',
      title: 'Long-form Editor',
      description: 'Edit transcript, chapters & subtitles',
      icon: <Video className="h-5 w-5" />,
      gradient: 'ocean' as const,
      badge: completion.chapters === 100 ? { text: 'Edited', variant: 'success' as const } : undefined,
      stats: [
        { label: 'Duration', value: `${Math.floor((project.duration || 0) / 60)}m`, trend: 'neutral' as const },
        { label: 'Chapters', value: project.chapters?.length || 0, trend: 'neutral' as const },
        { label: 'Words', value: project.transcription?.text?.split(' ').length || 0, trend: 'neutral' as const }
      ]
    },
    {
      id: 'schedule',
      title: 'Smart Scheduling',
      description: 'Optimize posting times with AI',
      icon: <Calendar className="h-5 w-5" />,
      gradient: 'success' as const,
      badge: completion.scheduled === 100 ? { text: 'Scheduled', variant: 'success' as const } : undefined,
      stats: [
        { label: 'Queued', value: projectStats.scheduled, trend: 'neutral' as const },
        { label: 'Published', value: projectStats.published, trend: 'up' as const },
        { label: 'Reach', value: `${projectStats.engagement}k`, trend: 'up' as const }
      ]
    }
  ]

  return (
    <div className="space-y-6">
      {/* Project Header with Stats */}
      <motion.div
        className="relative overflow-hidden rounded-xl bg-gradient-to-br from-background via-muted/30 to-background border"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Animated background gradient */}
        <motion.div
          className="absolute inset-0 opacity-30"
          style={{
            background: 'radial-gradient(circle at 20% 50%, rgba(139, 92, 246, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(236, 72, 153, 0.1) 0%, transparent 50%)'
          }}
          animate={{
            backgroundPosition: ['0% 0%', '100% 100%', '0% 0%']
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
        />
        
        <div className="relative p-8">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">{project.title}</h1>
              <p className="text-muted-foreground max-w-2xl">
                {project.description || 'Transform your content into engaging social media posts'}
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="px-3 py-1">
                <Clock className="h-3 w-3 mr-1" />
                {new Date(project.created_at).toLocaleDateString()}
              </Badge>
              {project.status === 'processing' && (
                <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20">
                  <div className="mr-1.5 h-2 w-2 rounded-full bg-blue-600 animate-pulse" />
                  Processing
                </Badge>
              )}
            </div>
          </div>

          {/* Progress Overview */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Project Completion</span>
              <span className="text-sm text-muted-foreground">{Math.round(overallCompletion)}%</span>
            </div>
            <Progress value={overallCompletion} className="h-2" />
            
            {/* Quick Stats */}
            <div className="grid grid-cols-5 gap-4 mt-6">
              {Object.entries(completion).map(([key, value]) => (
                <motion.div
                  key={key}
                  className="text-center"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  <div className="text-2xl font-bold">
                    {value === 100 ? (
                      <span className="text-green-500">✓</span>
                    ) : (
                      <span className="text-muted-foreground">{value}%</span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground capitalize mt-1">
                    {key}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Feature Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {features.map((feature, index) => (
          <FeatureCard
            key={feature.id}
            {...feature}
            onClick={() => setActiveFeature(feature.id)}
            delay={index * 0.1}
          />
        ))}
      </div>

      {/* Quick Actions Bar */}
      <motion.div
        className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <div className="flex items-center gap-3">
          <Zap className="h-5 w-5 text-yellow-500" />
          <span className="text-sm font-medium">Quick Actions</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setActiveFeature('thumbnail')}
          >
            <Wand2 className="h-4 w-4 mr-1.5" />
            Generate All
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setActiveFeature('schedule')}
          >
            <Calendar className="h-4 w-4 mr-1.5" />
            Schedule Now
          </Button>
          <Button
            size="sm"
            onClick={() => setActiveFeature('posts')}
          >
            <Sparkles className="h-4 w-4 mr-1.5" />
            Create Content
          </Button>
        </div>
      </motion.div>

      {/* Feature Portals */}
      <AnimatePresence>
        {/* Thumbnail Generator Portal */}
        <UnifiedPortal
          isOpen={activeFeature === 'thumbnail'}
          onClose={() => setActiveFeature(null)}
          title="AI Thumbnail Generator"
          subtitle="Create stunning thumbnails with AI-powered creativity"
          icon={<Image className="h-5 w-5" />}
          badge={{ text: 'Beta', variant: 'secondary' }}
          size="xl"
          headerActions={
            <Button size="sm" variant="outline">
              <BarChart3 className="h-4 w-4 mr-1.5" />
              Analytics
            </Button>
          }
          footer={
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Credits remaining: <span className="font-medium">100</span>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline">Save Draft</Button>
                <Button>Set as Thumbnail</Button>
              </div>
            </div>
          }
        >
          <EnhancedThumbnailGenerator
            projectId={project.id}
            projectTitle={project.title}
            projectVideoUrl={project.video_url}
            contentAnalysis={project.content_analysis}
          />
        </UnifiedPortal>

        {/* Posts Generator Portal */}
        <UnifiedPortal
          isOpen={activeFeature === 'posts'}
          onClose={() => setActiveFeature(null)}
          title="Social Media Posts"
          subtitle="Generate engaging content for all platforms"
          icon={<Share2 className="h-5 w-5" />}
          badge={{ text: 'AI Powered', variant: 'success' }}
          size="xl"
          sidePanel={
            <div className="p-4 space-y-4">
              <h3 className="font-medium">Platforms</h3>
              {['Instagram', 'Twitter', 'LinkedIn', 'TikTok', 'YouTube', 'Facebook'].map((platform) => (
                <label key={platform} className="flex items-center gap-2">
                  <input type="checkbox" defaultChecked className="rounded" />
                  <span className="text-sm">{platform}</span>
                </label>
              ))}
            </div>
          }
          footer={
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>6 suggestions ready</span>
                <span>•</span>
                <span>3 platforms selected</span>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline">Save All</Button>
                <Button>Stage Selected</Button>
              </div>
            </div>
          }
        >
          <EnhancedPostsGenerator
            projectId={project.id}
            projectTitle={project.title}
            contentAnalysis={project.content_analysis}
            transcript={project.transcription?.text}
            personaId={user?.persona_id}
          />
        </UnifiedPortal>

        {/* Long-form Editor Portal */}
        <UnifiedPortal
          isOpen={activeFeature === 'longform'}
          onClose={() => setActiveFeature(null)}
          title="Long-form Editor"
          subtitle="Edit transcript, add chapters, and generate subtitles"
          icon={<Video className="h-5 w-5" />}
          size="xl"
          allowFullscreen
          footer={
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>{project.transcription?.segments?.length || 0} segments</span>
                <span>•</span>
                <span>{project.chapters?.length || 0} chapters</span>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline">Export VTT</Button>
                <Button variant="outline">Export SRT</Button>
                <Button>Save Changes</Button>
              </div>
            </div>
          }
        >
          <Tabs defaultValue="transcript" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="transcript">Transcript</TabsTrigger>
              <TabsTrigger value="chapters">Chapters</TabsTrigger>
              <TabsTrigger value="player">Preview</TabsTrigger>
            </TabsList>
            
            <TabsContent value="transcript" className="space-y-4">
              {project.transcription?.segments && (
                <EnhancedTranscriptEditor
                  segments={project.transcription.segments}
                  onSegmentsChange={(segments) => {
                    // Handle segment changes
                  }}
                  projectId={project.id}
                  videoUrl={project.video_url}
                  videoDuration={project.duration}
                />
              )}
            </TabsContent>
            
            <TabsContent value="chapters" className="space-y-4">
              <VideoChapters
                projectId={project.id}
                videoDuration={project.duration || 0}
                hasTranscript={!!project.transcription}
              />
            </TabsContent>
            
            <TabsContent value="player" className="space-y-4">
              {project.video_url && (
                <div className="aspect-video rounded-lg overflow-hidden bg-black">
                  <video
                    src={project.video_url}
                    controls
                    className="w-full h-full"
                  />
                </div>
              )}
            </TabsContent>
          </Tabs>
        </UnifiedPortal>

        {/* Smart Scheduling Portal */}
        <UnifiedPortal
          isOpen={activeFeature === 'schedule'}
          onClose={() => setActiveFeature(null)}
          title="Smart Scheduling"
          subtitle="AI-optimized posting times for maximum engagement"
          icon={<Calendar className="h-5 w-5" />}
          badge={{ text: 'Smart AI', variant: 'success' }}
          size="xl"
          footer={
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Optimal time detected: <span className="font-medium">2:00 PM EST</span>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline">Preview Calendar</Button>
                <Button>Confirm Schedule</Button>
              </div>
            </div>
          }
        >
          <EnhancedContentStager
            projectId={project.id}
            projectTitle={project.title}
            availableContent={{
              clips: project.clips || [],
              thumbnails: [project.thumbnail_url].filter(Boolean),
              posts: project.post_suggestions || []
            }}
          />
        </UnifiedPortal>
      </AnimatePresence>
    </div>
  )
}