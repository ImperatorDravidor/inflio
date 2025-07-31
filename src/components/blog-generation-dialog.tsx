"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { IconSparkles, IconArticle, IconBriefcase, IconCode, IconHeart, IconTarget, IconClock, IconTrendingUp, IconUser, IconUsers } from "@tabler/icons-react"
import { cn } from "@/lib/utils"

interface BlogGenerationDialogProps {
  isOpen: boolean
  onClose: () => void
  onGenerate: (options: BlogGenerationOptions) => void
  isGenerating: boolean
}

export interface BlogGenerationOptions {
  style: 'professional' | 'casual' | 'technical' | 'storytelling'
  voice: 'first-person' | 'interview'
  length: number
  seoOptimized: boolean
  includeImages: boolean
  includeFAQ: boolean
  customInstructions?: string
  guestName?: string
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

const voiceOptions = [
  {
    value: 'first-person',
    label: 'Thought Leader',
    description: 'Write as yourself sharing expertise',
    icon: IconUser,
    color: 'text-primary'
  },
  {
    value: 'interview',
    label: 'Interview Style',
    description: 'Q&A format with a guest',
    icon: IconUsers,
    color: 'text-orange-600'
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
    voice: 'first-person',
    length: 2000,
    seoOptimized: true,
    includeImages: true,
    includeFAQ: true,
    customInstructions: '',
    guestName: ''
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
          {/* Voice Type */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Content Voice</Label>
            <RadioGroup
              value={options.voice}
              onValueChange={(value) => setOptions({ ...options, voice: value as any })}
              className="grid grid-cols-2 gap-3"
            >
              {voiceOptions.map((voice) => {
                const Icon = voice.icon
                return (
                  <div key={voice.value} className="relative">
                    <RadioGroupItem
                      value={voice.value}
                      id={voice.value}
                      className="peer sr-only"
                    />
                    <Label
                      htmlFor={voice.value}
                      className={cn(
                        "flex flex-col gap-2 p-4 rounded-lg border-2 cursor-pointer transition-all",
                        "hover:bg-muted/50",
                        "peer-checked:border-primary peer-checked:bg-primary/5"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <Icon className={cn("h-5 w-5", voice.color)} />
                        <span className="font-semibold">{voice.label}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {voice.description}
                      </span>
                    </Label>
                  </div>
                )
              })}
            </RadioGroup>
          </div>

          {/* Guest Name (only for interview style) */}
          {options.voice === 'interview' && (
            <div className="space-y-3">
              <Label htmlFor="guestName" className="text-base font-semibold">
                Guest Name
              </Label>
              <Textarea
                id="guestName"
                placeholder="Enter the name of your guest..."
                value={options.guestName}
                onChange={(e) => setOptions({ ...options, guestName: e.target.value })}
                className="min-h-[60px]"
              />
            </div>
          )}

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
                  <div key={style.value} className="relative">
                    <RadioGroupItem
                      value={style.value}
                      id={style.value}
                      className="peer sr-only"
                    />
                    <Label
                      htmlFor={style.value}
                      className={cn(
                        "flex flex-col gap-2 p-4 rounded-lg border-2 cursor-pointer transition-all",
                        "hover:bg-muted/50",
                        "peer-checked:border-primary peer-checked:bg-primary/5"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <Icon className={cn("h-5 w-5", style.color)} />
                        <span className="font-semibold">{style.label}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {style.description}
                      </span>
                    </Label>
                  </div>
                )
              })}
            </RadioGroup>
          </div>

          {/* Length Slider */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Blog Length</Label>
              <span className="text-sm text-muted-foreground">
                {lengthLabels[options.length as keyof typeof lengthLabels]}
              </span>
            </div>
            <Slider
              value={[options.length]}
              onValueChange={([value]) => setOptions({ ...options, length: value })}
              min={500}
              max={3000}
              step={500}
              className="py-2"
            />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Short</span>
              <span>Extra Long</span>
            </div>
          </div>

          {/* Features */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Features</Label>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-3">
                  <IconTarget className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium">SEO Optimization</p>
                    <p className="text-xs text-muted-foreground">Include meta descriptions & keywords</p>
                  </div>
                </div>
                <Switch
                  checked={options.seoOptimized}
                  onCheckedChange={(checked) => setOptions({ ...options, seoOptimized: checked })}
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-3">
                  <IconTrendingUp className="h-5 w-5 text-purple-600" />
                  <div>
                    <p className="font-medium">Featured Images</p>
                    <p className="text-xs text-muted-foreground">Generate AI images for the post</p>
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