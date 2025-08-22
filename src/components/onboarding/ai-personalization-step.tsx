"use client"

import { useState } from 'react'
import { Zap, MessageSquare, Mail, Hash, Plus, X, Brain, Sparkles, Target } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Slider } from '@/components/ui/slider'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

const CAPTION_STYLES = [
  { id: 'smart', label: 'Smart & Insightful', emoji: '🧠', desc: 'Data-driven, analytical' },
  { id: 'hype', label: 'Hype & Energy', emoji: '🔥', desc: 'Exciting, enthusiastic' },
  { id: 'educational', label: 'Educational', emoji: '📚', desc: 'Teaching, informative' },
  { id: 'funny', label: 'Funny & Entertaining', emoji: '😄', desc: 'Humor, wit, fun' },
  { id: 'direct', label: 'Direct & Clear', emoji: '🎯', desc: 'Straight to the point' },
  { id: 'storytelling', label: 'Storytelling', emoji: '📖', desc: 'Narrative, engaging' }
]

const CTA_OPTIONS = [
  { id: 'dm-me', label: 'DM me', icon: MessageSquare },
  { id: 'comment', label: 'Comment below', icon: MessageSquare },
  { id: 'link-bio', label: 'Link in bio', icon: Target },
  { id: 'newsletter', label: 'Join newsletter', icon: Mail },
  { id: 'book-call', label: 'Book a call', icon: Zap },
  { id: 'visit-site', label: 'Visit website', icon: Target },
  { id: 'share', label: 'Share this', icon: Hash },
  { id: 'save', label: 'Save for later', icon: Target }
]

const NEWSLETTER_STYLES = [
  'Weekly Digest',
  'Personal Letter',
  'Case Study Deep Dive',
  'Tactical Tips & Tricks',
  'Industry Roundup',
  'Behind the Scenes'
]

const AI_SETTINGS = {
  creativity: {
    label: 'Creativity Level',
    desc: 'How creative vs. conservative should AI be?',
    min: 0,
    max: 100,
    step: 10,
    default: 70
  },
  formality: {
    label: 'Formality',
    desc: 'Professional vs. casual tone',
    min: 0,
    max: 100,
    step: 10,
    default: 50
  },
  emoji: {
    label: 'Emoji Usage',
    desc: 'How often to use emojis',
    min: 0,
    max: 100,
    step: 10,
    default: 30
  }
}

interface AIPersonalizationStepProps {
  data: any
  onChange: (updates: any) => void
}

export function AIPersonalizationStep({ data, onChange }: AIPersonalizationStepProps) {
  const [currentToneRef, setCurrentToneRef] = useState('')
  const [currentHashtag, setCurrentHashtag] = useState('')
  
  const captionStyle = data.captionStyle || ''
  const ctaPreferences = data.ctaPreferences || []
  const newsletterStyle = data.newsletterStyle || ''
  const toneReferences = data.toneReferences || []
  const preferredHashtags = data.preferredHashtags || []
  const aiSettings = data.aiSettings || {
    creativity: 70,
    formality: 50,
    emoji: 30
  }

  const toggleCTA = (ctaId: string) => {
    if (ctaPreferences.includes(ctaId)) {
      onChange({ ctaPreferences: ctaPreferences.filter((c: string) => c !== ctaId) })
    } else {
      onChange({ ctaPreferences: [...ctaPreferences, ctaId] })
    }
  }

  const addToneRef = (ref: string) => {
    if (ref && !toneReferences.includes(ref)) {
      onChange({ toneReferences: [...toneReferences, ref] })
      setCurrentToneRef('')
    }
  }

  const addHashtag = (tag: string) => {
    const formattedTag = tag.startsWith('#') ? tag : `#${tag}`
    if (formattedTag && !preferredHashtags.includes(formattedTag)) {
      onChange({ preferredHashtags: [...preferredHashtags, formattedTag] })
      setCurrentHashtag('')
    }
  }

  const updateAISetting = (key: string, value: number) => {
    onChange({
      aiSettings: {
        ...aiSettings,
        [key]: value
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* AI Personality Preview */}
      <Card className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <Brain className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="font-semibold">Your AI Personality</h3>
            <p className="text-sm text-muted-foreground">
              {captionStyle ? CAPTION_STYLES.find(s => s.id === captionStyle)?.label : 'Not configured yet'}
            </p>
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold">{aiSettings.creativity}%</div>
            <p className="text-xs text-muted-foreground">Creative</p>
          </div>
          <div>
            <div className="text-2xl font-bold">{aiSettings.formality}%</div>
            <p className="text-xs text-muted-foreground">Formal</p>
          </div>
          <div>
            <div className="text-2xl font-bold">{aiSettings.emoji}%</div>
            <p className="text-xs text-muted-foreground">Emojis</p>
          </div>
        </div>
      </Card>

      {/* Caption Style */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <MessageSquare className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Caption Style</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          How should your captions feel?
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {CAPTION_STYLES.map((style) => {
            const isSelected = captionStyle === style.id
            
            return (
              <motion.button
                key={style.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onChange({ captionStyle: style.id })}
                className={cn(
                  "flex items-center gap-3 p-4 rounded-lg border-2 text-left transition-all",
                  isSelected
                    ? "border-primary bg-primary/5 shadow-lg"
                    : "border-muted hover:border-primary/50"
                )}
              >
                <span className="text-2xl">{style.emoji}</span>
                <div className="flex-1">
                  <p className="font-medium">{style.label}</p>
                  <p className="text-xs text-muted-foreground">{style.desc}</p>
                </div>
                {isSelected && (
                  <Badge variant="default" className="ml-auto">
                    Selected
                  </Badge>
                )}
              </motion.button>
            )
          })}
        </div>
      </Card>

      {/* AI Fine-tuning */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">AI Fine-tuning</h3>
        </div>
        
        {Object.entries(AI_SETTINGS).map(([key, setting]) => {
          const value = aiSettings[key as keyof typeof aiSettings] || setting.default
          
          return (
            <div key={key} className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <Label>{setting.label}</Label>
                  <p className="text-xs text-muted-foreground">{setting.desc}</p>
                </div>
                <Badge variant="outline">{value}%</Badge>
              </div>
              <Slider
                value={[value]}
                onValueChange={([v]) => updateAISetting(key, v)}
                min={setting.min}
                max={setting.max}
                step={setting.step}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{key === 'creativity' ? 'Conservative' : key === 'formality' ? 'Casual' : 'None'}</span>
                <span>{key === 'creativity' ? 'Creative' : key === 'formality' ? 'Professional' : 'Lots'}</span>
              </div>
            </div>
          )
        })}
      </Card>

      {/* Preferred CTAs */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Target className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Preferred CTAs</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          What actions do you want your audience to take?
        </p>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {CTA_OPTIONS.map((cta) => {
            const isSelected = ctaPreferences.includes(cta.id)
            const Icon = cta.icon
            
            return (
              <label
                key={cta.id}
                className={cn(
                  "flex flex-col items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all",
                  isSelected
                    ? "border-primary bg-primary/5"
                    : "border-muted hover:border-primary/50"
                )}
              >
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => toggleCTA(cta.id)}
                  className="sr-only"
                />
                <Icon className={cn(
                  "h-5 w-5",
                  isSelected ? "text-primary" : "text-muted-foreground"
                )} />
                <span className="text-xs text-center">{cta.label}</span>
              </label>
            )
          })}
        </div>
      </Card>

      {/* Newsletter Style */}
      {data.contentTypes?.includes('newsletters') && (
        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Mail className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Newsletter Style</h3>
          </div>
          
          <Select
            value={newsletterStyle}
            onValueChange={(value) => onChange({ newsletterStyle: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select newsletter format" />
            </SelectTrigger>
            <SelectContent>
              {NEWSLETTER_STYLES.map((style) => (
                <SelectItem key={style} value={style}>
                  {style}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Card>
      )}

      {/* Language & References */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Hash className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Language & References</h3>
        </div>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="language">Language Preferences</Label>
            <Textarea
              id="language"
              placeholder="e.g., Use American English, avoid jargon, ok with casual slang, prefer active voice..."
              value={data.languagePreferences || ''}
              onChange={(e) => onChange({ languagePreferences: e.target.value })}
              rows={2}
            />
          </div>
          
          <div>
            <Label>Tone Reference Accounts</Label>
            <p className="text-sm text-muted-foreground mb-2">
              Accounts whose writing style you admire
            </p>
            <div className="flex gap-2">
              <Input
                placeholder="@account for tone inspiration"
                value={currentToneRef}
                onChange={(e) => setCurrentToneRef(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addToneRef(currentToneRef)
                  }
                }}
              />
              <Button
                type="button"
                size="sm"
                onClick={() => addToneRef(currentToneRef)}
                disabled={!currentToneRef}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {toneReferences.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {toneReferences.map((ref: string, i: number) => (
                  <Badge key={i} variant="outline">
                    {ref}
                    <button
                      onClick={() => onChange({
                        toneReferences: toneReferences.filter((_: string, idx: number) => idx !== i)
                      })}
                      className="ml-2 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
          
          <div>
            <Label>Preferred Hashtags</Label>
            <p className="text-sm text-muted-foreground mb-2">
              Hashtags you frequently use
            </p>
            <div className="flex gap-2">
              <Input
                placeholder="#hashtag"
                value={currentHashtag}
                onChange={(e) => setCurrentHashtag(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addHashtag(currentHashtag)
                  }
                }}
              />
              <Button
                type="button"
                size="sm"
                onClick={() => addHashtag(currentHashtag)}
                disabled={!currentHashtag}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {preferredHashtags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {preferredHashtags.map((tag: string, i: number) => (
                  <Badge key={i} variant="secondary">
                    {tag}
                    <button
                      onClick={() => onChange({
                        preferredHashtags: preferredHashtags.filter((_: string, idx: number) => idx !== i)
                      })}
                      className="ml-2 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  )
}