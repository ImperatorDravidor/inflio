"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import {
  IconTrendingUp,
  IconTrendingDown,
  IconSparkles,
  IconBolt,
  IconGift,
  IconTarget,
  IconChevronUp,
  IconChevronDown,
  IconCamera,
  IconEdit,
  IconCheck
} from "@tabler/icons-react"
import type { Icon } from "@tabler/icons-react"
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  ResponsiveContainer, 
  Tooltip, 
  XAxis, 
  YAxis, 
  CartesianGrid,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis
} from 'recharts'

// Type for icon component
type IconComponent = Icon

// Achievement Badge Component
export function AchievementBadge({ 
  achievement,
  onClaim 
}: { 
  achievement: {
    id: string
    title: string
    description: string
    icon: IconComponent
    color: string
    progress: number
    maxProgress: number
    reward?: string
    claimed?: boolean
    rarity: 'common' | 'rare' | 'epic' | 'legendary'
  }
  onClaim?: () => void
}) {
  const rarityColors = {
    common: 'from-gray-400 to-gray-600',
    rare: 'from-blue-400 to-blue-600',
    epic: 'from-purple-400 to-purple-600',
    legendary: 'from-yellow-400 to-orange-600'
  }

  const isComplete = achievement.progress >= achievement.maxProgress

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="relative"
    >
      <Card className={cn(
        "overflow-hidden cursor-pointer transition-all",
        isComplete && !achievement.claimed && "ring-2 ring-primary animate-pulse"
      )}>
        <div className={cn(
          "absolute inset-0 opacity-10",
          `bg-gradient-to-br ${rarityColors[achievement.rarity]}`
        )} />
        <CardContent className="relative p-4">
          <div className="flex items-start gap-3">
            <div className={cn(
              "p-2 rounded-lg",
              achievement.color
            )}>
              <achievement.icon className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-sm">{achievement.title}</h4>
              <p className="text-xs text-muted-foreground mt-0.5">{achievement.description}</p>
              <div className="mt-2">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span>{achievement.progress}/{achievement.maxProgress}</span>
                  <span>{Math.round((achievement.progress / achievement.maxProgress) * 100)}%</span>
                </div>
                <Progress value={(achievement.progress / achievement.maxProgress) * 100} className="h-1.5" />
              </div>
              {isComplete && achievement.reward && (
                <div className="mt-2">
                  {achievement.claimed ? (
                    <Badge variant="secondary" className="text-xs">
                      <IconCheck className="h-3 w-3 mr-1" />
                      Claimed
                    </Badge>
                  ) : (
                    <Button
                      size="sm"
                      className="h-6 text-xs"
                      onClick={(e) => {
                        e.stopPropagation()
                        onClaim?.()
                      }}
                    >
                      <IconGift className="h-3 w-3 mr-1" />
                      Claim {achievement.reward}
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// Animated Stat Card
export function AnimatedStatCard({
  title,
  value,
  change,
  icon: Icon,
  color,
  prefix = "",
  suffix = "",
  sparkline
}: {
  title: string
  value: number
  change?: number
  icon: IconComponent
  color: string
  prefix?: string
  suffix?: string
  sparkline?: number[]
}) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <motion.div
      whileHover={{ y: -4 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      <Card className="relative overflow-hidden">
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-2">
            <div className={cn("p-2 rounded-lg", color)}>
              <Icon className="h-4 w-4 text-white" />
            </div>
            {change !== undefined && (
              <Badge 
                variant={change >= 0 ? "default" : "destructive"} 
                className="text-xs"
              >
                {change >= 0 ? <IconTrendingUp className="h-3 w-3 mr-1" /> : <IconTrendingDown className="h-3 w-3 mr-1" />}
                {Math.abs(change)}%
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold mt-1">
            {prefix}{value.toLocaleString()}{suffix}
          </p>
          {sparkline && sparkline.length > 0 && (
            <div className="absolute bottom-0 left-0 right-0 h-12 opacity-20">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={sparkline.map((v, i) => ({ value: v, index: i }))}>
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="currentColor"
                    fill="currentColor"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute top-2 right-2"
            >
              <IconSparkles className="h-4 w-4 text-yellow-500" />
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  )
}

// Platform Performance Card
export function PlatformPerformanceCard({
  platform,
  data,
  onConnect
}: {
  platform: {
    name: string
    icon: IconComponent
    color: string
    isConnected: boolean
    metrics: {
      views: number
      followers: number
      engagement: number
      posts: number
    }
    topContent?: {
      title: string
      views: number
      thumbnail?: string
    }
  }
  data: Array<{ views: number }>
  onConnect?: () => void
}) {
  const [showDetails, setShowDetails] = useState(false)

  return (
    <Card className={cn(
      "relative overflow-hidden transition-all",
      !platform.isConnected && "opacity-75"
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <platform.icon className={cn("h-5 w-5", platform.color)} />
            <CardTitle className="text-base">{platform.name}</CardTitle>
          </div>
          {platform.isConnected ? (
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setShowDetails(!showDetails)}
            >
              {showDetails ? <IconChevronUp className="h-4 w-4" /> : <IconChevronDown className="h-4 w-4" />}
            </Button>
          ) : (
            <Button size="sm" variant="outline" onClick={onConnect}>
              Connect
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {platform.isConnected ? (
          <>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <p className="text-xs text-muted-foreground">Views</p>
                <p className="text-lg font-bold">
                  {platform.metrics.views.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Followers</p>
                <p className="text-lg font-bold">
                  {platform.metrics.followers.toLocaleString()}
                </p>
              </div>
            </div>
            
            <AnimatePresence>
              {showDetails && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="pt-3 border-t space-y-3">
                    <div className="h-24">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data}>
                          <Line 
                            type="monotone" 
                            dataKey="views" 
                            stroke="currentColor" 
                            strokeWidth={2}
                            dot={false}
                          />
                          <Tooltip />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                    {platform.topContent && (
                      <div className="p-2 rounded-lg bg-muted/50">
                        <p className="text-xs font-medium mb-1">Top Content</p>
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {platform.topContent.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {platform.topContent.views.toLocaleString()} views
                        </p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        ) : (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground mb-2">
              Connect to track performance
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Content Type Performance Radar
export function ContentTypeRadar({ data }: { data: Array<{ type: string; score: number }> }) {
  const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444']

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Content Performance</CardTitle>
        <CardDescription>By content type</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={data}>
              <PolarGrid stroke="#e5e7eb" />
              <PolarAngleAxis dataKey="type" tick={{ fontSize: 12 }} />
              <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 10 }} />
              <Radar
                name="Performance"
                dataKey="score"
                stroke="#8b5cf6"
                fill="#8b5cf6"
                fillOpacity={0.6}
              />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

// Engagement Timeline
export function EngagementTimeline({ data }: { data: Array<{ hour: string; engagement: number }> }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Engagement Timeline</CardTitle>
        <CardDescription>Hourly engagement patterns</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorEngagement" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="hour" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="engagement"
                stroke="#8b5cf6"
                fillOpacity={1}
                fill="url(#colorEngagement)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

// Milestone Tracker
export function MilestoneTracker({
  milestones,
  currentValue
}: {
  milestones: Array<{
    value: number
    label: string
    reward: string
    icon: IconComponent
  }>
  currentValue: number
}) {
  const nextMilestone = milestones.find(m => m.value > currentValue) || milestones[milestones.length - 1]
  const progress = Math.min(100, (currentValue / nextMilestone.value) * 100)

  return (
    <Card className="bg-gradient-to-br from-primary/5 to-accent/5">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <IconTarget className="h-5 w-5 text-primary" />
          Next Milestone
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <nextMilestone.icon className="h-5 w-5 text-primary" />
              <span className="font-semibold">{nextMilestone.label}</span>
            </div>
            <Badge variant="secondary">{nextMilestone.reward}</Badge>
          </div>
          <div>
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-muted-foreground">{currentValue.toLocaleString()}</span>
              <span className="font-medium">{nextMilestone.value.toLocaleString()}</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
          <p className="text-xs text-muted-foreground">
            {(nextMilestone.value - currentValue).toLocaleString()} to go!
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

// Quick Create Widget
export function QuickCreateWidget({ onAction }: { onAction: (type: string) => void }) {
  const [selectedType, setSelectedType] = useState<string | null>(null)

  const createOptions = [
    { id: 'video', label: 'Video', icon: IconCamera, color: 'bg-purple-500' },
    { id: 'short', label: 'Short', icon: IconBolt, color: 'bg-blue-500' },
    { id: 'blog', label: 'Blog', icon: IconEdit, color: 'bg-green-500' },
    { id: 'audio', label: 'Podcast', icon: IconCamera, color: 'bg-orange-500' }
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <IconCamera className="h-5 w-5 text-primary" />
          Quick Create
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2">
          {createOptions.map((option) => (
            <motion.button
              key={option.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setSelectedType(option.id)
                onAction(option.id)
              }}
              className={cn(
                "p-3 rounded-lg border-2 transition-all text-left",
                selectedType === option.id
                  ? "border-primary bg-primary/10"
                  : "border-transparent bg-muted/50 hover:bg-muted"
              )}
            >
              <div className={cn("p-2 rounded-lg w-fit mb-2", option.color)}>
                <option.icon className="h-4 w-4 text-white" />
              </div>
              <p className="text-sm font-medium">{option.label}</p>
            </motion.button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// Celebration Component
export function CelebrationOverlay({ show }: { show: boolean }) {
  if (!show) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 pointer-events-none z-50"
      >
        {Array.from({ length: 30 }).map((_, i) => (
          <motion.div
            key={i}
            initial={{ 
              x: Math.random() * window.innerWidth,
              y: window.innerHeight + 100,
              rotate: Math.random() * 360
            }}
            animate={{ 
              y: -100,
              rotate: Math.random() * 720,
              transition: {
                duration: 3 + Math.random() * 2,
                ease: "easeOut"
              }
            }}
            className="absolute"
          >
            <div 
              className={cn(
                "w-3 h-3 rounded-full",
                i % 4 === 0 && "bg-purple-500",
                i % 4 === 1 && "bg-pink-500",
                i % 4 === 2 && "bg-yellow-500",
                i % 4 === 3 && "bg-blue-500"
              )}
            />
          </motion.div>
        ))}
      </motion.div>
    </AnimatePresence>
  )
} 