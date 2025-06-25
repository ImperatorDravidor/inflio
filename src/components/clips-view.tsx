"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
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
  IconWand,
  IconDownload,
  IconSparkles,
  IconTrendingUp,
  IconTarget,
  IconUsers,
  IconHeart,
  IconMessageCircle,
  IconShare2,
  IconChartBar,
  IconSettings,
  IconStars,
  IconBolt,
  IconFlame,
  IconCrown,
  IconPalette,
  IconFileText,
  IconMusic,
  IconVolume2,
  IconPictureInPicture,
  IconRotateClockwise,
  IconActivityHeartbeat,
  IconChartLine
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
  score?: number
  viralityExplanation?: string
  transcript?: string
  tags?: string[]
  engagement?: {
    views: number
    likes: number
    shares: number
    comments: number
    estimatedReach?: number
    engagementRate?: number
  }
  analytics?: {
    bestTimeToPost?: string
    optimalPlatforms?: string[]
    expectedViews?: number
    trendingScore?: number
    competitorAnalysis?: string
  }
  exportOptions?: {
    formats: string[]
    qualities: string[]
    aspectRatios: string[]
  }
}

interface ClipsViewProps {
  clips: Clip[]
  loading?: boolean
  onClipSelect?: (clip: Clip) => void
  onBulkAction?: (action: string, clipIds: string[]) => void
}

interface VideoPlayerState {
  isPlaying: boolean
  isMuted: boolean
  volume: number
  currentTime: number
  duration: number
  isFullscreen: boolean
  playbackRate: number
  showControls: boolean
}

export function ClipsView({ clips, loading = false, onClipSelect, onBulkAction }: ClipsViewProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('score')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [selectedClips, setSelectedClips] = useState<Set<string>>(new Set())
  const [showFilters, setShowFilters] = useState(false)
  const [selectedClipForScheduling, setSelectedClipForScheduling] = useState<Clip | null>(null)
  const [showScheduleDialog, setShowScheduleDialog] = useState(false)
  const [showAdvancedAnalytics, setShowAdvancedAnalytics] = useState(false)
  const [previewClip, setPreviewClip] = useState<Clip | null>(null)
  const [playerState, setPlayerState] = useState<VideoPlayerState>({
    isPlaying: false,
    isMuted: false,
    volume: 1,
    currentTime: 0,
    duration: 0,
    isFullscreen: false,
    playbackRate: 1,
    showControls: true
  })
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const [scoreFilter, setScoreFilter] = useState<number[]>([0])
  const [durationFilter, setDurationFilter] = useState<number[]>([0, 300])
  const [platformFilter, setPlatformFilter] = useState<string>('all')

  // Enhanced filtering logic
  const filteredClips = clips.filter(clip => {
    const matchesSearch = clip.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         clip.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         clip.transcript?.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || clip.status === statusFilter
    
    const matchesScore = !clip.score || (clip.score * 100) >= scoreFilter[0]
    
    const matchesDuration = clip.duration >= durationFilter[0] && clip.duration <= durationFilter[1]
    
    const matchesPlatform = platformFilter === 'all' || 
                           clip.platforms?.includes(platformFilter) ||
                           clip.analytics?.optimalPlatforms?.includes(platformFilter)
    
    return matchesSearch && matchesStatus && matchesScore && matchesDuration && matchesPlatform
  })

  // Enhanced sorting
  const sortedClips = [...filteredClips].sort((a, b) => {
    switch (sortBy) {
      case 'score':
        return (b.score || 0) - (a.score || 0)
      case 'duration':
        return b.duration - a.duration
      case 'created':
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      case 'engagement':
        return (b.engagement?.estimatedReach || 0) - (a.engagement?.estimatedReach || 0)
      case 'trending':
        return (b.analytics?.trendingScore || 0) - (a.analytics?.trendingScore || 0)
      default:
        return 0
    }
  })

  const handleBulkAction = (action: 'share' | 'delete' | 'schedule' | 'export' | 'analyze') => {
    if (selectedClips.size === 0) {
      toast.error('Please select clips first')
      return
    }

    const clipIds = Array.from(selectedClips)
    onBulkAction?.(action, clipIds)

    switch (action) {
      case 'share':
        toast.success(`Sharing ${selectedClips.size} clips to social media...`)
        break
      case 'schedule':
        toast.info(`Opening scheduler for ${selectedClips.size} clips...`)
        break
      case 'delete':
        toast.info(`Deleting ${selectedClips.size} clips...`)
        break
      case 'export':
        toast.info(`Exporting ${selectedClips.size} clips...`)
        break
      case 'analyze':
        setShowAdvancedAnalytics(true)
        break
    }
    setSelectedClips(new Set())
  }

  const handleClipAction = (clip: Clip, action: 'preview' | 'share' | 'schedule' | 'export' | 'analyze') => {
    switch (action) {
      case 'preview':
        setPreviewClip(clip)
        break
      case 'share':
        window.open(`/social/compose?clipId=${clip.id}`, '_blank')
        break
      case 'schedule':
        setSelectedClipForScheduling(clip)
        setShowScheduleDialog(true)
        break
      case 'export':
        toast.info(`Exporting "${clip.title}"...`)
        break
      case 'analyze':
        onClipSelect?.(clip)
        break
    }
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

  const getScoreColor = (score: number) => {
    if (score >= 0.9) return 'text-red-500'
    if (score >= 0.7) return 'text-orange-500' 
    if (score >= 0.5) return 'text-yellow-500'
    return 'text-gray-500'
  }

  const getScoreBadge = (score: number) => {
    if (score >= 0.95) return { icon: IconCrown, text: 'Viral Gold', class: 'bg-gradient-to-r from-yellow-400 to-orange-500' }
    if (score >= 0.9) return { icon: IconFlame, text: 'Viral', class: 'bg-gradient-to-r from-red-500 to-pink-500' }
    if (score >= 0.8) return { icon: IconBolt, text: 'Hot', class: 'bg-gradient-to-r from-orange-500 to-red-500' }
    if (score >= 0.7) return { icon: IconTrendingUp, text: 'Trending', class: 'bg-gradient-to-r from-blue-500 to-purple-500' }
    if (score >= 0.5) return { icon: IconStars, text: 'Good', class: 'bg-gradient-to-r from-green-500 to-blue-500' }
    return { icon: IconTarget, text: 'Potential', class: 'bg-gradient-to-r from-gray-500 to-gray-600' }
  }

  const exportFormats = [
    { id: 'mp4', name: 'MP4 (Standard)', description: 'Best for most platforms' },
    { id: 'mov', name: 'MOV (High Quality)', description: 'Apple devices, professional use' },
    { id: 'webm', name: 'WebM (Web)', description: 'Optimized for web streaming' },
    { id: 'gif', name: 'GIF (Animation)', description: 'Short loops, memes' }
  ]

  const aspectRatios = [
    { id: '16:9', name: 'Landscape (16:9)', platforms: ['YouTube', 'LinkedIn'] },
    { id: '9:16', name: 'Portrait (9:16)', platforms: ['TikTok', 'Instagram Stories'] },
    { id: '1:1', name: 'Square (1:1)', platforms: ['Instagram', 'Facebook'] },
    { id: '4:5', name: 'Vertical (4:5)', platforms: ['Instagram Feed'] }
  ]

  const qualityOptions = [
    { id: '1080p', name: '1080p (HD)', size: '~50MB', description: 'High quality, larger file' },
    { id: '720p', name: '720p (Standard)', size: '~25MB', description: 'Good quality, balanced size' },
    { id: '480p', name: '480p (Compact)', size: '~10MB', description: 'Lower quality, small file' }
  ]

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header skeleton */}
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <div className="h-8 w-48 bg-muted animate-pulse rounded" />
            <div className="h-4 w-64 bg-muted animate-pulse rounded" />
          </div>
          <div className="flex gap-2">
            <div className="h-10 w-24 bg-muted animate-pulse rounded" />
            <div className="h-10 w-24 bg-muted animate-pulse rounded" />
          </div>
        </div>

        {/* Clips grid skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <div className="aspect-video bg-muted animate-pulse" />
              <CardContent className="p-4 space-y-3">
                <div className="h-4 w-3/4 bg-muted animate-pulse rounded" />
                <div className="h-3 w-full bg-muted animate-pulse rounded" />
                <div className="h-3 w-2/3 bg-muted animate-pulse rounded" />
                <div className="flex gap-2">
                  <div className="h-8 w-16 bg-muted animate-pulse rounded" />
                  <div className="h-8 w-16 bg-muted animate-pulse rounded" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Enhanced Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-3xl font-bold tracking-tight">
              {clips.length} AI-Generated Clips
            </h2>
            <Badge variant="secondary" className="bg-primary/10 text-primary">
              <IconSparkles className="h-3 w-3 mr-1" />
              AI Powered
            </Badge>
          </div>
          <p className="text-muted-foreground">
            Optimized for viral potential • Smart analytics • Multi-platform ready
          </p>
        </div>
        
        <div className="flex items-center gap-2 flex-wrap">
          {selectedClips.size > 0 && (
            <div className="flex items-center gap-2 mr-4">
              <Badge variant="secondary">{selectedClips.size} selected</Badge>
              <Button size="sm" variant="outline" onClick={() => handleBulkAction('export')}>
                <IconDownload className="h-4 w-4 mr-1" />
                Export
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleBulkAction('share')}>
                <IconShare className="h-4 w-4 mr-1" />
                Share
              </Button>
              <Button size="sm" variant="destructive" onClick={() => handleBulkAction('delete')}>
                <IconTrash className="h-4 w-4 mr-1" />
                Delete
              </Button>
            </div>
          )}
          
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grid')}
          >
            <IconGrid3x3 className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            <IconList className="h-4 w-4" />
          </Button>
          
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm">
                <IconFilter className="h-4 w-4 mr-1" />
                Filters
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-4">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Viral Score Range</label>
                  <Slider
                    value={scoreFilter}
                    onValueChange={setScoreFilter}
                    max={100}
                    step={5}
                    className="mb-2"
                  />
                  <div className="text-xs text-muted-foreground">
                    Min score: {scoreFilter[0]}%
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Duration Range</label>
                  <Slider
                    value={durationFilter}
                    onValueChange={setDurationFilter}
                    max={300}
                    step={15}
                    className="mb-2"
                  />
                  <div className="text-xs text-muted-foreground">
                    {formatDuration(durationFilter[0])} - {formatDuration(durationFilter[1])}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Platform</label>
                  <Select value={platformFilter} onValueChange={setPlatformFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Platforms</SelectItem>
                      <SelectItem value="tiktok">TikTok</SelectItem>
                      <SelectItem value="instagram">Instagram</SelectItem>
                      <SelectItem value="youtube">YouTube Shorts</SelectItem>
                      <SelectItem value="twitter">Twitter</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Search and Sort Bar */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search clips, descriptions, or transcript content..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="score">Viral Score</SelectItem>
            <SelectItem value="duration">Duration</SelectItem>
            <SelectItem value="created">Recently Created</SelectItem>
            <SelectItem value="engagement">Expected Reach</SelectItem>
            <SelectItem value="trending">Trending Score</SelectItem>
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="ready">Ready</SelectItem>
            <SelectItem value="processing">Processing</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Analytics Overview */}
      {clips.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconChartBar className="h-5 w-5" />
              Performance Analytics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {clips.filter(c => (c.score || 0) >= 0.8).length}
                </div>
                <div className="text-sm text-muted-foreground">High Viral Potential</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {Math.round(clips.reduce((acc, c) => acc + (c.engagement?.estimatedReach || 0), 0) / 1000)}K
                </div>
                <div className="text-sm text-muted-foreground">Total Est. Reach</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {formatDuration(clips.reduce((acc, c) => acc + c.duration, 0))}
                </div>
                <div className="text-sm text-muted-foreground">Total Content</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {Math.round((clips.reduce((acc, c) => acc + (c.score || 0), 0) / clips.length) * 100)}%
                </div>
                <div className="text-sm text-muted-foreground">Avg. Viral Score</div>
              </div>
            </div>
          </CardContent>
        </Card>
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
            {sortedClips.map((clip, index) => {
              const scoreBadge = getScoreBadge(clip.score || 0)
              const ScoreIcon = scoreBadge.icon
              
              return (
                <motion.div
                  key={clip.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                >
                  <Card className={cn(
                    "group hover:shadow-xl transition-all duration-300 overflow-hidden border-0 bg-gradient-to-br from-background to-muted/20",
                    selectedClips.has(clip.id) && "ring-2 ring-primary shadow-primary/25",
                    viewMode === 'list' && "flex flex-row"
                  )}>
                    <div className={cn(
                      "relative overflow-hidden",
                      viewMode === 'grid' ? "aspect-video" : "w-48 flex-shrink-0"
                    )}>
                      {/* Thumbnail with play overlay */}
                      <img
                        src={clip.thumbnail}
                        alt={clip.title}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      
                      {/* Gradient overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                      
                      {/* Play button overlay */}
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <Button
                          size="lg"
                          className="rounded-full bg-white/20 backdrop-blur-sm text-white border-white/30 hover:bg-white/30"
                          onClick={() => handleClipAction(clip, 'preview')}
                        >
                          <IconPlayerPlay className="h-6 w-6" />
                        </Button>
                      </div>
                      
                      {/* Selection checkbox */}
                      <div className="absolute top-3 left-3">
                        <Checkbox
                          checked={selectedClips.has(clip.id)}
                          onCheckedChange={(checked) => {
                            const newSelected = new Set(selectedClips)
                            if (checked) {
                              newSelected.add(clip.id)
                            } else {
                              newSelected.delete(clip.id)
                            }
                            setSelectedClips(newSelected)
                          }}
                          className="bg-white/80 border-white/50"
                        />
                      </div>
                      
                      {/* Viral score badge */}
                      <div className="absolute top-3 right-3">
                        <Badge className={cn("text-white border-0", scoreBadge.class)}>
                          <ScoreIcon className="h-3 w-3 mr-1" />
                          {Math.round((clip.score || 0) * 100)}
                        </Badge>
                      </div>
                      
                      {/* Duration */}
                      <div className="absolute bottom-3 right-3">
                        <Badge variant="secondary" className="bg-black/60 text-white border-0 backdrop-blur-sm">
                          <IconClock className="h-3 w-3 mr-1" />
                          {formatDuration(clip.duration)}
                        </Badge>
                      </div>
                      
                      {/* Platform indicators */}
                      {clip.analytics?.optimalPlatforms && (
                        <div className="absolute bottom-3 left-3 flex gap-1">
                          {clip.analytics.optimalPlatforms.slice(0, 3).map((platform) => (
                            <div key={platform} className="w-6 h-6 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                              {platform === 'tiktok' && <IconBrandTiktok className="h-3 w-3 text-white" />}
                              {platform === 'instagram' && <IconBrandInstagram className="h-3 w-3 text-white" />}
                              {platform === 'youtube' && <IconBrandYoutube className="h-3 w-3 text-white" />}
                              {platform === 'twitter' && <IconBrandTwitter className="h-3 w-3 text-white" />}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <CardContent className={cn(
                      "p-4",
                      viewMode === 'list' && "flex-1"
                    )}>
                      <div className="space-y-3">
                        {/* Title and Status */}
                        <div className="flex items-start justify-between">
                          <h3 className="font-semibold text-sm line-clamp-2 flex-1">
                            {clip.title}
                          </h3>
                          <Badge className={cn("text-xs ml-2", getStatusColor(clip.status))}>
                            {clip.status}
                          </Badge>
                        </div>

                        {/* Description */}
                        <p className="text-muted-foreground text-xs line-clamp-2">
                          {clip.description}
                        </p>

                        {/* Analytics Preview */}
                        {clip.engagement && (
                          <div className="grid grid-cols-3 gap-2 text-xs">
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <IconEye className="h-3 w-3" />
                              {clip.engagement.estimatedReach ? `${Math.round(clip.engagement.estimatedReach / 1000)}K` : 'N/A'}
                            </div>
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <IconHeart className="h-3 w-3" />
                              {clip.engagement.engagementRate ? `${clip.engagement.engagementRate}%` : 'N/A'}
                            </div>
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <IconTrendingUp className="h-3 w-3" />
                              {clip.analytics?.trendingScore ? Math.round(clip.analytics.trendingScore * 100) : 'N/A'}
                            </div>
                          </div>
                        )}

                        {/* Virality explanation preview */}
                        {clip.viralityExplanation && (
                          <p className="text-xs text-muted-foreground line-clamp-1 italic">
                            "{clip.viralityExplanation.slice(0, 80)}..."
                          </p>
                        )}

                        {/* Action buttons */}
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1"
                            onClick={() => handleClipAction(clip, 'share')}
                          >
                            <IconShare className="h-3 w-3 mr-1" />
                            Share
                          </Button>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button size="sm" variant="outline">
                                <IconDownload className="h-3 w-3 mr-1" />
                                Export
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-80 p-4">
                              <div className="space-y-4">
                                <h4 className="font-semibold">Export Options</h4>
                                
                                <div>
                                  <label className="text-sm font-medium mb-2 block">Format</label>
                                  <Select defaultValue="mp4">
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {exportFormats.map((format) => (
                                        <SelectItem key={format.id} value={format.id}>
                                          <div>
                                            <div className="font-medium">{format.name}</div>
                                            <div className="text-xs text-muted-foreground">{format.description}</div>
                                          </div>
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>

                                <div>
                                  <label className="text-sm font-medium mb-2 block">Quality</label>
                                  <Select defaultValue="1080p">
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {qualityOptions.map((quality) => (
                                        <SelectItem key={quality.id} value={quality.id}>
                                          <div>
                                            <div className="font-medium">{quality.name}</div>
                                            <div className="text-xs text-muted-foreground">{quality.description}</div>
                                          </div>
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>

                                <div>
                                  <label className="text-sm font-medium mb-2 block">Aspect Ratio</label>
                                  <Select defaultValue="16:9">
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {aspectRatios.map((ratio) => (
                                        <SelectItem key={ratio.id} value={ratio.id}>
                                          <div>
                                            <div className="font-medium">{ratio.name}</div>
                                            <div className="text-xs text-muted-foreground">
                                              {ratio.platforms.join(', ')}
                                            </div>
                                          </div>
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>

                                <div className="flex gap-2 pt-2">
                                  <Button className="flex-1" onClick={() => handleClipAction(clip, 'export')}>
                                    <IconDownload className="h-4 w-4 mr-1" />
                                    Export
                                  </Button>
                                </div>
                              </div>
                            </PopoverContent>
                          </Popover>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleClipAction(clip, 'analyze')}
                          >
                                                                    <IconChartBar className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Enhanced Video Preview Modal */}
      {previewClip && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-semibold">{previewClip.title}</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPreviewClip(null)}
              >
                <IconX className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="p-4">
              <div className="aspect-video bg-black rounded-lg relative overflow-hidden mb-4">
                <video
                  ref={videoRef}
                  src={previewClip.url}
                  poster={previewClip.thumbnail}
                  className="w-full h-full object-contain"
                  controls
                  autoPlay
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Performance Insights</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Viral Score:</span>
                      <span className={getScoreColor(previewClip.score || 0)}>
                        {Math.round((previewClip.score || 0) * 100)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Expected Reach:</span>
                      <span>{previewClip.engagement?.estimatedReach ? `${Math.round(previewClip.engagement.estimatedReach / 1000)}K` : 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Optimal Platforms:</span>
                      <span className="text-right">
                        {previewClip.analytics?.optimalPlatforms?.join(', ') || 'All'}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">AI Analysis</h4>
                  <p className="text-sm text-muted-foreground">
                    {previewClip.viralityExplanation || 'No detailed analysis available.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 