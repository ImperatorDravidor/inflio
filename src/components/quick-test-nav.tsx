"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  Sparkles, 
  TestTube,
  RefreshCw,
  Image,
  FileText,
  Video,
  Calendar
} from 'lucide-react'

export function QuickTestNav() {
  const router = useRouter()
  const [isResetting, setIsResetting] = useState(false)

  const handleResetOnboarding = async () => {
    setIsResetting(true)
    try {
      const response = await fetch('/api/reset-onboarding', {
        method: 'POST',
      })
      if (response.ok) {
        router.push('/onboarding')
      }
    } catch (error) {
      console.error('Failed to reset onboarding:', error)
    } finally {
      setIsResetting(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <TestTube className="h-4 w-4" />
          Test Features
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <DropdownMenuLabel>New Features</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={() => router.push('/test-features')}>
          <Sparkles className="mr-2 h-4 w-4" />
          Test Features Hub
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={handleResetOnboarding} disabled={isResetting}>
          <RefreshCw className={"mr-2 h-4 w-4 " + (isResetting ? "animate-spin" : "")} />
          Reset & Start Onboarding
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={() => alert('Select a project first')}>
          <Image className="mr-2 h-4 w-4" />
          Thumbnail Generator
        </DropdownMenuItem>
        
        <DropdownMenuItem disabled>
          <FileText className="mr-2 h-4 w-4" />
          Posts (Coming Soon)
        </DropdownMenuItem>
        
        <DropdownMenuItem disabled>
          <Video className="mr-2 h-4 w-4" />
          Long-form (Coming Soon)
        </DropdownMenuItem>
        
        <DropdownMenuItem disabled>
          <Calendar className="mr-2 h-4 w-4" />
          Scheduling (Coming Soon)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}