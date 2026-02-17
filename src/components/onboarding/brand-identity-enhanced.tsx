'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Upload, Palette, FileText, Image, FileType, X, Loader2, 
  CheckCircle, Sparkles, ChevronRight, ChevronLeft, Edit3, Save, Eye,
  Type, Volume2, Target, Users, Trophy, Lightbulb, AlertCircle,
  FileImage, FileVideo, FilePlus, Wand2, Book, ArrowRight,
  FileWarning, SkipForward, RefreshCw
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

// Supported file formats
const SUPPORTED_FORMATS = {
  documents: ['.pdf', '.doc', '.docx', '.txt', '.md'],
  images: ['.png', '.jpg', '.jpeg', '.svg', '.webp', '.gif'],
  presentations: ['.ppt', '.pptx']
}

const SUPPORTED_MIME_TYPES = [
  'application/pdf',
  'image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp', 'image/gif',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'text/plain', 'text/markdown'
]

// Analysis tips shown during loading
const ANALYSIS_TIPS = [
  { title: 'Extracting Colors', description: 'AI is identifying your brand color palette with hex codes and usage guidelines' },
  { title: 'Analyzing Typography', description: 'Detecting font families, weights, and typographic hierarchy' },
  { title: 'Understanding Voice', description: 'Learning your brand tone, personality, and communication style' },
  { title: 'Mapping Audience', description: 'Identifying target demographics and psychographics' },
  { title: 'Building Strategy', description: 'Extracting mission, vision, and brand positioning' },
]

interface BrandIdentityEnhancedProps {
  formData: any
  updateFormData: (key: string, value: any) => void
  onComplete?: () => void
  onSkip?: () => void
  onSwitchToManual?: () => void
  onSaveProgress?: (data: Record<string, any>) => Promise<void>
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
  onComplete,
  onSkip,
  onSwitchToManual,
  onSaveProgress
}: BrandIdentityEnhancedProps) {
  // Auto-set mode to 'upload' if brand analysis already exists (for restoration)
  const initialMode = formData.brandAnalysis ? 'upload' : null
  const [mode, setMode] = useState<'upload' | 'manual' | null>(initialMode)
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisProgress, setAnalysisProgress] = useState(0)
  const [analysisStep, setAnalysisStep] = useState('')
  const [brandAnalysis, setBrandAnalysis] = useState<BrandAnalysis | null>(formData.brandAnalysis || null)
  const [editMode, setEditMode] = useState<string | null>(null)
  const [manualStep, setManualStep] = useState(0)
  const [currentTipIndex, setCurrentTipIndex] = useState(0)
  const [rejectedFiles, setRejectedFiles] = useState<{ name: string; reason: string }[]>([])
  const [showRejectedAlert, setShowRejectedAlert] = useState(false)
  const [analysisError, setAnalysisError] = useState<string | null>(null)
  const [isRestored, setIsRestored] = useState(!!formData.brandAnalysis)
  const abortControllerRef = useRef<AbortController | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Normalize AI analysis payload to ensure all fields exist and are arrays/strings as expected
  // Defined before the useEffect that depends on it
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

  // Effect to handle formData updates (for when progress is restored)
  useEffect(() => {
    if (formData.brandAnalysis && !brandAnalysis) {
      const normalized = normalizeAnalysis(formData.brandAnalysis)
      setBrandAnalysis(normalized)
      setMode('upload')
      setIsRestored(true)
    }
  }, [formData.brandAnalysis, brandAnalysis, normalizeAnalysis])
  
  // Rotate tips during analysis
  useEffect(() => {
    if (isAnalyzing) {
      const interval = setInterval(() => {
        setCurrentTipIndex(prev => (prev + 1) % ANALYSIS_TIPS.length)
      }, 4000)
      return () => clearInterval(interval)
    }
  }, [isAnalyzing])

  // Validate file format
  const validateFile = useCallback((file: File): { valid: boolean; reason?: string } => {
    // Check file extension
    const ext = '.' + file.name.split('.').pop()?.toLowerCase()
    const allExtensions = [
      ...SUPPORTED_FORMATS.documents,
      ...SUPPORTED_FORMATS.images,
      ...SUPPORTED_FORMATS.presentations
    ]
    
    if (!allExtensions.includes(ext)) {
      return { 
        valid: false, 
        reason: `Unsupported format (${ext}). Please use PDF, images (PNG, JPG, SVG), or documents (Word, PowerPoint).` 
      }
    }
    
    // Check MIME type (with fallback for unknown types)
    if (file.type && !SUPPORTED_MIME_TYPES.includes(file.type) && file.type !== 'application/octet-stream') {
      // Allow if extension is valid even if MIME type doesn't match
      console.log(`File ${file.name} has unusual MIME type ${file.type}, but extension is valid`)
    }
    
    // Check file size (25MB limit)
    const maxSizeMB = 25
    if (file.size > maxSizeMB * 1024 * 1024) {
      return { 
        valid: false, 
        reason: `File too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Maximum size is ${maxSizeMB}MB.` 
      }
    }
    
    return { valid: true }
  }, [])

  // File upload handler with comprehensive validation
  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    
    // Reset rejected files alert
    setRejectedFiles([])
    setShowRejectedAlert(false)
    
    // Validate file count
    if (uploadedFiles.length + files.length > 10) {
      toast.error('Maximum 10 files allowed')
      return
    }
    
    const validFiles: File[] = []
    const rejected: { name: string; reason: string }[] = []
    
    for (const file of files) {
      const validation = validateFile(file)
      if (validation.valid) {
        validFiles.push(file)
      } else {
        rejected.push({ name: file.name, reason: validation.reason || 'Unknown error' })
      }
    }
    
    // Show rejected files alert if any
    if (rejected.length > 0) {
      setRejectedFiles(rejected)
      setShowRejectedAlert(true)
      
      // Also show toast for immediate feedback
      if (rejected.length === 1) {
        toast.error(rejected[0].reason, { description: rejected[0].name })
      } else {
        toast.error(`${rejected.length} files couldn't be added`, { 
          description: 'Check the alert below for details' 
        })
      }
    }
    
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
    
    if (newFiles.length > 0) {
      setUploadedFiles(prev => [...prev, ...newFiles])
      if (rejected.length === 0) {
        toast.success(`${newFiles.length} file${newFiles.length > 1 ? 's' : ''} added`)
      }
    }
    
    // Reset input
    if (e.target) {
      e.target.value = ''
    }
  }, [uploadedFiles.length, validateFile])

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

  // Reset analysis state (for retry)
  const resetAnalysis = useCallback(() => {
    setIsAnalyzing(false)
    setAnalysisProgress(0)
    setAnalysisStep('')
    setAnalysisError(null)
    setUploadedFiles(prev => prev.map(f => ({ ...f, status: 'pending' as const })))
  }, [])

  // Upload a single file directly to Supabase storage using a signed URL
  const uploadFileToStorage = async (
    file: File,
    signedUrl: string,
    token: string
  ): Promise<void> => {
    const response = await fetch(signedUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': file.type || 'application/octet-stream',
      },
      body: file,
    })

    if (!response.ok) {
      throw new Error(`Failed to upload ${file.name} to storage (${response.status})`)
    }
  }

  // Analyze brand materials with AI
  const analyzeBrandMaterials = async () => {
    if (uploadedFiles.length === 0) {
      toast.error('Please upload at least one file')
      return
    }

    setIsAnalyzing(true)
    setAnalysisProgress(0)
    setAnalysisError(null)
    setCurrentTipIndex(0)
    
    // Create abort controller for cancellation
    abortControllerRef.current = new AbortController()
    
    try {
      // Update file statuses
      setUploadedFiles(prev => prev.map(f => ({ ...f, status: 'analyzing' as const })))
      
      // Progress steps
      setAnalysisStep('Preparing secure upload...')
      setAnalysisProgress(5)

      // Step 1: Get signed upload URLs from our API
      console.log('Requesting signed upload URLs for', uploadedFiles.length, 'files')
      const signedUrlResponse = await fetch('/api/storage/signed-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          purpose: 'brand-material',
          files: uploadedFiles.map(({ file }) => ({
            fileName: file.name,
            fileType: file.type,
            fileSize: file.size,
          })),
        }),
        signal: abortControllerRef.current.signal,
      })

      if (!signedUrlResponse.ok) {
        const err = await signedUrlResponse.json().catch(() => ({}))
        throw new Error(err.error || `Failed to prepare upload (${signedUrlResponse.status})`)
      }

      const { uploads } = await signedUrlResponse.json()
      console.log('Got signed URLs for', uploads.length, 'files')

      // Step 2: Upload each file directly to Supabase (bypasses Vercel body limit)
      setAnalysisStep('Uploading files to secure storage...')
      setAnalysisProgress(15)

      const fileRefs: Array<{ storagePath: string; fileName: string; fileType: string; fileSize: number }> = []

      for (let i = 0; i < uploadedFiles.length; i++) {
        const { file } = uploadedFiles[i]
        const uploadInfo = uploads[i]

        console.log(`Uploading ${file.name} directly to storage...`)
        setAnalysisStep(`Uploading ${file.name}...`)
        setAnalysisProgress(15 + Math.round((i / uploadedFiles.length) * 30))

        await uploadFileToStorage(file, uploadInfo.signedUrl, uploadInfo.token)

        fileRefs.push({
          storagePath: uploadInfo.storagePath,
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
        })

        console.log(`Uploaded ${file.name} -> ${uploadInfo.storagePath}`)
      }

      // Step 3: Call analyze-brand with storage paths (tiny JSON payload)
      setAnalysisStep('Analyzing with AI...')
      setAnalysisProgress(50)

      // Start progress animation during AI analysis
      let analysisProgressValue = 50
      const progressInterval = setInterval(() => {
        analysisProgressValue = Math.min(analysisProgressValue + 3, 90)
        setAnalysisProgress(analysisProgressValue)
      }, 3000)

      const timeoutId = setTimeout(() => {
        if (abortControllerRef.current) {
          abortControllerRef.current.abort()
        }
      }, 180000) // 180s timeout for large PDFs

      let response: Response
      try {
        console.log('Sending analyze request with', fileRefs.length, 'storage paths')
        response = await fetch('/api/analyze-brand', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ files: fileRefs }),
          signal: abortControllerRef.current.signal,
        })
        console.log('API response received:', response.status)
      } catch (fetchError: any) {
        clearInterval(progressInterval)
        clearTimeout(timeoutId)
        console.error('API call failed:', fetchError)
        if (fetchError.name === 'AbortError') {
          if (!isAnalyzing) {
            return // User cancelled, don't show error
          }
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
      setIsRestored(true) // Show completion indicator
      updateFormData('brandAnalysis', analysis)
      // Also set brandIdentity so brand page can show it immediately
      updateFormData('brandIdentity', {
        colors: analysis.colors,
        typography: analysis.typography,
        voice: analysis.voice,
        visualStyle: analysis.visualStyle,
        targetAudience: analysis.targetAudience,
        brandStrategy: analysis.brandStrategy,
        competitors: analysis.competitors,
        logoUsage: analysis.logoUsage
      })
      updateFormData('brandAnalysisCompleted', true) // Mark step as complete
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
      
      toast.success('Brand analysis complete!')
    } catch (error: any) {
      console.error('Brand analysis error:', error)
      
      // Don't show error if user cancelled
      if (error.name === 'AbortError') {
        return
      }
      
      // Show specific error message
      let errorMessage = error.message || 'Failed to analyze brand materials'
      if (errorMessage === 'ANALYSIS_TIMEOUT') {
        errorMessage = 'Analysis timed out. Please try fewer pages or images.'
      }
      
      // Set error state to show recovery options
      setAnalysisError(errorMessage)
      setUploadedFiles(prev => prev.map(f => ({ ...f, status: 'error' as const })))
    } finally {
      setIsAnalyzing(false)
      setAnalysisProgress(0)
      setAnalysisStep('')
      abortControllerRef.current = null
    }
  }

  // Save edited section
  const saveSection = (section: string) => {
    setEditMode(null)
    updateFormData('brandAnalysis', brandAnalysis)
    // Keep brandIdentity in sync
    updateFormData('brandIdentity', {
      colors: brandAnalysis?.colors,
      typography: brandAnalysis?.typography,
      voice: brandAnalysis?.voice,
      visualStyle: brandAnalysis?.visualStyle,
      targetAudience: brandAnalysis?.targetAudience,
      brandStrategy: brandAnalysis?.brandStrategy,
      competitors: brandAnalysis?.competitors,
      logoUsage: brandAnalysis?.logoUsage
    })
    toast.success(`${section} saved successfully`)
  }

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
      // Show interactive brand sheet - no nested scroll, page scrolls naturally
      return (
        <div className="space-y-8 max-w-5xl mx-auto pb-28">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
            <h2 className="text-3xl font-bold">Your Brand Profile</h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              AI has extracted your brand identity. Review each section and click Edit to make changes.
            </p>
          </div>

          {/* Brand sections */}
          <div className="space-y-6">
            
            {/* Color Palette Section */}
            <Card className={cn(
              "overflow-hidden transition-all border-border/50",
              editMode === 'colors' && "ring-2 ring-primary"
            )}>
              <div className="flex items-center justify-between p-5 border-b border-border/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                    <Palette className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold">Color Palette</h3>
                </div>
                <Button 
                  variant={editMode === 'colors' ? 'default' : 'outline'} 
                  size="sm"
                  onClick={() => editMode === 'colors' ? saveSection('Colors') : setEditMode('colors')}
                >
                  {editMode === 'colors' ? (
                    <><Save className="h-4 w-4 mr-2" /> Save</>
                  ) : (
                    <><Edit3 className="h-4 w-4 mr-2" /> Edit</>
                  )}
                </Button>
              </div>
              
              <div className="p-5">
                {editMode === 'colors' ? (
                  <div className="space-y-6">
                    {/* Primary Colors Edit */}
                    <div>
                      <Label className="text-sm font-medium">Primary Colors</Label>
                      <p className="text-xs text-muted-foreground mb-3">Click a color swatch to change it, or edit the hex code directly</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {brandAnalysis.colors.primary.hex.map((color, i) => (
                          <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card/50">
                            <input
                              type="color"
                              value={color}
                              onChange={(e) => {
                                const updated = { ...brandAnalysis }
                                updated.colors.primary.hex[i] = e.target.value
                                setBrandAnalysis(updated)
                              }}
                              className="w-14 h-14 rounded-xl cursor-pointer border-0 shadow-sm"
                            />
                            <div className="flex-1 space-y-2">
                              <Input
                                value={color}
                                onChange={(e) => {
                                  const updated = { ...brandAnalysis }
                                  updated.colors.primary.hex[i] = e.target.value
                                  setBrandAnalysis(updated)
                                }}
                                className="font-mono text-sm"
                                placeholder="#000000"
                              />
                              <Input
                                value={brandAnalysis.colors.primary.name?.[i] || ''}
                                onChange={(e) => {
                                  const updated = { ...brandAnalysis }
                                  if (!updated.colors.primary.name) updated.colors.primary.name = []
                                  updated.colors.primary.name[i] = e.target.value
                                  setBrandAnalysis(updated)
                                }}
                                className="text-sm"
                                placeholder="Color name"
                              />
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive"
                              onClick={() => {
                                const updated = { ...brandAnalysis }
                                updated.colors.primary.hex = updated.colors.primary.hex.filter((_, idx) => idx !== i)
                                updated.colors.primary.name = (updated.colors.primary.name || []).filter((_, idx) => idx !== i)
                                setBrandAnalysis(updated)
                              }}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                        <Button
                          variant="outline"
                          className="h-24 border-dashed border-2 hover:border-primary hover:bg-primary/5"
                          onClick={() => {
                            const updated = { ...brandAnalysis }
                            updated.colors.primary.hex.push('#6366f1')
                            if (!updated.colors.primary.name) updated.colors.primary.name = []
                            updated.colors.primary.name.push('')
                            setBrandAnalysis(updated)
                          }}
                        >
                          + Add Color
                        </Button>
                      </div>
                    </div>
                    
                    {/* Secondary Colors Edit */}
                    {brandAnalysis.colors.secondary.hex.length > 0 && (
                      <div>
                        <Label className="text-sm font-medium">Secondary Colors</Label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-3">
                          {brandAnalysis.colors.secondary.hex.map((color, i) => (
                            <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card/50">
                              <input
                                type="color"
                                value={color}
                                onChange={(e) => {
                                  const updated = { ...brandAnalysis }
                                  updated.colors.secondary.hex[i] = e.target.value
                                  setBrandAnalysis(updated)
                                }}
                                className="w-14 h-14 rounded-xl cursor-pointer border-0 shadow-sm"
                              />
                              <div className="flex-1">
                                <Input
                                  value={color}
                                  onChange={(e) => {
                                    const updated = { ...brandAnalysis }
                                    updated.colors.secondary.hex[i] = e.target.value
                                    setBrandAnalysis(updated)
                                  }}
                                  className="font-mono text-sm"
                                />
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                onClick={() => {
                                  const updated = { ...brandAnalysis }
                                  updated.colors.secondary.hex = updated.colors.secondary.hex.filter((_, idx) => idx !== i)
                                  setBrandAnalysis(updated)
                                }}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Primary Colors Display - Rich cards */}
                    {brandAnalysis.colors.primary.hex.length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-3">Primary Colors</p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                          {brandAnalysis.colors.primary.hex.map((color, i) => (
                            <div key={i} className="rounded-xl border border-border overflow-hidden bg-card shadow-sm hover:shadow-md transition-shadow">
                              <div
                                className="h-24 w-full"
                                style={{ backgroundColor: color }}
                              />
                              <div className="p-3 space-y-1">
                                <p className="font-mono text-sm font-medium">{color.toUpperCase()}</p>
                                {brandAnalysis.colors.primary.name?.[i] && (
                                  <p className="text-xs text-muted-foreground">{brandAnalysis.colors.primary.name[i]}</p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                        {brandAnalysis.colors.primary.usage && (
                          <p className="text-sm text-muted-foreground mt-3 italic">{brandAnalysis.colors.primary.usage}</p>
                        )}
                      </div>
                    )}
                    
                    {/* Secondary Colors Display */}
                    {brandAnalysis.colors.secondary.hex.length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-3">Secondary Colors</p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                          {brandAnalysis.colors.secondary.hex.map((color, i) => (
                            <div key={i} className="rounded-xl border border-border overflow-hidden bg-card shadow-sm hover:shadow-md transition-shadow">
                              <div
                                className="h-24 w-full"
                                style={{ backgroundColor: color }}
                              />
                              <div className="p-3 space-y-1">
                                <p className="font-mono text-sm font-medium">{color.toUpperCase()}</p>
                                {brandAnalysis.colors.secondary.name?.[i] && (
                                  <p className="text-xs text-muted-foreground">{brandAnalysis.colors.secondary.name[i]}</p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Neutral Colors Display */}
                    {brandAnalysis.colors.neutral.hex.length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-3">Neutral Colors</p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                          {brandAnalysis.colors.neutral.hex.map((color, i) => (
                            <div key={i} className="rounded-xl border border-border overflow-hidden bg-card shadow-sm hover:shadow-md transition-shadow">
                              <div
                                className="h-24 w-full"
                                style={{ backgroundColor: color }}
                              />
                              <div className="p-3 space-y-1">
                                <p className="font-mono text-sm font-medium">{color.toUpperCase()}</p>
                                {brandAnalysis.colors.neutral.name?.[i] && (
                                  <p className="text-xs text-muted-foreground">{brandAnalysis.colors.neutral.name[i]}</p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </Card>

            {/* Typography Section */}
            <Card className={cn(
              "overflow-hidden transition-all border-border/50",
              editMode === 'typography' && "ring-2 ring-primary"
            )}>
              <div className="flex items-center justify-between p-5 border-b border-border/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                    <Type className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold">Typography</h3>
                </div>
                <Button 
                  variant={editMode === 'typography' ? 'default' : 'outline'} 
                  size="sm"
                  onClick={() => editMode === 'typography' ? saveSection('Typography') : setEditMode('typography')}
                >
                  {editMode === 'typography' ? (
                    <><Save className="h-4 w-4 mr-2" /> Save</>
                  ) : (
                    <><Edit3 className="h-4 w-4 mr-2" /> Edit</>
                  )}
                </Button>
              </div>
              
              <div className="p-5">
                {editMode === 'typography' ? (
                  <div className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="p-4 rounded-xl border border-border bg-card/50">
                        <Label className="text-sm font-medium">Primary Font</Label>
                        <Input
                          value={brandAnalysis.typography.primary.family}
                          onChange={(e) => {
                            const updated = { ...brandAnalysis }
                            updated.typography.primary.family = e.target.value
                            setBrandAnalysis(updated)
                          }}
                          className="mt-2"
                          placeholder="e.g., Inter, Roboto"
                        />
                        <p className="text-xs text-muted-foreground mt-2">Used for headings and titles</p>
                      </div>
                      <div className="p-4 rounded-xl border border-border bg-card/50">
                        <Label className="text-sm font-medium">Secondary Font</Label>
                        <Input
                          value={brandAnalysis.typography.secondary.family}
                          onChange={(e) => {
                            const updated = { ...brandAnalysis }
                            updated.typography.secondary.family = e.target.value
                            setBrandAnalysis(updated)
                          }}
                          className="mt-2"
                          placeholder="e.g., Open Sans, Lato"
                        />
                        <p className="text-xs text-muted-foreground mt-2">Used for body text</p>
                      </div>
                    </div>
                    <div className="p-4 rounded-xl border border-border bg-card/50">
                      <Label className="text-sm font-medium">Font Weights (comma-separated)</Label>
                      <Input
                        value={brandAnalysis.typography.primary.weights.join(', ')}
                        onChange={(e) => {
                          const updated = { ...brandAnalysis }
                          updated.typography.primary.weights = e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                          setBrandAnalysis(updated)
                        }}
                        className="mt-2"
                        placeholder="400, 500, 600, 700"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {brandAnalysis.typography.primary.family && (
                      <div className="p-5 rounded-xl border border-border bg-gradient-to-br from-card to-muted/30">
                        <p className="text-xs font-medium text-primary mb-2">Primary Font</p>
                        <p 
                          className="text-3xl font-bold mb-3"
                          style={{ fontFamily: brandAnalysis.typography.primary.family }}
                        >
                          {brandAnalysis.typography.primary.family}
                        </p>
                        <p 
                          className="text-base text-muted-foreground leading-relaxed"
                          style={{ fontFamily: brandAnalysis.typography.primary.family }}
                        >
                          The quick brown fox jumps over the lazy dog
                        </p>
                        {brandAnalysis.typography.primary.weights.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-4">
                            {brandAnalysis.typography.primary.weights.map((weight, i) => (
                              <span key={i} className="px-2 py-1 text-xs rounded-md bg-muted">{weight}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                    {brandAnalysis.typography.secondary.family && (
                      <div className="p-5 rounded-xl border border-border bg-gradient-to-br from-card to-muted/30">
                        <p className="text-xs font-medium text-primary mb-2">Secondary Font</p>
                        <p 
                          className="text-2xl font-semibold mb-3"
                          style={{ fontFamily: brandAnalysis.typography.secondary.family }}
                        >
                          {brandAnalysis.typography.secondary.family}
                        </p>
                        <p 
                          className="text-base text-muted-foreground leading-relaxed"
                          style={{ fontFamily: brandAnalysis.typography.secondary.family }}
                        >
                          The quick brown fox jumps over the lazy dog
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </Card>

            {/* Brand Voice Section */}
            <Card className={cn(
              "overflow-hidden transition-all border-border/50",
              editMode === 'voice' && "ring-2 ring-primary"
            )}>
              <div className="flex items-center justify-between p-5 border-b border-border/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                    <Volume2 className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold">Brand Voice</h3>
                </div>
                <Button 
                  variant={editMode === 'voice' ? 'default' : 'outline'} 
                  size="sm"
                  onClick={() => editMode === 'voice' ? saveSection('Voice') : setEditMode('voice')}
                >
                  {editMode === 'voice' ? (
                    <><Save className="h-4 w-4 mr-2" /> Save</>
                  ) : (
                    <><Edit3 className="h-4 w-4 mr-2" /> Edit</>
                  )}
                </Button>
              </div>
              
              <div className="p-5">
                {editMode === 'voice' ? (
                  <div className="space-y-5">
                    <div className="p-4 rounded-xl border border-border bg-card/50">
                      <Label className="text-sm font-medium">Tone & Personality</Label>
                      <p className="text-xs text-muted-foreground mb-2">Separate with commas</p>
                      <Textarea
                        value={brandAnalysis.voice.tone.join(', ')}
                        onChange={(e) => {
                          const updated = { ...brandAnalysis }
                          updated.voice.tone = e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                          setBrandAnalysis(updated)
                        }}
                        className="min-h-[80px]"
                        placeholder="Professional, Friendly, Innovative, Trustworthy..."
                      />
                    </div>
                    <div className="p-4 rounded-xl border border-border bg-card/50">
                      <Label className="text-sm font-medium">Example Phrases</Label>
                      <p className="text-xs text-muted-foreground mb-2">One phrase per line</p>
                      <Textarea
                        value={brandAnalysis.voice.phrases.join('\n')}
                        onChange={(e) => {
                          const updated = { ...brandAnalysis }
                          updated.voice.phrases = e.target.value.split('\n').map(s => s.trim()).filter(Boolean)
                          setBrandAnalysis(updated)
                        }}
                        className="min-h-[120px]"
                        placeholder="Enter phrases that represent your brand voice..."
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-5">
                    <div className="flex flex-wrap gap-2">
                      {brandAnalysis.voice.tone.map((tone, i) => (
                        <Badge 
                          key={i} 
                          variant="outline" 
                          className="px-3 py-1.5 text-sm font-medium border-primary/30 bg-primary/5"
                        >
                          {tone}
                        </Badge>
                      ))}
                    </div>
                    {brandAnalysis.voice.phrases.length > 0 && (
                      <div className="space-y-3">
                        <p className="text-sm font-medium">Example Phrases</p>
                        <div className="space-y-2">
                          {brandAnalysis.voice.phrases.slice(0, 4).map((phrase, i) => (
                            <div key={i} className="p-3 rounded-lg bg-muted/50 border-l-2 border-primary/30">
                              <p className="text-sm italic">&ldquo;{phrase}&rdquo;</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </Card>

            {/* Target Audience Section */}
            <Card className={cn(
              "overflow-hidden transition-all border-border/50",
              editMode === 'targetAudience' && "ring-2 ring-primary"
            )}>
              <div className="flex items-center justify-between p-5 border-b border-border/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold">Target Audience</h3>
                </div>
                <Button 
                  variant={editMode === 'targetAudience' ? 'default' : 'outline'} 
                  size="sm"
                  onClick={() => editMode === 'targetAudience' ? saveSection('Audience') : setEditMode('targetAudience')}
                >
                  {editMode === 'targetAudience' ? (
                    <><Save className="h-4 w-4 mr-2" /> Save</>
                  ) : (
                    <><Edit3 className="h-4 w-4 mr-2" /> Edit</>
                  )}
                </Button>
              </div>
              
              <div className="p-5">
                {editMode === 'targetAudience' ? (
                  <div className="space-y-5">
                    <div className="p-4 rounded-xl border border-border bg-card/50">
                      <Label className="text-sm font-medium">Audience Traits</Label>
                      <p className="text-xs text-muted-foreground mb-2">One trait per line</p>
                      <Textarea
                        value={brandAnalysis.targetAudience.psychographics.join('\n')}
                        onChange={(e) => {
                          const updated = { ...brandAnalysis }
                          updated.targetAudience.psychographics = e.target.value.split('\n').map(s => s.trim()).filter(Boolean)
                          setBrandAnalysis(updated)
                        }}
                        className="min-h-[100px]"
                        placeholder="Ambitious and growth-oriented&#10;Values authenticity..."
                      />
                    </div>
                    <div className="p-4 rounded-xl border border-border bg-card/50">
                      <Label className="text-sm font-medium">Pain Points</Label>
                      <p className="text-xs text-muted-foreground mb-2">One pain point per line</p>
                      <Textarea
                        value={brandAnalysis.targetAudience.painPoints.join('\n')}
                        onChange={(e) => {
                          const updated = { ...brandAnalysis }
                          updated.targetAudience.painPoints = e.target.value.split('\n').map(s => s.trim()).filter(Boolean)
                          setBrandAnalysis(updated)
                        }}
                        className="min-h-[100px]"
                        placeholder="Struggling with time management&#10;Need better tools..."
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-4 rounded-xl bg-gradient-to-br from-blue-500/5 to-transparent border border-blue-500/10">
                      <p className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-3">Audience Profile</p>
                      <ul className="space-y-2">
                        {brandAnalysis.targetAudience.psychographics.slice(0, 6).map((item, i) => (
                          <li key={i} className="text-sm flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="p-4 rounded-xl bg-gradient-to-br from-orange-500/5 to-transparent border border-orange-500/10">
                      <p className="text-sm font-medium text-orange-600 dark:text-orange-400 mb-3">Pain Points</p>
                      <ul className="space-y-2">
                        {brandAnalysis.targetAudience.painPoints.slice(0, 6).map((item, i) => (
                          <li key={i} className="text-sm flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-2 flex-shrink-0" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* Mission & Values Section */}
            <Card className={cn(
              "overflow-hidden transition-all border-border/50",
              editMode === 'brandStrategy' && "ring-2 ring-primary"
            )}>
              <div className="flex items-center justify-between p-5 border-b border-border/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                    <Lightbulb className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold">Mission & Values</h3>
                </div>
                <Button 
                  variant={editMode === 'brandStrategy' ? 'default' : 'outline'} 
                  size="sm"
                  onClick={() => editMode === 'brandStrategy' ? saveSection('Mission') : setEditMode('brandStrategy')}
                >
                  {editMode === 'brandStrategy' ? (
                    <><Save className="h-4 w-4 mr-2" /> Save</>
                  ) : (
                    <><Edit3 className="h-4 w-4 mr-2" /> Edit</>
                  )}
                </Button>
              </div>
              
              <div className="p-5">
                {editMode === 'brandStrategy' ? (
                  <div className="space-y-5">
                    <div className="p-4 rounded-xl border border-border bg-card/50">
                      <Label className="text-sm font-medium">Mission Statement</Label>
                      <Textarea
                        value={brandAnalysis.brandStrategy.mission}
                        onChange={(e) => {
                          const updated = { ...brandAnalysis }
                          updated.brandStrategy.mission = e.target.value
                          setBrandAnalysis(updated)
                        }}
                        className="mt-2 min-h-[80px]"
                        placeholder="Our mission is to..."
                      />
                    </div>
                    <div className="p-4 rounded-xl border border-border bg-card/50">
                      <Label className="text-sm font-medium">Vision</Label>
                      <Textarea
                        value={brandAnalysis.brandStrategy.vision}
                        onChange={(e) => {
                          const updated = { ...brandAnalysis }
                          updated.brandStrategy.vision = e.target.value
                          setBrandAnalysis(updated)
                        }}
                        className="mt-2"
                        placeholder="Our vision is..."
                      />
                    </div>
                    <div className="p-4 rounded-xl border border-border bg-card/50">
                      <Label className="text-sm font-medium">Core Values</Label>
                      <p className="text-xs text-muted-foreground mb-2">Separate with commas</p>
                      <Input
                        value={brandAnalysis.brandStrategy.values.join(', ')}
                        onChange={(e) => {
                          const updated = { ...brandAnalysis }
                          updated.brandStrategy.values = e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                          setBrandAnalysis(updated)
                        }}
                        placeholder="Innovation, Trust, Excellence..."
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-5">
                    {brandAnalysis.brandStrategy.mission && (
                      <div className="p-5 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
                        <p className="text-xs font-medium text-primary mb-2">Mission Statement</p>
                        <p className="text-lg leading-relaxed">&ldquo;{brandAnalysis.brandStrategy.mission}&rdquo;</p>
                      </div>
                    )}
                    {brandAnalysis.brandStrategy.vision && (
                      <div className="p-4 rounded-xl bg-muted/50 border border-border">
                        <p className="text-xs font-medium text-muted-foreground mb-2">Vision</p>
                        <p className="text-sm">{brandAnalysis.brandStrategy.vision}</p>
                      </div>
                    )}
                    {brandAnalysis.brandStrategy.values.length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-3">Core Values</p>
                        <div className="flex flex-wrap gap-2">
                          {brandAnalysis.brandStrategy.values.map((value, i) => (
                            <div 
                              key={i} 
                              className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 text-sm font-medium"
                            >
                              <div className="h-2 w-2 bg-primary rounded-full" />
                              {value}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </Card>

            {/* Visual Style Section */}
            {(brandAnalysis.visualStyle.principles.length > 0 || brandAnalysis.visualStyle.imagery.length > 0) && (
              <Card className={cn(
                "overflow-hidden transition-all border-border/50",
                editMode === 'visualStyle' && "ring-2 ring-primary"
              )}>
                <div className="flex items-center justify-between p-5 border-b border-border/50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                      <Image className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold">Visual Style</h3>
                  </div>
                  <Button 
                    variant={editMode === 'visualStyle' ? 'default' : 'outline'} 
                    size="sm"
                    onClick={() => editMode === 'visualStyle' ? saveSection('Visual') : setEditMode('visualStyle')}
                  >
                    {editMode === 'visualStyle' ? (
                      <><Save className="h-4 w-4 mr-2" /> Save</>
                    ) : (
                      <><Edit3 className="h-4 w-4 mr-2" /> Edit</>
                    )}
                  </Button>
                </div>
                
                <div className="p-5">
                  {editMode === 'visualStyle' ? (
                    <div className="space-y-5">
                      <div className="p-4 rounded-xl border border-border bg-card/50">
                        <Label className="text-sm font-medium">Visual Principles</Label>
                        <p className="text-xs text-muted-foreground mb-2">Separate with commas</p>
                        <Textarea
                          value={brandAnalysis.visualStyle.principles.join(', ')}
                          onChange={(e) => {
                            const updated = { ...brandAnalysis }
                            updated.visualStyle.principles = e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                            setBrandAnalysis(updated)
                          }}
                          placeholder="Clean, Modern, Bold..."
                        />
                      </div>
                      <div className="p-4 rounded-xl border border-border bg-card/50">
                        <Label className="text-sm font-medium">Imagery Style</Label>
                        <p className="text-xs text-muted-foreground mb-2">Separate with commas</p>
                        <Textarea
                          value={brandAnalysis.visualStyle.imagery.join(', ')}
                          onChange={(e) => {
                            const updated = { ...brandAnalysis }
                            updated.visualStyle.imagery = e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                            setBrandAnalysis(updated)
                          }}
                          placeholder="Authentic photos, Minimal graphics..."
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      {brandAnalysis.visualStyle.principles.length > 0 && (
                        <div className="p-4 rounded-xl bg-muted/50 border border-border">
                          <p className="text-sm font-medium mb-3">Design Principles</p>
                          <div className="flex flex-wrap gap-2">
                            {brandAnalysis.visualStyle.principles.map((style, i) => (
                              <Badge key={i} variant="outline" className="px-3 py-1">{style}</Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      {brandAnalysis.visualStyle.imagery.length > 0 && (
                        <div className="p-4 rounded-xl bg-muted/50 border border-border">
                          <p className="text-sm font-medium mb-3">Imagery Guidelines</p>
                          <div className="flex flex-wrap gap-2">
                            {brandAnalysis.visualStyle.imagery.map((img, i) => (
                              <Badge key={i} variant="secondary" className="px-3 py-1">{img}</Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* Competitors Section */}
            {(brandAnalysis.competitors.direct.length > 0 || brandAnalysis.competitors.positioning) && (
              <Card className={cn(
                "overflow-hidden transition-all border-border/50",
                editMode === 'competitors' && "ring-2 ring-primary"
              )}>
                <div className="flex items-center justify-between p-5 border-b border-border/50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                      <Trophy className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold">Competitive Position</h3>
                  </div>
                  <Button 
                    variant={editMode === 'competitors' ? 'default' : 'outline'} 
                    size="sm"
                    onClick={() => editMode === 'competitors' ? saveSection('Competitors') : setEditMode('competitors')}
                  >
                    {editMode === 'competitors' ? (
                      <><Save className="h-4 w-4 mr-2" /> Save</>
                    ) : (
                      <><Edit3 className="h-4 w-4 mr-2" /> Edit</>
                    )}
                  </Button>
                </div>
                
                <div className="p-5">
                  {editMode === 'competitors' ? (
                    <div className="space-y-5">
                      <div className="p-4 rounded-xl border border-border bg-card/50">
                        <Label className="text-sm font-medium">Direct Competitors</Label>
                        <p className="text-xs text-muted-foreground mb-2">Separate with commas</p>
                        <Input
                          value={brandAnalysis.competitors.direct.join(', ')}
                          onChange={(e) => {
                            const updated = { ...brandAnalysis }
                            updated.competitors.direct = e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                            setBrandAnalysis(updated)
                          }}
                        />
                      </div>
                      <div className="p-4 rounded-xl border border-border bg-card/50">
                        <Label className="text-sm font-medium">Market Positioning</Label>
                        <Textarea
                          value={brandAnalysis.competitors.positioning}
                          onChange={(e) => {
                            const updated = { ...brandAnalysis }
                            updated.competitors.positioning = e.target.value
                            setBrandAnalysis(updated)
                          }}
                          className="mt-2"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {brandAnalysis.competitors.direct.length > 0 && (
                        <div>
                          <p className="text-sm font-medium mb-3">Key Competitors</p>
                          <div className="flex flex-wrap gap-2">
                            {brandAnalysis.competitors.direct.map((comp, i) => (
                              <div 
                                key={i} 
                                className="px-4 py-2 rounded-lg bg-muted/50 border border-border text-sm font-medium"
                              >
                                {comp}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {brandAnalysis.competitors.positioning && (
                        <div className="p-4 rounded-xl bg-muted/30 border border-border">
                          <p className="text-xs font-medium text-muted-foreground mb-2">Market Positioning</p>
                          <p className="text-sm">{brandAnalysis.competitors.positioning}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </Card>
            )}
          </div>

          {/* Fixed bottom navigation bar */}
          <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-background via-background/98 to-transparent pt-8 pb-6 z-10">
            <div className="max-w-5xl mx-auto px-6 flex items-center justify-between">
              <Button
                variant="ghost"
                size="lg"
                onClick={() => setMode(null)}
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              
              <Button
                size="lg"
                onClick={async () => {
                  // Close any open edit mode first
                  setEditMode(null)
                  
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
                  updateFormData('brandAnalysisCompleted', true)

                  // Immediately save progress with actual data to prevent loss on refresh
                  if (onSaveProgress) {
                    try {
                      await onSaveProgress({
                        brandAnalysis,
                        brandIdentity: {
                          colors: brandAnalysis.colors,
                          typography: brandAnalysis.typography,
                          voice: brandAnalysis.voice,
                          visualStyle: brandAnalysis.visualStyle,
                          targetAudience: brandAnalysis.targetAudience,
                          brandStrategy: brandAnalysis.brandStrategy,
                          competitors: brandAnalysis.competitors,
                          logoUsage: brandAnalysis.logoUsage
                        },
                        brandAnalysisCompleted: true
                      })
                    } catch (error) {
                      console.error('Error saving brand analysis progress:', error)
                    }
                  }

                  // Trigger completion callback to advance
                  if (onComplete) onComplete()
                }}
              >
                Continue to AI Avatar
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
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
              Max 10 files, up to 25MB each
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

        {/* Rejected files alert */}
        <AnimatePresence>
          {showRejectedAlert && rejectedFiles.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <Alert variant="destructive" className="border-destructive/50 bg-destructive/10">
                <FileWarning className="h-4 w-4" />
                <AlertTitle className="flex items-center justify-between">
                  <span>{rejectedFiles.length} file{rejectedFiles.length > 1 ? 's' : ''} couldn't be added</span>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setShowRejectedAlert(false)}
                    className="h-6 w-6 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </AlertTitle>
                <AlertDescription>
                  <ul className="mt-2 space-y-1 text-sm">
                    {rejectedFiles.map((file, i) => (
                      <li key={i} className="flex gap-2">
                        <span className="font-medium truncate max-w-[200px]">{file.name}</span>
                        <span className="text-destructive/80">— {file.reason}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-3 text-xs text-muted-foreground">
                    Supported formats: PDF, PNG, JPG, SVG, WebP, GIF, Word (.doc, .docx), PowerPoint (.ppt, .pptx), Text files (.txt, .md)
                  </p>
                </AlertDescription>
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Analysis progress - Enhanced UI */}
        {isAnalyzing && (
          <Card className="p-6 border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
            <div className="space-y-6">
              {/* Header with spinner */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                      <Loader2 className="h-5 w-5 text-primary animate-spin" />
                    </div>
                    <motion.div
                      className="absolute inset-0 rounded-full border-2 border-primary/30"
                      animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  </div>
                  <div>
                    <p className="font-semibold">Analyzing Your Brand Materials</p>
                    <p className="text-sm text-muted-foreground mt-0.5">{analysisStep}</p>
                  </div>
                </div>
                <Badge variant="outline" className="text-sm">
                  {analysisProgress}%
                </Badge>
              </div>
              
              {/* Progress bar */}
              <div className="space-y-2">
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-primary to-primary/80"
                    initial={{ width: 0 }}
                    animate={{ width: `${analysisProgress}%` }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  />
                </div>
              </div>
              
              {/* Rotating tips */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentTipIndex}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="p-4 rounded-lg bg-card border border-border"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Sparkles className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{ANALYSIS_TIPS[currentTipIndex].title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {ANALYSIS_TIPS[currentTipIndex].description}
                      </p>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
              
              {/* Tip indicators */}
              <div className="flex justify-center gap-1.5">
                {ANALYSIS_TIPS.map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      "w-1.5 h-1.5 rounded-full transition-all",
                      i === currentTipIndex ? "bg-primary w-4" : "bg-muted-foreground/30"
                    )}
                  />
                ))}
              </div>
            </div>
          </Card>
        )}
        
        {/* Error state with recovery options */}
        {analysisError && !isAnalyzing && (
          <Card className="p-6 border-2 border-destructive/30 bg-destructive/5">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-destructive/20 flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="h-5 w-5 text-destructive" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-destructive">Analysis Failed</p>
                  <p className="text-sm text-muted-foreground mt-1">{analysisError}</p>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-3">
                <p className="text-sm font-medium">What would you like to do?</p>
                <div className="flex flex-wrap gap-3">
                  <Button
                    variant="default"
                    onClick={() => {
                      resetAnalysis()
                      analyzeBrandMaterials()
                    }}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Try Again
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      resetAnalysis()
                      setMode('manual')
                    }}
                  >
                    <Edit3 className="h-4 w-4 mr-2" />
                    Manual Setup Instead
                  </Button>
                  {onSkip && (
                    <Button
                      variant="ghost"
                      onClick={() => {
                        resetAnalysis()
                        onSkip()
                      }}
                    >
                      <SkipForward className="h-4 w-4 mr-2" />
                      Skip This Step
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Bottom buttons - only show when not in error state (error has its own buttons) */}
        {!analysisError && (
          <div className="flex justify-between items-center">
            <Button variant="outline" onClick={() => setMode(null)} disabled={isAnalyzing}>
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
        )}
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
            onClick={async () => {
              if (manualStep < manualSteps.length - 1) {
                setManualStep(manualStep + 1)
              } else {
                // Complete manual setup - save immediately before advancing
                updateFormData('brandAnalysisCompleted', true)

                if (onSaveProgress) {
                  try {
                    await onSaveProgress({
                      ...formData,
                      brandAnalysisCompleted: true
                    })
                  } catch (error) {
                    console.error('Error saving manual brand setup:', error)
                  }
                }

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
