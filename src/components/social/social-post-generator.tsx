"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  IconBrandTwitter,
  IconBrandLinkedin,
  IconBrandInstagram,
  IconBrandFacebook,
  IconSparkles,
  IconQuote,
  IconBulb,
  IconMessageQuestion,
  IconChartBar,
  IconBook,
  IconList,
  IconMovie,
  IconTargetArrow,
  IconCopy,
  IconEdit,
  IconCheck,
  IconLoader2,
  IconRefresh,
  IconHash,
  IconAlertCircle,
  IconInfoCircle
} from "@tabler/icons-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface PostType {
  id: string
  name: string
  description: string
  icon: typeof IconSparkles
  prompt: string
  examples: string[]
  bestFor: string[]
  color: string
}

const postTypes: PostType[] = [
  {
    id: "thread",
    name: "Thread/Story",
    description: "Break down complex ideas into digestible multi-part posts",
    icon: IconList,
    prompt: "Create a compelling thread that breaks down the main concepts from this video into 5-7 connected posts. Start with a hook and end with a call-to-action.",
    examples: [
      "1/ 🎯 Here's what nobody tells you about...",
      "2/ The first thing to understand is...",
      "3/ This changes everything because..."
    ],
    bestFor: ["Twitter/X", "LinkedIn"],
    color: "from-blue-500 to-cyan-500"
  },
  {
    id: "educational",
    name: "Educational/How-to",
    description: "Share actionable insights and practical tips",
    icon: IconBulb,
    prompt: "Extract 3-5 actionable tips or lessons from this video and present them as practical advice the audience can implement immediately.",
    examples: [
      "5 ways to improve your...",
      "The step-by-step guide to...",
      "Here's exactly how to..."
    ],
    bestFor: ["LinkedIn", "Instagram"],
    color: "from-yellow-500 to-orange-500"
  },
  {
    id: "quote",
    name: "Quote/Key Insight",
    description: "Highlight powerful statements or profound insights",
    icon: IconQuote,
    prompt: "Find the most impactful quote or insight from this video and create a post that expands on why it matters.",
    examples: [
      "\"The best time to start is now\" - Here's why this matters...",
      "This one insight changed my perspective on...",
      "If you remember one thing from today, let it be this..."
    ],
    bestFor: ["All platforms"],
    color: "from-purple-500 to-pink-500"
  },
  {
    id: "engagement",
    name: "Question/Poll",
    description: "Spark conversations with thought-provoking questions",
    icon: IconMessageQuestion,
    prompt: "Create an engaging question or poll based on the video content that encourages audience participation and discussion.",
    examples: [
      "What's your biggest challenge with...?",
      "Poll: Which approach do you prefer?",
      "Let's discuss: Do you agree that...?"
    ],
    bestFor: ["Twitter/X", "LinkedIn", "Instagram Stories"],
    color: "from-green-500 to-emerald-500"
  },
  {
    id: "data",
    name: "Stats & Facts",
    description: "Present compelling data points and statistics",
    icon: IconChartBar,
    prompt: "Extract interesting statistics, facts, or data points from the video and present them in an engaging, shareable format.",
    examples: [
      "Did you know that 73% of...",
      "The numbers don't lie: Here's what the data shows...",
      "3 surprising statistics about..."
    ],
    bestFor: ["LinkedIn", "Twitter/X"],
    color: "from-indigo-500 to-purple-500"
  },
  {
    id: "story",
    name: "Story/Narrative",
    description: "Share personal anecdotes or case studies",
    icon: IconBook,
    prompt: "Transform the video content into a relatable story or narrative that illustrates the main point through personal experience or case study.",
    examples: [
      "Last week, I discovered something that changed...",
      "Here's what happened when I tried...",
      "A client once told me something I'll never forget..."
    ],
    bestFor: ["LinkedIn", "Instagram", "Facebook"],
    color: "from-red-500 to-rose-500"
  },
  {
    id: "summary",
    name: "Key Takeaways",
    description: "Distill content into bite-sized summaries",
    icon: IconTargetArrow,
    prompt: "Summarize the video's main points into 3-5 clear, concise takeaways that provide immediate value.",
    examples: [
      "TL;DR - Here are the 3 key points:",
      "If you're short on time, here's what matters:",
      "The executive summary:"
    ],
    bestFor: ["All platforms"],
    color: "from-teal-500 to-cyan-500"
  },
  {
    id: "behind-scenes",
    name: "Behind the Scenes",
    description: "Share the process, journey, or making-of insights",
    icon: IconMovie,
    prompt: "Create a behind-the-scenes post about the topic discussed in the video, sharing the process, challenges, or journey.",
    examples: [
      "Here's what it really takes to...",
      "The untold story behind...",
      "What they don't show you about..."
    ],
    bestFor: ["Instagram", "LinkedIn"],
    color: "from-gray-600 to-gray-800"
  }
]

interface SocialPostGeneratorProps {
  transcript: string
  contentAnalysis: any
  projectTitle: string
  onPostGenerated?: (post: any) => void
}

export function SocialPostGenerator({ 
  transcript, 
  contentAnalysis, 
  projectTitle,
  onPostGenerated 
}: SocialPostGeneratorProps) {
  const [selectedType, setSelectedType] = useState<PostType>(postTypes[0])
  const [generatedPosts, setGeneratedPosts] = useState<Record<string, string>>({})
  const [editedPosts, setEditedPosts] = useState<Record<string, string>>({})
  const [isGenerating, setIsGenerating] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [selectedPlatform, setSelectedPlatform] = useState<'twitter' | 'linkedin' | 'instagram' | 'facebook'>('twitter')

  const platforms = [
    { id: 'twitter', name: 'Twitter/X', icon: IconBrandTwitter, limit: 280 },
    { id: 'linkedin', name: 'LinkedIn', icon: IconBrandLinkedin, limit: 3000 },
    { id: 'instagram', name: 'Instagram', icon: IconBrandInstagram, limit: 2200 },
    { id: 'facebook', name: 'Facebook', icon: IconBrandFacebook, limit: 63206 }
  ]

  const generatePost = async (type: PostType) => {
    setIsGenerating(true)
    
    try {
      const response = await fetch('/api/generate-social', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postType: type.id,
          prompt: type.prompt,
          transcript: transcript.slice(0, 3000), // Limit transcript length
          contentAnalysis,
          projectTitle,
          platform: selectedPlatform,
          tone: contentAnalysis?.tone || 'professional'
        })
      })

      if (!response.ok) throw new Error('Failed to generate post')

      const data = await response.json()
      setGeneratedPosts(prev => ({ ...prev, [type.id]: data.content }))
      setEditedPosts(prev => ({ ...prev, [type.id]: data.content }))
      
      toast.success(`${type.name} post generated!`)
    } catch (error) {
      toast.error('Failed to generate post. Please try again.')
      console.error('Post generation error:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  const copyToClipboard = async (text: string, typeId: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedId(typeId)
      setTimeout(() => setCopiedId(null), 2000)
      toast.success('Copied to clipboard!')
    } catch {
      toast.error('Failed to copy')
    }
  }

  const handleSavePost = (typeId: string) => {
    const post = {
      type: typeId,
      content: editedPosts[typeId] || generatedPosts[typeId],
      platform: selectedPlatform,
      timestamp: new Date().toISOString()
    }
    
    onPostGenerated?.(post)
    toast.success('Post saved to your project!')
  }

  const currentPost = editedPosts[selectedType.id] || generatedPosts[selectedType.id]
  const characterCount = currentPost?.length || 0
  const characterLimit = platforms.find(p => p.id === selectedPlatform)?.limit || 280

  return (
    <div className="space-y-6">
      {/* Post Type Selector */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {postTypes.map((type) => {
          const Icon = type.icon
          const isSelected = selectedType.id === type.id
          const hasGenerated = !!generatedPosts[type.id]
          
          return (
            <motion.div
              key={type.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Card 
                className={cn(
                  "cursor-pointer transition-all",
                  isSelected && "ring-2 ring-primary",
                  hasGenerated && "border-green-500/50"
                )}
                onClick={() => setSelectedType(type)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className={cn(
                      "p-2 rounded-lg",
                      `bg-gradient-to-br ${type.color} text-white`
                    )}>
                      <Icon className="h-5 w-5" />
                    </div>
                    {hasGenerated && (
                      <Badge variant="outline" className="text-green-600">
                        <IconCheck className="h-3 w-3 mr-1" />
                        Generated
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-base mt-3">{type.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {type.description}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-1">
                    {type.bestFor.map((platform) => (
                      <Badge key={platform} variant="secondary" className="text-xs">
                        {platform}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>

      {/* Generator Interface */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <selectedType.icon className="h-5 w-5" />
                {selectedType.name} Generator
              </CardTitle>
              <CardDescription>{selectedType.description}</CardDescription>
            </div>
            <Tabs value={selectedPlatform} onValueChange={(v: any) => setSelectedPlatform(v)}>
              <TabsList>
                {platforms.map((platform) => (
                  <TabsTrigger key={platform.id} value={platform.id}>
                    <platform.icon className="h-4 w-4" />
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Examples */}
          <div className="rounded-lg bg-muted/50 p-4">
            <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
              <IconInfoCircle className="h-4 w-4" />
              Example formats:
            </h4>
            <ul className="space-y-1">
              {selectedType.examples.map((example, i) => (
                <li key={i} className="text-sm text-muted-foreground">
                  • {example}
                </li>
              ))}
            </ul>
          </div>

          {/* Generated/Edited Post */}
          {currentPost ? (
            <div className="space-y-4">
              <div>
                <Label>Generated Post</Label>
                <Textarea
                  value={editedPosts[selectedType.id] || generatedPosts[selectedType.id]}
                  onChange={(e) => setEditedPosts(prev => ({
                    ...prev,
                    [selectedType.id]: e.target.value
                  }))}
                  className="mt-2 min-h-[150px]"
                  placeholder="Your generated post will appear here..."
                />
                <div className="flex items-center justify-between mt-2">
                  <span className={cn(
                    "text-sm",
                    characterCount > characterLimit ? "text-red-500" : "text-muted-foreground"
                  )}>
                    {characterCount} / {characterLimit} characters
                  </span>
                  {characterCount > characterLimit && (
                    <span className="text-sm text-red-500 flex items-center gap-1">
                      <IconAlertCircle className="h-4 w-4" />
                      Exceeds platform limit
                    </span>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => generatePost(selectedType)}
                >
                  <IconRefresh className="h-4 w-4 mr-2" />
                  Regenerate
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(currentPost, selectedType.id)}
                >
                  {copiedId === selectedType.id ? (
                    <IconCheck className="h-4 w-4 mr-2 text-green-600" />
                  ) : (
                    <IconCopy className="h-4 w-4 mr-2" />
                  )}
                  Copy
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleSavePost(selectedType.id)}
                >
                  Save to Project
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Button
                onClick={() => generatePost(selectedType)}
                disabled={isGenerating}
                size="lg"
              >
                {isGenerating ? (
                  <>
                    <IconLoader2 className="h-5 w-5 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <IconSparkles className="h-5 w-5 mr-2" />
                    Generate {selectedType.name}
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 