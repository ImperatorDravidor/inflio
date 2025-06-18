"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { IconShare2, IconBrandTwitter, IconBrandLinkedin } from "@tabler/icons-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useRouter } from "next/navigation"
import { ROUTES } from "@/lib/constants"
import { toast } from "sonner"
import { Project } from "@/lib/project-types"

interface SocialShareButtonProps {
  project: Project
  className?: string
  variant?: "default" | "outline" | "ghost"
  size?: "default" | "sm" | "lg" | "icon"
}

export function SocialShareButton({ 
  project, 
  className, 
  variant = "outline",
  size = "sm" 
}: SocialShareButtonProps) {
  const router = useRouter()
  const [sharing, setSharing] = useState(false)
  
  const handleShareToSocial = () => {
    // Navigate to compose page with project context
    router.push(`${ROUTES.SOCIAL_COMPOSE}?projectId=${project.id}`)
  }
  
  const handleQuickShare = (platform: 'twitter' | 'linkedin') => {
    // Quick share functionality
    const shareUrl = `${window.location.origin}/projects/${project.id}`
    const shareText = `Check out my latest video: ${project.title}`
    
    if (platform === 'twitter') {
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`, '_blank')
    } else if (platform === 'linkedin') {
      window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`, '_blank')
    }
    
    toast.success(`Shared to ${platform}!`)
  }
  
  const handleCopyLink = () => {
    const shareUrl = `${window.location.origin}/projects/${project.id}`
    navigator.clipboard.writeText(shareUrl)
    toast.success('Link copied to clipboard!')
  }
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size} className={className}>
          <IconShare2 className="h-4 w-4 mr-2" />
          Share
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onClick={handleShareToSocial}>
          <IconShare2 className="h-4 w-4 mr-2" />
          Share to Social Media
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => handleQuickShare('twitter')}>
          <IconBrandTwitter className="h-4 w-4 mr-2" />
          Quick Share to Twitter
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleQuickShare('linkedin')}>
          <IconBrandLinkedin className="h-4 w-4 mr-2" />
          Quick Share to LinkedIn
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleCopyLink}>
          Copy Link
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 