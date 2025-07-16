"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { IconRefresh, IconCheck } from "@tabler/icons-react"
import { useRouter } from "next/navigation"
import { UsageService } from "@/lib/usage-service"

export default function ResetUsagePage() {
  const [isResetting, setIsResetting] = useState(false)
  const [isReset, setIsReset] = useState(false)
  const router = useRouter()

  const handleReset = async () => {
    setIsResetting(true)
    
    try {
      // Call the API endpoint
      const response = await fetch('/api/reset-usage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Failed to reset usage')
      }

      const data = await response.json()
      
      // Update localStorage with the reset data
      if (data.resetData && typeof window !== 'undefined') {
        localStorage.setItem('inflio_usage', JSON.stringify(data.resetData))
        
        // Dispatch event to update any listening components
        window.dispatchEvent(new CustomEvent('usageUpdate', { detail: data.resetData }))
      }

      setIsReset(true)
      toast.success('Usage limit has been reset! You now have 100 videos/month.')
      
      // Redirect after 2 seconds
      setTimeout(() => {
        router.push('/projects')
      }, 2000)
      
    } catch (error) {
      console.error('Reset error:', error)
      toast.error('Failed to reset usage limit')
    } finally {
      setIsResetting(false)
    }
  }

  // Also provide a direct localStorage reset option
  const handleDirectReset = () => {
    UsageService.updatePlan('pro')
    const usage = UsageService.getUsage()
    const resetUsage = {
      ...usage,
      used: 0,
      limit: 100,
      plan: 'pro' as const,
    }
    localStorage.setItem('inflio_usage', JSON.stringify(resetUsage))
    window.dispatchEvent(new CustomEvent('usageUpdate', { detail: resetUsage }))
    
    toast.success('Usage reset locally! You now have 100 videos/month.')
    setIsReset(true)
    
    setTimeout(() => {
      router.push('/projects')
    }, 2000)
  }

  return (
    <div className="container max-w-2xl py-8">
      <Card>
        <CardHeader>
          <CardTitle>Reset Usage Limit</CardTitle>
          <CardDescription>
            Reset your monthly video processing limit. This will give you 100 videos for testing.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
              <p className="text-sm text-amber-800 dark:text-amber-200">
                <strong>Note:</strong> Usage tracking is currently stored locally in your browser. 
                In production, this should be stored in the database for proper tracking across devices.
              </p>
            </div>

            {!isReset ? (
              <div className="flex flex-col gap-4">
                <Button
                  onClick={handleReset}
                  disabled={isResetting}
                  size="lg"
                  className="w-full"
                >
                  {isResetting ? (
                    <>
                      <IconRefresh className="h-4 w-4 mr-2 animate-spin" />
                      Resetting...
                    </>
                  ) : (
                    <>
                      <IconRefresh className="h-4 w-4 mr-2" />
                      Reset Usage via API
                    </>
                  )}
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">Or</span>
                  </div>
                </div>

                <Button
                  onClick={handleDirectReset}
                  variant="outline"
                  size="lg"
                  className="w-full"
                >
                  <IconRefresh className="h-4 w-4 mr-2" />
                  Direct Reset (Instant)
                </Button>
              </div>
            ) : (
              <div className="text-center py-8">
                <IconCheck className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <p className="text-lg font-medium">Usage Reset Successfully!</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Redirecting you to projects...
                </p>
              </div>
            )}
          </div>

          <div className="pt-4 border-t">
            <h3 className="font-medium mb-2">Current Implementation Issues:</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Usage is tracked per browser (localStorage)</li>
              <li>• Not synced across devices</li>
              <li>• Can be cleared by clearing browser data</li>
              <li>• Should be moved to database for production</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 