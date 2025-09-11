'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Upload, Palette, FileText, Image, FileType, X, Loader2, 
  CheckCircle, Sparkles, ChevronRight, Edit3, Save, Eye,
  Type, Volume2, Target, Users, Trophy, Lightbulb, AlertCircle,
  FileImage, FileVideo, FilePlus, Wand2, Book, ArrowRight
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface BrandIdentityEnhancedProps {
  formData: any
  updateFormData: (key: string, value: any) => void
  onComplete?: () => void
}

interface UploadedFile {
  id: string
  file: File
  preview?: string
  type: 'pdf' | 'image' | 'document' | 'other'
  status: 'pending' | 'analyzing' | 'complete' | 'error'
}

interface BrandAnalysis {
  colors: {
    primary: string[]
    secondary: string[]
    accent: string[]
    descriptions: Record<string, string>
  }
  typography: {
    primaryFont: string
    secondaryFont: string
    headingStyle: string
    bodyStyle: string
    recommendations: string[]
  }
  voice: {
    tone: string[]
    personality: string[]
    emotions: string[]
    keywords: string[]
    examples: string[]
  }
  visualStyle: {
    aesthetic: string[]
    imagery: string[]
    composition: string[]
    mood: string[]
  }
  targetAudience: {
    demographics: string[]
    psychographics: string[]
    painPoints: string[]
    aspirations: string[]
  }
  competitors: {
    direct: string[]
    indirect: string[]
    positioning: string
    differentiators: string[]
  }
  mission: {
    statement: string
    values: string[]
    vision: string
    purpose: string
  }
}

export function BrandIdentityEnhanced({ 
  formData, 
  updateFormData,
  onComplete 
}: BrandIdentityEnhancedProps) {
  const [mode, setMode] = useState<'upload' | 'manual' | null>(null)
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisProgress, setAnalysisProgress] = useState(0)
  const [analysisStep, setAnalysisStep] = useState('')
  const [brandAnalysis, setBrandAnalysis] = useState<BrandAnalysis | null>(formData.brandAnalysis || null)
  const [editMode, setEditMode] = useState<string | null>(null)
  const [manualStep, setManualStep] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)


  // Normalize AI analysis payload to ensure all fields exist and are arrays/strings as expected
  const normalizeAnalysis = useCallback((raw: any): BrandAnalysis => {
    const toArray = (v: any) => Array.isArray(v) ? v : (v ? [v] : [])
    const ensure = (v: any, fallback: any) => (v === undefined || v === null ? fallback : v)

    return {
      colors: {
        primary: toArray(raw?.colors?.primary),
        secondary: toArray(raw?.colors?.secondary),
        accent: toArray(raw?.colors?.accent),
        descriptions: ensure(raw?.colors?.descriptions, {})
      },
      typography: {
        primaryFont: ensure(raw?.typography?.primaryFont, ''),
        secondaryFont: ensure(raw?.typography?.secondaryFont, ''),
        headingStyle: ensure(raw?.typography?.headingStyle, ''),
        bodyStyle: ensure(raw?.typography?.bodyStyle, ''),
        recommendations: toArray(raw?.typography?.recommendations)
      },
      voice: {
        tone: toArray(raw?.voice?.tone),
        personality: toArray(raw?.voice?.personality),
        emotions: toArray(raw?.voice?.emotions),
        keywords: toArray(raw?.voice?.keywords),
        examples: toArray(raw?.voice?.examples)
      },
      visualStyle: {
        aesthetic: toArray(raw?.visualStyle?.aesthetic),
        imagery: toArray(raw?.visualStyle?.imagery),
        composition: toArray(raw?.visualStyle?.composition),
        mood: toArray(raw?.visualStyle?.mood)
      },
      targetAudience: {
        demographics: toArray(raw?.targetAudience?.demographics),
        psychographics: toArray(raw?.targetAudience?.psychographics),
        painPoints: toArray(raw?.targetAudience?.painPoints),
        aspirations: toArray(raw?.targetAudience?.aspirations)
      },
      competitors: {
        direct: toArray(raw?.competitors?.direct),
        indirect: toArray(raw?.competitors?.indirect),
        positioning: ensure(raw?.competitors?.positioning, ''),
        differentiators: toArray(raw?.competitors?.differentiators)
      },
      mission: {
        statement: ensure(raw?.mission?.statement, ''),
        values: toArray(raw?.mission?.values),
        vision: ensure(raw?.mission?.vision, ''),
        purpose: ensure(raw?.mission?.purpose, '')
      }
    }
  }, [])

  // File upload handler
  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    
    // Validate file count
    if (uploadedFiles.length + files.length > 10) {
      toast.error('Maximum 10 files allowed')
      return
    }
    
    const validFiles = files.filter(file => {
      // Validate file size - Files API supports up to 500MB per file!
      const maxSizeMB = 500
      if (file.size > maxSizeMB * 1024 * 1024) {
        toast.error(`${file.name} is too large (max ${maxSizeMB}MB per file)`)
        return false
      }
      return true
    })
    
    const newFiles: UploadedFile[] = validFiles.map(file => {
      const type = file.type.includes('pdf') ? 'pdf' :
                   file.type.includes('image') ? 'image' :
                   file.type.includes('document') || file.type.includes('text') ? 'document' :
                   'other'
      
      const id = Math.random().toString(36).substr(2, 9)
      
      // Create preview for images
      let preview: string | undefined
      if (type === 'image') {
        preview = URL.createObjectURL(file)
      }
      
      return {
        id,
        file,
        preview,
        type,
        status: 'pending' as const
      }
    })
    
    setUploadedFiles(prev => [...prev, ...newFiles])
  }, [uploadedFiles.length])

  // Remove file handler
  const removeFile = useCallback((id: string) => {
    setUploadedFiles(prev => {
      const file = prev.find(f => f.id === id)
      if (file?.preview) {
        URL.revokeObjectURL(file.preview)
      }
      return prev.filter(f => f.id !== id)
    })
  }, [])

  // Analyze brand materials with AI
  const analyzeBrandMaterials = async () => {
    if (uploadedFiles.length === 0) {
      toast.error('Please upload at least one file')
      return
    }

    setIsAnalyzing(true)
    setAnalysisProgress(0)
    
    try {
      // Update file statuses
      setUploadedFiles(prev => prev.map(f => ({ ...f, status: 'analyzing' as const })))
      
      // Simplified progress steps for faster feedback
      const steps = [
        { step: 'Uploading files to secure storage...', progress: 10 },
        { step: 'Processing brand materials...', progress: 30 },
        { step: 'Analyzing visual identity and content...', progress: 60 },
        { step: 'Building your brand profile...', progress: 90 }
      ]

      // Show initial progress
      setAnalysisStep(steps[0].step)
      setAnalysisProgress(steps[0].progress)

      // Start progress animation (fast updates)
      let currentStep = 1
      const progressInterval = setInterval(() => {
        if (currentStep < steps.length) {
          setAnalysisStep(steps[currentStep].step)
          setAnalysisProgress(steps[currentStep].progress)
          currentStep++
        }
      }, 2000) // Smooth, steady progress

      // Prepare files for upload - Claude handles PDFs natively!
      const formDataToSend = new FormData()
      let appendedCount = 0
      
      for (const { file } of uploadedFiles) {
        console.log('Processing file:', file.name, 'type:', file.type, 'size:', (file.size / 1024 / 1024).toFixed(2) + 'MB')
        // Files API supports PDFs, images, text files, and more
        formDataToSend.append('files', file)
        appendedCount++
      }

      if (appendedCount === 0) {
        clearInterval(progressInterval)
        setIsAnalyzing(false)
        setAnalysisProgress(0)
        setAnalysisStep('')
        return
      }

      // Start the API call with timeout
      console.log('Starting API call with', appendedCount, 'files')
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 180000) // 180s timeout for large PDFs
      
      setAnalysisStep('Analyzing with AI...')
      setAnalysisProgress(70)
      
      let response: Response
      try {
        console.log('Sending request to /api/analyze-brand')
        response = await fetch('/api/analyze-brand', {
          method: 'POST',
          body: formDataToSend,
          signal: controller.signal
        })
        console.log('API response received:', response.status)
      } catch (fetchError: any) {
        clearInterval(progressInterval)
        clearTimeout(timeoutId)
        console.error('API call failed:', fetchError)
        if (fetchError.name === 'AbortError') {
          throw new Error('Analysis timed out. Please try again with smaller files.')
        }
        throw fetchError
      }
      
      clearTimeout(timeoutId)
      clearInterval(progressInterval)

      // Handle response
      if (!response.ok) {
        let errorMessage = `Analysis failed (${response.status})`
        try {
          const errorData = await response.json()
          if (errorData?.error) errorMessage = errorData.error
        } catch {}
        throw new Error(errorMessage)
      }

      const analysisRaw = await response.json()
      const analysis = normalizeAnalysis(analysisRaw)
      
      // Final progress
      setAnalysisStep('Finalizing your brand profile...')
      setAnalysisProgress(100)
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Update files status
      setUploadedFiles(prev => prev.map(f => ({ ...f, status: 'complete' as const })))
      
      // Set the analysis - this will automatically transition to the brand sheet view
      setBrandAnalysis(analysis)
      updateFormData('brandAnalysis', analysis)
      // Push key fields to profile formData immediately
      updateFormData('primaryColor', analysis.colors.primary?.[0] || '')
      updateFormData('brandColors', analysis.colors.primary || [])
      const fonts = [analysis.typography.primaryFont, analysis.typography.secondaryFont].filter(Boolean)
      updateFormData('fonts', fonts)
      updateFormData('brandVoice', analysis.voice.tone?.[0] || '')
      const audienceCombined = [
        ...(analysis.targetAudience.demographics || []),
        ...(analysis.targetAudience.psychographics || [])
      ].filter(Boolean).join(', ')
      updateFormData('targetAudience', audienceCombined)
      updateFormData('audience', audienceCombined)
    } catch (error: any) {
      console.error('Brand analysis error:', error)
      
      // Show specific error message
      let errorMessage = error.message || 'Failed to analyze brand materials'
      if (errorMessage === 'ANALYSIS_TIMEOUT') {
        errorMessage = 'Analysis timed out. Please try fewer pages or images.'
      }
      toast.error(errorMessage)
      
      setUploadedFiles(prev => prev.map(f => ({ ...f, status: 'error' as const })))
    } finally {
      setIsAnalyzing(false)
      setAnalysisProgress(0)
      setAnalysisStep('')
    }
  }

  // Save edited section
  const saveSection = (section: string) => {
    setEditMode(null)
    updateFormData('brandAnalysis', brandAnalysis)
    toast.success(`${section} saved successfully`)
  }

  // Render brand sheet section
  const renderBrandSheetSection = (
    title: string,
    icon: React.ReactNode,
    sectionKey: keyof BrandAnalysis,
    content: React.ReactNode
  ) => (
    <Card className="p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          {icon}
          <h3 className="text-lg font-semibold">{title}</h3>
        </div>
        <Button
          variant={editMode === sectionKey ? 'default' : 'ghost'}
          size="sm"
          onClick={() => editMode === sectionKey ? saveSection(title) : setEditMode(sectionKey)}
        >
          {editMode === sectionKey ? (
            <>
              <Save className="h-4 w-4 mr-1" />
              Save
            </>
          ) : (
            <>
              <Edit3 className="h-4 w-4 mr-1" />
              Edit
            </>
          )}
        </Button>
      </div>
      {content}
    </Card>
  )

  if (!mode) {
    return (
      <div className="space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold">Define Your Brand Identity</h2>
          <p className="text-muted-foreground">
            Upload your brand materials for AI analysis or create manually
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card 
            className="p-8 cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-primary/50"
            onClick={() => setMode('upload')}
          >
            <div className="text-center space-y-4">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center mx-auto">
                <Wand2 className="h-10 w-10 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-semibold">AI Brand Analysis</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Upload PDFs, presentations, or images
                </p>
                <div className="flex flex-wrap gap-2 justify-center mt-4">
                  <Badge variant="secondary">Brand Books</Badge>
                  <Badge variant="secondary">Style Guides</Badge>
                  <Badge variant="secondary">Logos</Badge>
                  <Badge variant="secondary">Marketing Materials</Badge>
                </div>
              </div>
              <div className="pt-2">
                <Badge variant="secondary">
                  AI-Powered Analysis
                </Badge>
              </div>
            </div>
          </Card>

          <Card 
            className="p-8 cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-primary/50"
            onClick={() => setMode('manual')}
          >
            <div className="text-center space-y-4">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-orange-500/20 to-pink-500/10 flex items-center justify-center mx-auto">
                <Book className="h-10 w-10 text-orange-500" />
              </div>
              <div>
                <h3 className="text-xl font-semibold">Guided Creation</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Answer detailed questions about your brand
                </p>
                <div className="flex flex-wrap gap-2 justify-center mt-4">
                  <Badge variant="secondary">Step-by-step</Badge>
                  <Badge variant="secondary">Best practices</Badge>
                  <Badge variant="secondary">Examples</Badge>
                  <Badge variant="secondary">Templates</Badge>
                </div>
              </div>
              <div className="pt-2">
                <Badge variant="outline">
                  Detailed questionnaire
                </Badge>
              </div>
            </div>
          </Card>
        </div>
      </div>
    )
  }

  if (mode === 'upload') {
    if (brandAnalysis) {
      // Show interactive brand sheet
      return (
        <div className="space-y-8">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
            <h2 className="text-3xl font-bold">Your Brand Profile</h2>
            <p className="text-muted-foreground">
              Review and edit your AI-generated brand identity
            </p>
          </div>

          <ScrollArea className="h-[600px] pr-4">
            <div className="space-y-6">
              {/* Colors Section */}
              {renderBrandSheetSection(
                'Color Palette',
                <Palette className="h-5 w-5 text-primary" />,
                'colors',
                <div className="space-y-4">
                  {editMode === 'colors' ? (
                    <div className="space-y-4">
                      <div>
                        <Label>Primary Colors</Label>
                        <div className="flex gap-2 mt-2">
                          {brandAnalysis.colors.primary.map((color, i) => (
                            <Input
                              key={i}
                              type="color"
                              value={color}
                              onChange={(e) => {
                                const updated = { ...brandAnalysis }
                                updated.colors.primary[i] = e.target.value
                                setBrandAnalysis(updated)
                              }}
                              className="w-16 h-16 p-1"
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex gap-3 flex-wrap">
                        {brandAnalysis.colors.primary.map((color, i) => (
                          <div key={i} className="text-center">
                            <div
                              className="w-16 h-16 rounded-lg shadow-md"
                              style={{ backgroundColor: color }}
                            />
                            <p className="text-xs mt-1">{color}</p>
                          </div>
                        ))}
                      </div>
                      {brandAnalysis.colors.descriptions && (
                        <div className="mt-4 text-sm text-muted-foreground">
                          {Object.entries(brandAnalysis.colors.descriptions).map(([color, desc]) => (
                            <p key={color}><strong>{color}:</strong> {desc}</p>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Typography Section */}
              {renderBrandSheetSection(
                'Typography',
                <Type className="h-5 w-5 text-primary" />,
                'typography',
                <div className="space-y-3">
                  {editMode === 'typography' ? (
                    <div className="space-y-3">
                      <div>
                        <Label>Primary Font</Label>
                        <Input
                          value={brandAnalysis.typography.primaryFont}
                          onChange={(e) => {
                            const updated = { ...brandAnalysis }
                            updated.typography.primaryFont = e.target.value
                            setBrandAnalysis(updated)
                          }}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label>Secondary Font</Label>
                        <Input
                          value={brandAnalysis.typography.secondaryFont}
                          onChange={(e) => {
                            const updated = { ...brandAnalysis }
                            updated.typography.secondaryFont = e.target.value
                            setBrandAnalysis(updated)
                          }}
                          className="mt-1"
                        />
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Primary</p>
                          <p className="font-medium">{brandAnalysis.typography.primaryFont}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Secondary</p>
                          <p className="font-medium">{brandAnalysis.typography.secondaryFont}</p>
                        </div>
                      </div>
                      {brandAnalysis.typography.recommendations.length > 0 && (
                        <div>
                          <p className="text-sm text-muted-foreground mb-2">Recommendations:</p>
                          <div className="flex flex-wrap gap-2">
                            {brandAnalysis.typography.recommendations.map((rec, i) => (
                              <Badge key={i} variant="secondary">{rec}</Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* Voice & Tone Section */}
              {renderBrandSheetSection(
                'Brand Voice',
                <Volume2 className="h-5 w-5 text-primary" />,
                'voice',
                <div className="space-y-3">
                  {editMode === 'voice' ? (
                    <div className="space-y-3">
                      <div>
                        <Label>Tone Keywords</Label>
                        <Textarea
                          value={brandAnalysis.voice.tone.join(', ')}
                          onChange={(e) => {
                            const updated = { ...brandAnalysis }
                            updated.voice.tone = e.target.value.split(',').map(s => s.trim())
                            setBrandAnalysis(updated)
                          }}
                          className="mt-1"
                        />
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex flex-wrap gap-2">
                        {brandAnalysis.voice.tone.map((tone, i) => (
                          <Badge key={i} variant="outline">{tone}</Badge>
                        ))}
                      </div>
                      {brandAnalysis.voice.examples.length > 0 && (
                        <div>
                          <p className="text-sm text-muted-foreground mb-2">Example phrases:</p>
                          <ul className="text-sm space-y-1">
                            {brandAnalysis.voice.examples.slice(0, 3).map((example, i) => (
                              <li key={i} className="italic">"{example}"</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* Target Audience Section */}
              {renderBrandSheetSection(
                'Target Audience',
                <Users className="h-5 w-5 text-primary" />,
                'targetAudience',
                <div className="space-y-3">
                  {editMode === 'targetAudience' ? (
                    <div className="space-y-3">
                      <div>
                        <Label>Demographics</Label>
                        <Textarea
                          value={brandAnalysis.targetAudience.demographics.join(', ')}
                          onChange={(e) => {
                            const updated = { ...brandAnalysis }
                            updated.targetAudience.demographics = e.target.value.split(',').map(s => s.trim())
                            setBrandAnalysis(updated)
                          }}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label>Psychographics</Label>
                        <Textarea
                          value={brandAnalysis.targetAudience.psychographics.join(', ')}
                          onChange={(e) => {
                            const updated = { ...brandAnalysis }
                            updated.targetAudience.psychographics = e.target.value.split(',').map(s => s.trim())
                            setBrandAnalysis(updated)
                          }}
                          className="mt-1"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium mb-2">Demographics</p>
                        <div className="space-y-1">
                          {brandAnalysis.targetAudience.demographics.map((demo, i) => (
                            <p key={i} className="text-sm text-muted-foreground">• {demo}</p>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-medium mb-2">Pain Points</p>
                        <div className="space-y-1">
                          {brandAnalysis.targetAudience.painPoints.map((pain, i) => (
                            <p key={i} className="text-sm text-muted-foreground">• {pain}</p>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Visual Style Section */}
              {renderBrandSheetSection(
                'Visual Style',
                <Image className="h-5 w-5 text-primary" />,
                'visualStyle',
                <div className="space-y-3">
                  {editMode === 'visualStyle' ? (
                    <div className="space-y-3">
                      <div>
                        <Label>Aesthetic Keywords</Label>
                        <Textarea
                          value={brandAnalysis.visualStyle.aesthetic.join(', ')}
                          onChange={(e) => {
                            const updated = { ...brandAnalysis }
                            updated.visualStyle.aesthetic = e.target.value.split(',').map(s => s.trim())
                            setBrandAnalysis(updated)
                          }}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label>Imagery Style</Label>
                        <Textarea
                          value={brandAnalysis.visualStyle.imagery.join(', ')}
                          onChange={(e) => {
                            const updated = { ...brandAnalysis }
                            updated.visualStyle.imagery = e.target.value.split(',').map(s => s.trim())
                            setBrandAnalysis(updated)
                          }}
                          className="mt-1"
                        />
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {brandAnalysis.visualStyle.aesthetic.map((style, i) => (
                          <Badge key={i} variant="secondary">{style}</Badge>
                        ))}
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-medium mb-1">Imagery</p>
                          <p className="text-sm text-muted-foreground">{brandAnalysis.visualStyle.imagery.join(', ')}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium mb-1">Mood</p>
                          <p className="text-sm text-muted-foreground">{brandAnalysis.visualStyle.mood.join(', ')}</p>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Competitive Landscape Section */}
              {renderBrandSheetSection(
                'Competitive Landscape',
                <Trophy className="h-5 w-5 text-primary" />,
                'competitors',
                <div className="space-y-3">
                  {editMode === 'competitors' ? (
                    <div className="space-y-3">
                      <div>
                        <Label>Direct Competitors</Label>
                        <Textarea
                          value={brandAnalysis.competitors.direct.join(', ')}
                          onChange={(e) => {
                            const updated = { ...brandAnalysis }
                            updated.competitors.direct = e.target.value.split(',').map(s => s.trim())
                            setBrandAnalysis(updated)
                          }}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label>Market Positioning</Label>
                        <Textarea
                          value={brandAnalysis.competitors.positioning}
                          onChange={(e) => {
                            const updated = { ...brandAnalysis }
                            updated.competitors.positioning = e.target.value
                            setBrandAnalysis(updated)
                          }}
                          className="mt-1"
                        />
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="mb-3">
                        <p className="text-sm font-medium mb-2">Direct Competitors</p>
                        <div className="flex flex-wrap gap-2">
                          {brandAnalysis.competitors.direct.map((comp, i) => (
                            <Badge key={i} variant="outline">{comp}</Badge>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-medium mb-1">Market Positioning</p>
                        <p className="text-sm text-muted-foreground">{brandAnalysis.competitors.positioning}</p>
                      </div>
                      {brandAnalysis.competitors.differentiators.length > 0 && (
                        <div>
                          <p className="text-sm font-medium mb-1">Key Differentiators</p>
                          <div className="space-y-1">
                            {brandAnalysis.competitors.differentiators.map((diff, i) => (
                              <p key={i} className="text-sm text-muted-foreground">• {diff}</p>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* Mission & Values Section */}
              {renderBrandSheetSection(
                'Mission & Values',
                <Lightbulb className="h-5 w-5 text-primary" />,
                'mission',
                <div className="space-y-3">
                  {editMode === 'mission' ? (
                    <div className="space-y-3">
                      <div>
                        <Label>Mission Statement</Label>
                        <Textarea
                          value={brandAnalysis.mission.statement}
                          onChange={(e) => {
                            const updated = { ...brandAnalysis }
                            updated.mission.statement = e.target.value
                            setBrandAnalysis(updated)
                          }}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label>Core Values</Label>
                        <Textarea
                          value={brandAnalysis.mission.values.join(', ')}
                          onChange={(e) => {
                            const updated = { ...brandAnalysis }
                            updated.mission.values = e.target.value.split(',').map(s => s.trim())
                            setBrandAnalysis(updated)
                          }}
                          className="mt-1"
                        />
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="p-3 bg-primary/5 rounded-lg mb-3">
                        <p className="text-sm italic">&ldquo;{brandAnalysis.mission.statement}&rdquo;</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium mb-2">Core Values</p>
                        <div className="grid grid-cols-2 gap-2">
                          {brandAnalysis.mission.values.map((value, i) => (
                            <div key={i} className="flex items-center gap-2">
                              <div className="h-2 w-2 bg-primary rounded-full" />
                              <span className="text-sm">{value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      {brandAnalysis.mission.vision && (
                        <div>
                          <p className="text-sm font-medium mb-1">Vision</p>
                          <p className="text-sm text-muted-foreground">{brandAnalysis.mission.vision}</p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </ScrollArea>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setMode(null)}>
              Start Over
            </Button>
            <Button onClick={onComplete}>
              Save Brand Profile
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      )
    }

    // Show upload interface
    return (
      <div className="space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold">Upload Brand Materials</h2>
          <p className="text-muted-foreground">
            Drop your brand book, style guides, or any brand materials
          </p>
        </div>

        {/* Upload area */}
        <div className="space-y-4">
          <div
            className={cn(
              "border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all",
              "hover:border-primary hover:bg-primary/5",
              uploadedFiles.length > 0 ? "border-primary/50" : "border-muted-foreground/25"
            )}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.png,.jpg,.jpeg,.svg,.webp,.gif,.ppt,.pptx,.doc,.docx,.txt,.md"
              onChange={handleFileUpload}
              className="hidden"
            />
            <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg font-medium">Click or drag files here</p>
            <p className="text-sm text-muted-foreground mt-2">
              Supports: PDF, Images (PNG, JPG, SVG), PowerPoint, Word, Text files
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Max 10 files, up to 500MB each
            </p>
            <div className="flex gap-2 justify-center mt-4">
              <Badge variant="secondary">Brand Books</Badge>
              <Badge variant="secondary">Style Guides</Badge>
              <Badge variant="secondary">Logos</Badge>
            </div>
          </div>

          {/* Uploaded files */}
          {uploadedFiles.length > 0 && (
            <div className="space-y-2">
              <Label>Uploaded Files ({uploadedFiles.length})</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {uploadedFiles.map((file) => (
                  <Card key={file.id} className="p-3">
                    <div className="flex items-center gap-3">
                      {file.type === 'image' && file.preview ? (
                        <img src={file.preview} alt="" className="w-12 h-12 object-cover rounded" />
                      ) : (
                        <div className="w-12 h-12 rounded bg-muted flex items-center justify-center">
                          {file.type === 'pdf' && <FileText className="h-6 w-6" />}
                          {file.type === 'document' && <FileType className="h-6 w-6" />}
                          {file.type === 'other' && <FilePlus className="h-6 w-6" />}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{file.file.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(file.file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {file.status === 'analyzing' && <Loader2 className="h-4 w-4 animate-spin" />}
                        {file.status === 'complete' && <CheckCircle className="h-4 w-4 text-green-500" />}
                        {file.status === 'error' && <AlertCircle className="h-4 w-4 text-red-500" />}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(file.id)}
                          disabled={isAnalyzing}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Analysis progress */}
        {isAnalyzing && (
          <Card className="p-6 border-2">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Loader2 className="h-5 w-5 text-primary animate-spin" />
                  <div>
                    <p className="font-medium">Analyzing Your Brand Materials</p>
                    <p className="text-sm text-muted-foreground mt-1">{analysisStep}</p>
                  </div>
                </div>
                <span className="text-sm font-medium">{analysisProgress}%</span>
              </div>
              
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-500 ease-out"
                  style={{ width: `${analysisProgress}%` }}
                />
              </div>
              
              {analysisProgress === 100 && (
                <p className="text-sm text-muted-foreground text-center">
                  Finalizing your brand profile...
                </p>
              )}
            </div>
          </Card>
        )}

        <div className="flex justify-between">
          <Button variant="outline" onClick={() => setMode(null)}>
            Back
          </Button>
          <Button 
            onClick={analyzeBrandMaterials}
            disabled={uploadedFiles.length === 0 || isAnalyzing}
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Wand2 className="h-4 w-4 mr-2" />
                Analyze Brand Materials
              </>
            )}
          </Button>
        </div>
      </div>
    )
  }

  // Manual mode - guided questionnaire
  if (mode === 'manual') {
    const manualSteps = [
      {
        title: 'Visual Identity',
        fields: (
          <div className="space-y-6">
            <div>
              <Label>Primary Brand Colors</Label>
              <p className="text-sm text-muted-foreground mb-3">
                Select up to 3 primary colors that represent your brand
              </p>
              <div className="grid grid-cols-6 gap-3">
                {/* Color picker grid */}
              </div>
            </div>
            <div>
              <Label>Typography Preferences</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select font style" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="modern">Modern & Clean</SelectItem>
                  <SelectItem value="classic">Classic & Timeless</SelectItem>
                  <SelectItem value="playful">Playful & Creative</SelectItem>
                  <SelectItem value="bold">Bold & Impactful</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )
      },
      {
        title: 'Brand Voice',
        fields: (
          <div className="space-y-6">
            <div>
              <Label>How would you describe your brand personality?</Label>
              <Textarea
                placeholder="E.g., Professional yet approachable, innovative and forward-thinking..."
                className="min-h-[100px] mt-2"
              />
            </div>
            <div>
              <Label>Key brand values (select all that apply)</Label>
              <div className="grid grid-cols-2 gap-3 mt-3">
                {['Innovation', 'Trust', 'Quality', 'Sustainability', 'Community', 'Excellence'].map(value => (
                  <label key={value} className="flex items-center space-x-2">
                    <input type="checkbox" className="rounded" />
                    <span>{value}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )
      },
      {
        title: 'Target Audience',
        fields: (
          <div className="space-y-6">
            <div>
              <Label>Primary audience demographics</Label>
              <Textarea
                placeholder="Age range, location, profession, interests..."
                className="min-h-[80px] mt-2"
              />
            </div>
            <div>
              <Label>What problems does your brand solve?</Label>
              <Textarea
                placeholder="List the main pain points your audience faces..."
                className="min-h-[80px] mt-2"
              />
            </div>
          </div>
        )
      }
    ]

    return (
      <div className="space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold">Define Your Brand</h2>
          <p className="text-muted-foreground">
            Step {manualStep + 1} of {manualSteps.length}: {manualSteps[manualStep].title}
          </p>
        </div>

        <Card className="p-6">
          {manualSteps[manualStep].fields}
        </Card>

        <div className="flex justify-between">
          <Button 
            variant="outline" 
            onClick={() => manualStep > 0 ? setManualStep(manualStep - 1) : setMode(null)}
          >
            Back
          </Button>
          <Button
            onClick={() => {
              if (manualStep < manualSteps.length - 1) {
                setManualStep(manualStep + 1)
              } else {
                // Complete manual setup
                toast.success('Brand profile created!')
                onComplete?.()
              }
            }}
          >
            {manualStep < manualSteps.length - 1 ? 'Continue' : 'Complete'}
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    )
  }

  return null
}
