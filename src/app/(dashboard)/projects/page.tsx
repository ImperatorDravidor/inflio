"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { motion, AnimatePresence } from "framer-motion"
import { ThumbnailCreator } from "@/components/thumbnail-creator"
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
  IconPhoto
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
  const isProcessing = project.status === 'processing' && progress < 100

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
        className={cn(
          "overflow-hidden hover:shadow-lg transition-all",
          isProcessing && "border-primary/30 bg-primary/5"
        )}
        whileHover={{ scale: 1.01 }}
      >
        <div className="flex items-center p-4 gap-4">
          {/* Thumbnail */}
          <div 
            className="relative w-32 h-20 rounded-lg overflow-hidden bg-muted flex-shrink-0 cursor-pointer group"
            onClick={handleProjectClick}
          >
            {project.thumbnail_url ? (
              project.thumbnail_url.startsWith('http') ? (
                <img
                  src={project.thumbnail_url}
                  alt={project.title}
                  className="object-cover w-full h-full group-hover:scale-105 transition-transform"
                />
              ) : (
                <Image 
                  src={project.thumbnail_url} 
                  alt={project.title}
                  width={128}
                  height={80}
                  className="object-cover w-full h-full group-hover:scale-105 transition-transform"
                />
              )
            ) : (
              <div className="flex items-center justify-center h-full">
                <IconVideo className="h-8 w-8 text-muted-foreground" />
              </div>
            )}
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
              <ThumbnailCreator
                projectId={project.id}
                projectTitle={project.title}
                currentThumbnail={project.thumbnail_url}
                onThumbnailUpdate={handleThumbnailUpdate}
              />
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 
                className="font-semibold truncate cursor-pointer hover:text-primary transition-colors"
                onClick={handleProjectClick}
              >
                {project.title}
              </h3>
              <Badge 
                variant={
                  project.status === 'ready' ? 'default' :
                  project.status === 'processing' ? 'secondary' :
                  project.status === 'published' ? 'default' :
                  'outline'
                }
                className={isProcessing ? "animate-pulse" : ""}
              >
                {isProcessing && <IconLoader2 className="h-3 w-3 mr-1 animate-spin" />}
                {project.status}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground line-clamp-1 mb-2">
              {project.description || 'No description'}
            </p>
            <div className="flex items-center gap-6 text-sm">
              <span className="flex items-center gap-1 text-muted-foreground">
                <IconClock className="h-4 w-4" />
                {formatDuration(project.metadata.duration)}
              </span>
              <span className="flex items-center gap-1 text-muted-foreground">
                <IconScissors className="h-4 w-4" />
                {stats.totalClips} clips
              </span>
              <span className="flex items-center gap-1 text-muted-foreground">
                <IconFileText className="h-4 w-4" />
                {stats.totalBlogs} posts
              </span>
              <span className="flex items-center gap-1 text-muted-foreground">
                <IconShare className="h-4 w-4" />
                {stats.totalSocialPosts} social
              </span>
            </div>
            <Progress value={progress} className="h-1.5 mt-2" />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={handleProjectClick}
            >
              <IconEye className="h-4 w-4" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="ghost">
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
        {project.thumbnail_url ? (
          project.thumbnail_url.startsWith('http') ? (
            <img
              src={project.thumbnail_url}
              alt={project.title}
              className="object-cover w-full h-full group-hover:scale-105 transition-transform"
            />
          ) : (
            <Image 
              src={project.thumbnail_url} 
              alt={project.title}
              width={400}
              height={225}
              className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
            />
          )
        ) : (
          <div className="flex items-center justify-center h-full">
            <IconVideo className="h-12 w-12 text-muted-foreground" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="absolute bottom-4 left-4 right-4">
            <p className="text-white text-sm font-medium">{formatDuration(project.metadata.duration)}</p>
          </div>
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          {isProcessing ? (
            <div className="flex flex-col items-center gap-2 bg-black/60 p-4 rounded-lg">
              <IconLoader2 className="h-10 w-10 text-white animate-spin" />
              <span className="text-sm text-white font-medium">Processing</span>
            </div>
          ) : (
            <IconPlayerPlay className="h-12 w-12 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
          )}
        </div>
        
        {/* Thumbnail Generator Button */}
        <div className="absolute top-4 left-4 opacity-0 group-hover:opacity-100 transition-opacity">
          <ThumbnailCreator
            projectId={project.id}
            projectTitle={project.title}
            currentThumbnail={project.thumbnail_url}
            onThumbnailUpdate={handleThumbnailUpdate}
          />
        </div>
        
        <Badge 
          className={cn(
            "absolute top-4 right-4",
            isProcessing && "animate-pulse"
          )}
          variant={
            project.status === 'ready' ? 'default' :
            project.status === 'processing' ? 'secondary' :
            project.status === 'published' ? 'default' :
            'outline'
          }
        >
          {isProcessing && <IconLoader2 className="h-3 w-3 mr-1 animate-spin" />}
          {project.status}
        </Badge>
      </div>

      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg line-clamp-1 cursor-pointer hover:text-primary transition-colors">
              {project.title}
            </CardTitle>
            <CardDescription className="line-clamp-2 mt-1">
              {project.description || 'No description'}
            </CardDescription>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="ghost" className="h-8 w-8 -mr-2">
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
      </CardHeader>

      <CardContent className="pt-0">
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="flex items-center gap-2 text-sm">
            <IconScissors className="h-4 w-4 text-muted-foreground" />
            <span>{stats.totalClips} clips</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <IconFileText className="h-4 w-4 text-muted-foreground" />
            <span>{stats.totalBlogs} posts</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <IconShare className="h-4 w-4 text-muted-foreground" />
            <span>{stats.totalSocialPosts} social</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <IconMicrophone className="h-4 w-4 text-muted-foreground" />
            
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <div className="flex items-center justify-between mt-4 text-xs text-muted-foreground">
          <Badge variant="secondary" className="text-xs">
            <IconClock className="h-3 w-3 mr-1" />
            {new Date(project.created_at).toLocaleDateString()}
          </Badge>
          <span>{formatFileSize(project.metadata.size)}</span>
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Projects</h1>
          <p className="text-muted-foreground mt-1">
            Manage and track all your video projects in one place
          </p>
        </div>
        <Button
          size="lg"
          className="gradient-premium hover:opacity-90 shadow-lg"
          onClick={() => router.push('/studio/upload')}
          disabled={UsageService.getRemainingVideos() === 0}
        >
          <IconPlus className="h-5 w-5 mr-2" />
          New Project
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground mt-1">All time</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Processing</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.processing}</div>
            <p className="text-xs text-muted-foreground mt-1">In progress</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Ready</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.ready}</div>
            <p className="text-xs text-muted-foreground mt-1">Completed</p>
          </CardContent>
        </Card>
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <IconSparkles className="h-4 w-4 text-primary" />
              Monthly Limit
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold gradient-text">{UsageService.getRemainingVideos()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              of {usageData.limit} remaining
            </p>
            <Progress 
              value={UsageService.getUsagePercentage()} 
              className="h-1.5 mt-2" 
            />
            {UsageService.getRemainingVideos() === 0 && (
              <Button 
                variant="link" 
                size="sm" 
                className="p-0 h-auto mt-2 text-xs"
                onClick={() => router.push('/settings#upgrade')}
              >
                Upgrade plan →
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            {/* Search */}
            <div className="relative flex-1">
              <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
              {searchQuery && (
                <Button
                  size="icon"
                  variant="ghost"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                  onClick={() => setSearchQuery("")}
                >
                  <IconX className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2">
              <Tabs value={filterStatus} onValueChange={(v) => setFilterStatus(v as FilterStatus)}>
                <TabsList>
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="draft">Draft</TabsTrigger>
                  <TabsTrigger value="processing">Processing</TabsTrigger>
                  <TabsTrigger value="ready">Ready</TabsTrigger>
                  <TabsTrigger value="published">Published</TabsTrigger>
                </TabsList>
              </Tabs>

              <Select value={sortOption} onValueChange={(v) => setSortOption(v as SortOption)}>
                <SelectTrigger className="w-[140px]">
                  <IconSortDescending className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent">Most Recent</SelectItem>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="duration">Duration</SelectItem>
                  <SelectItem value="status">Status</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex border rounded-lg">
                <Button
                  size="icon"
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  className="rounded-r-none"
                  onClick={() => setViewMode('grid')}
                >
                  <IconLayoutGrid className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  className="rounded-l-none"
                  onClick={() => setViewMode('list')}
                >
                  <IconList className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Projects Grid/List */}
      {filteredProjects.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <IconFolder className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">
              {searchQuery || filterStatus !== 'all' ? 'No projects found' : 'No projects yet'}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {searchQuery || filterStatus !== 'all' 
                ? 'Try adjusting your search or filters'
                : 'Upload your first video to get started'
              }
            </p>
            {!searchQuery && filterStatus === 'all' && (
              <Button onClick={() => router.push('/studio/upload')}>
                <IconPlus className="h-4 w-4 mr-2" />
                Create Your First Project
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className={cn(
            viewMode === 'grid' 
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              : "space-y-4"
          )}
        >
          <AnimatePresence mode="popLayout">
            {filteredProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                viewMode={viewMode}
                onDelete={(id) => setDeleteId(id)}
                onThumbnailUpdate={loadProjects}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Project</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this project? This action cannot be undone.
              All associated content including clips, blog posts, and social media posts will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && handleDelete(deleteId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
} 
