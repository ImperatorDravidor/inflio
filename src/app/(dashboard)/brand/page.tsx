'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  Palette, Type, Volume2, Image, Users, Trophy, 
  Lightbulb, Download, Upload, Edit, Save, X,
  CheckCircle, Loader2, FileText, Eye, Copy,
  Share2, Settings, Sparkles, RefreshCw, ArrowLeft
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export default function BrandProfilePage() {
  const { userId, isLoaded } = useAuth()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [brandData, setBrandData] = useState<any>(null)
  const [editMode, setEditMode] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isReviewed, setIsReviewed] = useState(false)

  useEffect(() => {
    if (isLoaded && userId) {
      loadBrandProfile()
      checkReviewStatus()
    }
  }, [isLoaded, userId])

  const checkReviewStatus = async () => {
    try {
      const response = await fetch('/api/user/profile')
      if (response.ok) {
        const data = await response.json()
        setIsReviewed(data.profile?.brand_reviewed || false)
      }
    } catch (error) {
      console.error('Error checking review status:', error)
    }
  }

  const markAsReviewed = async () => {
    try {
      const response = await fetch('/api/onboarding/mark-reviewed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ field: 'brand_reviewed' })
      })

      if (!response.ok) throw new Error('Failed to mark as reviewed')

      setIsReviewed(true)
      toast.success('Brand review complete! Continuing setup...')
      // Force full reload to refresh 5-step setup progress
      window.location.href = '/dashboard'
    } catch (error) {
      console.error('Error marking as reviewed:', error)
      toast.error('Failed to mark as reviewed')
    }
  }

  const loadBrandProfile = async () => {
    try {
      // Use API to load brand data (uses service role key, bypasses RLS)
      const response = await fetch('/api/brand')

      if (!response.ok) {
        throw new Error('Failed to load brand profile')
      }

      const data = await response.json()

      // Debug logging
      console.log('[Brand Page] Data from API:', {
        hasBrandIdentity: !!data.brand_identity,
        brandIdentityKeys: data.brand_identity ? Object.keys(data.brand_identity) : []
      })

      setBrandData({
        brand_identity: data.brand_identity,
        full_name: data.full_name,
        company_name: data.company_name
      })
    } catch (error) {
      console.error('Error loading brand profile:', error)
      toast.error('Failed to load brand profile')
    } finally {
      setIsLoading(false)
    }
  }

  const saveBrandUpdate = async (section: string, updates: any) => {
    setIsSaving(true)
    try {
      // Use API to save brand data (uses service role key, bypasses RLS)
      const response = await fetch('/api/brand', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section, updates })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.details || 'Failed to save')
      }

      const result = await response.json()

      setBrandData({
        ...brandData,
        brand_identity: result.brand_identity
      })

      setEditMode(null)
      toast.success('Brand profile updated successfully')
    } catch (error) {
      console.error('Error saving brand update:', error)
      toast.error('Failed to save changes')
    } finally {
      setIsSaving(false)
    }
  }

  const exportBrandBook = () => {
    const dataStr = JSON.stringify(brandData.brand_identity, null, 2)
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)
    
    const exportFileDefaultName = `${brandData.company_name || 'brand'}_identity_${new Date().toISOString().split('T')[0]}.json`
    
    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportFileDefaultName)
    linkElement.click()
    
    toast.success('Brand book exported successfully')
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!brandData?.brand_identity) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={() => router.push('/dashboard')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Setup
          </Button>
        </div>
        <Card className="max-w-2xl mx-auto">
          <CardContent className="pt-8 pb-8">
            <div className="text-center space-y-6">
              <div className="w-20 h-20 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                <Palette className="h-10 w-10 text-primary" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold">No Brand Profile Yet</h2>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Create your brand identity to ensure all your content matches your unique style, colors, and voice.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button onClick={() => router.push('/onboarding?step=2')} size="lg">
                  <Sparkles className="h-4 w-4 mr-2" />
                  Create Brand Identity
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const brand = brandData.brand_identity

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold mb-2">Brand Profile</h1>
            <p className="text-muted-foreground">
              Your comprehensive brand identity and guidelines
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportBrandBook}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          {!isReviewed ? (
            <Button onClick={markAsReviewed}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Complete Review & Continue
            </Button>
          ) : (
            <Badge variant="secondary" className="h-9 px-4 flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              Reviewed
            </Badge>
          )}
        </div>
      </div>

      {/* Brand Tabs */}
      <Tabs defaultValue="colors" className="space-y-6">
        <TabsList className="grid grid-cols-2 md:grid-cols-6 w-full">
          <TabsTrigger value="colors">Colors</TabsTrigger>
          <TabsTrigger value="typography">Typography</TabsTrigger>
          <TabsTrigger value="voice">Voice</TabsTrigger>
          <TabsTrigger value="visual">Visual</TabsTrigger>
          <TabsTrigger value="audience">Audience</TabsTrigger>
          <TabsTrigger value="strategy">Strategy</TabsTrigger>
        </TabsList>

        {/* Colors Tab */}
        <TabsContent value="colors" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Palette className="h-5 w-5 text-primary" />
                  <CardTitle>Color Palette</CardTitle>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setEditMode(editMode === 'colors' ? null : 'colors')}
                >
                  {editMode === 'colors' ? <X className="h-4 w-4" /> : <Edit className="h-4 w-4" />}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {brand.colors && (
                <>
                  {/* Primary Colors */}
                  {brand.colors.primary?.hex?.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-3">Primary Colors</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {brand.colors.primary.hex.map((color: string, i: number) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="group cursor-pointer"
                            onClick={() => {
                              navigator.clipboard.writeText(color)
                              toast.success(`Copied ${color}`)
                            }}
                          >
                            <div className="relative overflow-hidden rounded-xl border-2 border-border hover:border-primary transition-all">
                              <div
                                className="h-24 w-full relative"
                                style={{ backgroundColor: color }}
                              >
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                                  <Copy className="h-4 w-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                              </div>
                              <div className="bg-background p-2 space-y-1">
                                <p className="font-mono text-xs font-semibold">{color.toUpperCase()}</p>
                                {brand.colors.primary.name?.[i] && (
                                  <p className="text-xs text-muted-foreground truncate">
                                    {brand.colors.primary.name[i]}
                                  </p>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                      {brand.colors.primary.usage && (
                        <p className="text-sm text-muted-foreground mt-3">
                          {brand.colors.primary.usage}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Secondary Colors */}
                  {brand.colors.secondary?.hex?.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-3">Secondary Colors</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {brand.colors.secondary.hex.map((color: string, i: number) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="group cursor-pointer"
                            onClick={() => {
                              navigator.clipboard.writeText(color)
                              toast.success(`Copied ${color}`)
                            }}
                          >
                            <div className="relative overflow-hidden rounded-xl border-2 border-border hover:border-primary transition-all">
                              <div
                                className="h-24 w-full relative"
                                style={{ backgroundColor: color }}
                              >
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                                  <Copy className="h-4 w-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                              </div>
                              <div className="bg-background p-2 space-y-1">
                                <p className="font-mono text-xs font-semibold">{color.toUpperCase()}</p>
                                {brand.colors.secondary.name?.[i] && (
                                  <p className="text-xs text-muted-foreground truncate">
                                    {brand.colors.secondary.name[i]}
                                  </p>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Color Guidelines */}
                  {brand.colors.guidelines?.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-3">Usage Guidelines</h3>
                      <ul className="space-y-2">
                        {brand.colors.guidelines.map((guideline: string, i: number) => (
                          <li key={i} className="flex items-start text-sm">
                            <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                            <span>{guideline}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Typography Tab */}
        <TabsContent value="typography" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Type className="h-5 w-5 text-primary" />
                  <CardTitle>Typography</CardTitle>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setEditMode(editMode === 'typography' ? null : 'typography')}
                >
                  {editMode === 'typography' ? <X className="h-4 w-4" /> : <Edit className="h-4 w-4" />}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {brand.typography && (
                <>
                  {/* Primary Font */}
                  {brand.typography.primary?.family && (
                    <div className="p-6 rounded-lg border bg-card">
                      <h3 className="text-sm font-semibold mb-3 text-muted-foreground">PRIMARY TYPEFACE</h3>
                      <p 
                        className="text-4xl font-bold mb-4"
                        style={{ fontFamily: brand.typography.primary.family }}
                      >
                        {brand.typography.primary.family}
                      </p>
                      <p 
                        className="text-lg mb-4 text-muted-foreground"
                        style={{ fontFamily: brand.typography.primary.family }}
                      >
                        The quick brown fox jumps over the lazy dog
                      </p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        {brand.typography.primary.weights?.length > 0 && (
                          <div>
                            <p className="text-muted-foreground mb-1">Weights</p>
                            <p className="font-medium">{brand.typography.primary.weights.join(', ')}</p>
                          </div>
                        )}
                        {brand.typography.primary.fallback && (
                          <div>
                            <p className="text-muted-foreground mb-1">Fallback</p>
                            <p className="font-mono text-xs">{brand.typography.primary.fallback}</p>
                          </div>
                        )}
                        {brand.typography.primary.usage && (
                          <div className="md:col-span-2">
                            <p className="text-muted-foreground mb-1">Usage</p>
                            <p>{brand.typography.primary.usage}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Type Scale */}
                  {(brand.typography.headings?.h1?.size || brand.typography.body?.size) && (
                    <div>
                      <h3 className="font-semibold mb-4">Type Scale</h3>
                      <div className="space-y-4">
                        {brand.typography.headings?.h1?.size && (
                          <div className="flex items-baseline gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                            <span className="text-sm text-muted-foreground w-20">H1</span>
                            <span 
                              className="flex-1 font-bold"
                              style={{ 
                                fontSize: brand.typography.headings.h1.size,
                                fontFamily: brand.typography.primary?.family 
                              }}
                            >
                              Heading One
                            </span>
                            <span className="text-xs text-muted-foreground font-mono">
                              {brand.typography.headings.h1.size} / {brand.typography.headings.h1.weight}
                            </span>
                          </div>
                        )}
                        {brand.typography.headings?.h2?.size && (
                          <div className="flex items-baseline gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                            <span className="text-sm text-muted-foreground w-20">H2</span>
                            <span 
                              className="flex-1 font-semibold"
                              style={{ 
                                fontSize: brand.typography.headings.h2.size,
                                fontFamily: brand.typography.primary?.family 
                              }}
                            >
                              Heading Two
                            </span>
                            <span className="text-xs text-muted-foreground font-mono">
                              {brand.typography.headings.h2.size} / {brand.typography.headings.h2.weight}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Voice Tab */}
        <TabsContent value="voice" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Volume2 className="h-5 w-5 text-primary" />
                <CardTitle>Brand Voice & Tone</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {brand.voice && (
                <>
                  {brand.voice.tone?.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-3">Tone Attributes</h3>
                      <div className="flex flex-wrap gap-2">
                        {brand.voice.tone.map((item: string, i: number) => (
                          <Badge key={i} variant="secondary" className="text-sm">
                            {item}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {brand.voice.personality?.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-3">Brand Personality</h3>
                      <div className="flex flex-wrap gap-2">
                        {brand.voice.personality.map((item: string, i: number) => (
                          <Badge key={i} variant="outline" className="text-sm">
                            {item}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {brand.voice.phrases?.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-3">Example Phrases</h3>
                      <div className="space-y-2">
                        {brand.voice.phrases.slice(0, 5).map((phrase: string, i: number) => (
                          <div key={i} className="p-3 rounded-lg bg-muted/50 italic">
                            "{phrase}"
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {(brand.voice.dos?.length > 0 || brand.voice.donts?.length > 0) && (
                    <div className="grid md:grid-cols-2 gap-6">
                      {brand.voice.dos?.length > 0 && (
                        <div>
                          <h3 className="font-semibold mb-3 text-green-600">Do's</h3>
                          <ul className="space-y-2">
                            {brand.voice.dos.map((item: string, i: number) => (
                              <li key={i} className="flex items-start text-sm">
                                <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {brand.voice.donts?.length > 0 && (
                        <div>
                          <h3 className="font-semibold mb-3 text-red-600">Don'ts</h3>
                          <ul className="space-y-2">
                            {brand.voice.donts.map((item: string, i: number) => (
                              <li key={i} className="flex items-start text-sm">
                                <X className="h-4 w-4 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Visual Style Tab */}
        <TabsContent value="visual" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Image className="h-5 w-5 text-primary" />
                <CardTitle>Visual Style</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {brand.visualStyle && (
                <>
                  {brand.visualStyle.principles?.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-3">Design Principles</h3>
                      <div className="grid md:grid-cols-2 gap-3">
                        {brand.visualStyle.principles.map((principle: string, i: number) => (
                          <div key={i} className="p-3 rounded-lg border bg-card">
                            <p className="text-sm">{principle}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {brand.visualStyle.photography && (
                    <div>
                      <h3 className="font-semibold mb-3">Photography Guidelines</h3>
                      <div className="grid md:grid-cols-3 gap-4">
                        {brand.visualStyle.photography.style?.length > 0 && (
                          <div>
                            <p className="text-sm font-medium mb-2">Style</p>
                            <div className="space-y-1">
                              {brand.visualStyle.photography.style.map((item: string, i: number) => (
                                <p key={i} className="text-sm text-muted-foreground">• {item}</p>
                              ))}
                            </div>
                          </div>
                        )}
                        {brand.visualStyle.photography.mood?.length > 0 && (
                          <div>
                            <p className="text-sm font-medium mb-2">Mood</p>
                            <div className="space-y-1">
                              {brand.visualStyle.photography.mood.map((item: string, i: number) => (
                                <p key={i} className="text-sm text-muted-foreground">• {item}</p>
                              ))}
                            </div>
                          </div>
                        )}
                        {brand.visualStyle.photography.composition?.length > 0 && (
                          <div>
                            <p className="text-sm font-medium mb-2">Composition</p>
                            <div className="space-y-1">
                              {brand.visualStyle.photography.composition.map((item: string, i: number) => (
                                <p key={i} className="text-sm text-muted-foreground">• {item}</p>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Audience Tab */}
        <TabsContent value="audience" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <CardTitle>Target Audience</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {brand.targetAudience && (
                <>
                  {brand.targetAudience.demographics && (
                    <div>
                      <h3 className="font-semibold mb-3">Demographics</h3>
                      <div className="grid md:grid-cols-3 gap-4">
                        {brand.targetAudience.demographics.age && (
                          <div className="p-3 rounded-lg border bg-card">
                            <p className="text-sm font-medium mb-1">Age Range</p>
                            <p className="text-sm text-muted-foreground">{brand.targetAudience.demographics.age}</p>
                          </div>
                        )}
                        {brand.targetAudience.demographics.location && (
                          <div className="p-3 rounded-lg border bg-card">
                            <p className="text-sm font-medium mb-1">Location</p>
                            <p className="text-sm text-muted-foreground">{brand.targetAudience.demographics.location}</p>
                          </div>
                        )}
                        {brand.targetAudience.demographics.interests?.length > 0 && (
                          <div className="p-3 rounded-lg border bg-card">
                            <p className="text-sm font-medium mb-1">Interests</p>
                            <p className="text-sm text-muted-foreground">
                              {brand.targetAudience.demographics.interests.join(', ')}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {brand.targetAudience.psychographics?.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-3">Psychographics</h3>
                      <div className="flex flex-wrap gap-2">
                        {brand.targetAudience.psychographics.map((item: string, i: number) => (
                          <Badge key={i} variant="secondary">
                            {item}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {brand.targetAudience.painPoints?.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-3">Pain Points</h3>
                      <div className="grid md:grid-cols-2 gap-3">
                        {brand.targetAudience.painPoints.map((point: string, i: number) => (
                          <div key={i} className="flex items-start">
                            <div className="w-2 h-2 rounded-full bg-red-500 mt-1.5 mr-3 flex-shrink-0" />
                            <p className="text-sm">{point}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {brand.targetAudience.needs?.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-3">Needs & Desires</h3>
                      <div className="grid md:grid-cols-2 gap-3">
                        {brand.targetAudience.needs.map((need: string, i: number) => (
                          <div key={i} className="flex items-start">
                            <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5 mr-3 flex-shrink-0" />
                            <p className="text-sm">{need}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Strategy Tab */}
        <TabsContent value="strategy" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-primary" />
                <CardTitle>Brand Strategy</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {brand.brandStrategy && (
                <>
                  {brand.brandStrategy.mission && (
                    <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                      <h3 className="font-semibold mb-2">Mission Statement</h3>
                      <p className="text-lg italic">{brand.brandStrategy.mission}</p>
                    </div>
                  )}

                  {brand.brandStrategy.vision && (
                    <div className="p-4 rounded-lg bg-card border">
                      <h3 className="font-semibold mb-2">Vision</h3>
                      <p>{brand.brandStrategy.vision}</p>
                    </div>
                  )}

                  {brand.brandStrategy.values?.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-3">Core Values</h3>
                      <div className="grid md:grid-cols-3 gap-3">
                        {brand.brandStrategy.values.map((value: string, i: number) => (
                          <div key={i} className="p-3 rounded-lg border bg-card text-center">
                            <p className="font-medium">{value}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {brand.brandStrategy.positioning && (
                    <div>
                      <h3 className="font-semibold mb-2">Market Positioning</h3>
                      <p className="text-sm text-muted-foreground">{brand.brandStrategy.positioning}</p>
                    </div>
                  )}

                  {brand.brandStrategy.pillars?.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-3">Brand Pillars</h3>
                      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3">
                        {brand.brandStrategy.pillars.map((pillar: string, i: number) => (
                          <div key={i} className="p-4 rounded-lg border bg-card text-center">
                            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
                              <span className="text-lg font-bold text-primary">{i + 1}</span>
                            </div>
                            <p className="text-sm font-medium">{pillar}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
