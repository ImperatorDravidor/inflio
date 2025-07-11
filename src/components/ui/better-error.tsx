// Example of improved error handling with user-friendly messages and recovery options
import React from 'react'
import { AlertCircle, RefreshCw, WifiOff, FileWarning, ShieldAlert } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface ErrorDetails {
  type: 'network' | 'validation' | 'permission' | 'server' | 'unknown'
  message: string
  details?: string
  retryable?: boolean
  actions?: Array<{
    label: string
    action: () => void
    variant?: 'default' | 'secondary' | 'outline'
  }>
}

export function handleError(error: unknown, context: string): ErrorDetails {
  // Analyze error type and provide specific guidance
  if (error instanceof Error) {
    // Network errors
    if (error.message.includes('fetch') || error.message.includes('network')) {
      return {
        type: 'network',
        message: 'Connection problem',
        details: 'Please check your internet connection and try again.',
        retryable: true
      }
    }
    
    // Permission errors
    if (error.message.includes('401') || error.message.includes('403')) {
      return {
        type: 'permission',
        message: 'Access denied',
        details: 'You don\'t have permission to perform this action. Please contact support if you believe this is an error.',
        retryable: false
      }
    }
    
    // Validation errors
    if (error.message.includes('validation') || error.message.includes('invalid')) {
      return {
        type: 'validation',
        message: 'Invalid input',
        details: error.message,
        retryable: false
      }
    }
    
    // Server errors
    if (error.message.includes('500') || error.message.includes('server')) {
      return {
        type: 'server',
        message: 'Server error',
        details: 'Our servers are having issues. Please try again in a few minutes.',
        retryable: true
      }
    }
  }
  
  // Default unknown error
  return {
    type: 'unknown',
    message: 'Something went wrong',
    details: `An unexpected error occurred while ${context}. Please try again or contact support if the problem persists.`,
    retryable: true
  }
}

export function BetterErrorAlert({ 
  error,
  onRetry,
  onDismiss 
}: {
  error: ErrorDetails
  onRetry?: () => void
  onDismiss?: () => void
}) {
  const getIcon = () => {
    switch (error.type) {
      case 'network':
        return <WifiOff className="h-4 w-4" />
      case 'validation':
        return <FileWarning className="h-4 w-4" />
      case 'permission':
        return <ShieldAlert className="h-4 w-4" />
      default:
        return <AlertCircle className="h-4 w-4" />
    }
  }
  
  const getVariant = () => {
    switch (error.type) {
      case 'permission':
        return 'destructive'
      case 'validation':
        return 'default'
      default:
        return 'default'
    }
  }
  
  return (
    <Alert variant={getVariant()} className="mb-4">
      {getIcon()}
      <AlertTitle>{error.message}</AlertTitle>
      <AlertDescription className="mt-2">
        <p>{error.details}</p>
        <div className="flex gap-2 mt-4">
          {error.retryable && onRetry && (
            <Button 
              size="sm" 
              onClick={onRetry}
              variant="outline"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Try Again
            </Button>
          )}
          {error.actions?.map((action, index) => (
            <Button
              key={index}
              size="sm"
              variant={action.variant || 'outline'}
              onClick={action.action}
            >
              {action.label}
            </Button>
          ))}
          {onDismiss && (
            <Button 
              size="sm" 
              variant="ghost"
              onClick={onDismiss}
            >
              Dismiss
            </Button>
          )}
        </div>
      </AlertDescription>
    </Alert>
  )
}

// Better toast notifications with actions
export function showErrorToast(error: ErrorDetails, onRetry?: () => void) {
  const toastOptions: any = {
    description: error.details,
    duration: error.type === 'network' ? 10000 : 5000,
  }
  
  if (error.retryable && onRetry) {
    toastOptions.action = {
      label: 'Retry',
      onClick: onRetry
    }
  }
  
  toast.error(error.message, toastOptions)
}

// Example usage in a component
export function ExampleUsage() {
  const [error, setError] = React.useState<ErrorDetails | null>(null)
  const [isLoading, setIsLoading] = React.useState(false)
  
  const fetchData = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/some-endpoint')
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      const data = await response.json()
      // Process data
    } catch (err) {
      const errorDetails = handleError(err, 'loading your content')
      setError(errorDetails)
      showErrorToast(errorDetails, fetchData)
    } finally {
      setIsLoading(false)
    }
  }
  
  return (
    <div>
      {error && (
        <BetterErrorAlert
          error={error}
          onRetry={fetchData}
          onDismiss={() => setError(null)}
        />
      )}
      
      <Button 
        onClick={fetchData}
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            Loading...
          </>
        ) : (
          'Load Data'
        )}
      </Button>
    </div>
  )
} 