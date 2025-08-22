"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, RefreshCw } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function ResetOnboardingPage() {
  const router = useRouter()
  const [isResetting, setIsResetting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const handleReset = async () => {
    setIsResetting(true)
    setMessage(null)

    try {
      const response = await fetch('/api/reset-onboarding', {
        method: 'POST',
      })

      const data = await response.json()

      if (response.ok) {
        setMessage({ type: 'success', text: data.message })
        // Redirect to onboarding after 2 seconds
        setTimeout(() => {
          router.push('/onboarding')
        }, 2000)
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to reset onboarding' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred while resetting onboarding' })
    } finally {
      setIsResetting(false)
    }
  }

  return (
    <div className="container max-w-2xl mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Reset Onboarding</CardTitle>
          <CardDescription>
            This will reset your onboarding status and allow you to go through the onboarding flow again.
            This is useful for testing or if you want to update your initial settings.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Resetting onboarding will not delete your existing data. It will only allow you to access
              the onboarding flow again to update your preferences.
            </AlertDescription>
          </Alert>

          {message && (
            <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
              <AlertDescription>{message.text}</AlertDescription>
            </Alert>
          )}

          <Button
            onClick={handleReset}
            disabled={isResetting}
            className="w-full"
          >
            {isResetting ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Resetting...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Reset Onboarding
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}