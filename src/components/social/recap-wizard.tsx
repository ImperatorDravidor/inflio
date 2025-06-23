"use client"

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { 
  SocialMediaService, 
  RecapData, 
  PlatformMetrics,
  ProjectUpdate 
} from '@/lib/social';
import { 
  IconChartBar,
  IconTrendingUp,
  IconUsers,
  IconEye,
  IconHeart,
  IconShare,
  IconCalendar,
  IconBrandInstagram,
  IconBrandTiktok,
  IconBrandFacebook,
  IconBrandYoutube,
  IconBrandLinkedin,
  IconBrandX,
  IconChevronRight,
  IconChevronLeft,
  IconExternalLink,
  IconClock,
  IconCheck,
  IconLoader2,
  IconArrowUp,
  IconArrowDown,
  IconVideo,
  IconMessageCircle,
  IconFileText,
  IconScissors,
  IconAnalyze,
  IconPlayerPlay,
  IconPlayerPause,
  IconDownload,
  IconShare3,
  IconMaximize,
  IconStar
} from '@tabler/icons-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import CountUp from 'react-countup';
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  BarChart,
  Bar,
  ResponsiveContainer, 
  Tooltip, 
  XAxis, 
  YAxis, 
  CartesianGrid,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface RecapWizardProps {
  userId: string;
  period?: 'week' | 'month';
  onClose?: () => void;
}

const platformIcons: Record<string, any> = {
  instagram: IconBrandInstagram,
  tiktok: IconBrandTiktok,
  facebook: IconBrandFacebook,
  youtube: IconBrandYoutube,
  linkedin: IconBrandLinkedin,
  x: IconBrandX,
};

const platformColors: Record<string, string> = {
  instagram: 'text-pink-600',
  tiktok: 'text-black dark:text-white',
  facebook: 'text-blue-600',
  youtube: 'text-red-600',
  linkedin: 'text-blue-700',
  x: 'text-black dark:text-white',
};

const slides = [
  { 
    id: 'overview', 
    title: 'Overview', 
    icon: IconChartBar,
    description: 'Performance trends and content metrics',
    color: 'from-blue-500/10 to-purple-500/10'
  },
  { 
    id: 'platforms', 
    title: 'Platforms', 
    icon: IconUsers,
    description: 'Cross-platform performance breakdown',
    color: 'from-green-500/10 to-blue-500/10'
  },
  { 
    id: 'content', 
    title: 'Content', 
    icon: IconFileText,
    description: 'Top performing posts and engagement',
    color: 'from-purple-500/10 to-pink-500/10'
  },
  { 
    id: 'insights', 
    title: 'Insights', 
    icon: IconAnalyze,
    description: 'AI recommendations and next steps',
    color: 'from-orange-500/10 to-red-500/10'
  },
];

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
    scale: 0.95
  }),
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1,
    scale: 1
  },
  exit: (direction: number) => ({
    zIndex: 0,
    x: direction < 0 ? 300 : -300,
    opacity: 0,
    scale: 0.95
  })
};

const COLORS = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];

export function RecapWizard({ userId, period = 'week', onClose }: RecapWizardProps) {
  const [recapData, setRecapData] = useState<RecapData | null>(null);
  const [projectUpdates, setProjectUpdates] = useState<ProjectUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPeriod, setCurrentPeriod] = useState<'week' | 'month'>(period);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection] = useState(0);
  const [autoAdvance, setAutoAdvance] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);

  useEffect(() => {
    fetchRecapData();
  }, [userId, currentPeriod]);

  // Auto-advance functionality
  useEffect(() => {
    if (!autoAdvance || !isPlaying) return;
    
    const timer = setInterval(() => {
      if (currentSlide < slides.length - 1) {
        handleNext();
      } else {
        setIsPlaying(false);
      }
    }, 8000); // 8 seconds per slide

    return () => clearInterval(timer);
  }, [autoAdvance, isPlaying, currentSlide]);

  // Keyboard navigation
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    switch (event.key) {
      case 'ArrowLeft':
        event.preventDefault();
        handlePrev();
        break;
      case 'ArrowRight':
      case ' ':
        event.preventDefault();
        handleNext();
        break;
      case 'Escape':
        event.preventDefault();
        if (fullscreen) setFullscreen(false);
        else onClose?.();
        break;
      case 'f':
      case 'F':
        event.preventDefault();
        setFullscreen(!fullscreen);
        break;
      default:
        break;
    }
  }, [currentSlide, fullscreen, onClose]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const fetchRecapData = async () => {
    try {
      setLoading(true);
      const [data, updates] = await Promise.all([
        SocialMediaService.getRecapData(userId, currentPeriod),
        SocialMediaService.getProjectUpdates(userId, currentPeriod)
      ]);
      setRecapData(data);
      setProjectUpdates(updates);
    } catch (error) {
      console.error('Error fetching recap data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setDirection(1);
      setCurrentSlide(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentSlide > 0) {
      setDirection(-1);
      setCurrentSlide(prev => prev - 1);
    }
  };

  const goToSlide = (slideIndex: number) => {
    setDirection(slideIndex > currentSlide ? 1 : -1);
    setCurrentSlide(slideIndex);
  };

  const toggleAutoAdvance = () => {
    setAutoAdvance(!autoAdvance);
    if (!autoAdvance) {
      setIsPlaying(true);
    } else {
      setIsPlaying(false);
    }
  };

  const handleExport = () => {
    // Implementation for exporting report
    console.log('Exporting report...');
  };

  if (loading || !recapData) {
    return (
      <div className="flex flex-col items-center justify-center p-12">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", duration: 0.5 }}
        >
          <IconLoader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center"
        >
          <p className="text-lg font-medium">Analyzing your content performance</p>
          <p className="text-sm text-muted-foreground">Gathering metrics from all platforms</p>
        </motion.div>
      </div>
    );
  }

  const { stats, milestones, insights, nextSteps } = recapData;

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  // Enhanced performance data for charts
  const performanceData = Array.from({ length: 7 }, (_, i) => ({
    day: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i],
    views: 2000 + (i * 500), // Consistent progression
    engagement: 40 + (i * 10), // Consistent progression
    reach: 3000 + (i * 800), // Consistent progression
    interactions: 100 + (i * 30) // Consistent progression
  }));

  // Platform distribution data for pie chart
  const platformDistribution = stats.platformMetrics.map((platform, index) => ({
    name: platform.platform,
    value: platform.views,
    color: COLORS[index % COLORS.length]
  }));

  const contentMetrics = [
    { 
      title: 'Videos Processed', 
      value: projectUpdates.filter(p => p.status === 'completed').length,
      change: '+12%',
      positive: true,
      icon: IconVideo,
      trend: [20, 25, 22, 30, 28, 35, 32]
    },
    { 
      title: 'Clips Generated', 
      value: stats.totalEngagements || 0,
      change: '+24%',
      positive: true,
      icon: IconScissors,
      trend: [15, 18, 22, 25, 30, 28, 35]
    },
    { 
      title: 'Posts Published', 
      value: stats.topPerformingContent.length,
      change: '+8%',
      positive: true,
      icon: IconShare,
      trend: [10, 12, 15, 14, 18, 20, 22]
    },
    { 
      title: 'Transcriptions', 
      value: projectUpdates.length,
      change: '+15%',
      positive: true,
      icon: IconFileText,
      trend: [8, 10, 12, 15, 18, 16, 20]
    }
  ];

  const progress = ((currentSlide + 1) / slides.length) * 100;

  const containerClass = cn(
    "transition-all duration-300",
    fullscreen ? "fixed inset-0 z-50 bg-background p-6" : "space-y-6"
  );

  return (
    <div className={containerClass}>
      {/* Enhanced Header */}
      <motion.div 
        layout
        className="flex items-center justify-between"
      >
        <div>
          <motion.h2 
            layout
            className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent"
          >
            Content Performance Report
          </motion.h2>
          <motion.p 
            layout
            className="text-muted-foreground"
          >
            Your {currentPeriod === 'week' ? 'weekly' : 'monthly'} analytics and insights
          </motion.p>
        </div>
        
        <div className="flex items-center gap-3">
          <Tabs value={currentPeriod} onValueChange={(v) => setCurrentPeriod(v as 'week' | 'month')}>
            <TabsList>
              <TabsTrigger value="week">This Week</TabsTrigger>
              <TabsTrigger value="month">This Month</TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Enhanced Controls */}
          <div className="flex items-center gap-2 ml-4">
            <Button variant="outline" size="sm" onClick={toggleAutoAdvance}>
              {isPlaying ? <IconPlayerPause className="h-4 w-4" /> : <IconPlayerPlay className="h-4 w-4" />}
            </Button>
            <Button variant="outline" size="sm" onClick={() => setFullscreen(!fullscreen)}>
              <IconMaximize className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleExport}>
              <IconDownload className="h-4 w-4" />
            </Button>
          </div>
          
          {onClose && (
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          )}
        </div>
      </motion.div>

      {/* Enhanced Progress Bar with Auto-advance indicator */}
      <motion.div layout className="space-y-3">
        <div className="relative">
          <Progress value={progress} className="h-3" />
          {autoAdvance && isPlaying && (
            <motion.div
              className="absolute top-0 left-0 h-3 bg-primary/30 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 8, ease: "linear" }}
            />
          )}
        </div>
        <div className="flex justify-between items-center text-xs text-muted-foreground">
          <span>Step {currentSlide + 1} of {slides.length}</span>
          <div className="flex items-center gap-2">
            {autoAdvance && (
              <Badge variant="outline" className="flex items-center gap-1">
                {isPlaying ? <IconPlayerPlay className="h-3 w-3" /> : <IconPlayerPause className="h-3 w-3" />}
                Auto-advance
              </Badge>
            )}
            <span>{Math.round(progress)}% Complete</span>
          </div>
        </div>
      </motion.div>

      {/* Enhanced Slide Indicators with Previews */}
      <motion.div layout className="flex justify-center space-x-2">
        {slides.map((slide, index) => (
          <motion.button
            key={slide.id}
            onClick={() => goToSlide(index)}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            className={cn(
              "group relative flex flex-col items-center gap-2 p-4 rounded-xl text-sm font-medium transition-all duration-300",
              "border backdrop-blur-sm",
              currentSlide === index
                ? "bg-primary text-primary-foreground shadow-lg scale-105"
                : "bg-background/80 hover:bg-muted/80 text-muted-foreground hover:text-foreground"
            )}
          >
            <div className={cn(
              "w-12 h-12 rounded-lg flex items-center justify-center transition-all",
              currentSlide === index ? "bg-primary-foreground/20" : `bg-gradient-to-br ${slide.color}`
            )}>
              <slide.icon className="h-6 w-6" />
            </div>
            <div className="text-center">
              <div className="font-medium">{slide.title}</div>
              <div className="text-xs opacity-70 hidden sm:block">{slide.description}</div>
            </div>
            
            {/* Progress indicator for each slide */}
            <div className="absolute bottom-1 left-1 right-1 h-1 bg-black/10 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-current"
                initial={{ width: 0 }}
                animate={{ width: index <= currentSlide ? '100%' : '0%' }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              />
            </div>
          </motion.button>
        ))}
      </motion.div>

      {/* Always-visible Enhanced Key Metrics */}
      <motion.div layout className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { title: 'Total Views', value: stats.totalViews, icon: IconEye, growth: stats.growthRate },
          { title: 'Engagement Rate', value: stats.avgEngagementRate, icon: IconHeart, suffix: '%' },
          { title: 'New Followers', value: stats.totalFollowersGained, icon: IconUsers, prefix: '+' },
          { title: 'Content Pieces', value: stats.topPerformingContent.length, icon: IconFileText }
        ].map((metric, index) => (
          <motion.div
            key={metric.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
          >
            <Card className="overflow-hidden group hover:shadow-lg transition-all duration-300">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{metric.title}</p>
                    <p className="text-2xl font-bold">
                      {metric.prefix}
                      <CountUp 
                        end={metric.value} 
                        separator="," 
                        duration={2} 
                        suffix={metric.suffix} 
                        decimals={metric.suffix === '%' ? 1 : 0}
                      />
                    </p>
                  </div>
                  <div className="relative">
                    <metric.icon className="h-8 w-8 text-muted-foreground/50 group-hover:text-primary transition-colors" />
                    <motion.div
                      className="absolute inset-0 rounded-full bg-primary/20"
                      initial={{ scale: 0, opacity: 0 }}
                      whileHover={{ scale: 1.5, opacity: 1 }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                </div>
                
                {metric.growth !== undefined && (
                  <motion.div 
                    className="flex items-center gap-1 mt-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                  >
                    {metric.growth > 0 ? (
                      <IconArrowUp className="h-4 w-4 text-green-600" />
                    ) : (
                      <IconArrowDown className="h-4 w-4 text-red-600" />
                    )}
                    <span className={cn(
                      "text-sm font-medium",
                      metric.growth > 0 ? "text-green-600" : "text-red-600"
                    )}>
                      {Math.abs(metric.growth).toFixed(1)}%
                    </span>
                    <span className="text-sm text-muted-foreground">vs last {currentPeriod}</span>
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Enhanced Slides Container */}
      <div className="relative min-h-[500px]">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentSlide}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 },
              scale: { duration: 0.2 }
            }}
            className="absolute inset-0"
          >
            {/* Overview Slide - Enhanced */}
            {currentSlide === 0 && (
              <div className="space-y-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <Card className="overflow-hidden">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <IconChartBar className="h-5 w-5 text-primary" />
                        Performance Trends
                      </CardTitle>
                      <CardDescription>
                        Daily breakdown of your content metrics with advanced analytics
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={performanceData}>
                            <defs>
                              <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.1}/>
                              </linearGradient>
                              <linearGradient id="colorEngagement" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.1}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                            <XAxis dataKey="day" className="text-muted-foreground" />
                            <YAxis className="text-muted-foreground" />
                            <Tooltip 
                              contentStyle={{ 
                                backgroundColor: 'hsl(var(--background))',
                                border: '1px solid hsl(var(--border))',
                                borderRadius: '8px'
                              }}
                            />
                            <Area
                              type="monotone"
                              dataKey="views"
                              stroke="#8b5cf6"
                              fillOpacity={1}
                              fill="url(#colorViews)"
                              strokeWidth={2}
                            />
                            <Area
                              type="monotone"
                              dataKey="engagement"
                              stroke="#06b6d4"
                              fillOpacity={0.6}
                              fill="url(#colorEngagement)"
                              strokeWidth={2}
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <IconScissors className="h-5 w-5 text-primary" />
                        Content Production
                      </CardTitle>
                      <CardDescription>
                        Your content creation and processing activity with trend analysis
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {contentMetrics.map((metric, index) => (
                          <motion.div
                            key={metric.title}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.6 + index * 0.1 }}
                            whileHover={{ scale: 1.02 }}
                            className="relative p-4 rounded-lg border bg-gradient-to-br from-primary/5 to-purple/5 group hover:shadow-md transition-all"
                          >
                            <div className="text-center">
                              <metric.icon className="h-8 w-8 mx-auto mb-2 text-primary group-hover:scale-110 transition-transform" />
                              <p className="text-2xl font-bold">{metric.value}</p>
                              <p className="text-sm text-muted-foreground">{metric.title}</p>
                              
                              <div className="flex items-center justify-center gap-1 mt-2">
                                {metric.positive ? (
                                  <IconArrowUp className="h-3 w-3 text-green-600" />
                                ) : (
                                  <IconArrowDown className="h-3 w-3 text-red-600" />
                                )}
                                <span className={cn(
                                  "text-xs font-medium",
                                  metric.positive ? "text-green-600" : "text-red-600"
                                )}>
                                  {metric.change}
                                </span>
                              </div>

                              {/* Mini trend chart */}
                              <div className="mt-3 h-8">
                                <ResponsiveContainer width="100%" height="100%">
                                  <LineChart data={metric.trend.map((value, i) => ({ value, index: i }))}>
                                    <Line
                                      type="monotone"
                                      dataKey="value"
                                      stroke="#8b5cf6"
                                      strokeWidth={2}
                                      dot={false}
                                    />
                                  </LineChart>
                                </ResponsiveContainer>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>
            )}

            {/* Platforms Slide - Enhanced */}
            {currentSlide === 1 && (
              <div className="space-y-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <IconUsers className="h-5 w-5 text-primary" />
                        Platform Performance
                      </CardTitle>
                      <CardDescription>
                        Comprehensive breakdown across all your social media platforms
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Platform Distribution Chart */}
                        <div className="lg:col-span-1">
                          <h4 className="font-medium mb-4">Platform Distribution</h4>
                          <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie
                                  data={platformDistribution}
                                  cx="50%"
                                  cy="50%"
                                  innerRadius={40}
                                  outerRadius={80}
                                  paddingAngle={5}
                                  dataKey="value"
                                >
                                  {platformDistribution.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                  ))}
                                </Pie>
                                <Tooltip />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                        </div>

                        {/* Platform Details */}
                        <div className="lg:col-span-2 space-y-4">
                          {stats.platformMetrics.map((platform, index) => {
                            const Icon = platformIcons[platform.platform];
                            return (
                              <motion.div
                                key={platform.platform}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.3 + index * 0.1 }}
                                whileHover={{ scale: 1.02 }}
                                className="flex items-center justify-between p-4 rounded-lg border bg-gradient-to-r from-background to-muted/20 hover:shadow-md transition-all group"
                              >
                                <div className="flex items-center gap-4">
                                  <div className={cn(
                                    "w-12 h-12 rounded-xl flex items-center justify-center",
                                    `bg-gradient-to-br ${slides[1].color}`
                                  )}>
                                    <Icon className={cn("h-6 w-6", platformColors[platform.platform])} />
                                  </div>
                                  <div>
                                    <p className="font-medium capitalize">{platform.platform}</p>
                                    <p className="text-sm text-muted-foreground">
                                      {formatNumber(platform.totalFollowers)} followers
                                    </p>
                                  </div>
                                </div>
                                
                                <div className="flex items-center gap-8">
                                  <div className="text-right">
                                    <p className="font-medium">{formatNumber(platform.views)}</p>
                                    <p className="text-sm text-muted-foreground">views</p>
                                  </div>
                                  <div className="text-right">
                                    <p className="font-medium">{platform.engagementRate?.toFixed(1)}%</p>
                                    <p className="text-sm text-muted-foreground">engagement</p>
                                  </div>
                                  <div className="text-right">
                                    <p className="font-medium text-green-600">+{platform.followersGained}</p>
                                    <p className="text-sm text-muted-foreground">this {currentPeriod}</p>
                                  </div>
                                </div>
                              </motion.div>
                            );
                          })}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>
            )}

            {/* Content Slide - Enhanced */}
            {currentSlide === 2 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <IconStar className="h-5 w-5 text-primary" />
                      Top Performing Content
                    </CardTitle>
                    <CardDescription>
                      Your best performing content this {currentPeriod} with detailed analytics
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {stats.topPerformingContent.slice(0, 5).map((content, index) => {
                        const Icon = platformIcons[content.platform];
                        return (
                          <motion.div
                            key={content.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 + index * 0.1 }}
                            whileHover={{ scale: 1.01, y: -2 }}
                            className="flex items-center gap-4 p-4 rounded-lg border bg-gradient-to-r from-background to-muted/20 hover:shadow-lg transition-all group"
                          >
                            <div className="flex items-center gap-3">
                              <motion.div
                                whileHover={{ rotate: 360 }}
                                transition={{ duration: 0.5 }}
                                className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold"
                              >
                                {index + 1}
                              </motion.div>
                              <div className={cn(
                                "w-8 h-8 rounded-lg flex items-center justify-center",
                                `bg-gradient-to-br ${slides[2].color}`
                              )}>
                                <Icon className={cn("h-5 w-5", platformColors[content.platform])} />
                              </div>
                            </div>
                            
                            <div className="flex-1">
                              <p className="font-medium line-clamp-1 group-hover:text-primary transition-colors">
                                {content.title}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {formatDistanceToNow(content.publishedAt, { addSuffix: true })}
                              </p>
                            </div>
                            
                            <div className="flex items-center gap-6">
                              <div className="text-right">
                                <p className="font-bold text-lg">{formatNumber(content.views)}</p>
                                <p className="text-xs text-muted-foreground">views</p>
                              </div>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <IconHeart className="h-4 w-4" />
                                  <span>{content.likes || 0}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <IconShare3 className="h-4 w-4" />
                                  <span>{content.shares || 0}</span>
                                </div>
                              </div>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                asChild
                                className="hover:scale-110 transition-transform"
                              >
                                <Link href={content.url} target="_blank">
                                  <IconExternalLink className="h-4 w-4" />
                                </Link>
                              </Button>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Insights Slide - Enhanced */}
            {currentSlide === 3 && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <Card className="h-full">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <IconAnalyze className="h-5 w-5 text-primary" />
                          AI-Powered Insights
                        </CardTitle>
                        <CardDescription>
                          Smart recommendations based on your performance data
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {insights.slice(0, 4).map((insight, index) => (
                          <motion.div
                            key={insight.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 + index * 0.1 }}
                            whileHover={{ scale: 1.02 }}
                            className="p-4 rounded-lg border-l-4 border-primary bg-gradient-to-r from-primary/5 to-purple/5 hover:shadow-md transition-all group"
                          >
                            <div className="flex items-start gap-3">
                              <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center mt-0.5">
                                <IconTrendingUp className="h-3 w-3 text-primary" />
                              </div>
                              <div className="flex-1">
                                <p className="font-medium text-sm">{insight.title}</p>
                                <p className="text-sm text-muted-foreground mt-1">{insight.description}</p>
                                {insight.actionable && (
                                  <Badge variant="outline" className="mt-2 text-xs group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                                    {insight.action}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </CardContent>
                    </Card>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <Card className="h-full">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <IconCheck className="h-5 w-5 text-primary" />
                          Action Plan
                        </CardTitle>
                        <CardDescription>
                          Priority steps to boost your content performance
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {nextSteps.map((step, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.5 + index * 0.1 }}
                            whileHover={{ scale: 1.02 }}
                            className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-all group"
                          >
                            <motion.div
                              whileHover={{ scale: 1.1, rotate: 360 }}
                              transition={{ duration: 0.3 }}
                              className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold mt-0.5"
                            >
                              {index + 1}
                            </motion.div>
                            <p className="text-sm group-hover:text-primary transition-colors">{step}</p>
                          </motion.div>
                        ))}
                      </CardContent>
                    </Card>
                  </motion.div>
                </div>

                {/* Enhanced Milestones */}
                {milestones.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                  >
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <IconStar className="h-5 w-5 text-primary" />
                          Recent Achievements
                        </CardTitle>
                        <CardDescription>
                          Celebrate your recent milestones and progress
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {milestones.slice(0, 4).map((milestone, index) => (
                            <motion.div
                              key={milestone.id}
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: 0.8 + index * 0.1 }}
                              whileHover={{ scale: 1.03, y: -4 }}
                              className="p-4 rounded-lg border bg-gradient-to-br from-primary/5 via-purple/5 to-pink/5 hover:shadow-lg transition-all group"
                            >
                              <div className="flex items-center gap-3 mb-3">
                                <motion.div
                                  whileHover={{ rotate: 180 }}
                                  transition={{ duration: 0.5 }}
                                  className="w-10 h-10 rounded-full bg-gradient-to-r from-primary to-purple-600 flex items-center justify-center"
                                >
                                  <IconTrendingUp className="h-5 w-5 text-white" />
                                </motion.div>
                                <p className="font-medium text-sm group-hover:text-primary transition-colors">
                                  {milestone.title}
                                </p>
                              </div>
                              <p className="text-sm text-muted-foreground mb-2">{milestone.description}</p>
                              <p className="text-xs text-muted-foreground">
                                {formatDistanceToNow(milestone.achievedAt, { addSuffix: true })}
                              </p>
                            </motion.div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Enhanced Navigation Controls */}
      <motion.div 
        layout
        className="flex items-center justify-between pt-6 border-t"
      >
        <Button
          variant="outline"
          onClick={handlePrev}
          disabled={currentSlide === 0}
          className="flex items-center gap-2 group"
        >
          <IconChevronLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          Previous
        </Button>

        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground font-medium">
            {slides[currentSlide].title}
          </div>
          <div className="text-xs text-muted-foreground">
            Use ← → keys to navigate • Press F for fullscreen
          </div>
        </div>

        <Button
          onClick={handleNext}
          disabled={currentSlide === slides.length - 1}
          className="flex items-center gap-2 group"
        >
          Next
          <IconChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
        </Button>
      </motion.div>
    </div>
  );
}