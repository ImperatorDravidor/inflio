"use client"

import { useEffect, useState } from "react"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { IconLoader2, IconChevronRight } from "@tabler/icons-react"
import { useRouter } from "next/navigation"
import { ProjectService } from "@/lib/services"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"

export function WorkflowIndicator() {
  const router = useRouter()
  const [processingProjects, setProcessingProjects] = useState<Array<{
    id: string
    title: string
    progress: number
  }>>([])
  
  useEffect(() => {
    const checkProcessingProjects = async () => {
      try {
        // Get user ID from clerk
        const userIdElement = document.querySelector('[data-clerk-user-id]')
        const userId = userIdElement?.getAttribute('data-clerk-user-id')
        
        if (!userId) return
        
        const projects = await ProjectService.getAllProjects(userId)
        const processing = projects
          .filter(p => p.status === 'processing')
          .map(p => ({
            id: p.id,
            title: p.title,
            progress: ProjectService.calculateProjectProgress(p)
          }))
        
        setProcessingProjects(processing)
      } catch (error) {
        console.error('Failed to check processing projects:', error)
      }
    }
    
    // Check immediately
    checkProcessingProjects()
    
    // Check every 5 seconds
    const interval = setInterval(checkProcessingProjects, 5000)
    
    return () => clearInterval(interval)
  }, [])
  
  if (processingProjects.length === 0) return null
  
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="fixed bottom-4 right-4 z-50"
      >
        <div className="bg-background/95 backdrop-blur-md border rounded-lg shadow-xl p-4 space-y-3 max-w-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-full bg-primary/10">
                <IconLoader2 className="h-4 w-4 text-primary animate-spin" />
              </div>
              <h4 className="text-sm font-medium">Processing Workflows</h4>
            </div>
            <Badge variant="secondary" className="text-xs">
              {processingProjects.length} active
            </Badge>
          </div>
          
          <div className="space-y-2">
            {processingProjects.slice(0, 3).map((project) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-1"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground truncate max-w-[200px]">
                    {project.title}
                  </span>
                  <span className="font-medium">{Math.round(project.progress)}%</span>
                </div>
                <Progress value={project.progress} className="h-1" />
              </motion.div>
            ))}
            
            {processingProjects.length > 3 && (
              <p className="text-xs text-muted-foreground text-center">
                +{processingProjects.length - 3} more processing...
              </p>
            )}
          </div>
          
          <Button
            size="sm"
            variant="ghost"
            className="w-full justify-between"
            onClick={() => {
              if (processingProjects.length === 1) {
                router.push(`/studio/processing/${processingProjects[0].id}`)
              } else {
                router.push('/projects')
              }
            }}
          >
            <span>View Details</span>
            <IconChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}