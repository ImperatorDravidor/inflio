"use client"

import { useState } from 'react'
import { Paintbrush, Palette, Type, Hash, Plus, X, Sparkles, Link, Upload } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

const BRAND_VOICES = [
  'Professional', 'Casual', 'Friendly', 'Playful', 
  'Inspirational', 'Educational', 'Witty', 'Bold', 
  'Empathetic', 'Authoritative', 'Conversational'
]

const FONT_PAIRS = [
  { heading: 'Inter', body: 'Inter', style: 'Modern & Clean' },
  { heading: 'Playfair Display', body: 'Source Sans Pro', style: 'Elegant & Professional' },
  { heading: 'Montserrat', body: 'Open Sans', style: 'Bold & Friendly' },
  { heading: 'Raleway', body: 'Lato', style: 'Minimal & Sophisticated' },
  { heading: 'Poppins', body: 'Roboto', style: 'Playful & Approachable' },
  { heading: 'Bebas Neue', body: 'Montserrat', style: 'Bold & Impactful' }
]

const COLOR_PALETTES = [
  {
    name: 'Vibrant',
    primary: '#6366F1',
    secondary: '#EC4899',
    accent: '#10B981'
  },
  {
    name: 'Professional',
    primary: '#1E40AF',
    secondary: '#64748B',
    accent: '#0891B2'
  },
  {
    name: 'Warm',
    primary: '#DC2626',
    secondary: '#F59E0B',
    accent: '#FB923C'
  },
  {
    name: 'Nature',
    primary: '#059669',
    secondary: '#84CC16',
    accent: '#14B8A6'
  },
  {
    name: 'Luxury',
    primary: '#7C3AED',
    secondary: '#BE185D',
    accent: '#B91C1C'
  },
  {
    name: 'Minimal',
    primary: '#18181B',
    secondary: '#71717A',
    accent: '#3B82F6'
  }
]

interface BrandIdentityStepProps {
  data: any
  onChange: (updates: any) => void
}

export function BrandIdentityStep({ data, onChange }: BrandIdentityStepProps) {
  const [currentCompetitor, setCurrentCompetitor] = useState('')
  const [currentInspiration, setCurrentInspiration] = useState('')
  const [selectedPalette, setSelectedPalette] = useState<string | null>(null)
  
  const competitors = data.competitors || []
  const inspirationLinks = data.inspirationLinks || []
  const brandColors = data.brandColors || { primary: '#6366F1', secondary: '#EC4899', accent: '#10B981' }
  const fonts = data.fonts || { heading: 'Inter', body: 'Inter' }

  const addCompetitor = (competitor: string) => {
    if (competitor && !competitors.includes(competitor)) {
      onChange({ competitors: [...competitors, competitor] })
      setCurrentCompetitor('')
    }
  }

  const addInspiration = (link: string) => {
    if (link && !inspirationLinks.includes(link)) {
      onChange({ inspirationLinks: [...inspirationLinks, link] })
      setCurrentInspiration('')
    }
  }

  const applyPalette = (palette: typeof COLOR_PALETTES[0]) => {
    setSelectedPalette(palette.name)
    onChange({ 
      brandColors: {
        primary: palette.primary,
        secondary: palette.secondary,
        accent: palette.accent
      }
    })
  }

  const applyFontPair = (pair: typeof FONT_PAIRS[0]) => {
    onChange({
      fonts: {
        heading: pair.heading,
        body: pair.body
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Brand Colors */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Palette className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Brand Colors</h3>
        </div>
        
        <Tabs defaultValue="custom" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="presets">Color Palettes</TabsTrigger>
            <TabsTrigger value="custom">Custom Colors</TabsTrigger>
          </TabsList>
          
          <TabsContent value="presets" className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {COLOR_PALETTES.map((palette) => (
                <motion.button
                  key={palette.name}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => applyPalette(palette)}
                  className={cn(
                    "p-4 rounded-lg border-2 transition-all",
                    selectedPalette === palette.name 
                      ? "border-primary shadow-lg" 
                      : "border-muted hover:border-primary/50"
                  )}
                >
                  <div className="flex gap-2 mb-2">
                    <div 
                      className="w-8 h-8 rounded-full shadow-sm"
                      style={{ backgroundColor: palette.primary }}
                    />
                    <div 
                      className="w-8 h-8 rounded-full shadow-sm"
                      style={{ backgroundColor: palette.secondary }}
                    />
                    <div 
                      className="w-8 h-8 rounded-full shadow-sm"
                      style={{ backgroundColor: palette.accent }}
                    />
                  </div>
                  <p className="text-sm font-medium">{palette.name}</p>
                </motion.button>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="custom" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="primaryColor">Primary Color</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      id="primaryColor"
                      type="color"
                      value={brandColors.primary}
                      onChange={(e) => onChange({
                        brandColors: { ...brandColors, primary: e.target.value }
                      })}
                      className="h-12 cursor-pointer"
                    />
                    <div 
                      className="absolute inset-0 rounded-md pointer-events-none"
                      style={{ 
                        background: `linear-gradient(45deg, ${brandColors.primary}22, ${brandColors.primary}44)`
                      }}
                    />
                  </div>
                  <Input
                    value={brandColors.primary}
                    onChange={(e) => onChange({
                      brandColors: { ...brandColors, primary: e.target.value }
                    })}
                    placeholder="#000000"
                    className="w-28"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="secondaryColor">Secondary Color</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      id="secondaryColor"
                      type="color"
                      value={brandColors.secondary}
                      onChange={(e) => onChange({
                        brandColors: { ...brandColors, secondary: e.target.value }
                      })}
                      className="h-12 cursor-pointer"
                    />
                    <div 
                      className="absolute inset-0 rounded-md pointer-events-none"
                      style={{ 
                        background: `linear-gradient(45deg, ${brandColors.secondary}22, ${brandColors.secondary}44)`
                      }}
                    />
                  </div>
                  <Input
                    value={brandColors.secondary}
                    onChange={(e) => onChange({
                      brandColors: { ...brandColors, secondary: e.target.value }
                    })}
                    placeholder="#000000"
                    className="w-28"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="accentColor">Accent Color</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      id="accentColor"
                      type="color"
                      value={brandColors.accent}
                      onChange={(e) => onChange({
                        brandColors: { ...brandColors, accent: e.target.value }
                      })}
                      className="h-12 cursor-pointer"
                    />
                    <div 
                      className="absolute inset-0 rounded-md pointer-events-none"
                      style={{ 
                        background: `linear-gradient(45deg, ${brandColors.accent}22, ${brandColors.accent}44)`
                      }}
                    />
                  </div>
                  <Input
                    value={brandColors.accent}
                    onChange={(e) => onChange({
                      brandColors: { ...brandColors, accent: e.target.value }
                    })}
                    placeholder="#000000"
                    className="w-28"
                  />
                </div>
              </div>
            </div>
            
            {/* Color Preview */}
            <div className="p-4 rounded-lg border bg-card">
              <p className="text-sm text-muted-foreground mb-2">Preview</p>
              <div className="flex items-center gap-4">
                <div className="flex-1 h-20 rounded-lg flex items-center justify-center text-white font-bold"
                  style={{ backgroundColor: brandColors.primary }}>
                  Primary
                </div>
                <div className="flex-1 h-20 rounded-lg flex items-center justify-center text-white font-bold"
                  style={{ backgroundColor: brandColors.secondary }}>
                  Secondary
                </div>
                <div className="flex-1 h-20 rounded-lg flex items-center justify-center text-white font-bold"
                  style={{ backgroundColor: brandColors.accent }}>
                  Accent
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </Card>

      {/* Typography */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Type className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Typography</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {FONT_PAIRS.map((pair) => (
            <motion.button
              key={pair.heading + pair.body}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => applyFontPair(pair)}
              className={cn(
                "p-4 rounded-lg border-2 text-left transition-all",
                fonts.heading === pair.heading && fonts.body === pair.body
                  ? "border-primary shadow-lg"
                  : "border-muted hover:border-primary/50"
              )}
            >
              <h4 
                className="text-lg font-bold mb-1"
                style={{ fontFamily: pair.heading }}
              >
                {pair.heading}
              </h4>
              <p 
                className="text-sm text-muted-foreground mb-2"
                style={{ fontFamily: pair.body }}
              >
                {pair.body} for body text
              </p>
              <Badge variant="secondary" className="text-xs">
                {pair.style}
              </Badge>
            </motion.button>
          ))}
        </div>
      </Card>

      {/* Brand Voice */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Brand Voice & Messaging</h3>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="brandVoice">Brand Voice</Label>
          <Select
            value={data.brandVoice || ''}
            onValueChange={(value) => onChange({ brandVoice: value })}
          >
            <SelectTrigger id="brandVoice">
              <SelectValue placeholder="How should your content sound?" />
            </SelectTrigger>
            <SelectContent>
              {BRAND_VOICES.map((voice) => (
                <SelectItem key={voice} value={voice}>
                  {voice}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="tagline">Tagline</Label>
          <Input
            id="tagline"
            placeholder="Your memorable one-liner"
            value={data.tagline || ''}
            onChange={(e) => onChange({ tagline: e.target.value })}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="missionStatement">Mission Statement</Label>
          <Textarea
            id="missionStatement"
            placeholder="What drives your brand? What value do you provide?"
            value={data.missionStatement || ''}
            onChange={(e) => onChange({ missionStatement: e.target.value })}
            rows={2}
          />
        </div>
      </Card>

      {/* Inspiration & Competition */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Link className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Inspiration & Competition</h3>
        </div>
        
        <div className="space-y-4">
          <div>
            <Label>Competitor/Inspiration Accounts</Label>
            <p className="text-sm text-muted-foreground mb-2">
              Add accounts that inspire your content style
            </p>
            <div className="flex gap-2">
              <Input
                placeholder="@account or URL"
                value={currentCompetitor}
                onChange={(e) => setCurrentCompetitor(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addCompetitor(currentCompetitor)
                  }
                }}
              />
              <Button
                type="button"
                size="sm"
                onClick={() => addCompetitor(currentCompetitor)}
                disabled={!currentCompetitor}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {competitors.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {competitors.map((comp: string, i: number) => (
                  <Badge key={i} variant="outline">
                    {comp}
                    <button
                      onClick={() => onChange({
                        competitors: competitors.filter((_: string, idx: number) => idx !== i)
                      })}
                      className="ml-2 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
          
          <div>
            <Label>Inspiration Links</Label>
            <p className="text-sm text-muted-foreground mb-2">
              Add links to content that represents your ideal style
            </p>
            <div className="flex gap-2">
              <Input
                placeholder="https://..."
                value={currentInspiration}
                onChange={(e) => setCurrentInspiration(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addInspiration(currentInspiration)
                  }
                }}
              />
              <Button
                type="button"
                size="sm"
                onClick={() => addInspiration(currentInspiration)}
                disabled={!currentInspiration}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {inspirationLinks.length > 0 && (
              <div className="space-y-1 mt-2">
                {inspirationLinks.map((link: string, i: number) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <Link className="h-3 w-3" />
                    <span className="flex-1 truncate">{link}</span>
                    <button
                      onClick={() => onChange({
                        inspirationLinks: inspirationLinks.filter((_: string, idx: number) => idx !== i)
                      })}
                      className="hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Logo Upload */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Upload className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Brand Assets (Optional)</h3>
        </div>
        
        <Button variant="outline" className="w-full">
          <Upload className="h-4 w-4 mr-2" />
          Upload Logo
        </Button>
        <p className="text-xs text-muted-foreground text-center">
          SVG or PNG recommended • Will be used in generated content
        </p>
      </Card>
    </div>
  )
}