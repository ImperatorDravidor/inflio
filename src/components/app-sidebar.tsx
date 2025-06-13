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
  IconClock,
  IconSparkles,
  IconBrandX,
  IconBrandDiscord,
  IconBrandGithub,
  IconHelpCircle,
  IconLogout,
  IconChevronRight,
} from "@tabler/icons-react"

import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
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
import { ProjectService } from "@/lib/db-migration"

const supportItems = [
  {
    title: "Help Center",
    url: "/help",
    icon: IconHelpCircle,
  },
  {
    title: "Community",
    url: "https://discord.com",
    icon: IconBrandDiscord,
    external: true,
  },
  {
    title: "GitHub",
    url: "https://github.com",
    icon: IconBrandGithub,
    external: true,
  },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const { userId } = useAuth()
  const [projectCount, setProjectCount] = React.useState<number>(0)
  
  // Fetch project count on mount
  React.useEffect(() => {
    const fetchProjectCount = async () => {
      try {
        const projects = await ProjectService.getAllProjects(userId || undefined)
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
    },
    {
      title: "Upload Video",
      url: "/studio/upload",
      icon: IconVideoPlus,
      badge: null,
    },
    {
      title: "My Projects",
      url: "/projects",
      icon: IconFolder,
      badge: projectCount > 0 ? projectCount.toString() : null,
    },
    {
      title: "Analytics",
      url: "/analytics",
      icon: IconChartBar,
      badge: null,
    },
  ]

  const accountItems = [
    {
      title: "Creator Profile",
      url: "/profile",
      icon: IconUser,
    },
    {
      title: "Settings",
      url: "/settings",
      icon: IconSettings,
    },
  ]
  
  return (
    <Sidebar variant="inset" className="sidebar border-r border-sidebar-border backdrop-blur-md" {...props}>
      <SidebarHeader className="border-b border-sidebar-border/50 bg-gradient-to-br from-sidebar/50 to-sidebar">
        <div className="p-4">
          <Link href="/dashboard" className="flex items-center justify-center rounded-lg hover:bg-sidebar-accent/50 transition-colors py-2">
            <InflioLogo size="lg" />
          </Link>
        </div>
        
        {/* Quick Actions */}
        <div className="px-2 mt-4">
          <Button 
            size="sm" 
            className="w-full gradient-premium hover:opacity-90 transition-all shadow-premium group"
            asChild
          >
            <Link href="/studio/upload">
              <IconSparkles className="h-4 w-4 mr-2 animate-pulse" />
              New Project
            </Link>
          </Button>
        </div>
        
        {/* Usage Stats */}
        <div className="px-2 mt-4">
          <div className="rounded-lg bg-sidebar-accent/50 border border-sidebar-border/50 p-3 space-y-2 backdrop-blur-sm">
            <div className="flex items-center justify-between text-xs">
              <span className="text-sidebar-accent-foreground/70">Monthly Usage</span>
              <span className="font-medium text-sidebar-accent-foreground">75/100</span>
            </div>
            <Progress value={75} className="h-1.5 bg-sidebar-accent" />
            <p className="text-xs text-sidebar-accent-foreground/70">25 videos remaining</p>
          </div>
        </div>
      </SidebarHeader>
      
      <SidebarContent className="bg-gradient-to-b from-sidebar to-sidebar/95">
        {/* Main Navigation */}
        <SidebarGroup className="px-2">
          <SidebarGroupLabel className="text-xs uppercase tracking-wider text-sidebar-foreground/50 mb-2 font-semibold">Workflow</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {workflowItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.url}
                    className="group hover:bg-sidebar-accent/70 data-[active=true]:bg-sidebar-primary data-[active=true]:text-sidebar-primary-foreground transition-all"
                  >
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                      {item.badge && (
                        <span className="ml-auto text-xs bg-sidebar-primary/10 text-sidebar-primary px-1.5 py-0.5 rounded-full">
                          {item.badge}
                        </span>
                      )}
                      <IconChevronRight className="h-3 w-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        
        <SidebarSeparator className="bg-sidebar-border/40 my-2" />
        
        {/* Recent Projects */}
        <SidebarGroup className="px-2">
          <SidebarGroupLabel className="text-xs uppercase tracking-wider text-sidebar-foreground/50 mb-2 font-semibold">Recent Projects</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild className="text-xs hover:bg-sidebar-accent/50 transition-colors">
                  <Link href="/projects/1">
                    <IconClock className="h-3 w-3" />
                    <span className="truncate">Product Demo Video</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild className="text-xs hover:bg-sidebar-accent/50 transition-colors">
                  <Link href="/projects/2">
                    <IconClock className="h-3 w-3" />
                    <span className="truncate">Marketing Campaign</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild className="text-xs hover:bg-sidebar-accent/50 transition-colors">
                  <Link href="/projects/3">
                    <IconClock className="h-3 w-3" />
                    <span className="truncate">Tutorial Series</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        
        <SidebarSeparator className="bg-sidebar-border/40 my-2" />
        
        {/* Account */}
        <SidebarGroup className="px-2">
          <SidebarGroupLabel className="text-xs uppercase tracking-wider text-sidebar-foreground/50 mb-2 font-semibold">Account</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {accountItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={pathname === item.url}
                    className="hover:bg-sidebar-accent/70 data-[active=true]:bg-sidebar-primary data-[active=true]:text-sidebar-primary-foreground transition-all"
                  >
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        
        <SidebarSeparator className="bg-sidebar-border/40 my-2" />
        
        {/* Support */}
        <SidebarGroup className="px-2">
          <SidebarGroupLabel className="text-xs uppercase tracking-wider text-sidebar-foreground/50 mb-2 font-semibold">Support</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {supportItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className="hover:bg-sidebar-accent/50 transition-colors">
                    <a 
                      href={item.url}
                      target={item.external ? "_blank" : undefined}
                      rel={item.external ? "noopener noreferrer" : undefined}
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter className="border-t border-sidebar-border/50 bg-gradient-to-br from-sidebar/50 to-sidebar">
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  )
}
