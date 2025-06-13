"use client"

import { useState, useRef, useEffect } from "react"
import { TranscriptionData } from "@/lib/project-types"
import { TranscriptionService } from "@/lib/transcription-service"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import { 
  IconDownload, 
  IconSearch, 
  IconPlayerPlay,
  IconClock,
  IconLanguage,
  IconCopy,
  IconFileDownload,
  IconFileText
} from "@tabler/icons-react"
import { formatDuration } from "@/lib/video-utils"

interface TranscriptionViewerProps {
  transcription: TranscriptionData
  videoElement?: HTMLVideoElement | null
  projectId: string
  projectTitle: string
}

export function TranscriptionViewer({ 
  transcription, 
  videoElement,
  projectId,
  projectTitle
}: TranscriptionViewerProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [activeSegmentId, setActiveSegmentId] = useState<string | null>(null)
  const [displayMode, setDisplayMode] = useState<"segments" | "full">("segments")
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  // Update active segment based on video time
  useEffect(() => {
    if (!videoElement) return

    const handleTimeUpdate = () => {
      const currentTime = videoElement.currentTime
      const activeSegment = TranscriptionService.getSegmentAtTime(
        transcription.segments,
        currentTime
      )
      
      if (activeSegment) {
        setActiveSegmentId(activeSegment.id)
      }
    }

    videoElement.addEventListener('timeupdate', handleTimeUpdate)
    return () => {
      videoElement.removeEventListener('timeupdate', handleTimeUpdate)
    }
  }, [videoElement, transcription.segments])

  // Auto-scroll to active segment
  useEffect(() => {
    if (activeSegmentId && scrollAreaRef.current) {
      const element = document.getElementById(`segment-${activeSegmentId}`)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }
  }, [activeSegmentId])

  const handleSegmentClick = (segment: TranscriptionData['segments'][0]) => {
    if (videoElement) {
      videoElement.currentTime = segment.start
      videoElement.play()
    }
  }

  const handleCopySegment = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success("Copied to clipboard")
    } catch (error) {
      toast.error("Failed to copy text")
    }
  }

  const handleDownload = async (format: 'txt' | 'srt' | 'vtt') => {
    try {
      const response = await fetch(`/api/process-transcription?projectId=${projectId}&format=${format}`)
      
      if (!response.ok) {
        throw new Error('Download failed')
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${projectTitle}-${format === 'txt' ? 'transcript' : 'subtitles'}.${format}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      toast.success(`Downloaded ${format.toUpperCase()} file`)
    } catch (error) {
      toast.error(`Failed to download ${format} file`)
    }
  }

  const searchResults = searchQuery
    ? TranscriptionService.searchTranscription(transcription.segments, searchQuery)
    : []

  const displaySegments = searchQuery ? searchResults : transcription.segments

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <IconFileText className="h-5 w-5 text-primary" />
              Transcription
            </CardTitle>
            <CardDescription>
              {transcription.segments.length} segments • {formatDuration(transcription.duration)} • {transcription.language.toUpperCase()}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleDownload('txt')}
            >
              <IconDownload className="h-4 w-4 mr-1" />
              TXT
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleDownload('srt')}
            >
              <IconFileDownload className="h-4 w-4 mr-1" />
              SRT
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleDownload('vtt')}
            >
              <IconFileDownload className="h-4 w-4 mr-1" />
              VTT
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="border-b p-4 space-y-4">
          {/* Search */}
          <div className="relative">
            <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search transcription..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
            {searchQuery && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <Badge variant="secondary">{searchResults.length} results</Badge>
              </div>
            )}
          </div>

          {/* Display Mode Tabs */}
          <Tabs value={displayMode} onValueChange={(v) => setDisplayMode(v as any)}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="segments">Segments</TabsTrigger>
              <TabsTrigger value="full">Full Text</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Content */}
        <ScrollArea className="h-[600px]" ref={scrollAreaRef}>
          {displayMode === "segments" ? (
            <div className="p-4 space-y-2">
              {displaySegments.map((segment) => (
                <div
                  key={segment.id}
                  id={`segment-${segment.id}`}
                  className={`group relative p-4 rounded-lg border transition-all cursor-pointer hover:bg-muted/50 ${
                    activeSegmentId === segment.id
                      ? "border-primary bg-primary/5"
                      : "border-border"
                  }`}
                  onClick={() => handleSegmentClick(segment)}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleSegmentClick(segment)
                        }}
                      >
                        <IconPlayerPlay className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <IconClock className="h-3 w-3" />
                        <span>{formatDuration(segment.start)} - {formatDuration(segment.end)}</span>
                        {segment.confidence && (
                          <>
                            <span>•</span>
                            <span>Confidence: {(segment.confidence * 100).toFixed(0)}%</span>
                          </>
                        )}
                      </div>
                      <p className="text-sm leading-relaxed">
                        {searchQuery && 'matchedText' in segment ? (
                          // Highlight search matches
                          <span
                            dangerouslySetInnerHTML={{
                              __html: (segment as any).matchedText.replace(
                                new RegExp(searchQuery, 'gi'),
                                (match: string) => `<mark class="bg-yellow-200 dark:bg-yellow-800">${match}</mark>`
                              ),
                            }}
                          />
                        ) : (
                          segment.text
                        )}
                      </p>
                    </div>
                    <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleCopySegment(segment.text)
                        }}
                      >
                        <IconCopy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6">
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <p className="whitespace-pre-wrap leading-relaxed">
                  {transcription.text}
                </p>
              </div>
              <div className="mt-4 flex justify-end">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleCopySegment(transcription.text)}
                >
                  <IconCopy className="h-4 w-4 mr-2" />
                  Copy All
                </Button>
              </div>
            </div>
          )}
        </ScrollArea>

        {/* Summary Stats */}
        <div className="border-t p-4 bg-muted/30">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <IconLanguage className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Language:</span>
                <span className="font-medium">{transcription.language.toUpperCase()}</span>
              </div>
              <div className="flex items-center gap-1">
                <IconClock className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Duration:</span>
                <span className="font-medium">{formatDuration(transcription.duration)}</span>
              </div>
            </div>
            <div className="text-muted-foreground">
              {transcription.segments.length} segments • {transcription.text.split(' ').length} words
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 