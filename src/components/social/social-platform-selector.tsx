"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import {
  IconBrandTwitter,
  IconBrandInstagram,
  IconBrandLinkedin,
  IconBrandYoutube,
  IconBrandTiktok,
  IconBrandFacebook,
  IconUsers,
  IconTrendingUp,
  IconCheck,
  IconPlus
} from "@tabler/icons-react"

export interface Platform {
  id: string
  name: string
  icon: any
  isConnected: boolean
  isSelected?: boolean
  audienceSize?: number
  engagementRate?: number
  username?: string
}

interface SocialPlatformSelectorProps {
  platforms: Platform[]
  onToggle: (platformId: string) => void
  onConnect?: (platformId: string) => void
  variant?: 'grid' | 'list'
  showStats?: boolean
}

const platformStyles = {
  twitter: { bg: 'bg-black dark:bg-white', text: 'text-white dark:text-black' },
  x: { bg: 'bg-black dark:bg-white', text: 'text-white dark:text-black' },
  instagram: { bg: 'bg-gradient-to-br from-purple-600 to-pink-600', text: 'text-white' },
  linkedin: { bg: 'bg-blue-700', text: 'text-white' },
  youtube: { bg: 'bg-red-600', text: 'text-white' },
  tiktok: { bg: 'bg-black', text: 'text-white' },
  facebook: { bg: 'bg-blue-600', text: 'text-white' }
}

export function SocialPlatformSelector({
  platforms,
  onToggle,
  onConnect,
  variant = 'grid',
  showStats = true
}: SocialPlatformSelectorProps) {
  const containerClass = variant === 'grid' 
    ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
    : 'space-y-3'

  return (
    <div className={containerClass}>
      {platforms.map((platform, index) => {
        const Icon = platform.icon
        const style = platformStyles[platform.id as keyof typeof platformStyles] || platformStyles.twitter
        const isActive = platform.isConnected && platform.isSelected

        return (
          <motion.div
            key={platform.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            whileHover={{ y: -2 }}
            className={cn(
              "relative overflow-hidden rounded-xl border bg-card transition-all duration-200",
              isActive && "border-primary shadow-md",
              !platform.isConnected && "opacity-80"
            )}
          >
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-5">
              <div className="absolute inset-0" style={{
                backgroundImage: `radial-gradient(circle at 20% 80%, currentColor 1px, transparent 1px)`,
                backgroundSize: '20px 20px'
              }} />
            </div>

            <div className="relative p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={cn(
                      "relative p-3 rounded-lg transition-all",
                      style.bg,
                      style.text
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    {isActive && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-1 -right-1 bg-green-500 rounded-full p-0.5"
                      >
                        <IconCheck className="h-3 w-3 text-white" />
                      </motion.div>
                    )}
                  </motion.div>
                  <div>
                    <h3 className="font-medium">{platform.name}</h3>
                    {platform.username && (
                      <p className="text-sm text-muted-foreground">@{platform.username}</p>
                    )}
                  </div>
                </div>
                
                {platform.isConnected ? (
                  <Switch
                    checked={platform.isSelected}
                    onCheckedChange={() => onToggle(platform.id)}
                    className="data-[state=checked]:bg-primary"
                  />
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onConnect?.(platform.id)}
                    className="h-8"
                  >
                    <IconPlus className="h-3 w-3 mr-1" />
                    Connect
                  </Button>
                )}
              </div>

              {platform.isConnected && showStats && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="flex items-center gap-4 text-sm"
                >
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <IconUsers className="h-4 w-4" />
                    <span>{platform.audienceSize?.toLocaleString() || 0}</span>
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <IconTrendingUp className="h-4 w-4" />
                    <span>{platform.engagementRate || 0}%</span>
                  </div>
                </motion.div>
              )}

              {!platform.isConnected && (
                <p className="text-sm text-muted-foreground mt-2">
                  Connect your account to start posting
                </p>
              )}
            </div>
          </motion.div>
        )
      })}
    </div>
  )
} 