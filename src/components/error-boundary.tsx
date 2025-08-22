'use client'

import React from 'react'
import { AlertCircle, RefreshCw, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useRouter } from 'next/navigation'

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<ErrorFallbackProps>
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
  resetKeys?: Array<string | number>
  resetOnPropsChange?: boolean
  isolate?: boolean
  level?: 'page' | 'section' | 'component'
  showDetails?: boolean
}

interface ErrorFallbackProps {
  error: Error | null
  resetError: () => void
  level?: 'page' | 'section' | 'component'
  showDetails?: boolean
}

/**
 * Default error fallback component
 */
function DefaultErrorFallback({ error, resetError, level = 'page', showDetails = false }: ErrorFallbackProps) {
  const router = useRouter()
  
  const handleGoHome = () => {
    router.push('/dashboard')
  }
  
  // Different UI based on error level
  if (level === 'component') {
    return (
      <div className="flex items-center justify-center p-4 border border-destructive/20 rounded-lg bg-destructive/5">
        <div className="text-center space-y-2">
          <AlertCircle className="h-8 w-8 text-destructive mx-auto" />
          <p className="text-sm text-muted-foreground">Something went wrong</p>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={resetError}
            className="mt-2"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Try Again
          </Button>
        </div>
      </div>
    )
  }
  
  if (level === 'section') {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            Error Loading Content
          </CardTitle>
          <CardDescription>
            This section couldn&apos;t be loaded properly
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {showDetails && error && (
            <div className="p-3 bg-muted rounded-md">
              <p className="text-xs font-mono text-muted-foreground">
                {error.message}
              </p>
            </div>
          )}
          <div className="flex gap-2">
            <Button 
              variant="default" 
              size="sm" 
              onClick={resetError}
              className="flex-1"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }
  
  // Page level error
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-20 w-20 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertCircle className="h-10 w-10 text-destructive" />
          </div>
          <CardTitle className="text-2xl">Oops! Something went wrong</CardTitle>
          <CardDescription className="text-base mt-2">
            We encountered an unexpected error. Don&apos;t worry, your work is safe.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {showDetails && error && (
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm font-medium mb-1">Error Details:</p>
              <p className="text-xs font-mono text-muted-foreground break-all">
                {error.message}
              </p>
              {error.stack && (
                <details className="mt-2">
                  <summary className="text-xs text-muted-foreground cursor-pointer">
                    Show stack trace
                  </summary>
                  <pre className="mt-2 text-xs text-muted-foreground overflow-auto max-h-40">
                    {error.stack}
                  </pre>
                </details>
              )}
            </div>
          )}
          
          <div className="grid gap-2">
            <Button 
              onClick={resetError}
              className="w-full"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
            <Button 
              variant="outline"
              onClick={handleGoHome}
              className="w-full"
            >
              <Home className="h-4 w-4 mr-2" />
              Go to Dashboard
            </Button>
          </div>
          
          <p className="text-xs text-center text-muted-foreground">
            If this problem persists, please contact support
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * Error Boundary Component
 * Catches JavaScript errors anywhere in the child component tree
 */
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
    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo)
    }
    
    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo)
    
    // Update state with error info
    this.setState({
      error,
      errorInfo
    })
    
    // Report to error tracking service (e.g., Sentry)
    if (typeof window !== 'undefined' && window.Sentry) {
      window.Sentry.captureException(error, {
        contexts: {
          react: {
            componentStack: errorInfo.componentStack
          }
        }
      })
    }
  }
  
  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    const { resetKeys, resetOnPropsChange } = this.props
    const { hasError } = this.state
    
    // Reset error boundary if resetKeys changed
    if (hasError && resetKeys && prevProps.resetKeys) {
      const hasResetKeyChanged = resetKeys.some((key, idx) => key !== prevProps.resetKeys![idx])
      if (hasResetKeyChanged) {
        this.resetError()
      }
    }
    
    // Reset on any props change if configured
    if (hasError && resetOnPropsChange && prevProps !== this.props) {
      this.resetError()
    }
  }
  
  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    })
  }
  
  render() {
    const { hasError, error } = this.state
    const { children, fallback: Fallback, level = 'page', showDetails = process.env.NODE_ENV === 'development' } = this.props
    
    if (hasError) {
      if (Fallback) {
        return <Fallback error={error} resetError={this.resetError} level={level} showDetails={showDetails} />
      }
      
      return (
        <DefaultErrorFallback 
          error={error} 
          resetError={this.resetError}
          level={level}
          showDetails={showDetails}
        />
      )
    }
    
    return children
  }
}

/**
 * Hook to create error boundary wrapper
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  )
  
  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`
  
  return WrappedComponent
}

/**
 * Hook to throw errors to the nearest error boundary
 */
export function useErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null)
  
  React.useEffect(() => {
    if (error) {
      throw error
    }
  }, [error])
  
  return setError
}

// Type augmentation for Sentry
declare global {
  interface Window {
    Sentry?: {
      captureException: (error: Error, context?: any) => void
    }
  }
}