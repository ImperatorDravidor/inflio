"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  IconSparkles,
  IconPhoto,
  IconUser,
  IconDownload,
  IconTrash,
  IconLoader2,
  IconWand,
  IconPalette,
  IconQuote,
  IconLayoutGrid,
  IconBrandInstagram,
  IconBrandTwitter,
  IconBrandLinkedin,
  IconPlus
} from "@tabler/icons-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { SocialGraphicsGenerator } from "./social-graphics-generator"

interface SimplifiedSocialGraphicsProps {
  project: any
  selectedPersona?: any
  onRefresh: () => void
}

const quickTemplates = [
  {
    id: "quote",
    name: "Quote Card",
    description: "Eye-catching quotes from your content",
    icon: IconQuote,
    color: "from-purple-500 to-pink-500"
  },
  {
    id: "carousel",
    name: "Carousel",
    description: "Multi-slide posts for Instagram",
    icon: IconLayoutGrid,
    color: "from-blue-500 to-cyan-500"
  },
  {
    id: "announcement",
    name: "Announcement",
    description: "Share news and updates",
    icon: IconSparkles,
    color: "from-green-500 to-emerald-500"
  }
]

export function SimplifiedSocialGraphics({ project, selectedPersona, onRefresh }: SimplifiedSocialGraphicsProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const existingImages = project.folders?.images || []

  const handleQuickGenerate = async (templateId: string) => {
    setIsGenerating(true)
    setSelectedTemplate(templateId)
    
    try {
      const response = await fetch('/api/generate-social-graphics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: project.id,
          template: templateId,
          usePersona: !!selectedPersona,
          personaId: selectedPersona?.id
        })
      })

      if (!response.ok) throw new Error('Failed to generate graphics')
      
      const result = await response.json()
      toast.success(`Generated ${result.graphics.length} ${templateId} graphics!`)
      onRefresh()
    } catch (error) {
      toast.error('Failed to generate graphics')
    } finally {
      setIsGenerating(false)
      setSelectedTemplate(null)
    }
  }

  const handleDeleteImage = async (imageId: string) => {
    if (!confirm('Delete this image?')) return
    
    try {
      // Remove from project
      const updatedImages = existingImages.filter((img: any) => img.id !== imageId)
      await fetch(`/api/projects/${project.id}/process`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          folders: {
            ...project.folders,
            images: updatedImages
          }
        })
      })
      
      toast.success('Image deleted')
      onRefresh()
    } catch (error) {
      toast.error('Failed to delete image')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Social Graphics Studio</h2>
          <p className="text-muted-foreground">
            Create beautiful graphics for your social media posts
          </p>
        </div>
        
        {selectedPersona && (
          <Badge variant="secondary" className="gap-1">
            <IconUser className="h-3 w-3" />
            Using: {selectedPersona.name}
          </Badge>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {quickTemplates.map((template) => {
          const Icon = template.icon
          const isGeneratingThis = isGenerating && selectedTemplate === template.id
          
          return (
            <Card
              key={template.id}
              className={cn(
                "relative overflow-hidden cursor-pointer transition-all hover:shadow-lg",
                isGeneratingThis && "ring-2 ring-primary"
              )}
              onClick={() => !isGenerating && handleQuickGenerate(template.id)}
            >
              <div className={cn(
                "absolute inset-0 opacity-10 bg-gradient-to-br",
                template.color
              )} />
              
              <CardHeader className="relative">
                <div className="flex items-center justify-between">
                  <Icon className="h-8 w-8 text-primary" />
                  {isGeneratingThis && (
                    <IconLoader2 className="h-5 w-5 animate-spin" />
                  )}
                </div>
                <CardTitle className="text-lg">{template.name}</CardTitle>
                <CardDescription>{template.description}</CardDescription>
              </CardHeader>
              
              <CardContent className="relative">
                <Button 
                  className="w-full" 
                  variant="secondary"
                  disabled={isGenerating}
                >
                  {isGeneratingThis ? "Generating..." : "Create Now"}
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Advanced Options */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconPalette className="h-5 w-5" />
            Advanced Design Studio
          </CardTitle>
          <CardDescription>
            Create custom graphics with full control
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SocialGraphicsGenerator
            projectId={project.id}
            projectTitle={project.title}
            contentAnalysis={project.content_analysis}
            selectedPersona={selectedPersona}
            onGraphicsGenerated={(graphics) => {
              onRefresh()
              toast.success(`Created ${graphics.length} custom graphics!`)
            }}
          />
        </CardContent>
      </Card>

      {/* Existing Graphics */}
      {existingImages.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4">Your Graphics ({existingImages.length})</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {existingImages.map((image: any) => (
              <Card key={image.id} className="group relative overflow-hidden">
                <div className="aspect-square relative">
                  <img
                    src={image.url}
                    alt={image.prompt || 'Generated image'}
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Overlay on hover */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button
                      size="icon"
                      variant="secondary"
                      onClick={(e) => {
                        e.stopPropagation()
                        window.open(image.url, '_blank')
                      }}
                    >
                      <IconDownload className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="destructive"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteImage(image.id)
                      }}
                    >
                      <IconTrash className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                {image.metadata?.platform && (
                  <div className="absolute top-2 left-2">
                    <Badge variant="secondary" className="text-xs">
                      {image.metadata.platform}
                    </Badge>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
} 