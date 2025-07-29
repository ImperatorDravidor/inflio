"use client"

import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { IconAlertTriangle, IconRefresh, IconHome } from "@tabler/icons-react"
import { useRouter } from "next/navigation"

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode; fallback?: React.ReactNode }) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Error caught by boundary:", error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return <>{this.props.fallback}</>
      }

      return <ErrorFallback error={this.state.error} />
    }

    return this.props.children
  }
}

function ErrorFallback({ error }: { error: Error | null }) {
  const router = useRouter()

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="max-w-lg w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 p-3 rounded-full bg-destructive/10 w-fit">
            <IconAlertTriangle className="h-8 w-8 text-destructive" />
          </div>
          <CardTitle className="text-2xl">Something went wrong</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground text-center">
            We encountered an unexpected error. Don't worry, your work is safe.
          </p>
          
          {error && (
            <details className="rounded-lg border p-3">
              <summary className="cursor-pointer text-sm font-medium">
                Error details
              </summary>
              <pre className="mt-2 text-xs overflow-auto bg-muted p-2 rounded">
                {error.message}
              </pre>
            </details>
          )}

          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => router.push('/dashboard')}
            >
              <IconHome className="h-4 w-4 mr-2" />
              Go to Dashboard
            </Button>
            <Button
              className="flex-1"
              onClick={() => window.location.reload()}
            >
              <IconRefresh className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Hook for error handling
export function useErrorHandler() {
  return (error: Error, errorInfo?: string) => {
    console.error("Error:", error)
    if (errorInfo) {
      console.error("Error Info:", errorInfo)
    }
    
    // You could also send to error tracking service here
    // sendToErrorTracking(error, errorInfo)
  }
}