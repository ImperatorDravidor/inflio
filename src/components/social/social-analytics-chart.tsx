"use client"

import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell
} from "recharts"
import {
  IconTrendingUp,
  IconTrendingDown,
  IconMinus,
  IconEye,
  IconHeart,
  IconMessage,
  IconShare,
  IconUsers,
  IconChartBar
} from "@tabler/icons-react"
import { format } from "date-fns"

interface AnalyticsData {
  date: string
  views: number
  likes: number
  comments: number
  shares: number
  engagement: number
}

interface PlatformData {
  platform: string
  posts: number
  engagement: number
  color: string
}

interface SocialAnalyticsChartProps {
  data?: AnalyticsData[]
  platformData?: PlatformData[]
  timeRange?: '7d' | '30d' | '90d'
  onTimeRangeChange?: (range: '7d' | '30d' | '90d') => void
  showPlatformBreakdown?: boolean
}

const defaultData: AnalyticsData[] = Array.from({ length: 7 }, (_, i) => {
  const date = new Date()
  date.setDate(date.getDate() - (6 - i))
  return {
    date: format(date, 'MMM d'),
    views: 2000 + (i * 300), // Consistent progression
    likes: 150 + (i * 20), // Consistent progression
    comments: 30 + (i * 5), // Consistent progression
    shares: 15 + (i * 3), // Consistent progression
    engagement: 5 + (i * 0.5) // Consistent progression
  }
})

const defaultPlatformData: PlatformData[] = [
  { platform: 'Instagram', posts: 45, engagement: 4.2, color: '#E1306C' },
  { platform: 'TikTok', posts: 38, engagement: 8.1, color: '#000000' },
  { platform: 'YouTube', posts: 22, engagement: 6.8, color: '#FF0000' },
  { platform: 'X', posts: 15, engagement: 2.4, color: '#000000' },
  { platform: 'LinkedIn', posts: 10, engagement: 3.2, color: '#0077B5' }
]

const metrics = [
  { key: 'views', label: 'Views', icon: IconEye, color: '#8b5cf6' },
  { key: 'likes', label: 'Likes', icon: IconHeart, color: '#ec4899' },
  { key: 'comments', label: 'Comments', icon: IconMessage, color: '#3b82f6' },
  { key: 'shares', label: 'Shares', icon: IconShare, color: '#10b981' }
]

export function SocialAnalyticsChart({
  data = defaultData,
  platformData = defaultPlatformData,
  timeRange = '7d',
  onTimeRangeChange,
  showPlatformBreakdown = true
}: SocialAnalyticsChartProps) {
  // Calculate totals and trends
  const totals = data.reduce((acc, day) => ({
    views: acc.views + day.views,
    likes: acc.likes + day.likes,
    comments: acc.comments + day.comments,
    shares: acc.shares + day.shares
  }), { views: 0, likes: 0, comments: 0, shares: 0 })

  const avgEngagement = data.reduce((sum, day) => sum + day.engagement, 0) / data.length
  const trend = data.length > 1 ? 
    ((data[data.length - 1].engagement - data[0].engagement) / data[0].engagement) * 100 : 0

  const TrendIcon = trend > 0 ? IconTrendingUp : trend < 0 ? IconTrendingDown : IconMinus
  const trendColor = trend > 0 ? 'text-green-600' : trend < 0 ? 'text-red-600' : 'text-gray-600'

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg border bg-background p-3 shadow-lg">
          <p className="font-medium">{label}</p>
          <div className="mt-2 space-y-1">
            {payload.map((entry: any) => (
              <div key={entry.dataKey} className="flex items-center justify-between gap-4 text-sm">
                <span className="flex items-center gap-1">
                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: entry.color }} />
                  {entry.name}
                </span>
                <span className="font-medium">{entry.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Social Media Analytics</CardTitle>
            <CardDescription>Track your social media performance</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1">
              <TrendIcon className={cn("h-3 w-3", trendColor)} />
              {Math.abs(trend).toFixed(1)}%
            </Badge>
            <Select value={timeRange} onValueChange={onTimeRangeChange as any}>
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">7 days</SelectItem>
                <SelectItem value="30d">30 days</SelectItem>
                <SelectItem value="90d">90 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {metrics.map((metric, index) => {
            const Icon = metric.icon
            const value = totals[metric.key as keyof typeof totals]
            
            return (
              <motion.div
                key={metric.key}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="rounded-lg border bg-card p-4 hover:shadow-sm transition-shadow"
              >
                <div className="flex items-center justify-between mb-2">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  <Badge 
                    variant="secondary" 
                    className="text-xs"
                    style={{ backgroundColor: `${metric.color}20`, color: metric.color }}
                  >
                    {metric.label}
                  </Badge>
                </div>
                <p className="text-2xl font-bold">{value.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">
                  Avg: {Math.floor(value / data.length).toLocaleString()}/day
                </p>
              </motion.div>
            )
          })}
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid grid-cols-3 w-full max-w-md">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="engagement">Engagement</TabsTrigger>
            {showPlatformBreakdown && (
              <TabsTrigger value="platforms">Platforms</TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                  <defs>
                    <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="date" 
                    className="text-xs"
                    stroke="currentColor"
                  />
                  <YAxis 
                    className="text-xs"
                    stroke="currentColor"
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="views"
                    stroke="#8b5cf6"
                    fillOpacity={1}
                    fill="url(#colorViews)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          <TabsContent value="engagement" className="space-y-4">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="date" 
                    className="text-xs"
                    stroke="currentColor"
                  />
                  <YAxis 
                    className="text-xs"
                    stroke="currentColor"
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend 
                    verticalAlign="top" 
                    height={36}
                    iconType="line"
                  />
                  {metrics.map(metric => (
                    <Line
                      key={metric.key}
                      type="monotone"
                      dataKey={metric.key}
                      stroke={metric.color}
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      activeDot={{ r: 5 }}
                      name={metric.label}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          {showPlatformBreakdown && (
            <TabsContent value="platforms" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="h-[300px]">
                  <h4 className="text-sm font-medium mb-4 text-center">Posts by Platform</h4>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={platformData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ platform, posts }) => `${platform}: ${posts}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="posts"
                      >
                        {platformData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                
                <div className="h-[300px]">
                  <h4 className="text-sm font-medium mb-4 text-center">Engagement by Platform</h4>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={platformData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis 
                        dataKey="platform" 
                        className="text-xs"
                        stroke="currentColor"
                      />
                      <YAxis 
                        className="text-xs"
                        stroke="currentColor"
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar 
                        dataKey="engagement" 
                        fill="#8b5cf6"
                        radius={[8, 8, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </TabsContent>
          )}
        </Tabs>
      </CardContent>
    </Card>
  )
} 