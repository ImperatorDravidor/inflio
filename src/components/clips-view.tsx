"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  IconSearch,
  IconFilter,
  IconShare,
  IconTrash,
  IconEye,
  IconClock,
  IconCheck,
  IconX,
  IconPlayerPlay,
  IconPlayerPause,
  IconVolume,
  IconVolumeOff,
  IconMaximize,
  IconGrid3x3,
  IconList,
  IconSortAscending,
  IconSend,
  IconBrandInstagram,
  IconBrandYoutube,
  IconBrandTiktok,
  IconBrandLinkedin,
  IconBrandTwitter,
  IconCalendar,
  IconWand
} from "@tabler/icons-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { format } from "date-fns"

interface Clip {
  id: string
  title: string
  description: string
  duration: number
  url: string
  thumbnail: string
  created_at: Date
  status: 'processing' | 'ready' | 'failed'
  platforms?: string[]
  scheduled_date?: Date
  published_date?: Date
  engagement?: {
    views: number
    likes: number
    shares: number
    comments: number
  }
}

interface ClipsViewProps {
  clips: Clip[]
  loading?: boolean
}

export function ClipsView({ clips, loading = false }: ClipsViewProps) {
  const [selectedClips, setSelectedClips] = useState(new Set<string>())
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [sortBy, setSortBy] = useState<string>("created_at")
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showScheduleDialog, setShowScheduleDialog] = useState(false)
  const [selectedClipForScheduling, setSelectedClipForScheduling] = useState<Clip | null>(null)

  const filteredClips = clips.filter(clip => {
    const matchesSearch = clip.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         clip.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || clip.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const sortedClips = [...filteredClips].sort((a, b) => {
    switch (sortBy) {
      case 'title':
        return a.title.localeCompare(b.title)
      case 'duration':
        return b.duration - a.duration
      case 'created_at':
      default:
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    }
  })

  const handleSelectClip = (clipId: string) => {
    const newSelection = new Set(selectedClips)
    if (newSelection.has(clipId)) {
      newSelection.delete(clipId)
    } else {
      newSelection.add(clipId)
    }
    setSelectedClips(newSelection)
  }

  const handleSelectAll = () => {
    if (selectedClips.size === sortedClips.length) {
      setSelectedClips(new Set())
    } else {
      setSelectedClips(new Set(sortedClips.map(clip => clip.id)))
    }
  }

  const handleBulkAction = (action: 'share' | 'delete' | 'schedule') => {
    if (selectedClips.size === 0) {
      toast.error('Please select clips first')
      return
    }

    switch (action) {
      case 'share':
        toast.info(`Sharing ${selectedClips.size} clips to social media...`)
        // Implement bulk social media sharing
        break
      case 'schedule':
        toast.info(`Scheduling ${selectedClips.size} clips...`)
        // Implement bulk scheduling
        break
      case 'delete':
        toast.info(`Deleting ${selectedClips.size} clips...`)
        // Implement bulk delete
        break
    }
    setSelectedClips(new Set())
  }

  const handleScheduleClip = (clip: Clip) => {
    setSelectedClipForScheduling(clip)
    setShowScheduleDialog(true)
  }

  const handleShareToSocial = (clip: Clip) => {
    toast.info(`Sharing "${clip.title}" to social media...`)
    // Navigate to compose page with clip data
    const params = new URLSearchParams({
      content: `Check out this amazing clip: ${clip.title}`,
      media: clip.url,
      thumbnail: clip.thumbnail
    })
    window.open(`/social/compose?${params.toString()}`, '_blank')
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'processing':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
      case 'ready':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
      case 'failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
    }
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="bg-gray-200 dark:bg-gray-700 rounded-lg h-40 mb-4" />
              <div className="space-y-2">
                <div className="bg-gray-200 dark:bg-gray-700 rounded h-4 w-3/4" />
                <div className="bg-gray-200 dark:bg-gray-700 rounded h-3 w-1/2" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative">
            <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search clips..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-[300px]"
            />
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="ready">Ready</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="created_at">Latest</SelectItem>
              <SelectItem value="title">Title</SelectItem>
              <SelectItem value="duration">Duration</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          {selectedClips.size > 0 && (
            <div className="flex items-center gap-2 mr-4">
              <span className="text-sm text-muted-foreground">
                {selectedClips.size} selected
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleBulkAction('schedule')}
              >
                <IconCalendar className="h-4 w-4 mr-2" />
                Schedule
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleBulkAction('share')}
              >
                <IconShare className="h-4 w-4 mr-2" />
                Share
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => handleBulkAction('delete')}
              >
                <IconTrash className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
          )}

          <div className="flex items-center border rounded-lg">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="rounded-r-none"
            >
              <IconGrid3x3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="rounded-l-none"
            >
              <IconList className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Select All */}
      {sortedClips.length > 0 && (
        <div className="flex items-center gap-2">
          <Checkbox
            checked={selectedClips.size === sortedClips.length}
            onCheckedChange={handleSelectAll}
          />
          <span className="text-sm text-muted-foreground">
            Select all ({sortedClips.length} clips)
          </span>
        </div>
      )}

      {/* Clips Grid/List */}
      {sortedClips.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <IconEye className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No clips found</h3>
            <p className="text-muted-foreground text-center max-w-md">
              {searchQuery || statusFilter !== 'all' 
                ? "Try adjusting your search or filters"
                : "Start by processing a video to generate clips"
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className={cn(
          viewMode === 'grid' 
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            : "space-y-4"
        )}>
          <AnimatePresence>
            {sortedClips.map((clip) => (
              <motion.div
                key={clip.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
              >
                <Card className={cn(
                  "group hover:shadow-lg transition-all duration-200",
                  selectedClips.has(clip.id) && "ring-2 ring-primary",
                  viewMode === 'list' && "flex flex-row"
                )}>
                  <div className={cn(
                    "relative",
                    viewMode === 'grid' ? "aspect-video" : "w-48 flex-shrink-0"
                  )}>
                    <img
                      src={clip.thumbnail}
                      alt={clip.title}
                      className="w-full h-full object-cover rounded-t-lg"
                    />
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity rounded-t-lg">
                      <div className="absolute bottom-3 right-3">
                        <span className="bg-black/70 text-white text-xs px-2 py-1 rounded">
                          {formatDuration(clip.duration)}
                        </span>
                      </div>
                      <div className="absolute top-3 left-3">
                        <Checkbox
                          checked={selectedClips.has(clip.id)}
                          onCheckedChange={() => handleSelectClip(clip.id)}
                          className="bg-white/90"
                        />
                      </div>
                                             <div className="absolute inset-0 flex items-center justify-center">
                         <Button size="sm" variant="secondary" className="bg-white/90">
                           <IconPlayerPlay className="h-4 w-4" />
                         </Button>
                       </div>
                    </div>
                  </div>

                  <CardContent className={cn(
                    "p-4",
                    viewMode === 'list' && "flex-1"
                  )}>
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-sm line-clamp-2 flex-1">
                        {clip.title}
                      </h3>
                      <Badge className={cn("text-xs ml-2", getStatusColor(clip.status))}>
                        {clip.status}
                      </Badge>
                    </div>

                    <p className="text-muted-foreground text-xs line-clamp-2 mb-3">
                      {clip.description}
                    </p>

                    {clip.engagement && (
                      <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                        <span>{clip.engagement.views} views</span>
                        <span>{clip.engagement.likes} likes</span>
                        <span>{clip.engagement.shares} shares</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {format(clip.created_at, 'MMM d, yyyy')}
                      </span>
                      
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleShareToSocial(clip)}
                          className="h-8 w-8 p-0"
                        >
                          <IconSend className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleScheduleClip(clip)}
                          className="h-8 w-8 p-0"
                        >
                          <IconCalendar className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0"
                        >
                          <IconWand className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
} 