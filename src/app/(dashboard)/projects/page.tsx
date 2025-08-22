"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { VideoThumbnailFallback } from "@/components/video-thumbnail-fallback"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { motion, AnimatePresence } from "framer-motion"
import { ThumbnailCreatorV2 } from "@/components/thumbnail-creator-v2"
import {
  IconSearch,
  IconSortDescending,
  IconVideo,
  IconClock,
  IconFolder,
  IconTrash,
  IconEye,
  IconDownload,
  IconEdit,
  IconPlayerPlay,
  IconDots,
  IconFileText,
  IconShare,
  IconMicrophone,
  IconScissors,
  IconPlus,
  IconLayoutGrid,
  IconList,
  IconX,
  IconSparkles,
  IconLoader2,
  IconPhoto,
  IconChartBar,
  IconTemplate,
  IconVideoPlus
} from "@tabler/icons-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useRouter } from "next/navigation"
import { ProjectService, UsageService } from "@/lib/services"
import { Project } from "@/lib/project-types"
import { formatDuration, formatFileSize } from "@/lib/video-utils"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { toast } from "sonner"
import { useAuth } from "@clerk/nextjs"
import { cn } from "@/lib/utils"
import Image from "next/image"
import type { UsageData } from "@/lib/usage-service"
import { Skeleton } from "@/components/ui/skeleton"

type ViewMode = 'grid' | 'list'
type SortOption = 'recent' | 'name' | 'duration' | 'status'
type FilterStatus = 'all' | 'draft' | 'processing' | 'ready' | 'published'

const MotionCard = motion(Card)

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3
    }
  }
}

function ProjectCard({ 
  project, 
  viewMode,
  onDelete,
  onThumbnailUpdate
}: { 
  project: Project
  viewMode: ViewMode
  onDelete: (id: string) => void
  onThumbnailUpdate: () => void
}) {
  const router = useRouter()
  const stats = ProjectService.getProjectStats(project)
  const progress = ProjectService.calculateProjectProgress(project)
  
  // Check task statuses
  const transcriptionTask = project.tasks.find(t => t.type === 'transcription')
  const clipsTask = project.tasks.find(t => t.type === 'clips')
  
  const isTranscriptionProcessing = transcriptionTask?.status === 'processing'
  const isTranscriptionComplete = transcriptionTask?.status === 'completed' || 
    (transcriptionTask?.progress === 100)
  const areClipsProcessing = clipsTask?.status === 'processing'
  const areClipsComplete = clipsTask?.status === 'completed' || 
    (clipsTask?.progress === 100)
  
  // Determine overall status
  const isProcessing = isTranscriptionProcessing || areClipsProcessing
  const getStatusText = () => {
    if (isTranscriptionProcessing) return 'AI Analysis'
    if (areClipsProcessing) return 'Generating Clips'
    if (project.status === 'published') return 'Published'
    if (isTranscriptionComplete || areClipsComplete) return 'Ready'
    return project.status
  }
  
  const statusText = getStatusText()

  // Helper function to handle project navigation
  const handleProjectClick = () => {
    // Check if transcription is complete
    const transcriptionTask = project.tasks.find(t => t.type === 'transcription')
    const isTranscriptionComplete = transcriptionTask && 
      (transcriptionTask.status === 'completed' || transcriptionTask.progress === 100)
    
    // Check if clips are still processing
    const clipsTask = project.tasks.find(t => t.type === 'clips')
    const areClipsProcessing = clipsTask && 
      clipsTask.status === 'processing' && clipsTask.progress < 100
    
    // If transcription is done (or no transcription task), go to project view
    // Only go to processing view if transcription is still processing
    if (!transcriptionTask || isTranscriptionComplete) {
      router.push(`/projects/${project.id}`)
    } else {
      router.push(`/studio/processing/${project.id}`)
    }
  }

  // Handle thumbnail update
  const handleThumbnailUpdate = async (newThumbnailUrl: string) => {
    try {
      // The ThumbnailCreator component already updates the database
      // through the API routes, so we just need to refresh the projects list
      onThumbnailUpdate()
      toast.success('Thumbnail updated successfully!')
    } catch (error) {
      console.error('Failed to update thumbnail:', error)
      toast.error('Failed to update thumbnail')
    }
  }

  if (viewMode === 'list') {
    return (
      <MotionCard
        variants={itemVariants}
        className={cn(
          "overflow-hidden hover:shadow-lg transition-all",
          isProcessing && "border-primary/30 bg-primary/5"
        )}
        whileHover={{ scale: 1.01 }}
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center p-3 sm:p-4 gap-3 sm:gap-4">
          {/* Thumbnail */}
          <div 
            className="relative w-full sm:w-32 h-48 sm:h-20 rounded-lg overflow-hidden bg-muted flex-shrink-0 cursor-pointer group"
            onClick={handleProjectClick}
          >
            <VideoThumbnailFallback
              videoUrl={project.video_url}
              thumbnailUrl={project.thumbnail_url}
              title={project.title}
              className="object-cover w-full h-full group-hover:scale-105 transition-transform"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
              {isProcessing ? (
                <div className="flex items-center gap-2 bg-black/60 px-3 py-1 rounded-full">
                  <IconLoader2 className="h-4 w-4 text-white animate-spin" />
                  <span className="text-xs text-white">Processing</span>
                </div>
              ) : (
                <IconPlayerPlay className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              )}
            </div>
            
            {/* Thumbnail Generator Button for List View */}
            <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <ThumbnailCreatorV2
                projectId={project.id}
                projectTitle={project.title}
                currentThumbnail={project.thumbnail_url}
                onThumbnailUpdate={handleThumbnailUpdate}
              />
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 w-full">
            <div className="flex items-center gap-2 mb-1">
              <h3 
                className="font-semibold truncate cursor-pointer hover:text-primary transition-colors text-sm sm:text-base"
                onClick={handleProjectClick}
              >
                {project.title}
              </h3>
              <Badge 
                variant={
                  statusText === 'Ready' || statusText === 'Published' ? 'default' :
                  isProcessing ? 'secondary' :
                  'outline'
                }
                className={cn("text-xs", isProcessing && "animate-pulse")}
              >
                {isProcessing && <IconLoader2 className="h-3 w-3 mr-1 animate-spin" />}
                {statusText}
              </Badge>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground line-clamp-1 mb-2">
              {project.description || 'No description'}
            </p>
            <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 sm:gap-6 text-xs sm:text-sm">
              <span className="flex items-center gap-1 text-muted-foreground">
                <IconClock className="h-3 w-3 sm:h-4 sm:w-4" />
                {formatDuration(project.metadata.duration)}
              </span>
              <span className="flex items-center gap-1 text-muted-foreground">
                <IconScissors className="h-3 w-3 sm:h-4 sm:w-4" />
                {stats.totalClips} clips
              </span>
              <span className="flex items-center gap-1 text-muted-foreground">
                <IconFileText className="h-3 w-3 sm:h-4 sm:w-4" />
                {stats.totalBlogs} posts
              </span>
              <span className="flex items-center gap-1 text-muted-foreground">
                <IconShare className="h-3 w-3 sm:h-4 sm:w-4" />
                {stats.totalSocialPosts} social
              </span>
            </div>
            <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 text-xs sm:text-sm mt-1">
              <span className="flex items-center gap-1 text-muted-foreground">
                <IconMicrophone className="h-3 w-3 sm:h-4 sm:w-4" />
                {project.transcription ? 'Transcribed' : 'No transcript'}
              </span>
              <span className="flex items-center gap-1 text-muted-foreground">
                <IconPhoto className="h-3 w-3 sm:h-4 sm:w-4" />
                {project.folders.images?.length || 0} images
              </span>
            </div>
            <Progress value={progress} className="h-1.5 mt-2" />
          </div>

          {/* Actions - Mobile: Show in dropdown, Desktop: Show inline */}
          <div className="flex items-center gap-2 self-start sm:self-center">
            <Button
              size="sm"
              variant="ghost"
              onClick={handleProjectClick}
              className="h-8 w-8 sm:h-9 sm:w-9"
            >
              <IconEye className="h-4 w-4" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="ghost" className="h-8 w-8 sm:h-9 sm:w-9">
                  <IconDots className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleProjectClick}>
                  <IconEye className="h-4 w-4 mr-2" />
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => {
                  e.stopPropagation()
                  window.open(`/editor/${project.video_id}`, '_blank')
                }}>
                  <IconEdit className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <IconDownload className="h-4 w-4 mr-2" />
                  Export
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="text-destructive"
                  onClick={() => onDelete(project.id)}
                >
                  <IconTrash className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </MotionCard>
    )
  }

  return (
    <MotionCard
      variants={itemVariants}
      className={cn(
        "overflow-hidden hover:shadow-lg transition-all group",
        isProcessing && "border-primary/30 bg-primary/5"
      )}
      whileHover={{ scale: 1.02 }}
    >
      {/* Thumbnail */}
      <div 
        className="relative aspect-video overflow-hidden bg-muted cursor-pointer"
        onClick={handleProjectClick}
      >
        <VideoThumbnailFallback
          videoUrl={project.video_url}
          thumbnailUrl={project.thumbnail_url}
          title={project.title}
          className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="absolute bottom-3 sm:bottom-4 left-3 sm:left-4 right-3 sm:right-4">
            <p className="text-white text-xs sm:text-sm font-medium">{formatDuration(project.metadata.duration)}</p>
          </div>
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          {isProcessing ? (
            <div className="flex flex-col items-center gap-2 bg-black/60 p-3 sm:p-4 rounded-lg">
              <IconLoader2 className="h-8 w-8 sm:h-10 sm:w-10 text-white animate-spin" />
              <span className="text-xs sm:text-sm text-white font-medium">Processing</span>
            </div>
          ) : (
            <IconPlayerPlay className="h-10 w-10 sm:h-12 sm:w-12 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
          )}
        </div>
        
        {/* Thumbnail Generator Button */}
        <div className="absolute top-3 sm:top-4 left-3 sm:left-4 opacity-0 group-hover:opacity-100 transition-opacity">
          <ThumbnailCreatorV2
            projectId={project.id}
            projectTitle={project.title}
            currentThumbnail={project.thumbnail_url}
            onThumbnailUpdate={handleThumbnailUpdate}
          />
        </div>
        
        <Badge 
          className={cn(
            "absolute top-3 sm:top-4 right-3 sm:right-4 text-xs",
            isProcessing && "animate-pulse"
          )}
          variant={
            statusText === 'Ready' || statusText === 'Published' ? 'default' :
            isProcessing ? 'secondary' :
            'outline'
          }
        >
          {isProcessing && <IconLoader2 className="h-3 w-3 mr-1 animate-spin" />}
          {statusText}
        </Badge>
      </div>

      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-sm sm:text-lg line-clamp-1 cursor-pointer hover:text-primary transition-colors">
              {project.title}
            </CardTitle>
            <CardDescription className="line-clamp-2 mt-1 text-xs sm:text-sm">
              {project.description || 'No description'}
            </CardDescription>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="ghost" className="h-7 w-7 sm:h-8 sm:w-8 -mr-2">
                <IconDots className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleProjectClick}>
                <IconEye className="h-4 w-4 mr-2" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => {
                e.stopPropagation()
                window.open(`/editor/${project.video_id}`, '_blank')
              }}>
                <IconEdit className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem>
                <IconDownload className="h-4 w-4 mr-2" />
                Export
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="text-destructive"
                onClick={() => onDelete(project.id)}
              >
                <IconTrash className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-3">
          <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
            <IconScissors className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
            <span>{stats.totalClips} clips</span>
          </div>
          <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
            <IconFileText className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
            <span>{stats.totalBlogs} posts</span>
          </div>
          <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
            <IconShare className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
            <span>{stats.totalSocialPosts} social</span>
          </div>
          <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
            <IconMicrophone className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
            <span>{project.transcription ? 'Trans.' : 'No trans.'}</span>
          </div>
          <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm col-span-2">
            <IconPhoto className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
            <span>{project.folders.images?.length || 0} images</span>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs sm:text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{progress}%</span>
          </div>
          <Progress value={progress} className="h-1.5 sm:h-2" />
        </div>

        <div className="flex items-center justify-between mt-3 sm:mt-4 text-xs text-muted-foreground">
          <Badge variant="secondary" className="text-xs">
            <IconClock className="h-3 w-3 mr-1" />
            {new Date(project.created_at).toLocaleDateString()}
          </Badge>
          <span className="hidden sm:inline">{formatFileSize(project.metadata.size)}</span>
        </div>
      </CardContent>
    </MotionCard>
  )
}

export default function ProjectsPage() {
  const router = useRouter()
  const { userId } = useAuth()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all')
  const [sortOption, setSortOption] = useState<SortOption>('recent')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [usageData, setUsageData] = useState<UsageData>({
    used: 0,
    limit: 25,
    plan: 'basic',
    resetDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString()
  })

  const loadProjects = async () => {
    if (!userId) return
    
    try {
      setLoading(true)
      const allProjects = await ProjectService.getAllProjects(userId)
      setProjects(allProjects)
    } catch (error) {
      console.error("Failed to load projects:", error)
      toast.error("Failed to load projects")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProjects()
    
    // Load usage data
    const usage = UsageService.getUsage()
    setUsageData(usage)
    
    // Listen for usage updates
    const handleUsageUpdate = (e: CustomEvent<UsageData>) => {
      setUsageData(e.detail)
    }
    
    window.addEventListener('usageUpdate', handleUsageUpdate as EventListener)
    
    return () => {
      window.removeEventListener('usageUpdate', handleUsageUpdate as EventListener)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  const handleDelete = async (id: string) => {
    try {
      await ProjectService.deleteProject(id)
      setProjects(prev => prev.filter(p => p.id !== id))
      toast.success("Project deleted successfully")
    } catch (error) {
      console.error("Failed to delete project:", error)
      toast.error("Failed to delete project")
    } finally {
      setDeleteId(null)
    }
  }

  // Filter and sort projects
  const filteredProjects = useMemo(() => {
    let filtered = projects

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(project =>
        project.title.toLowerCase().includes(query) ||
        project.description.toLowerCase().includes(query) ||
        project.tags.some(tag => tag.toLowerCase().includes(query))
      )
    }

    // Status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(project => project.status === filterStatus)
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortOption) {
        case 'recent':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        case 'name':
          return a.title.localeCompare(b.title)
        case 'duration':
          return b.metadata.duration - a.metadata.duration
        case 'status':
          const statusOrder = { draft: 0, processing: 1, ready: 2, published: 3 }
          return statusOrder[a.status] - statusOrder[b.status]
        default:
          return 0
      }
    })

    return filtered
  }, [projects, searchQuery, filterStatus, sortOption])

  // Stats
  const stats = {
    total: projects.length,
    processing: projects.filter(p => p.status === 'processing').length,
    ready: projects.filter(p => p.status === 'ready').length,
    published: projects.filter(p => p.status === 'published').length
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">My Projects</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Manage and organize your video content
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Upload button - Always visible */}
          <Button onClick={() => router.push('/studio/upload')} className="text-sm">
            <IconPlus className="h-4 w-4 mr-1 sm:mr-2" />
            <span className="hidden xs:inline">New Project</span>
            <span className="xs:hidden">New</span>
          </Button>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-9 sm:h-10"
          />
        </div>

        {/* Mobile Controls - Single Row */}
        <div className="flex gap-2 sm:hidden">
          {/* Status Filter */}
          <Select value={filterStatus} onValueChange={(value) => setFilterStatus(value as FilterStatus)}>
            <SelectTrigger className="h-9 flex-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="ready">Ready</SelectItem>
              <SelectItem value="published">Published</SelectItem>
            </SelectContent>
          </Select>

          {/* Sort Options */}
          <Select value={sortOption} onValueChange={(value) => setSortOption(value as SortOption)}>
            <SelectTrigger className="h-9 w-[110px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Recent</SelectItem>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="duration">Duration</SelectItem>
              <SelectItem value="status">Status</SelectItem>
            </SelectContent>
          </Select>

          {/* View Mode Toggle */}
          <div className="flex items-center rounded-lg border bg-muted p-0.5">
            <Button
              size="sm"
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              className="h-7 w-7 p-0"
              onClick={() => setViewMode('grid')}
            >
              <IconLayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              className="h-7 w-7 p-0"
              onClick={() => setViewMode('list')}
            >
              <IconList className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Desktop Controls */}
        <div className="hidden sm:flex items-center gap-2">
          {/* Status Filter */}
          <Tabs value={filterStatus} onValueChange={(value) => setFilterStatus(value as FilterStatus)}>
            <TabsList className="h-9 sm:h-10">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="draft">Draft</TabsTrigger>
              <TabsTrigger value="processing">Processing</TabsTrigger>
              <TabsTrigger value="ready">Ready</TabsTrigger>
              <TabsTrigger value="published">Published</TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Sort Options */}
          <Select value={sortOption} onValueChange={(value) => setSortOption(value as SortOption)}>
            <SelectTrigger className="w-[140px] h-9 sm:h-10">
              <IconSortDescending className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Recent</SelectItem>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="duration">Duration</SelectItem>
              <SelectItem value="status">Status</SelectItem>
            </SelectContent>
          </Select>

          {/* View Mode Toggle */}
          <div className="flex items-center rounded-lg border bg-muted p-1">
            <Button
              size="sm"
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              className="h-8 w-8 p-0"
              onClick={() => setViewMode('grid')}
            >
              <IconLayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              className="h-8 w-8 p-0"
              onClick={() => setViewMode('list')}
            >
              <IconList className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Projects Grid/List */}
      {loading ? (
        <div className={cn(
          viewMode === 'grid' 
            ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6"
            : "space-y-3 sm:space-y-4"
        )}>
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              {viewMode === 'grid' ? (
                <>
                  <div className="aspect-video bg-muted animate-pulse" />
                  <CardHeader>
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-full mt-2" />
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-3">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-full" />
                    </div>
                  </CardContent>
                </>
              ) : (
                <div className="flex items-center p-4 gap-4">
                  <Skeleton className="h-20 w-32 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-40" />
                    <Skeleton className="h-4 w-60" />
                    <div className="flex gap-6">
                      <Skeleton className="h-3 w-20" />
                      <Skeleton className="h-3 w-20" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      ) : filteredProjects.length > 0 ? (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className={cn(
            viewMode === 'grid' 
              ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6"
              : "space-y-3 sm:space-y-4"
          )}
        >
          {filteredProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              viewMode={viewMode}
              onDelete={handleDelete}
              onThumbnailUpdate={loadProjects}
            />
          ))}
        </motion.div>
      ) : (
        <Card className="py-16 sm:py-24">
          <CardContent className="text-center">
            {searchQuery || filterStatus !== 'all' ? (
              <>
                <IconSearch className="h-10 w-10 sm:h-12 sm:w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-base sm:text-lg font-medium mb-2">No projects found</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Try adjusting your search or filters
                </p>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSearchQuery("")
                    setFilterStatus('all')
                  }}
                  size="sm"
                >
                  Clear filters
                </Button>
              </>
            ) : (
              <>
                <IconFolder className="h-10 w-10 sm:h-12 sm:w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-base sm:text-lg font-medium mb-2">No projects yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Upload your first video to get started
                </p>
                <Button onClick={() => router.push('/studio/upload')}>
                  <IconVideoPlus className="h-4 w-4 mr-2" />
                  Upload Video
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Project</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this project? This action cannot be undone.
              All associated clips, transcriptions, and generated content will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => deleteId && handleDelete(deleteId)}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Usage Banner - Mobile optimized */}
      {usageData.used >= usageData.limit && (
        <Card className="border-orange-200 bg-orange-50 dark:border-orange-900 dark:bg-orange-950/20">
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <IconSparkles className="h-5 w-5 sm:h-6 sm:w-6 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-sm sm:text-base">You've reached your monthly limit</h4>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                    Upgrade to Pro to process unlimited videos and unlock premium features
                  </p>
                </div>
              </div>
              <Button variant="default" size="sm" className="w-full sm:w-auto">
                Upgrade to Pro
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 
