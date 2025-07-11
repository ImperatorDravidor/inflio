// Examples of improved loading states and progress indicators
import React from 'react'
import { Loader2, CheckCircle2, Upload, FileText, Image } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

// Skeleton loader for content
export function ContentSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-3", className)}>
      <div className="animate-pulse">
        <div className="h-4 bg-muted rounded w-3/4"></div>
        <div className="h-4 bg-muted rounded w-1/2 mt-2"></div>
        <div className="h-20 bg-muted rounded mt-4"></div>
      </div>
    </div>
  )
}

// Inline loading indicator
export function InlineLoader({ text = "Loading..." }: { text?: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <Loader2 className="h-3 w-3 animate-spin" />
      <span>{text}</span>
    </div>
  )
}

// Progress bar with status
interface ProgressWithStatusProps {
  value: number
  status: string
  showPercentage?: boolean
  estimatedTime?: number
}

export function ProgressWithStatus({ 
  value, 
  status, 
  showPercentage = true,
  estimatedTime 
}: ProgressWithStatusProps) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">{status}</span>
        <div className="flex gap-3">
          {showPercentage && (
            <span className="font-medium">{Math.round(value)}%</span>
          )}
          {estimatedTime && estimatedTime > 0 && (
            <span className="text-muted-foreground">
              ~{formatTime(estimatedTime)} remaining
            </span>
          )}
        </div>
      </div>
      <Progress value={value} className="h-2" />
    </div>
  )
}

// Multi-step progress indicator
interface Step {
  id: string
  name: string
  status: 'pending' | 'active' | 'completed' | 'error'
  error?: string
}

export function MultiStepProgress({ steps }: { steps: Step[] }) {
  return (
    <div className="space-y-2">
      {steps.map((step, index) => (
        <div key={step.id} className="flex items-center gap-3">
          <div className="flex-shrink-0">
            {step.status === 'completed' && (
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            )}
            {step.status === 'active' && (
              <Loader2 className="h-5 w-5 text-primary animate-spin" />
            )}
            {step.status === 'pending' && (
              <div className="h-5 w-5 rounded-full border-2 border-muted" />
            )}
            {step.status === 'error' && (
              <div className="h-5 w-5 rounded-full bg-destructive" />
            )}
          </div>
          <div className="flex-1">
            <p className={cn(
              "text-sm",
              step.status === 'active' && "font-medium",
              step.status === 'pending' && "text-muted-foreground"
            )}>
              {step.name}
            </p>
            {step.error && (
              <p className="text-xs text-destructive mt-1">{step.error}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

// File upload progress
interface FileUploadProgressProps {
  fileName: string
  fileSize: number
  uploadedBytes: number
  uploadSpeed?: number
  isPaused?: boolean
  onPause?: () => void
  onResume?: () => void
  onCancel?: () => void
}

export function FileUploadProgress({
  fileName,
  fileSize,
  uploadedBytes,
  uploadSpeed = 0,
  isPaused = false,
  onPause,
  onResume,
  onCancel
}: FileUploadProgressProps) {
  const progress = (uploadedBytes / fileSize) * 100
  const remainingBytes = fileSize - uploadedBytes
  const estimatedTime = uploadSpeed > 0 ? remainingBytes / uploadSpeed : 0
  
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Upload className="h-5 w-5 text-primary mt-0.5" />
          <div className="flex-1 space-y-2">
            <div className="flex justify-between">
              <p className="text-sm font-medium truncate">{fileName}</p>
              <p className="text-xs text-muted-foreground">
                {formatBytes(uploadedBytes)} / {formatBytes(fileSize)}
              </p>
            </div>
            
            <Progress value={progress} className="h-2" />
            
            <div className="flex justify-between items-center">
              <div className="text-xs text-muted-foreground">
                {uploadSpeed > 0 && (
                  <span>{formatBytes(uploadSpeed)}/s</span>
                )}
                {estimatedTime > 0 && (
                  <span className="ml-2">• {formatTime(estimatedTime)} left</span>
                )}
              </div>
              
              <div className="flex gap-2">
                {isPaused ? (
                  <button
                    onClick={onResume}
                    className="text-xs text-primary hover:underline"
                  >
                    Resume
                  </button>
                ) : (
                  <button
                    onClick={onPause}
                    className="text-xs text-primary hover:underline"
                  >
                    Pause
                  </button>
                )}
                <button
                  onClick={onCancel}
                  className="text-xs text-destructive hover:underline"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Bulk operation progress
interface BulkOperationItem {
  id: string
  name: string
  status: 'pending' | 'processing' | 'completed' | 'error'
  error?: string
}

export function BulkOperationProgress({
  title,
  items,
  onCancel
}: {
  title: string
  items: BulkOperationItem[]
  onCancel?: () => void
}) {
  const completed = items.filter(i => i.status === 'completed').length
  const failed = items.filter(i => i.status === 'error').length
  const progress = (completed / items.length) * 100
  
  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-medium">{title}</h3>
          {onCancel && (
            <button
              onClick={onCancel}
              className="text-sm text-destructive hover:underline"
            >
              Cancel
            </button>
          )}
        </div>
        
        <ProgressWithStatus
          value={progress}
          status={`${completed} of ${items.length} completed${failed > 0 ? ` (${failed} failed)` : ''}`}
        />
        
        <div className="max-h-40 overflow-y-auto space-y-2">
          {items.map(item => (
            <div key={item.id} className="flex items-center gap-2 text-sm">
              {item.status === 'processing' && (
                <Loader2 className="h-3 w-3 animate-spin text-primary" />
              )}
              {item.status === 'completed' && (
                <CheckCircle2 className="h-3 w-3 text-green-500" />
              )}
              {item.status === 'error' && (
                <div className="h-3 w-3 rounded-full bg-destructive" />
              )}
              {item.status === 'pending' && (
                <div className="h-3 w-3 rounded-full border border-muted" />
              )}
              <span className={cn(
                item.status === 'processing' && "font-medium",
                item.status === 'pending' && "text-muted-foreground",
                item.status === 'error' && "text-destructive"
              )}>
                {item.name}
              </span>
              {item.error && (
                <span className="text-xs text-destructive">({item.error})</span>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// Helper functions
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`
}

function formatTime(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`
  return `${Math.round(seconds / 3600)}h`
}

// Example usage
export function LoadingExamples() {
  const [uploadProgress, setUploadProgress] = React.useState(0)
  const [steps, setSteps] = React.useState<Step[]>([
    { id: '1', name: 'Analyzing video', status: 'completed' },
    { id: '2', name: 'Generating transcription', status: 'active' },
    { id: '3', name: 'Creating clips', status: 'pending' },
    { id: '4', name: 'Optimizing for platforms', status: 'pending' }
  ])
  
  React.useEffect(() => {
    const interval = setInterval(() => {
      setUploadProgress(prev => Math.min(prev + 5, 100))
    }, 500)
    return () => clearInterval(interval)
  }, [])
  
  return (
    <div className="space-y-8 p-4">
      <div>
        <h3 className="font-medium mb-4">Content Loading</h3>
        <ContentSkeleton />
      </div>
      
      <div>
        <h3 className="font-medium mb-4">Progress Indicators</h3>
        <ProgressWithStatus
          value={uploadProgress}
          status="Uploading video"
          estimatedTime={120}
        />
      </div>
      
      <div>
        <h3 className="font-medium mb-4">Multi-step Process</h3>
        <MultiStepProgress steps={steps} />
      </div>
      
      <div>
        <h3 className="font-medium mb-4">File Upload</h3>
        <FileUploadProgress
          fileName="vacation-video.mp4"
          fileSize={52428800} // 50MB
          uploadedBytes={uploadProgress * 524288}
          uploadSpeed={1048576} // 1MB/s
          onPause={() => console.log('Pause')}
          onResume={() => console.log('Resume')}
          onCancel={() => console.log('Cancel')}
        />
      </div>
    </div>
  )
} 