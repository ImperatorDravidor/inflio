"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Slider } from "@/components/ui/slider"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import type { ExtractedQuote, QuoteCardDesign } from "@/lib/quote-extractor"
import {
  IconSparkles,
  IconDownload,
  IconCopy,
  IconShare2,
  IconBrandTwitter,
  IconBrandLinkedin,
  IconBrandInstagram,
  IconHash,
  IconAlertCircle,
  IconCheck,
  IconX,
  IconRefresh,
  IconPalette,
  IconTypography,
  IconQuote
} from "@tabler/icons-react"

interface QuoteCardsGeneratorProps {
  projectId: string
  hasTranscript: boolean
  projectTitle: string
  className?: string
}

interface QuoteCardWithMeta {
  id: string
  quote: ExtractedQuote
  design: QuoteCardDesign
  imageUrl: string
  hashtags: string[]
  createdAt: Date
}

export function QuoteCardsGenerator({
  projectId,
  hasTranscript,
  projectTitle,
  className
}: QuoteCardsGeneratorProps) {
  const [quotes, setQuotes] = useState<ExtractedQuote[]>([])
  const [quoteCards, setQuoteCards] = useState<QuoteCardWithMeta[]>([])
  const [designs, setDesigns] = useState<QuoteCardDesign[]>([])
  const [selectedDesign, setSelectedDesign] = useState<string>('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  
  // Generation settings
  const [maxQuotes, setMaxQuotes] = useState(10)
  const [minLength, setMinLength] = useState(20)
  const [maxLength, setMaxLength] = useState(280)
  const [targetAudience, setTargetAudience] = useState('general')
  const [includeContext, setIncludeContext] = useState(true)
  const [sentimentFilter, setSentimentFilter] = useState<string[]>([])
  const [attribution, setAttribution] = useState(projectTitle)
  const [logoUrl, setLogoUrl] = useState('')
  
  // Selected quote for editing
  const [selectedQuote, setSelectedQuote] = useState<ExtractedQuote | null>(null)
  const [editedQuoteText, setEditedQuoteText] = useState('')

  // Load available designs
  useEffect(() => {
    loadDesigns()
  }, [])

  const loadDesigns = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/generate-quote-cards')
      
      if (response.ok) {
        const data = await response.json()
        setDesigns(data.designs || [])
        if (data.designs && data.designs.length > 0) {
          setSelectedDesign(data.designs[0].id)
        }
      }
    } catch (error) {
      console.error('Failed to load designs:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleGenerateQuotes = async () => {
    if (!hasTranscript) {
      toast.error('Please generate a transcript first')
      return
    }

    setIsGenerating(true)
    try {
      const response = await fetch('/api/generate-quote-cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          maxQuotes,
          minLength,
          maxLength,
          sentimentFilter: sentimentFilter.length > 0 ? sentimentFilter : undefined,
          includeContext,
          targetAudience,
          designId: selectedDesign,
          attribution,
          logoUrl: logoUrl || undefined
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to generate quote cards')
      }

      const data = await response.json()
      setQuotes(data.quotes || [])
      setQuoteCards(data.quoteCards || [])
      
      if (data.similarGroups && data.similarGroups.length > 0) {
        toast.info(`Found ${data.similarGroups.length} groups of similar quotes`)
      }
      
      toast.success(`Generated ${data.totalQuotes} quote cards successfully!`)
    } catch (error) {
      console.error('Quote generation error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to generate quotes')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSelectQuote = (quote: ExtractedQuote) => {
    setSelectedQuote(quote)
    setEditedQuoteText(quote.text)
  }

  const handleSaveEditedQuote = () => {
    if (!selectedQuote) return
    
    // Update quote in local state
    setQuotes(prev => prev.map(q => 
      q.id === selectedQuote.id 
        ? { ...q, text: editedQuoteText }
        : q
    ))
    
    setSelectedQuote(null)
    toast.success('Quote updated')
  }

  const copyQuoteToClipboard = (quote: ExtractedQuote, hashtags: string[]) => {
    const text = `"${quote.text}"\n\n${hashtags.join(' ')}`
    navigator.clipboard.writeText(text)
    toast.success('Quote copied to clipboard!')
  }

  const downloadQuoteCard = (card: QuoteCardWithMeta) => {
    const link = document.createElement('a')
    link.href = card.imageUrl
    link.download = `quote-${card.id}.svg`
    link.click()
  }

  const downloadAllCards = () => {
    quoteCards.forEach((card, index) => {
      setTimeout(() => downloadQuoteCard(card), index * 200)
    })
    toast.success(`Downloading ${quoteCards.length} quote cards...`)
  }

  const shareToSocial = (platform: 'twitter' | 'linkedin' | 'instagram', quote: ExtractedQuote, hashtags: string[]) => {
    const text = `"${quote.text}"\n\n${hashtags.join(' ')}`
    
    const urls = {
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}&summary=${encodeURIComponent(text)}`,
      instagram: '' // Instagram doesn't support direct sharing via URL
    }
    
    if (platform === 'instagram') {
      navigator.clipboard.writeText(text)
      toast.info('Quote copied! Paste it in your Instagram post.')
    } else if (urls[platform]) {
      window.open(urls[platform], '_blank')
    }
  }

  const sentimentOptions = [
    { value: 'inspiring', label: 'Inspiring', icon: '✨' },
    { value: 'informative', label: 'Informative', icon: '📚' },
    { value: 'thought-provoking', label: 'Thought-Provoking', icon: '🤔' },
    { value: 'motivational', label: 'Motivational', icon: '🚀' },
    { value: 'educational', label: 'Educational', icon: '🎓' }
  ]

  const currentDesign = designs.find(d => d.id === selectedDesign)

  if (isLoading) {
    return (
      <Card className={cn("animate-pulse", className)}>
        <CardHeader>
          <div className="h-6 w-32 bg-muted rounded" />
          <div className="h-4 w-48 bg-muted rounded mt-2" />
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <IconQuote className="h-5 w-5" />
              Quote Cards
            </CardTitle>
            <CardDescription>
              {quoteCards.length > 0
                ? `${quoteCards.length} quote cards generated`
                : 'Extract powerful quotes and create shareable graphics'}
            </CardDescription>
          </div>
          {quoteCards.length > 0 && (
            <Button
              size="sm"
              variant="outline"
              onClick={downloadAllCards}
            >
              <IconDownload className="h-4 w-4 mr-1" />
              Download All
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {!hasTranscript ? (
          <Alert>
            <IconAlertCircle className="h-4 w-4" />
            <AlertTitle>Transcript Required</AlertTitle>
            <AlertDescription>
              Generate a transcript first to extract quotes
            </AlertDescription>
          </Alert>
        ) : (
          <Tabs defaultValue="generate" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="generate">
                <IconSparkles className="h-4 w-4 mr-2" />
                Generate
              </TabsTrigger>
              <TabsTrigger value="design" disabled={quoteCards.length === 0}>
                <IconPalette className="h-4 w-4 mr-2" />
                Design
              </TabsTrigger>
              <TabsTrigger value="quotes" disabled={quoteCards.length === 0}>
                <IconQuote className="h-4 w-4 mr-2" />
                Quotes ({quoteCards.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="generate" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Max Quotes: {maxQuotes}</Label>
                  <Slider
                    value={[maxQuotes]}
                    onValueChange={(value) => setMaxQuotes(value[0])}
                    min={1}
                    max={20}
                    step={1}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Target Audience</Label>
                  <Input
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value)}
                    placeholder="e.g., entrepreneurs, students, general"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Min Length: {minLength} chars</Label>
                  <Slider
                    value={[minLength]}
                    onValueChange={(value) => setMinLength(value[0])}
                    min={10}
                    max={100}
                    step={5}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Max Length: {maxLength} chars</Label>
                  <Slider
                    value={[maxLength]}
                    onValueChange={(value) => setMaxLength(value[0])}
                    min={50}
                    max={500}
                    step={10}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Sentiment Filter</Label>
                <div className="flex flex-wrap gap-2">
                  {sentimentOptions.map(option => (
                    <Badge
                      key={option.value}
                      variant={sentimentFilter.includes(option.value) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => {
                        setSentimentFilter(prev =>
                          prev.includes(option.value)
                            ? prev.filter(s => s !== option.value)
                            : [...prev, option.value]
                        )
                      }}
                    >
                      {option.icon} {option.label}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div className="space-y-1">
                  <Label htmlFor="context">Include Context</Label>
                  <p className="text-xs text-muted-foreground">
                    Add brief context about what each quote refers to
                  </p>
                </div>
                <Switch
                  id="context"
                  checked={includeContext}
                  onCheckedChange={setIncludeContext}
                />
              </div>

              <div className="space-y-2">
                <Label>Attribution</Label>
                <Input
                  value={attribution}
                  onChange={(e) => setAttribution(e.target.value)}
                  placeholder="e.g., Your Name, Company"
                />
              </div>

              <div className="space-y-2">
                <Label>Logo URL (optional)</Label>
                <Input
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="https://example.com/logo.png"
                  type="url"
                />
              </div>

              <Button
                onClick={handleGenerateQuotes}
                disabled={isGenerating}
                className="w-full"
                size="lg"
              >
                {isGenerating ? (
                  <>
                    <IconSparkles className="h-5 w-5 mr-2 animate-spin" />
                    Extracting Quotes...
                  </>
                ) : (
                  <>
                    <IconSparkles className="h-5 w-5 mr-2" />
                    Generate Quote Cards
                  </>
                )}
              </Button>
            </TabsContent>

            <TabsContent value="design" className="space-y-4">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label>Design Template</Label>
                  <Select value={selectedDesign} onValueChange={setSelectedDesign}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {designs.map(design => (
                        <SelectItem key={design.id} value={design.id}>
                          <div>
                            <div className="font-medium">{design.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {design.layout} • {design.quotationStyle}
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {currentDesign && (
                  <Card className="p-4">
                    <h4 className="font-medium mb-2">Design Preview</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Background:</span>
                        <div className="flex items-center gap-2 mt-1">
                          <div
                            className="w-6 h-6 rounded border"
                            style={{ background: currentDesign.backgroundGradient || currentDesign.backgroundColor }}
                          />
                          <span>{currentDesign.backgroundColor}</span>
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Text Color:</span>
                        <div className="flex items-center gap-2 mt-1">
                          <div
                            className="w-6 h-6 rounded border"
                            style={{ backgroundColor: currentDesign.textColor }}
                          />
                          <span>{currentDesign.textColor}</span>
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Font:</span>
                        <p>{currentDesign.fontFamily}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Layout:</span>
                        <p>{currentDesign.layout}</p>
                      </div>
                    </div>
                  </Card>
                )}

                <Button
                  onClick={handleGenerateQuotes}
                  variant="outline"
                  className="w-full"
                >
                  <IconRefresh className="h-4 w-4 mr-2" />
                  Regenerate with New Design
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="quotes" className="space-y-4">
              <ScrollArea className="h-[600px] pr-4">
                <div className="grid gap-4 md:grid-cols-2">
                  {quoteCards.map((card, index) => (
                    <Card key={card.id} className="overflow-hidden">
                      <div className="aspect-square relative bg-muted">
                        <img
                          src={card.imageUrl}
                          alt={`Quote ${index + 1}`}
                          className="w-full h-full object-contain"
                        />
                        {card.quote.impactScore > 0.8 && (
                          <Badge
                            className="absolute top-2 right-2"
                            variant="default"
                          >
                            High Impact
                          </Badge>
                        )}
                      </div>
                      
                      <CardContent className="p-4 space-y-3">
                        <div>
                          <p className="text-sm font-medium line-clamp-3">
                            "{card.quote.text}"
                          </p>
                          {card.quote.context && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Context: {card.quote.context}
                            </p>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {card.quote.sentiment}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            Score: {Math.round(card.quote.impactScore * 100)}%
                          </Badge>
                        </div>
                        
                        {card.hashtags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {card.hashtags.slice(0, 5).map((tag, idx) => (
                              <span key={idx} className="text-xs text-muted-foreground">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                        
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => copyQuoteToClipboard(card.quote, card.hashtags)}
                          >
                            <IconCopy className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => downloadQuoteCard(card)}
                          >
                            <IconDownload className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => shareToSocial('twitter', card.quote, card.hashtags)}
                          >
                            <IconBrandTwitter className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => shareToSocial('linkedin', card.quote, card.hashtags)}
                          >
                            <IconBrandLinkedin className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  )
} 