"use client"

import { useState, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import {
  IconPlayerPlay,
  IconDownload,
  IconShare2,
  IconSparkles,
  IconTrendingUp,
  IconSortDescending,
  IconCheck,
  IconX,
  IconScissors,
  IconVideoOff,
  IconLoader2,
  IconGridDots,
  IconList,
  IconDots,
  IconSearch,
  IconTrash,
  IconBolt,
  IconFlame,
  IconStar,
  IconCrown,
  IconRocket,
  IconChartBar,
  IconInfoCircle
} from "@tabler/icons-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { formatDuration } from "@/lib/video-utils"
import { generateSocialContent } from "@/lib/social"
import { useRouter } from "next/navigation"
import { ROUTES } from "@/lib/constants"
import type { ClipData, Project } from "@/lib/project-types"

interface ClipsViewProps {
  clips: ClipData[]
  project: Project
  onClipSelect: (clip: ClipData) => void
  isExportingAll?: boolean
  onExportAll?: () => void
}

export function ClipsView({ clips, project, onClipSelect, isExportingAll, onExportAll }: ClipsViewProps) {
  const router = useRouter()
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'analytics'>('grid')
  const [sortBy, setSortBy] = useState<'score' | 'duration' | 'recent'>('score')
  const [filterByScore, setFilterByScore] = useState<[number, number]>([0, 100])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedClips, setSelectedClips] = useState<Set<string>>(new Set())
  const [selectedClipForActions, setSelectedClipForActions] = useState<ClipData | null>(null)

  // Analytics calculations
  const analytics = useMemo(() => {
    const totalClips = clips.length
    const avgScore = clips.reduce((sum, clip) => sum + (clip.score || 0), 0) / totalClips
    const totalDuration = clips.reduce((sum, clip) => sum + (clip.duration || clip.endTime - clip.startTime), 0)
    const readyToPublish = clips.filter(clip => clip.exportUrl).length
    const topClips = [...clips].sort((a, b) => (b.score || 0) - (a.score || 0)).slice(0, 3)
    
    const scoreDistribution = {
      excellent: clips.filter(c => (c.score || 0) >= 0.8).length,
      good: clips.filter(c => (c.score || 0) >= 0.6 && (c.score || 0) < 0.8).length,
      average: clips.filter(c => (c.score || 0) >= 0.4 && (c.score || 0) < 0.6).length,
      low: clips.filter(c => (c.score || 0) < 0.4).length
    }

    return {
      totalClips,
      avgScore,
      totalDuration,
      readyToPublish,
      topClips,
      scoreDistribution
    }
  }, [clips])

  // Filter and sort clips
  const processedClips = useMemo(() => {
    const filtered = clips.filter(clip => {
      const score = (clip.score || 0) * 100
      const matchesScore = score >= filterByScore[0] && score <= filterByScore[1]
      const matchesSearch = !searchQuery || 
        clip.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        clip.description?.toLowerCase().includes(searchQuery.toLowerCase())
      
      return matchesScore && matchesSearch
    })

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'score':
          return (b.score || 0) - (a.score || 0)
        case 'duration':
          return (b.duration || b.endTime - b.startTime) - (a.duration || a.endTime - a.startTime)
        case 'recent':
          return (b.createdAt || '').localeCompare(a.createdAt || '')
        default:
          return 0
      }
    })
  }, [clips, filterByScore, searchQuery, sortBy])

  const handleBulkAction = (action: 'download' | 'share' | 'delete') => {
    if (selectedClips.size === 0) {
      toast.error('Please select clips first')
      return
    }

    switch (action) {
      case 'download':
        toast.info(`Downloading ${selectedClips.size} clips...`)
        // Implement bulk download
        break
      case 'share':
        toast.info(`Preparing ${selectedClips.size} clips for sharing...`)
        // Implement bulk share
        break
      case 'delete':
        toast.error('Delete not implemented')
        break
    }
  }

  const toggleClipSelection = (clipId: string) => {
    const newSelection = new Set(selectedClips)
    if (newSelection.has(clipId)) {
      newSelection.delete(clipId)
    } else {
      newSelection.add(clipId)
    }
    setSelectedClips(newSelection)
  }

  const getViralityIcon = (score: number) => {
    if (score >= 0.9) return { icon: IconRocket, color: 'text-purple-500' }
    if (score >= 0.8) return { icon: IconFlame, color: 'text-orange-500' }
    if (score >= 0.7) return { icon: IconBolt, color: 'text-yellow-500' }
    if (score >= 0.6) return { icon: IconStar, color: 'text-blue-500' }
    return { icon: IconSparkles, color: 'text-gray-500' }
  }

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Clips</p>
                <p className="text-2xl font-bold">{analytics.totalClips}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatDuration(analytics.totalDuration)} total
                </p>
              </div>
              <IconScissors className="h-8 w-8 text-primary/20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Virality</p>
                <p className="text-2xl font-bold">{Math.round(analytics.avgScore * 100)}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {analytics.scoreDistribution.excellent} excellent clips
                </p>
              </div>
              <IconTrendingUp className="h-8 w-8 text-green-500/20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Ready</p>
                <p className="text-2xl font-bold">{analytics.readyToPublish}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {clips.length - analytics.readyToPublish} processing
                </p>
              </div>
              <IconCheck className="h-8 w-8 text-blue-500/20" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Top Score</p>
                <p className="text-2xl font-bold">
                  {analytics.topClips[0] ? Math.round((analytics.topClips[0].score || 0) * 100) : 0}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Viral potential
                </p>
              </div>
              <IconCrown className="h-8 w-8 text-yellow-500/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controls Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search clips..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Sort */}
            <Select value={sortBy} onValueChange={(value) => setSortBy(value as 'score' | 'duration' | 'recent')}>
              <SelectTrigger className="w-[140px]">
                <IconSortDescending className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="score">By Score</SelectItem>
                <SelectItem value="duration">By Duration</SelectItem>
                <SelectItem value="recent">Most Recent</SelectItem>
              </SelectContent>
            </Select>

            {/* View Mode */}
            <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
              <Button
                size="sm"
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                onClick={() => setViewMode('grid')}
                className="h-8 px-3"
              >
                <IconGridDots className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                onClick={() => setViewMode('list')}
                className="h-8 px-3"
              >
                <IconList className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant={viewMode === 'analytics' ? 'default' : 'ghost'}
                onClick={() => setViewMode('analytics')}
                className="h-8 px-3"
              >
                <IconChartBar className="h-4 w-4" />
              </Button>
            </div>

            {/* Actions */}
            {selectedClips.size > 0 && (
              <div className="flex items-center gap-2">
                <Badge variant="secondary">
                  {selectedClips.size} selected
                </Badge>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleBulkAction('download')}
                >
                  <IconDownload className="h-4 w-4 mr-2" />
                  Download
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleBulkAction('share')}
                >
                  <IconShare2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setSelectedClips(new Set())}
                >
                  <IconX className="h-4 w-4" />
                </Button>
              </div>
            )}

            {/* Export All */}
            <Button
              variant="outline"
              size="sm"
              onClick={onExportAll}
              disabled={isExportingAll}
            >
              {isExportingAll ? (
                <>
                  <IconLoader2 className="h-4 w-4 mr-2 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <IconDownload className="h-4 w-4 mr-2" />
                  Export All
                </>
              )}
            </Button>
          </div>

          {/* Score Filter */}
          <div className="mt-4 flex items-center gap-4">
            <Label className="text-sm">Virality Score Filter:</Label>
            <div className="flex-1 flex items-center gap-4">
              <span className="text-sm text-muted-foreground">{filterByScore[0]}%</span>
              <Slider
                value={filterByScore}
                onValueChange={(value) => setFilterByScore(value as [number, number])}
                min={0}
                max={100}
                step={10}
                className="flex-1"
              />
              <span className="text-sm text-muted-foreground">{filterByScore[1]}%</span>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setFilterByScore([0, 100])}
            >
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Main Content - Grid View */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
          <AnimatePresence>
            {processedClips.map((clip, index) => {
              const ViralityIcon = getViralityIcon(clip.score || 0)
              return (
                <motion.div
                  key={clip.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.2, delay: index * 0.02 }}
                  className="group relative"
                >
                  <Card className={cn(
                    "overflow-hidden transition-all duration-200 hover:shadow-xl",
                    selectedClips.has(clip.id) && "ring-2 ring-primary"
                  )}>
                    {/* Selection Checkbox */}
                    <div className="absolute top-2 left-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div
                        className="w-6 h-6 rounded-md bg-black/60 backdrop-blur-sm flex items-center justify-center cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleClipSelection(clip.id)
                        }}
                      >
                        {selectedClips.has(clip.id) ? (
                          <IconCheck className="h-4 w-4 text-white" />
                        ) : (
                          <div className="w-4 h-4 rounded border-2 border-white/60" />
                        )}
                      </div>
                    </div>

                    {/* Video Preview */}
                    <div 
                      className="aspect-[9/16] relative bg-black cursor-pointer overflow-hidden"
                      onClick={() => onClipSelect(clip)}
                    >
                      {clip.exportUrl ? (
                        <>
                          <video
                            src={clip.exportUrl}
                            className="w-full h-full object-cover"
                            poster={clip.thumbnail || `${clip.exportUrl}#t=0.1`}
                            muted
                            loop
                            playsInline
                            preload="metadata"
                            onMouseEnter={(e) => e.currentTarget.play().catch(() => {})}
                            onMouseLeave={(e) => {
                              e.currentTarget.pause()
                              e.currentTarget.currentTime = 0
                            }}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 opacity-0 group-hover:opacity-100 transition-opacity" />
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="bg-white/90 backdrop-blur-sm rounded-full p-3 transform scale-90 group-hover:scale-100 transition-transform">
                              <IconPlayerPlay className="h-6 w-6 text-black" />
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="flex items-center justify-center h-full bg-gradient-to-b from-gray-900 to-gray-800">
                          <div className="text-center p-4">
                            <IconVideoOff className="h-10 w-10 mx-auto mb-2 text-gray-600" />
                            <p className="text-xs text-gray-500">Processing...</p>
                          </div>
                        </div>
                      )}

                      {/* Overlays */}
                      <div className="absolute top-2 right-2 flex items-center gap-2">
                        {/* Virality Badge */}
                        <div className="bg-black/60 backdrop-blur-sm text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                          <ViralityIcon.icon className={cn("h-3 w-3", ViralityIcon.color)} />
                          {Math.round((clip.score || 0) * 100)}
                        </div>
                      </div>

                      {/* Rank Badge */}
                      {index < 3 && (
                        <div className="absolute top-2 left-2">
                          <Badge className={cn(
                            "font-bold text-xs",
                            index === 0 && "bg-yellow-500 text-black",
                            index === 1 && "bg-gray-300 text-black",
                            index === 2 && "bg-orange-500 text-white"
                          )}>
                            #{index + 1}
                          </Badge>
                        </div>
                      )}

                      {/* Duration */}
                      <div className="absolute bottom-2 left-2">
                        <div className="bg-black/60 backdrop-blur-sm text-white px-2 py-1 rounded text-xs font-medium">
                          {formatDuration(clip.duration || (clip.endTime - clip.startTime))}
                        </div>
                      </div>
                    </div>

                    {/* Clip Info */}
                    <CardContent className="p-3 space-y-2">
                      <h3 className="font-medium text-sm line-clamp-1">
                        {clip.title || `Clip ${index + 1}`}
                      </h3>
                      {clip.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {clip.description}
                        </p>
                      )}
                      
                      {/* Quick Actions */}
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 flex-1"
                          onClick={(e) => {
                            e.stopPropagation()
                            const content = generateSocialContent(project, 'clip', clip)
                            router.push(`${ROUTES.SOCIAL_COMPOSE}?projectId=${project.id}&content=${encodeURIComponent(content.content || '')}`)
                          }}
                        >
                          <IconShare2 className="h-3 w-3 mr-1" />
                          Share
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                              <IconDots className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => {
                                if (clip.exportUrl) {
                                  const link = document.createElement('a')
                                  link.href = clip.exportUrl
                                  link.download = `${clip.title || 'clip'}.mp4`
                                  document.body.appendChild(link)
                                  link.click()
                                  document.body.removeChild(link)
                                  toast.success('Download started')
                                }
                              }}
                              disabled={!clip.exportUrl}
                            >
                              <IconDownload className="h-4 w-4 mr-2" />
                              Download
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => setSelectedClipForActions(clip)}
                            >
                              <IconInfoCircle className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600">
                              <IconTrash className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}

      {/* List View and Analytics View would go here... */}
      {viewMode === 'list' && (
        <Card>
          <CardContent className="p-6">
            <p className="text-muted-foreground">List view coming soon...</p>
          </CardContent>
        </Card>
      )}

      {viewMode === 'analytics' && (
        <Card>
          <CardContent className="p-6">
            <p className="text-muted-foreground">Analytics view coming soon...</p>
          </CardContent>
        </Card>
      )}

      {/* Clip Details Dialog */}
      <Dialog open={!!selectedClipForActions} onOpenChange={() => setSelectedClipForActions(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedClipForActions?.title || 'Clip Details'}</DialogTitle>
            <DialogDescription>
              Detailed information about this clip
            </DialogDescription>
          </DialogHeader>
          {selectedClipForActions && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-muted-foreground">Duration</Label>
                  <p className="font-medium">
                    {formatDuration(selectedClipForActions.duration || 
                      (selectedClipForActions.endTime - selectedClipForActions.startTime))}
                  </p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Virality Score</Label>
                  <p className="font-medium">
                    {Math.round((selectedClipForActions.score || 0) * 100)}%
                  </p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Time Range</Label>
                  <p className="font-medium">
                    {formatDuration(selectedClipForActions.startTime)} - {formatDuration(selectedClipForActions.endTime)}
                  </p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Type</Label>
                  <p className="font-medium capitalize">
                    {selectedClipForActions.type || 'highlight'}
                  </p>
                </div>
              </div>
              {selectedClipForActions.description && (
                <div>
                  <Label className="text-sm text-muted-foreground">Description</Label>
                  <p className="text-sm mt-1">{selectedClipForActions.description}</p>
                </div>
              )}
              {selectedClipForActions.viralityExplanation && (
                <div>
                  <Label className="text-sm text-muted-foreground">Why it&apos;s viral</Label>
                  <p className="text-sm mt-1">{selectedClipForActions.viralityExplanation}</p>
                </div>
              )}
              {selectedClipForActions.tags && selectedClipForActions.tags.length > 0 && (
                <div>
                  <Label className="text-sm text-muted-foreground">Tags</Label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {selectedClipForActions.tags.map((tag) => (
                      <Badge key={tag} variant="secondary">{tag}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
} 