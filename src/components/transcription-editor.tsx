"use client"

import { useState, useRef, useCallback } from "react"
import { TranscriptionData } from "@/lib/project-types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from "sonner"
import { 
  IconEdit,
  IconCheck,
  IconX,
  IconSparkles,
  IconFileText,
  IconClock,
  IconLanguage,
  IconBulb,
  IconLoader2,
  IconAlertCircle
} from "@tabler/icons-react"
import { formatDuration } from "@/lib/video-utils"

interface TranscriptionEditorProps {
  transcription: TranscriptionData
  projectId: string
  onUpdate?: (transcription: TranscriptionData) => void
  readOnly?: boolean
}

export function TranscriptionEditor({ 
  transcription, 
  projectId,
  onUpdate,
  readOnly = false
}: TranscriptionEditorProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedText, setEditedText] = useState(transcription.text)
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false)
  const [summary, setSummary] = useState<string>("")
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (editedText === transcription.text) {
      setIsEditing(false)
      return
    }

    setSaving(true)
    try {
      // Update the transcription
      const response = await fetch(`/api/projects/${projectId}/transcription`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: editedText,
          segments: transcription.segments // Keep existing segments for now
        })
      })

      if (!response.ok) {
        throw new Error('Failed to update transcription')
      }

      const updatedTranscription = await response.json()
      
      if (onUpdate) {
        onUpdate(updatedTranscription)
      }

      toast.success("Transcription updated successfully")
      setIsEditing(false)
    } catch (error) {
      console.error('Error saving transcription:', error)
      toast.error("Failed to save transcription")
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setEditedText(transcription.text)
    setIsEditing(false)
  }

  const generateSummary = async () => {
    setIsGeneratingSummary(true)
    try {
      const response = await fetch('/api/generate-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: transcription.text,
          maxLength: 200
        })
      })

      if (!response.ok) {
        throw new Error('Failed to generate summary')
      }

      const data = await response.json()
      setSummary(data.summary)
      toast.success("Summary generated successfully")
    } catch (error) {
      console.error('Error generating summary:', error)
      toast.error("Failed to generate summary")
    } finally {
      setIsGeneratingSummary(false)
    }
  }

  const wordCount = transcription.text.split(' ').length
  const estimatedReadTime = Math.ceil(wordCount / 200)

  return (
    <div className="space-y-6">
      {/* Header with stats */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Badge variant="secondary" className="gap-1">
            <IconLanguage className="h-3 w-3" />
            {transcription.language.toUpperCase()}
          </Badge>
          <Badge variant="secondary" className="gap-1">
            <IconClock className="h-3 w-3" />
            {formatDuration(transcription.duration)}
          </Badge>
          <Badge variant="secondary" className="gap-1">
            <IconFileText className="h-3 w-3" />
            {wordCount.toLocaleString()} words
          </Badge>
          <Badge variant="secondary" className="gap-1">
            <IconClock className="h-3 w-3" />
            ~{estimatedReadTime} min read
          </Badge>
        </div>
        {!readOnly && !isEditing && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditing(true)}
          >
            <IconEdit className="h-4 w-4 mr-2" />
            Edit Transcript
          </Button>
        )}
      </div>

      {/* Main content */}
      <Tabs defaultValue="transcript" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="transcript">Transcript</TabsTrigger>
          <TabsTrigger value="summary">AI Summary</TabsTrigger>
        </TabsList>

        <TabsContent value="transcript" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              {isEditing ? (
                <div className="space-y-4">
                  <Textarea
                    value={editedText}
                    onChange={(e) => setEditedText(e.target.value)}
                    className="min-h-[400px] font-mono text-sm"
                    placeholder="Edit your transcript..."
                  />
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCancel}
                      disabled={saving}
                    >
                      <IconX className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSave}
                      disabled={saving}
                    >
                      {saving ? (
                        <>
                          <IconLoader2 className="h-4 w-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <IconCheck className="h-4 w-4 mr-2" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <p className="whitespace-pre-wrap leading-relaxed">
                    {transcription.text}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="summary" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconBulb className="h-5 w-5 text-yellow-500" />
                AI-Generated Summary
              </CardTitle>
              <CardDescription>
                Get a concise summary of your transcript using AI
              </CardDescription>
            </CardHeader>
            <CardContent>
              {summary ? (
                <div className="space-y-4">
                  <div className="prose prose-sm dark:prose-invert">
                    <p>{summary}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={generateSummary}
                    disabled={isGeneratingSummary}
                  >
                    <IconSparkles className="h-4 w-4 mr-2" />
                    Regenerate Summary
                  </Button>
                </div>
              ) : (
                <div className="text-center py-8">
                  <IconSparkles className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">
                    No summary generated yet. Click below to create one.
                  </p>
                  <Button
                    onClick={generateSummary}
                    disabled={isGeneratingSummary}
                  >
                    {isGeneratingSummary ? (
                      <>
                        <IconLoader2 className="h-4 w-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <IconSparkles className="h-4 w-4 mr-2" />
                        Generate Summary
                      </>
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Tips */}
      <Alert>
        <IconAlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Pro tip:</strong> You can edit the transcript to fix any errors or add punctuation. 
          The AI-generated summary helps you quickly understand the key points of your content.
        </AlertDescription>
      </Alert>
    </div>
  )
} 