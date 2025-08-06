'use client'

import { useEffect } from 'react'
import { AlertCircle, RefreshCw, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useRouter, useParams } from 'next/navigation'

export default function ProjectError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const router = useRouter()
  const params = useParams()
  
  useEffect(() => {
    // Log the error
    console.error('Project error:', error)
    
    // Report to error tracking
    if (typeof window !== 'undefined' && window.Sentry) {
      window.Sentry.captureException(error, {
        tags: {
          projectId: params?.id as string
        }
      })
    }
  }, [error, params])
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertCircle className="h-8 w-8 text-destructive" />
          </div>
          <CardTitle>Unable to Load Project</CardTitle>
          <CardDescription>
            We couldn&apos;t load this project&apos;s details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">
              This might happen if:
            </p>
            <ul className="mt-2 text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>The project was deleted or moved</li>
              <li>You don&apos;t have permission to view it</li>
              <li>There&apos;s a temporary connection issue</li>
            </ul>
          </div>
          
          {process.env.NODE_ENV === 'development' && error.message && (
            <div className="p-3 bg-muted rounded-md">
              <p className="text-xs font-mono text-muted-foreground break-all">
                Error: {error.message}
              </p>
              {params?.id && (
                <p className="text-xs font-mono text-muted-foreground mt-1">
                  Project ID: {params.id}
                </p>
              )}
            </div>
          )}
          
          <div className="grid gap-2">
            <Button onClick={reset} className="w-full">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
            <Button 
              variant="outline"
              onClick={() => router.push('/projects')}
              className="w-full"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              All Projects
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Sentry type is already declared in error-boundary.tsx