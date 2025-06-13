"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  IconAlertTriangle, 
  IconRefresh, 
  IconBug, 
  IconArrowLeft,
  IconCopy,
  IconExternalLink
} from "@tabler/icons-react"
import { toast } from "sonner"

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<ErrorFallbackProps>
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

interface ErrorFallbackProps {
  error: Error
  resetError: () => void
  errorInfo?: React.ErrorInfo
}

// Default Error Fallback Component
function DefaultErrorFallback({ error, resetError, errorInfo }: ErrorFallbackProps) {
  const copyErrorToClipboard = () => {
    const errorDetails = `
Error: ${error.message}
Stack: ${error.stack}
Component Stack: ${errorInfo?.componentStack || 'Not available'}
Timestamp: ${new Date().toISOString()}
User Agent: ${navigator.userAgent}
    `.trim()
    
    navigator.clipboard.writeText(errorDetails)
    toast.success("Error details copied to clipboard")
  }

  const reportIssue = () => {
    const errorDetails = encodeURIComponent(`
**Error Description:**
${error.message}

**Steps to reproduce:**
1. 
2. 
3. 

**Error Details:**
\`\`\`
${error.stack}
\`\`\`

**Component Stack:**
\`\`\`
${errorInfo?.componentStack || 'Not available'}
\`\`\`

**Environment:**
- Browser: ${navigator.userAgent}
- Timestamp: ${new Date().toISOString()}
    `.trim())
    
    window.open(`https://github.com/yourusername/inflio/issues/new?title=Bug%20Report&body=${errorDetails}`, '_blank')
  }

  return (
    <div className="min-h-[400px] flex items-center justify-center p-4">
      <Card className="max-w-lg w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 p-3 rounded-full bg-destructive/10">
            <IconAlertTriangle className="h-8 w-8 text-destructive" />
          </div>
          <CardTitle className="text-xl">Something went wrong</CardTitle>
          <CardDescription>
            We're sorry, but something unexpected happened. The error has been logged.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <IconBug className="h-4 w-4" />
            <AlertDescription className="font-mono text-sm">
              {error.message}
            </AlertDescription>
          </Alert>
          
          <div className="grid gap-2">
            <Button onClick={resetError} className="w-full">
              <IconRefresh className="h-4 w-4 mr-2" />
              Try Again
            </Button>
            
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" onClick={copyErrorToClipboard} size="sm">
                <IconCopy className="h-4 w-4 mr-2" />
                Copy Error
              </Button>
              <Button variant="outline" onClick={reportIssue} size="sm">
                <IconExternalLink className="h-4 w-4 mr-2" />
                Report Issue
              </Button>
            </div>
          </div>
          
          <div className="pt-4 border-t">
            <Button 
              variant="ghost" 
              onClick={() => window.location.href = '/'}
              className="w-full"
            >
              <IconArrowLeft className="h-4 w-4 mr-2" />
              Go to Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Error Boundary Class Component
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({
      error,
      errorInfo
    })

    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo)
    }

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo)

    // In production, you might want to send this to an error reporting service
    // reportError(error, errorInfo)
  }

  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    })
  }

  render() {
    if (this.state.hasError && this.state.error) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback
      return (
        <FallbackComponent
          error={this.state.error}
          resetError={this.resetError}
          errorInfo={this.state.errorInfo || undefined}
        />
      )
    }

    return this.props.children
  }
}

// Page-level Error Component
export function PageError({ 
  title = "Page Error",
  description = "Something went wrong loading this page",
  error,
  onRetry
}: {
  title?: string
  description?: string
  error?: Error
  onRetry?: () => void
}) {
  return (
    <div className="min-h-[50vh] flex items-center justify-center p-4">
      <div className="text-center space-y-6 max-w-md">
        <div className="mx-auto p-4 rounded-full bg-destructive/10 w-fit">
          <IconAlertTriangle className="h-12 w-12 text-destructive" />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">{title}</h1>
          <p className="text-muted-foreground">{description}</p>
        </div>
        
        {error && (
          <Alert variant="destructive">
            <AlertDescription className="text-left font-mono text-sm">
              {error.message}
            </AlertDescription>
          </Alert>
        )}
        
        <div className="flex flex-col sm:flex-row gap-2 justify-center">
          {onRetry && (
            <Button onClick={onRetry}>
              <IconRefresh className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          )}
          <Button variant="outline" onClick={() => window.history.back()}>
            <IconArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    </div>
  )
}

// Network Error Component
export function NetworkError({ onRetry }: { onRetry?: () => void }) {
  return (
    <Alert variant="destructive">
      <IconAlertTriangle className="h-4 w-4" />
      <AlertDescription className="flex items-center justify-between">
        <span>Network error occurred. Please check your connection.</span>
        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry}>
            <IconRefresh className="h-4 w-4 mr-1" />
            Retry
          </Button>
        )}
      </AlertDescription>
    </Alert>
  )
}

// File Error Component  
export function FileError({ 
  message = "File processing failed",
  onRetry,
  onRemove
}: {
  message?: string
  onRetry?: () => void
  onRemove?: () => void
}) {
  return (
    <Alert variant="destructive">
      <IconAlertTriangle className="h-4 w-4" />
      <AlertDescription>
        <div className="flex items-center justify-between">
          <span>{message}</span>
          <div className="flex gap-2">
            {onRetry && (
              <Button variant="outline" size="sm" onClick={onRetry}>
                <IconRefresh className="h-4 w-4 mr-1" />
                Retry
              </Button>
            )}
            {onRemove && (
              <Button variant="outline" size="sm" onClick={onRemove}>
                Remove
              </Button>
            )}
          </div>
        </div>
      </AlertDescription>
    </Alert>
  )
}

// Hook for error handling
export function useErrorHandler() {
  const handleError = React.useCallback((error: Error, context?: string) => {
    console.error(`Error ${context ? `in ${context}` : ''}:`, error)
    
    // Show user-friendly toast
    toast.error(error.message || 'An unexpected error occurred')
    
    // In production, report to error tracking service
    // reportError(error, { context })
  }, [])

  return handleError
} 