import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { IconBook, IconVideo, IconBrain, IconShare, IconArrowRight } from "@tabler/icons-react"

export default function DocsPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Inflio Documentation</h1>
        <p className="text-xl text-muted-foreground">
          Learn how to create amazing content with AI-powered video processing
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <IconVideo className="h-6 w-6 text-blue-500" />
              <CardTitle>Video Processing</CardTitle>
            </div>
            <CardDescription>
              Upload and process videos to extract clips, transcriptions, and insights
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Badge variant="outline">MP4, MOV, AVI, WebM</Badge>
              <Badge variant="outline">Up to 2GB</Badge>
              <Badge variant="outline">AI Transcription</Badge>
            </div>
            <Button asChild className="w-full mt-4">
              <Link href="/studio/upload">
                <IconArrowRight className="h-4 w-4 mr-2" />
                Start Uploading
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <IconBrain className="h-6 w-6 text-purple-500" />
              <CardTitle>AI Content Generation</CardTitle>
            </div>
            <CardDescription>
              Generate blogs, social posts, and captions with AI assistance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Badge variant="outline">Smart Captions</Badge>
              <Badge variant="outline">Blog Posts</Badge>
              <Badge variant="outline">Social Media</Badge>
            </div>
            <Button asChild className="w-full mt-4">
              <Link href="/dashboard">
                <IconArrowRight className="h-4 w-4 mr-2" />
                View Projects
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <IconShare className="h-6 w-6 text-green-500" />
              <CardTitle>Publishing Workflow</CardTitle>
            </div>
            <CardDescription>
              Stage, schedule, and publish content across multiple platforms
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Badge variant="outline">Multi-Platform</Badge>
              <Badge variant="outline">Scheduling</Badge>
              <Badge variant="outline">Analytics</Badge>
            </div>
            <Button asChild className="w-full mt-4">
              <Link href="/social">
                <IconArrowRight className="h-4 w-4 mr-2" />
                Social Hub
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <IconBook className="h-6 w-6 text-orange-500" />
              <CardTitle>Getting Started</CardTitle>
            </div>
            <CardDescription>
              Quick setup guide and best practices for content creation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Badge variant="outline">Setup Guide</Badge>
              <Badge variant="outline">Best Practices</Badge>
              <Badge variant="outline">Tips & Tricks</Badge>
            </div>
            <Button asChild className="w-full mt-4">
              <Link href="/onboarding">
                <IconArrowRight className="h-4 w-4 mr-2" />
                Get Started
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="mt-12 text-center">
        <h2 className="text-2xl font-semibold mb-4">Need Help?</h2>
        <p className="text-muted-foreground mb-6">
          If you're experiencing issues or need assistance, check our troubleshooting guide
          or contact support.
        </p>
        <div className="flex gap-4 justify-center">
          <Button variant="outline" asChild>
            <Link href="/settings">Settings</Link>
          </Button>
          <Button asChild>
            <Link href="/dashboard">Dashboard</Link>
          </Button>
        </div>
      </div>
    </div>
  )
} 