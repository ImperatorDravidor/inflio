"use client"

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  User, Briefcase, Target, TrendingUp, Clock, Lightbulb,
  CheckCircle, ChevronLeft, ChevronRight, Info, Sparkles,
  Upload, X, Eye, Plus, Trash2, Hash, Calendar, Users,
  Code, Palette, Heart, Dumbbell, Plane, Music, Monitor,
  BookOpen, ShoppingBag, Megaphone, DollarSign, Coffee,
  Gamepad, MessageSquare
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface CreatorProfileData {
  // Personal
  fullName: string
  title: string
  companyName?: string
  yearsExperience?: string
  profilePhoto?: string
  
  // Content Details
  contentNiche: string[]
  experienceLevel?: string
  audienceSize?: string
  
  // Goals
  primaryGoal?: string
  secondaryGoals: string[]
  successMetrics: string[]
  
  // Strategy
  contentPillars: string[]
  uniqueValue?: string
  targetAudienceAge: string[]
  targetAudienceGeo: string[]
  targetAudienceInterests: string[]
  audiencePainPoints?: string
  
  // Workflow
  contentFrequency?: string
  timePerPiece?: string
  biggestChallenges: string[]
}

interface CreatorProfileProps {
  formData: Partial<CreatorProfileData>
  updateFormData: (key: string, value: any) => void
  onComplete: () => void
  onBack?: () => void
}

// Content niches with icons
const CONTENT_NICHES = [
  { value: 'technology', label: 'Technology & Innovation', icon: Code },
  { value: 'business', label: 'Business & Entrepreneurship', icon: Briefcase },
  { value: 'health', label: 'Health & Wellness', icon: Heart },
  { value: 'education', label: 'Education & Learning', icon: BookOpen },
  { value: 'entertainment', label: 'Entertainment & Gaming', icon: Gamepad },
  { value: 'lifestyle', label: 'Lifestyle & Fashion', icon: Palette },
  { value: 'food', label: 'Food & Cooking', icon: Coffee },
  { value: 'travel', label: 'Travel & Adventure', icon: Plane },
  { value: 'finance', label: 'Finance & Investment', icon: DollarSign },
  { value: 'creative', label: 'Arts & Creative', icon: Palette },
  { value: 'fitness', label: 'Sports & Fitness', icon: Dumbbell },
  { value: 'parenting', label: 'Parenting & Family', icon: Users },
  { value: 'music', label: 'Music & Audio', icon: Music },
  { value: 'marketing', label: 'Marketing & Sales', icon: Megaphone },
  { value: 'productivity', label: 'Productivity & Tools', icon: Monitor },
]

const SECTIONS = [
  { id: 'personal', title: 'Personal Information', icon: User },
  { id: 'content', title: 'Content Creator Details', icon: Sparkles },
  { id: 'goals', title: 'Goals & Objectives', icon: Target },
  { id: 'strategy', title: 'Content Strategy', icon: Lightbulb },
  { id: 'workflow', title: 'Current Workflow', icon: Clock },
]

export function CreatorProfileComprehensive({
  formData,
  updateFormData,
  onComplete,
  onBack,
}: CreatorProfileProps) {
  const [currentSection, setCurrentSection] = useState(0)
  const [completedSections, setCompletedSections] = useState<string[]>([])
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [newPillar, setNewPillar] = useState('')
  const [newInterest, setNewInterest] = useState('')

  // Calculate completion percentage
  const requiredFields = {
    personal: ['fullName', 'title'],
    content: ['contentNiche'],
    goals: ['primaryGoal'],
    strategy: ['contentPillars'],
    workflow: []
  }

  const calculateSectionCompletion = (sectionId: string) => {
    const required = requiredFields[sectionId as keyof typeof requiredFields] || []
    if (required.length === 0) return 100
    
    const completed = required.filter(field => {
      const value = formData[field as keyof CreatorProfileData]
      return Array.isArray(value) ? value.length > 0 : !!value
    }).length
    
    return (completed / required.length) * 100
  }

  const overallCompletion = Math.round(
    SECTIONS.reduce((acc, section) => acc + calculateSectionCompletion(section.id), 0) / SECTIONS.length
  )

  // Validate current section
  const validateSection = () => {
    const errors: Record<string, string> = {}
    const section = SECTIONS[currentSection]
    
    if (section.id === 'personal') {
      if (!formData.fullName?.trim()) errors.fullName = 'Full name is required'
      if (!formData.title?.trim()) errors.title = 'Professional title is required'
    } else if (section.id === 'content') {
      if (!formData.contentNiche || formData.contentNiche.length === 0) {
        errors.contentNiche = 'Select at least one content niche'
      }
    } else if (section.id === 'goals') {
      if (!formData.primaryGoal) errors.primaryGoal = 'Select your primary goal'
    } else if (section.id === 'strategy') {
      if (!formData.contentPillars || formData.contentPillars.length < 3) {
        errors.contentPillars = 'Add at least 3 content pillars'
      }
    }
    
    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Handle next section
  const handleNext = () => {
    if (!validateSection()) {
      toast.error('Please complete all required fields')
      return
    }
    
    const currentId = SECTIONS[currentSection].id
    if (!completedSections.includes(currentId)) {
      setCompletedSections([...completedSections, currentId])
    }
    
    if (currentSection < SECTIONS.length - 1) {
      setCurrentSection(currentSection + 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      // Final completion
      onComplete()
    }
  }

  // Handle previous section
  const handlePrevious = () => {
    if (currentSection > 0) {
      setCurrentSection(currentSection - 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else if (onBack) {
      onBack()
    }
  }

  // Handle checkbox toggle for arrays
  const toggleArrayValue = (field: keyof CreatorProfileData, value: string) => {
    const current = (formData[field] as string[]) || []
    const updated = current.includes(value)
      ? current.filter(v => v !== value)
      : [...current, value]
    updateFormData(field, updated)
  }

  // Add content pillar
  const addContentPillar = () => {
    if (!newPillar.trim()) return
    const pillars = formData.contentPillars || []
    if (pillars.length >= 5) {
      toast.error('Maximum 5 content pillars allowed')
      return
    }
    updateFormData('contentPillars', [...pillars, newPillar.trim()])
    setNewPillar('')
    toast.success('Content pillar added')
  }

  // Remove content pillar
  const removePillar = (index: number) => {
    const pillars = formData.contentPillars || []
    updateFormData('contentPillars', pillars.filter((_, i) => i !== index))
  }

  // Add interest
  const addInterest = () => {
    if (!newInterest.trim()) return
    const interests = formData.targetAudienceInterests || []
    if (interests.length >= 10) {
      toast.error('Maximum 10 interests allowed')
      return
    }
    updateFormData('targetAudienceInterests', [...interests, newInterest.trim()])
    setNewInterest('')
  }

  const currentSectionData = SECTIONS[currentSection]
  const SectionIcon = currentSectionData.icon

  return (
    <div className="max-w-4xl mx-auto pb-32">
      {/* Header */}
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-bold mb-2">Tell Us About You</h2>
        <p className="text-muted-foreground">
          This helps AI understand your content style and create better posts
        </p>
        <Progress value={overallCompletion} className="mt-4 h-2" />
        <p className="text-sm text-muted-foreground mt-2">
          {overallCompletion}% Complete
        </p>
      </div>

      {/* Section Progress */}
      <div className="mb-8 flex justify-center gap-2">
        {SECTIONS.map((section, index) => {
          const Icon = section.icon
          const isActive = index === currentSection
          const isCompleted = completedSections.includes(section.id)
          const sectionProgress = calculateSectionCompletion(section.id)
          
          return (
            <button
              key={section.id}
              onClick={() => setCurrentSection(index)}
              className={cn(
                "flex flex-col items-center gap-2 p-3 rounded-lg transition-all",
                isActive && "bg-primary/10 ring-2 ring-primary",
                !isActive && "hover:bg-muted"
              )}
            >
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
                isCompleted ? "bg-green-500 text-white" :
                isActive ? "bg-primary text-primary-foreground" :
                "bg-muted text-muted-foreground"
              )}>
                {isCompleted ? <CheckCircle className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
              </div>
              <span className="text-xs font-medium text-center hidden md:block">
                {section.title}
              </span>
              <span className="text-xs text-muted-foreground hidden md:block">
                {Math.round(sectionProgress)}%
              </span>
            </button>
          )
        })}
      </div>

      {/* Current Section Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentSection}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-lg bg-primary/10">
                <SectionIcon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-semibold">{currentSectionData.title}</h3>
                <p className="text-sm text-muted-foreground">
                  Section {currentSection + 1} of {SECTIONS.length}
                </p>
              </div>
            </div>

            <Separator className="mb-6" />

            {/* Section 1: Personal Information */}
            {currentSectionData.id === 'personal' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">
                      Full Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="fullName"
                      value={formData.fullName || ''}
                      onChange={(e) => updateFormData('fullName', e.target.value)}
                      placeholder="John Doe"
                      className={validationErrors.fullName ? 'border-red-500' : ''}
                    />
                    {validationErrors.fullName && (
                      <p className="text-xs text-red-500">{validationErrors.fullName}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="title">
                      Professional Title/Role <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="title"
                      value={formData.title || ''}
                      onChange={(e) => updateFormData('title', e.target.value)}
                      placeholder="Content Creator, CEO, Educator..."
                      className={validationErrors.title ? 'border-red-500' : ''}
                    />
                    {validationErrors.title && (
                      <p className="text-xs text-red-500">{validationErrors.title}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="companyName">Company/Brand Name</Label>
                    <Input
                      id="companyName"
                      value={formData.companyName || ''}
                      onChange={(e) => updateFormData('companyName', e.target.value)}
                      placeholder="Optional"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="yearsExperience">Years of Experience</Label>
                    <Select
                      value={formData.yearsExperience || ''}
                      onValueChange={(value) => updateFormData('yearsExperience', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select experience level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="<1">Less than 1 year</SelectItem>
                        <SelectItem value="1-3">1-3 years</SelectItem>
                        <SelectItem value="3-5">3-5 years</SelectItem>
                        <SelectItem value="5-10">5-10 years</SelectItem>
                        <SelectItem value="10+">10+ years</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    This information helps AI personalize content for your professional identity
                  </AlertDescription>
                </Alert>
              </div>
            )}

            {/* Section 2: Content Creator Details */}
            {currentSectionData.id === 'content' && (
              <div className="space-y-6">
                <div className="space-y-3">
                  <Label>
                    Content Niche <span className="text-red-500">*</span>
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Select all that apply to your content focus
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {CONTENT_NICHES.map((niche) => {
                      const Icon = niche.icon
                      const isSelected = (formData.contentNiche || []).includes(niche.value)
                      return (
                        <button
                          key={niche.value}
                          onClick={() => toggleArrayValue('contentNiche', niche.value)}
                          className={cn(
                            "flex items-center gap-3 p-3 rounded-lg border-2 transition-all text-left",
                            isSelected
                              ? "border-primary bg-primary/10"
                              : "border-muted hover:border-primary/50"
                          )}
                        >
                          <Icon className={cn(
                            "h-5 w-5",
                            isSelected ? "text-primary" : "text-muted-foreground"
                          )} />
                          <span className="text-sm font-medium">{niche.label}</span>
                        </button>
                      )
                    })}
                  </div>
                  {validationErrors.contentNiche && (
                    <p className="text-xs text-red-500">{validationErrors.contentNiche}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Content Experience Level</Label>
                    <Select
                      value={formData.experienceLevel || ''}
                      onValueChange={(value) => updateFormData('experienceLevel', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select your level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="beginner">Beginner (just starting)</SelectItem>
                        <SelectItem value="intermediate">Intermediate (1-2 years)</SelectItem>
                        <SelectItem value="advanced">Advanced (3-5 years)</SelectItem>
                        <SelectItem value="expert">Expert (5+ years)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Current Audience Size</Label>
                    <Select
                      value={formData.audienceSize || ''}
                      onValueChange={(value) => updateFormData('audienceSize', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select audience size" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0-100">Just starting (0-100)</SelectItem>
                        <SelectItem value="100-1k">Growing (100-1K)</SelectItem>
                        <SelectItem value="1k-10k">Established (1K-10K)</SelectItem>
                        <SelectItem value="10k-100k">Influencer (10K-100K)</SelectItem>
                        <SelectItem value="100k+">Authority (100K+)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}

            {/* Section 3: Goals & Objectives */}
            {currentSectionData.id === 'goals' && (
              <div className="space-y-6">
                <div className="space-y-3">
                  <Label>
                    Primary Goal <span className="text-red-500">*</span>
                  </Label>
                  <RadioGroup
                    value={formData.primaryGoal || ''}
                    onValueChange={(value) => updateFormData('primaryGoal', value)}
                    className="space-y-3"
                  >
                    {[
                      { value: 'build-audience', label: 'Build audience from scratch', desc: 'Start growing your follower base' },
                      { value: 'accelerate-growth', label: 'Accelerate growth', desc: 'Scale existing audience faster' },
                      { value: 'monetize', label: 'Monetize existing audience', desc: 'Turn followers into revenue' },
                      { value: 'thought-leadership', label: 'Establish thought leadership', desc: 'Become an industry authority' },
                      { value: 'generate-leads', label: 'Generate leads for business', desc: 'Convert audience to customers' },
                      { value: 'personal-brand', label: 'Build personal brand', desc: 'Create a recognizable identity' },
                    ].map((goal) => (
                      <div key={goal.value} className="flex items-start space-x-3 p-4 rounded-lg border hover:bg-muted/50 transition-colors">
                        <RadioGroupItem value={goal.value} id={goal.value} />
                        <div className="flex-1">
                          <Label htmlFor={goal.value} className="cursor-pointer font-medium">
                            {goal.label}
                          </Label>
                          <p className="text-xs text-muted-foreground mt-1">{goal.desc}</p>
                        </div>
                      </div>
                    ))}
                  </RadioGroup>
                  {validationErrors.primaryGoal && (
                    <p className="text-xs text-red-500">{validationErrors.primaryGoal}</p>
                  )}
                </div>

                <Separator />

                <div className="space-y-3">
                  <Label>Secondary Goals (select multiple)</Label>
                  <div className="space-y-2">
                    {[
                      'increase-engagement',
                      'save-time',
                      'maintain-consistency',
                      'expand-platforms',
                      'create-viral-content',
                      'build-email-list',
                    ].map((goal) => (
                      <div key={goal} className="flex items-center space-x-2">
                        <Checkbox
                          id={goal}
                          checked={(formData.secondaryGoals || []).includes(goal)}
                          onCheckedChange={() => toggleArrayValue('secondaryGoals', goal)}
                        />
                        <Label htmlFor={goal} className="cursor-pointer capitalize">
                          {goal.replace(/-/g, ' ')}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>Success Metrics (what matters most)</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      'follower-growth',
                      'engagement-rate',
                      'revenue',
                      'lead-quality',
                      'brand-partnerships',
                      'community-building',
                    ].map((metric) => (
                      <div key={metric} className="flex items-center space-x-2">
                        <Checkbox
                          id={metric}
                          checked={(formData.successMetrics || []).includes(metric)}
                          onCheckedChange={() => toggleArrayValue('successMetrics', metric)}
                        />
                        <Label htmlFor={metric} className="cursor-pointer capitalize text-sm">
                          {metric.replace(/-/g, ' ')}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Section 4: Content Strategy */}
            {currentSectionData.id === 'strategy' && (
              <div className="space-y-6">
                <div className="space-y-3">
                  <Label>
                    Content Pillars <span className="text-red-500">*</span>
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Add 3-5 main topics you create content about
                  </p>
                  <div className="flex gap-2">
                    <Input
                      value={newPillar}
                      onChange={(e) => setNewPillar(e.target.value)}
                      placeholder="e.g., AI Tools, Productivity Tips, Tech Reviews"
                      onKeyPress={(e) => e.key === 'Enter' && addContentPillar()}
                    />
                    <Button onClick={addContentPillar} type="button">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(formData.contentPillars || []).map((pillar, index) => (
                      <Badge key={index} variant="secondary" className="pl-3 pr-1">
                        <Hash className="h-3 w-3 mr-1" />
                        {pillar}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-auto p-1 ml-1"
                          onClick={() => removePillar(index)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                  {validationErrors.contentPillars && (
                    <p className="text-xs text-red-500">{validationErrors.contentPillars}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Unique Value Proposition</Label>
                  <Textarea
                    value={formData.uniqueValue || ''}
                    onChange={(e) => updateFormData('uniqueValue', e.target.value)}
                    placeholder="What makes your content unique? Why should people follow you?"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Target Audience - Pain Points</Label>
                  <Textarea
                    value={formData.audiencePainPoints || ''}
                    onChange={(e) => updateFormData('audiencePainPoints', e.target.value)}
                    placeholder="What problems does your audience face that you solve?"
                    rows={3}
                  />
                </div>

                <div className="space-y-3">
                  <Label>Audience Interests</Label>
                  <div className="flex gap-2">
                    <Input
                      value={newInterest}
                      onChange={(e) => setNewInterest(e.target.value)}
                      placeholder="Add interest tags..."
                      onKeyPress={(e) => e.key === 'Enter' && addInterest()}
                    />
                    <Button onClick={addInterest} type="button">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(formData.targetAudienceInterests || []).map((interest, index) => (
                      <Badge key={index} variant="outline">
                        {interest}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-auto p-1 ml-1"
                          onClick={() => {
                            const interests = formData.targetAudienceInterests || []
                            updateFormData('targetAudienceInterests', interests.filter((_, i) => i !== index))
                          }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Section 5: Current Workflow */}
            {currentSectionData.id === 'workflow' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Content Creation Frequency</Label>
                    <Select
                      value={formData.contentFrequency || ''}
                      onValueChange={(value) => updateFormData('contentFrequency', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="How often do you post?" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="3-5-week">3-5 times per week</SelectItem>
                        <SelectItem value="1-2-week">1-2 times per week</SelectItem>
                        <SelectItem value="bi-weekly">Bi-weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Time per Content Piece</Label>
                    <Select
                      value={formData.timePerPiece || ''}
                      onValueChange={(value) => updateFormData('timePerPiece', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Average creation time" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="<1">Less than 1 hour</SelectItem>
                        <SelectItem value="1-3">1-3 hours</SelectItem>
                        <SelectItem value="3-5">3-5 hours</SelectItem>
                        <SelectItem value="5-10">5-10 hours</SelectItem>
                        <SelectItem value="10+">10+ hours</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>Biggest Challenges</Label>
                  <p className="text-sm text-muted-foreground">
                    Select what you struggle with most
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {[
                      'coming-up-with-ideas',
                      'creating-engaging-hooks',
                      'writing-captions',
                      'designing-visuals',
                      'editing-videos',
                      'staying-consistent',
                      'growing-audience',
                      'time-management',
                    ].map((challenge) => (
                      <div key={challenge} className="flex items-center space-x-2">
                        <Checkbox
                          id={challenge}
                          checked={(formData.biggestChallenges || []).includes(challenge)}
                          onCheckedChange={() => toggleArrayValue('biggestChallenges', challenge)}
                        />
                        <Label htmlFor={challenge} className="cursor-pointer capitalize text-sm">
                          {challenge.replace(/-/g, ' ')}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <Alert className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800 dark:text-green-200">
                    Great! This information helps AI understand your workflow and optimize content generation for your specific needs.
                  </AlertDescription>
                </Alert>
              </div>
            )}
          </Card>
        </motion.div>
      </AnimatePresence>

      {/* Navigation - Fixed at bottom */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4 z-40">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={handlePrevious}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            {currentSection === 0 ? 'Back' : 'Previous'}
          </Button>

          <div className="text-sm text-muted-foreground">
            Section {currentSection + 1} of {SECTIONS.length}
          </div>

          <Button onClick={handleNext}>
            {currentSection === SECTIONS.length - 1 ? 'Complete' : 'Next'}
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  )
}


