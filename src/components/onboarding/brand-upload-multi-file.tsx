"use client"

import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Upload, X, FileText, Image as ImageIcon, File, CheckCircle,
  AlertCircle, Loader2, Sparkles, Download, Eye, Trash2,
  FolderOpen, FilePlus, RefreshCw, Info, Zap
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface UploadedFile {
  id: string
  file: File
  name: string
  size: number
  type: string
  preview?: string
  status: 'pending' | 'uploaded' | 'analyzing' | 'complete' | 'error'
  error?: string
}

interface BrandUploadMultiFileProps {
  onAnalysisComplete: (analysis: any) => void
  onSkip?: () => void
  maxFiles?: number
  maxTotalSize?: number // in MB
}

const SUPPORTED_FORMATS = {
  documents: ['application/pdf', 'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'],
  images: ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp'],
  design: ['image/x-photoshop', 'image/vnd.adobe.photoshop']
}

const ALL_SUPPORTED = [...SUPPORTED_FORMATS.documents, ...SUPPORTED_FORMATS.images, ...SUPPORTED_FORMATS.design]

export function BrandUploadMultiFile({
  onAnalysisComplete,
  onSkip,
  maxFiles = 10,
  maxTotalSize = 50 // MB
}: BrandUploadMultiFileProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dropZoneRef = useRef<HTMLDivElement>(null)
  
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisProgress, setAnalysisProgress] = useState(0)
  const [analysisStage, setAnalysisStage] = useState('')
  const [isDragging, setIsDragging] = useState(false)

  // Calculate total size
  const totalSizeMB = files.reduce((acc, f) => acc + f.size, 0) / (1024 * 1024)
  const canAddMore = files.length < maxFiles && totalSizeMB < maxTotalSize

  // Get file icon
  const getFileIcon = (type: string) => {
    if (SUPPORTED_FORMATS.documents.includes(type)) return FileText
    if (SUPPORTED_FORMATS.images.includes(type)) return ImageIcon
    return File
  }

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  // Validate file
  const validateFile = (file: File): string | null => {
    // Check file type
    if (!ALL_SUPPORTED.includes(file.type)) {
      return `File type not supported: ${file.type}`
    }
    
    // Check file size (max 10MB per file)
    if (file.size > 10 * 1024 * 1024) {
      return 'File too large (max 10MB)'
    }
    
    // Check total size
    if (totalSizeMB + (file.size / (1024 * 1024)) > maxTotalSize) {
      return `Total size would exceed ${maxTotalSize}MB limit`
    }
    
    // Check duplicate
    if (files.some(f => f.name === file.name && f.size === file.size)) {
      return 'File already added'
    }
    
    return null
  }

  // Handle file selection
  const handleFiles = useCallback(async (fileList: FileList) => {
    if (!canAddMore) {
      toast.error(`Maximum ${maxFiles} files allowed`)
      return
    }

    const newFiles: UploadedFile[] = []
    
    for (let i = 0; i < fileList.length && files.length + newFiles.length < maxFiles; i++) {
      const file = fileList[i]
      const error = validateFile(file)
      
      if (error) {
        toast.error(`${file.name}: ${error}`)
        continue
      }

      // Create preview for images
      let preview: string | undefined
      if (file.type.startsWith('image/')) {
        preview = await new Promise<string>((resolve) => {
          const reader = new FileReader()
          reader.onload = (e) => resolve(e.target?.result as string)
          reader.readAsDataURL(file)
        })
      }

      newFiles.push({
        id: `${Date.now()}-${i}`,
        file,
        name: file.name,
        size: file.size,
        type: file.type,
        preview,
        status: 'pending'
      })
    }

    if (newFiles.length > 0) {
      setFiles(prev => [...prev, ...newFiles])
      toast.success(`${newFiles.length} file(s) added successfully`)
    }
  }, [files, canAddMore, maxFiles, maxTotalSize])

  // File input change
  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFiles(files)
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Drag and drop handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      handleFiles(files)
    }
  }

  // Remove file
  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id))
    toast.info('File removed')
  }

  // Clear all files
  const clearAllFiles = () => {
    setFiles([])
    toast.info('All files removed')
  }

  // Start AI analysis
  const startAnalysis = async () => {
    if (files.length === 0) {
      toast.error('Please upload at least one file')
      return
    }

    setIsAnalyzing(true)
    setAnalysisProgress(0)
    setAnalysisStage('Uploading files...')

    try {
      // Update files to uploading status
      setFiles(prev => prev.map(f => ({ ...f, status: 'uploaded' as const })))
      setAnalysisProgress(10)

      // Prepare FormData
      const formData = new FormData()
      files.forEach(f => {
        formData.append('files', f.file)
      })

      setAnalysisStage('Analyzing color palettes...')
      setAnalysisProgress(25)

      // Call analysis API
      const response = await fetch('/api/brand/analyze-multiple', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error('Analysis failed')
      }

      setAnalysisProgress(40)
      setAnalysisStage('Extracting typography...')
      
      // Simulate progressive updates (in reality, you'd use Server-Sent Events)
      await new Promise(resolve => setTimeout(resolve, 1000))
      setAnalysisProgress(55)
      setAnalysisStage('Understanding brand voice...')
      
      await new Promise(resolve => setTimeout(resolve, 1000))
      setAnalysisProgress(70)
      setAnalysisStage('Identifying visual patterns...')
      
      await new Promise(resolve => setTimeout(resolve, 1000))
      setAnalysisProgress(85)
      setAnalysisStage('Analyzing target audience...')
      
      const result = await response.json()
      
      setAnalysisProgress(95)
      setAnalysisStage('Generating brand summary...')
      
      await new Promise(resolve => setTimeout(resolve, 500))
      setAnalysisProgress(100)
      setAnalysisStage('Analysis complete!')

      // Mark files as complete
      setFiles(prev => prev.map(f => ({ ...f, status: 'complete' as const })))

      toast.success('Brand analysis complete!')
      
      // Wait a moment to show completion
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Call completion handler with results
      onAnalysisComplete(result.analysis)

    } catch (error) {
      console.error('Analysis error:', error)
      setFiles(prev => prev.map(f => ({ ...f, status: 'error' as const })))
      toast.error(error instanceof Error ? error.message : 'Analysis failed')
      setIsAnalyzing(false)
    }
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-24">
      {/* Header */}
      <div className="text-center space-y-3">
        <h2 className="text-3xl font-bold">Upload Brand Materials</h2>
        <p className="text-muted-foreground">
          Upload your brand book, style guide, or any documents that represent your brand identity
        </p>
        <div className="flex justify-center gap-2 flex-wrap">
          <Badge variant="outline">PDF</Badge>
          <Badge variant="outline">PowerPoint</Badge>
          <Badge variant="outline">Images (PNG, JPG, SVG)</Badge>
          <Badge variant="outline">Photoshop</Badge>
        </div>
      </div>

      {/* Drop Zone */}
      <Card
        ref={dropZoneRef}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "border-2 border-dashed transition-all cursor-pointer",
          isDragging
            ? "border-primary bg-primary/5 scale-[1.02]"
            : "border-muted-foreground/25 hover:border-primary/50",
          !canAddMore && "opacity-50 cursor-not-allowed"
        )}
      >
        <div
          onClick={() => canAddMore && fileInputRef.current?.click()}
          className="p-12 text-center space-y-4"
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={ALL_SUPPORTED.join(',')}
            onChange={handleFileInput}
            className="hidden"
            disabled={!canAddMore}
          />

          <div className="flex justify-center">
            <div className={cn(
              "p-4 rounded-full transition-all",
              isDragging ? "bg-primary text-primary-foreground scale-110" : "bg-muted"
            )}>
              {isDragging ? (
                <FilePlus className="h-12 w-12" />
              ) : (
                <Upload className="h-12 w-12 text-muted-foreground" />
              )}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">
              {isDragging ? 'Drop files here' : 'Drag & drop files here'}
            </h3>
            <p className="text-sm text-muted-foreground">
              or click to browse your computer
            </p>
          </div>

          <div className="text-xs text-muted-foreground space-y-1">
            <p>Maximum {maxFiles} files, {maxTotalSize}MB total</p>
            <p>Up to 10MB per file</p>
          </div>

          {!canAddMore && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {files.length >= maxFiles
                  ? `Maximum ${maxFiles} files reached`
                  : `Maximum total size of ${maxTotalSize}MB reached`}
              </AlertDescription>
            </Alert>
          )}
        </div>
      </Card>

      {/* Files List */}
      {files.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-lg">
                Uploaded Files ({files.length}/{maxFiles})
              </h3>
              <p className="text-sm text-muted-foreground">
                Total size: {totalSizeMB.toFixed(2)} MB / {maxTotalSize} MB
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFiles}
              disabled={isAnalyzing}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear all
            </Button>
          </div>

          <Progress value={(totalSizeMB / maxTotalSize) * 100} className="h-1 mb-4" />

          <div className="space-y-2">
            {files.map((file) => {
              const Icon = getFileIcon(file.type)
              return (
                <motion.div
                  key={file.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg border transition-colors",
                    file.status === 'complete' && "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800",
                    file.status === 'error' && "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800",
                    file.status === 'analyzing' && "bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800"
                  )}
                >
                  {file.preview ? (
                    <img
                      src={file.preview}
                      alt={file.name}
                      className="w-12 h-12 object-cover rounded"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded bg-muted flex items-center justify-center">
                      <Icon className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(file.size)}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {file.status === 'complete' && (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    )}
                    {file.status === 'error' && (
                      <AlertCircle className="h-5 w-5 text-red-600" />
                    )}
                    {file.status === 'analyzing' && (
                      <Loader2 className="h-5 w-5 text-primary animate-spin" />
                    )}
                    
                    {!isAnalyzing && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(file.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </div>
        </Card>
      )}

      {/* What AI Will Analyze */}
      <Card className="p-6 bg-gradient-to-br from-primary/5 to-transparent">
        <h4 className="font-semibold mb-4 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          What AI Will Analyze From Your Files
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { title: 'Color Palette', desc: 'Primary, secondary, and accent colors with hex codes' },
            { title: 'Typography', desc: 'Font families, weights, and usage guidelines' },
            { title: 'Brand Voice', desc: 'Tone, personality traits, and communication style' },
            { title: 'Visual Style', desc: 'Design principles, layout patterns, imagery preferences' },
            { title: 'Logo & Assets', desc: 'Brand marks, variations, and usage rules' },
            { title: 'Target Audience', desc: 'Demographics, psychographics, and pain points' },
          ].map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-start gap-3 p-3 rounded-lg bg-background/50"
            >
              <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium text-sm">{item.title}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </Card>

      {/* Actions - Fixed at bottom */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4 z-40">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          {onSkip && (
            <Button variant="ghost" onClick={onSkip} disabled={isAnalyzing}>
              Skip AI Analysis
            </Button>
          )}
          <div className="flex-1" />
          <Button
            onClick={startAnalysis}
            disabled={files.length === 0 || isAnalyzing}
            size="lg"
            className="min-w-[200px]"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Zap className="h-5 w-5 mr-2" />
                Analyze with AI
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Analysis Progress Overlay */}
      <AnimatePresence>
        {isAnalyzing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <Card className="max-w-lg w-full p-8">
              <div className="space-y-6">
                <div className="flex justify-center">
                  <div className="relative">
                    <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
                      <Loader2 className="h-10 w-10 text-primary animate-spin" />
                    </div>
                  </div>
                </div>

                <div className="space-y-2 text-center">
                  <h3 className="text-xl font-semibold">Analyzing Your Brand</h3>
                  <p className="text-sm text-muted-foreground">{analysisStage}</p>
                </div>

                <div className="space-y-2">
                  <Progress value={analysisProgress} className="h-2" />
                  <p className="text-xs text-center text-muted-foreground">
                    {analysisProgress}% Complete
                  </p>
                </div>

                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    AI is extracting colors, fonts, voice characteristics, and visual patterns from your files.
                    This typically takes 30-60 seconds.
                  </AlertDescription>
                </Alert>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}


