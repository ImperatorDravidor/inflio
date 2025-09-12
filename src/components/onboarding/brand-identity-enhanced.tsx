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
    primary: {
      hex: string[]
      name: string[]
      usage: string
    }
    secondary: {
      hex: string[]
      name: string[]
      usage: string
    }
    accent: {
      hex: string[]
      name: string[]
      usage: string
    }
    neutral: {
      hex: string[]
      name: string[]
      usage: string
    }
    guidelines: string[]
  }
  typography: {
    primary: {
      family: string
      weights: string[]
      fallback: string
      usage: string
    }
    secondary: {
      family: string
      weights: string[]
      fallback: string
      usage: string
    }
    body: {
      family: string
      size: string
      lineHeight: string
    }
    headings: {
      h1: { size: string; weight: string }
      h2: { size: string; weight: string }
      h3: { size: string; weight: string }
    }
  }
  voice: {
    tone: string[]
    personality: string[]
    attributes: string[]
    phrases: string[]
    dos: string[]
    donts: string[]
    guidelines: string[]
  }
  visualStyle: {
    principles: string[]
    photography: {
      style: string[]
    mood: string[]
      composition: string[]
    }
    imagery: string[]
    iconography: string
    patterns: string[]
  }
  targetAudience: {
    demographics: {
      age: string
      location: string
      interests: string[]
    }
    psychographics: string[]
    painPoints: string[]
    needs: string[]
    personas: string[]
  }
  brandStrategy: {
    mission: string
    vision: string
    values: string[]
    positioning: string
    pillars: string[]
    story: string
  }
  competitors: {
    direct: string[]
    indirect: string[]
    positioning: string
    differentiators: string[]
  }
  logoUsage: {
    guidelines: string[]
    clearSpace: string
    minimumSize: string
    variations: string[]
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

    // Handle both old and new format
    const colors = raw?.colors || {}
    const primaryColors = colors.primary || {}
    const isNewFormat = typeof primaryColors === 'object' && !Array.isArray(primaryColors)

    if (isNewFormat) {
    return {
      colors: {
          primary: {
            hex: toArray(colors.primary?.hex),
            name: toArray(colors.primary?.name),
            usage: ensure(colors.primary?.usage, '')
          },
          secondary: {
            hex: toArray(colors.secondary?.hex),
            name: toArray(colors.secondary?.name),
            usage: ensure(colors.secondary?.usage, '')
          },
          accent: {
            hex: toArray(colors.accent?.hex),
            name: toArray(colors.accent?.name),
            usage: ensure(colors.accent?.usage, '')
          },
          neutral: {
            hex: toArray(colors.neutral?.hex),
            name: toArray(colors.neutral?.name),
            usage: ensure(colors.neutral?.usage, '')
          },
          guidelines: toArray(colors.guidelines)
      },
      typography: {
          primary: {
            family: ensure(raw?.typography?.primary?.family || raw?.typography?.primaryFont, ''),
            weights: toArray(raw?.typography?.primary?.weights),
            fallback: ensure(raw?.typography?.primary?.fallback, ''),
            usage: ensure(raw?.typography?.primary?.usage, '')
          },
          secondary: {
            family: ensure(raw?.typography?.secondary?.family || raw?.typography?.secondaryFont, ''),
            weights: toArray(raw?.typography?.secondary?.weights),
            fallback: ensure(raw?.typography?.secondary?.fallback, ''),
            usage: ensure(raw?.typography?.secondary?.usage, '')
          },
          body: {
            family: ensure(raw?.typography?.body?.family, ''),
            size: ensure(raw?.typography?.body?.size, '16px'),
            lineHeight: ensure(raw?.typography?.body?.lineHeight, '1.5')
          },
          headings: {
            h1: { size: ensure(raw?.typography?.headings?.h1?.size, ''), weight: ensure(raw?.typography?.headings?.h1?.weight, '') },
            h2: { size: ensure(raw?.typography?.headings?.h2?.size, ''), weight: ensure(raw?.typography?.headings?.h2?.weight, '') },
            h3: { size: ensure(raw?.typography?.headings?.h3?.size, ''), weight: ensure(raw?.typography?.headings?.h3?.weight, '') }
          }
      },
      voice: {
        tone: toArray(raw?.voice?.tone),
        personality: toArray(raw?.voice?.personality),
          attributes: toArray(raw?.voice?.attributes),
          phrases: toArray(raw?.voice?.phrases || raw?.voice?.examples),
          dos: toArray(raw?.voice?.dos),
          donts: toArray(raw?.voice?.donts),
          guidelines: toArray(raw?.voice?.guidelines)
      },
      visualStyle: {
          principles: toArray(raw?.visualStyle?.principles || raw?.visualStyle?.aesthetic),
          photography: {
            style: toArray(raw?.visualStyle?.photography?.style),
            mood: toArray(raw?.visualStyle?.photography?.mood || raw?.visualStyle?.mood),
            composition: toArray(raw?.visualStyle?.photography?.composition || raw?.visualStyle?.composition)
          },
        imagery: toArray(raw?.visualStyle?.imagery),
          iconography: ensure(raw?.visualStyle?.iconography, ''),
          patterns: toArray(raw?.visualStyle?.patterns)
      },
      targetAudience: {
          demographics: {
            age: ensure(raw?.targetAudience?.demographics?.age, ''),
            location: ensure(raw?.targetAudience?.demographics?.location, ''),
            interests: toArray(raw?.targetAudience?.demographics?.interests)
          },
        psychographics: toArray(raw?.targetAudience?.psychographics),
        painPoints: toArray(raw?.targetAudience?.painPoints),
          needs: toArray(raw?.targetAudience?.needs),
          personas: toArray(raw?.targetAudience?.personas)
        },
        brandStrategy: {
          mission: ensure(raw?.brandStrategy?.mission || raw?.mission?.statement, ''),
          vision: ensure(raw?.brandStrategy?.vision || raw?.mission?.vision, ''),
          values: toArray(raw?.brandStrategy?.values || raw?.mission?.values),
          positioning: ensure(raw?.brandStrategy?.positioning || raw?.competitors?.positioning, ''),
          pillars: toArray(raw?.brandStrategy?.pillars),
          story: ensure(raw?.brandStrategy?.story, '')
      },
      competitors: {
        direct: toArray(raw?.competitors?.direct),
        indirect: toArray(raw?.competitors?.indirect),
        positioning: ensure(raw?.competitors?.positioning, ''),
        differentiators: toArray(raw?.competitors?.differentiators)
      },
        logoUsage: {
          guidelines: toArray(raw?.logoUsage?.guidelines),
          clearSpace: ensure(raw?.logoUsage?.clearSpace, ''),
          minimumSize: ensure(raw?.logoUsage?.minimumSize, ''),
          variations: toArray(raw?.logoUsage?.variations)
        }
      }
    }

    // Fallback for old format
    return {
      colors: {
        primary: { hex: toArray(colors.primary), name: [], usage: '' },
        secondary: { hex: toArray(colors.secondary), name: [], usage: '' },
        accent: { hex: toArray(colors.accent), name: [], usage: '' },
        neutral: { hex: [], name: [], usage: '' },
        guidelines: []
      },
      typography: {
        primary: {
          family: ensure(raw?.typography?.primaryFont, ''),
          weights: ['400', '600', '700'],
          fallback: '',
          usage: ''
        },
        secondary: {
          family: ensure(raw?.typography?.secondaryFont, ''),
          weights: [],
          fallback: '',
          usage: ''
        },
        body: {
          family: '',
          size: '16px',
          lineHeight: '1.5'
        },
        headings: {
          h1: { size: '', weight: '' },
          h2: { size: '', weight: '' },
          h3: { size: '', weight: '' }
        }
      },
      voice: {
        tone: toArray(raw?.voice?.tone),
        personality: toArray(raw?.voice?.personality),
        attributes: [],
        phrases: toArray(raw?.voice?.examples),
        dos: [],
        donts: [],
        guidelines: []
      },
      visualStyle: {
        principles: toArray(raw?.visualStyle?.aesthetic),
        photography: {
          style: [],
          mood: toArray(raw?.visualStyle?.mood),
          composition: toArray(raw?.visualStyle?.composition)
        },
        imagery: toArray(raw?.visualStyle?.imagery),
        iconography: '',
        patterns: []
      },
      targetAudience: {
        demographics: {
          age: '',
          location: '',
          interests: []
        },
        psychographics: toArray(raw?.targetAudience?.psychographics),
        painPoints: toArray(raw?.targetAudience?.painPoints),
        needs: [],
        personas: []
      },
      brandStrategy: {
        mission: ensure(raw?.mission?.statement, ''),
        vision: ensure(raw?.mission?.vision, ''),
        values: toArray(raw?.mission?.values),
        positioning: ensure(raw?.competitors?.positioning, ''),
        pillars: [],
        story: ''
      },
      competitors: {
        direct: toArray(raw?.competitors?.direct),
        indirect: toArray(raw?.competitors?.indirect),
        positioning: ensure(raw?.competitors?.positioning, ''),
        differentiators: toArray(raw?.competitors?.differentiators)
      },
      logoUsage: {
        guidelines: [],
        clearSpace: '',
        minimumSize: '',
        variations: []
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
      let apiCallStarted = false
      const progressInterval = setInterval(() => {
        if (currentStep < steps.length && !apiCallStarted) {
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
      
      // Mark that API call has started
      apiCallStarted = true
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
      updateFormData('primaryColor', analysis.colors.primary?.hex?.[0] || '')
      updateFormData('brandColors', analysis.colors.primary?.hex || [])
      const fonts = [analysis.typography?.primary?.family, analysis.typography?.secondary?.family].filter(Boolean)
      updateFormData('fonts', fonts)
      updateFormData('brandVoice', analysis.voice.tone?.[0] || '')
      const audienceCombined = [
        ...(analysis.targetAudience.psychographics || []),
        ...(analysis.targetAudience.needs || [])
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
      <div className="space-y-8 max-w-4xl mx-auto">
        <div className="text-center space-y-4">
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
        <div className="space-y-8 max-w-5xl mx-auto">
          <div className="text-center space-y-4">
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
                <div className="space-y-6">
                  {editMode === 'colors' ? (
                    <div className="space-y-4">
                      <div>
                        <Label>Primary Colors</Label>
                        <div className="flex gap-2 mt-2">
                          {brandAnalysis.colors.primary.hex.map((color, i) => (
                            <Input
                              key={i}
                              type="color"
                              value={color}
                              onChange={(e) => {
                                const updated = { ...brandAnalysis }
                                updated.colors.primary.hex[i] = e.target.value
                                setBrandAnalysis(updated)
                              }}
                              className="w-16 h-16 p-1"
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Primary Colors */}
                      {brandAnalysis.colors.primary.hex.length > 0 && (
                    <div>
                          <h4 className="text-sm font-semibold mb-3">Primary Colors</h4>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {brandAnalysis.colors.primary.hex.map((color, i) => (
                              <div key={i} className="group">
                                <div className="relative overflow-hidden rounded-xl border border-border hover:border-primary/50 transition-all">
                                  <div
                                    className="h-20 w-full"
                              style={{ backgroundColor: color }}
                            />
                                  <div className="bg-background p-2 space-y-1">
                                    <p className="font-mono text-xs font-medium">{color.toUpperCase()}</p>
                                    {brandAnalysis.colors.primary.name?.[i] && (
                                      <p className="text-xs text-muted-foreground">{brandAnalysis.colors.primary.name[i]}</p>
                                    )}
                                  </div>
                                </div>
                          </div>
                        ))}
                      </div>
                          {brandAnalysis.colors.primary.usage && (
                            <p className="text-xs text-muted-foreground mt-2">{brandAnalysis.colors.primary.usage}</p>
                          )}
                        </div>
                      )}

                      {/* Secondary Colors */}
                      {brandAnalysis.colors.secondary.hex.length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold mb-3">Secondary Colors</h4>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {brandAnalysis.colors.secondary.hex.map((color, i) => (
                              <div key={i} className="group">
                                <div className="relative overflow-hidden rounded-xl border border-border hover:border-primary/50 transition-all">
                                  <div
                                    className="h-20 w-full"
                                    style={{ backgroundColor: color }}
                                  />
                                  <div className="bg-background p-2 space-y-1">
                                    <p className="font-mono text-xs font-medium">{color.toUpperCase()}</p>
                                    {brandAnalysis.colors.secondary.name?.[i] && (
                                      <p className="text-xs text-muted-foreground">{brandAnalysis.colors.secondary.name[i]}</p>
                                    )}
                                  </div>
                                </div>
                              </div>
                          ))}
                        </div>
                          {brandAnalysis.colors.secondary.usage && (
                            <p className="text-xs text-muted-foreground mt-2">{brandAnalysis.colors.secondary.usage}</p>
                      )}
                    </div>
                      )}

                      {/* Accent Colors */}
                      {brandAnalysis.colors.accent.hex.length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold mb-3">Accent Colors</h4>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {brandAnalysis.colors.accent.hex.map((color, i) => (
                              <div key={i} className="group">
                                <div className="relative overflow-hidden rounded-xl border border-border hover:border-primary/50 transition-all">
                                  <div
                                    className="h-20 w-full"
                                    style={{ backgroundColor: color }}
                                  />
                                  <div className="bg-background p-2 space-y-1">
                                    <p className="font-mono text-xs font-medium">{color.toUpperCase()}</p>
                                    {brandAnalysis.colors.accent.name?.[i] && (
                                      <p className="text-xs text-muted-foreground">{brandAnalysis.colors.accent.name[i]}</p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Neutral Colors */}
                      {brandAnalysis.colors.neutral.hex.length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold mb-3">Neutral Colors</h4>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {brandAnalysis.colors.neutral.hex.map((color, i) => (
                              <div key={i} className="group">
                                <div className="relative overflow-hidden rounded-xl border border-border hover:border-primary/50 transition-all">
                                  <div
                                    className="h-20 w-full"
                                    style={{ backgroundColor: color }}
                                  />
                                  <div className="bg-background p-2 space-y-1">
                                    <p className="font-mono text-xs font-medium">{color.toUpperCase()}</p>
                                    {brandAnalysis.colors.neutral.name?.[i] && (
                                      <p className="text-xs text-muted-foreground">{brandAnalysis.colors.neutral.name[i]}</p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Color Guidelines */}
                      {brandAnalysis.colors.guidelines.length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold mb-2">Usage Guidelines</h4>
                          <ul className="space-y-1">
                            {brandAnalysis.colors.guidelines.map((guideline, i) => (
                              <li key={i} className="text-xs text-muted-foreground flex items-start">
                                <span className="mr-2">•</span>
                                <span>{guideline}</span>
                              </li>
                            ))}
                          </ul>
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
                <div className="space-y-6">
                  {editMode === 'typography' ? (
                    <div className="space-y-3">
                      <div>
                        <Label>Primary Font Family</Label>
                        <Input
                          value={brandAnalysis.typography.primary.family}
                          onChange={(e) => {
                            const updated = { ...brandAnalysis }
                            updated.typography.primary.family = e.target.value
                            setBrandAnalysis(updated)
                          }}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label>Secondary Font Family</Label>
                        <Input
                          value={brandAnalysis.typography.secondary.family}
                          onChange={(e) => {
                            const updated = { ...brandAnalysis }
                            updated.typography.secondary.family = e.target.value
                            setBrandAnalysis(updated)
                          }}
                          className="mt-1"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Primary Font */}
                      {brandAnalysis.typography.primary.family && (
                        <div className="space-y-3">
                        <div>
                            <h4 className="text-sm font-semibold mb-2">Primary Typography</h4>
                            <div className="p-4 rounded-lg border border-border bg-card">
                              <p 
                                className="text-2xl font-bold mb-2"
                                style={{ fontFamily: brandAnalysis.typography.primary.family }}
                              >
                                {brandAnalysis.typography.primary.family}
                              </p>
                              <p 
                                className="text-sm text-muted-foreground mb-3"
                                style={{ fontFamily: brandAnalysis.typography.primary.family }}
                              >
                                The quick brown fox jumps over the lazy dog
                              </p>
                              <div className="flex flex-wrap gap-4 text-xs">
                                {brandAnalysis.typography.primary.weights.length > 0 && (
                                  <div>
                                    <span className="text-muted-foreground">Weights: </span>
                                    <span className="font-medium">{brandAnalysis.typography.primary.weights.join(', ')}</span>
                        </div>
                                )}
                                {brandAnalysis.typography.primary.fallback && (
                        <div>
                                    <span className="text-muted-foreground">Fallback: </span>
                                    <span className="font-mono text-xs">{brandAnalysis.typography.primary.fallback}</span>
                        </div>
                                )}
                      </div>
                              {brandAnalysis.typography.primary.usage && (
                                <p className="text-xs text-muted-foreground mt-2">{brandAnalysis.typography.primary.usage}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Secondary Font */}
                      {brandAnalysis.typography.secondary.family && (
                        <div className="space-y-3">
                        <div>
                            <h4 className="text-sm font-semibold mb-2">Secondary Typography</h4>
                            <div className="p-4 rounded-lg border border-border bg-card">
                              <p 
                                className="text-2xl font-bold mb-2"
                                style={{ fontFamily: brandAnalysis.typography.secondary.family }}
                              >
                                {brandAnalysis.typography.secondary.family}
                              </p>
                              <p 
                                className="text-sm text-muted-foreground mb-3"
                                style={{ fontFamily: brandAnalysis.typography.secondary.family }}
                              >
                                The quick brown fox jumps over the lazy dog
                              </p>
                              <div className="flex flex-wrap gap-4 text-xs">
                                {brandAnalysis.typography.secondary.weights.length > 0 && (
                                  <div>
                                    <span className="text-muted-foreground">Weights: </span>
                                    <span className="font-medium">{brandAnalysis.typography.secondary.weights.join(', ')}</span>
                          </div>
                                )}
                                {brandAnalysis.typography.secondary.fallback && (
                                  <div>
                                    <span className="text-muted-foreground">Fallback: </span>
                                    <span className="font-mono text-xs">{brandAnalysis.typography.secondary.fallback}</span>
                        </div>
                      )}
                              </div>
                              {brandAnalysis.typography.secondary.usage && (
                                <p className="text-xs text-muted-foreground mt-2">{brandAnalysis.typography.secondary.usage}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Type Scale */}
                      {(brandAnalysis.typography.headings.h1.size || brandAnalysis.typography.body.size) && (
                        <div>
                          <h4 className="text-sm font-semibold mb-3">Type Scale</h4>
                          <div className="space-y-2">
                            {brandAnalysis.typography.headings.h1.size && (
                              <div className="flex items-baseline gap-4">
                                <span className="text-xs text-muted-foreground w-12">H1</span>
                                <span 
                                  className="font-bold"
                                  style={{ 
                                    fontSize: brandAnalysis.typography.headings.h1.size,
                                    fontFamily: brandAnalysis.typography.primary.family 
                                  }}
                                >
                                  Heading One
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {brandAnalysis.typography.headings.h1.size} / {brandAnalysis.typography.headings.h1.weight}
                                </span>
                              </div>
                            )}
                            {brandAnalysis.typography.headings.h2.size && (
                              <div className="flex items-baseline gap-4">
                                <span className="text-xs text-muted-foreground w-12">H2</span>
                                <span 
                                  className="font-semibold"
                                  style={{ 
                                    fontSize: brandAnalysis.typography.headings.h2.size,
                                    fontFamily: brandAnalysis.typography.primary.family 
                                  }}
                                >
                                  Heading Two
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {brandAnalysis.typography.headings.h2.size} / {brandAnalysis.typography.headings.h2.weight}
                                </span>
                              </div>
                            )}
                            {brandAnalysis.typography.headings.h3.size && (
                              <div className="flex items-baseline gap-4">
                                <span className="text-xs text-muted-foreground w-12">H3</span>
                                <span 
                                  className="font-medium"
                                  style={{ 
                                    fontSize: brandAnalysis.typography.headings.h3.size,
                                    fontFamily: brandAnalysis.typography.primary.family 
                                  }}
                                >
                                  Heading Three
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {brandAnalysis.typography.headings.h3.size} / {brandAnalysis.typography.headings.h3.weight}
                                </span>
                              </div>
                            )}
                            {brandAnalysis.typography.body.size && (
                              <div className="flex items-baseline gap-4">
                                <span className="text-xs text-muted-foreground w-12">Body</span>
                                <span 
                                  style={{ 
                                    fontSize: brandAnalysis.typography.body.size,
                                    lineHeight: brandAnalysis.typography.body.lineHeight,
                                    fontFamily: brandAnalysis.typography.body.family || brandAnalysis.typography.primary.family 
                                  }}
                                >
                                  Body text example
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {brandAnalysis.typography.body.size} / {brandAnalysis.typography.body.lineHeight}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
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
                      {brandAnalysis.voice.phrases.length > 0 && (
                        <div>
                          <p className="text-sm text-muted-foreground mb-2">Example phrases:</p>
                          <ul className="text-sm space-y-1">
                            {brandAnalysis.voice.phrases.slice(0, 3).map((example: string, i: number) => (
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
                          value={`Age: ${brandAnalysis.targetAudience.demographics.age || ''}, Location: ${brandAnalysis.targetAudience.demographics.location || ''}, Interests: ${brandAnalysis.targetAudience.demographics.interests?.join(', ') || ''}`}
                          onChange={(e) => {
                            const updated = { ...brandAnalysis }
                            // Parse demographics from text
                            const parts = e.target.value.split(',').map(s => s.trim())
                            const age = parts.find(p => p.startsWith('Age:'))?.replace('Age:', '').trim() || ''
                            const location = parts.find(p => p.startsWith('Location:'))?.replace('Location:', '').trim() || ''
                            const interestsStr = parts.find(p => p.startsWith('Interests:'))?.replace('Interests:', '').trim() || ''
                            updated.targetAudience.demographics = {
                              age,
                              location,
                              interests: interestsStr ? interestsStr.split(',').map(s => s.trim()) : []
                            }
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
                          {brandAnalysis.targetAudience.psychographics.map((demo: string, i: number) => (
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
                          value={brandAnalysis.visualStyle.principles.join(', ')}
                          onChange={(e) => {
                            const updated = { ...brandAnalysis }
                            updated.visualStyle.principles = e.target.value.split(',').map(s => s.trim())
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
                        {brandAnalysis.visualStyle.principles.map((style: string, i: number) => (
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
                          <p className="text-sm text-muted-foreground">{brandAnalysis.visualStyle.photography.mood.join(', ')}</p>
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
                'brandStrategy',
                <div className="space-y-3">
                  {editMode === 'brandStrategy' ? (
                    <div className="space-y-3">
                      <div>
                        <Label>Mission Statement</Label>
                        <Textarea
                          value={brandAnalysis.brandStrategy.mission}
                          onChange={(e) => {
                            const updated = { ...brandAnalysis }
                            updated.brandStrategy.mission = e.target.value
                            setBrandAnalysis(updated)
                          }}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label>Core Values</Label>
                        <Textarea
                          value={brandAnalysis.brandStrategy.values.join(', ')}
                          onChange={(e) => {
                            const updated = { ...brandAnalysis }
                            updated.brandStrategy.values = e.target.value.split(',').map(s => s.trim())
                            setBrandAnalysis(updated)
                          }}
                          className="mt-1"
                        />
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="p-3 bg-primary/5 rounded-lg mb-3">
                        <p className="text-sm italic">&ldquo;{brandAnalysis.brandStrategy.mission}&rdquo;</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium mb-2">Core Values</p>
                        <div className="grid grid-cols-2 gap-2">
                          {brandAnalysis.brandStrategy.values.map((value: string, i: number) => (
                            <div key={i} className="flex items-center gap-2">
                              <div className="h-2 w-2 bg-primary rounded-full" />
                              <span className="text-sm">{value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      {brandAnalysis.brandStrategy.vision && (
                        <div>
                          <p className="text-sm font-medium mb-1">Vision</p>
                          <p className="text-sm text-muted-foreground">{brandAnalysis.brandStrategy.vision}</p>
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
            <Button onClick={() => {
              // Save the brand analysis to form data
              updateFormData('brandAnalysis', brandAnalysis)
              updateFormData('brandIdentity', {
                colors: brandAnalysis.colors,
                typography: brandAnalysis.typography,
                voice: brandAnalysis.voice,
                visualStyle: brandAnalysis.visualStyle,
                targetAudience: brandAnalysis.targetAudience,
                brandStrategy: brandAnalysis.brandStrategy,
                competitors: brandAnalysis.competitors,
                logoUsage: brandAnalysis.logoUsage
              })
              // Trigger completion callback
              if (onComplete) onComplete()
            }}>
              Save Brand Profile
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      )
    }

    // Show upload interface
    return (
      <div className="space-y-8 max-w-4xl mx-auto">
        <div className="text-center space-y-4">
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
      <div className="space-y-8 max-w-4xl mx-auto">
        <div className="text-center space-y-4">
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
