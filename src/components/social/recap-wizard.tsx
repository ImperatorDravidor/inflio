"use client"

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  IconSparkles,
  IconBrandInstagram,
  IconBrandTiktok,
  IconBrandFacebook,
  IconBrandYoutube,
  IconBrandLinkedin,
  IconBrandX,
  IconChevronRight,
  IconExternalLink,
  IconClock,
  IconCheck,
  IconLoader2,
  IconArrowUp,
  IconArrowDown
} from '@tabler/icons-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface RecapWizardProps {
  userId: string;
  isReturningUser?: boolean;
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
  instagram: 'bg-gradient-to-br from-purple-600 to-pink-600',
  tiktok: 'bg-black',
  facebook: 'bg-blue-600',
  youtube: 'bg-red-600',
  linkedin: 'bg-blue-700',
  x: 'bg-black',
};

export function RecapWizard({ userId, isReturningUser = true, onClose }: RecapWizardProps) {
  const [recapData, setRecapData] = useState<RecapData | null>(null);
  const [projectUpdates, setProjectUpdates] = useState<ProjectUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'week' | 'month'>('week');
  const [currentSection, setCurrentSection] = useState(0);

  useEffect(() => {
    fetchRecapData();
  }, [userId, period]);

  const fetchRecapData = async () => {
    try {
      setLoading(true);
      const [data, updates] = await Promise.all([
        SocialMediaService.getRecapData(userId, period),
        SocialMediaService.getProjectUpdates(userId, period)
      ]);
      setRecapData(data);
      setProjectUpdates(updates);
    } catch (error) {
      console.error('Error fetching recap data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !recapData) {
    return (
      <div className="flex items-center justify-center p-12">
        <IconLoader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const { stats, milestones, insights, nextSteps } = recapData;
  const sections = ['overview', 'platforms', 'projects', 'insights'];

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const renderOverview = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-2">
          {isReturningUser ? 'Welcome back! 👋' : 'Welcome to Inflio! 🎉'}
        </h2>
        <p className="text-lg text-muted-foreground">
          Here's your {period === 'week' ? 'weekly' : 'monthly'} social media performance recap
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20 border-blue-200 dark:border-blue-800">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-medium">Total Views</CardTitle>
              <IconEye className="h-5 w-5 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <h3 className="text-3xl font-bold">{formatNumber(stats.totalViews)}</h3>
              {stats.growthRate > 0 ? (
                <Badge variant="default" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                  <IconArrowUp className="h-3 w-3 mr-1" />
                  {stats.growthRate.toFixed(1)}%
                </Badge>
              ) : (
                <Badge variant="default" className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                  <IconArrowDown className="h-3 w-3 mr-1" />
                  {Math.abs(stats.growthRate).toFixed(1)}%
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-1">across all platforms</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/20 dark:to-purple-900/20 border-purple-200 dark:border-purple-800">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-medium">New Followers</CardTitle>
              <IconUsers className="h-5 w-5 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <h3 className="text-3xl font-bold">+{stats.totalFollowersGained}</h3>
            </div>
            <p className="text-sm text-muted-foreground mt-1">gained this {period}</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20 border-green-200 dark:border-green-800">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-medium">Engagement Rate</CardTitle>
              <IconHeart className="h-5 w-5 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <h3 className="text-3xl font-bold">{stats.avgEngagementRate.toFixed(1)}%</h3>
            </div>
            <p className="text-sm text-muted-foreground mt-1">average across content</p>
          </CardContent>
        </Card>
      </div>

      {/* Top Performing Content */}
      {stats.topPerformingContent.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Top Performing Content</CardTitle>
            <CardDescription>Your best performing post this {period}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
              <div className="flex-1">
                <h4 className="font-semibold">{stats.topPerformingContent[0].title}</h4>
                <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <IconEye className="h-4 w-4" />
                    {formatNumber(stats.topPerformingContent[0].views)} views
                  </span>
                  {stats.topPerformingContent[0].likes && (
                    <span className="flex items-center gap-1">
                      <IconHeart className="h-4 w-4" />
                      {formatNumber(stats.topPerformingContent[0].likes)}
                    </span>
                  )}
                  {stats.topPerformingContent[0].shares && (
                    <span className="flex items-center gap-1">
                      <IconShare className="h-4 w-4" />
                      {formatNumber(stats.topPerformingContent[0].shares)}
                    </span>
                  )}
                </div>
              </div>
              <Button size="sm" variant="outline" asChild>
                <Link href={stats.topPerformingContent[0].url} target="_blank">
                  View
                  <IconExternalLink className="h-4 w-4 ml-1" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Milestones */}
      {milestones.length > 0 && (
        <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20 border-yellow-200 dark:border-yellow-800">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <IconSparkles className="h-5 w-5 text-yellow-600" />
              Achievements Unlocked!
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {milestones.map((milestone) => (
              <div key={milestone.id} className="flex items-start gap-3">
                <div className="p-2 rounded-full bg-yellow-100 dark:bg-yellow-900/30">
                  <IconCheck className="h-4 w-4 text-yellow-700 dark:text-yellow-400" />
                </div>
                <div>
                  <h4 className="font-medium">{milestone.title}</h4>
                  <p className="text-sm text-muted-foreground">{milestone.description}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </motion.div>
  );

  const renderPlatforms = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-2">Platform Breakdown</h2>
        <p className="text-lg text-muted-foreground">
          Performance across your social media channels
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.platformMetrics.map((platform) => {
          const Icon = platformIcons[platform.platform] || IconChartBar;
          return (
            <Card key={platform.platform} className="relative overflow-hidden">
              <div className={cn(
                "absolute inset-0 opacity-10",
                platformColors[platform.platform]
              )} />
              <CardHeader className="relative">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base capitalize flex items-center gap-2">
                    <Icon className="h-5 w-5" />
                    {platform.platform}
                  </CardTitle>
                  {platform.engagementRate && (
                    <Badge variant="secondary" className="text-xs">
                      {platform.engagementRate.toFixed(1)}% engagement
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="relative space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Views</span>
                  <span className="font-semibold">{formatNumber(platform.views)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">New Followers</span>
                  <span className="font-semibold">+{platform.followersGained}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total Followers</span>
                  <span className="font-semibold">{formatNumber(platform.totalFollowers)}</span>
                </div>
                {platform.avgViewDuration && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Avg View Time</span>
                    <span className="font-semibold">{Math.floor(platform.avgViewDuration)}s</span>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </motion.div>
  );

  const renderProjects = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-2">Project Updates</h2>
        <p className="text-lg text-muted-foreground">
          Recent progress on your content projects
        </p>
      </div>

      <div className="space-y-4">
        {projectUpdates.map((update) => (
          <Card key={update.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{update.title}</CardTitle>
                <Badge variant={
                  update.status === 'completed' ? 'default' :
                  update.status === 'in_progress' ? 'secondary' :
                  'outline'
                }>
                  {update.status === 'completed' && <IconCheck className="h-3 w-3 mr-1" />}
                  {update.status === 'in_progress' && <IconLoader2 className="h-3 w-3 mr-1 animate-spin" />}
                  {update.status === 'scheduled' && <IconClock className="h-3 w-3 mr-1" />}
                  {update.status.replace('_', ' ')}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-2">{update.description}</p>
              {update.completedAt && (
                <p className="text-xs text-muted-foreground">
                  Completed {formatDistanceToNow(update.completedAt, { addSuffix: true })}
                </p>
              )}
              {update.scheduledFor && (
                <p className="text-xs text-muted-foreground">
                  Scheduled for {new Date(update.scheduledFor).toLocaleString()}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {projectUpdates.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <IconCalendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-medium mb-2">No project updates yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Start creating content to see your progress here
            </p>
            <Button asChild>
              <Link href="/studio/upload">Upload Video</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </motion.div>
  );

  const renderInsights = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-2">Insights & Next Steps</h2>
        <p className="text-lg text-muted-foreground">
          Personalized recommendations to grow your audience
        </p>
      </div>

      {/* Insights */}
      <div className="space-y-4">
        {insights.map((insight) => (
          <Card key={insight.id} className={cn(
            "border-l-4",
            insight.priority === 'high' ? 'border-l-red-500' :
            insight.priority === 'medium' ? 'border-l-yellow-500' :
            'border-l-green-500'
          )}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-base">{insight.title}</CardTitle>
                  <Badge variant="outline" className="mt-1">
                    {insight.type}
                  </Badge>
                </div>
                {insight.priority === 'high' && (
                  <IconTrendingUp className="h-5 w-5 text-red-500" />
                )}
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">{insight.description}</p>
              {insight.actionable && insight.action && (
                <Button size="sm" variant="outline">
                  {insight.action}
                  <IconChevronRight className="h-4 w-4 ml-1" />
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Next Steps */}
      {nextSteps.length > 0 && (
        <Card className="bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
          <CardHeader>
            <CardTitle className="text-lg">Recommended Next Steps</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {nextSteps.map((step, index) => (
                <li key={index} className="flex items-start gap-3">
                  <div className="p-1 rounded-full bg-primary/10">
                    <IconCheck className="h-3 w-3 text-primary" />
                  </div>
                  <span className="text-sm">{step}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </motion.div>
  );

  const renderSection = () => {
    switch (sections[currentSection]) {
      case 'overview':
        return renderOverview();
      case 'platforms':
        return renderPlatforms();
      case 'projects':
        return renderProjects();
      case 'insights':
        return renderInsights();
      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Period Selector */}
      <div className="flex justify-center mb-6">
        <Tabs value={period} onValueChange={(value: any) => setPeriod(value)}>
          <TabsList>
            <TabsTrigger value="week">Weekly Recap</TabsTrigger>
            <TabsTrigger value="month">Monthly Recap</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Progress Indicator */}
      <div className="flex justify-center gap-2 mb-8">
        {sections.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSection(index)}
            className={cn(
              "h-2 rounded-full transition-all",
              index === currentSection ? "w-8 bg-primary" : "w-2 bg-muted"
            )}
          />
        ))}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {renderSection()}
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex justify-between items-center mt-8">
        <Button
          variant="outline"
          onClick={() => setCurrentSection(Math.max(0, currentSection - 1))}
          disabled={currentSection === 0}
        >
          Previous
        </Button>
        
        {currentSection === sections.length - 1 ? (
          <Button onClick={onClose}>
            Get Started
            <IconChevronRight className="h-4 w-4 ml-1" />
          </Button>
        ) : (
          <Button
            onClick={() => setCurrentSection(Math.min(sections.length - 1, currentSection + 1))}
          >
            Next
            <IconChevronRight className="h-4 w-4 ml-1" />
          </Button>
        )}
      </div>
    </div>
  );
}