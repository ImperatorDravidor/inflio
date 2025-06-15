"use client"

import Link from "next/link"
import { useUser } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { motion } from "framer-motion"
import { useState } from "react"
import { 
  ArrowRight, 
  Video, 
  Sparkles, 
  FileText, 
  Share2, 
  Zap, 
  CheckCircle,
  Menu,
  X,
  Upload,
  Bot,
  Type,
  Layers,
  BarChart3,
  Clock,
  Globe,
  Users,
  Star,
  ChevronRight,
} from "lucide-react"

const features = [
  {
    icon: <Video className="h-5 w-5" />,
    title: "AI Video Clips",
    description: "Automatically extract the best moments from your long videos and turn them into viral short clips.",
  },
  {
    icon: <Type className="h-5 w-5" />,
    title: "Smart Transcription",
    description: "Get accurate, timestamped transcriptions powered by OpenAI Whisper for perfect subtitles.",
  },
  {
    icon: <Share2 className="h-5 w-5" />,
    title: "Social Media Ready",
    description: "Generate platform-optimized content for TikTok, Instagram, YouTube Shorts, and more.",
  },
  {
    icon: <FileText className="h-5 w-5" />,
    title: "Blog Generation",
    description: "Transform video content into SEO-friendly blog posts with just one click.",
  },
  {
    icon: <BarChart3 className="h-5 w-5" />,
    title: "Analytics Dashboard",
    description: "Track performance and get insights on what content resonates with your audience.",
  },
  {
    icon: <Sparkles className="h-5 w-5" />,
    title: "AI Enhancement",
    description: "Enhance your content with AI-powered suggestions and automatic improvements.",
  },
]

const stats = [
  { value: "10M+", label: "Videos Processed" },
  { value: "50K+", label: "Active Creators" },
  { value: "95%", label: "Time Saved" },
  { value: "4.9", label: "User Rating" },
]

const testimonials = [
  {
    content: "Inflio has completely transformed my content workflow. What used to take hours now takes minutes.",
    author: "Sarah Chen",
    role: "YouTube Creator",
    avatar: "SC",
  },
  {
    content: "The AI clip generation is incredible. It finds the perfect moments every single time.",
    author: "Marcus Johnson",
    role: "Content Strategist",
    avatar: "MJ",
  },
  {
    content: "I've tripled my social media engagement since I started using Inflio. It's a game changer.",
    author: "Emily Rodriguez",
    role: "Digital Marketer",
    avatar: "ER",
  },
]

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { isSignedIn } = useUser()
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center">
              <Link href="/" className="flex items-center space-x-2">
                <Layers className="h-6 w-6 text-primary" />
                <span className="text-xl font-bold">Inflio</span>
              </Link>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex md:items-center md:space-x-8">
              <Link href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Features
              </Link>
              <Link href="#how-it-works" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                How it Works
              </Link>
              <Link href="#testimonials" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Testimonials
              </Link>
              <Link href="#pricing" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Pricing
              </Link>
            </div>
            
            {/* Desktop Auth Buttons */}
            <div className="hidden md:flex md:items-center md:space-x-4">
              {isSignedIn ? (
                <Link href="/dashboard">
                  <Button>
                    Dashboard
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              ) : (
                <>
                  <Link href="/sign-in">
                    <Button variant="ghost">Sign In</Button>
                  </Link>
                  <Link href="/sign-up">
                    <Button>Get Started Free</Button>
                  </Link>
                </>
              )}
            </div>
            
            {/* Mobile Menu Button */}
            <button
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
        
        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden">
            <div className="space-y-1 px-4 pb-3 pt-2">
              <Link href="#features" className="block px-3 py-2 text-base font-medium text-muted-foreground hover:text-foreground">
                Features
              </Link>
              <Link href="#how-it-works" className="block px-3 py-2 text-base font-medium text-muted-foreground hover:text-foreground">
                How it Works
              </Link>
              <Link href="#testimonials" className="block px-3 py-2 text-base font-medium text-muted-foreground hover:text-foreground">
                Testimonials
              </Link>
              <Link href="#pricing" className="block px-3 py-2 text-base font-medium text-muted-foreground hover:text-foreground">
                Pricing
              </Link>
              <div className="mt-4 space-y-2 px-3">
                {isSignedIn ? (
                  <Link href="/dashboard" className="block">
                    <Button className="w-full">Dashboard</Button>
                  </Link>
                ) : (
                  <>
                    <Link href="/sign-in" className="block">
                      <Button variant="outline" className="w-full">Sign In</Button>
                    </Link>
                    <Link href="/sign-up" className="block">
                      <Button className="w-full">Get Started Free</Button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="py-20 sm:py-24 lg:py-32">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mx-auto max-w-3xl text-center"
            >
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                Transform Your Videos into
                <span className="block text-primary">Viral Content with AI</span>
              </h1>
              <p className="mt-6 text-lg text-muted-foreground sm:text-xl">
                Inflio uses cutting-edge AI to automatically create clips, transcriptions, and social media content from your long-form videos. Save hours of editing time.
              </p>
              <div className="mt-10 flex items-center justify-center gap-4">
                <Link href={isSignedIn ? "/dashboard" : "/sign-up"}>
                  <Button size="lg" className="gap-2">
                    Start Free Trial
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="#how-it-works">
                  <Button size="lg" variant="outline">
                    See How It Works
                  </Button>
                </Link>
              </div>
              <p className="mt-4 text-sm text-muted-foreground">
                No credit card required • 14-day free trial
              </p>
            </motion.div>
          </div>
        </div>
        
        {/* Background decoration */}
        <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80" aria-hidden="true">
          <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-primary to-secondary opacity-20 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]" />
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-y bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="py-12 sm:py-16">
            <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
              {stats.map((stat) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  viewport={{ once: true }}
                  className="text-center"
                >
                  <div className="text-3xl font-bold text-primary sm:text-4xl">{stat.value}</div>
                  <div className="mt-1 text-sm text-muted-foreground">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 sm:py-24 lg:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Everything You Need to Create Viral Content
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Powerful AI features that help you create more content in less time
            </p>
          </div>
          <div className="mx-auto mt-16 grid max-w-5xl grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true }}
              >
                <Card className="h-full">
                  <CardHeader>
                    <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      {feature.icon}
                    </div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>{feature.description}</CardDescription>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="bg-muted/30 py-20 sm:py-24 lg:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              How It Works
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Get started in three simple steps
            </p>
          </div>
          <div className="mx-auto mt-16 max-w-3xl">
            <div className="space-y-12">
              {[
                {
                  step: "1",
                  title: "Upload Your Video",
                  description: "Simply drag and drop your video file or paste a YouTube link",
                  icon: <Upload className="h-6 w-6" />,
                },
                {
                  step: "2",
                  title: "AI Processing",
                  description: "Our AI analyzes your content and creates clips, transcriptions, and more",
                  icon: <Bot className="h-6 w-6" />,
                },
                {
                  step: "3",
                  title: "Download & Share",
                  description: "Get your content ready for all social media platforms instantly",
                  icon: <Share2 className="h-6 w-6" />,
                },
              ].map((item) => (
                <motion.div
                  key={item.step}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5 }}
                  viewport={{ once: true }}
                  className="flex gap-4"
                >
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    {item.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold">
                      Step {item.step}: {item.title}
                    </h3>
                    <p className="mt-2 text-muted-foreground">{item.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 sm:py-24 lg:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Loved by Content Creators
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              See what our users have to say about Inflio
            </p>
          </div>
          <div className="mx-auto mt-16 grid max-w-5xl grid-cols-1 gap-8 sm:grid-cols-3">
            {testimonials.map((testimonial) => (
              <motion.div
                key={testimonial.author}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true }}
              >
                <Card className="h-full">
                  <CardContent className="pt-6">
                    <div className="mb-4 flex gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                      ))}
                    </div>
                    <p className="text-muted-foreground">{testimonial.content}</p>
                    <div className="mt-6 flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                        {testimonial.avatar}
                      </div>
                      <div>
                        <div className="font-semibold">{testimonial.author}</div>
                        <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-primary-foreground sm:text-4xl">
              Ready to Transform Your Content?
            </h2>
            <p className="mt-4 text-lg text-primary-foreground/90">
              Join thousands of creators who are saving hours every week with Inflio
            </p>
            <div className="mt-10 flex items-center justify-center gap-4">
              <Link href={isSignedIn ? "/dashboard" : "/sign-up"}>
                <Button size="lg" variant="secondary">
                  Get Started Free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center space-x-2">
              <Layers className="h-5 w-5 text-primary" />
              <span className="font-semibold">Inflio</span>
            </div>
            <p className="text-center text-sm text-muted-foreground">
              © {new Date().getFullYear()} Inflio. All rights reserved.
            </p>
            <div className="flex space-x-6">
              <Link href="#" className="text-sm text-muted-foreground hover:text-foreground">
                Privacy
              </Link>
              <Link href="#" className="text-sm text-muted-foreground hover:text-foreground">
                Terms
              </Link>
              <Link href="#" className="text-sm text-muted-foreground hover:text-foreground">
                Contact
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
} 
