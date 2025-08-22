'use client'

import { useEffect } from 'react'
import { AlertCircle, RefreshCw, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useRouter } from 'next/navigation'

export default function UploadError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const router = useRouter()
  
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Upload error:', error)
    
    // Report to Sentry if available
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
          <CardTitle>Upload Error</CardTitle>
          <CardDescription>
            We couldn&apos;t complete your video upload
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm font-medium mb-2">What might have happened:</p>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>File size exceeded the limit (2GB)</li>
              <li>Unsupported video format</li>
              <li>Network connection interrupted</li>
              <li>Storage quota exceeded</li>
            </ul>
          </div>
          
          {process.env.NODE_ENV === 'development' && error.message && (
            <div className="p-3 bg-muted rounded-md">
              <p className="text-xs font-mono text-muted-foreground">
                {error.message}
              </p>
            </div>
          )}
          
          <div className="grid gap-2">
            <Button onClick={reset} className="w-full">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
            <Button 
              variant="outline"
              onClick={() => router.push('/dashboard')}
              className="w-full"
            >
              <Home className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
          
          <p className="text-xs text-center text-muted-foreground">
            If this problem persists, try uploading a smaller file or contact support
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

// Sentry type is already declared in error-boundary.tsx