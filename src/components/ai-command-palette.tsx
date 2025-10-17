'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command'
import { Button } from '@/components/ui/button'
import {
  Sparkles, Upload, Video, FileText, Calendar, BarChart3,
  Settings, User, Home, Search, Plus, Zap, MessageSquare,
  Share2, Brain, Wand2, Target, TrendingUp, Clock,
  ChevronRight, Loader2, Check, X, ArrowRight
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface AICommandPaletteProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

interface QuickAction {
  id: string
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  shortcut?: string
  action: () => void | Promise<void>
  category: 'create' | 'navigate' | 'ai' | 'analyze'
}

export function AICommandPalette({ open, onOpenChange }: AICommandPaletteProps) {
  const [isOpen, setIsOpen] = useState(open || false)
  const [query, setQuery] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [aiMode, setAiMode] = useState(false)
  const router = useRouter()

  // Listen for keyboard shortcut
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setIsOpen((open) => !open)
      }
    }

    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  useEffect(() => {
    if (open !== undefined) {
      setIsOpen(open)
    }
  }, [open])

  const handleOpenChange = useCallback((open: boolean) => {
    setIsOpen(open)
    onOpenChange?.(open)
    if (!open) {
      setQuery('')
      setAiMode(false)
    }
  }, [onOpenChange])

  const quickActions: QuickAction[] = [
    // Create Actions
    {
      id: 'upload-video',
      title: 'Upload Video',
      description: 'Process a new video with AI',
      icon: Upload,
      shortcut: '⌘U',
      category: 'create',
      action: () => {
        router.push('/studio/upload')
        handleOpenChange(false)
      }
    },
    {
      id: 'generate-content',
      title: 'Generate Content',
      description: 'Create content from scratch with AI',
      icon: Sparkles,
      shortcut: '⌘G',
      category: 'create',
      action: () => {
        router.push('/social/compose')
        handleOpenChange(false)
      }
    },
    {
      id: 'schedule-post',
      title: 'Schedule Post',
      description: 'Plan your content calendar',
      icon: Calendar,
      category: 'create',
      action: () => {
        router.push('/social/calendar')
        handleOpenChange(false)
      }
    },
    {
      id: 'create-blog',
      title: 'Write Blog Post',
      description: 'AI-powered blog writing',
      icon: FileText,
      category: 'create',
      action: () => {
        toast.info('Opening blog editor...')
        handleOpenChange(false)
      }
    },

    // Navigate Actions
    {
      id: 'go-dashboard',
      title: 'Dashboard',
      description: 'View your overview',
      icon: Home,
      shortcut: '⌘D',
      category: 'navigate',
      action: () => {
        router.push('/dashboard')
        handleOpenChange(false)
      }
    },
    {
      id: 'go-projects',
      title: 'My Videos',
      description: 'View all your projects',
      icon: Video,
      category: 'navigate',
      action: () => {
        router.push('/projects')
        handleOpenChange(false)
      }
    },
    {
      id: 'go-analytics',
      title: 'Analytics',
      description: 'Track performance',
      icon: BarChart3,
      category: 'navigate',
      action: () => {
        router.push('/analytics')
        handleOpenChange(false)
      }
    },
    {
      id: 'go-settings',
      title: 'Settings',
      description: 'Manage your account',
      icon: Settings,
      category: 'navigate',
      action: () => {
        router.push('/settings')
        handleOpenChange(false)
      }
    },

    // AI Actions
    {
      id: 'ai-chat',
      title: 'Ask AI Assistant',
      description: 'Get help with anything',
      icon: MessageSquare,
      shortcut: '⌘?',
      category: 'ai',
      action: () => {
        setAiMode(true)
      }
    },
    {
      id: 'ai-ideas',
      title: 'Generate Ideas',
      description: 'Get content suggestions',
      icon: Brain,
      category: 'ai',
      action: async () => {
        setIsProcessing(true)
        toast.info('Generating content ideas...')
        setTimeout(() => {
          toast.success('5 new content ideas generated!')
          setIsProcessing(false)
          handleOpenChange(false)
        }, 2000)
      }
    },
    {
      id: 'ai-optimize',
      title: 'Optimize Content',
      description: 'Improve existing content',
      icon: Wand2,
      category: 'ai',
      action: () => {
        toast.info('Select content to optimize')
        handleOpenChange(false)
      }
    },
    {
      id: 'ai-trends',
      title: 'Trending Topics',
      description: 'Discover what\'s popular',
      icon: TrendingUp,
      category: 'ai',
      action: async () => {
        setIsProcessing(true)
        toast.info('Analyzing trends...')
        setTimeout(() => {
          toast.success('Found 10 trending topics in your niche!')
          setIsProcessing(false)
          handleOpenChange(false)
        }, 1500)
      }
    },

    // Analyze Actions
    {
      id: 'analyze-performance',
      title: 'Performance Report',
      description: 'Get detailed insights',
      icon: BarChart3,
      category: 'analyze',
      action: () => {
        router.push('/analytics')
        handleOpenChange(false)
      }
    },
    {
      id: 'analyze-audience',
      title: 'Audience Insights',
      description: 'Understand your followers',
      icon: Target,
      category: 'analyze',
      action: () => {
        toast.info('Generating audience report...')
        handleOpenChange(false)
      }
    },
    {
      id: 'analyze-competition',
      title: 'Competitor Analysis',
      description: 'See what others are doing',
      icon: Search,
      category: 'analyze',
      action: () => {
        toast.info('Analyzing competitors...')
        handleOpenChange(false)
      }
    }
  ]

  const handleAIQuery = async () => {
    if (!query.trim()) return
    
    setIsProcessing(true)
    
    // Simulate AI processing
    setTimeout(() => {
      toast.success(`AI is working on: "${query}"`)
      setIsProcessing(false)
      handleOpenChange(false)
    }, 2000)
  }

  const filteredActions = quickActions.filter(action => {
    const searchTerms = query.toLowerCase()
    return (
      action.title.toLowerCase().includes(searchTerms) ||
      action.description.toLowerCase().includes(searchTerms)
    )
  })

  const groupedActions = {
    create: filteredActions.filter(a => a.category === 'create'),
    navigate: filteredActions.filter(a => a.category === 'navigate'),
    ai: filteredActions.filter(a => a.category === 'ai'),
    analyze: filteredActions.filter(a => a.category === 'analyze')
  }

  return (
    <CommandDialog open={isOpen} onOpenChange={handleOpenChange}>
      <div className="relative">
        {/* AI Mode Indicator */}
        {aiMode && (
          <div className="absolute top-0 left-0 right-0 p-3 bg-gradient-to-r from-primary/10 to-purple-500/10 border-b">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">AI Assistant Mode</p>
                <p className="text-xs text-muted-foreground">Ask me anything about your content</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setAiMode(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        <Command className={cn(aiMode && "pt-16")}>
          <CommandInput
            placeholder={aiMode ? "Ask AI anything..." : "Search for actions or type a command..."}
            value={query}
            onValueChange={setQuery}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && aiMode) {
                e.preventDefault()
                handleAIQuery()
              }
            }}
          />
          
          <CommandList>
            {aiMode ? (
              <div className="p-4">
                {query.trim() ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">
                        Press Enter to ask AI
                      </p>
                      {isProcessing && (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      )}
                    </div>
                    
                    {/* AI Suggestions based on query */}
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground">Suggested actions:</p>
                      {query.toLowerCase().includes('video') && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full justify-start"
                          onClick={() => {
                            router.push('/studio/upload')
                            handleOpenChange(false)
                          }}
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Upload a video
                        </Button>
                      )}
                      {query.toLowerCase().includes('post') && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full justify-start"
                          onClick={() => {
                            router.push('/social/compose')
                            handleOpenChange(false)
                          }}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Create a post
                        </Button>
                      )}
                      {query.toLowerCase().includes('analytic') && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full justify-start"
                          onClick={() => {
                            router.push('/analytics')
                            handleOpenChange(false)
                          }}
                        >
                          <BarChart3 className="h-4 w-4 mr-2" />
                          View analytics
                        </Button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Try asking me:
                    </p>
                    <div className="space-y-2">
                      {[
                        "What content should I create today?",
                        "How can I improve my engagement?",
                        "Generate ideas for LinkedIn posts",
                        "What's trending in my niche?",
                        "Analyze my best performing content"
                      ].map((suggestion) => (
                        <Button
                          key={suggestion}
                          variant="ghost"
                          size="sm"
                          className="w-full justify-start text-left"
                          onClick={() => setQuery(suggestion)}
                        >
                          <ChevronRight className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span className="text-xs">{suggestion}</span>
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                <CommandEmpty>
                  <div className="text-center py-6">
                    <p className="text-sm text-muted-foreground mb-4">
                      No results found
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setAiMode(true)}
                    >
                      <Sparkles className="h-4 w-4 mr-2" />
                      Ask AI Instead
                    </Button>
                  </div>
                </CommandEmpty>

                {groupedActions.create.length > 0 && (
                  <CommandGroup heading="Create">
                    {groupedActions.create.map((action) => {
                      const Icon = action.icon
                      return (
                        <CommandItem
                          key={action.id}
                          onSelect={action.action}
                          className="cursor-pointer"
                        >
                          <Icon className="mr-2 h-4 w-4" />
                          <div className="flex-1">
                            <p className="text-sm font-medium">{action.title}</p>
                            <p className="text-xs text-muted-foreground">{action.description}</p>
                          </div>
                          {action.shortcut && (
                            <CommandShortcut>{action.shortcut}</CommandShortcut>
                          )}
                        </CommandItem>
                      )
                    })}
                  </CommandGroup>
                )}

                {groupedActions.ai.length > 0 && (
                  <>
                    <CommandSeparator />
                    <CommandGroup heading="AI Assistant">
                      {groupedActions.ai.map((action) => {
                        const Icon = action.icon
                        return (
                          <CommandItem
                            key={action.id}
                            onSelect={action.action}
                            className="cursor-pointer"
                            disabled={isProcessing}
                          >
                            <Icon className="mr-2 h-4 w-4" />
                            <div className="flex-1">
                              <p className="text-sm font-medium">{action.title}</p>
                              <p className="text-xs text-muted-foreground">{action.description}</p>
                            </div>
                            {action.shortcut && (
                              <CommandShortcut>{action.shortcut}</CommandShortcut>
                            )}
                          </CommandItem>
                        )
                      })}
                    </CommandGroup>
                  </>
                )}

                {groupedActions.navigate.length > 0 && (
                  <>
                    <CommandSeparator />
                    <CommandGroup heading="Navigate">
                      {groupedActions.navigate.map((action) => {
                        const Icon = action.icon
                        return (
                          <CommandItem
                            key={action.id}
                            onSelect={action.action}
                            className="cursor-pointer"
                          >
                            <Icon className="mr-2 h-4 w-4" />
                            <div className="flex-1">
                              <p className="text-sm font-medium">{action.title}</p>
                              <p className="text-xs text-muted-foreground">{action.description}</p>
                            </div>
                            {action.shortcut && (
                              <CommandShortcut>{action.shortcut}</CommandShortcut>
                            )}
                          </CommandItem>
                        )
                      })}
                    </CommandGroup>
                  </>
                )}

                {groupedActions.analyze.length > 0 && (
                  <>
                    <CommandSeparator />
                    <CommandGroup heading="Analyze">
                      {groupedActions.analyze.map((action) => {
                        const Icon = action.icon
                        return (
                          <CommandItem
                            key={action.id}
                            onSelect={action.action}
                            className="cursor-pointer"
                          >
                            <Icon className="mr-2 h-4 w-4" />
                            <div className="flex-1">
                              <p className="text-sm font-medium">{action.title}</p>
                              <p className="text-xs text-muted-foreground">{action.description}</p>
                            </div>
                          </CommandItem>
                        )
                      })}
                    </CommandGroup>
                  </>
                )}
              </>
            )}
          </CommandList>
        </Command>

        {/* Footer with shortcuts */}
        <div className="border-t p-3 flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-muted font-mono">⌘K</kbd>
              <span>to open</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-muted font-mono">ESC</kbd>
              <span>to close</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="h-3 w-3" />
            <span>AI-powered</span>
          </div>
        </div>
      </div>
    </CommandDialog>
  )
}
