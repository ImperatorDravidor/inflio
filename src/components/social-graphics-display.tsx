"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  IconBrandInstagram,
  IconBrandTwitter,
  IconBrandLinkedin,
  IconBrandFacebook,
  IconBrandYoutube,
  IconBrandTiktok,
  IconDownload,
  IconCopy,
  IconExternalLink,
  IconDotsVertical,
  IconTrash,
  IconEdit,
  IconShare,
  IconCalendar
} from "@tabler/icons-react"
import { toast } from "sonner"
import { createSupabaseBrowserClient } from "@/lib/supabase/client"
import { PLATFORM_SPECS } from "@/lib/social-graphics-config"
import { motion } from "framer-motion"

interface SocialGraphic {
  id: string
  platform: string
  size: string
  template: string
  url: string
  prompt: string
  metadata?: any
  created_at: string
}

interface SocialGraphicsDisplayProps {
  projectId: string
  onSchedule?: (graphic: SocialGraphic) => void
  onEdit?: (graphic: SocialGraphic) => void
}

const platformIcons = {
  instagram: IconBrandInstagram,
  twitter: IconBrandTwitter,
  linkedin: IconBrandLinkedin,
  facebook: IconBrandFacebook,
  youtube: IconBrandYoutube,
  tiktok: IconBrandTiktok
}

export function SocialGraphicsDisplay({ 
  projectId,
  onSchedule,
  onEdit
}: SocialGraphicsDisplayProps) {
  const [graphics, setGraphics] = useState<SocialGraphic[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPlatform, setSelectedPlatform] = useState<string>("all")
  const supabase = createSupabaseBrowserClient()

  // Load graphics from database
  useEffect(() => {
    loadGraphics()
  }, [projectId])

  const loadGraphics = async () => {
    try {
      const { data, error } = await supabase
        .from('social_graphics')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setGraphics(data || [])
    } catch (error) {
      console.error('Failed to load graphics:', error)
      toast.error('Failed to load social graphics')
    } finally {
      setLoading(false)
    }
  }

  // Filter graphics by platform
  const filteredGraphics = selectedPlatform === "all" 
    ? graphics 
    : graphics.filter(g => g.platform === selectedPlatform)

  // Group graphics by platform
  const graphicsByPlatform = graphics.reduce((acc, graphic) => {
    if (!acc[graphic.platform]) acc[graphic.platform] = []
    acc[graphic.platform].push(graphic)
    return acc
  }, {} as Record<string, SocialGraphic[]>)

  // Download graphic
  const downloadGraphic = async (graphic: SocialGraphic) => {
    const link = document.createElement('a')
    link.href = graphic.url
    const spec = PLATFORM_SPECS[graphic.platform]
    const size = spec?.sizes[graphic.size]
    link.download = `${graphic.platform}-${size?.displayName || graphic.size}-${graphic.id}.png`
    link.click()
    toast.success('Download started')
  }

  // Copy URL
  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url)
    toast.success('URL copied to clipboard')
  }

  // Delete graphic
  const deleteGraphic = async (id: string) => {
    try {
      const { error } = await supabase
        .from('social_graphics')
        .delete()
        .eq('id', id)

      if (error) throw error
      
      setGraphics(graphics.filter(g => g.id !== id))
      toast.success('Graphic deleted')
    } catch (error) {
      console.error('Failed to delete graphic:', error)
      toast.error('Failed to delete graphic')
    }
  }

  // Get platform count
  const platformCounts = Object.entries(graphicsByPlatform).map(([platform, items]) => ({
    platform,
    count: items.length
  }))

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
          <p className="mt-2 text-sm text-muted-foreground">Loading graphics...</p>
        </div>
      </div>
    )
  }

  if (graphics.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No social graphics generated yet</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Platform Filter Tabs */}
      <Tabs value={selectedPlatform} onValueChange={setSelectedPlatform}>
        <TabsList className="grid grid-cols-7 w-full">
          <TabsTrigger value="all" className="gap-1">
            All
            <Badge variant="secondary" className="ml-1 h-5 px-1">
              {graphics.length}
            </Badge>
          </TabsTrigger>
          {platformCounts.map(({ platform, count }) => {
            const Icon = platformIcons[platform as keyof typeof platformIcons]
            return (
              <TabsTrigger key={platform} value={platform} className="gap-1">
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{PLATFORM_SPECS[platform]?.name}</span>
                <Badge variant="secondary" className="ml-1 h-5 px-1">
                  {count}
                </Badge>
              </TabsTrigger>
            )
          })}
        </TabsList>

        <TabsContent value={selectedPlatform} className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredGraphics.map((graphic) => {
              const spec = PLATFORM_SPECS[graphic.platform]
              const size = spec?.sizes[graphic.size]
              const Icon = platformIcons[graphic.platform as keyof typeof platformIcons]
              
              return (
                <motion.div
                  key={graphic.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="overflow-hidden group hover:shadow-lg transition-shadow">
                    {/* Image Preview */}
                    <div className="aspect-square relative bg-muted">
                      <img
                        src={graphic.url}
                        alt={`${graphic.platform} graphic`}
                        className="w-full h-full object-contain"
                      />
                      
                      {/* Platform Badge */}
                      <div className="absolute top-2 left-2">
                        <Badge className="gap-1">
                          <Icon className="h-3 w-3" />
                          {spec?.name}
                        </Badge>
                      </div>
                      
                      {/* Quick Actions (visible on hover) */}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          className="gap-1"
                          onClick={() => downloadGraphic(graphic)}
                        >
                          <IconDownload className="h-4 w-4" />
                          Download
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          className="gap-1"
                          onClick={() => window.open(graphic.url, '_blank')}
                        >
                          <IconExternalLink className="h-4 w-4" />
                          View
                        </Button>
                      </div>
                    </div>

                    {/* Details */}
                    <CardContent className="p-4 space-y-3">
                      <div>
                        <p className="font-medium">{size?.displayName || graphic.size}</p>
                        <p className="text-sm text-muted-foreground">
                          {size?.width}×{size?.height} • {graphic.template}
                        </p>
                      </div>

                      {/* Metadata */}
                      {graphic.metadata && (
                        <div className="flex flex-wrap gap-1">
                          {graphic.metadata.hasPersona && (
                            <Badge variant="outline" className="text-xs">
                              Persona
                            </Badge>
                          )}
                          {graphic.metadata.needsTransparency && (
                            <Badge variant="outline" className="text-xs">
                              Transparent
                            </Badge>
                          )}
                          {graphic.metadata.quality && (
                            <Badge variant="outline" className="text-xs">
                              {graphic.metadata.quality}
                            </Badge>
                          )}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="flex-1"
                          onClick={() => copyUrl(graphic.url)}
                        >
                          <IconCopy className="h-4 w-4" />
                        </Button>
                        {onSchedule && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="flex-1"
                            onClick={() => onSchedule(graphic)}
                          >
                            <IconCalendar className="h-4 w-4" />
                          </Button>
                        )}
                        {onEdit && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="flex-1"
                            onClick={() => onEdit(graphic)}
                          >
                            <IconEdit className="h-4 w-4" />
                          </Button>
                        )}
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="sm" variant="ghost">
                              <IconDotsVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => downloadGraphic(graphic)}>
                              <IconDownload className="h-4 w-4 mr-2" />
                              Download
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => window.open(graphic.url, '_blank')}>
                              <IconExternalLink className="h-4 w-4 mr-2" />
                              Open in New Tab
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => copyUrl(graphic.url)}>
                              <IconCopy className="h-4 w-4 mr-2" />
                              Copy URL
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => deleteGraphic(graphic.id)}
                              className="text-destructive"
                            >
                              <IconTrash className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      {/* Created Date */}
                      <p className="text-xs text-muted-foreground">
                        {new Date(graphic.created_at).toLocaleDateString()}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
} 