"use client"

import { useState } from 'react'
import { Check, Link2, AlertCircle, ExternalLink, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { motion } from 'framer-motion'

interface Platform {
  id: string
  name: string
  icon: string
  color: string
  placeholder: string
  helpText: string
  category: 'primary' | 'secondary' | 'other'
  features: string[]
}

const PLATFORMS: Platform[] = [
  {
    id: 'youtube',
    name: 'YouTube',
    icon: '▶️',
    color: '#FF0000',
    placeholder: '@channelname or channel URL',
    helpText: 'Your YouTube channel handle or URL',
    category: 'primary',
    features: ['Long-form videos', 'Shorts', 'Community posts', 'Thumbnails']
  },
  {
    id: 'instagram',
    name: 'Instagram',
    icon: '📷',
    color: '#E4405F',
    placeholder: '@username',
    helpText: 'Your Instagram username',
    category: 'primary',
    features: ['Feed posts', 'Reels', 'Stories', 'Carousels']
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    icon: '🎵',
    color: '#000000',
    placeholder: '@username',
    helpText: 'Your TikTok username',
    category: 'primary',
    features: ['Short videos', 'Trending sounds', 'Effects']
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    icon: '💼',
    color: '#0A66C2',
    placeholder: 'linkedin.com/in/yourprofile',
    helpText: 'Your LinkedIn profile URL',
    category: 'primary',
    features: ['Articles', 'Posts', 'Professional content']
  },
  {
    id: 'x',
    name: 'X (Twitter)',
    icon: '𝕏',
    color: '#000000',
    placeholder: '@handle',
    helpText: 'Your X/Twitter handle',
    category: 'primary',
    features: ['Tweets', 'Threads', 'Spaces']
  },
  {
    id: 'facebook',
    name: 'Facebook',
    icon: '👥',
    color: '#1877F2',
    placeholder: 'facebook.com/yourpage',
    helpText: 'Your Facebook page URL',
    category: 'secondary',
    features: ['Posts', 'Reels', 'Stories', 'Events']
  },
  {
    id: 'threads',
    name: 'Threads',
    icon: '🧵',
    color: '#000000',
    placeholder: '@username',
    helpText: 'Your Threads username',
    category: 'secondary',
    features: ['Text posts', 'Conversations']
  },
  {
    id: 'pinterest',
    name: 'Pinterest',
    icon: '📌',
    color: '#E60023',
    placeholder: 'pinterest.com/username',
    helpText: 'Your Pinterest profile URL',
    category: 'other',
    features: ['Pins', 'Boards', 'Ideas']
  },
  {
    id: 'reddit',
    name: 'Reddit',
    icon: '🤖',
    color: '#FF4500',
    placeholder: 'u/username',
    helpText: 'Your Reddit username',
    category: 'other',
    features: ['Posts', 'Communities', 'Discussions']
  }
]

interface PlatformConnectionStepProps {
  platforms: Record<string, { handle: string; connected: boolean }>
  onPlatformsChange: (platforms: Record<string, { handle: string; connected: boolean }>) => void
  googleDriveUrl?: string
  dropboxUrl?: string
  onStorageChange?: (storage: { googleDrive: string; dropbox: string }) => void
}

export function PlatformConnectionStep({
  platforms,
  onPlatformsChange,
  googleDriveUrl = '',
  dropboxUrl = '',
  onStorageChange
}: PlatformConnectionStepProps) {
  const [activeTab, setActiveTab] = useState('primary')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [storage, setStorage] = useState({
    googleDrive: googleDriveUrl,
    dropbox: dropboxUrl
  })

  const handlePlatformChange = (platformId: string, handle: string) => {
    onPlatformsChange({
      ...platforms,
      [platformId]: {
        ...platforms[platformId],
        handle
      }
    })
  }

  const handleConnect = (platformId: string) => {
    // In production, this would trigger OAuth flow
    toast.info(`OAuth connection for ${platformId} will be available after onboarding`)
    onPlatformsChange({
      ...platforms,
      [platformId]: {
        ...platforms[platformId],
        connected: false // Will be true after OAuth
      }
    })
  }

  const handleStorageUpdate = (type: 'googleDrive' | 'dropbox', value: string) => {
    const updated = { ...storage, [type]: value }
    setStorage(updated)
    if (onStorageChange) {
      onStorageChange(updated)
    }
  }

  const connectedCount = Object.values(platforms).filter(p => p.handle).length
  const primaryPlatforms = PLATFORMS.filter(p => p.category === 'primary')
  const secondaryPlatforms = PLATFORMS.filter(p => p.category === 'secondary')
  const otherPlatforms = PLATFORMS.filter(p => p.category === 'other')

  const renderPlatformCard = (platform: Platform) => {
    const current = platforms[platform.id] || { handle: '', connected: false }
    const hasHandle = !!current.handle
    
    return (
      <motion.div
        key={platform.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className={`p-4 ${hasHandle ? 'border-primary/50 bg-primary/5' : ''}`}>
          <div className="space-y-3">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div 
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-xl"
                  style={{ backgroundColor: platform.color }}
                >
                  {platform.icon}
                </div>
                <div>
                  <h4 className="font-medium">{platform.name}</h4>
                  <p className="text-xs text-muted-foreground">{platform.helpText}</p>
                </div>
              </div>
              {hasHandle && (
                <Badge variant="outline" className="gap-1">
                  <Check className="h-3 w-3" />
                  Added
                </Badge>
              )}
            </div>
            
            {/* Input */}
            <div className="flex gap-2">
              <Input
                placeholder={platform.placeholder}
                value={current.handle}
                onChange={(e) => handlePlatformChange(platform.id, e.target.value)}
                className="flex-1"
              />
              {hasHandle && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleConnect(platform.id)}
                  disabled
                  title="OAuth connection available after onboarding"
                >
                  <Lock className="h-3 w-3 mr-1" />
                  Connect
                </Button>
              )}
            </div>
            
            {/* Features */}
            {hasHandle && (
              <div className="flex flex-wrap gap-1">
                {platform.features.map((feature) => (
                  <Badge key={feature} variant="secondary" className="text-xs">
                    {feature}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </Card>
      </motion.div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Instructions */}
      <Alert>
        <Link2 className="h-4 w-4" />
        <AlertDescription>
          <strong>Add your social handles now.</strong> After onboarding, you'll connect via OAuth for publishing.
          <br />
          <span className="text-xs mt-1 block">
            We'll use these to customize your content for each platform's best practices.
          </span>
        </AlertDescription>
      </Alert>

      {/* Progress */}
      <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
        <div>
          <p className="font-medium">{connectedCount} platform{connectedCount !== 1 ? 's' : ''} added</p>
          <p className="text-sm text-muted-foreground">
            {connectedCount === 0 ? 'Add at least one platform to continue' : 
             connectedCount < 3 ? 'Add more platforms for better reach' :
             'Great platform coverage!'}
          </p>
        </div>
        <div className="flex gap-2">
          {connectedCount >= 5 && <Badge variant="default">Multi-platform</Badge>}
          {connectedCount >= 8 && <Badge variant="default">Power User</Badge>}
        </div>
      </div>

      {/* Platform Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="primary">
            Primary
            {Object.values(platforms).filter(p => p.handle && primaryPlatforms.find(pl => pl.id === Object.keys(platforms).find(k => platforms[k] === p))).length > 0 && (
              <Badge variant="secondary" className="ml-2 h-5 px-1">
                {Object.values(platforms).filter(p => p.handle && primaryPlatforms.find(pl => pl.id === Object.keys(platforms).find(k => platforms[k] === p))).length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="secondary">
            Secondary
            {Object.values(platforms).filter(p => p.handle && secondaryPlatforms.find(pl => pl.id === Object.keys(platforms).find(k => platforms[k] === p))).length > 0 && (
              <Badge variant="secondary" className="ml-2 h-5 px-1">
                {Object.values(platforms).filter(p => p.handle && secondaryPlatforms.find(pl => pl.id === Object.keys(platforms).find(k => platforms[k] === p))).length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="other">
            Other
            {Object.values(platforms).filter(p => p.handle && otherPlatforms.find(pl => pl.id === Object.keys(platforms).find(k => platforms[k] === p))).length > 0 && (
              <Badge variant="secondary" className="ml-2 h-5 px-1">
                {Object.values(platforms).filter(p => p.handle && otherPlatforms.find(pl => pl.id === Object.keys(platforms).find(k => platforms[k] === p))).length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="primary" className="space-y-3 mt-4">
          {primaryPlatforms.map(renderPlatformCard)}
        </TabsContent>
        
        <TabsContent value="secondary" className="space-y-3 mt-4">
          {secondaryPlatforms.map(renderPlatformCard)}
        </TabsContent>
        
        <TabsContent value="other" className="space-y-3 mt-4">
          {otherPlatforms.map(renderPlatformCard)}
        </TabsContent>
      </Tabs>

      {/* Advanced Options */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="font-medium">File Storage (Optional)</h4>
            <p className="text-sm text-muted-foreground">Connect cloud storage for content import</p>
          </div>
          <Switch
            checked={showAdvanced}
            onCheckedChange={setShowAdvanced}
          />
        </div>
        
        {showAdvanced && (
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium mb-1 block">Google Drive</label>
              <div className="flex gap-2">
                <Input
                  placeholder="https://drive.google.com/drive/folders/..."
                  value={storage.googleDrive}
                  onChange={(e) => handleStorageUpdate('googleDrive', e.target.value)}
                />
                <Button size="sm" variant="outline" disabled>
                  <ExternalLink className="h-3 w-3" />
                </Button>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Dropbox</label>
              <div className="flex gap-2">
                <Input
                  placeholder="https://www.dropbox.com/..."
                  value={storage.dropbox}
                  onChange={(e) => handleStorageUpdate('dropbox', e.target.value)}
                />
                <Button size="sm" variant="outline" disabled>
                  <ExternalLink className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Tips */}
      {connectedCount > 0 && (
        <Alert className="border-blue-200 bg-blue-50">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-900">
            <strong>Pro tip:</strong> Inflio will optimize content for each platform automatically - from YouTube long-form to TikTok clips, Instagram carousels to LinkedIn articles.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}