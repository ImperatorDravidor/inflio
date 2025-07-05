"use client"

import * as React from "react"
import { useRouter, usePathname, useParams } from "next/navigation"
import { UserMenu } from "@/components/user-menu"
import { Button } from "@/components/ui/button"
import { 
  IconBell,
  IconSearch,
  IconDownload,
  IconShare,
  IconRefresh,
  IconFilter,
  IconPlus,
  IconUpload,
  IconSettings,
  IconCalendar,
  IconChartBar,
  IconExternalLink,
  IconSparkles,
  IconTrash,
  IconX,
  IconBolt,
  IconMenu2
} from "@tabler/icons-react"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { GlobalSearch } from "@/components/global-search"
import { ThemeToggle } from "@/components/theme-toggle"
import { 
  Breadcrumb, 
  BreadcrumbItem, 
  BreadcrumbLink, 
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator 
} from "@/components/ui/breadcrumb"
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { 
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

// Context-specific action configurations
const pageActions: Record<string, React.ReactNode[]> = {
  '/dashboard': [
    <Button key="new-project" className="gap-2" size="sm" onClick={() => window.location.href = '/studio/upload'}>
      <IconPlus className="h-4 w-4" />
      <span className="hidden sm:inline">New Project</span>
      <span className="sm:hidden">New</span>
    </Button>,
    <Button key="refresh" variant="ghost" size="sm" className="gap-2 hidden xs:flex">
      <IconRefresh className="h-4 w-4" />
      <span className="hidden lg:inline">Refresh</span>
    </Button>,
    <DropdownMenu key="date-filter">
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 hidden sm:flex">
          <IconCalendar className="h-4 w-4" />
          <span className="hidden lg:inline">Last 30 days</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Time Period</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem>Today</DropdownMenuItem>
        <DropdownMenuItem>Last 7 days</DropdownMenuItem>
        <DropdownMenuItem>Last 30 days</DropdownMenuItem>
        <DropdownMenuItem>Last 90 days</DropdownMenuItem>
        <DropdownMenuItem>Custom range...</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  ],
  '/projects': [
    <DropdownMenu key="sort">
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <IconFilter className="h-4 w-4" />
          <span className="hidden lg:inline">Filter</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Sort & Filter</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem>Date created</DropdownMenuItem>
        <DropdownMenuItem>Last modified</DropdownMenuItem>
        <DropdownMenuItem>Name (A-Z)</DropdownMenuItem>
        <DropdownMenuItem>Processing status</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem>Show archived</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  ],
  '/studio/upload': [
    <Button key="upload" className="gap-2 gradient-premium shadow-sm" size="sm">
      <IconUpload className="h-4 w-4" />
      <span className="hidden sm:inline">Upload Video</span>
    </Button>,
    <Button key="templates" variant="outline" size="sm" className="gap-2">
      <IconSparkles className="h-4 w-4" />
      <span className="hidden lg:inline">Templates</span>
    </Button>
  ],
  '/studio/videos': [
    <Button key="new-video" className="gap-2" size="sm">
      <IconPlus className="h-4 w-4" />
      <span className="hidden sm:inline">New Video</span>
    </Button>,
    <Button key="bulk-actions" variant="outline" size="sm" className="gap-2">
      <IconSettings className="h-4 w-4" />
      <span className="hidden lg:inline">Bulk Actions</span>
    </Button>
  ],
  '/studio/processing': [
    <Button key="view-queue" variant="outline" size="sm" className="gap-2">
      <IconChartBar className="h-4 w-4" />
      <span className="hidden lg:inline">Queue Status</span>
    </Button>
  ],
  '/analytics': [
    <DropdownMenu key="export">
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <IconDownload className="h-4 w-4" />
          <span className="hidden lg:inline">Export</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Export Format</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem>CSV Report</DropdownMenuItem>
        <DropdownMenuItem>PDF Summary</DropdownMenuItem>
        <DropdownMenuItem>Raw Data (JSON)</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>,
    <Button key="share" variant="outline" size="sm" className="gap-2">
      <IconShare className="h-4 w-4" />
      <span className="hidden lg:inline">Share</span>
    </Button>,
    <Button key="insights" variant="ghost" size="sm" className="gap-2">
      <IconSparkles className="h-4 w-4" />
      <span className="hidden lg:inline">AI Insights</span>
    </Button>
  ],
  '/profile': [
    <Button key="save-profile" variant="default" size="sm" className="gap-2">
      Save Profile
    </Button>,
    <Button key="preview" variant="outline" size="sm" className="gap-2">
      <IconExternalLink className="h-4 w-4" />
      <span className="hidden lg:inline">Preview</span>
    </Button>
  ],
  '/settings': [
    <Button key="save" variant="default" size="sm" className="gap-2">
      Save Changes
    </Button>
  ],
  '/templates': [
    <Button key="create-template" className="gap-2" size="sm">
      <IconPlus className="h-4 w-4" />
      <span className="hidden sm:inline">Create Template</span>
    </Button>,
    <Button key="import" variant="outline" size="sm" className="gap-2">
      <IconUpload className="h-4 w-4" />
      <span className="hidden lg:inline">Import</span>
    </Button>
  ]
}

// Type for breadcrumb items
interface BreadcrumbItem {
  label: string
  path: string
  isLast: boolean
}

// Generate breadcrumbs based on pathname
const generateBreadcrumbs = (pathname: string, params: any): BreadcrumbItem[] => {
  const segments = pathname.split('/').filter(Boolean)
  const breadcrumbs: BreadcrumbItem[] = []
  
  segments.forEach((segment, index) => {
    const path = '/' + segments.slice(0, index + 1).join('/')
    const isLast = index === segments.length - 1
    
    // Handle special cases and formatting
    let label = segment.charAt(0).toUpperCase() + segment.slice(1)
    
    // Replace IDs with more meaningful labels
    if (segment === '[id]' || /^[a-f0-9-]+$/i.test(segment)) {
      if (segments[index - 1] === 'projects') label = 'Project Details'
      else if (segments[index - 1] === 'processing') label = 'Processing'
      else label = 'Details'
    }
    
    // Special formatting for certain pages
    const specialLabels: Record<string, string> = {
      'studio': 'Studio',
      'upload': 'Upload',
      'analytics': 'Analytics',
      'dashboard': 'Dashboard',
      'projects': 'Projects',
      'settings': 'Settings',
      'profile': 'Profile',
      'videos': 'Videos',
      'processing': 'Processing'
    }
    
    if (specialLabels[segment]) {
      label = specialLabels[segment]
    }
    
    breadcrumbs.push({ label, path, isLast })
  })
  
  return breadcrumbs
}

export function DashboardHeader() {
  const router = useRouter()
  const pathname = usePathname()
  const params = useParams()
  const [mobileSearchOpen, setMobileSearchOpen] = React.useState(false)
  
  const breadcrumbs = generateBreadcrumbs(pathname, params)
  
  // Get actions for current page (handle dynamic routes)
  const getPageActions = () => {
    // Check exact match first
    if (pageActions[pathname]) {
      return pageActions[pathname]
    }
    
    // Handle dynamic routes
    if (pathname.startsWith('/projects/') && pathname !== '/projects') {
      return [
        <Button key="edit" variant="outline" size="sm" className="gap-2">
          <IconSettings className="h-4 w-4" />
          <span className="hidden lg:inline">Edit</span>
        </Button>,
        <Button key="share" variant="outline" size="sm" className="gap-2">
          <IconShare className="h-4 w-4" />
          <span className="hidden lg:inline">Share</span>
        </Button>,
        <Button key="delete" variant="ghost" size="sm" className="gap-2 text-destructive hover:text-destructive">
          <IconTrash className="h-4 w-4" />
          <span className="hidden lg:inline">Delete</span>
        </Button>
      ]
    }
    
    if (pathname.startsWith('/studio/processing/')) {
      return [
        <Button key="cancel" variant="outline" size="sm" className="gap-2">
          <IconX className="h-4 w-4" />
          <span className="hidden lg:inline">Cancel</span>
        </Button>,
        <Button key="priority" variant="ghost" size="sm" className="gap-2">
          <IconBolt className="h-4 w-4" />
          <span className="hidden lg:inline">Priority</span>
        </Button>
      ]
    }
    
    // Check for parent path matches
    const segments = pathname.split('/').filter(Boolean)
    while (segments.length > 0) {
      const parentPath = '/' + segments.join('/')
      if (pageActions[parentPath]) {
        return pageActions[parentPath]
      }
      segments.pop()
    }
    
    return []
  }
  
  const currentPageActions = getPageActions()
  
  // Determine if we're on a detail/specific page
  const isDetailPage = pathname.includes('[id]') || /\/[a-f0-9-]+$/i.test(pathname)

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center justify-between px-4 sm:px-6 w-full">
        {/* Left side - Trigger and Breadcrumbs */}
        <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
          <div className="flex items-center gap-2 sm:gap-3">
            <SidebarTrigger className="size-8 sm:size-7" />
            <Separator orientation="vertical" className="h-4 hidden sm:block" />
          </div>
          
          {/* Breadcrumbs - Show abbreviated on mobile */}
          <Breadcrumb className="flex">
            <BreadcrumbList>
              <BreadcrumbItem className="hidden sm:block">
                <BreadcrumbLink href="/dashboard">Home</BreadcrumbLink>
              </BreadcrumbItem>
              {breadcrumbs.length > 0 && (
                <>
                  {/* Mobile: Only show current page */}
                  <BreadcrumbItem className="sm:hidden">
                    <BreadcrumbPage className="text-sm max-w-[140px] truncate">
                      {breadcrumbs[breadcrumbs.length - 1].label}
                    </BreadcrumbPage>
                  </BreadcrumbItem>
                  
                  {/* Desktop: Show full breadcrumb */}
                  {breadcrumbs.map((crumb, index) => (
                    <React.Fragment key={crumb.path}>
                      <BreadcrumbSeparator className="hidden sm:block" />
                      <BreadcrumbItem className="hidden sm:block">
                        {crumb.isLast ? (
                          <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                        ) : (
                          <BreadcrumbLink href={crumb.path}>{crumb.label}</BreadcrumbLink>
                        )}
                      </BreadcrumbItem>
                    </React.Fragment>
                  ))}
                </>
              )}
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        {/* Center - Search (hidden on detail pages and mobile) */}
        {!isDetailPage && (
          <div className="hidden lg:flex flex-1 max-w-md mx-6">
            <GlobalSearch />
          </div>
        )}

        {/* Right side - Context Actions + Global Actions */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Page-specific actions - hide some on mobile */}
          {currentPageActions.length > 0 && (
            <>
              {/* Mobile: Show only first action or use dropdown */}
              <div className="flex sm:hidden">
                {currentPageActions.slice(0, 1)}
              </div>
              
              {/* Desktop: Show all actions */}
              <div className="hidden sm:flex items-center gap-2">
                {currentPageActions}
              </div>
              <Separator orientation="vertical" className="h-4 hidden sm:block" />
            </>
          )}

          {/* Mobile Actions Menu */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="sm:hidden h-8 w-8">
                <IconMenu2 className="h-4 w-4" />
                <span className="sr-only">More actions</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px]">
              <SheetHeader>
                <SheetTitle>Actions</SheetTitle>
              </SheetHeader>
              <div className="mt-6 flex flex-col gap-2">
                {/* Additional page actions for mobile */}
                {currentPageActions.slice(1).map((action, index) => (
                  <div key={index}>{action}</div>
                ))}
                
                <Separator className="my-2" />
                
                {/* Global actions */}
                <Button variant="outline" className="justify-start" onClick={() => {
                  setMobileSearchOpen(true)
                }}>
                  <IconSearch className="h-4 w-4 mr-2" />
                  Search
                </Button>
                
                <Button variant="outline" className="justify-start">
                  <IconCalendar className="h-4 w-4 mr-2" />
                  Calendar
                </Button>
                
                <Button variant="outline" className="justify-start">
                  <IconChartBar className="h-4 w-4 mr-2" />
                  Analytics
                </Button>
              </div>
            </SheetContent>
          </Sheet>

          {/* Quick access to search on tablet/detail pages */}
          <Sheet open={mobileSearchOpen} onOpenChange={setMobileSearchOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="hidden sm:flex lg:hidden h-9 w-9">
                <IconSearch className="h-4 w-4" />
                <span className="sr-only">Search</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="top" className="h-auto">
              <SheetHeader>
                <SheetTitle>Search</SheetTitle>
              </SheetHeader>
              <div className="mt-4">
                <GlobalSearch autoFocus />
              </div>
            </SheetContent>
          </Sheet>

          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative h-8 w-8 sm:h-9 sm:w-9">
                <IconBell className="h-4 w-4" />
                <span className="absolute top-1 right-1 sm:top-1.5 sm:right-1.5 h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-red-500 animate-pulse" />
                <span className="sr-only">Notifications</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[280px] sm:w-80">
              <DropdownMenuLabel className="flex items-center justify-between">
                Notifications
                <Badge variant="secondary" className="ml-2">3 new</Badge>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-medium">Video processing complete</p>
                  <p className="text-xs text-muted-foreground">Your video "Product Demo" has finished processing</p>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-medium">New team member joined</p>
                  <p className="text-xs text-muted-foreground">Sarah has accepted your invitation</p>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-medium">Monthly usage update</p>
                  <p className="text-xs text-muted-foreground">You've used 75% of your monthly quota</p>
                </div>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-center">
                <span className="text-sm text-primary">View all notifications</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Theme Toggle - Hidden on mobile */}
          <div className="hidden sm:block">
            <ThemeToggle />
          </div>

          {/* User Menu */}
          <UserMenu />
        </div>
      </div>
    </header>
  )
} 
