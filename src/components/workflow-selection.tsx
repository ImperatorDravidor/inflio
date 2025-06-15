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
}

const workflows = [
  {
    id: 'transcription' as const,
    title: 'AI Transcription',
    description: 'Convert speech to text with high accuracy and timestamps',
    icon: IconFileText,
    color: 'text-blue-600',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/20',
    time: '1-2 min',
    required: true
  },
  {
    id: 'clips' as const,
    title: 'Video Clips',
    description: 'Generate short, engaging clips from highlights',
    icon: IconScissors,
    color: 'text-green-600',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/20',
    time: '3-5 min',
    badge: 'Popular'
  },
  {
    id: 'blog' as const,
    title: 'Blog Post',
    description: 'Create an SEO-optimized article from your content',
    icon: IconArticle,
    color: 'text-purple-600',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/20',
    time: '2-3 min'
  },
  {
    id: 'social' as const,
    title: 'Social Posts',
    description: 'Generate posts for Twitter, LinkedIn, and more',
    icon: IconBrandTwitter,
    color: 'text-pink-600',
    bgColor: 'bg-pink-500/10',
    borderColor: 'border-pink-500/20',
    time: '1-2 min'
  },
  {
    id: 'podcast' as const,
    title: 'Podcast Format',
    description: 'Convert to podcast with chapters and show notes',
    icon: IconMicrophone,
    color: 'text-orange-600',
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-orange-500/20',
    time: '3-4 min',
    badge: 'Beta'
  }
]

export function WorkflowSelection({ options, onChange, disabled }: WorkflowSelectionProps) {
  const handleToggle = (workflowId: keyof WorkflowOptions) => {
    if (workflowId === 'transcription') return // Transcription is always required
    
    onChange({
      ...options,
      [workflowId]: !options[workflowId]
    })
  }

  const selectedCount = Object.values(options).filter(Boolean).length

  return (
    <Card className="border-primary/20 shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <div className="p-2 rounded-lg gradient-premium-subtle">
                <IconSparkles className="h-5 w-5 text-primary" />
              </div>
              Select AI Workflows
            </CardTitle>
            <CardDescription className="mt-2">
              Choose how you want to transform your video content
            </CardDescription>
          </div>
          <Badge variant="secondary" className="text-sm">
            {selectedCount} selected
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          <AnimatePresence>
            {workflows.map((workflow, index) => {
              const Icon = workflow.icon
              const isSelected = options[workflow.id]
              
              return (
                <motion.div
                  key={workflow.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <div
                    className={cn(
                      "group relative flex items-start gap-4 p-4 rounded-xl border-2 transition-all cursor-pointer",
                      isSelected
                        ? `${workflow.borderColor} ${workflow.bgColor}`
                        : "border-border hover:border-primary/30",
                      disabled && "opacity-50 cursor-not-allowed",
                      workflow.required && "cursor-default"
                    )}
                    onClick={() => !disabled && !workflow.required && handleToggle(workflow.id)}
                  >
                    <Checkbox
                      checked={isSelected}
                      disabled={disabled || workflow.required}
                      className="mt-0.5"
                      onClick={(e) => e.stopPropagation()}
                      onCheckedChange={() => handleToggle(workflow.id)}
                    />
                    
                    <div className={cn(
                      "p-3 rounded-lg transition-colors",
                      isSelected ? workflow.bgColor : "bg-muted"
                    )}>
                      <Icon className={cn("h-5 w-5", workflow.color)} />
                    </div>
                    
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{workflow.title}</h4>
                        {workflow.required && (
                          <Badge variant="default" className="text-xs">
                            Required
                          </Badge>
                        )}
                        {workflow.badge && !workflow.required && (
                          <Badge variant="secondary" className="text-xs">
                            {workflow.badge}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {workflow.description}
                      </p>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <IconClock className="h-3 w-3" />
                        <span>Estimated: {workflow.time}</span>
                      </div>
                    </div>
                    
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute top-2 right-2"
                      >
                        <div className="p-1 rounded-full bg-primary text-primary-foreground">
                          <IconBolt className="h-3 w-3" />
                        </div>
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
        
        <div className="mt-6 p-4 rounded-lg bg-muted/50 text-sm text-muted-foreground">
          <p className="flex items-center gap-2">
            <IconClock className="h-4 w-4" />
            Total estimated time: {
              workflows
                .filter(w => options[w.id])
                .reduce((acc, w) => {
                  const [min] = w.time.split('-').map(t => parseInt(t))
                  return acc + min
                }, 0)
            }-{
              workflows
                .filter(w => options[w.id])
                .reduce((acc, w) => {
                  const [, max] = w.time.split('-').map(t => parseInt(t))
                  return acc + max
                }, 0)
            } minutes
          </p>
        </div>
      </CardContent>
    </Card>
  )
} 
