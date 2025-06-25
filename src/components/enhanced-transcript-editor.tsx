'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { toast } from 'sonner'
import { Loader2, Play, SkipBack, SkipForward, Download, Copy, Check, AlertCircle, Sparkles, FileText, Settings, Eye, Video, Clock, CheckCircle2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'

interface TranscriptSegment {
  start: number
  end: number
  text: string
}

interface SubtitleSettings {
  fontFamily: string
  fontSize: number
  fontColor: string
  backgroundColor: string
  position: 'top' | 'center' | 'bottom'
  alignment: 'left' | 'center' | 'right'
  opacity: number
}

interface EnhancedTranscriptEditorProps {
  segments: TranscriptSegment[]
  onSegmentsChange: (segments: TranscriptSegment[]) => void
  projectId: string
  videoUrl: string
  onVideoUrlUpdate?: (newUrl: string, vttUrl?: string) => void
  videoDuration?: number
  onSegmentClick?: (segment: TranscriptSegment) => void
}

export function EnhancedTranscriptEditor({
  segments,
  onSegmentsChange,
  projectId,
  videoUrl,
  onVideoUrlUpdate,
  videoDuration = 0,
  onSegmentClick
}: EnhancedTranscriptEditorProps) {
  const [editingSegments, setEditingSegments] = useState(segments)
  const [subtitleSettings, setSubtitleSettings] = useState<SubtitleSettings>({
    fontFamily: 'Arial',
    fontSize: 24,
    fontColor: '#FFFFFF',
    backgroundColor: '#000000',
    position: 'bottom',
    alignment: 'center',
    opacity: 80
  })
  const [isApplying, setIsApplying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState(0)
  const [hasChanges, setHasChanges] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showPreview, setShowPreview] = useState(true)
  const [activeTab, setActiveTab] = useState('edit')
  const [processingStage, setProcessingStage] = useState('')
  const [subtitlesApplied, setSubtitlesApplied] = useState(false)

  useEffect(() => {
    setEditingSegments(segments)
  }, [segments])

  const handleSegmentEdit = (index: number, field: keyof TranscriptSegment, value: any) => {
    const newSegments = [...editingSegments]
    newSegments[index] = { ...newSegments[index], [field]: value }
    setEditingSegments(newSegments)
    setHasChanges(true)
  }

  const handleSaveChanges = () => {
    onSegmentsChange(editingSegments)
    setHasChanges(false)
    toast.success('Transcript saved successfully')
  }

  const estimateProcessingTime = () => {
    // Estimate based on video duration (roughly 1 minute per 5 minutes of video)
    const minutes = Math.ceil(videoDuration / 60)
    const processingMinutes = Math.max(1, Math.ceil(minutes / 5))
    return processingMinutes
  }

  const handleApplySubtitles = async () => {
    try {
      setIsApplying(true)
      setProgress(5)
      setProcessingStage('Preparing subtitles...')
      
      // First, generate and apply VTT subtitles for the player
      const vttContent = generateVTT(editingSegments)
      const vttBlob = new Blob([vttContent], { type: 'text/vtt' })
      const vttUrl = URL.createObjectURL(vttBlob)
      
      // Apply VTT subtitles immediately to the video player
      onVideoUrlUpdate?.(videoUrl, vttUrl)
      setSubtitlesApplied(true)
      
      setProgress(50)
      setProcessingStage('Subtitles applied to player!')
      
      // Also try to burn subtitles using cloud service if available
      try {
        const response = await fetch('/api/apply-subtitles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            projectId,
            videoUrl,
            segments: editingSegments,
            settings: subtitleSettings
          })
        })

        if (response.ok) {
          const result = await response.json()
          setProgress(75)
          setProcessingStage('Processing with cloud service...')
          
          if (result.status === 'completed' && result.videoUrl) {
            setProgress(100)
            setProcessingStage('Complete!')
            // Update with burned-in video if available
            onVideoUrlUpdate?.(result.videoUrl, result.vttUrl || vttUrl)
            toast.success('🎉 Subtitles burned into video! Your long-form content is ready.')
          } else if (result.taskId) {
            // Poll for progress
            pollTaskStatus(result.taskId, vttUrl)
          }
        } else {
          // Cloud service failed, but we still have VTT subtitles
          setProgress(100)
          setProcessingStage('Complete!')
          toast.success('✅ Subtitles applied as overlay. Your content is ready!')
        }
      } catch (cloudError) {
        // Cloud service failed, but we still have VTT subtitles
        console.log('Cloud subtitle service unavailable, using VTT overlay')
        setProgress(100)
        setProcessingStage('Complete!')
        toast.success('✅ Subtitles applied as overlay. Your content is ready!')
      }
      
      setTimeout(() => {
        setIsApplying(false)
        setProgress(0)
        setProcessingStage('')
      }, 2000)
      
    } catch (error) {
      console.error('Error applying subtitles:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to apply subtitles')
      setProgress(0)
      setProcessingStage('')
      setIsApplying(false)
    }
  }
  
  const generateVTT = (segments: TranscriptSegment[]): string => {
    let vtt = 'WEBVTT\n\n'
    segments.forEach((segment, index) => {
      const start = formatVTTTime(segment.start)
      const end = formatVTTTime(segment.end)
      vtt += `${index + 1}\n${start} --> ${end}\n${segment.text}\n\n`
    })
    return vtt
  }
  
  const formatVTTTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)
    const ms = Math.floor((seconds % 1) * 1000)
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`
  }

  const pollTaskStatus = async (taskId: string, fallbackVttUrl?: string) => {
    const stages = [
      'Generating subtitle file...',
      'Applying subtitles to video...',
      'Optimizing video quality...',
      'Finalizing...'
    ]
    let stageIndex = 0
    
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/apply-subtitles/status/${taskId}`)
        if (!response.ok) throw new Error('Failed to get status')
        
        const task = await response.json()
        const taskProgress = task.progress || 50
        
        // Update stage based on progress
        if (taskProgress > 25 && stageIndex < 1) {
          stageIndex = 1
          setProcessingStage(stages[stageIndex])
        } else if (taskProgress > 50 && stageIndex < 2) {
          stageIndex = 2
          setProcessingStage(stages[stageIndex])
        } else if (taskProgress > 75 && stageIndex < 3) {
          stageIndex = 3
          setProcessingStage(stages[stageIndex])
        }
        
        setProgress(Math.min(95, taskProgress))
        
        if (task.status === 'completed') {
          clearInterval(interval)
          setProgress(100)
          setProcessingStage('Complete!')
          if (task.outputVideoUrl || task.vttUrl || fallbackVttUrl) {
            onVideoUrlUpdate?.(task.outputVideoUrl || videoUrl, task.vttUrl || fallbackVttUrl)
            setSubtitlesApplied(true)
            toast.success('🎉 Subtitles applied! Your long-form content is ready.')
          }
          setTimeout(() => {
            setIsApplying(false)
            setProgress(0)
            setProcessingStage('')
          }, 2000)
        } else if (task.status === 'failed') {
          clearInterval(interval)
          toast.error(task.error || 'Failed to process subtitles')
          setIsApplying(false)
          setProgress(0)
          setProcessingStage('')
        }
      } catch (error) {
        clearInterval(interval)
        toast.error('Failed to check processing status')
        setIsApplying(false)
        setProgress(0)
        setProcessingStage('')
      }
    }, 2000)
  }

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const downloadTranscript = (format: 'txt' | 'srt' | 'vtt') => {
    let content = ''
    let filename = `transcript.${format}`
    
    switch (format) {
      case 'txt':
        content = editingSegments.map(s => s.text).join('\n\n')
        break
      case 'srt':
        content = editingSegments.map((s, i) => {
          const start = `${Math.floor(s.start/3600).toString().padStart(2,'0')}:${Math.floor((s.start%3600)/60).toString().padStart(2,'0')}:${Math.floor(s.start%60).toString().padStart(2,'0')},${Math.floor((s.start%1)*1000).toString().padStart(3,'0')}`
          const end = `${Math.floor(s.end/3600).toString().padStart(2,'0')}:${Math.floor((s.end%3600)/60).toString().padStart(2,'0')}:${Math.floor(s.end%60).toString().padStart(2,'0')},${Math.floor((s.end%1)*1000).toString().padStart(3,'0')}`
          return `${i + 1}\n${start} --> ${end}\n${s.text}\n`
        }).join('\n')
        break
      case 'vtt':
        content = `WEBVTT\n\n${editingSegments.map(s => {
          const start = `${Math.floor(s.start/3600).toString().padStart(2,'0')}:${Math.floor((s.start%3600)/60).toString().padStart(2,'0')}:${Math.floor(s.start%60).toString().padStart(2,'0')}.${Math.floor((s.start%1)*1000).toString().padStart(3,'0')}`
          const end = `${Math.floor(s.end/3600).toString().padStart(2,'0')}:${Math.floor((s.end%3600)/60).toString().padStart(2,'0')}:${Math.floor(s.end%60).toString().padStart(2,'0')}.${Math.floor((s.end%1)*1000).toString().padStart(3,'0')}`
          return `${start} --> ${end}\n${s.text}`
        }).join('\n\n')}`
        break
    }
    
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  const copyFullTranscript = () => {
    const fullText = editingSegments.map(s => s.text).join('\n\n')
    navigator.clipboard.writeText(fullText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const wordCount = editingSegments.reduce((acc, s) => acc + s.text.split(' ').length, 0)

  return (
    <div className="h-full flex flex-col">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold">Transcript & Subtitles</CardTitle>
            <CardDescription className="text-sm">
              Edit transcript and prepare for long-form publishing
            </CardDescription>
          </div>
          {subtitlesApplied && (
            <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Long-form Ready
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 overflow-hidden p-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="edit">Edit</TabsTrigger>
            <TabsTrigger value="subtitles">Subtitles</TabsTrigger>
            <TabsTrigger value="export">Export</TabsTrigger>
          </TabsList>
          
          <div className="flex-1 overflow-hidden">
            <TabsContent value="edit" className="h-full space-y-4">
              {hasChanges && (
                <Alert className="bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-900">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  <AlertDescription className="flex items-center justify-between">
                    <span>You have unsaved changes</span>
                    <Button size="sm" onClick={handleSaveChanges}>
                      Save Changes
                    </Button>
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {editingSegments.length} segments • {wordCount} words
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCurrentSegmentIndex(Math.max(0, currentSegmentIndex - 1))}
                    disabled={currentSegmentIndex === 0}
                  >
                    <SkipBack className="h-4 w-4" />
                  </Button>
                  <span className="text-sm px-2">
                    {currentSegmentIndex + 1} / {editingSegments.length}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCurrentSegmentIndex(Math.min(editingSegments.length - 1, currentSegmentIndex + 1))}
                    disabled={currentSegmentIndex === editingSegments.length - 1}
                  >
                    <SkipForward className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="space-y-3 overflow-y-auto max-h-[calc(100vh-400px)]">
                {editingSegments.map((segment, index) => (
                  <div
                    key={index}
                    className={cn(
                      "p-4 rounded-lg border transition-all cursor-pointer",
                      index === currentSegmentIndex 
                        ? "border-primary bg-primary/5" 
                        : "hover:bg-muted/50"
                    )}
                    onClick={() => {
                      setCurrentSegmentIndex(index)
                      onSegmentClick?.(segment)
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 pt-1">
                        <Badge variant="outline" className="font-mono text-xs">
                          {formatTime(segment.start)}
                        </Badge>
                      </div>
                      <Textarea
                        value={segment.text}
                        onChange={(e) => handleSegmentEdit(index, 'text', e.target.value)}
                        className="flex-1 min-h-[60px] resize-none"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="subtitles" className="h-full flex flex-col gap-4">
              <div className="flex-1 space-y-4 overflow-y-auto">
                <div className="grid gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Font</Label>
                      <Select
                        value={subtitleSettings.fontFamily}
                        onValueChange={(value) => setSubtitleSettings({...subtitleSettings, fontFamily: value})}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Arial">Arial</SelectItem>
                          <SelectItem value="Helvetica">Helvetica</SelectItem>
                          <SelectItem value="Roboto">Roboto</SelectItem>
                          <SelectItem value="Open Sans">Open Sans</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label>Position</Label>
                      <Select
                        value={subtitleSettings.position}
                        onValueChange={(value: 'top' | 'center' | 'bottom') => setSubtitleSettings({...subtitleSettings, position: value})}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="top">Top</SelectItem>
                          <SelectItem value="center">Center</SelectItem>
                          <SelectItem value="bottom">Bottom</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div>
                    <Label>Size: {subtitleSettings.fontSize}px</Label>
                    <Slider
                      value={[subtitleSettings.fontSize]}
                      onValueChange={([value]) => setSubtitleSettings({...subtitleSettings, fontSize: value})}
                      min={16}
                      max={40}
                      step={2}
                      className="mt-2"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Text Color</Label>
                      <div className="flex gap-2 mt-1">
                        <Input
                          type="color"
                          value={subtitleSettings.fontColor}
                          onChange={(e) => setSubtitleSettings({...subtitleSettings, fontColor: e.target.value})}
                          className="w-20 h-9"
                        />
                        <Input
                          value={subtitleSettings.fontColor}
                          onChange={(e) => setSubtitleSettings({...subtitleSettings, fontColor: e.target.value})}
                          className="flex-1"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label>Background</Label>
                      <div className="flex gap-2 mt-1">
                        <Input
                          type="color"
                          value={subtitleSettings.backgroundColor}
                          onChange={(e) => setSubtitleSettings({...subtitleSettings, backgroundColor: e.target.value})}
                          className="w-20 h-9"
                        />
                        <Input
                          value={subtitleSettings.backgroundColor}
                          onChange={(e) => setSubtitleSettings({...subtitleSettings, backgroundColor: e.target.value})}
                          className="flex-1"
                        />
                      </div>
                    </div>
                  </div>

                  {showPreview && (
                    <div className="mt-6">
                      <Label>Preview</Label>
                      <div className="mt-2 bg-black rounded-lg p-8 flex items-center justify-center aspect-video">
                        <p 
                          style={{
                            fontFamily: subtitleSettings.fontFamily,
                            fontSize: `${subtitleSettings.fontSize}px`,
                            color: subtitleSettings.fontColor,
                            backgroundColor: subtitleSettings.backgroundColor + Math.round(subtitleSettings.opacity * 2.55).toString(16).padStart(2, '0'),
                            padding: '8px 16px',
                            borderRadius: '4px'
                          }}
                        >
                          This is how your subtitles will look
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Apply Subtitles Section - Now inside the Subtitles tab */}
              <div className="space-y-3 pt-4 border-t">
                {isApplying && (
                  <div className="space-y-3 p-4 bg-muted/30 rounded-lg">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="font-medium">{processingStage || 'Processing...'}</span>
                      </div>
                      <span className="text-muted-foreground">{Math.round(progress)}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>Estimated time: {estimateProcessingTime()} minute{estimateProcessingTime() > 1 ? 's' : ''}</span>
                    </div>
                  </div>
                )}
                
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    {!isApplying && !subtitlesApplied && (
                      <p>Apply subtitles to prepare for long-form publishing</p>
                    )}
                    {subtitlesApplied && !isApplying && (
                      <p className="text-green-600 font-medium">✓ Subtitles applied successfully</p>
                    )}
                  </div>
                  
                  <Button
                    onClick={handleApplySubtitles}
                    disabled={isApplying || !editingSegments.length}
                    variant={subtitlesApplied ? "outline" : "default"}
                    size="lg"
                  >
                    {isApplying ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : subtitlesApplied ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Reapply Subtitles
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Apply Subtitles
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="export" className="h-full space-y-4">
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-3">Download Transcript</h3>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => downloadTranscript('txt')}>
                      <FileText className="h-4 w-4 mr-2" />
                      Text File
                    </Button>
                    <Button variant="outline" onClick={() => downloadTranscript('srt')}>
                      <Video className="h-4 w-4 mr-2" />
                      SRT Subtitles
                    </Button>
                    <Button variant="outline" onClick={() => downloadTranscript('vtt')}>
                      <Video className="h-4 w-4 mr-2" />
                      WebVTT
                    </Button>
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <h3 className="font-medium mb-3">Copy Transcript</h3>
                  <Button variant="outline" onClick={copyFullTranscript}>
                    {copied ? (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-2" />
                        Copy to Clipboard
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </CardContent>
    </div>
  )
} 