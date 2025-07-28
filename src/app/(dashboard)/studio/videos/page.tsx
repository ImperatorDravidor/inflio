"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { ThumbnailCreatorV2 } from "@/components/thumbnail-creator-v2"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { 
  IconDots, 
  IconEdit, 
  IconEye, 
  IconPlayerPlay, 
  IconTrash, 
  IconUpload,
  IconSearch,
  IconClock,
  IconScissors,
  IconFileText,
  IconShare,
  IconVideo,
  IconDownload,
  IconLayoutGrid,
  IconList,
  IconFilter,
  IconSortDescending,
  IconLoader2,
  IconCheck,
  IconPhoto
} from "@tabler/icons-react"
import Image from "next/image"
import { ProjectService } from "@/lib/services"
import { Project } from "@/lib/project-types"
import { formatDuration, formatFileSize } from "@/lib/video-utils"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { EmptyState } from "@/components/empty-state"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { AnimatedBackground } from "@/components/animated-background"
import { motion, AnimatePresence } from "framer-motion"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type ViewMode = 'grid' | 'list'
type FilterStatus = 'all' | 'processing' | 'ready' | 'published'
type SortOption = 'recent' | 'name' | 'duration'

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

function VideoCard({ 
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
  const isProcessing = project.status === 'processing' && progress < 100
  const StatusIcon = isProcessing ? IconLoader2 : 
                     project.status === 'ready' ? IconCheck : 
                     IconClock

  // Helper function to handle project navigation
  const handleProjectClick = () => {
    // Check both status and progress to determine if still processing
    if (project.status === 'processing' && progress < 100) {
      router.push(`/studio/processing/${project.id}`)
    } else {
      router.push(`/projects/${project.id}`)
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
        className="overflow-hidden hover:shadow-xl transition-all border-primary/10"
        whileHover={{ scale: 1.01 }}
      >
        <div className="flex items-center p-6 gap-6">
          {/* Thumbnail */}
          <div 
            className="relative w-40 h-24 rounded-xl overflow-hidden bg-gradient-to-br from-primary/20 to-accent/20 flex-shrink-0 cursor-pointer group"
            onClick={handleProjectClick}
          >
            {project.thumbnail_url ? (
              <>
                {project.thumbnail_url.startsWith('http') ? (
                  <img
                    src={project.thumbnail_url}
                    alt={project.title}
                    className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-500"
                  />
                ) : (
                  <Image 
                    src={project.thumbnail_url} 
                    alt={project.title}
                    width={160}
                    height={96}
                    className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-500"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </>
            ) : (
              <div className="flex items-center justify-center h-full">
                <IconVideo className="h-10 w-10 text-primary/50" />
              </div>
            )}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="p-3 rounded-full bg-white/90 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all">
                <IconPlayerPlay className="h-6 w-6 text-primary" />
              </div>
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
            
            <div className="absolute bottom-2 right-2 px-2 py-1 rounded bg-black/80 text-white text-xs font-medium">
              {formatDuration(project.metadata.duration)}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 
                  className="font-semibold text-lg mb-1 cursor-pointer hover:text-primary transition-colors line-clamp-1"
                  onClick={handleProjectClick}
                >
                  {project.title}
                </h3>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {project.description || 'Transform your video into amazing content'}
                </p>
              </div>
              <Badge 
                variant={isProcessing ? 'secondary' : 'default'}
                className="ml-4 flex items-center gap-1"
              >
                <StatusIcon className={cn("h-3 w-3", isProcessing && "animate-spin")} />
                {isProcessing ? 'processing' : project.status}
              </Badge>
            </div>
            
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-6 text-sm">
                {project.transcription && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <div className="p-1.5 rounded-lg bg-primary/10">
                      <IconFileText className="h-4 w-4 text-primary" />
                    </div>
                    <span>Transcript</span>
                  </div>
                )}
                {stats.totalClips > 0 && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <div className="p-1.5 rounded-lg bg-green-500/10">
                      <IconScissors className="h-4 w-4 text-green-600" />
                    </div>
                    <span>{stats.totalClips} clips</span>
                  </div>
                )}
                {stats.totalBlogs > 0 && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <div className="p-1.5 rounded-lg bg-blue-500/10">
                      <IconFileText className="h-4 w-4 text-blue-600" />
                    </div>
                    <span>{stats.totalBlogs} blog</span>
                  </div>
                )}
                {stats.totalSocialPosts > 0 && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <div className="p-1.5 rounded-lg bg-purple-500/10">
                      <IconShare className="h-4 w-4 text-purple-600" />
                    </div>
                    <span>{stats.totalSocialPosts} social</span>
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-2 ml-auto">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleProjectClick}
                  className="hover:bg-primary/10"
                >
                  <IconEye className="h-4 w-4" />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm" variant="ghost" className="hover:bg-primary/10">
                      <IconDots className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={handleProjectClick}>
                      <IconEye className="h-4 w-4 mr-2" />
                      View Project
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <IconEdit className="h-4 w-4 mr-2" />
                      Edit Details
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <IconDownload className="h-4 w-4 mr-2" />
                      Download Video
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      className="text-destructive"
                      onClick={() => onDelete(project.id)}
                    >
                      <IconTrash className="h-4 w-4 mr-2" />
                      Delete Project
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </div>
      </MotionCard>
    )
  }

  return (
    <MotionCard
      variants={itemVariants}
      className="overflow-hidden hover:shadow-2xl transition-all group border-primary/10"
      whileHover={{ scale: 1.02 }}
    >
      {/* Thumbnail */}
      <div 
        className="relative aspect-video overflow-hidden bg-gradient-to-br from-primary/20 to-accent/20 cursor-pointer"
        onClick={handleProjectClick}
      >
        {project.thumbnail_url ? (
          <>
            {project.thumbnail_url.startsWith('http') ? (
              <img
                src={project.thumbnail_url}
                alt={project.title}
                className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-700"
              />
            ) : (
              <Image 
                src={project.thumbnail_url} 
                alt={project.title}
                width={400}
                height={225}
                className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-700"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            <IconVideo className="h-16 w-16 text-primary/30" />
          </div>
        )}
        
        {/* Play button overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="p-4 rounded-full bg-white/90 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all transform scale-75 group-hover:scale-100">
            <IconPlayerPlay className="h-8 w-8 text-primary" />
          </div>
        </div>
        
        {/* Thumbnail Generator Button for Grid View */}
        <div className="absolute top-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity">
          <ThumbnailCreatorV2
            projectId={project.id}
            projectTitle={project.title}
            currentThumbnail={project.thumbnail_url}
            onThumbnailUpdate={handleThumbnailUpdate}
          />
        </div>
        
        {/* Duration badge */}
        <div className="absolute bottom-3 left-3 px-2 py-1 rounded-lg bg-black/80 backdrop-blur-sm text-white text-sm font-medium">
          {formatDuration(project.metadata.duration)}
        </div>
        
        {/* Status badge */}
        <Badge 
          className="absolute top-3 right-3 backdrop-blur-sm"
          variant={isProcessing ? 'secondary' : 'default'}
        >
          <StatusIcon className={cn("h-3 w-3 mr-1", isProcessing && "animate-spin")} />
          {isProcessing ? 'processing' : project.status}
        </Badge>
      </div>

      <CardContent className="p-5">
        <div className="mb-4">
          <h3 className="font-semibold text-lg mb-1 line-clamp-1 group-hover:text-primary transition-colors">
            {project.title}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {project.description || 'Transform your video into amazing content'}
          </p>
        </div>
        
        {/* Content badges */}
        <div className="flex flex-wrap gap-2 mb-4">
          {project.transcription && (
            <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
              <IconFileText className="h-3 w-3 mr-1" />
              Transcript
            </Badge>
          )}
          {stats.totalClips > 0 && (
            <Badge variant="secondary" className="bg-green-500/10 text-green-700 border-green-500/20">
              <IconScissors className="h-3 w-3 mr-1" />
              {stats.totalClips} Clips
            </Badge>
          )}
          {stats.totalBlogs > 0 && (
            <Badge variant="secondary" className="bg-blue-500/10 text-blue-700 border-blue-500/20">
              <IconFileText className="h-3 w-3 mr-1" />
              Blog Post
            </Badge>
          )}
          {stats.totalSocialPosts > 0 && (
            <Badge variant="secondary" className="bg-purple-500/10 text-purple-700 border-purple-500/20">
              <IconShare className="h-3 w-3 mr-1" />
              {stats.totalSocialPosts} Social
            </Badge>
          )}
        </div>
        
        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-3 border-t">
          <div className="flex items-center gap-1">
            <IconClock className="h-3 w-3" />
            {new Date(project.created_at).toLocaleDateString()}
          </div>
          <div className="flex items-center gap-1">
            {formatFileSize(project.metadata.size)}
          </div>
        </div>
      </CardContent>
    </MotionCard>
  )
}

export default function StudioVideosPage() {
  const router = useRouter()
  const { userId } = useAuth()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all')
  const [sortOption, setSortOption] = useState<SortOption>('recent')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')

  const loadProjects = async () => {
    if (!userId) return
    
    try {
      setLoading(true)
      const allProjects = await ProjectService.getAllProjects(userId)
      setProjects(allProjects)
    } catch (error) {
      console.error("Failed to load projects:", error)
      toast.error("Failed to load videos")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProjects()
  }, [userId])

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this video project? This action cannot be undone.')) {
      try {
        await ProjectService.deleteProject(id)
        setProjects(prev => prev.filter(p => p.id !== id))
        toast.success("Video project deleted successfully")
      } catch (error) {
        console.error("Failed to delete project:", error)
        toast.error("Failed to delete video project")
      }
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
        project.description.toLowerCase().includes(query)
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
        default:
          return 0
      }
    })

    return filtered
  }, [projects, searchQuery, filterStatus, sortOption])

  // Stats
  const stats = {
    total: projects.length,
    totalDuration: projects.reduce((acc, p) => acc + p.metadata.duration, 0),
    totalClips: projects.reduce((acc, p) => acc + ProjectService.getProjectStats(p).totalClips, 0),
    totalBlogs: projects.reduce((acc, p) => acc + ProjectService.getProjectStats(p).totalBlogs, 0)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="relative min-h-screen">
      <AnimatedBackground variant="subtle" />
      
      <div className="relative space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 rounded-full gradient-premium-subtle animate-float">
                <IconVideo className="h-6 w-6 text-primary" />
              </div>
              <h1 className="text-4xl font-bold">
                My <span className="gradient-text">Videos</span>
              </h1>
            </div>
            <p className="text-lg text-muted-foreground max-w-2xl">
              Manage your video content and all AI-generated assets in one place
            </p>
          </div>
          <Button
            size="lg"
            className="gradient-premium hover:opacity-90 shadow-xl"
            onClick={() => router.push('/studio/upload')}
          >
            <IconUpload className="h-5 w-5 mr-2" />
            Upload Video
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <IconVideo className="h-4 w-4 text-primary" />
                Total Videos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold gradient-text">{stats.total}</div>
              <p className="text-xs text-muted-foreground mt-1">Projects created</p>
            </CardContent>
          </Card>
          <Card className="border-green-500/20 bg-gradient-to-br from-green-500/5 to-transparent">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <IconClock className="h-4 w-4 text-green-600" />
                Total Duration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{formatDuration(stats.totalDuration)}</div>
              <p className="text-xs text-muted-foreground mt-1">Hours of content</p>
            </CardContent>
          </Card>
          <Card className="border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-transparent">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <IconScissors className="h-4 w-4 text-blue-600" />
                Video Clips
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{stats.totalClips}</div>
              <p className="text-xs text-muted-foreground mt-1">Generated clips</p>
            </CardContent>
          </Card>
          <Card className="border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-transparent">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <IconFileText className="h-4 w-4 text-purple-600" />
                Blog Posts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600">{stats.totalBlogs}</div>
              <p className="text-xs text-muted-foreground mt-1">Articles written</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="border-primary/10">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search videos..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Select value={filterStatus} onValueChange={(value: FilterStatus) => setFilterStatus(value)}>
                  <SelectTrigger className="w-[140px]">
                    <IconFilter className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Videos</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="ready">Ready</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={sortOption} onValueChange={(value: SortOption) => setSortOption(value)}>
                  <SelectTrigger className="w-[140px]">
                    <IconSortDescending className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recent">Most Recent</SelectItem>
                    <SelectItem value="name">Name</SelectItem>
                    <SelectItem value="duration">Duration</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex gap-1 border rounded-lg p-1">
                  <Button
                    size="icon"
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    onClick={() => setViewMode('grid')}
                    className="h-8 w-8"
                  >
                    <IconLayoutGrid className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    onClick={() => setViewMode('list')}
                    className="h-8 w-8"
                  >
                    <IconList className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Videos Grid/List */}
        {filteredProjects.length === 0 ? (
          <EmptyState
            icon={<IconVideo className="h-20 w-20 text-primary/50" />}
            title={searchQuery || filterStatus !== 'all' ? "No videos found" : "No videos yet"}
            description={
              searchQuery || filterStatus !== 'all' 
                ? "Try adjusting your filters or search query" 
                : "Upload your first video to start creating amazing content"
            }
            action={{
              label: "Upload Video",
              onClick: () => router.push('/studio/upload')
            }}
          />
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className={cn(
              "grid gap-6",
              viewMode === 'grid' 
                ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" 
                : "grid-cols-1"
            )}
          >
            <AnimatePresence mode="popLayout">
              {filteredProjects.map((project) => (
                <VideoCard
                  key={project.id}
                  project={project}
                  viewMode={viewMode}
                  onDelete={handleDelete}
                  onThumbnailUpdate={loadProjects}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </div>
  )
} 
