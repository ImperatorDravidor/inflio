"use client"

import { Settings, Video, FileText, Mail, Clock, Zap, TrendingUp, BarChart3 } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'

const CONTENT_TYPES = [
  { id: 'short-form', label: 'Short-form', icon: Video, desc: 'TikToks, Reels, Shorts' },
  { id: 'mid-form', label: 'Mid-form', icon: Video, desc: '3-10 minute videos' },
  { id: 'long-form', label: 'Long-form', icon: Video, desc: '10+ minute videos' },
  { id: 'podcasts', label: 'Podcasts', icon: FileText, desc: 'Audio content' },
  { id: 'blogs', label: 'Blog Posts', icon: FileText, desc: 'Written articles' },
  { id: 'newsletters', label: 'Newsletters', icon: Mail, desc: 'Email campaigns' }
]

const DISTRIBUTION_MODES = [
  {
    id: 'auto',
    title: 'Auto-distribute',
    desc: 'AI publishes immediately when ready',
    icon: Zap,
    color: 'from-green-500 to-emerald-500',
    recommended: false
  },
  {
    id: 'qa',
    title: 'Quick Review',
    desc: 'Review before publishing',
    icon: TrendingUp,
    color: 'from-blue-500 to-cyan-500',
    recommended: true
  },
  {
    id: 'approval',
    title: 'Full Approval',
    desc: 'Nothing publishes without your say',
    icon: BarChart3,
    color: 'from-purple-500 to-pink-500',
    recommended: false
  }
]

const POSTING_FREQUENCIES = [
  { id: 'daily', label: 'Daily', desc: '7 posts/week' },
  { id: '5x-week', label: '5x per week', desc: 'Weekdays only' },
  { id: '3x-week', label: '3x per week', desc: 'Mon/Wed/Fri' },
  { id: 'weekly', label: 'Weekly', desc: '1 post/week' },
  { id: 'biweekly', label: 'Bi-weekly', desc: 'Every 2 weeks' },
  { id: 'custom', label: 'Custom', desc: 'Set your own' }
]

const BEST_TIMES = {
  'morning': { label: 'Morning', time: '6am - 9am', icon: '🌅' },
  'midday': { label: 'Midday', time: '11am - 1pm', icon: '☀️' },
  'afternoon': { label: 'Afternoon', time: '3pm - 5pm', icon: '🌤️' },
  'evening': { label: 'Evening', time: '7pm - 9pm', icon: '🌆' },
  'night': { label: 'Night', time: '9pm - 12am', icon: '🌙' }
}

interface ContentPreferencesStepProps {
  data: any
  onChange: (updates: any) => void
}

export function ContentPreferencesStep({ data, onChange }: ContentPreferencesStepProps) {
  const contentTypes = data.contentTypes || []
  const distributionMode = data.distributionMode || 'qa'
  const postingFrequency = data.postingFrequency || 'weekly'
  const bestTimes = data.bestTimes || []

  const toggleContentType = (type: string) => {
    if (contentTypes.includes(type)) {
      onChange({ contentTypes: contentTypes.filter((t: string) => t !== type) })
    } else {
      onChange({ contentTypes: [...contentTypes, type] })
    }
  }

  const toggleBestTime = (time: string) => {
    if (bestTimes.includes(time)) {
      onChange({ bestTimes: bestTimes.filter((t: string) => t !== time) })
    } else {
      onChange({ bestTimes: [...bestTimes, time] })
    }
  }

  const selectedContentCount = contentTypes.length
  const workloadEstimate = selectedContentCount * (postingFrequency === 'daily' ? 7 : 
                                                   postingFrequency === '5x-week' ? 5 :
                                                   postingFrequency === '3x-week' ? 3 : 1)

  return (
    <div className="space-y-6">
      {/* Workload Estimate */}
      <Card className="p-4 bg-gradient-to-r from-primary/10 to-accent/10">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Estimated Weekly Output</p>
            <p className="text-sm text-muted-foreground">Based on your selections</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{workloadEstimate}</div>
            <p className="text-sm text-muted-foreground">pieces/week</p>
          </div>
        </div>
        <Progress value={Math.min(workloadEstimate * 10, 100)} className="mt-3" />
      </Card>

      {/* Content Types */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Video className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Content Types You Create</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Select all that apply - we'll optimize for each format
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {CONTENT_TYPES.map((type) => {
            const isSelected = contentTypes.includes(type.id)
            const Icon = type.icon
            
            return (
              <motion.div
                key={type.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <label 
                  className={cn(
                    "flex items-start space-x-3 p-4 rounded-lg border-2 cursor-pointer transition-all",
                    isSelected 
                      ? "border-primary bg-primary/5" 
                      : "border-muted hover:border-primary/50"
                  )}
                >
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => toggleContentType(type.id)}
                    className="mt-0.5"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{type.label}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{type.desc}</p>
                  </div>
                </label>
              </motion.div>
            )
          })}
        </div>
        
        {contentTypes.length === 0 && (
          <p className="text-sm text-orange-500 text-center py-2">
            Select at least one content type to continue
          </p>
        )}
      </Card>

      {/* Distribution Mode */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Settings className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Distribution Mode</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          How much control do you want over publishing?
        </p>
        
        <RadioGroup
          value={distributionMode}
          onValueChange={(value) => onChange({ distributionMode: value })}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {DISTRIBUTION_MODES.map((mode) => {
              const Icon = mode.icon
              const isSelected = distributionMode === mode.id
              
              return (
                <motion.div
                  key={mode.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <label 
                    className={cn(
                      "relative flex flex-col items-center text-center p-4 rounded-lg border-2 cursor-pointer transition-all",
                      isSelected 
                        ? "border-primary shadow-lg" 
                        : "border-muted hover:border-primary/50"
                    )}
                  >
                    <RadioGroupItem value={mode.id} className="sr-only" />
                    
                    {mode.recommended && (
                      <Badge className="absolute -top-2 -right-2" variant="default">
                        Recommended
                      </Badge>
                    )}
                    
                    <div className={cn(
                      "w-12 h-12 rounded-full bg-gradient-to-br flex items-center justify-center mb-3",
                      mode.color
                    )}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    
                    <h4 className="font-semibold mb-1">{mode.title}</h4>
                    <p className="text-xs text-muted-foreground">{mode.desc}</p>
                  </label>
                </motion.div>
              )
            })}
          </div>
        </RadioGroup>
      </Card>

      {/* Posting Schedule */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Clock className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Posting Schedule</h3>
        </div>
        
        <div className="space-y-4">
          <div>
            <Label>Posting Frequency</Label>
            <RadioGroup
              value={postingFrequency}
              onValueChange={(value) => onChange({ postingFrequency: value })}
              className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2"
            >
              {POSTING_FREQUENCIES.map((freq) => (
                <label
                  key={freq.id}
                  className={cn(
                    "flex flex-col p-3 rounded-lg border-2 cursor-pointer transition-all",
                    postingFrequency === freq.id
                      ? "border-primary bg-primary/5"
                      : "border-muted hover:border-primary/50"
                  )}
                >
                  <RadioGroupItem value={freq.id} className="sr-only" />
                  <span className="font-medium text-sm">{freq.label}</span>
                  <span className="text-xs text-muted-foreground">{freq.desc}</span>
                </label>
              ))}
            </RadioGroup>
          </div>
          
          <div>
            <Label>Best Times to Post</Label>
            <p className="text-sm text-muted-foreground mb-2">
              When is your audience most active?
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {Object.entries(BEST_TIMES).map(([key, time]) => {
                const isSelected = bestTimes.includes(key)
                
                return (
                  <label
                    key={key}
                    className={cn(
                      "flex items-center space-x-2 p-3 rounded-lg border-2 cursor-pointer transition-all",
                      isSelected
                        ? "border-primary bg-primary/5"
                        : "border-muted hover:border-primary/50"
                    )}
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleBestTime(key)}
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-1">
                        <span className="text-lg">{time.icon}</span>
                        <span className="font-medium text-sm">{time.label}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">{time.time}</span>
                    </div>
                  </label>
                )
              })}
            </div>
          </div>
        </div>
      </Card>

      {/* Historical Content */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Content History (Optional)</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Help AI learn from your past content
        </p>
        
        <div className="space-y-3">
          <label className="flex items-center space-x-2">
            <Checkbox
              checked={data.hasYouTubeHistory}
              onCheckedChange={(checked) => onChange({ hasYouTubeHistory: checked })}
            />
            <span className="text-sm">I have existing YouTube videos</span>
          </label>
          
          <label className="flex items-center space-x-2">
            <Checkbox
              checked={data.hasBlogHistory}
              onCheckedChange={(checked) => onChange({ hasBlogHistory: checked })}
            />
            <span className="text-sm">I have existing blog posts</span>
          </label>
          
          <label className="flex items-center space-x-2">
            <Checkbox
              checked={data.hasSocialHistory}
              onCheckedChange={(checked) => onChange({ hasSocialHistory: checked })}
            />
            <span className="text-sm">I have existing social media content</span>
          </label>
        </div>
        
        {(data.hasYouTubeHistory || data.hasBlogHistory || data.hasSocialHistory) && (
          <p className="text-xs text-muted-foreground p-3 bg-muted/50 rounded-lg">
            We'll import and analyze your existing content after onboarding to better match your style
          </p>
        )}
      </Card>
    </div>
  )
}