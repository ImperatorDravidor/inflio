"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, RefreshCw, Eye } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import Link from 'next/link'

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
        // Force a full page reload to clear all cached state then redirect to onboarding
        setTimeout(() => {
          window.location.href = '/onboarding'
        }, 1500)
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
          
          <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-700 dark:text-blue-300 font-medium mb-2">Developer Tip:</p>
            <p className="text-sm text-blue-600 dark:text-blue-400">
              You can also preview onboarding without resetting by visiting:
            </p>
            <code className="text-xs bg-blue-100 dark:bg-blue-900/50 px-2 py-1 rounded mt-1 inline-block">
              /onboarding?force=true
            </code>
          </div>

          {message && (
            <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
              <AlertDescription>{message.text}</AlertDescription>
            </Alert>
          )}

          <div className="flex gap-3">
            <Button
              onClick={handleReset}
              disabled={isResetting}
              className="flex-1"
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
            
            <Link href="/onboarding?force=true" className="flex-1">
              <Button variant="outline" className="w-full">
                <Eye className="mr-2 h-4 w-4" />
                Preview Without Reset
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}