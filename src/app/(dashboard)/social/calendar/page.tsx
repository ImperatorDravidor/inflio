"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  IconCalendar,
  IconBrandTwitter,
  IconBrandLinkedin,
  IconBrandInstagram,
  IconBrandTiktok,
  IconBrandYoutube,
  IconBrandX,
  IconBrandFacebook,
  IconPlus,
  IconFilter,
  IconChevronLeft,
  IconChevronRight,
  IconClock,
  IconCheck,
  IconX
} from "@tabler/icons-react"
import { AnimatedBackground } from "@/components/animated-background"
import { format } from "date-fns"

export default function SocialCalendarPage() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  
  // Mock data for scheduled posts
  const scheduledPosts = [
    {
      id: '1',
      date: new Date(),
      time: '10:00 AM',
      platform: 'instagram',
      content: 'New product launch video',
      status: 'scheduled',
      type: 'video'
    },
    {
      id: '2',
      date: new Date(),
      time: '2:00 PM',
      platform: 'tiktok',
      content: 'Behind the scenes clip',
      status: 'scheduled',
      type: 'video'
    },
    {
      id: '3',
      date: new Date(),
      time: '6:00 PM',
      platform: 'linkedin',
      content: 'Industry insights blog post',
      status: 'published',
      type: 'blog'
    }
  ]

  const platformIcons = {
    twitter: IconBrandX,
    linkedin: IconBrandLinkedin,
    instagram: IconBrandInstagram,
    tiktok: IconBrandTiktok,
    youtube: IconBrandYoutube,
    facebook: IconBrandFacebook
  }

  const platformColors = {
    twitter: 'bg-black',
    linkedin: 'bg-blue-700',
    instagram: 'bg-gradient-to-r from-purple-500 to-pink-500',
    tiktok: 'bg-black',
    youtube: 'bg-red-600',
    facebook: 'bg-blue-600'
  }

  return (
    <div className="relative min-h-screen">
      <AnimatedBackground variant="subtle" />
      
      <div className="relative mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Social Media Calendar</h1>
          <p className="text-muted-foreground">
            Manage and track all your scheduled social media posts
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconCalendar className="h-5 w-5" />
                Calendar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="rounded-md border"
              />
            </CardContent>
          </Card>

          {/* Scheduled Posts */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Scheduled Posts</CardTitle>
                  <CardDescription>
                    {selectedDate && format(selectedDate, "EEEE, MMMM d, yyyy")}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <IconFilter className="h-4 w-4 mr-2" />
                    Filter
                  </Button>
                  <Button size="sm">
                    <IconPlus className="h-4 w-4 mr-2" />
                    New Post
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {scheduledPosts.map(post => {
                  const Icon = platformIcons[post.platform as keyof typeof platformIcons]
                  const bgColor = platformColors[post.platform as keyof typeof platformColors]
                  
                  return (
                    <div key={post.id} className="flex items-center gap-4 p-4 rounded-lg border">
                      <div className={`p-3 rounded-lg ${bgColor} text-white`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{post.content}</span>
                          <Badge variant={post.type === 'video' ? 'default' : 'secondary'}>
                            {post.type}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <IconClock className="h-3 w-3" />
                            {post.time}
                          </span>
                          <Badge variant={post.status === 'published' ? 'default' : 'secondary'}>
                            {post.status === 'published' ? (
                              <>
                                <IconCheck className="h-3 w-3 mr-1" />
                                Published
                              </>
                            ) : (
                              <>
                                <IconClock className="h-3 w-3 mr-1" />
                                Scheduled
                              </>
                            )}
                          </Badge>
                        </div>
                      </div>
                      
                      <Button variant="ghost" size="sm">
                        View
                      </Button>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Analytics Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-primary/10">
                  <IconCalendar className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">12</p>
                  <p className="text-sm text-muted-foreground">Posts This Week</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-green-500/10">
                  <IconCheck className="h-6 w-6 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">8</p>
                  <p className="text-sm text-muted-foreground">Published</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-blue-500/10">
                  <IconClock className="h-6 w-6 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">4</p>
                  <p className="text-sm text-muted-foreground">Scheduled</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-purple-500/10">
                  <IconBrandInstagram className="h-6 w-6 text-purple-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">6</p>
                  <p className="text-sm text-muted-foreground">Platforms Active</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}