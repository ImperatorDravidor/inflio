"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  IconFileText, 
  IconScissors, 
  IconArticle, 
  IconBrandTwitter,
  IconMicrophone,
  IconClock,
  IconSparkles,
  IconBrain,
  IconWand,
  IconBolt
} from "@tabler/icons-react"

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

const workflowDetails: Record<keyof WorkflowOptions, {
  icon: any
  title: string
  description: string
  time: string
  color: string
  required: boolean
  depends: (keyof WorkflowOptions)[]
  features: string[]
  badge?: string
}> = {
  transcription: {
    icon: IconFileText,
    title: "AI Transcription",
    description: "Convert speech to text with 99% accuracy using advanced AI",
    time: "5-7 mins",
    color: "from-violet-500 to-purple-500",
    required: true,
    depends: [],
    features: [
      "Multi-language support",
      "Speaker detection",
      "Timestamp sync",
      "Export to SRT/VTT"
    ],
    badge: "Essential"
  },
  clips: {
    icon: IconScissors,
    title: "Smart Clips Generator",
    description: "AI identifies and extracts the most engaging moments",
    time: "5-7 mins",
    color: "from-pink-500 to-rose-500",
    required: false,
    depends: [],
    features: [
      "Auto-detect highlights",
      "Viral moment detection",
      "Custom duration clips",
      "Social media optimization"
    ],
    badge: "Popular"
  },
  blog: {
    icon: IconArticle,
    title: "Blog Article Writer",
    description: "Transform video content into SEO-optimized blog posts",
    time: "3-5 mins",
    color: "from-emerald-500 to-teal-500",
    required: false,
    depends: ["transcription"],
    features: [
      "SEO optimization",
      "Multiple formats",
      "Auto-generated headings",
      "Key takeaways extraction"
    ]
  },
  social: {
    icon: IconBrandTwitter,
    title: "Social Media Suite",
    description: "Create platform-specific posts for maximum engagement",
    time: "2-3 mins",
    color: "from-blue-500 to-cyan-500",
    required: false,
    depends: ["transcription"],
    features: [
      "Twitter threads",
      "LinkedIn posts",
      "Instagram captions",
      "Hashtag suggestions"
    ]
  },
  podcast: {
    icon: IconMicrophone,
    title: "Podcast Optimizer",
    description: "Generate timestamps, chapters, and show notes",
    time: "4-6 mins",
    color: "from-amber-500 to-orange-500",
    required: false,
    depends: ["transcription"],
    features: [
      "Chapter markers",
      "Show notes",
      "Key topics extraction",
      "Quote highlights"
    ],
    badge: "New"
  }
}

export function WorkflowSelection({ options, onChange, disabled = false }: WorkflowSelectionProps) {
  const handleToggle = (workflow: keyof WorkflowOptions, checked: boolean) => {
    const newOptions = { ...options, [workflow]: checked }
    
    // If unchecking a dependency, uncheck dependent workflows
    if (!checked) {
      Object.entries(workflowDetails).forEach(([key, details]) => {
        if (details.depends.includes(workflow)) {
          newOptions[key as keyof WorkflowOptions] = false
        }
      })
    }
    
    // If checking a workflow with dependencies, ensure dependencies are checked
    if (checked) {
      const details = workflowDetails[workflow]
      details.depends.forEach(dep => {
        newOptions[dep as keyof WorkflowOptions] = true
      })
    }
    
    onChange(newOptions)
  }

  const calculateTotalTime = () => {
    let totalMin = 0
    let totalMax = 0
    
    // Transcription and clips run in parallel
    if (options.transcription || options.clips) {
      totalMin = Math.max(totalMin, 5)
      totalMax = Math.max(totalMax, 7)
    }
    
    // Blog, social, and podcast depend on transcription
    const dependentWorkflows = []
    if (options.blog) dependentWorkflows.push({ min: 3, max: 5 })
    if (options.social) dependentWorkflows.push({ min: 2, max: 3 })
    if (options.podcast) dependentWorkflows.push({ min: 4, max: 6 })
    
    // Add time for dependent workflows (they can run in parallel)
    if (dependentWorkflows.length > 0) {
      const maxDepMin = Math.max(...dependentWorkflows.map(w => w.min))
      const maxDepMax = Math.max(...dependentWorkflows.map(w => w.max))
      totalMin += maxDepMin
      totalMax += maxDepMax
    }
    
    return { min: totalMin, max: totalMax }
  }

  const calculateProcessingCost = () => {
    let cost = 0
    if (options.transcription) cost += 2
    if (options.clips) cost += 3
    if (options.blog) cost += 1
    if (options.social) cost += 1
    if (options.podcast) cost += 2
    return cost
  }

  const totalTime = calculateTotalTime()
  const selectedCount = Object.values(options).filter(Boolean).length
  const processingCost = calculateProcessingCost()

  return (
    <Card className="overflow-hidden">
      <div className="h-1 gradient-premium" />
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <IconSparkles className="h-5 w-5 text-primary" />
          Select AI Processing Workflows
        </CardTitle>
        <CardDescription>
          Choose how you want to transform your video content
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {Object.entries(workflowDetails).map(([key, details]) => {
            const Icon = details.icon
            const isChecked = options[key as keyof WorkflowOptions]
            const isDisabled = disabled || (details.required && isChecked)
            const hasDependencies = details.depends.length > 0
            const dependenciesMet = details.depends.every(dep => options[dep as keyof WorkflowOptions])
            
            return (
              <div
                key={key}
                className={`relative p-4 rounded-lg border-2 transition-all ${
                  isChecked 
                    ? 'border-primary bg-gradient-to-r from-primary/5 to-accent/5 shadow-md' 
                    : 'border-border hover:border-primary/50 hover:shadow-sm'
                } ${!dependenciesMet && hasDependencies ? 'opacity-60' : ''}`}
              >
                <div className="flex items-start gap-4">
                  <Checkbox
                    id={key}
                    checked={isChecked}
                    onCheckedChange={(checked) => handleToggle(key as keyof WorkflowOptions, checked as boolean)}
                    disabled={isDisabled || (!dependenciesMet && hasDependencies)}
                    className="mt-1"
                  />
                  
                  <div className={`p-3 rounded-lg bg-gradient-to-br ${details.color} text-white shadow-lg`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <Label 
                          htmlFor={key} 
                          className="text-base font-semibold cursor-pointer flex items-center gap-2"
                        >
                          {details.title}
                          {details.badge && (
                            <Badge variant={details.badge === "Essential" ? "default" : "secondary"} className="text-xs">
                              {details.badge}
                            </Badge>
                          )}
                        </Label>
                        <p className="text-sm text-muted-foreground mt-1">
                          {details.description}
                        </p>
                      </div>
                      <div className="text-right ml-4">
                        <div className="flex items-center gap-1 text-sm font-medium">
                          <IconClock className="h-3 w-3" />
                          {details.time}
                        </div>
                      </div>
                    </div>
                    
                    {/* Features list */}
                    {isChecked && (
                      <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
                        {details.features.map((feature, idx) => (
                          <div key={idx} className="flex items-center gap-1 text-muted-foreground">
                            <IconBolt className="h-3 w-3 text-primary" />
                            {feature}
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {hasDependencies && !dependenciesMet && (
                      <p className="text-xs text-amber-600 dark:text-amber-400 mt-2 flex items-center gap-1">
                        <IconBrain className="h-3 w-3" />
                        Requires: {details.depends.map(d => workflowDetails[d as keyof typeof workflowDetails].title).join(', ')}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
        
        {selectedCount > 0 && (
          <div className="mt-6 space-y-4">
            {/* Processing Summary */}
            <div className="p-4 rounded-lg bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-semibold">{selectedCount} workflows selected</p>
                  <p className="text-sm text-muted-foreground">
                    Estimated processing time: {totalTime.min}-{totalTime.max} minutes
                  </p>
                </div>
                <div className="text-right">
                  <Badge variant="outline" className="gap-1">
                    <IconClock className="h-3 w-3" />
                    {totalTime.min}-{totalTime.max} mins
                  </Badge>
                </div>
              </div>
              
              {/* Visual Progress Indicator */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Processing complexity</span>
                  <span>{processingCost} / 9 units</span>
                </div>
                <Progress value={(processingCost / 9) * 100} className="h-2" />
              </div>
            </div>
            
            {/* AI Processing Note */}
            <div className="p-3 rounded-lg bg-muted/50 text-sm text-muted-foreground">
              <p className="flex items-center gap-2">
                <IconWand className="h-4 w-4 text-primary" />
                Our AI engines will process your video in parallel for maximum efficiency
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 