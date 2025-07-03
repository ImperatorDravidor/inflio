"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  IconBrandTwitter,
  IconBrandYoutube,
  IconBrandLinkedin,
  IconWorld,
  IconCalendar,
  IconVideo,
  IconShare,
  IconFlame,
  IconStar,
  IconEdit,
  IconCamera,
  IconCheck,
  IconCertificate,
  IconClock,
  IconScissors,
  IconFileText
} from "@tabler/icons-react"
import { toast } from "sonner"
import { AnimatedBackground } from "@/components/animated-background"
import { useUser } from "@clerk/nextjs"
import { ProjectService, UsageService } from "@/lib/services"
import { Project } from "@/lib/project-types"

export default function ProfilePage() {
  const { user } = useUser()
  const [isEditing, setIsEditing] = useState(false)
  const [projects, setProjects] = useState<Project[]>([])
  const [profile, setProfile] = useState({
    name: user?.fullName || user?.firstName || "User",
    email: user?.primaryEmailAddress?.emailAddress || "",
    bio: "Content creator passionate about sharing knowledge through engaging videos.",
    website: "",
    twitter: "",
    youtube: "",
    linkedin: ""
  })

  useEffect(() => {
    if (user) {
      setProfile(prev => ({
        ...prev,
        name: user.fullName || user.firstName || "User",
        email: user.primaryEmailAddress?.emailAddress || ""
      }))
      loadProjects()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const loadProjects = async () => {
    try {
      const allProjects = await ProjectService.getAllProjects(user?.id)
      setProjects(allProjects)
    } catch (error) {
      console.error("Failed to load projects:", error)
    }
  }

  const handleSave = () => {
    setIsEditing(false)
    toast.success("Profile updated successfully!")
  }

  // Calculate real stats from projects
  const calculateStats = () => {
    const totalProjects = projects.length
    const totalClips = projects.reduce((sum, p) => sum + p.folders.clips.length, 0)
    const totalBlogs = projects.reduce((sum, p) => sum + p.folders.blog.length, 0)
    const totalSocialPosts = projects.reduce((sum, p) => sum + p.folders.social.length, 0)
    const contentHours = projects.reduce((sum, p) => sum + (p.metadata?.duration || 0), 0) / 3600
    
    // Calculate theoretical views/engagement (in a real app, this would come from analytics)
    const totalViews = totalClips * 250 + totalBlogs * 100 + totalSocialPosts * 150
    const totalLikes = Math.floor(totalViews * 0.075)
    const totalShares = Math.floor(totalViews * 0.02)
    const avgEngagement = totalViews > 0 ? ((totalLikes + totalShares) / totalViews * 100).toFixed(1) : 0

    return {
      totalProjects,
      totalViews,
      totalLikes,
      totalShares,
      avgEngagement,
      contentHours: contentHours.toFixed(1),
      totalClips,
      totalBlogs,
      totalSocialPosts
    }
  }

  const stats = calculateStats()
  const usage = UsageService.getUsage()

  // Calculate achievements based on real data
  const achievements = [
    {
      id: 1,
      icon: IconVideo,
      title: "First Video",
      description: "Upload your first video",
      progress: stats.totalProjects > 0 ? 100 : 0,
      unlocked: stats.totalProjects > 0,
      date: projects[0]?.created_at
    },
    {
      id: 2,
      icon: IconFlame,
      title: "Content Creator",
      description: "Create 10 projects",
      progress: Math.min(100, (stats.totalProjects / 10) * 100),
      unlocked: stats.totalProjects >= 10,
      current: stats.totalProjects,
      target: 10
    },
    {
      id: 3,
      icon: IconScissors,
      title: "Clip Master",
      description: "Generate 50 clips",
      progress: Math.min(100, (stats.totalClips / 50) * 100),
      unlocked: stats.totalClips >= 50,
      current: stats.totalClips,
      target: 50
    },
    {
      id: 4,
      icon: IconFileText,
      title: "Blog Writer",
      description: "Create 25 blog posts",
      progress: Math.min(100, (stats.totalBlogs / 25) * 100),
      unlocked: stats.totalBlogs >= 25,
      current: stats.totalBlogs,
      target: 25
    },
    {
      id: 5,
      icon: IconStar,
      title: "Content Pro",
      description: "Process 10 hours of video",
      progress: Math.min(100, (Number(stats.contentHours) / 10) * 100),
      unlocked: Number(stats.contentHours) >= 10,
      current: Number(stats.contentHours),
      target: 10
    }
  ]

  // Calculate creator level based on activity
  const calculateLevel = () => {
    const xp = stats.totalProjects * 100 + stats.totalClips * 20 + stats.totalBlogs * 30
    const level = Math.floor(xp / 1000) + 1
    const currentLevelXP = (level - 1) * 1000
    const nextLevelXP = level * 1000
    const progressXP = xp - currentLevelXP
    const neededXP = nextLevelXP - currentLevelXP
    
    const titles = [
      "Beginner", "Novice Creator", "Content Enthusiast", "Video Editor",
      "Content Specialist", "Creative Professional", "Content Expert",
      "Master Creator", "Content Virtuoso", "Legendary Creator"
    ]
    
    return {
      level,
      title: titles[Math.min(level - 1, titles.length - 1)],
      currentXP: progressXP,
      neededXP,
      percentage: (progressXP / neededXP) * 100
    }
  }

  const creatorLevel = calculateLevel()

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file')
      return
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast.error('Image must be less than 5MB')
      return
    }

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', 'personal-photo')
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error('Failed to upload avatar')
      }

      const { url } = await response.json()
      
      // Update user profile with new avatar URL
      await user?.setProfileImage({ file: url })
      
      toast.success('Avatar updated successfully!')
      
      // Reload to show new avatar
      window.location.reload()
    } catch (error) {
      console.error('Avatar upload error:', error)
      toast.error('Failed to upload avatar')
    }
  }

  return (
    <div className="relative">
      <AnimatedBackground variant="subtle" />
      
      <div className="relative max-w-7xl mx-auto space-y-8">
        {/* Profile Header */}
        <Card className="overflow-hidden">
          <div className="h-32 bg-gradient-to-r from-violet-500 to-pink-500" />
          <CardContent className="relative pb-6">
            <div className="absolute -top-16 left-6">
              <div className="relative">
                <Avatar className="h-32 w-32 border-4 border-background">
                  <AvatarImage src={user?.imageUrl} alt={profile.name} />
                  <AvatarFallback className="text-2xl">
                    {profile.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <label htmlFor="avatar-upload">
                  <Button 
                    size="icon" 
                    variant="secondary" 
                    className="absolute bottom-0 right-0 rounded-full cursor-pointer"
                    asChild
                  >
                    <span>
                      <IconCamera className="h-4 w-4" />
                    </span>
                  </Button>
                </label>
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarUpload}
                  aria-label="Upload avatar image"
                />
              </div>
            </div>
            
            <div className="mt-20 flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div className="space-y-3">
                <div>
                  <h1 className="text-3xl font-bold">{profile.name}</h1>
                  <p className="text-muted-foreground">{profile.email}</p>
                </div>
                {!isEditing && (
                  <p className="max-w-2xl text-sm text-muted-foreground">{profile.bio}</p>
                )}
                
                {/* Social Links */}
                <div className="flex items-center gap-4 pt-2">
                  {profile.website && (
                    <a 
                      href={profile.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-primary transition-colors"
                    >
                      <IconWorld className="h-5 w-5" />
                    </a>
                  )}
                  {profile.twitter && (
                    <a 
                      href={`https://twitter.com/${profile.twitter.replace('@', '')}`}
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-primary transition-colors"
                    >
                      <IconBrandTwitter className="h-5 w-5" />
                    </a>
                  )}
                  {profile.youtube && (
                    <a 
                      href={`https://youtube.com/@${profile.youtube}`}
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-primary transition-colors"
                    >
                      <IconBrandYoutube className="h-5 w-5" />
                    </a>
                  )}
                  {profile.linkedin && (
                    <a 
                      href={`https://linkedin.com/in/${profile.linkedin}`}
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-primary transition-colors"
                    >
                      <IconBrandLinkedin className="h-5 w-5" />
                    </a>
                  )}
                </div>
              </div>
              
              <div className="flex gap-2">
                {isEditing ? (
                  <>
                    <Button onClick={handleSave}>
                      <IconCheck className="h-4 w-4 mr-2" />
                      Save Changes
                    </Button>
                    <Button variant="outline" onClick={() => setIsEditing(false)}>
                      Cancel
                    </Button>
                  </>
                ) : (
                  <Button onClick={() => setIsEditing(true)}>
                    <IconEdit className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profile Content */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="stats">Statistics</TabsTrigger>
            <TabsTrigger value="achievements">Achievements</TabsTrigger>
            {isEditing && <TabsTrigger value="edit">Edit Details</TabsTrigger>}
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Total Projects</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalProjects}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {usage.used} / {usage.limit} this month
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Content Created</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalClips + stats.totalBlogs}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Clips & blog posts
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Processing Time</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.contentHours}h</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Of video content
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Creator Level */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IconCertificate className="h-5 w-5 text-primary" />
                  Creator Level
                </CardTitle>
                <CardDescription>
                  Your progress towards the next creator tier
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold gradient-text">Level {creatorLevel.level}</p>
                      <p className="text-sm text-muted-foreground">{creatorLevel.title}</p>
                    </div>
                    <Badge variant="secondary" className="text-lg px-4 py-2">
                      {creatorLevel.currentXP} / {creatorLevel.neededXP} XP
                    </Badge>
                  </div>
                  <Progress value={creatorLevel.percentage} className="h-3" />
                  <p className="text-sm text-muted-foreground">
                    {creatorLevel.neededXP - creatorLevel.currentXP} XP needed to reach Level {creatorLevel.level + 1}
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Statistics Tab */}
          <TabsContent value="stats" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Content Performance</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <IconVideo className="h-4 w-4 text-muted-foreground" />
                      <span>Total Projects</span>
                    </div>
                    <span className="font-bold">{stats.totalProjects}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <IconScissors className="h-4 w-4 text-muted-foreground" />
                      <span>Video Clips</span>
                    </div>
                    <span className="font-bold">{stats.totalClips}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <IconFileText className="h-4 w-4 text-muted-foreground" />
                      <span>Blog Posts</span>
                    </div>
                    <span className="font-bold">{stats.totalBlogs}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <IconShare className="h-4 w-4 text-muted-foreground" />
                      <span>Social Posts</span>
                    </div>
                    <span className="font-bold">{stats.totalSocialPosts}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Account Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <IconVideo className="h-4 w-4 text-muted-foreground" />
                      <span>Current Plan</span>
                    </div>
                    <span className="font-bold capitalize">{usage.plan}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <IconClock className="h-4 w-4 text-muted-foreground" />
                      <span>Content Hours</span>
                    </div>
                    <span className="font-bold">{stats.contentHours}h</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <IconCalendar className="h-4 w-4 text-muted-foreground" />
                      <span>Member Since</span>
                    </div>
                    <span className="font-bold">
                      {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'N/A'}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Achievements Tab */}
          <TabsContent value="achievements" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {achievements.map((achievement) => {
                const Icon = achievement.icon
                return (
                  <Card 
                    key={achievement.id} 
                    className={achievement.unlocked ? '' : 'opacity-75'}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-full ${
                          achievement.unlocked 
                            ? 'bg-gradient-to-br from-yellow-400 to-orange-500' 
                            : 'bg-muted'
                        }`}>
                          <Icon className={`h-6 w-6 ${
                            achievement.unlocked ? 'text-white' : 'text-muted-foreground'
                          }`} />
                        </div>
                        
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center justify-between">
                            <h4 className="font-semibold">{achievement.title}</h4>
                            {achievement.unlocked && (
                              <Badge variant="secondary" className="text-xs">
                                Unlocked
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {achievement.description}
                          </p>
                          {!achievement.unlocked && (
                            <div className="space-y-1">
                              <Progress value={achievement.progress} className="h-2" />
                              <p className="text-xs text-muted-foreground">
                                {achievement.current} / {achievement.target}
                              </p>
                            </div>
                          )}
                          {achievement.unlocked && achievement.date && (
                            <p className="text-xs text-muted-foreground">
                              Achieved on {new Date(achievement.date).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </TabsContent>

          {/* Edit Details Tab */}
          {isEditing && (
            <TabsContent value="edit" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Edit Profile Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Name</Label>
                      <Input 
                        id="name" 
                        value={profile.name}
                        onChange={(e) => setProfile({...profile, name: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input 
                        id="email" 
                        type="email"
                        value={profile.email}
                        onChange={(e) => setProfile({...profile, email: e.target.value})}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea 
                      id="bio"
                      rows={3}
                      value={profile.bio}
                      onChange={(e) => setProfile({...profile, bio: e.target.value})}
                      placeholder="Tell us about yourself..."
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="website">Website</Label>
                    <Input 
                      id="website" 
                      type="url"
                      value={profile.website}
                      onChange={(e) => setProfile({...profile, website: e.target.value})}
                      placeholder="https://yourwebsite.com"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="twitter">Twitter</Label>
                      <Input 
                        id="twitter"
                        value={profile.twitter}
                        onChange={(e) => setProfile({...profile, twitter: e.target.value})}
                        placeholder="@username"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="youtube">YouTube</Label>
                      <Input 
                        id="youtube"
                        value={profile.youtube}
                        onChange={(e) => setProfile({...profile, youtube: e.target.value})}
                        placeholder="channel-name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="linkedin">LinkedIn</Label>
                      <Input 
                        id="linkedin"
                        value={profile.linkedin}
                        onChange={(e) => setProfile({...profile, linkedin: e.target.value})}
                        placeholder="profile-url"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  )
} 
