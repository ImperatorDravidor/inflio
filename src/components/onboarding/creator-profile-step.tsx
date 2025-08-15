"use client"

import { useState } from 'react'
import { User, Briefcase, Target, Hash, Plus, X, Sparkles, TrendingUp } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

const INDUSTRIES = [
  'Technology', 'Education', 'Healthcare', 'Finance', 'E-commerce', 
  'Marketing', 'Entertainment', 'Fashion', 'Food & Beverage', 
  'Travel', 'Real Estate', 'Fitness', 'Gaming', 'Photography',
  'Music', 'Art & Design', 'Consulting', 'Non-profit', 'Other'
]

const CONTENT_PURPOSES = [
  'Personal Brand Growth',
  'Sales Enablement', 
  'Education & Training',
  'Inspiration & Motivation',
  'Entertainment',
  'Community Building',
  'Thought Leadership',
  'Product Promotion',
  'Service Marketing'
]

const SUGGESTED_PILLARS = {
  'Technology': ['Tech Reviews', 'Tutorials', 'Industry News', 'Product Launches', 'AI & Innovation'],
  'Education': ['Study Tips', 'Course Content', 'Career Advice', 'Skill Development', 'EdTech'],
  'Marketing': ['Growth Strategies', 'Case Studies', 'Marketing Tips', 'Analytics', 'Social Media'],
  'Fitness': ['Workouts', 'Nutrition', 'Wellness Tips', 'Progress Stories', 'Equipment Reviews'],
  'Entertainment': ['Behind the Scenes', 'Reviews', 'Interviews', 'Fan Content', 'Industry News']
}

interface CreatorProfileStepProps {
  data: any
  onChange: (updates: any) => void
}

export function CreatorProfileStep({ data, onChange }: CreatorProfileStepProps) {
  const [currentPillar, setCurrentPillar] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  
  const pillars = data.contentPillars || []
  const suggestedPillars = SUGGESTED_PILLARS[data.industry as keyof typeof SUGGESTED_PILLARS] || []

  const addPillar = (pillar: string) => {
    if (pillar && !pillars.includes(pillar) && pillars.length < 5) {
      onChange({ contentPillars: [...pillars, pillar] })
      setCurrentPillar('')
    }
  }

  const removePillar = (index: number) => {
    onChange({ 
      contentPillars: pillars.filter((_: string, i: number) => i !== index) 
    })
  }

  const fieldCompletion = {
    name: !!data.fullName?.trim(),
    title: !!data.title?.trim(),
    bio: !!data.bio?.trim() && data.bio.length >= 20,
    industry: !!data.industry,
    audience: !!data.audience?.trim(),
    purpose: !!data.contentPurpose,
    pillars: pillars.length >= 3
  }

  const completionPercentage = Math.round(
    (Object.values(fieldCompletion).filter(Boolean).length / Object.keys(fieldCompletion).length) * 100
  )

  return (
    <div className="space-y-6">
      {/* Progress Indicator */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 rounded-lg">
        <div>
          <p className="font-medium">Profile Completion</p>
          <p className="text-sm text-muted-foreground">Help your AI understand you better</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-green-600">{completionPercentage}%</div>
          <div className="flex gap-1 mt-1">
            {Object.values(fieldCompletion).map((complete, i) => (
              <div
                key={i}
                className={cn(
                  "h-1 w-8 rounded-full",
                  complete ? "bg-green-500" : "bg-gray-300"
                )}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Basic Information */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <User className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Basic Information</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">
              Full Name *
              {fieldCompletion.name && <Check className="h-3 w-3 inline ml-2 text-green-500" />}
            </Label>
            <Input
              id="fullName"
              placeholder="John Doe"
              value={data.fullName || ''}
              onChange={(e) => onChange({ fullName: e.target.value })}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="title">
              Title/Role
              {fieldCompletion.title && <Check className="h-3 w-3 inline ml-2 text-green-500" />}
            </Label>
            <Input
              id="title"
              placeholder="Content Creator, CEO, Coach..."
              value={data.title || ''}
              onChange={(e) => onChange({ title: e.target.value })}
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="companyName">Company (Optional)</Label>
          <Input
            id="companyName"
            placeholder="Your company or brand name"
            value={data.companyName || ''}
            onChange={(e) => onChange({ companyName: e.target.value })}
          />
        </div>
      </Card>

      {/* Bio & Purpose */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Your Story</h3>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="bio">
            Short Bio * 
            <span className="text-xs text-muted-foreground ml-2">
              ({data.bio?.length || 0}/200)
            </span>
            {fieldCompletion.bio && <Check className="h-3 w-3 inline ml-2 text-green-500" />}
          </Label>
          <Textarea
            id="bio"
            placeholder="Tell us what you do in 2-3 sentences. This helps personalize your AI's voice..."
            value={data.bio || ''}
            onChange={(e) => onChange({ bio: e.target.value.slice(0, 200) })}
            rows={3}
            className={cn(
              "transition-colors",
              data.bio?.length >= 20 && "border-green-500/50"
            )}
          />
          <p className="text-xs text-muted-foreground">
            {data.bio?.length < 20 && `Add ${20 - (data.bio?.length || 0)} more characters`}
          </p>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="mission">Mission Statement (Optional)</Label>
          <Textarea
            id="mission"
            placeholder="What drives your content creation? What impact do you want to make?"
            value={data.mission || ''}
            onChange={(e) => onChange({ mission: e.target.value })}
            rows={2}
          />
        </div>
      </Card>

      {/* Industry & Audience */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Briefcase className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Industry & Audience</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="industry">
              Industry *
              {fieldCompletion.industry && <Check className="h-3 w-3 inline ml-2 text-green-500" />}
            </Label>
            <Select
              value={data.industry || ''}
              onValueChange={(value) => {
                onChange({ industry: value })
                setShowSuggestions(true)
              }}
            >
              <SelectTrigger id="industry">
                <SelectValue placeholder="Select your industry" />
              </SelectTrigger>
              <SelectContent>
                {INDUSTRIES.map((industry) => (
                  <SelectItem key={industry} value={industry}>
                    {industry}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="audience">
              Target Audience
              {fieldCompletion.audience && <Check className="h-3 w-3 inline ml-2 text-green-500" />}
            </Label>
            <Input
              id="audience"
              placeholder="e.g., Entrepreneurs, Students, Parents..."
              value={data.audience || ''}
              onChange={(e) => onChange({ audience: e.target.value })}
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="contentPurpose">
            Content Purpose *
            {fieldCompletion.purpose && <Check className="h-3 w-3 inline ml-2 text-green-500" />}
          </Label>
          <Select
            value={data.contentPurpose || ''}
            onValueChange={(value) => onChange({ contentPurpose: value })}
          >
            <SelectTrigger id="contentPurpose">
              <SelectValue placeholder="What's your main goal?" />
            </SelectTrigger>
            <SelectContent>
              {CONTENT_PURPOSES.map((purpose) => (
                <SelectItem key={purpose} value={purpose}>
                  {purpose}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Content Pillars */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Hash className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">
            Content Pillars
            {fieldCompletion.pillars && <Check className="h-3 w-3 inline ml-2 text-green-500" />}
          </h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Add 3-5 main topics you create content about
        </p>
        
        {/* Suggested Pillars */}
        {showSuggestions && suggestedPillars.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="p-3 bg-primary/5 rounded-lg space-y-2"
          >
            <p className="text-xs font-medium flex items-center gap-2">
              <TrendingUp className="h-3 w-3" />
              Suggested for {data.industry}
            </p>
            <div className="flex flex-wrap gap-2">
              {suggestedPillars
                .filter((p: string) => !pillars.includes(p))
                .map((pillar: string) => (
                  <Badge
                    key={pillar}
                    variant="outline"
                    className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                    onClick={() => addPillar(pillar)}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    {pillar}
                  </Badge>
                ))}
            </div>
          </motion.div>
        )}
        
        <div className="flex gap-2">
          <Input
            placeholder="e.g., Marketing Tips, Product Reviews..."
            value={currentPillar}
            onChange={(e) => setCurrentPillar(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                addPillar(currentPillar)
              }
            }}
            disabled={pillars.length >= 5}
          />
          <Button
            type="button"
            onClick={() => addPillar(currentPillar)}
            disabled={!currentPillar || pillars.length >= 5}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Current Pillars */}
        <AnimatePresence>
          {pillars.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-wrap gap-2"
            >
              {pillars.map((pillar: string, i: number) => (
                <motion.div
                  key={pillar}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                >
                  <Badge variant="secondary" className="pl-3 pr-1 py-1.5">
                    {pillar}
                    <button
                      onClick={() => removePillar(i)}
                      className="ml-2 p-0.5 hover:bg-destructive hover:text-destructive-foreground rounded-full transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
        
        {pillars.length < 3 && (
          <p className="text-xs text-orange-500">
            Add {3 - pillars.length} more pillar{3 - pillars.length !== 1 ? 's' : ''} (minimum 3 required)
          </p>
        )}
      </Card>
    </div>
  )
}

// Add this import at the top of the file
import { Check } from 'lucide-react'