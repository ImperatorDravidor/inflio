'use client'

import { useEffect } from 'react'
import { AlertCircle, RefreshCw, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useRouter } from 'next/navigation'

export default function ProcessingError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const router = useRouter()
  
  useEffect(() => {
    // Log the error
    console.error('Processing error:', error)
    
    // Report to error tracking
    if (typeof window !== 'undefined' && window.Sentry) {
      window.Sentry.captureException(error)
    }
  }, [error])
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertCircle className="h-8 w-8 text-destructive" />
          </div>
          <CardTitle>Processing Error</CardTitle>
          <CardDescription>
            Something went wrong while processing your video
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm font-medium mb-2">Possible issues:</p>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>Video format not supported</li>
              <li>Processing service temporarily unavailable</li>
              <li>Video file corrupted or incomplete</li>
              <li>AI service quota exceeded</li>
            </ul>
          </div>
          
          {process.env.NODE_ENV === 'development' && error.message && (
            <div className="p-3 bg-muted rounded-md">
              <p className="text-xs font-mono text-muted-foreground break-all">
                {error.message}
              </p>
            </div>
          )}
          
          <div className="grid gap-2">
            <Button onClick={reset} className="w-full">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry Processing
            </Button>
            <Button 
              variant="outline"
              onClick={() => router.push('/projects')}
              className="w-full"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Projects
            </Button>
          </div>
          
          <div className="text-xs text-center text-muted-foreground space-y-1">
            <p>Your video has been saved and you can try processing it again later.</p>
            <p>If this continues, please contact support with error ID: {error.digest}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Sentry type is already declared in error-boundary.tsx