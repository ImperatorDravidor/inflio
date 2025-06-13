'use client'

import { useState, useEffect } from 'react'
import { getTranscript } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Loader2, FileText, Clock } from 'lucide-react'

interface TranscriptSegment {
  id: string
  startTime: number
  endTime: number
  text: string
}

interface Transcript {
  id: string
  text: string
  language: string
  duration: number
  segments: TranscriptSegment[]
  processedAt: string
  processingTime: number
}

interface TranscriptViewerProps {
  videoId: string
  onTranscribe?: () => void
  hasTranscript?: boolean
}

export function TranscriptViewer({ videoId, onTranscribe, hasTranscript = false }: TranscriptViewerProps) {
  const [transcript, setTranscript] = useState<Transcript | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (hasTranscript) {
      fetchTranscript()
    }
  }, [videoId, hasTranscript])

  const fetchTranscript = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getTranscript(videoId)
      setTranscript(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load transcript')
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="ml-2">Loading transcript...</span>
        </div>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="text-red-500">Error: {error}</div>
        {onTranscribe && (
          <Button onClick={onTranscribe} className="mt-4">
            Try Again
          </Button>
        )}
      </Card>
    )
  }

  if (!transcript) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Transcript Available</h3>
          <p className="text-gray-500 mb-4">
            Generate a transcript using AI to see the text version of your video
          </p>
          {onTranscribe && (
            <Button onClick={onTranscribe}>
              Generate Transcript
            </Button>
          )}
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2 flex items-center">
          <FileText className="h-5 w-5 mr-2" />
          Transcript
        </h3>
        <div className="flex items-center text-sm text-gray-500 space-x-4">
          <span>Language: {transcript.language.toUpperCase()}</span>
          <span>Duration: {formatTime(transcript.duration)}</span>
          <span>Processing time: {transcript.processingTime.toFixed(1)}s</span>
        </div>
      </div>

      <ScrollArea className="h-[400px] pr-4">
        {transcript.segments.length > 0 ? (
          <div className="space-y-4">
            {transcript.segments.map((segment) => (
              <div key={segment.id} className="group">
                <div className="flex items-start space-x-3">
                  <span className="text-xs text-gray-400 font-mono mt-1 flex items-center">
                    <Clock className="h-3 w-3 mr-1" />
                    {formatTime(segment.startTime)}
                  </span>
                  <p className="flex-1 text-sm leading-relaxed">
                    {segment.text}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="whitespace-pre-wrap text-sm leading-relaxed">
            {transcript.text}
          </div>
        )}
      </ScrollArea>
    </Card>
  )
} 