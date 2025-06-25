"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Volume2, 
  ZoomIn, 
  ZoomOut,
  Scissors,
  Move,
  Settings
} from "lucide-react"

interface SubtitleSegment {
  id: string
  start: number
  end: number
  text: string
}

interface SubtitleTimelineProps {
  segments: SubtitleSegment[]
  onSegmentsChange: (segments: SubtitleSegment[]) => void
  videoDuration: number
  currentTime: number
  onTimeChange: (time: number) => void
  isPlaying: boolean
  onPlayPause: () => void
}

export function SubtitleTimeline({
  segments,
  onSegmentsChange,
  videoDuration,
  currentTime,
  onTimeChange,
  isPlaying,
  onPlayPause
}: SubtitleTimelineProps) {
  const [zoomLevel, setZoomLevel] = useState(1)
  const [selectedSegment, setSelectedSegment] = useState<string | null>(null)
  const [dragMode, setDragMode] = useState<'move' | 'resize-start' | 'resize-end' | null>(null)
  const [dragStartPos, setDragStartPos] = useState(0)
  const [snapToGrid, setSnapToGrid] = useState(true)
  const timelineRef = useRef<HTMLDivElement>(null)
  const [timelineWidth, setTimelineWidth] = useState(800)

  useEffect(() => {
    const updateWidth = () => {
      if (timelineRef.current) {
        setTimelineWidth(timelineRef.current.clientWidth)
      }
    }
    
    updateWidth()
    window.addEventListener('resize', updateWidth)
    return () => window.removeEventListener('resize', updateWidth)
  }, [])

  const timeToPixel = (time: number) => {
    return (time / videoDuration) * timelineWidth * zoomLevel
  }

  const pixelToTime = (pixel: number) => {
    return (pixel / (timelineWidth * zoomLevel)) * videoDuration
  }

  const snapTime = (time: number) => {
    if (!snapToGrid) return time
    const gridSize = 0.1 // 100ms grid
    return Math.round(time / gridSize) * gridSize
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = (seconds % 60).toFixed(1)
    return `${mins}:${secs.padStart(4, '0')}`
  }

  const handleTimelineClick = (e: React.MouseEvent) => {
    if (!timelineRef.current) return
    
    const rect = timelineRef.current.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const clickTime = pixelToTime(clickX)
    
    onTimeChange(Math.max(0, Math.min(videoDuration, clickTime)))
  }

  const handleSegmentMouseDown = (e: React.MouseEvent, segmentId: string, mode: 'move' | 'resize-start' | 'resize-end') => {
    e.stopPropagation()
    setSelectedSegment(segmentId)
    setDragMode(mode)
    setDragStartPos(e.clientX)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragMode || !selectedSegment || !timelineRef.current) return

    const rect = timelineRef.current.getBoundingClientRect()
    const currentX = e.clientX - rect.left
    const deltaX = e.clientX - dragStartPos
    const deltaTime = pixelToTime(deltaX) - pixelToTime(0)

    const updatedSegments = segments.map(segment => {
      if (segment.id !== selectedSegment) return segment

      let newSegment = { ...segment }

      switch (dragMode) {
        case 'move':
          const newStart = snapTime(segment.start + deltaTime)
          const duration = segment.end - segment.start
          newSegment.start = Math.max(0, newStart)
          newSegment.end = Math.min(videoDuration, newStart + duration)
          break
        case 'resize-start':
          newSegment.start = Math.max(0, Math.min(segment.end - 0.1, snapTime(segment.start + deltaTime)))
          break
        case 'resize-end':
          newSegment.end = Math.max(segment.start + 0.1, Math.min(videoDuration, snapTime(segment.end + deltaTime)))
          break
      }

      return newSegment
    })

    onSegmentsChange(updatedSegments)
    setDragStartPos(e.clientX)
  }

  const handleMouseUp = () => {
    setDragMode(null)
    setDragStartPos(0)
  }

  const splitSegment = (segmentId: string, time: number) => {
    const segmentToSplit = segments.find(s => s.id === segmentId)
    if (!segmentToSplit || time <= segmentToSplit.start || time >= segmentToSplit.end) return

    const splitTime = snapTime(time)
    const newSegments = segments.flatMap(segment => {
      if (segment.id !== segmentId) return segment

      const firstPart = {
        ...segment,
        id: `${segment.id}_1`,
        end: splitTime,
        text: segment.text.substring(0, Math.floor(segment.text.length / 2))
      }

      const secondPart = {
        ...segment,
        id: `${segment.id}_2`,
        start: splitTime,
        text: segment.text.substring(Math.floor(segment.text.length / 2))
      }

      return [firstPart, secondPart]
    })

    onSegmentsChange(newSegments)
  }

  const mergeSegments = (segmentId1: string, segmentId2: string) => {
    const segment1 = segments.find(s => s.id === segmentId1)
    const segment2 = segments.find(s => s.id === segmentId2)
    
    if (!segment1 || !segment2) return

    const mergedSegment = {
      id: segmentId1,
      start: Math.min(segment1.start, segment2.start),
      end: Math.max(segment1.end, segment2.end),
      text: `${segment1.text} ${segment2.text}`.trim()
    }

    const newSegments = segments
      .filter(s => s.id !== segmentId1 && s.id !== segmentId2)
      .concat(mergedSegment)
      .sort((a, b) => a.start - b.start)

    onSegmentsChange(newSegments)
  }

  const visibleDuration = videoDuration / zoomLevel
  const scrollOffset = Math.max(0, currentTime - visibleDuration / 2)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Subtitle Timeline</CardTitle>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={onPlayPause}
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setZoomLevel(Math.max(0.5, zoomLevel - 0.5))}
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="text-sm font-mono w-12 text-center">{zoomLevel}x</span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setZoomLevel(Math.min(5, zoomLevel + 0.5))}
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Timeline Controls */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Label className="text-sm">Current:</Label>
            <Badge variant="outline" className="font-mono">
              {formatTime(currentTime)}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-sm">Duration:</Label>
            <Badge variant="outline" className="font-mono">
              {formatTime(videoDuration)}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="snap-grid"
              checked={snapToGrid}
              onChange={(e) => setSnapToGrid(e.target.checked)}
              className="rounded"
              aria-label="Snap to grid"
            />
            <Label htmlFor="snap-grid" className="text-sm">Snap to grid</Label>
          </div>
        </div>

        {/* Timeline Container */}
        <div 
          ref={timelineRef}
          className="relative h-32 bg-muted rounded-lg overflow-hidden cursor-pointer select-none"
          onClick={handleTimelineClick}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* Time Grid */}
          <div className="absolute inset-0">
            {Array.from({ length: Math.ceil(videoDuration * zoomLevel) }, (_, i) => {
              const time = i / zoomLevel
              const x = timeToPixel(time)
              const isSecond = time % 1 === 0
              return (
                <div
                  key={i}
                  className={cn(
                    "absolute top-0 bg-border",
                    isSecond ? "h-full w-px" : "h-4 w-px"
                  )}
                  style={{ left: x }}
                />
              )
            })}
          </div>

          {/* Time Labels */}
          <div className="absolute top-0 left-0 right-0 h-6 text-xs">
            {Array.from({ length: Math.ceil(videoDuration) + 1 }, (_, i) => {
              const x = timeToPixel(i)
              if (x > timelineWidth * zoomLevel) return null
              return (
                <div
                  key={i}
                  className="absolute text-muted-foreground font-mono"
                  style={{ left: x + 2, top: 2 }}
                >
                  {formatTime(i)}
                </div>
              )
            })}
          </div>

          {/* Subtitle Segments */}
          <div className="absolute top-6 left-0 right-0 bottom-0">
            {segments.map((segment, index) => {
              const startX = timeToPixel(segment.start)
              const width = timeToPixel(segment.end) - startX
              const isSelected = selectedSegment === segment.id
              
              return (
                <div
                  key={segment.id}
                  className={cn(
                    "absolute h-16 rounded border-2 transition-all cursor-pointer group",
                    isSelected 
                      ? "border-primary bg-primary/20 z-10" 
                      : "border-muted-foreground bg-background hover:border-primary/50"
                  )}
                  style={{
                    left: startX,
                    width: Math.max(width, 20),
                    top: index % 2 === 0 ? 8 : 40
                  }}
                  onMouseDown={(e) => handleSegmentMouseDown(e, segment.id, 'move')}
                >
                  {/* Resize handles */}
                  <div
                    className="absolute left-0 top-0 w-2 h-full cursor-w-resize bg-primary/20 opacity-0 group-hover:opacity-100"
                    onMouseDown={(e) => handleSegmentMouseDown(e, segment.id, 'resize-start')}
                  />
                  <div
                    className="absolute right-0 top-0 w-2 h-full cursor-e-resize bg-primary/20 opacity-0 group-hover:opacity-100"
                    onMouseDown={(e) => handleSegmentMouseDown(e, segment.id, 'resize-end')}
                  />
                  
                  {/* Content */}
                  <div className="p-2 h-full overflow-hidden">
                    <div className="text-xs font-mono text-muted-foreground">
                      {formatTime(segment.start)} - {formatTime(segment.end)}
                    </div>
                    <div className="text-xs truncate mt-1">
                      {segment.text}
                    </div>
                  </div>
                  
                  {/* Action buttons */}
                  <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-5 w-5 p-0"
                      onClick={(e) => {
                        e.stopPropagation()
                        splitSegment(segment.id, segment.start + (segment.end - segment.start) / 2)
                      }}
                    >
                      <Scissors className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Playhead */}
          <div
            className="absolute top-0 w-0.5 h-full bg-red-500 z-20 pointer-events-none"
            style={{ left: timeToPixel(currentTime) }}
          >
            <div className="absolute -top-1 -left-1 w-3 h-3 bg-red-500 rotate-45" />
          </div>
        </div>

        {/* Selected Segment Details */}
        {selectedSegment && (
          <Card className="bg-muted/50">
            <CardContent className="p-4">
              {(() => {
                const segment = segments.find(s => s.id === selectedSegment)
                if (!segment) return null
                
                return (
                  <div className="space-y-3">
                    <div className="flex items-center gap-4">
                      <Badge variant="outline">Selected Segment</Badge>
                      <span className="text-sm font-mono">
                        {formatTime(segment.start)} - {formatTime(segment.end)}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        Duration: {formatTime(segment.end - segment.start)}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="start-time" className="text-sm">Start Time</Label>
                        <Input
                          id="start-time"
                          type="number"
                          step="0.1"
                          value={segment.start.toFixed(1)}
                          onChange={(e) => {
                            const newStart = Math.max(0, parseFloat(e.target.value) || 0)
                            const updatedSegments = segments.map(s =>
                              s.id === selectedSegment
                                ? { ...s, start: Math.min(newStart, s.end - 0.1) }
                                : s
                            )
                            onSegmentsChange(updatedSegments)
                          }}
                          className="font-mono"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="end-time" className="text-sm">End Time</Label>
                        <Input
                          id="end-time"
                          type="number"
                          step="0.1"
                          value={segment.end.toFixed(1)}
                          onChange={(e) => {
                            const newEnd = Math.min(videoDuration, parseFloat(e.target.value) || 0)
                            const updatedSegments = segments.map(s =>
                              s.id === selectedSegment
                                ? { ...s, end: Math.max(newEnd, s.start + 0.1) }
                                : s
                            )
                            onSegmentsChange(updatedSegments)
                          }}
                          className="font-mono"
                        />
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onTimeChange(segment.start)}
                      >
                        <SkipBack className="h-4 w-4 mr-1" />
                        Go to Start
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => splitSegment(segment.id, segment.start + (segment.end - segment.start) / 2)}
                      >
                        <Scissors className="h-4 w-4 mr-1" />
                        Split Segment
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedSegment(null)}
                      >
                        Deselect
                      </Button>
                    </div>
                  </div>
                )
              })()}
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  )
} 