"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import {
  IconFileText,
  IconScissors,
  IconArticle,
  IconBrandTwitter,
  IconMicrophone,
  IconSparkles,
  IconBolt,
  IconClock
} from "@tabler/icons-react"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription } from "@/components/ui/alert"

export interface WorkflowOptions {
  transcription: boolean
  clips: boolean
  blog: boolean
  social: boolean
  podcast: boolean
}

interface WorkflowSelectionProps {
  options: WorkflowOptions
  onChange: (options: WorkflowOptions) => void
  disabled?: boolean
  variant?: 'default' | 'grid'
}

export function WorkflowSelection({
  options,
  onChange,
  disabled = false,
  variant = 'default'
}: WorkflowSelectionProps) {
  const workflows = [
    {
      id: 'transcription',
      name: 'AI Transcription',
      description: 'Convert speech to text with speaker detection',
      icon: IconFileText,
      color: 'from-blue-500 to-blue-600',
      estimatedTime: '2-3 minutes',
      features: ['99% accuracy', 'Speaker labels', 'Timestamps'],
      required: true // Always required
    },
    {
      id: 'clips',
      name: 'Smart Clips',
      description: 'AI extracts viral moments for social media',
      icon: IconScissors,
      color: 'from-purple-500 to-purple-600',
      estimatedTime: '5-7 minutes',
      features: ['Viral detection', 'Auto-captions', 'Multiple formats'],
      required: true // Always required for now
    },
    {
      id: 'blog',
      name: 'Blog Post',
      description: 'Generate SEO-optimized blog content',
      icon: IconArticle,
      color: 'from-green-500 to-green-600',
      estimatedTime: '3-5 minutes',
      features: ['SEO optimized', 'Multiple sections', 'Meta tags'],
      comingSoon: true
    },
    {
      id: 'social',
      name: 'Social Media',
      description: 'Platform-specific posts with hashtags',
      icon: IconBrandTwitter,
      color: 'from-pink-500 to-pink-600',
      estimatedTime: '2-3 minutes',
      features: ['Multi-platform', 'Hashtags', 'Scheduling'],
      comingSoon: true
    },
    {
      id: 'podcast',
      name: 'Podcast',
      description: 'Chapters, show notes, and highlights',
      icon: IconMicrophone,
      color: 'from-amber-500 to-amber-600',
      estimatedTime: '4-6 minutes',
      features: ['Auto chapters', 'Show notes', 'Key quotes'],
      comingSoon: true
    }
  ]

  const handleToggle = (workflowId: string) => {
    const workflow = workflows.find(w => w.id === workflowId)
    if (workflow?.required || workflow?.comingSoon) return
    
    onChange({
      ...options,
      [workflowId]: !options[workflowId as keyof typeof options]
    })
  }

  const selectedCount = Object.values(options).filter(v => v).length

  return (
    <Card className="overflow-hidden">
      <div className="h-1.5 gradient-premium" />
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Select AI Workflows</CardTitle>
            <CardDescription className="mt-1">
              Choose how you want to transform your video content
            </CardDescription>
          </div>
          <Badge variant="secondary" className="text-sm">
            {selectedCount} selected
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className={cn(
          variant === 'grid' 
            ? "grid grid-cols-1 md:grid-cols-2 gap-4"
            : "space-y-3"
        )}>
          {workflows.map((workflow, index) => {
            const Icon = workflow.icon
            const isSelected = options[workflow.id as keyof typeof options]
            
            return (
              <motion.div
                key={workflow.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <div
                  className={cn(
                    "group relative overflow-hidden rounded-xl border-2 transition-all duration-300",
                    isSelected && !workflow.comingSoon && "border-primary shadow-lg",
                    !isSelected && !workflow.comingSoon && "border-muted hover:border-primary/50",
                    workflow.comingSoon && "border-muted opacity-60",
                    disabled && "pointer-events-none opacity-60"
                  )}
                >
                  {/* Gradient background for selected items */}
                  {isSelected && !workflow.comingSoon && (
                    <div className={cn(
                      "absolute inset-0 opacity-5 bg-gradient-to-br",
                      workflow.color
                    )} />
                  )}
                  
                  <div className="relative p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-start gap-3">
                        <div className={cn(
                          "p-2.5 rounded-lg bg-gradient-to-br text-white shadow-lg",
                          workflow.color
                        )}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-base flex items-center gap-2">
                            {workflow.name}
                            {workflow.required && (
                              <Badge variant="secondary" className="text-xs">Required</Badge>
                            )}
                            {workflow.comingSoon && (
                              <Badge variant="outline" className="text-xs">Coming Soon</Badge>
                            )}
                          </h3>
                          <p className="text-sm text-muted-foreground mt-0.5">
                            {workflow.description}
                          </p>
                        </div>
                      </div>
                      
                      {!workflow.comingSoon && (
                        <Switch
                          checked={isSelected}
                          onCheckedChange={() => handleToggle(workflow.id)}
                          disabled={disabled || workflow.required}
                          className="data-[state=checked]:bg-primary"
                        />
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center gap-4 text-sm">
                        <span className="flex items-center gap-1.5 text-muted-foreground">
                          <IconClock className="h-3.5 w-3.5" />
                          {workflow.estimatedTime}
                        </span>
                        <span className="flex items-center gap-1.5 text-muted-foreground">
                          <IconSparkles className="h-3.5 w-3.5" />
                          AI-Powered
                        </span>
                      </div>
                      
                      <div className="flex flex-wrap gap-1.5">
                        {workflow.features.map((feature, i) => (
                          <Badge
                            key={i}
                            variant="secondary"
                            className={cn(
                              "text-xs font-normal",
                              isSelected && !workflow.comingSoon && "bg-primary/10 text-primary"
                            )}
                          >
                            {feature}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
        
        <Alert className="mt-4 border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/20">
          <IconBolt className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-sm">
            <strong>Focus Mode:</strong> Transcription and Smart Clips are currently available. 
            Blog posts, social media content, and podcast features are coming soon!
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  )
} 
