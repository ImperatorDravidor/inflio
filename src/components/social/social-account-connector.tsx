'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { toast } from 'sonner'
import { 
  IconBrandInstagram,
  IconBrandFacebook,
  IconBrandX,
  IconBrandLinkedin,
  IconBrandYoutube,
  IconBrandTiktok,
  IconBrandThreads,
  IconCheck,
  IconAlertCircle,
  IconRefresh,
  IconPlus,
  IconExternalLink,
  IconTrash
} from '@tabler/icons-react'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import { PLATFORM_CONFIGS } from '@/lib/social/oauth-config'
import { cn } from '@/lib/utils'

interface SocialIntegration {
  id: string
  platform: string
  name: string
  picture?: string
  internal_id: string
  provider_identifier: string
  token_expiration?: string
  refresh_needed: boolean
  disabled: boolean
  created_at: string
}

const platformIcons = {
  instagram: IconBrandInstagram,
  facebook: IconBrandFacebook,
  x: IconBrandX,
  linkedin: IconBrandLinkedin,
  youtube: IconBrandYoutube,
  tiktok: IconBrandTiktok,
  threads: IconBrandThreads
}

interface SocialAccountConnectorProps {
  onConnectionChange?: () => void
}

export function SocialAccountConnector({ onConnectionChange }: SocialAccountConnectorProps) {
  const [integrations, setIntegrations] = useState<SocialIntegration[]>([])
  const [loading, setLoading] = useState(true)
  const [connecting, setConnecting] = useState<string | null>(null)

  useEffect(() => {
    loadIntegrations()
  }, [])

  const loadIntegrations = async () => {
    try {
      const supabase = createSupabaseBrowserClient()
      const { data, error } = await supabase
        .from('social_integrations')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setIntegrations(data || [])
    } catch (error) {
      console.error('Failed to load integrations:', error)
      toast.error('Failed to load connected accounts')
    } finally {
      setLoading(false)
    }
  }

  const connectPlatform = async (platform: string) => {
    try {
      setConnecting(platform)
      
      // Check if platform is already connected
      const existing = integrations.find(i => i.platform === platform && !i.disabled)
      if (existing) {
        toast.info(`${platform} is already connected`)
        return
      }

      // Initiate OAuth flow
      const response = await fetch('/api/social/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to initiate connection')
      }

      const { authUrl } = await response.json()
      
      // Open OAuth popup
      const width = 600
      const height = 700
      const left = window.innerWidth / 2 - width / 2
      const top = window.innerHeight / 2 - height / 2
      
      const popup = window.open(
        authUrl,
        `Connect ${platform}`,
        `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no`
      )

      // Check for popup close
      const checkInterval = setInterval(() => {
        if (popup?.closed) {
          clearInterval(checkInterval)
          setConnecting(null)
          // Reload integrations after a delay
          setTimeout(() => {
            loadIntegrations()
            onConnectionChange?.()
          }, 1000)
        }
      }, 500)

    } catch (error) {
      console.error('Connection error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to connect account')
    } finally {
      setConnecting(null)
    }
  }

  const disconnectPlatform = async (integrationId: string, platform: string) => {
    try {
      const confirmed = confirm(`Are you sure you want to disconnect your ${platform} account?`)
      if (!confirmed) return

      const supabase = createSupabaseBrowserClient()
      const { error } = await supabase
        .from('social_integrations')
        .update({ 
          disabled: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', integrationId)

      if (error) throw error

      toast.success(`${platform} account disconnected`)
      await loadIntegrations()
      onConnectionChange?.()
    } catch (error) {
      console.error('Disconnect error:', error)
      toast.error('Failed to disconnect account')
    }
  }

  const getIntegrationStatus = (integration: SocialIntegration) => {
    if (integration.disabled) return 'disconnected'
    if (integration.refresh_needed) return 'refresh_needed'
    if (integration.token_expiration) {
      const expiry = new Date(integration.token_expiration)
      if (expiry <= new Date()) return 'expired'
    }
    return 'connected'
  }

  const platforms = Object.keys(PLATFORM_CONFIGS)

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map(i => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-12 w-12 bg-muted rounded-lg mb-4" />
              <div className="h-4 w-24 bg-muted rounded mb-2" />
              <div className="h-3 w-32 bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Warning for missing OAuth credentials */}
      <Alert>
        <IconAlertCircle className="h-4 w-4" />
        <AlertDescription>
          To connect social accounts, you need to set up OAuth credentials for each platform.
          Check the environment variables documentation for setup instructions.
        </AlertDescription>
      </Alert>

      {/* Platform Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {platforms.map(platform => {
          const config = PLATFORM_CONFIGS[platform]
          const Icon = platformIcons[platform as keyof typeof platformIcons]
          const integration = integrations.find(i => i.platform === platform && !i.disabled)
          const status = integration ? getIntegrationStatus(integration) : 'disconnected'
          
          return (
            <Card key={platform} className="relative overflow-hidden">
              <div 
                className="absolute inset-0 opacity-5"
                style={{ backgroundColor: config.color }}
              />
              
              <CardHeader className="relative">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div 
                      className="p-2 rounded-lg"
                      style={{ backgroundColor: `${config.color}20` }}
                    >
                      <Icon 
                        className="h-6 w-6" 
                        style={{ color: config.color }}
                      />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{config.name}</CardTitle>
                      <CardDescription className="text-xs">
                        {integration ? `@${integration.provider_identifier}` : 'Not connected'}
                      </CardDescription>
                    </div>
                  </div>
                  
                  {status === 'connected' && (
                    <Badge variant="outline" className="text-xs">
                      <IconCheck className="h-3 w-3 mr-1" />
                      Connected
                    </Badge>
                  )}
                  
                  {status === 'expired' && (
                    <Badge variant="destructive" className="text-xs">
                      Token Expired
                    </Badge>
                  )}
                  
                  {status === 'refresh_needed' && (
                    <Badge variant="secondary" className="text-xs">
                      Refresh Needed
                    </Badge>
                  )}
                </div>
              </CardHeader>
              
              <CardContent className="relative space-y-4">
                {integration && (
                  <div className="flex items-center gap-3 pb-3 border-b">
                    {integration.picture && (
                      <img 
                        src={integration.picture} 
                        alt={integration.name}
                        className="h-10 w-10 rounded-full"
                      />
                    )}
                    <div className="flex-1">
                      <p className="font-medium text-sm">{integration.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Connected {new Date(integration.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                )}
                
                <div className="flex gap-2">
                  {!integration && (
                    <Button
                      size="sm"
                      className="w-full"
                      onClick={() => connectPlatform(platform)}
                      disabled={connecting === platform}
                    >
                      {connecting === platform ? (
                        <>
                          <IconRefresh className="h-4 w-4 mr-2 animate-spin" />
                          Connecting...
                        </>
                      ) : (
                        <>
                          <IconPlus className="h-4 w-4 mr-2" />
                          Connect Account
                        </>
                      )}
                    </Button>
                  )}
                  
                  {integration && status === 'connected' && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        asChild
                      >
                        <a 
                          href={`https://${platform}.com/${integration.provider_identifier}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <IconExternalLink className="h-4 w-4 mr-2" />
                          View Profile
                        </a>
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => disconnectPlatform(integration.id, platform)}
                      >
                        <IconTrash className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                  
                  {integration && (status === 'expired' || status === 'refresh_needed') && (
                    <Button
                      size="sm"
                      variant="default"
                      className="w-full"
                      onClick={() => connectPlatform(platform)}
                    >
                      <IconRefresh className="h-4 w-4 mr-2" />
                      Reconnect Account
                    </Button>
                  )}
                </div>
                
                {/* Platform-specific info */}
                <div className="text-xs text-muted-foreground">
                  <p>Supports:</p>
                  <ul className="mt-1 space-y-0.5">
                    {config.limits.images > 0 && (
                      <li>• Images (up to {config.limits.images})</li>
                    )}
                    {config.limits.videos > 0 && (
                      <li>• Videos (up to {config.limits.videoDuration}s)</li>
                    )}
                    <li>• {config.limits.text.toLocaleString()} characters</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Connected Accounts Summary */}
      {integrations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Connected Accounts Summary</CardTitle>
            <CardDescription>
              You have {integrations.filter(i => !i.disabled).length} active connections
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {integrations.filter(i => !i.disabled).map(integration => {
                const Icon = platformIcons[integration.platform as keyof typeof platformIcons]
                return (
                  <div 
                    key={integration.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="h-4 w-4" />
                      <span className="text-sm font-medium">{integration.name}</span>
                      <span className="text-xs text-muted-foreground">
                        @{integration.provider_identifier}
                      </span>
                    </div>
                    <Badge 
                      variant={getIntegrationStatus(integration) === 'connected' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {getIntegrationStatus(integration).replace('_', ' ')}
                    </Badge>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 