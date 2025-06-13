"use client"

import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { UserMenu } from "@/components/user-menu"
import { Button } from "@/components/ui/button"
import { 
  IconVideo, 
  IconPlus,
  IconSparkles,
  IconBell,
  IconSearch
} from "@tabler/icons-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { GlobalSearch } from "@/components/global-search"
import { ThemeToggle } from "@/components/theme-toggle"

export function DashboardHeader() {
  const router = useRouter()
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center justify-between px-6 w-full">
        {/* Left side - Trigger and Navigation */}
        <div className="flex items-center gap-6 flex-1">
          <div className="flex items-center gap-3">
            <SidebarTrigger />
            <Separator orientation="vertical" className="h-4" />
          </div>
          
          <nav className="hidden md:flex items-center gap-6">
            <Link 
              href="/dashboard" 
              className={`text-sm font-medium transition-colors hover:text-primary ${
                pathname === '/dashboard' ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              Dashboard
            </Link>
            <Link 
              href="/projects" 
              className={`text-sm font-medium transition-colors hover:text-primary ${
                pathname.startsWith('/projects') ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              Projects
            </Link>
            <Link 
              href="/studio/upload" 
              className={`text-sm font-medium transition-colors hover:text-primary ${
                pathname.startsWith('/studio') ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              Studio
            </Link>
            <Link 
              href="/analytics" 
              className={`text-sm font-medium transition-colors hover:text-primary ${
                pathname === '/analytics' ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              Analytics
            </Link>
            <Link 
              href="/templates" 
              className={`text-sm font-medium transition-colors hover:text-primary ${
                pathname === '/templates' ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              Templates
              <Badge variant="secondary" className="ml-2 text-xs">New</Badge>
            </Link>
          </nav>
        </div>

        {/* Center - Global Search */}
        <div className="flex-1 max-w-xl mx-8">
          <GlobalSearch />
        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-3">
          {/* Create New Button */}
          <Button 
            onClick={() => router.push('/studio/upload')}
            size="sm"
            className="gradient-premium hover:opacity-90 transition-opacity shadow-md"
          >
            <IconPlus className="h-4 w-4 mr-1.5" />
            <span className="hidden sm:inline">New Project</span>
          </Button>

          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative h-9 w-9">
            <IconBell className="h-4 w-4" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 animate-pulse" />
          </Button>

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* User Menu */}
          <UserMenu />
        </div>
      </div>
    </header>
  )
} 