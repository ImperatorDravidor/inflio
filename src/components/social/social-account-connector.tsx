'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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

  const loadIntegrations = useCallback(async () => {
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
  }, [])

  useEffect(() => {
    loadIntegrations()
    
    const urlParams = new URLSearchParams(window.location.search)
    const connected = urlParams.get('connected')
    const error = urlParams.get('error')
    
    if (connected) {
      window.history.replaceState({}, '', window.location.pathname)
      toast.success(`Successfully connected ${connected}!`)
      sessionStorage.removeItem('connecting_platform')
      loadIntegrations()
      onConnectionChange?.()
    }
    
    if (error) {
      window.history.replaceState({}, '', window.location.pathname)
      toast.error(error)
    }
  }, [loadIntegrations, onConnectionChange])

  const connectPlatform = async (platform: string) => {
    try {
      setConnecting(platform)
      
      const existing = integrations.find(i => i.platform === platform && !i.disabled)
      if (existing) {
        toast.info(`${platform} is already connected.`)
        setConnecting(null)
        return
      }

      const response = await fetch('/api/social/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform })
      })

      if (!response.ok) {
        const errorData = await response.json()
        const errorMessage = errorData.error || 'Failed to initiate connection'
        
        toast.error(`Connection Error: ${errorMessage}`)
        
        if (errorMessage.includes('not configured')) {
          console.error(`OAuth for ${platform} is not configured on the server. Please check your environment variables.`)
        }

        setConnecting(null)
        return
      }

      const { authUrl } = await response.json()
      sessionStorage.setItem('connecting_platform', platform)
      window.location.href = authUrl

    } catch (error) {
      console.error('Connection error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to connect account')
      setConnecting(null)
    }
  }

  const disconnectPlatform = async (integrationId: string, platform: string) => {
    try {
      if (!confirm(`Are you sure you want to disconnect your ${platform} account?`)) return

      const supabase = createSupabaseBrowserClient()
      const { error } = await supabase
        .from('social_integrations')
        .update({ disabled: true, updated_at: new Date().toISOString() })
        .eq('id', integrationId)

      if (error) throw error

      toast.success(`${platform} account disconnected.`)
      await loadIntegrations()
      onConnectionChange?.()
    } catch (error) {
      console.error('Disconnect error:', error)
      toast.error('Failed to disconnect account.')
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {platforms.map(platform => {
          const config = PLATFORM_CONFIGS[platform as keyof typeof PLATFORM_CONFIGS]
          const Icon = platformIcons[platform as keyof typeof platformIcons]
          const integration = integrations.find(i => i.platform === platform && !i.disabled)
          const status = integration ? getIntegrationStatus(integration) : 'disconnected'
          
          return (
            <Card key={platform} className="relative overflow-hidden transition-all">
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
                  {!integration ? (
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
                  ) : status === 'connected' ? (
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
                  ) : (
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

      {integrations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Connected Accounts Summary</CardTitle>
            <CardDescription>
              You have {integrations.filter(i => !i.disabled).length} active connections.
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