"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@clerk/nextjs'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, Zap, ArrowRight } from 'lucide-react'

export default function SkipOnboardingPage() {
  const router = useRouter()
  const { userId } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [isDevelopment] = useState(process.env.NODE_ENV === 'development')

  const handleSkipOnboarding = async () => {
    if (!userId) return
    
    setIsLoading(true)
    try {
      const response = await fetch('/api/dev-bypass-onboarding', {
        method: 'POST'
      })
      
      if (response.ok) {
        // Clear any cached data
        window.location.href = '/dashboard'
      } else {
        const error = await response.json()
        console.error('Failed to bypass:', error)
        alert('Failed to bypass onboarding. Check console for details.')
      }
    } catch (error) {
      console.error('Error bypassing onboarding:', error)
      alert('Error bypassing onboarding. Check console for details.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoToOnboarding = () => {
    router.push('/onboarding')
  }

  const handleContinueWithParam = () => {
    // Navigate with skip parameter
    window.location.href = '/dashboard?skip_onboarding=true'
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            Skip Onboarding
          </CardTitle>
          <CardDescription>
            {isDevelopment 
              ? "Development mode: You can skip onboarding for testing"
              : "This feature is only available in development mode"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isDevelopment ? (
            <>
              <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg text-sm">
                <p className="text-yellow-800 dark:text-yellow-200">
                  ⚠️ Skipping onboarding will create a minimal profile with default values. 
                  Some features may not work correctly without proper setup.
                </p>
              </div>
              
              <div className="space-y-2">
                <Button 
                  onClick={handleSkipOnboarding}
                  disabled={isLoading}
                  className="w-full"
                  variant="default"
                >
                  {isLoading ? (
                    <>Processing...</>
                  ) : (
                    <>
                      <Zap className="h-4 w-4 mr-2" />
                      Skip Onboarding & Go to Dashboard
                    </>
                  )}
                </Button>
                
                <Button 
                  onClick={handleContinueWithParam}
                  variant="outline"
                  className="w-full"
                >
                  Continue with URL Parameter
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
                
                <Button 
                  onClick={handleGoToOnboarding}
                  variant="ghost"
                  className="w-full"
                >
                  Go to Normal Onboarding
                </Button>
              </div>

              <div className="text-xs text-muted-foreground space-y-1">
                <p>• This creates a basic profile for development</p>
                <p>• You can reset this later in settings</p>
                <p>• Production users cannot access this</p>
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                To properly set up your account, please complete the onboarding process.
              </p>
              <Button 
                onClick={handleGoToOnboarding}
                className="w-full"
              >
                Go to Onboarding
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}