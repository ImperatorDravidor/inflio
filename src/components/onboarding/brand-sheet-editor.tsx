"use client"

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Palette, Type, MessageSquare, Image as ImageIcon, Users,
  TrendingUp, Edit2, Save, RotateCcw, Plus, X, Check,
  Sliders, Hash, Quote, FileText, ChevronDown, ChevronUp,
  Info, Sparkles, Eye, Download, Copy
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface BrandSheetEditorProps {
  initialData: any // BrandAnalysis from the analysis
  onSave: (data: any) => void
  onBack?: () => void
}

export function BrandSheetEditor({
  initialData,
  onSave,
  onBack,
}: BrandSheetEditorProps) {
  const [brandData, setBrandData] = useState(initialData)
  const [editMode, setEditMode] = useState(false)
  const [expandedSections, setExpandedSections] = useState<string[]>(['summary'])

  // Update field
  const updateField = (path: string, value: any) => {
    const keys = path.split('.')
    const updated = { ...brandData }
    let current: any = updated
    
    for (let i = 0; i < keys.length - 1; i++) {
      current = current[keys[i]]
    }
    current[keys[keys.length - 1]] = value
    
    setBrandData(updated)
  }

  // Add item to array
  const addArrayItem = (path: string, item: any) => {
    const keys = path.split('.')
    const updated = { ...brandData }
    let current: any = updated
    
    for (let i = 0; i < keys.length - 1; i++) {
      current = current[keys[i]]
    }
    const array = current[keys[keys.length - 1]] || []
    current[keys[keys.length - 1]] = [...array, item]
    
    setBrandData(updated)
    toast.success('Item added')
  }

  // Remove item from array
  const removeArrayItem = (path: string, index: number) => {
    const keys = path.split('.')
    const updated = { ...brandData }
    let current: any = updated
    
    for (let i = 0; i < keys.length - 1; i++) {
      current = current[keys[i]]
    }
    const array = current[keys[keys.length - 1]]
    current[keys[keys.length - 1]] = array.filter((_: any, i: number) => i !== index)
    
    setBrandData(updated)
    toast.info('Item removed')
  }

  // Reset to original
  const resetToOriginal = () => {
    setBrandData(initialData)
    toast.info('Reset to AI suggestions')
  }

  // Save changes
  const handleSave = () => {
    onSave(brandData)
    toast.success('Brand identity saved!')
  }

  // Export as JSON
  const exportAsJSON = () => {
    const dataStr = JSON.stringify(brandData, null, 2)
    const blob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'brand-identity.json'
    link.click()
    toast.success('Exported as JSON')
  }

  // Copy to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard')
  }

  return (
    <div className="max-w-6xl mx-auto pb-32">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-3xl font-bold">Your Brand Identity</h2>
            <p className="text-muted-foreground">
              Review and customize your AI-generated brand guidelines
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={exportAsJSON}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button variant="outline" size="sm" onClick={resetToOriginal}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
            <Button variant={editMode ? 'default' : 'outline'} size="sm" onClick={() => setEditMode(!editMode)}>
              {editMode ? <Eye className="h-4 w-4 mr-2" /> : <Edit2 className="h-4 w-4 mr-2" />}
              {editMode ? 'Preview' : 'Edit'}
            </Button>
          </div>
        </div>

        <Alert>
          <Sparkles className="h-4 w-4" />
          <AlertDescription>
            AI has analyzed your brand materials. Click <strong>Edit</strong> to customize any section.
            All changes save automatically to your profile.
          </AlertDescription>
        </Alert>
      </div>

      {/* Tabs for different sections */}
      <Tabs defaultValue="summary" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="summary">
            <FileText className="h-4 w-4 mr-2" />
            Summary
          </TabsTrigger>
          <TabsTrigger value="colors">
            <Palette className="h-4 w-4 mr-2" />
            Colors
          </TabsTrigger>
          <TabsTrigger value="typography">
            <Type className="h-4 w-4 mr-2" />
            Typography
          </TabsTrigger>
          <TabsTrigger value="voice">
            <MessageSquare className="h-4 w-4 mr-2" />
            Voice & Tone
          </TabsTrigger>
          <TabsTrigger value="audience">
            <Users className="h-4 w-4 mr-2" />
            Audience
          </TabsTrigger>
        </TabsList>

        {/* Summary Tab */}
        <TabsContent value="summary" className="space-y-6">
          <Card className="p-6">
            <h3 className="text-xl font-semibold mb-4">Brand Summary</h3>
            
            <div className="space-y-6">
              <div>
                <Label>Brand Essence</Label>
                {editMode ? (
                  <Textarea
                    value={brandData.summary?.essence || ''}
                    onChange={(e) => updateField('summary.essence', e.target.value)}
                    className="mt-2"
                    rows={2}
                  />
                ) : (
                  <p className="mt-2 p-3 bg-muted rounded-lg">{brandData.summary?.essence}</p>
                )}
              </div>

              <div>
                <Label>Core Values</Label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {(brandData.summary?.coreValues || []).map((value: string, index: number) => (
                    <Badge key={index} variant="secondary" className="px-3 py-1">
                      {value}
                      {editMode && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-auto p-0 ml-2"
                          onClick={() => removeArrayItem('summary.coreValues', index)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      )}
                    </Badge>
                  ))}
                  {editMode && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const value = prompt('Enter core value:')
                        if (value) addArrayItem('summary.coreValues', value)
                      }}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Add Value
                    </Button>
                  )}
                </div>
              </div>

              <div>
                <Label>Market Positioning</Label>
                {editMode ? (
                  <Textarea
                    value={brandData.summary?.positioning || ''}
                    onChange={(e) => updateField('summary.positioning', e.target.value)}
                    className="mt-2"
                    rows={3}
                  />
                ) : (
                  <p className="mt-2 p-3 bg-muted rounded-lg">{brandData.summary?.positioning}</p>
                )}
              </div>

              <div>
                <Label>Competitive Advantages</Label>
                <ul className="mt-2 space-y-2">
                  {(brandData.summary?.advantages || []).map((advantage: string, index: number) => (
                    <li key={index} className="flex items-start gap-2 p-2 rounded-lg hover:bg-muted">
                      <Check className="h-4 w-4 text-green-600 mt-0.5" />
                      <span className="flex-1">{advantage}</span>
                      {editMode && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeArrayItem('summary.advantages', index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Colors Tab */}
        <TabsContent value="colors" className="space-y-6">
          <Card className="p-6">
            <h3 className="text-xl font-semibold mb-4">Color Palette</h3>

            {['primary', 'secondary', 'accent'].map((type) => (
              <div key={type} className="mb-6">
                <Label className="capitalize mb-3 block">{type} Colors</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {(brandData.colors?.[type] || []).map((color: any, index: number) => (
                    <div key={index} className="border rounded-lg p-4 space-y-3">
                      <div 
                        className="h-20 rounded-lg cursor-pointer flex items-center justify-center group relative"
                        style={{ backgroundColor: color.hex }}
                        onClick={() => copyToClipboard(color.hex)}
                      >
                        <span className="text-white bg-black/50 px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                          {color.hex}
                        </span>
                      </div>
                      {editMode ? (
                        <>
                          <Input
                            value={color.hex}
                            onChange={(e) => {
                              const updated = [...brandData.colors[type]]
                              updated[index] = { ...updated[index], hex: e.target.value }
                              updateField(`colors.${type}`, updated)
                            }}
                            placeholder="#000000"
                          />
                          <Input
                            value={color.name}
                            onChange={(e) => {
                              const updated = [...brandData.colors[type]]
                              updated[index] = { ...updated[index], name: e.target.value }
                              updateField(`colors.${type}`, updated)
                            }}
                            placeholder="Color name"
                          />
                          <Textarea
                            value={color.usage}
                            onChange={(e) => {
                              const updated = [...brandData.colors[type]]
                              updated[index] = { ...updated[index], usage: e.target.value }
                              updateField(`colors.${type}`, updated)
                            }}
                            placeholder="When to use"
                            rows={2}
                          />
                        </>
                      ) : (
                        <>
                          <p className="font-medium">{color.name}</p>
                          <p className="text-sm text-muted-foreground">{color.usage}</p>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </Card>
        </TabsContent>

        {/* Typography Tab */}
        <TabsContent value="typography" className="space-y-6">
          <Card className="p-6">
            <h3 className="text-xl font-semibold mb-4">Typography System</h3>

            <div className="space-y-6">
              {/* Primary Font */}
              <div className="border rounded-lg p-4">
                <Label className="text-lg mb-3 block">Primary Font</Label>
                {editMode ? (
                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm">Font Family</Label>
                      <Input
                        value={brandData.typography?.primary?.family || ''}
                        onChange={(e) => updateField('typography.primary.family', e.target.value)}
                        placeholder="Inter, Helvetica..."
                      />
                    </div>
                    <div>
                      <Label className="text-sm">Usage</Label>
                      <Input
                        value={brandData.typography?.primary?.usage || ''}
                        onChange={(e) => updateField('typography.primary.usage', e.target.value)}
                        placeholder="Headlines, titles..."
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-2xl font-bold" style={{ fontFamily: brandData.typography?.primary?.family }}>
                      {brandData.typography?.primary?.family}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {brandData.typography?.primary?.usage}
                    </p>
                    <div className="flex gap-2">
                      {(brandData.typography?.primary?.weights || []).map((weight: string) => (
                        <Badge key={weight} variant="outline">{weight}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Secondary Font */}
              <div className="border rounded-lg p-4">
                <Label className="text-lg mb-3 block">Secondary Font</Label>
                {editMode ? (
                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm">Font Family</Label>
                      <Input
                        value={brandData.typography?.secondary?.family || ''}
                        onChange={(e) => updateField('typography.secondary.family', e.target.value)}
                        placeholder="Roboto, Arial..."
                      />
                    </div>
                    <div>
                      <Label className="text-sm">Usage</Label>
                      <Input
                        value={brandData.typography?.secondary?.usage || ''}
                        onChange={(e) => updateField('typography.secondary.usage', e.target.value)}
                        placeholder="Body text, paragraphs..."
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-lg" style={{ fontFamily: brandData.typography?.secondary?.family }}>
                      {brandData.typography?.secondary?.family}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {brandData.typography?.secondary?.usage}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Voice & Tone Tab */}
        <TabsContent value="voice" className="space-y-6">
          <Card className="p-6">
            <h3 className="text-xl font-semibold mb-4">Brand Voice & Tone</h3>

            <div className="space-y-6">
              {/* Voice Attributes with Sliders */}
              <div>
                <Label className="mb-4 block">Voice Characteristics</Label>
                <div className="space-y-4">
                  {(brandData.voice?.attributes || []).map((attr: any, index: number) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm">{attr.name}</Label>
                        <span className="text-sm text-muted-foreground">{attr.value}%</span>
                      </div>
                      {editMode ? (
                        <Slider
                          value={[attr.value]}
                          onValueChange={(value) => {
                            const updated = [...brandData.voice.attributes]
                            updated[index] = { ...updated[index], value: value[0] }
                            updateField('voice.attributes', updated)
                          }}
                          max={100}
                          step={1}
                        />
                      ) : (
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary transition-all"
                            style={{ width: `${attr.value}%` }}
                          />
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground">{attr.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Keywords */}
              <div>
                <Label>Tone Keywords</Label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {(brandData.voice?.keywords || []).map((keyword: string, index: number) => (
                    <Badge key={index} variant="secondary">
                      {keyword}
                      {editMode && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-auto p-0 ml-2"
                          onClick={() => removeArrayItem('voice.keywords', index)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      )}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Do's and Don'ts */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-green-600">✅ Do's</Label>
                  <ul className="mt-2 space-y-2">
                    {(brandData.voice?.dos || []).map((item: string, index: number) => (
                      <li key={index} className="text-sm p-2 bg-green-50 dark:bg-green-950/20 rounded">
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <Label className="text-red-600">❌ Don'ts</Label>
                  <ul className="mt-2 space-y-2">
                    {(brandData.voice?.donts || []).map((item: string, index: number) => (
                      <li key={index} className="text-sm p-2 bg-red-50 dark:bg-red-950/20 rounded">
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Audience Tab */}
        <TabsContent value="audience" className="space-y-6">
          <Card className="p-6">
            <h3 className="text-xl font-semibold mb-4">Target Audience</h3>

            <Accordion type="multiple" className="space-y-4">
              <AccordionItem value="demographics">
                <AccordionTrigger>Demographics</AccordionTrigger>
                <AccordionContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                    <div>
                      <Label>Age Ranges</Label>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {(brandData.targetAudience?.demographics?.age || []).map((age: string, index: number) => (
                          <Badge key={index} variant="outline">{age}</Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <Label>Gender</Label>
                      <p className="mt-2 text-sm">{brandData.targetAudience?.demographics?.gender}</p>
                    </div>
                    <div>
                      <Label>Location</Label>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {(brandData.targetAudience?.demographics?.location || []).map((loc: string, index: number) => (
                          <Badge key={index} variant="outline">{loc}</Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <Label>Income Level</Label>
                      <p className="mt-2 text-sm">{brandData.targetAudience?.demographics?.income}</p>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="psychographics">
                <AccordionTrigger>Psychographics</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4 pt-4">
                    <div>
                      <Label>Values</Label>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {(brandData.targetAudience?.psychographics?.values || []).map((value: string, index: number) => (
                          <Badge key={index}>{value}</Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <Label>Pain Points</Label>
                      <ul className="mt-2 space-y-2">
                        {(brandData.targetAudience?.psychographics?.painPoints || []).map((pain: string, index: number) => (
                          <li key={index} className="text-sm p-2 bg-red-50 dark:bg-red-950/20 rounded flex items-start gap-2">
                            <AlertDescription className="h-4 w-4 text-red-600 mt-0.5" />
                            {pain}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <Label>Aspirations</Label>
                      <ul className="mt-2 space-y-2">
                        {(brandData.targetAudience?.psychographics?.aspirations || []).map((aspiration: string, index: number) => (
                          <li key={index} className="text-sm p-2 bg-green-50 dark:bg-green-950/20 rounded flex items-start gap-2">
                            <Sparkles className="h-4 w-4 text-green-600 mt-0.5" />
                            {aspiration}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Actions - Fixed at bottom */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4 z-40">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          {onBack && (
            <Button variant="ghost" onClick={onBack}>
              Back
            </Button>
          )}
          <div className="flex-1" />
          <Button onClick={handleSave} size="lg" className="min-w-[160px]">
            <Save className="h-5 w-5 mr-2" />
            Save & Continue
          </Button>
        </div>
      </div>
    </div>
  )
}


