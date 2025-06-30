"use client"

import React, { useState, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  IconCheck,
  IconX,
  IconAlertCircle,
  IconSparkles,
  IconClock,
  IconCalendar,
  IconChevronRight,
  IconChevronLeft,
  IconSend,
  IconEdit,
  IconEye,
  IconBrandInstagram,
  IconBrandLinkedin,
  IconBrandTiktok,
  IconBrandYoutube,
  IconBrandX,
  IconBrandFacebook,
  IconShare2,
  IconCircleCheck,
  IconCircleX,
  IconLoader2
} from "@tabler/icons-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { StagedContent, ScheduledContent, StagingService } from "@/lib/staging/staging-service"
import { Platform } from "@/lib/social/types"
import { format } from "date-fns"
import { getPlatformClasses, getStatusClasses } from "@/lib/design-tokens"

interface PublishingManagerProps {
  projectId: string
  userId: string
  stagedContent: StagedContent[]
  scheduledContent: ScheduledContent[]
  onComplete: () => void
  onBack: () => void
}

const platformIcons: Record<string, any> = {
  instagram: IconBrandInstagram,
  'instagram-reel': IconBrandInstagram,
  'instagram-story': IconBrandInstagram,
  linkedin: IconBrandLinkedin,
  tiktok: IconBrandTiktok,
  youtube: IconBrandYoutube,
  'youtube-short': IconBrandYoutube,
  x: IconBrandX,
  facebook: IconBrandFacebook,
  threads: IconBrandInstagram
}

interface PublishingStep {
  id: string
  title: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  message?: string
  error?: string
}

interface ValidationIssue {
  platform: Platform
  field: string
  message: string
  severity: 'error' | 'warning'
}

export function PublishingManager({
  projectId,
  userId,
  stagedContent,
  scheduledContent,
  onComplete,
  onBack
}: PublishingManagerProps) {
  const [isPublishing, setIsPublishing] = useState(false)
  const [publishingSteps, setPublishingSteps] = useState<PublishingStep[]>([])
  const [validationIssues, setValidationIssues] = useState<ValidationIssue[]>([])
  const [selectedPosts, setSelectedPosts] = useState<Set<number>>(
    new Set(scheduledContent.map((_, idx) => idx))
  )

  // Validate all content before publishing
  const validateContent = useCallback(() => {
    const issues: ValidationIssue[] = []
    
    scheduledContent.forEach((scheduled, idx) => {
      const { stagedContent } = scheduled
      
      stagedContent.platforms.forEach(platform => {
        const platformData = stagedContent.platformContent[platform]
        
        if (!platformData) {
          issues.push({
            platform,
            field: 'content',
            message: `Missing content for ${platform}`,
            severity: 'error'
          })
          return
        }
        
        // Check caption
        if (!platformData.caption && !platformData.title && !platformData.description) {
          issues.push({
            platform,
            field: 'caption',
            message: `No caption provided for ${platform}`,
            severity: 'error'
          })
        }
        
        // Check hashtags
        if (platform === 'instagram' && (!platformData.hashtags || platformData.hashtags.length < 3)) {
          issues.push({
            platform,
            field: 'hashtags',
            message: `Instagram posts perform better with at least 3 hashtags`,
            severity: 'warning'
          })
        }
        
        // Check media
        if (!stagedContent.mediaUrls || stagedContent.mediaUrls.length === 0) {
          // Blog content doesn't require media
          if (stagedContent.type !== 'blog') {
            issues.push({
              platform,
              field: 'media',
              message: `No media attached for ${stagedContent.type}`,
              severity: 'error'
            })
          }
        }
      })
    })
    
    setValidationIssues(issues)
    return issues.filter(i => i.severity === 'error').length === 0
  }, [scheduledContent])

  // Publish content
  const handlePublish = async () => {
    if (!validateContent()) {
      toast.error('Please fix validation errors before publishing')
      return
    }
    
    setIsPublishing(true)
    const steps: PublishingStep[] = [
      { id: 'validate', title: 'Validating content', status: 'processing' },
      { id: 'prepare', title: 'Preparing posts', status: 'pending' },
      { id: 'schedule', title: 'Scheduling posts', status: 'pending' },
      { id: 'complete', title: 'Finalizing', status: 'pending' }
    ]
    setPublishingSteps(steps)
    
    try {
      // Step 1: Validate
      await new Promise(resolve => setTimeout(resolve, 1000))
      updateStep('validate', 'completed', 'Content validated')
      
      // Step 2: Prepare
      updateStep('prepare', 'processing')
      const selectedScheduledContent = scheduledContent.filter((_, idx) => selectedPosts.has(idx))
      await new Promise(resolve => setTimeout(resolve, 1000))
      updateStep('prepare', 'completed', `${selectedScheduledContent.length} posts prepared`)
      
      // Step 3: Schedule
      updateStep('schedule', 'processing')
      await StagingService.publishScheduledContent(userId, projectId, selectedScheduledContent)
      updateStep('schedule', 'completed', 'Posts scheduled successfully')
      
      // Step 4: Complete
      updateStep('complete', 'processing')
      await new Promise(resolve => setTimeout(resolve, 500))
      updateStep('complete', 'completed', 'Publishing complete!')
      
      toast.success('Content published successfully!')
      setTimeout(onComplete, 1500)
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Publishing failed'
      updateStep(getCurrentStep(), 'failed', errorMessage)
      toast.error(errorMessage)
      setIsPublishing(false)
    }
  }
  
  const updateStep = (stepId: string, status: PublishingStep['status'], message?: string) => {
    setPublishingSteps(prev => prev.map(step => 
      step.id === stepId ? { ...step, status, message } : step
    ))
  }
  
  const getCurrentStep = () => {
    const processingStep = publishingSteps.find(s => s.status === 'processing')
    return processingStep?.id || 'validate'
  }

  // Toggle post selection
  const togglePost = (idx: number) => {
    const newSelection = new Set(selectedPosts)
    if (newSelection.has(idx)) {
      newSelection.delete(idx)
    } else {
      newSelection.add(idx)
    }
    setSelectedPosts(newSelection)
  }

  const toggleAll = () => {
    if (selectedPosts.size === scheduledContent.length) {
      setSelectedPosts(new Set())
    } else {
      setSelectedPosts(new Set(scheduledContent.map((_, idx) => idx)))
    }
  }

  // Calculate stats
  const totalPosts = selectedPosts.size
  const totalPlatforms = new Set(
    scheduledContent
      .filter((_, idx) => selectedPosts.has(idx))
      .flatMap(s => s.stagedContent.platforms)
  ).size
  const errors = validationIssues.filter(i => i.severity === 'error').length
  const warnings = validationIssues.filter(i => i.severity === 'warning').length

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="py-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-primary">{totalPosts}</p>
              <p className="text-sm text-muted-foreground">Posts Selected</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="py-6">
            <div className="text-center">
              <p className="text-3xl font-bold">{totalPlatforms}</p>
              <p className="text-sm text-muted-foreground">Platforms</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="py-6">
            <div className="text-center">
              <p className={cn("text-3xl font-bold", errors > 0 ? "text-destructive" : "text-emerald-500")}>
                {errors}
              </p>
              <p className="text-sm text-muted-foreground">Errors</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="py-6">
            <div className="text-center">
              <p className={cn("text-3xl font-bold", warnings > 0 ? "text-amber-500" : "text-muted-foreground")}>
                {warnings}
              </p>
              <p className="text-sm text-muted-foreground">Warnings</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Validation Issues */}
      {validationIssues.length > 0 && (
        <Alert className={cn(
          "border",
          errors > 0 ? getStatusClasses('error').border : getStatusClasses('warning').border
        )}>
          <IconAlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong className="block mb-2">Please review the following issues:</strong>
            <ul className="space-y-1 text-sm">
              {validationIssues.slice(0, 5).map((issue, idx) => (
                <li key={idx} className={cn(
                  "flex items-center gap-2",
                  issue.severity === 'error' ? "text-destructive" : "text-amber-600 dark:text-amber-400"
                )}>
                  {issue.severity === 'error' ? (
                    <IconCircleX className="h-4 w-4" />
                  ) : (
                    <IconAlertCircle className="h-4 w-4" />
                  )}
                  <span>{issue.message}</span>
                </li>
              ))}
              {validationIssues.length > 5 && (
                <li className="text-muted-foreground">
                  ...and {validationIssues.length - 5} more issues
                </li>
              )}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Content Review */}
      {!isPublishing ? (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Review Scheduled Posts</CardTitle>
                <CardDescription>
                  Select the posts you want to publish to your calendar
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={toggleAll}
              >
                {selectedPosts.size === scheduledContent.length ? 'Deselect All' : 'Select All'}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {scheduledContent.map((scheduled, idx) => {
                const { stagedContent, scheduledDate, engagementPrediction } = scheduled
                const isSelected = selectedPosts.has(idx)
                const hasError = validationIssues.some(
                  i => i.severity === 'error' && 
                  stagedContent.platforms.includes(i.platform)
                )
                
                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className={cn(
                      "p-4 rounded-lg border transition-all cursor-pointer",
                      isSelected ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50",
                      hasError && "border-destructive/50"
                    )}
                    onClick={() => togglePost(idx)}
                  >
                    <div className="flex items-start gap-4">
                      <div className={cn(
                        "mt-1 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
                        isSelected ? "bg-primary border-primary" : "border-border"
                      )}>
                        {isSelected && <IconCheck className="h-3 w-3 text-primary-foreground" />}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-medium">{stagedContent.title}</h4>
                          <Badge variant="secondary" className="text-xs">
                            {stagedContent.type}
                          </Badge>
                          {hasError && (
                            <Badge variant="destructive" className="text-xs">
                              Has Errors
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                          <span className="flex items-center gap-1">
                            <IconCalendar className="h-4 w-4" />
                            {format(scheduledDate, 'MMM d, yyyy')}
                          </span>
                          <span className="flex items-center gap-1">
                            <IconClock className="h-4 w-4" />
                            {format(scheduledDate, 'h:mm a')}
                          </span>
                          {engagementPrediction && (
                            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                              <IconSparkles className="h-4 w-4" />
                              {engagementPrediction.score}% reach
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {stagedContent.platforms.map(platform => {
                            const Icon = platformIcons[platform] || IconShare2
                            const platformClasses = getPlatformClasses(platform)
                            
                            return (
                              <div
                                key={platform}
                                className={cn(
                                  "p-1.5 rounded-md text-white",
                                  platformClasses.solid
                                )}
                              >
                                <Icon className="h-4 w-4" />
                              </div>
                            )
                          })}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            // Preview functionality
                            toast.info('Preview coming soon!')
                          }}
                        >
                          <IconEye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            // Edit functionality
                            toast.info('Edit coming soon!')
                          }}
                        >
                          <IconEdit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      ) : (
        /* Publishing Progress */
        <Card>
          <CardHeader>
            <CardTitle>Publishing Your Content</CardTitle>
            <CardDescription>
              Please wait while we schedule your posts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {publishingSteps.map((step, idx) => (
                <div key={step.id} className="flex items-center gap-4">
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center transition-all",
                    step.status === 'completed' && "bg-emerald-500 text-white",
                    step.status === 'processing' && "bg-primary text-primary-foreground",
                    step.status === 'failed' && "bg-destructive text-destructive-foreground",
                    step.status === 'pending' && "bg-muted text-muted-foreground"
                  )}>
                    {step.status === 'completed' && <IconCheck className="h-4 w-4" />}
                    {step.status === 'processing' && <IconLoader2 className="h-4 w-4 animate-spin" />}
                    {step.status === 'failed' && <IconX className="h-4 w-4" />}
                    {step.status === 'pending' && <span className="text-xs">{idx + 1}</span>}
                  </div>
                  
                  <div className="flex-1">
                    <p className={cn(
                      "font-medium",
                      step.status === 'completed' && "text-emerald-600 dark:text-emerald-400",
                      step.status === 'failed' && "text-destructive"
                    )}>
                      {step.title}
                    </p>
                    {step.message && (
                      <p className="text-sm text-muted-foreground">{step.message}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            <Progress 
              value={
                (publishingSteps.filter(s => s.status === 'completed').length / publishingSteps.length) * 100
              } 
              className="mt-6"
            />
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={onBack}
          disabled={isPublishing}
        >
          <IconChevronLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm text-muted-foreground">
              {totalPosts === 0 
                ? 'No posts selected' 
                : `${totalPosts} post${totalPosts === 1 ? '' : 's'} will be published`
              }
            </p>
            {totalPosts > 0 && (
              <p className="text-xs text-muted-foreground">
                across {totalPlatforms} platform{totalPlatforms === 1 ? '' : 's'}
              </p>
            )}
          </div>
          
          <Button
            onClick={handlePublish}
            disabled={totalPosts === 0 || isPublishing || errors > 0}
            size="lg"
            className="bg-primary hover:bg-primary/90"
          >
            {isPublishing ? (
              <>
                <IconLoader2 className="h-4 w-4 mr-2 animate-spin" />
                Publishing...
              </>
            ) : (
              <>
                <IconSend className="h-4 w-4 mr-2" />
                Publish to Calendar
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
} 