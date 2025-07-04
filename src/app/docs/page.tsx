import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { 
  IconVideo, 
  IconTextRecognition, 
  IconBrandInstagram, 
  IconBrandYoutube,
  IconFileText,
  IconHelpCircle,
  IconExternalLink,
  IconMail
} from "@tabler/icons-react"
import Link from "next/link"

export default function DocsPage() {
  const features = [
    {
      icon: IconVideo,
      title: "Video Processing",
      description: "Upload videos up to 2GB and let AI analyze your content",
      steps: [
        "Go to Studio → Upload",
        "Drag & drop your video file",
        "Select processing workflows",
        "Wait for AI to process (2-7 minutes)"
      ]
    },
    {
      icon: IconTextRecognition,
      title: "Transcription & Editing",
      description: "Get accurate transcriptions and edit them in real-time",
      steps: [
        "Transcription runs automatically",
        "Edit text in the transcript editor",
        "Apply subtitle overlays to video",
        "Export with embedded subtitles"
      ]
    },
    {
      icon: IconVideo,
      title: "AI Clip Generation",
      description: "Generate viral-worthy short clips automatically",
      steps: [
        "Enable clip generation during upload",
        "AI analyzes for engagement moments",
        "Review generated clips with scores",
        "Export clips for social media"
      ]
    }
  ]

  const faqs = [
    {
      question: "What video formats are supported?",
      answer: "We support most common video formats including MP4, MOV, AVI, and WebM. Maximum file size is 2GB."
    },
    {
      question: "How long does processing take?",
      answer: "Transcription takes 2-3 minutes, while clip generation can take 5-7 minutes depending on video length."
    },
    {
      question: "Can I edit the generated content?",
      answer: "Yes! All generated content (transcripts, blogs, captions) can be edited before publishing."
    },
    {
      question: "Which social platforms are supported?",
      answer: "We support Instagram, Facebook, YouTube, LinkedIn, Twitter/X, TikTok, and Threads."
    },
    {
      question: "Is there a limit on video uploads?",
      answer: "Basic plan includes 25 videos per month. Check your usage in the sidebar."
    }
  ]

  return (
    <div className="container max-w-4xl py-8 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-2">
          <IconHelpCircle className="h-8 w-8 text-primary" />
          <h1 className="text-4xl font-bold">Help & Documentation</h1>
        </div>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Everything you need to know about using Inflio
        </p>
      </div>

      {/* Quick Start */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconVideo className="h-5 w-5" />
            Quick Start Guide
          </CardTitle>
          <CardDescription>
            Get up and running with Inflio in under 5 minutes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <h4 className="font-semibold">1. Upload Your Video</h4>
              <p className="text-sm text-muted-foreground">
                Go to Studio → Upload and drag in your video file
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">2. Select Workflows</h4>
              <p className="text-sm text-muted-foreground">
                Choose transcription, clips, or content generation
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">3. Let AI Process</h4>
              <p className="text-sm text-muted-foreground">
                Wait 2-7 minutes for AI to analyze your content
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">4. Review & Publish</h4>
              <p className="text-sm text-muted-foreground">
                Edit generated content and publish to social media
              </p>
            </div>
          </div>
          <div className="pt-4">
            <Button asChild>
              <Link href="/studio/upload">
                Start Processing Your First Video
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Features Guide */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Feature Guides</h2>
        <div className="grid gap-6 md:grid-cols-2">
          {features.map((feature, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <feature.icon className="h-5 w-5 text-primary" />
                  {feature.title}
                </CardTitle>
                <CardDescription>{feature.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <ol className="space-y-2">
                  {feature.steps.map((step, stepIndex) => (
                    <li key={stepIndex} className="flex gap-3 text-sm">
                      <Badge variant="outline" className="h-6 w-6 rounded-full p-0 flex items-center justify-center">
                        {stepIndex + 1}
                      </Badge>
                      {step}
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Separator />

      {/* FAQ */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Frequently Asked Questions</h2>
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle className="text-lg">{faq.question}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{faq.answer}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Separator />

      {/* Support */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconMail className="h-5 w-5" />
            Need More Help?
          </CardTitle>
          <CardDescription>
            Can't find what you're looking for? We're here to help!
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <h4 className="font-semibold">Email Support</h4>
              <p className="text-sm text-muted-foreground">
                Get in touch with our support team for personalized help
              </p>
              <Button variant="outline" size="sm" asChild>
                <Link href="mailto:support@inflio.ai">
                  <IconMail className="h-4 w-4 mr-2" />
                  Contact Support
                </Link>
              </Button>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">Feature Requests</h4>
              <p className="text-sm text-muted-foreground">
                Have an idea? We'd love to hear your feedback
              </p>
              <Button variant="outline" size="sm" asChild>
                <Link href="mailto:feedback@inflio.ai">
                  <IconExternalLink className="h-4 w-4 mr-2" />
                  Send Feedback
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navigation Links */}
      <Card>
        <CardHeader>
          <CardTitle>Explore Inflio</CardTitle>
          <CardDescription>
            Quick links to get you started with the platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard">Dashboard</Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/projects">My Videos</Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/studio/upload">Upload Video</Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/social">Social Media</Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/profile">Profile Settings</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 