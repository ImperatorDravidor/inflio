'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { validatePlatformConfig } from '@/lib/social/oauth-config'
import { toast } from 'sonner'

export default function TestOAuthPage() {
  const [loading, setLoading] = useState<string | null>(null)
  const [response, setResponse] = useState<any>(null)

  const testPlatform = async (platform: string) => {
    try {
      setLoading(platform)
      setResponse(null)

      // Check if configured
      if (!validatePlatformConfig(platform)) {
        toast.error(`${platform} is not configured`)
        return
      }

      // Test the connect endpoint
      const res = await fetch('/api/social/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform })
      })

      const data = await res.json()
      setResponse({
        status: res.status,
        ok: res.ok,
        data
      })

      if (res.ok && data.authUrl) {
        toast.success(`OAuth URL generated for ${platform}`)
        
        // Option to open in new window for testing
        if (confirm('Open OAuth URL in new window?')) {
          window.open(data.authUrl, '_blank')
        }
      } else {
        toast.error(`Failed: ${data.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Test error:', error)
      toast.error('Test failed')
      setResponse({ error: error?.toString() })
    } finally {
      setLoading(null)
    }
  }

  const platforms = ['youtube', 'facebook', 'instagram', 'x', 'linkedin']

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>OAuth Connection Test</CardTitle>
          <CardDescription>
            Test OAuth flow for each platform. Check console for detailed logs.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertDescription>
              Make sure you've added <code>NEXT_PUBLIC_APP_URL=http://localhost:3000</code> to your .env.local
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {platforms.map(platform => {
              const isConfigured = validatePlatformConfig(platform)
              return (
                <Button
                  key={platform}
                  variant={isConfigured ? 'default' : 'outline'}
                  onClick={() => testPlatform(platform)}
                  disabled={loading === platform}
                >
                  {loading === platform ? 'Testing...' : `Test ${platform}`}
                  {!isConfigured && ' ❌'}
                </Button>
              )
            })}
          </div>

          {response && (
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="text-sm">Response</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="text-xs overflow-auto">
                  {JSON.stringify(response, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}

          <div className="mt-6 space-y-2 text-sm text-muted-foreground">
            <p>✅ Configured platforms will show the OAuth URL</p>
            <p>❌ Unconfigured platforms will show an error</p>
            <p>Check browser console for detailed debugging info</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 