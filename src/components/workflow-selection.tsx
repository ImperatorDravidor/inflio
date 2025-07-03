"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  IconFileText,
  IconScissors,
  IconSparkles,
  IconClock,
  IconLock,
  IconCheck
} from "@tabler/icons-react"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription } from "@/components/ui/alert"

export interface WorkflowOptions {
  transcription: boolean
  clips: boolean
  blog: boolean
  social: boolean
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
      name: 'Transcript & AI Summary',
      description: 'Convert speech to text and generate AI project insights',
      icon: IconFileText,
      color: 'from-blue-500 to-blue-600',
      estimatedTime: '2-3 minutes',
      features: ['99% accuracy', 'Speaker detection', 'AI summary', 'Key insights'],
      required: true,
      checked: true
    },
    {
      id: 'clips',
      name: 'Generate Short-Form Clips',
      description: 'AI extracts the best moments for viral social media content',
      icon: IconScissors,
      color: 'from-purple-500 to-purple-600',
      estimatedTime: '5-7 minutes',
      features: ['Viral detection', 'Auto-captions', 'Multiple formats', '5-10 clips'],
      required: false,
      checked: options.clips
    }
  ]

  const handleToggle = (workflowId: string) => {
    const workflow = workflows.find(w => w.id === workflowId)
    if (workflow?.required) return
    
    onChange({
      ...options,
      [workflowId]: !options[workflowId as keyof typeof options]
    })
  }

  return (
    <Card className="overflow-hidden">
      <div className="h-1.5 gradient-premium" />
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Processing Options</CardTitle>
            <CardDescription className="mt-1">
              Choose what to generate from your video
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className={cn(
          variant === 'grid' 
            ? "grid grid-cols-1 gap-4"
            : "space-y-4"
        )}>
          {workflows.map((workflow, index) => {
            const Icon = workflow.icon
            const isSelected = workflow.required || options[workflow.id as keyof typeof options]
            
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
                    isSelected && "border-primary shadow-lg bg-primary/5",
                    !isSelected && "border-muted hover:border-primary/50",
                    disabled && "pointer-events-none opacity-60"
                  )}
                >
                  <div className="relative p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-start gap-3">
                        <div className={cn(
                          "p-2.5 rounded-lg bg-gradient-to-br text-white shadow-lg",
                          workflow.color
                        )}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-base flex items-center gap-2">
                            {workflow.name}
                            {workflow.required && (
                              <Badge variant="secondary" className="text-xs">
                                <IconLock className="h-3 w-3 mr-1" />
                                Required
                              </Badge>
                            )}
                          </h3>
                          <p className="text-sm text-muted-foreground mt-0.5">
                            {workflow.description}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {workflow.required ? (
                          <div className="p-1 rounded-full bg-primary text-primary-foreground">
                            <IconCheck className="h-4 w-4" />
                          </div>
                        ) : (
                          <Switch
                            checked={isSelected}
                            onCheckedChange={() => handleToggle(workflow.id)}
                            disabled={disabled || workflow.required}
                            className="data-[state=checked]:bg-primary"
                          />
                        )}
                      </div>
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
                              isSelected && "bg-primary/10 text-primary"
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
        
        <Alert className="mt-6 border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/20">
          <IconSparkles className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-sm">
            <strong>More features available after processing:</strong> Once your video is processed, you can generate blog posts, 
            social media content, images, thumbnails, and more from your project dashboard.
          </AlertDescription>
        </Alert>
        
        {!options.clips && (
          <Alert className="mt-3 border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/20">
            <AlertDescription className="text-sm">
              <strong>Note:</strong> You can generate clips later from your project if you skip this step.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
} 
