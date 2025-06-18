"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { toast } from "sonner"
import { 
  IconSparkles, 
  IconFileText, 
  IconScissors, 
  IconArticle, 
  IconArrowRight,
  IconArrowLeft,
  IconPlayerPlay,
  IconClock,
  IconTrendingUp,
  IconChevronLeft,
  IconChevronRight,
  IconEye,
  IconShare3
} from "@tabler/icons-react"
import { ProjectService } from "@/lib/services"
import { Project, ClipData } from "@/lib/project-types"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { AnimatedBackground } from "@/components/animated-background"
import { formatDuration } from "@/lib/video-utils"
import { cn } from "@/lib/utils"
import confetti from 'canvas-confetti'

interface RecapSlide {
  id: string
  type: 'intro' | 'transcript' | 'clips' | 'blog' | 'social' | 'summary'
  title: string
  subtitle?: string
  content?: unknown
}

export default function ProjectRecapPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string
  
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentSlide, setCurrentSlide] = useState(0)
  const [slides, setSlides] = useState<RecapSlide[]>([])
  const [autoPlay, setAutoPlay] = useState(true)

  useEffect(() => {
    loadProject()
    // Trigger celebration
    setTimeout(() => {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      })
    }, 500)
  }, [])

  const loadProject = async () => {
    try {
      const proj = await ProjectService.getProject(projectId)
      if (!proj) {
        toast.error("Project not found")
        router.push("/projects")
        return
      }
      setProject(proj)
      generateSlides(proj)
    } catch (error) {
      console.error("Failed to load project:", error)
      toast.error("Failed to load project")
    } finally {
      setLoading(false)
    }
  }

  const generateSlides = (proj: Project) => {
    const stats = ProjectService.getProjectStats(proj)
    const newSlides: RecapSlide[] = []

    // Intro slide
    newSlides.push({
      id: 'intro',
      type: 'intro',
      title: '🎉 Your content is ready!',
      subtitle: `${proj.title} has been processed successfully`
    })

    // Transcript slide
    if (proj.transcription) {
      newSlides.push({
        id: 'transcript',
        type: 'transcript',
        title: '📝 Transcript Generated!',
        subtitle: `${proj.transcription.segments.length} segments • ${formatDuration(proj.transcription.duration)}`,
        content: {
          wordCount: proj.transcription.text.split(' ').length,
          language: proj.transcription.language,
          confidence: Math.round(proj.transcription.segments.reduce((acc, seg) => acc + seg.confidence, 0) / proj.transcription.segments.length * 100)
        }
      })
    }

    // Clips slide
    if (stats.totalClips > 0) {
      newSlides.push({
        id: 'clips',
        type: 'clips',
        title: `✂️ ${stats.totalClips} Viral Clips Created!`,
        subtitle: 'AI-optimized for maximum engagement',
        content: proj.folders.clips
      })
    }

    // Blog slide
    if (stats.totalBlogs > 0) {
      newSlides.push({
        id: 'blog',
        type: 'blog',
        title: '📰 Blog Post Generated!',
        subtitle: 'SEO-optimized and ready to publish',
        content: proj.folders.blog[0]
      })
    }

    // Social slide (future)
    if (stats.totalSocialPosts > 0) {
      newSlides.push({
        id: 'social',
        type: 'social',
        title: '📱 Social Media Content Ready!',
        subtitle: 'Tailored for each platform',
        content: proj.folders.social
      })
    }

    // Summary slide
    newSlides.push({
      id: 'summary',
      type: 'summary',
      title: '📊 Content Summary',
      subtitle: 'Everything we created for you',
      content: stats
    })

    setSlides(newSlides)
  }

  useEffect(() => {
    if (autoPlay && slides.length > 0) {
      const timer = setTimeout(() => {
        if (currentSlide < slides.length - 1) {
          setCurrentSlide(prev => prev + 1)
        } else {
          setAutoPlay(false)
        }
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [currentSlide, autoPlay, slides.length])

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(prev => prev + 1)
      setAutoPlay(false)
    }
  }

  const handlePrev = () => {
    if (currentSlide > 0) {
      setCurrentSlide(prev => prev - 1)
      setAutoPlay(false)
    }
  }

  const handleSkipToReview = () => {
    router.push(`/projects/${projectId}`)
  }

  const handlePublish = () => {
    router.push(`/projects/${projectId}/publish`)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!project || slides.length === 0) return null

  const slide = slides[currentSlide]
  const progress = ((currentSlide + 1) / slides.length) * 100

  return (
    <div className="relative min-h-screen">
      <AnimatedBackground variant="vibrant" />
      
      <div className="relative mx-auto max-w-5xl px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/projects')}
          >
            <IconArrowLeft className="h-4 w-4 mr-2" />
            Back to Projects
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSkipToReview}
          >
            Skip to Review
            <IconArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
            <span>Step {currentSlide + 1} of {slides.length}</span>
            <span>{Math.round(progress)}% Complete</span>
          </div>
        </div>

        {/* Slides Container */}
        <AnimatePresence mode="wait">
          <motion.div
            key={slide.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {/* Intro Slide */}
            {slide.type === 'intro' && (
              <Card className="overflow-hidden">
                <div className="h-2 gradient-premium" />
                <CardContent className="p-12 text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", duration: 0.5 }}
                    className="mx-auto mb-6 w-24 h-24 rounded-full gradient-premium flex items-center justify-center"
                  >
                    <IconSparkles className="h-12 w-12 text-white" />
                  </motion.div>
                  <h1 className="text-4xl font-bold mb-4">{slide.title}</h1>
                  <p className="text-xl text-muted-foreground mb-8">{slide.subtitle}</p>
                  <div className="flex justify-center gap-4">
                    <Button size="lg" onClick={handleNext} className="gradient-premium">
                      See What We Made
                      <IconArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Transcript Slide */}
            {slide.type === 'transcript' && slide.content && (
              <Card className="overflow-hidden">
                <div className="h-2 bg-gradient-to-r from-violet-500 to-purple-500" />
                <CardContent className="p-12">
                  <div className="text-center mb-8">
                    <div className="mx-auto mb-4 w-20 h-20 rounded-full bg-gradient-to-r from-violet-500 to-purple-500 flex items-center justify-center">
                      <IconFileText className="h-10 w-10 text-white" />
                    </div>
                    <h2 className="text-3xl font-bold mb-2">{slide.title}</h2>
                    <p className="text-lg text-muted-foreground">{slide.subtitle}</p>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-6 max-w-2xl mx-auto">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-primary mb-1">
                        {slide.content.wordCount.toLocaleString()}
                      </div>
                      <div className="text-sm text-muted-foreground">Words</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-primary mb-1">
                        {slide.content.language.toUpperCase()}
                      </div>
                      <div className="text-sm text-muted-foreground">Language</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-primary mb-1">
                        {slide.content.confidence}%
                      </div>
                      <div className="text-sm text-muted-foreground">Accuracy</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Clips Slide */}
            {slide.type === 'clips' && slide.content && (
              <Card className="overflow-hidden">
                <div className="h-2 bg-gradient-to-r from-pink-500 to-rose-500" />
                <CardContent className="p-12">
                  <div className="text-center mb-8">
                    <div className="mx-auto mb-4 w-20 h-20 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 flex items-center justify-center">
                      <IconScissors className="h-10 w-10 text-white" />
                    </div>
                    <h2 className="text-3xl font-bold mb-2">{slide.title}</h2>
                    <p className="text-lg text-muted-foreground">{slide.subtitle}</p>
                  </div>
                  
                  {/* Top 3 Clips Preview */}
                  <div className="grid grid-cols-3 gap-4 max-w-3xl mx-auto">
                    {slide.content.slice(0, 3).map((clip: ClipData, index: number) => (
                      <motion.div
                        key={clip.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="relative group"
                      >
                        <div className="aspect-[9/16] bg-black rounded-lg overflow-hidden">
                          {clip.exportUrl ? (
                            <video
                              src={clip.exportUrl}
                              className="w-full h-full object-cover"
                              poster={clip.thumbnail}
                              muted
                              loop
                              playsInline
                              onMouseEnter={(e) => e.currentTarget.play().catch(() => {})}
                              onMouseLeave={(e) => {
                                e.currentTarget.pause()
                                e.currentTarget.currentTime = 0
                              }}
                            />
                          ) : (
                            <div className="flex items-center justify-center h-full bg-gradient-to-b from-gray-900 to-gray-800">
                              <IconPlayerPlay className="h-10 w-10 text-gray-600" />
                            </div>
                          )}
                          
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                          
                          <div className="absolute top-2 left-2">
                            <Badge className={cn(
                              "font-bold",
                              index === 0 ? "bg-yellow-500 text-black" : 
                              index === 1 ? "bg-gray-300 text-black" : 
                              "bg-orange-500 text-white"
                            )}>
                              #{index + 1}
                            </Badge>
                          </div>
                          
                          <div className="absolute bottom-2 left-2 right-2">
                            <p className="text-white text-sm font-medium line-clamp-2">
                              {clip.title}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-white/80 text-xs">
                                {formatDuration(clip.duration)}
                              </span>
                              <span className="text-white/80 text-xs flex items-center gap-1">
                                <IconSparkles className="h-3 w-3" />
                                {Math.round((clip.score || 0) * 100)}% viral
                              </span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                  
                  {slide.content.length > 3 && (
                    <p className="text-center mt-6 text-muted-foreground">
                      +{slide.content.length - 3} more clips generated
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Blog Slide */}
            {slide.type === 'blog' && slide.content && (
              <Card className="overflow-hidden">
                <div className="h-2 bg-gradient-to-r from-emerald-500 to-teal-500" />
                <CardContent className="p-12">
                  <div className="text-center mb-8">
                    <div className="mx-auto mb-4 w-20 h-20 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 flex items-center justify-center">
                      <IconArticle className="h-10 w-10 text-white" />
                    </div>
                    <h2 className="text-3xl font-bold mb-2">{slide.title}</h2>
                    <p className="text-lg text-muted-foreground">{slide.subtitle}</p>
                  </div>
                  
                  <div className="max-w-2xl mx-auto">
                    <Card>
                      <CardHeader>
                        <CardTitle>{slide.content.title}</CardTitle>
                        <CardDescription>{slide.content.excerpt}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                          <span className="flex items-center gap-1">
                            <IconClock className="h-4 w-4" />
                            {slide.content.readingTime} min read
                          </span>
                          <span>•</span>
                          <span>{slide.content.content.split(' ').length} words</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {slide.content.tags.map((tag: string) => (
                            <Badge key={tag} variant="secondary">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Summary Slide */}
            {slide.type === 'summary' && slide.content && (
              <Card className="overflow-hidden">
                <div className="h-2 gradient-premium" />
                <CardContent className="p-12">
                  <div className="text-center mb-8">
                    <div className="mx-auto mb-4 w-20 h-20 rounded-full gradient-premium flex items-center justify-center">
                      <IconTrendingUp className="h-10 w-10 text-white" />
                    </div>
                    <h2 className="text-3xl font-bold mb-2">{slide.title}</h2>
                    <p className="text-lg text-muted-foreground">{slide.subtitle}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto mb-8">
                    <div className="text-center">
                      <div className="text-3xl font-bold gradient-text mb-1">
                        {slide.content.totalClips}
                      </div>
                      <div className="text-sm text-muted-foreground">Video Clips</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold gradient-text mb-1">
                        {slide.content.totalBlogs}
                      </div>
                      <div className="text-sm text-muted-foreground">Blog Posts</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold gradient-text mb-1">
                        {slide.content.totalSocialPosts}
                      </div>
                      <div className="text-sm text-muted-foreground">Social Posts</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold gradient-text mb-1">
                        {slide.content.completedTasks}
                      </div>
                      <div className="text-sm text-muted-foreground">Tasks Done</div>
                    </div>
                  </div>
                  
                  <div className="flex justify-center gap-4">
                    <Button
                      size="lg"
                      variant="outline"
                      onClick={() => router.push(`/projects/${projectId}`)}
                    >
                      <IconEye className="h-4 w-4 mr-2" />
                      Review Project
                    </Button>
                    <Button
                      size="lg"
                      className="gradient-premium"
                      onClick={handlePublish}
                    >
                      <IconShare3 className="h-4 w-4 mr-2" />
                      Publish Content
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrev}
            disabled={currentSlide === 0}
          >
            <IconChevronLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>
          
          <div className="flex gap-2">
            {slides.map((_, index) => (
              <button
                key={index}
                className={cn(
                  "w-2 h-2 rounded-full transition-all",
                  index === currentSlide 
                    ? "w-8 bg-primary" 
                    : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                )}
                onClick={() => {
                  setCurrentSlide(index)
                  setAutoPlay(false)
                }}
              />
            ))}
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleNext}
            disabled={currentSlide === slides.length - 1}
          >
            Next
            <IconChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  )
}