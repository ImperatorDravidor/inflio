"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  IconAlertCircle,
  IconCheck,
  IconChevronDown,
  IconInfoCircle,
  IconX,
  IconRefresh,
  IconSettings
} from "@tabler/icons-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface SystemHealthCardProps {
  showDetails?: boolean
  onConfigure?: () => void
}

export function SystemHealthCard({ 
  showDetails = true,
  onConfigure 
}: SystemHealthCardProps) {
  const [health, setHealth] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    checkHealth()
  }, [])

  const checkHealth = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/env-check')
      if (response.ok) {
        const data = await response.json()
        setHealth(data)
      }
    } catch (error) {
      console.error('Failed to check system health:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">System Health</CardTitle>
            <div className="animate-pulse h-6 w-20 bg-muted rounded" />
          </div>
        </CardHeader>
      </Card>
    )
  }

  if (!health) return null

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-green-600 bg-green-50'
      case 'degraded':
        return 'text-yellow-600 bg-yellow-50'
      case 'error':
        return 'text-red-600 bg-red-50'
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }

  const getFeatureStatus = (enabled: boolean) => {
    return enabled ? (
      <IconCheck className="h-4 w-4 text-green-600" />
    ) : (
      <IconX className="h-4 w-4 text-gray-400" />
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle className="text-lg">System Health</CardTitle>
            <Badge className={cn("gap-1", getStatusColor(health.health.status))}>
              {health.health.status === 'healthy' ? (
                <IconCheck className="h-3 w-3" />
              ) : (
                <IconAlertCircle className="h-3 w-3" />
              )}
              {health.health.status}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={checkHealth}
              className="h-8 w-8 p-0"
            >
              <IconRefresh className="h-4 w-4" />
            </Button>
            {onConfigure && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onConfigure}
                className="gap-2"
              >
                <IconSettings className="h-4 w-4" />
                Configure
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      {showDetails && (
        <CardContent className="space-y-4">
          {/* Health Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Configuration</span>
              <span className="font-medium">{health.health.percentage}%</span>
            </div>
            <Progress value={health.health.percentage} className="h-2" />
          </div>

          {/* Missing Required */}
          {health.required.missing.length > 0 && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3">
              <div className="flex items-start gap-2">
                <IconAlertCircle className="h-4 w-4 text-destructive mt-0.5" />
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium">Missing Required Variables</p>
                  <ul className="text-xs space-y-0.5">
                    {health.required.missing.map((key: string) => (
                      <li key={key} className="font-mono">{key}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Warnings */}
          {health.warnings.length > 0 && (
            <div className="rounded-lg border border-yellow-500/50 bg-yellow-50 dark:bg-yellow-900/10 p-3">
              <div className="flex items-start gap-2">
                <IconInfoCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-500 mt-0.5" />
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium">Recommended Variables</p>
                  <p className="text-xs text-muted-foreground">
                    Some features may be limited without these:
                  </p>
                  <ul className="text-xs space-y-0.5">
                    {health.warnings.map((key: string) => (
                      <li key={key} className="font-mono">{key}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Features */}
          <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            <CollapsibleTrigger className="flex items-center justify-between w-full text-sm font-medium hover:text-primary transition-colors">
              <span>Feature Status</span>
              <IconChevronDown className={cn(
                "h-4 w-4 transition-transform",
                isOpen && "rotate-180"
              )} />
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-3">
              <div className="space-y-3">
                {/* Core Features */}
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">Core</p>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span>Database (Supabase)</span>
                      {getFeatureStatus(health.features.core.supabase)}
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Authentication (Clerk)</span>
                      {getFeatureStatus(health.features.core.clerk)}
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>App URL</span>
                      {getFeatureStatus(health.features.core.appUrl)}
                    </div>
                  </div>
                </div>

                {/* AI Features */}
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">AI Services</p>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span>OpenAI (GPT-4)</span>
                      {getFeatureStatus(health.features.ai.openai)}
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Google Gemini</span>
                      {getFeatureStatus(health.features.ai.gemini)}
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>AssemblyAI (Transcription)</span>
                      {getFeatureStatus(health.features.ai.assemblyai)}
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>FAL AI (Images)</span>
                      {getFeatureStatus(health.features.ai.fal)}
                    </div>
                  </div>
                </div>

                {/* Social Auth */}
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">Social Integrations</p>
                  <div className="space-y-1">
                    {Object.entries(health.features.socialAuth).map(([platform, enabled]) => (
                      <div key={platform} className="flex items-center justify-between text-sm">
                        <span className="capitalize">{platform}</span>
                        {getFeatureStatus(enabled as boolean)}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Video Processing */}
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">Video Processing</p>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span>Klap AI (Clips)</span>
                      {getFeatureStatus(health.features.video.klap)}
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Transcription</span>
                      {getFeatureStatus(health.features.video.transcription)}
                    </div>
                  </div>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      )}
    </Card>
  )
} 