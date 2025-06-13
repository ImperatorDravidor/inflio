"use client"

import { useState } from "react"
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
  IconEye,
  IconThumbUp,
  IconShare,
  IconTrophy,
  IconFlame,
  IconStar,
  IconEdit,
  IconCamera,
  IconCheck,
  IconCertificate,
  IconClock
} from "@tabler/icons-react"
import { toast } from "sonner"
import { AnimatedBackground } from "@/components/animated-background"

// Mock achievements data
const achievements = [
  {
    id: 1,
    icon: IconVideo,
    title: "First Video",
    description: "Upload your first video",
    progress: 100,
    unlocked: true,
    date: "2024-01-15"
  },
  {
    id: 2,
    icon: IconFlame,
    title: "Content Creator",
    description: "Create 10 projects",
    progress: 70,
    unlocked: false,
    current: 7,
    target: 10
  },
  {
    id: 3,
    icon: IconEye,
    title: "Viral Sensation",
    description: "Get 10,000 total views",
    progress: 45,
    unlocked: false,
    current: 4500,
    target: 10000
  },
  {
    id: 4,
    icon: IconTrophy,
    title: "Clip Master",
    description: "Generate 50 clips",
    progress: 60,
    unlocked: false,
    current: 30,
    target: 50
  },
  {
    id: 5,
    icon: IconStar,
    title: "Content Pro",
    description: "Process 100 hours of video",
    progress: 25,
    unlocked: false,
    current: 25,
    target: 100
  }
]

export default function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false)
  const [profile, setProfile] = useState({
    name: "John Doe",
    email: "john@example.com",
    bio: "Content creator passionate about sharing knowledge through engaging videos. Specializing in tech tutorials and educational content.",
    website: "https://johndoe.com",
    twitter: "@johndoe",
    youtube: "johndoe",
    linkedin: "john-doe"
  })

  const handleSave = () => {
    setIsEditing(false)
    toast.success("Profile updated successfully!")
  }

  const stats = {
    totalProjects: 24,
    totalViews: 45230,
    totalLikes: 3421,
    totalShares: 892,
    avgEngagement: 7.8,
    contentHours: 25.5
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
                  <AvatarImage src="https://github.com/shadcn.png" alt={profile.name} />
                  <AvatarFallback className="text-2xl">JD</AvatarFallback>
                </Avatar>
                <Button 
                  size="icon" 
                  variant="secondary" 
                  className="absolute bottom-0 right-0 rounded-full"
                >
                  <IconCamera className="h-4 w-4" />
                </Button>
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
                    <span className="text-green-600">+20%</span> from last month
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Total Views</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalViews.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Across all content
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Engagement Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.avgEngagement}%</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Above average
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
                      <p className="text-2xl font-bold gradient-text">Level 7</p>
                      <p className="text-sm text-muted-foreground">Content Specialist</p>
                    </div>
                    <Badge variant="secondary" className="text-lg px-4 py-2">
                      850 / 1000 XP
                    </Badge>
                  </div>
                  <Progress value={85} className="h-3" />
                  <p className="text-sm text-muted-foreground">
                    150 XP needed to reach Level 8: Content Expert
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
                      <IconEye className="h-4 w-4 text-muted-foreground" />
                      <span>Total Views</span>
                    </div>
                    <span className="font-bold">{stats.totalViews.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <IconThumbUp className="h-4 w-4 text-muted-foreground" />
                      <span>Total Likes</span>
                    </div>
                    <span className="font-bold">{stats.totalLikes.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <IconShare className="h-4 w-4 text-muted-foreground" />
                      <span>Total Shares</span>
                    </div>
                    <span className="font-bold">{stats.totalShares}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Content Creation</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <IconVideo className="h-4 w-4 text-muted-foreground" />
                      <span>Projects Created</span>
                    </div>
                    <span className="font-bold">{stats.totalProjects}</span>
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
                    <span className="font-bold">Jan 2024</span>
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