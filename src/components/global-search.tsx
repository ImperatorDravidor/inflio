"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  IconSearch,
  IconVideo,
  IconFolder,
  IconFileText,
  IconScissors,
  IconSparkles,
  IconCommand,
  IconArrowRight,
  IconClock,
  IconHistory,
  IconX
} from "@tabler/icons-react"
import { ProjectService } from "@/lib/db-migration"
import { Project } from "@/lib/project-types"
import { useAuth } from "@clerk/nextjs"
import { cn } from "@/lib/utils"

interface SearchResult {
  id: string
  title: string
  description?: string
  type: 'project' | 'clip' | 'blog' | 'action'
  icon: React.ComponentType<{ className?: string }>
  url: string
  metadata?: any
}

export function GlobalSearch() {
  const router = useRouter()
  const { userId } = useAuth()
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [loading, setLoading] = useState(false)

  // Open search with Cmd/Ctrl + K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen(true)
      }
      if (e.key === "Escape") {
        setOpen(false)
      }
    }
    
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('recentSearches')
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved))
      } catch (error) {
        console.error('Failed to parse recent searches:', error)
        setRecentSearches([])
      }
    }
  }, [])

  // Search functionality
  useEffect(() => {
    const searchProjects = async () => {
      if (!search || !userId) {
        setResults([])
        return
      }

      setLoading(true)
      try {
        const projects = await ProjectService.getAllProjects(userId)
        const query = search.toLowerCase()
        
        const projectResults: SearchResult[] = []
        
        projects.forEach(project => {
          // Search in project title
          if (project.title.toLowerCase().includes(query)) {
            projectResults.push({
              id: project.id,
              title: project.title,
              description: project.description,
              type: 'project',
              icon: IconVideo,
              url: `/projects/${project.id}`,
              metadata: project
            })
          }
          
          // Search in clips
          project.folders.clips.forEach(clip => {
            if (clip.title.toLowerCase().includes(query)) {
              projectResults.push({
                id: clip.id,
                title: clip.title,
                description: `Clip from ${project.title}`,
                type: 'clip',
                icon: IconScissors,
                url: `/projects/${project.id}?clip=${clip.id}`,
                metadata: { project, clip }
              })
            }
          })
          
          // Search in blog posts
          project.folders.blog.forEach(blog => {
            if (blog.title.toLowerCase().includes(query)) {
              projectResults.push({
                id: blog.id,
                title: blog.title,
                description: `Blog post from ${project.title}`,
                type: 'blog',
                icon: IconFileText,
                url: `/projects/${project.id}?blog=${blog.id}`,
                metadata: { project, blog }
              })
            }
          })
        })

        // Add action results
        const actions: SearchResult[] = [
          {
            id: 'upload',
            title: 'Upload New Video',
            description: 'Start a new project',
            type: 'action' as const,
            icon: IconVideo,
            url: '/studio/upload'
          },
          {
            id: 'dashboard',
            title: 'Go to Dashboard',
            description: 'View your dashboard',
            type: 'action' as const,
            icon: IconFolder,
            url: '/dashboard'
          },
          {
            id: 'projects',
            title: 'View All Projects',
            description: 'Browse all your projects',
            type: 'action' as const,
            icon: IconFolder,
            url: '/projects'
          }
        ].filter(action => 
          action.title.toLowerCase().includes(query) ||
          action.description?.toLowerCase().includes(query)
        )

        setResults([...projectResults, ...actions].slice(0, 8))
      } catch (error) {
        console.error('Search error:', error)
      } finally {
        setLoading(false)
      }
    }

    const debounce = setTimeout(searchProjects, 300)
    return () => clearTimeout(debounce)
  }, [search, userId])

  // Handle selection
  const handleSelect = useCallback((result: SearchResult) => {
    // Save to recent searches
    const newRecent = [search, ...recentSearches.filter(s => s !== search)].slice(0, 5)
    setRecentSearches(newRecent)
    localStorage.setItem('recentSearches', JSON.stringify(newRecent))
    
    // Navigate
    router.push(result.url)
    setOpen(false)
    setSearch("")
  }, [search, recentSearches, router])

  // Keyboard navigation
  useEffect(() => {
    if (!open) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault()
        setSelectedIndex(i => Math.min(i + 1, results.length - 1))
      }
      if (e.key === "ArrowUp") {
        e.preventDefault()
        setSelectedIndex(i => Math.max(i - 1, 0))
      }
      if (e.key === "Enter" && results[selectedIndex]) {
        e.preventDefault()
        handleSelect(results[selectedIndex])
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [open, results, selectedIndex, handleSelect])

  return (
    <>
      {/* Search Trigger */}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground border rounded-lg hover:border-primary/50 hover:text-foreground transition-colors"
      >
        <IconSearch className="h-4 w-4" />
        <span className="hidden md:inline">Search...</span>
        <kbd className="hidden md:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-xs bg-muted rounded">
          <IconCommand className="h-3 w-3" />K
        </kbd>
      </button>

      {/* Search Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl p-0 overflow-hidden">
          <DialogTitle className="sr-only">Search</DialogTitle>
          {/* Search Input */}
          <div className="p-4 border-b">
            <div className="relative">
              <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search projects, clips, blog posts..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setSelectedIndex(0)
                }}
                className="pl-10 pr-4 h-12 text-base border-0 focus-visible:ring-0"
                autoFocus
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-muted rounded"
                  aria-label="Clear search"
                >
                  <IconX className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Results */}
          <div className="max-h-[400px] overflow-y-auto">
            <AnimatePresence mode="popLayout">
              {loading ? (
                <div className="p-8 text-center text-muted-foreground">
                  <IconSearch className="h-8 w-8 mx-auto mb-2 animate-pulse" />
                  <p>Searching...</p>
                </div>
              ) : results.length > 0 ? (
                <div className="p-2">
                  {results.map((result, index) => {
                    const Icon = result.icon
                    return (
                      <motion.button
                        key={result.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => handleSelect(result)}
                        onMouseEnter={() => setSelectedIndex(index)}
                        className={cn(
                          "w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-colors",
                          selectedIndex === index
                            ? "bg-accent text-accent-foreground"
                            : "hover:bg-accent/50"
                        )}
                      >
                        <div className={cn(
                          "p-2 rounded-lg",
                          selectedIndex === index
                            ? "bg-background/80"
                            : "bg-muted"
                        )}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium line-clamp-1">{result.title}</p>
                          {result.description && (
                            <p className="text-sm text-muted-foreground line-clamp-1">
                              {result.description}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">
                            {result.type}
                          </Badge>
                          {selectedIndex === index && (
                            <IconArrowRight className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                      </motion.button>
                    )
                  })}
                </div>
              ) : search ? (
                <div className="p-8 text-center text-muted-foreground">
                  <IconSearch className="h-8 w-8 mx-auto mb-2" />
                  <p>No results found for "{search}"</p>
                  <p className="text-sm mt-1">Try searching with different keywords</p>
                </div>
              ) : recentSearches.length > 0 ? (
                <div className="p-4">
                  <p className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                    <IconHistory className="h-4 w-4" />
                    Recent Searches
                  </p>
                  <div className="space-y-1">
                    {recentSearches.map((recent, index) => (
                      <button
                        key={index}
                        onClick={() => setSearch(recent)}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-sm hover:bg-accent/50 transition-colors"
                      >
                        <IconClock className="h-4 w-4 text-muted-foreground" />
                        {recent}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center text-muted-foreground">
                  <IconSparkles className="h-8 w-8 mx-auto mb-2" />
                  <p>Start typing to search</p>
                  <p className="text-sm mt-1">
                    Press <kbd className="px-1.5 py-0.5 text-xs bg-muted rounded">ESC</kbd> to close
                  </p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
} 