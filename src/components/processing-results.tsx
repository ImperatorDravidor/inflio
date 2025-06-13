"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"

import { 
  IconFileText, 
  IconScissors, 
  IconBulb, 
  IconArticle, 
  IconBrandTwitter,
  IconDownload,
  IconCopy,
  IconEye,
  IconPlayerPlay,
  IconClock,
  IconQuote,
  IconHash,
  IconShare
} from "@tabler/icons-react"
import { toast } from "sonner"

interface ProcessingResult {
  status: string
  data: any
  timestamp: string
  error?: string
}

interface ProcessingResultsProps {
  results: Record<string, ProcessingResult>
  videoTitle: string
}

export function ProcessingResults({ results, videoTitle }: ProcessingResultsProps) {
  const [activeResult, setActiveResult] = useState<string | null>(null)

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success("Copied to clipboard!")
  }

  const downloadAsFile = (content: string, filename: string, type: string = 'text/plain') => {
    const blob = new Blob([content], { type })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success("File downloaded!")
  }

  const TranscriptionResult = ({ result }: { result: ProcessingResult }) => {
    if (result.status !== 'completed' || !result.data) return null

    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <IconFileText className="h-5 w-5 text-blue-500" />
              <CardTitle className="text-lg">Transcription</CardTitle>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => copyToClipboard(result.data.transcript)}
              >
                <IconCopy className="h-4 w-4 mr-1" />
                Copy
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => downloadAsFile(result.data.transcript, `${videoTitle}_transcript.txt`)}
              >
                <IconDownload className="h-4 w-4 mr-1" />
                Download
              </Button>
            </div>
          </div>
          <CardDescription>
            {result.data.duration && `Duration: ${Math.floor(result.data.duration / 60)}:${String(Math.floor(result.data.duration % 60)).padStart(2, '0')}`} • 
            Language: {result.data.language || 'English'} • 
            {result.data.timestamps?.length || 0} segments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="full" className="w-full">
            <TabsList>
              <TabsTrigger value="full">Full Transcript</TabsTrigger>
              <TabsTrigger value="segments">Timestamped Segments</TabsTrigger>
            </TabsList>
            
            <TabsContent value="full">
              <ScrollArea className="h-96 w-full rounded border p-4">
                <p className="whitespace-pre-wrap text-sm leading-relaxed">
                  {result.data.transcript}
                </p>
              </ScrollArea>
            </TabsContent>
            
            <TabsContent value="segments">
              <ScrollArea className="h-96 w-full">
                <div className="space-y-2">
                  {result.data.timestamps?.map((segment: any, index: number) => (
                    <div key={index} className="flex gap-4 p-3 rounded border">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground min-w-fit">
                        <IconClock className="h-3 w-3" />
                        {Math.floor(segment.start / 60)}:{String(Math.floor(segment.start % 60)).padStart(2, '0')} - 
                        {Math.floor(segment.end / 60)}:{String(Math.floor(segment.end % 60)).padStart(2, '0')}
                      </div>
                      <p className="text-sm flex-1">{segment.text}</p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    )
  }

  const ClipsResult = ({ result }: { result: ProcessingResult }) => {
    if (result.status !== 'completed' || !result.data) return null

    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <IconScissors className="h-5 w-5 text-purple-500" />
              <CardTitle className="text-lg">Smart Clips</CardTitle>
            </div>
            <Badge variant="secondary">{result.data.clips?.length || 0} clips generated</Badge>
          </div>
          <CardDescription>
            AI-generated short clips perfect for social media
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {result.data.clips?.map((clip: any, index: number) => (
              <Card key={index} className="overflow-hidden">
                <div className="relative aspect-video bg-muted">
                  <img
                    src={clip.thumbnail}
                    alt={clip.title}
                    className="object-cover w-full h-full"
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                    <Button size="sm" variant="secondary">
                      <IconPlayerPlay className="h-4 w-4 mr-1" />
                      Preview
                    </Button>
                  </div>
                  <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-1 py-0.5 rounded">
                    {Math.floor((clip.endTime - clip.startTime) / 60)}:{String(Math.floor((clip.endTime - clip.startTime) % 60)).padStart(2, '0')}
                  </div>
                </div>
                <CardContent className="p-4">
                  <h4 className="font-semibold mb-2">{clip.title}</h4>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {clip.highlights?.map((highlight: string, i: number) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        {highlight}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1">
                      <IconDownload className="h-3 w-3 mr-1" />
                      Export
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1">
                      <IconShare className="h-3 w-3 mr-1" />
                      Share
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  const IdeasResult = ({ result }: { result: ProcessingResult }) => {
    if (result.status !== 'completed' || !result.data) return null

    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <IconBulb className="h-5 w-5 text-yellow-500" />
            <CardTitle className="text-lg">Key Insights</CardTitle>
          </div>
          <CardDescription>
            Important quotes and topics extracted from your video
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Key Quotes */}
          {result.data.ideas && (
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <IconQuote className="h-4 w-4" />
                Key Quotes
              </h4>
              <div className="space-y-3">
                {result.data.ideas.map((idea: any, index: number) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <blockquote className="text-sm italic mb-2">
                      "{idea.quote}"
                    </blockquote>
                    <div className="flex items-center justify-between">
                      <div className="flex gap-1">
                        {idea.tags?.map((tag: string, i: number) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {Math.floor(idea.timestamp / 60)}:{String(Math.floor(idea.timestamp % 60)).padStart(2, '0')}
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyToClipboard(idea.quote)}
                        >
                          <IconCopy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Topics */}
          {result.data.topics && (
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <IconHash className="h-4 w-4" />
                Main Topics
              </h4>
              <div className="flex flex-wrap gap-2">
                {result.data.topics.map((topic: string, index: number) => (
                  <Badge key={index} variant="secondary" className="text-sm">
                    {topic}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  const BlogResult = ({ result }: { result: ProcessingResult }) => {
    if (result.status !== 'completed' || !result.data) return null

    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <IconArticle className="h-5 w-5 text-green-500" />
              <CardTitle className="text-lg">Blog Article</CardTitle>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => copyToClipboard(result.data.blog.content)}
              >
                <IconCopy className="h-4 w-4 mr-1" />
                Copy
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => downloadAsFile(
                  result.data.blog.content,
                  `${videoTitle}_blog.md`,
                  'text/markdown'
                )}
              >
                <IconDownload className="h-4 w-4 mr-1" />
                Download
              </Button>
            </div>
          </div>
          <CardDescription>
            SEO-optimized blog post • {result.data.blog.estimatedReadTime} read
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg mb-2">{result.data.blog.title}</h3>
              <div className="flex flex-wrap gap-1">
                {result.data.blog.tags?.map((tag: string, index: number) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
            <Separator />
            <ScrollArea className="h-96 w-full rounded border p-4">
              <div 
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ 
                  __html: result.data.blog.content.replace(/\n/g, '<br>') 
                }}
              />
            </ScrollArea>
          </div>
        </CardContent>
      </Card>
    )
  }

  const SocialResult = ({ result }: { result: ProcessingResult }) => {
    if (result.status !== 'completed' || !result.data) return null

    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <IconBrandTwitter className="h-5 w-5 text-pink-500" />
            <CardTitle className="text-lg">Social Media Posts</CardTitle>
          </div>
          <CardDescription>
            Platform-optimized posts ready to share
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="twitter" className="w-full">
            <TabsList>
              <TabsTrigger value="twitter">Twitter</TabsTrigger>
              <TabsTrigger value="linkedin">LinkedIn</TabsTrigger>
            </TabsList>
            
            <TabsContent value="twitter" className="space-y-4">
              {result.data.posts.twitter?.map((post: any, index: number) => (
                <div key={index} className="p-4 border rounded-lg space-y-2">
                  <p className="text-sm">{post.text}</p>
                  <div className="flex flex-wrap gap-1">
                    {post.hashtags?.map((tag: string, i: number) => (
                      <span key={i} className="text-xs text-blue-500">{tag}</span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(`${post.text} ${post.hashtags?.join(' ')}`)}
                    >
                      <IconCopy className="h-3 w-3 mr-1" />
                      Copy
                    </Button>
                    <Button size="sm" variant="outline">
                      <IconShare className="h-3 w-3 mr-1" />
                      Share
                    </Button>
                  </div>
                </div>
              ))}
            </TabsContent>
            
            <TabsContent value="linkedin" className="space-y-4">
              <div className="p-4 border rounded-lg space-y-2">
                <p className="text-sm">{result.data.posts.linkedin?.text}</p>
                <div className="flex flex-wrap gap-1">
                  {result.data.posts.linkedin?.hashtags?.map((tag: string, i: number) => (
                    <span key={i} className="text-xs text-blue-500">{tag}</span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(`${result.data.posts.linkedin.text} ${result.data.posts.linkedin.hashtags?.join(' ')}`)}
                  >
                    <IconCopy className="h-3 w-3 mr-1" />
                    Copy
                  </Button>
                  <Button size="sm" variant="outline">
                    <IconShare className="h-3 w-3 mr-1" />
                    Share
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    )
  }

  const renderResult = (type: string, result: ProcessingResult) => {
    if (result.status === 'failed') {
      return (
        <Card className="border-destructive">
          <CardContent className="p-6 text-center">
            <div className="text-destructive mb-2">Processing failed</div>
            <p className="text-sm text-muted-foreground">{result.error}</p>
          </CardContent>
        </Card>
      )
    }

    switch (type) {
      case 'transcription':
        return <TranscriptionResult result={result} />
      case 'clips':
        return <ClipsResult result={result} />
      case 'ideas':
        return <IdeasResult result={result} />
      case 'blog':
        return <BlogResult result={result} />
      case 'social':
        return <SocialResult result={result} />
      default:
        return null
    }
  }

  const completedResults = Object.entries(results).filter(([_, result]) => result.status === 'completed')

  if (completedResults.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <IconEye className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No results yet</h3>
          <p className="text-muted-foreground">Process your video to see results here</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {completedResults.map(([type, result]) => (
        <div key={type}>
          {renderResult(type, result)}
        </div>
      ))}
    </div>
  )
} 