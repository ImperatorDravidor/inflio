"use client"

import { useState, useEffect, Suspense } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  IconArrowLeft,
  IconSparkles,
  IconCalendar,
  IconRocket,
  IconShare,
  IconBolt,
  IconWand
} from "@tabler/icons-react"
import { useAuth } from "@clerk/nextjs"
import { useRouter, useSearchParams } from "next/navigation"
import { AnimatedBackground } from "@/components/animated-background"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { toast } from "sonner"
import { SocialMediaComposer } from "@/components/social/social-media-composer"
import { ROUTES } from "@/lib/constants"
import { SocialQuickActions } from "@/components/social/social-quick-actions"

function ComposeSocialPostContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { userId } = useAuth()
  const [loading, setLoading] = useState(true)
  
  const projectId = searchParams.get('projectId')
  const dateParam = searchParams.get('date')
  const contentParam = searchParams.get('content')
  const mediaParam = searchParams.get('media')

  const initialContent = contentParam ? decodeURIComponent(contentParam) : ''
  const initialMedia = mediaParam ? decodeURIComponent(mediaParam) : undefined

  useEffect(() => {
    // Simulate loading time for any initial data
    const timer = setTimeout(() => {
      setLoading(false)
    }, 500)

    return () => clearTimeout(timer)
  }, [])

  const handleSuccess = (posts: any[]) => {
    toast.success(`Successfully scheduled ${posts.length} posts!`)
    
    // Navigate based on context
    if (projectId) {
      router.push(ROUTES.PROJECT_DETAIL(projectId))
    } else {
      router.push(ROUTES.SOCIAL_CALENDAR)
    }
  }

  const handleCancel = () => {
    if (projectId) {
      router.push(ROUTES.PROJECT_DETAIL(projectId))
    } else {
      router.push(ROUTES.SOCIAL)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="relative">
      <AnimatedBackground variant="subtle" />
      
      <div className="relative container max-w-7xl mx-auto p-6">
        {/* Enhanced Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <motion.div whileHover={{ x: -4 }}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCancel}
                    className="h-8 w-8 p-0"
                  >
                    <IconArrowLeft className="h-4 w-4" />
                  </Button>
                </motion.div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                    Social Media Publisher
                  </h1>
                  <p className="text-muted-foreground">
                    Create and schedule content across all your platforms
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => router.push(ROUTES.SOCIAL_CALENDAR)}
              >
                <IconCalendar className="h-4 w-4 mr-2" />
                View Calendar
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push(ROUTES.SOCIAL)}
              >
                <IconShare className="h-4 w-4 mr-2" />
                Social Hub
              </Button>
            </div>
          </div>

          {/* Context Banner */}
          {projectId && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/20">
                      <IconRocket className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">
                        Publishing from Project
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Content will be automatically linked to your project for tracking
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </motion.div>

        {/* Main Publishing Workflow */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <SocialMediaComposer
            projectId={projectId || undefined}
            initialContent={initialContent}
            initialMedia={initialMedia}
            onSuccess={handleSuccess}
            onCancel={handleCancel}
          />
        </motion.div>

        {/* Quick Tips */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-12 pt-8 border-t"
        >
          <h3 className="text-lg font-semibold mb-4">Pro Tips</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/20">
                    <IconBolt className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">Best Times</h4>
                    <p className="text-sm text-muted-foreground">
                      Schedule posts during peak hours for maximum engagement
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/20">
                    <IconWand className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">AI Assistance</h4>
                    <p className="text-sm text-muted-foreground">
                      Use AI to generate engaging captions and hashtags
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/20">
                    <IconSparkles className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">Cross-Post</h4>
                    <p className="text-sm text-muted-foreground">
                      Save time by publishing to multiple platforms at once
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default function ComposeSocialPost() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    }>
      <ComposeSocialPostContent />
    </Suspense>
  )
}