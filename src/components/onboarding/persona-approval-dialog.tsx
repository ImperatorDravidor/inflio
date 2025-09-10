"use client"

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Check, X, AlertCircle, Loader2, RefreshCw,
  Eye, ThumbsUp, ThumbsDown, ChevronRight,
  Sparkles, Image as ImageIcon, Info, Clock
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { PhotoAnalysis } from '@/lib/services/persona-validation-service'

interface AvatarPhoto {
  id: string
  url: string
  type: 'captured' | 'uploaded'
  quality: {
    lighting: number
    clarity: number
    angle: number
    overall: number
  }
}

interface SampleImage {
  url: string
  style: string
  prompt: string
  quality: number
}

interface PersonaApprovalDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  photos: AvatarPhoto[]
  samples?: SampleImage[]
  analysis?: PhotoAnalysis
  personaName: string
  onApprove: () => void
  onReject: (issues: string[], feedback: string) => void
  onRegenerate?: () => void
  isGeneratingSamples?: boolean
  isTraining?: boolean
}

const COMMON_ISSUES = [
  { id: 'not-me', label: "Doesn't look like me", severity: 'high' },
  { id: 'wrong-style', label: "Wrong style/mood", severity: 'medium' },
  { id: 'quality', label: "Quality issues", severity: 'high' },
  { id: 'lighting', label: "Lighting problems", severity: 'medium' },
  { id: 'better-photos', label: "I can take better photos", severity: 'low' },
  { id: 'missing-angles', label: "Missing some angles", severity: 'low' }
]

export function PersonaApprovalDialog({
  open,
  onOpenChange,
  photos,
  samples = [],
  analysis,
  personaName,
  onApprove,
  onReject,
  onRegenerate,
  isGeneratingSamples = false,
  isTraining = false
}: PersonaApprovalDialogProps) {
  const [selectedIssues, setSelectedIssues] = useState<string[]>([])
  const [additionalFeedback, setAdditionalFeedback] = useState('')
  const [selectedSample, setSelectedSample] = useState<number>(0)
  const [isApproving, setIsApproving] = useState(false)

  const handleApprove = async () => {
    setIsApproving(true)
    
    // Show celebration
    toast.success('Great! Starting AI training...', {
      description: 'This will take 10-30 minutes. We\'ll notify you when complete.',
      duration: 5000
    })
    
    onApprove()
    setIsApproving(false)
  }

  const handleReject = () => {
    if (selectedIssues.length === 0 && !additionalFeedback.trim()) {
      toast.error('Please select an issue or provide feedback')
      return
    }
    
    onReject(selectedIssues, additionalFeedback)
    
    // Reset state
    setSelectedIssues([])
    setAdditionalFeedback('')
  }

  const toggleIssue = (issueId: string) => {
    setSelectedIssues(prev => 
      prev.includes(issueId) 
        ? prev.filter(id => id !== issueId)
        : [...prev, issueId]
    )
  }

  // Calculate overall readiness
  const overallScore = analysis?.scores?.overall || 0.75
  const isReady = analysis?.readyForTraining !== false && samples.length > 0
  const hasHighSeverityIssues = selectedIssues.some(id => 
    COMMON_ISSUES.find(issue => issue.id === id)?.severity === 'high'
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            Review Your AI Persona Preview
          </DialogTitle>
          <DialogDescription>
            Check how {personaName} will appear in generated content before training
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Photo Analysis Summary */}
          {analysis && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center justify-between">
                  <span>Photo Analysis</span>
                  <Badge variant={
                    analysis.quality === 'excellent' ? 'default' :
                    analysis.quality === 'good' ? 'secondary' : 'outline'
                  }>
                    {analysis.quality}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Quality Scores */}
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(analysis.scores).filter(([key]) => key !== 'overall').map(([key, value]) => (
                    <div key={key} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="capitalize text-muted-foreground">{key}</span>
                        <span className="font-medium">{Math.round(value * 100)}%</span>
                      </div>
                      <Progress value={value * 100} className="h-1.5" />
                    </div>
                  ))}
                </div>

                {/* Feedback */}
                {analysis.feedback.length > 0 && (
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Analysis</Label>
                    <ul className="text-sm space-y-0.5">
                      {analysis.feedback.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span className="text-muted-foreground mt-1">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Suggestions */}
                {analysis.suggestions.length > 0 && (
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription className="text-sm">
                      {analysis.suggestions[0]}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          )}

          {/* Sample Previews */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>AI-Generated Previews</Label>
              {onRegenerate && !isGeneratingSamples && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onRegenerate}
                  disabled={isTraining}
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Regenerate
                </Button>
              )}
            </div>

            {isGeneratingSamples ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-purple-500" />
                  <p className="text-sm text-muted-foreground">
                    Generating preview samples...
                  </p>
                </CardContent>
              </Card>
            ) : samples.length > 0 ? (
              <>
                {/* Sample Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
                  {samples.map((sample, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: idx * 0.05 }}
                    >
                      <Card 
                        className={cn(
                          "cursor-pointer transition-all hover:ring-2 hover:ring-purple-500",
                          selectedSample === idx && "ring-2 ring-purple-500"
                        )}
                        onClick={() => setSelectedSample(idx)}
                      >
                        <CardContent className="p-2">
                          <div className="aspect-square relative rounded overflow-hidden bg-gray-100">
                            <img 
                              src={sample.url} 
                              alt={sample.style}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                            <Badge 
                              className="absolute bottom-1 left-1 text-xs"
                              variant="secondary"
                            >
                              {sample.style}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>

                {/* Selected Sample Details */}
                {samples[selectedSample] && (
                  <Card>
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="text-sm font-medium capitalize">
                            {samples[selectedSample].style} Style
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Quality: {Math.round(samples[selectedSample].quality * 100)}%
                          </p>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          Sample {selectedSample + 1} of {samples.length}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {samples[selectedSample].prompt}
                      </p>
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  No preview samples generated yet. Click "Regenerate" to create samples.
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Feedback Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">How do these look?</CardTitle>
              <CardDescription className="text-sm">
                Select any issues you notice (optional)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Issue Checkboxes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {COMMON_ISSUES.map(issue => (
                  <div key={issue.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={issue.id}
                      checked={selectedIssues.includes(issue.id)}
                      onCheckedChange={() => toggleIssue(issue.id)}
                    />
                    <Label 
                      htmlFor={issue.id}
                      className="text-sm cursor-pointer flex items-center gap-1"
                    >
                      {issue.label}
                      {issue.severity === 'high' && (
                        <Badge variant="destructive" className="text-xs px-1 py-0">
                          Important
                        </Badge>
                      )}
                    </Label>
                  </div>
                ))}
              </div>

              {/* Additional Feedback */}
              <div className="space-y-2">
                <Label htmlFor="feedback" className="text-sm">
                  Additional feedback (optional)
                </Label>
                <Textarea
                  id="feedback"
                  placeholder="Tell us what you'd like to improve..."
                  value={additionalFeedback}
                  onChange={(e) => setAdditionalFeedback(e.target.value)}
                  rows={3}
                  className="resize-none text-sm"
                />
              </div>
            </CardContent>
          </Card>

          {/* Training Time Notice */}
          <Alert>
            <Clock className="h-4 w-4" />
            <AlertTitle className="text-sm">Training Time</AlertTitle>
            <AlertDescription className="text-sm">
              Once approved, AI training takes 10-30 minutes. You can close this window and 
              we'll notify you when your persona is ready to use.
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={handleReject}
            disabled={isApproving || isTraining}
          >
            <X className="mr-2 h-4 w-4" />
            Upload Different Photos
          </Button>
          <Button
            onClick={handleApprove}
            disabled={!isReady || hasHighSeverityIssues || isApproving || isTraining}
            className="relative"
          >
            {isApproving || isTraining ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isTraining ? 'Training...' : 'Starting...'}
              </>
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" />
                Looks Good, Start Training
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
