"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Clock,
  Type,
  Eye,
  Zap,
  TrendingUp,
  Info
} from "lucide-react"

interface SubtitleSegment {
  id: string
  start: number
  end: number
  text: string
}

interface ValidationRule {
  id: string
  name: string
  severity: 'error' | 'warning' | 'info'
  check: (segment: SubtitleSegment, index: number, segments: SubtitleSegment[]) => boolean
  message: (segment: SubtitleSegment, index: number) => string
  suggestion: (segment: SubtitleSegment, index: number) => string
}

interface SubtitleValidatorProps {
  segments: SubtitleSegment[]
  onSegmentFix?: (segmentId: string, updates: Partial<SubtitleSegment>) => void
  onJumpToSegment?: (segmentIndex: number) => void
}

export function SubtitleValidator({ 
  segments, 
  onSegmentFix,
  onJumpToSegment 
}: SubtitleValidatorProps) {
  const [selectedRule, setSelectedRule] = useState<string | null>(null)

  const validationRules: ValidationRule[] = [
    {
      id: 'min-duration',
      name: 'Minimum Duration',
      severity: 'error',
      check: (segment) => segment.end - segment.start < 1.0,
      message: (segment, index) => `Segment ${index + 1}: Too short (${(segment.end - segment.start).toFixed(1)}s)`,
      suggestion: () => 'Subtitles should be displayed for at least 1 second for readability'
    },
    {
      id: 'max-duration',
      name: 'Maximum Duration',
      severity: 'warning',
      check: (segment) => segment.end - segment.start > 6.0,
      message: (segment, index) => `Segment ${index + 1}: Too long (${(segment.end - segment.start).toFixed(1)}s)`,
      suggestion: () => 'Consider splitting long subtitles into shorter segments'
    },
    {
      id: 'reading-speed',
      name: 'Reading Speed',
      severity: 'warning',
      check: (segment) => {
        const duration = segment.end - segment.start
        const charactersPerSecond = segment.text.length / duration
        return charactersPerSecond > 20 // More than 20 chars/sec is too fast
      },
      message: (segment, index) => {
        const cps = (segment.text.length / (segment.end - segment.start)).toFixed(1)
        return `Segment ${index + 1}: Reading speed too fast (${cps} chars/sec)`
      },
      suggestion: () => 'Ideal reading speed is 15-20 characters per second'
    },
    {
      id: 'character-limit',
      name: 'Character Limit',
      severity: 'warning',
      check: (segment) => segment.text.length > 84, // 2 lines of 42 chars each
      message: (segment, index) => `Segment ${index + 1}: Too many characters (${segment.text.length})`,
      suggestion: () => 'Keep subtitles under 84 characters (2 lines of 42 chars)'
    },
    {
      id: 'line-breaks',
      name: 'Line Breaks',
      severity: 'info',
      check: (segment) => {
        const words = segment.text.split(' ')
        return words.length > 8 && !segment.text.includes('\n')
      },
      message: (segment, index) => `Segment ${index + 1}: Consider adding line breaks`,
      suggestion: () => 'Break long sentences at natural pause points'
    },
    {
      id: 'overlap',
      name: 'Timing Overlap',
      severity: 'error',
      check: (segment, index, segments) => {
        if (index === segments.length - 1) return false
        return segment.end > segments[index + 1].start
      },
      message: (segment, index) => `Segment ${index + 1}: Overlaps with next segment`,
      suggestion: () => 'Adjust timing to prevent subtitle overlap'
    },
    {
      id: 'gap-too-short',
      name: 'Short Gap',
      severity: 'warning',
      check: (segment, index, segments) => {
        if (index === segments.length - 1) return false
        const gap = segments[index + 1].start - segment.end
        return gap < 0.2 && gap > 0 // Less than 200ms gap
      },
      message: (segment, index) => `Segment ${index + 1}: Very short gap to next subtitle`,
      suggestion: () => 'Consider merging nearby segments or adjusting timing'
    },
    {
      id: 'empty-text',
      name: 'Empty Text',
      severity: 'error',
      check: (segment) => segment.text.trim().length === 0,
      message: (segment, index) => `Segment ${index + 1}: Empty text content`,
      suggestion: () => 'Remove empty segments or add text content'
    }
  ]

  const validationResults = useMemo(() => {
    const results: { [ruleId: string]: Array<{ segment: SubtitleSegment; index: number }> } = {}
    
    validationRules.forEach(rule => {
      results[rule.id] = []
      segments.forEach((segment, index) => {
        if (rule.check(segment, index, segments)) {
          results[rule.id].push({ segment, index })
        }
      })
    })
    
    return results
  }, [segments, validationRules])

  const overallScore = useMemo(() => {
    const totalIssues = Object.values(validationResults).reduce((sum, issues) => sum + issues.length, 0)
    const totalSegments = segments.length
    if (totalSegments === 0) return 100
    
    const issueWeight = Math.min(totalIssues / totalSegments, 1)
    return Math.round((1 - issueWeight) * 100)
  }, [validationResults, segments.length])

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600'
    if (score >= 70) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreLabel = (score: number) => {
    if (score >= 90) return 'Excellent'
    if (score >= 70) return 'Good'
    if (score >= 50) return 'Fair'
    return 'Needs Work'
  }

  const totalIssues = Object.values(validationResults).reduce((sum, issues) => sum + issues.length, 0)
  const errorCount = validationRules
    .filter(rule => rule.severity === 'error')
    .reduce((sum, rule) => sum + validationResults[rule.id].length, 0)
  const warningCount = validationRules
    .filter(rule => rule.severity === 'warning')
    .reduce((sum, rule) => sum + validationResults[rule.id].length, 0)

  const autoFixSegment = (segmentId: string, ruleId: string) => {
    const segment = segments.find(s => s.id === segmentId)
    if (!segment || !onSegmentFix) return

    let updates: Partial<SubtitleSegment> = {}

    switch (ruleId) {
      case 'min-duration':
        updates.end = segment.start + 1.0
        break
      case 'max-duration':
        updates.end = segment.start + 6.0
        break
      case 'character-limit':
        if (segment.text.length > 84) {
          updates.text = segment.text.substring(0, 81) + '...'
        }
        break
      case 'line-breaks':
        const words = segment.text.split(' ')
        if (words.length > 8) {
          const midpoint = Math.floor(words.length / 2)
          updates.text = words.slice(0, midpoint).join(' ') + '\n' + words.slice(midpoint).join(' ')
        }
        break
    }

    if (Object.keys(updates).length > 0) {
      onSegmentFix(segmentId, updates)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Subtitle Validation</CardTitle>
          <div className="flex items-center gap-3">
            <div className="text-center">
              <div className={cn("text-2xl font-bold", getScoreColor(overallScore))}>
                {overallScore}%
              </div>
              <div className="text-xs text-muted-foreground">
                {getScoreLabel(overallScore)}
              </div>
            </div>
            <Progress value={overallScore} className="w-20" />
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Summary */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="bg-muted/50">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-muted-foreground">{segments.length}</div>
              <div className="text-sm text-muted-foreground">Total Segments</div>
            </CardContent>
          </Card>
          
          <Card className="bg-red-50 dark:bg-red-950/20">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-red-600">{errorCount}</div>
              <div className="text-sm text-muted-foreground">Errors</div>
            </CardContent>
          </Card>
          
          <Card className="bg-yellow-50 dark:bg-yellow-950/20">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-yellow-600">{warningCount}</div>
              <div className="text-sm text-muted-foreground">Warnings</div>
            </CardContent>
          </Card>
        </div>

        {/* Issues by Category */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="details">Detailed Issues</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-3">
            {validationRules.map(rule => {
              const issues = validationResults[rule.id] || []
              const hasIssues = issues.length > 0
              
              return (
                <div
                  key={rule.id}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors",
                    hasIssues 
                      ? rule.severity === 'error' 
                        ? "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/20"
                        : rule.severity === 'warning'
                        ? "border-yellow-200 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-950/20"
                        : "border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/20"
                      : "border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/20",
                    selectedRule === rule.id && "ring-2 ring-primary"
                  )}
                  onClick={() => setSelectedRule(selectedRule === rule.id ? null : rule.id)}
                >
                  <div className="flex items-center gap-3">
                    {hasIssues ? (
                      rule.severity === 'error' ? (
                        <XCircle className="h-5 w-5 text-red-600" />
                      ) : rule.severity === 'warning' ? (
                        <AlertTriangle className="h-5 w-5 text-yellow-600" />
                      ) : (
                        <Info className="h-5 w-5 text-blue-600" />
                      )
                    ) : (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    )}
                    
                    <div>
                      <div className="font-medium">{rule.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {hasIssues ? `${issues.length} issue${issues.length > 1 ? 's' : ''}` : 'All good'}
                      </div>
                    </div>
                  </div>
                  
                  {hasIssues && (
                    <Badge variant={rule.severity === 'error' ? 'destructive' : 'secondary'}>
                      {issues.length}
                    </Badge>
                  )}
                </div>
              )
            })}
          </TabsContent>
          
          <TabsContent value="details" className="space-y-3">
            {totalIssues === 0 ? (
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>
                  🎉 All subtitles pass validation! Your subtitles are ready for publication.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-4">
                {validationRules.map(rule => {
                  const issues = validationResults[rule.id] || []
                  if (issues.length === 0) return null
                  
                  return (
                    <div key={rule.id} className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant={rule.severity === 'error' ? 'destructive' : 'secondary'}>
                          {rule.name}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {issues.length} issue{issues.length > 1 ? 's' : ''}
                        </span>
                      </div>
                      
                      <div className="space-y-2">
                        {issues.map(({ segment, index }) => (
                          <Alert key={`${rule.id}-${segment.id}`}>
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription>
                              <div className="space-y-2">
                                <div>{rule.message(segment, index)}</div>
                                <div className="text-sm text-muted-foreground">
                                  {rule.suggestion(segment, index)}
                                </div>
                                <div className="flex gap-2">
                                  {onJumpToSegment && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => onJumpToSegment(index)}
                                    >
                                      Go to Segment
                                    </Button>
                                  )}
                                  {onSegmentFix && ['min-duration', 'max-duration', 'character-limit', 'line-breaks'].includes(rule.id) && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => autoFixSegment(segment.id, rule.id)}
                                    >
                                      <Zap className="h-3 w-3 mr-1" />
                                      Auto Fix
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </AlertDescription>
                          </Alert>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Quick Stats */}
        {segments.length > 0 && (
          <Card className="bg-muted/50">
            <CardContent className="p-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="font-medium">Avg. Duration</div>
                  <div className="text-muted-foreground">
                    {(segments.reduce((sum, s) => sum + (s.end - s.start), 0) / segments.length).toFixed(1)}s
                  </div>
                </div>
                <div>
                  <div className="font-medium">Avg. Characters</div>
                  <div className="text-muted-foreground">
                    {Math.round(segments.reduce((sum, s) => sum + s.text.length, 0) / segments.length)}
                  </div>
                </div>
                <div>
                  <div className="font-medium">Reading Speed</div>
                  <div className="text-muted-foreground">
                    {(segments.reduce((sum, s) => sum + (s.text.length / (s.end - s.start)), 0) / segments.length).toFixed(1)} chars/s
                  </div>
                </div>
                <div>
                  <div className="font-medium">Total Duration</div>
                  <div className="text-muted-foreground">
                    {Math.max(...segments.map(s => s.end)).toFixed(1)}s
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  )
} 