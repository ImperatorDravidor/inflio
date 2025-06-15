"use client"

import * as React from "react"
import { useAuth } from "@clerk/nextjs"
import {
  IconVideoPlus,
  IconFolder,
  IconChartBar,
  IconSettings,
  IconUser,
  IconHome,
  IconSparkles,
  IconHelpCircle,
  IconVideo,
  IconTrendingUp,
} from "@tabler/icons-react"

import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import { InflioLogo } from "@/components/inflio-logo"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { ProjectService } from "@/lib/services"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const { userId } = useAuth()
  const [projectCount, setProjectCount] = React.useState<number>(0)
  
  // Fetch project count on mount
  React.useEffect(() => {
    const fetchProjectCount = async () => {
      try {
        if (!userId) {
          setProjectCount(0)
          return
        }
        const projects = await ProjectService.getAllProjects(userId)
        setProjectCount(projects.length)
      } catch (error) {
        console.error('Failed to fetch project count:', error)
        setProjectCount(0)
      }
    }
    
    fetchProjectCount()
    
    // Listen for project updates
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'inflio_projects') {
        fetchProjectCount()
      }
    }
    
    window.addEventListener('storage', handleStorageChange)
    
    // Also listen for custom project update events
    const handleProjectUpdate = () => {
      fetchProjectCount()
    }
    
    window.addEventListener('projectUpdate', handleProjectUpdate)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('projectUpdate', handleProjectUpdate)
    }
  }, [userId])
  
  const workflowItems = [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: IconHome,
      badge: null,
      description: "Overview & insights"
    },
    {
      title: "Create Video",
      url: "/studio/upload",
      icon: IconVideoPlus,
      badge: null,
      description: "Upload & process content"
    },
    {
      title: "My Videos",
      url: "/projects",
      icon: IconVideo,
      badge: projectCount > 0 ? projectCount.toString() : null,
      description: "Your video library"
    },
    {
      title: "Analytics",
      url: "/analytics",
      icon: IconTrendingUp,
      badge: null,
      description: "Performance metrics"
    },
  ]

  const accountItems = [
    {
      title: "Profile",
      url: "/profile",
      icon: IconUser,
      description: "Creator settings"
    },
    {
      title: "Settings",
      url: "/settings",
      icon: IconSettings,
      description: "App preferences"
    },
  ]
  
  return (
    <Sidebar variant="inset" className="flex flex-col h-screen overflow-hidden border-r border-sidebar-border/60 bg-gradient-to-b from-sidebar/98 to-sidebar backdrop-blur-xl" {...props}>
      {/* Header with Logo */}
      <SidebarHeader className="flex-shrink-0 p-6 border-b border-sidebar-border/40">
        <Link href="/dashboard" className="flex items-center justify-center hover:scale-105 transition-transform duration-200">
          <InflioLogo size="xl" />
        </Link>
      </SidebarHeader>
      
      <SidebarContent className="flex-1 overflow-y-auto scrollbar-none px-4 py-4">
        {/* Main Navigation */}
        <SidebarGroup className="mb-6">
          <SidebarGroupLabel className="text-xs font-bold uppercase tracking-widest text-sidebar-foreground/70 mb-4 px-3">
            Workspace
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {workflowItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.url}
                    className="group relative h-12 px-3 py-2 rounded-xl hover:bg-sidebar-accent/90 data-[active=true]:bg-gradient-to-r data-[active=true]:from-sidebar-primary/25 data-[active=true]:to-sidebar-primary/15 data-[active=true]:text-sidebar-primary data-[active=true]:border data-[active=true]:border-sidebar-primary/30 transition-all duration-200 hover:shadow-sm"
                  >
                    <Link href={item.url} className="flex items-center w-full">
                      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-sidebar-accent/60 group-hover:bg-sidebar-accent/80 group-data-[active=true]:bg-sidebar-primary/25 transition-colors mr-3">
                        <item.icon className="h-4 w-4 group-data-[active=true]:text-sidebar-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-sm">{item.title}</span>
                          {item.badge && (
                            <span className="text-xs bg-sidebar-primary/15 text-sidebar-primary px-2 py-1 rounded-full font-semibold">
                              {item.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-sidebar-foreground/60 mt-0.5">{item.description}</p>
                      </div>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        
        <SidebarSeparator className="bg-sidebar-border/40 mx-2 mb-6" />
        
        {/* Account Section */}
        <SidebarGroup className="mb-6">
          <SidebarGroupLabel className="text-xs font-bold uppercase tracking-widest text-sidebar-foreground/70 mb-4 px-3">
            Account
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {accountItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={pathname === item.url}
                    className="group relative h-12 px-3 py-2 rounded-xl hover:bg-sidebar-accent/90 data-[active=true]:bg-gradient-to-r data-[active=true]:from-sidebar-primary/25 data-[active=true]:to-sidebar-primary/15 data-[active=true]:text-sidebar-primary data-[active=true]:border data-[active=true]:border-sidebar-primary/30 transition-all duration-200 hover:shadow-sm"
                  >
                    <Link href={item.url} className="flex items-center w-full">
                      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-sidebar-accent/60 group-hover:bg-sidebar-accent/80 group-data-[active=true]:bg-sidebar-primary/25 transition-colors mr-3">
                        <item.icon className="h-4 w-4 group-data-[active=true]:text-sidebar-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm">{item.title}</div>
                        <p className="text-xs text-sidebar-foreground/60 mt-0.5">{item.description}</p>
                      </div>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        
        {/* Usage Stats */}
        <div className="mt-auto px-2 mb-4">
          <div className="rounded-2xl bg-gradient-to-br from-sidebar-accent/50 via-sidebar-accent/40 to-sidebar-accent/50 border border-sidebar-border/40 p-4 space-y-3 backdrop-blur-sm shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-sidebar-foreground">Monthly Usage</p>
                <p className="text-xs text-sidebar-foreground/70">Video processing</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-sidebar-primary">75</p>
                <p className="text-xs text-sidebar-foreground/60">of 100</p>
              </div>
            </div>
            <Progress value={75} className="h-2 bg-sidebar-accent/60" />
            <p className="text-xs text-sidebar-foreground/70 text-center">25 videos remaining this month</p>
          </div>
        </div>
        
        {/* Help Link */}
        <div className="px-2 mb-4">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild className="h-10 px-3 rounded-xl hover:bg-sidebar-accent/60 transition-colors">
                <Link href="/help" className="flex items-center">
                  <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-sidebar-accent/50 mr-3">
                    <IconHelpCircle className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-medium">Help & Support</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </div>
      </SidebarContent>
      
      <SidebarFooter className="flex-shrink-0 border-t border-sidebar-border/40 bg-sidebar/60 backdrop-blur-sm">
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  )
}
