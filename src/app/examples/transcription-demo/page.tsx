'use client'

import { useState, useRef } from 'react'
import { uploadVideo, transcribeVideo } from '@/lib/api'
import { TranscriptViewer } from '@/components/TranscriptViewer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Loader2, Upload, FileVideo, Sparkles } from 'lucide-react'
import { toast } from 'sonner'

export default function TranscriptionDemo() {
  const [file, setFile] = useState<File | null>(null)
  const [video, setVideo] = useState<{ id: string } | null>(null)
  const [uploading, setUploading] = useState(false)
  const [transcribing, setTranscribing] = useState(false)
  const [hasTranscript, setHasTranscript] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setVideo(null)
      setHasTranscript(false)
    }
  }

  const handleUpload = async () => {
    if (!file) return

    try {
      setUploading(true)
      const uploadedVideo = await uploadVideo(file)
      setVideo(uploadedVideo)
      toast.success('Video uploaded successfully!')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleTranscribe = async () => {
    if (!video || !file) return

    try {
      setTranscribing(true)
      await transcribeVideo(video.id, file)
      setHasTranscript(true)
      toast.success('Video transcribed successfully!')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Transcription failed')
    } finally {
      setTranscribing(false)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">AI Transcription Demo</h1>
      
      {/* File Upload Section */}
      <Card className="p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Step 1: Upload Video</h2>
        
        <div className="space-y-4">
          <div>
            <Input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
              className="w-full"
            >
              <Upload className="h-4 w-4 mr-2" />
              Select Video File
            </Button>
          </div>

          {file && (
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <FileVideo className="h-5 w-5 text-gray-600" />
                <div>
                  <p className="font-medium">{file.name}</p>
                  <p className="text-sm text-gray-500">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <Button 
                onClick={handleUpload} 
                disabled={uploading || !!video}
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : video ? (
                  'Uploaded ✓'
                ) : (
                  'Upload'
                )}
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Transcription Section */}
      {video && (
        <Card className="p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Step 2: Generate Transcript</h2>
          
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                Video uploaded successfully! ID: <code>{video.id}</code>
              </p>
            </div>

            {!hasTranscript && (
              <Button 
                onClick={handleTranscribe}
                disabled={transcribing}
                className="w-full"
              >
                {transcribing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Transcribing... This may take a few moments
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate AI Transcript
                  </>
                )}
              </Button>
            )}
          </div>
        </Card>
      )}

      {/* Transcript Viewer */}
      {video && (
        <TranscriptViewer 
          videoId={video.id}
          hasTranscript={hasTranscript}
          onTranscribe={handleTranscribe}
        />
      )}

      {/* Instructions */}
      <Card className="p-6 mt-6">
        <h3 className="font-semibold mb-2">How it works:</h3>
        <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
          <li>Select a video file from your computer</li>
          <li>Click &quot;Upload&quot; to save the video metadata</li>
          <li>Click &quot;Generate AI Transcript&quot; to send the video to OpenAI Whisper</li>
          <li>View the generated transcript with timestamps</li>
        </ol>
        
        <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
          <p className="text-xs text-yellow-800">
            <strong>Note:</strong> Maximum file size for Whisper API is 25MB. 
            Larger videos need to be compressed or have audio extracted first.
          </p>
        </div>
      </Card>

      <Card className="p-6 mt-6">
        <h3 className="font-semibold mb-2">Additional Tips:</h3>
        <div className="space-y-4 text-sm text-muted-foreground">
          <p>
            <strong>Tip:</strong> This is just a demo! In production:
          </p>
          <ul className="space-y-2 ml-4">
            <li>• Use Supabase or your preferred database</li>
            <li>• Store videos in cloud storage (S3, Cloudinary, etc.)</li>
            <li>• Add authentication and user management</li>
            <li>• Implement rate limiting and usage quotas</li>
          </ul>
          
          <p className="text-xs mt-4">
            Files marked as &quot;Demo Only&quot; will not be sent to the API.
            Videos marked &quot;From Processing&quot; were generated by our mock processing.
          </p>
        </div>
      </Card>
    </div>
  )
} 