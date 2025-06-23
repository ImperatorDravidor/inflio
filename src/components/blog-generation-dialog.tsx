"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { IconSparkles, IconArticle, IconBriefcase, IconCode, IconHeart, IconTarget, IconClock, IconTrendingUp } from "@tabler/icons-react"
import { cn } from "@/lib/utils"

interface BlogGenerationDialogProps {
  isOpen: boolean
  onClose: () => void
  onGenerate: (options: BlogGenerationOptions) => void
  isGenerating: boolean
}

export interface BlogGenerationOptions {
  style: 'professional' | 'casual' | 'technical' | 'storytelling'
  length: number
  seoOptimized: boolean
  includeImages: boolean
  includeFAQ: boolean
  customInstructions?: string
}

const styleOptions = [
  {
    value: 'professional',
    label: 'Professional',
    description: 'Formal, authoritative tone',
    icon: IconBriefcase,
    color: 'text-blue-600'
  },
  {
    value: 'casual',
    label: 'Casual',
    description: 'Friendly, conversational style',
    icon: IconHeart,
    color: 'text-pink-600'
  },
  {
    value: 'technical',
    label: 'Technical',
    description: 'Detailed, expert-level content',
    icon: IconCode,
    color: 'text-green-600'
  },
  {
    value: 'storytelling',
    label: 'Storytelling',
    description: 'Narrative-driven approach',
    icon: IconArticle,
    color: 'text-purple-600'
  }
]

export function BlogGenerationDialog({
  isOpen,
  onClose,
  onGenerate,
  isGenerating
}: BlogGenerationDialogProps) {
  const [options, setOptions] = useState<BlogGenerationOptions>({
    style: 'professional',
    length: 2000,
    seoOptimized: true,
    includeImages: true,
    includeFAQ: true,
    customInstructions: ''
  })

  const handleGenerate = () => {
    onGenerate(options)
  }

  const lengthLabels = {
    500: 'Short (500 words)',
    1000: 'Medium (1000 words)',
    1500: 'Standard (1500 words)',
    2000: 'Long (2000 words)',
    3000: 'Extra Long (3000 words)'
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <div className="p-2 rounded-lg bg-primary/10">
              <IconSparkles className="h-6 w-6 text-primary" />
            </div>
            Generate Blog Post
          </DialogTitle>
          <DialogDescription>
            Customize how your AI-powered blog post will be generated
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Writing Style */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Writing Style</Label>
            <RadioGroup
              value={options.style}
              onValueChange={(value) => setOptions({ ...options, style: value as any })}
              className="grid grid-cols-2 gap-3"
            >
              {styleOptions.map((style) => {
                const Icon = style.icon
                return (
                  <div key={style.value}>
                    <RadioGroupItem
                      value={style.value}
                      id={style.value}
                      className="sr-only"
                    />
                    <Label
                      htmlFor={style.value}
                      className={cn(
                        "flex flex-col items-center gap-2 rounded-lg border-2 p-4 cursor-pointer transition-all",
                        options.style === style.value
                          ? "border-primary bg-primary/5"
                          : "border-muted hover:border-primary/50"
                      )}
                    >
                      <Icon className={cn("h-8 w-8", style.color)} />
                      <div className="text-center">
                        <p className="font-medium">{style.label}</p>
                        <p className="text-xs text-muted-foreground">{style.description}</p>
                      </div>
                    </Label>
                  </div>
                )
              })}
            </RadioGroup>
          </div>

          {/* Article Length */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold flex items-center gap-2">
                <IconClock className="h-4 w-4" />
                Article Length
              </Label>
              <span className="text-sm font-medium text-primary">
                {lengthLabels[options.length as keyof typeof lengthLabels]}
              </span>
            </div>
            <Slider
              value={[options.length]}
              onValueChange={([value]) => setOptions({ ...options, length: value })}
              min={500}
              max={3000}
              step={500}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Short</span>
              <span>Extra Long</span>
            </div>
          </div>

          {/* Features */}
          <div className="space-y-3">
            <Label className="text-base font-semibold flex items-center gap-2">
              <IconTarget className="h-4 w-4" />
              Features
            </Label>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-3">
                  <IconTrendingUp className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium">SEO Optimization</p>
                    <p className="text-xs text-muted-foreground">Include meta tags, keywords, and structured content</p>
                  </div>
                </div>
                <Switch
                  checked={options.seoOptimized}
                  onCheckedChange={(checked) => setOptions({ ...options, seoOptimized: checked })}
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-3">
                  <IconSparkles className="h-5 w-5 text-purple-600" />
                  <div>
                    <p className="font-medium">AI Image Suggestions</p>
                    <p className="text-xs text-muted-foreground">Generate image ideas for your blog</p>
                  </div>
                </div>
                <Switch
                  checked={options.includeImages}
                  onCheckedChange={(checked) => setOptions({ ...options, includeImages: checked })}
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-3">
                  <IconArticle className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="font-medium">FAQ Section</p>
                    <p className="text-xs text-muted-foreground">Add frequently asked questions</p>
                  </div>
                </div>
                <Switch
                  checked={options.includeFAQ}
                  onCheckedChange={(checked) => setOptions({ ...options, includeFAQ: checked })}
                />
              </div>
            </div>
          </div>

          {/* Custom Instructions */}
          <div className="space-y-3">
            <Label htmlFor="custom" className="text-base font-semibold">
              Custom Instructions (Optional)
            </Label>
            <Textarea
              id="custom"
              placeholder="Add any specific requirements or topics you want covered..."
              value={options.customInstructions}
              onChange={(e) => setOptions({ ...options, customInstructions: e.target.value })}
              className="min-h-[80px]"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isGenerating}>
            Cancel
          </Button>
          <Button onClick={handleGenerate} disabled={isGenerating}>
            {isGenerating ? (
              <>
                <IconSparkles className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <IconSparkles className="mr-2 h-4 w-4" />
                Generate Blog Post
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 