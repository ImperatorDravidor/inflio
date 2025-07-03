"use client"

import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  IconPencil,
  IconCalendar,
  IconTemplate,
  IconWand,
  IconChartBar,
  IconUsers,
  IconSparkles,
  IconRocket,
  IconBolt,
  IconTarget,
  IconBulb,
  IconHash
} from "@tabler/icons-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

interface QuickAction {
  id: string
  title: string
  description: string
  icon: any
  color: string
  bgColor: string
  action: () => void
}

interface SocialQuickActionsProps {
  variant?: 'grid' | 'carousel'
  showLabels?: boolean
}

export function SocialQuickActions({ 
  variant = 'grid',
  showLabels = true
}: SocialQuickActionsProps) {
  const router = useRouter()

  const quickActions: QuickAction[] = [
    {
      id: 'compose',
      title: 'Create Post',
      description: 'Compose new content',
      icon: IconPencil,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100 dark:bg-purple-900/20',
      action: () => router.push('/social/compose')
    },
    {
      id: 'calendar',
      title: 'Calendar',
      description: 'View schedule',
      icon: IconCalendar,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900/20',
      action: () => router.push('/social/calendar')
    },
    {
      id: 'analytics',
      title: 'Analytics',
      description: 'View insights',
      icon: IconChartBar,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100 dark:bg-orange-900/20',
      action: () => router.push('/analytics')
    }
  ]

  const containerClass = variant === 'grid' 
    ? 'grid grid-cols-1 md:grid-cols-3 gap-4'
    : 'flex gap-4 overflow-x-auto pb-4 scrollbar-hide'

  const cardClass = variant === 'grid'
    ? ''
    : 'flex-shrink-0 w-[140px]'

  return (
    <div className={containerClass}>
      {quickActions.map((action, index) => {
        const Icon = action.icon
        
        return (
          <motion.div
            key={action.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            whileHover={{ y: -4, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={cardClass}
          >
            <Card 
              className="cursor-pointer hover:shadow-lg transition-all duration-200 h-full"
              onClick={action.action}
            >
              <CardContent className="p-4 text-center">
                <motion.div
                  whileHover={{ rotate: [0, -10, 10, -10, 0] }}
                  transition={{ duration: 0.5 }}
                  className={cn(
                    "mx-auto mb-3 p-3 rounded-xl w-fit",
                    action.bgColor
                  )}
                >
                  <Icon className={cn("h-6 w-6", action.color)} />
                </motion.div>
                
                {showLabels && (
                  <>
                    <h3 className="font-medium text-sm">{action.title}</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      {action.description}
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )
      })}
    </div>
  )
}

// Enhanced Quick Create Widget
interface QuickCreateWidgetProps {
  onCreatePost?: () => void
  onSchedulePost?: () => void
  onBulkUpload?: () => void
}

export function QuickCreateWidget({
  onCreatePost,
  onSchedulePost,
  onBulkUpload
}: QuickCreateWidgetProps) {
  const router = useRouter()

  const actions = [
    {
      title: 'Quick Post',
      description: 'Create and publish instantly',
      icon: IconBolt,
      gradient: 'from-purple-500 to-pink-500',
      action: onCreatePost || (() => router.push('/social/compose?quick=true'))
    },
    {
      title: 'Schedule',
      description: 'Plan your content ahead',
      icon: IconCalendar,
      gradient: 'from-blue-500 to-cyan-500',
      action: onSchedulePost || (() => router.push('/social/compose'))
    }
  ]

  return (
    <Card className="overflow-hidden">
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Quick Create</h3>
            <p className="text-sm text-muted-foreground">
              Start creating content in seconds
            </p>
          </div>
          <IconSparkles className="h-5 w-5 text-muted-foreground" />
        </div>

        <div className="space-y-3">
          {actions.map((action, index) => {
            const Icon = action.icon
            
            return (
              <motion.button
                key={action.title}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ x: 4 }}
                onClick={action.action}
                className="w-full group"
              >
                <div className="flex items-center gap-4 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-all">
                  <div className={cn(
                    "p-2 rounded-lg bg-gradient-to-br text-white",
                    action.gradient
                  )}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-medium text-sm">{action.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {action.description}
                    </p>
                  </div>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <IconSparkles className="h-4 w-4 text-muted-foreground" />
                  </motion.div>
                </div>
              </motion.button>
            )
          })}
        </div>

        <div className="pt-4 border-t">
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => router.push('/social/compose')}
          >
            <IconHash className="h-4 w-4 mr-2" />
            Advanced Options
          </Button>
        </div>
      </div>
    </Card>
  )
} 