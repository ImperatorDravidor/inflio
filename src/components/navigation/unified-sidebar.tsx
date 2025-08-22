"use client"

import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Home, Video, Image, Share2, Calendar, BarChart3, Settings,
  ChevronLeft, ChevronRight, Plus, Search, Bell, User,
  Sparkles, TrendingUp, Clock, Hash, Zap, Brain,
  FolderOpen, FileText, Users, HelpCircle, LogOut,
  PlayCircle, Upload, Edit3, Grid, List, Palette
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { designSystem } from '@/lib/design-system'

interface UnifiedSidebarProps {
  user?: {
    name: string
    email: string
    imageUrl?: string
  }
  credits?: number
  notifications?: number
}

export function UnifiedSidebar({ user, credits = 100, notifications = 0 }: UnifiedSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const pathname = usePathname()
  const router = useRouter()

  // Navigation items with proper grouping
  const navigationGroups = [
    {
      label: 'Main',
      items: [
        { 
          id: 'dashboard',
          label: 'Dashboard', 
          icon: Home, 
          href: '/dashboard',
          badge: null
        },
        { 
          id: 'projects',
          label: 'Projects', 
          icon: FolderOpen, 
          href: '/projects',
          badge: { text: '12', variant: 'secondary' as const }
        },
        {
          id: 'studio',
          label: 'Studio',
          icon: Video,
          href: '/studio/upload',
          badge: { text: 'New', variant: 'success' as const }
        }
      ]
    },
    {
      label: 'Create',
      items: [
        {
          id: 'thumbnails',
          label: 'Thumbnails',
          icon: Image,
          href: '/create/thumbnails',
          badge: null
        },
        {
          id: 'posts',
          label: 'Social Posts',
          icon: Share2,
          href: '/create/posts',
          badge: { text: 'AI', variant: 'secondary' as const }
        },
        {
          id: 'editor',
          label: 'Editor',
          icon: Edit3,
          href: '/create/editor',
          badge: null
        }
      ]
    },
    {
      label: 'Publish',
      items: [
        {
          id: 'calendar',
          label: 'Calendar',
          icon: Calendar,
          href: '/social/calendar',
          badge: notifications > 0 ? { text: String(notifications), variant: 'default' as const } : null
        },
        {
          id: 'schedule',
          label: 'Scheduler',
          icon: Clock,
          href: '/social/compose',
          badge: null
        },
        {
          id: 'analytics',
          label: 'Analytics',
          icon: BarChart3,
          href: '/analytics',
          badge: null
        }
      ]
    },
    {
      label: 'Tools',
      items: [
        {
          id: 'templates',
          label: 'Templates',
          icon: Grid,
          href: '/templates',
          badge: null
        },
        {
          id: 'ai-tools',
          label: 'AI Tools',
          icon: Brain,
          href: '/ai-tools',
          badge: { text: 'Beta', variant: 'warning' as const }
        },
        {
          id: 'brand',
          label: 'Brand Kit',
          icon: Palette,
          href: '/brand',
          badge: null
        }
      ]
    }
  ]

  // Quick actions
  const quickActions = [
    { id: 'upload', label: 'Upload Video', icon: Upload, action: () => router.push('/studio/upload') },
    { id: 'create', label: 'Create Post', icon: Plus, action: () => router.push('/social/compose') },
    { id: 'generate', label: 'AI Generate', icon: Sparkles, action: () => router.push('/ai-tools') }
  ]

  const isActive = (href: string) => pathname === href

  return (
    <TooltipProvider>
      <motion.aside
        className={cn(
          "relative flex flex-col h-screen bg-background border-r",
          "transition-all duration-300 ease-in-out",
          isCollapsed ? "w-20" : "w-64"
        )}
        initial={false}
        animate={{ width: isCollapsed ? 80 : 256 }}
      >
        {/* Logo and Brand */}
        <div className="h-16 flex items-center justify-between px-4 border-b">
          <motion.div
            className="flex items-center gap-3"
            animate={{ opacity: isCollapsed ? 0 : 1 }}
            transition={{ duration: 0.2 }}
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            {!isCollapsed && (
              <span className="font-bold text-lg">Inflio</span>
            )}
          </motion.div>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="ml-auto"
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Search */}
        {!isCollapsed && (
          <div className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
          </div>
        )}

        {/* Quick Actions */}
        {!isCollapsed && (
          <div className="px-4 pb-4">
            <div className="grid grid-cols-3 gap-2">
              {quickActions.map((action) => (
                <Tooltip key={action.id}>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={action.action}
                      className="flex flex-col items-center gap-1 h-auto py-2"
                    >
                      <action.icon className="h-4 w-4" />
                      <span className="text-xs">{action.label.split(' ')[0]}</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{action.label}</p>
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
          </div>
        )}

        <Separator />

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-6">
          {navigationGroups.map((group) => (
            <div key={group.label} className="space-y-1">
              {!isCollapsed && (
                <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-2 mb-2">
                  {group.label}
                </h4>
              )}
              
              {group.items.map((item) => {
                const Icon = item.icon
                const active = isActive(item.href)
                
                return (
                  <Tooltip key={item.id} delayDuration={0}>
                    <TooltipTrigger asChild>
                      <Button
                        variant={active ? 'secondary' : 'ghost'}
                        className={cn(
                          "w-full justify-start gap-3 relative",
                          isCollapsed && "justify-center",
                          active && "bg-primary/10 text-primary hover:bg-primary/20"
                        )}
                        onClick={() => router.push(item.href)}
                      >
                        <Icon className={cn(
                          "h-5 w-5",
                          active && "text-primary"
                        )} />
                        
                        {!isCollapsed && (
                          <>
                            <span className="flex-1 text-left">{item.label}</span>
                            {item.badge && (
                              <Badge 
                                variant={item.badge.variant}
                                className="ml-auto"
                              >
                                {item.badge.text}
                              </Badge>
                            )}
                          </>
                        )}
                        
                        {/* Active indicator */}
                        {active && (
                          <motion.div
                            className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r"
                            layoutId="activeIndicator"
                            transition={{
                              type: "spring",
                              stiffness: 350,
                              damping: 30
                            }}
                          />
                        )}
                      </Button>
                    </TooltipTrigger>
                    {isCollapsed && (
                      <TooltipContent side="right">
                        <div className="flex items-center gap-2">
                          <p>{item.label}</p>
                          {item.badge && (
                            <Badge variant={item.badge.variant} className="ml-1">
                              {item.badge.text}
                            </Badge>
                          )}
                        </div>
                      </TooltipContent>
                    )}
                  </Tooltip>
                )
              })}
            </div>
          ))}
        </nav>

        <Separator />

        {/* Credits Display */}
        {!isCollapsed && (
          <div className="p-4">
            <div className="rounded-lg bg-gradient-to-r from-purple-500/10 to-pink-500/10 p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">AI Credits</span>
                <Badge variant="secondary">{credits}</Badge>
              </div>
              <Progress value={(credits / 500) * 100} className="h-1.5" />
              <p className="text-xs text-muted-foreground mt-2">
                Resets in 15 days
              </p>
              <Button size="sm" className="w-full mt-2" variant="outline">
                <Zap className="h-3 w-3 mr-1" />
                Upgrade
              </Button>
            </div>
          </div>
        )}

        {/* User Profile */}
        <div className="p-4 border-t">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start gap-3",
                    isCollapsed && "justify-center"
                  )}
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.imageUrl} alt={user.name} />
                    <AvatarFallback>
                      {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  
                  {!isCollapsed && (
                    <div className="flex-1 text-left">
                      <p className="text-sm font-medium">{user.name}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align={isCollapsed ? "center" : "end"} className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push('/profile')}>
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push('/settings')}>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push('/help')}>
                  <HelpCircle className="mr-2 h-4 w-4" />
                  Help & Support
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-red-600">
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start gap-3",
                isCollapsed && "justify-center"
              )}
              onClick={() => router.push('/sign-in')}
            >
              <User className="h-5 w-5" />
              {!isCollapsed && <span>Sign In</span>}
            </Button>
          )}
        </div>
      </motion.aside>
    </TooltipProvider>
  )
}

// Export preset configurations
export const sidebarConfig = {
  defaultCollapsed: false,
  storageKey: 'sidebar-collapsed',
  animationDuration: 300
}