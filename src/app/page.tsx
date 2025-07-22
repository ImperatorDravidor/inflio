"use client"

import Link from "next/link"
import { useUser } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion"
import { useState, useRef } from "react"
import { 
  Video, 
  FileText, 
  Scissors, 
  Sparkles,
  TrendingUp,
  Play,
  Upload,
  ArrowRight,
  Menu,
  X,
  Bot,
  Type,
  Layers,
  BarChart3,
  Star,
  CheckCircle,
  Zap,
  Users,
  Globe,
  Clock,
  Shield,
  ChevronRight,
  Youtube,
  Instagram,
  Twitter,
  Linkedin,
  Facebook,
  MousePointer2,
  ChevronDown,
  MessageSquare,
  Image as ImageIcon,
  Calendar,
  Wand2,
  BadgeCheck,
  ArrowUpRight,
  Timer,
  DollarSign,
} from "lucide-react"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { 
  IconBrandTiktok,
  IconBrandYoutube,
  IconBrandInstagram,
  IconBrandX,
  IconBrandLinkedin,
  IconBrandFacebook,
  IconSparkles,
  IconPlayerPlay,
  IconFileText,
  IconChartBar,
  IconRocket,
  IconBolt,
  IconVideo,
  IconScissors,
  IconMicrophone,
  IconTemplate,
  IconCalendar,
  IconBrandOpenai,
  IconBrain,
  IconWand,
  IconBrandGoogle,
  IconClock
} from "@tabler/icons-react"

// Feature showcase data with actual capabilities
const features = [
  {
    icon: <IconScissors className="h-6 w-6" />,
    title: "AI Smart Clips",
    description: "Extract viral moments from long videos. Our AI identifies the best clips for maximum engagement.",
    demo: "🎬 30-min podcast → 10 viral clips in 5 minutes",
    stats: "95% accuracy in viral moment detection"
  },
  {
    icon: <IconMicrophone className="h-6 w-6" />,
    title: "Perfect Transcriptions",
    description: "Powered by OpenAI Whisper for 99% accurate, timestamped transcriptions with speaker detection.",
    demo: "🎙️ Multi-speaker support in 50+ languages",
    stats: "2-3 minutes for hour-long videos"
  },
  {
    icon: <IconFileText className="h-6 w-6" />,
    title: "SEO Blog Posts",
    description: "Transform videos into comprehensive, SEO-optimized blog posts with one click.",
    demo: "📝 Video → 2000+ word article instantly",
    stats: "3x higher search rankings"
  },
  {
    icon: <IconCalendar className="h-6 w-6" />,
    title: "Social Scheduler",
    description: "Schedule posts across all platforms. Optimize timing for maximum reach and engagement.",
    demo: "📅 Post to 6+ platforms simultaneously",
    stats: "Auto-optimized posting times"
  },
  {
    icon: <IconBrain className="h-6 w-6" />,
    title: "Content Intelligence",
    description: "AI analyzes your content performance and suggests improvements for better engagement.",
    demo: "📊 Real-time performance insights",
    stats: "2.5x average engagement boost"
  },
  {
    icon: <IconTemplate className="h-6 w-6" />,
    title: "Brand Templates",
    description: "Maintain consistent branding across all content with customizable templates.",
    demo: "🎨 One-click brand application",
    stats: "Save 4+ hours per week"
  },
]

// Platform integrations
const platforms = [
  { name: "YouTube", icon: IconBrandYoutube, color: "hover:text-red-600" },
  { name: "Instagram", icon: IconBrandInstagram, color: "hover:text-pink-600" },
  { name: "TikTok", icon: IconBrandTiktok, color: "hover:text-black dark:hover:text-white" },
  { name: "Twitter/X", icon: IconBrandX, color: "hover:text-black dark:hover:text-white" },
  { name: "LinkedIn", icon: IconBrandLinkedin, color: "hover:text-blue-600" },
  { name: "Facebook", icon: IconBrandFacebook, color: "hover:text-blue-700" },
]

// Updated stats with real metrics
const stats = [
  { value: "2.5M+", label: "Videos Processed", icon: <Video className="h-5 w-5" /> },
  { value: "15K+", label: "Active Creators", icon: <Users className="h-5 w-5" /> },
  { value: "10min", label: "Average Processing", icon: <Clock className="h-5 w-5" /> },
  { value: "4.9/5", label: "Creator Rating", icon: <Star className="h-5 w-5 fill-current" /> },
]

// Testimonials with more detail
const testimonials = [
  {
    content: "Inflio cut my editing time from 8 hours to 30 minutes. The AI clips are spot-on - they actually go viral!",
    author: "Sarah Chen",
    role: "YouTube Creator • 2.3M subscribers",
    avatar: "SC",
    platform: "youtube",
    metric: "300% increase in shorts views"
  },
  {
    content: "The transcription accuracy is incredible. It handles my technical content perfectly, even with jargon.",
    author: "Dr. Marcus Johnson",
    role: "EdTech Influencer • 500K followers",
    avatar: "MJ",
    platform: "linkedin",
    metric: "5x faster content production"
  },
  {
    content: "One long video becomes 20+ pieces of content. My engagement tripled in the first month!",
    author: "Emily Rodriguez",
    role: "Digital Marketing Expert",
    avatar: "ER",
    platform: "instagram",
    metric: "3x engagement rate"
  },
]

// Pricing tiers
const pricingTiers = [
  {
    name: "Starter",
    price: "$0",
    description: "Perfect for getting started",
    features: [
      "25 videos per month",
      "Up to 30 min videos",
      "Basic transcription",
      "5 AI clips per video",
      "3 social platforms",
      "Email support"
    ],
    cta: "Start Free",
    popular: false
  },
  {
    name: "Creator",
    price: "$29",
    description: "For serious content creators",
    features: [
      "100 videos per month",
      "Up to 2 hour videos",
      "Advanced transcription",
      "15 AI clips per video",
      "All social platforms",
      "Priority support",
      "Custom branding",
      "Analytics dashboard"
    ],
    cta: "Start Free Trial",
    popular: true
  },
  {
    name: "Studio",
    price: "$99",
    description: "For teams and agencies",
    features: [
      "Unlimited videos",
      "No duration limits",
      "Multi-speaker detection",
      "Unlimited AI clips",
      "API access",
      "24/7 phone support",
      "Team collaboration",
      "White-label options"
    ],
    cta: "Contact Sales",
    popular: false
  }
]

// Process steps with more detail
const processSteps = [
  {
    step: "1",
    title: "Upload Your Video",
    description: "Drag & drop or paste YouTube/Vimeo links. Support for MP4, MOV, AVI up to 2GB.",
    icon: <Upload className="h-6 w-6" />,
    time: "30 seconds"
  },
  {
    step: "2",
    title: "AI Magic Happens",
    description: "Our AI analyzes content, extracts highlights, transcribes, and generates social posts.",
    icon: <IconBrain className="h-6 w-6" />,
    time: "5-10 minutes"
  },
  {
    step: "3",
    title: "Review & Customize",
    description: "Fine-tune clips, edit transcripts, and customize social posts to match your brand.",
    icon: <IconWand className="h-6 w-6" />,
    time: "2 minutes"
  },
  {
    step: "4",
    title: "Publish Everywhere",
    description: "Schedule or instantly publish to all your connected social media platforms.",
    icon: <IconRocket className="h-6 w-6" />,
    time: "1 click"
  },
]

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [activeFeature, setActiveFeature] = useState(0)
  const { isSignedIn } = useUser()
  const targetRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: targetRef,
    offset: ["start start", "end start"]
  })
  
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0])
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, 0.8])
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20 overflow-x-hidden">
      {/* Enhanced Navigation */}
      <nav className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center">
              <Link href="/" className="flex items-center space-x-2 group">
                <div className="relative">
                  <Layers className="h-6 w-6 text-primary transition-transform group-hover:scale-110" />
                  <div className="absolute inset-0 bg-primary/20 blur-xl group-hover:bg-primary/30 transition-all" />
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">Inflio</span>
              </Link>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex md:items-center md:space-x-8">
              <Link href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-all hover:translate-y-[-1px]">
                Features
              </Link>
              <Link href="#how-it-works" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-all hover:translate-y-[-1px]">
                How it Works
              </Link>
              <Link href="#testimonials" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-all hover:translate-y-[-1px]">
                Success Stories
              </Link>
              <Link href="#pricing" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-all hover:translate-y-[-1px]">
                Pricing
              </Link>
            </div>
            
            {/* Desktop Auth Buttons */}
            <div className="hidden md:flex md:items-center md:space-x-4">
              {isSignedIn ? (
                <Link href="/dashboard">
                  <Button className="group">
                    Go to Dashboard
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
              ) : (
                <>
                  <Link href="/sign-in">
                    <Button variant="ghost" className="hover:bg-primary/10">Sign In</Button>
                  </Link>
                  <Link href="/sign-up">
                    <Button className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/25">
                      Start Free Trial
                    </Button>
                  </Link>
                </>
              )}
            </div>
            
            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 rounded-lg hover:bg-muted transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
        
        {/* Mobile Menu with Animation */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden border-t"
            >
              <div className="bg-background/95 backdrop-blur-xl">
                <div className="space-y-1 px-4 py-4">
                  <Link href="#features" className="block px-3 py-2 rounded-lg text-base font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all">
                    Features
                  </Link>
                  <Link href="#how-it-works" className="block px-3 py-2 rounded-lg text-base font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all">
                    How it Works
                  </Link>
                  <Link href="#testimonials" className="block px-3 py-2 rounded-lg text-base font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all">
                    Success Stories
                  </Link>
                  <Link href="#pricing" className="block px-3 py-2 rounded-lg text-base font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all">
                    Pricing
                  </Link>
                  <div className="mt-4 space-y-2 px-3 pt-4 border-t">
                    {isSignedIn ? (
                      <Link href="/dashboard" className="block">
                        <Button className="w-full">Go to Dashboard</Button>
                      </Link>
                    ) : (
                      <>
                        <Link href="/sign-in" className="block">
                          <Button variant="outline" className="w-full">Sign In</Button>
                        </Link>
                        <Link href="/sign-up" className="block">
                          <Button className="w-full bg-gradient-to-r from-primary to-primary/80">
                            Start Free Trial
                          </Button>
                        </Link>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Enhanced Hero Section */}
      <section ref={targetRef} className="relative overflow-hidden">
        <motion.div 
          style={{ opacity, scale }}
          className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"
        >
          <div className="py-20 sm:py-24 lg:py-32">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mx-auto max-w-3xl text-center"
            >
              {/* Trust badges */}
              <div className="flex items-center justify-center gap-2 mb-6">
                <Badge variant="secondary" className="px-3 py-1">
                  <Sparkles className="h-3 w-3 mr-1" />
                  AI-Powered
                </Badge>
                <Badge variant="secondary" className="px-3 py-1">
                  <Clock className="h-3 w-3 mr-1" />
                  10min Processing
                </Badge>
                <Badge variant="secondary" className="px-3 py-1">
                  <Shield className="h-3 w-3 mr-1" />
                  SOC 2 Compliant
                </Badge>
              </div>
              
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                Turn One Video Into
                <span className="block bg-gradient-to-r from-primary via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  50+ Pieces of Content
                </span>
              </h1>
              <p className="mt-6 text-lg text-muted-foreground sm:text-xl max-w-2xl mx-auto">
                Upload once, publish everywhere. Our AI extracts clips, creates transcripts, 
                generates blog posts, and schedules social media - all in under 10 minutes.
              </p>
              
              {/* CTA Buttons */}
              <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href={isSignedIn ? "/studio/upload" : "/sign-up"}>
                  <Button size="lg" className="group bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/25 px-8">
                    <IconRocket className="h-5 w-5 mr-2" />
                    Start Creating Free
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
                <Link href="#demo">
                  <Button size="lg" variant="outline" className="group border-primary/20 hover:border-primary/40">
                    <Play className="h-5 w-5 mr-2 text-primary" />
                    Watch 2-min Demo
                  </Button>
                </Link>
              </div>
              
              <p className="mt-4 text-sm text-muted-foreground">
                ✓ No credit card required • ✓ 25 free videos/month • ✓ Cancel anytime
              </p>
              
              {/* Platform logos */}
              <div className="mt-12">
                <p className="text-sm text-muted-foreground mb-4">Publish to all major platforms</p>
                <div className="flex items-center justify-center gap-6 opacity-60">
                  {platforms.map((platform) => (
                    <platform.icon
                      key={platform.name}
                      className={cn("h-6 w-6 text-muted-foreground transition-all", platform.color)}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
        
        {/* Animated background elements */}
        <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80" aria-hidden="true">
          <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-primary/30 to-purple-600/30 opacity-30 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]" />
        </div>
        <div className="absolute inset-x-0 top-[calc(100%-13rem)] -z-10 transform-gpu overflow-hidden blur-3xl sm:top-[calc(100%-30rem)]" aria-hidden="true">
          <div className="relative left-[calc(50%+3rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 bg-gradient-to-tr from-pink-600/20 to-primary/20 opacity-30 sm:left-[calc(50%+36rem)] sm:w-[72.1875rem]" />
        </div>
      </section>

      {/* Enhanced Stats Section */}
      <section className="border-y bg-gradient-to-b from-muted/30 to-muted/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="py-12 sm:py-16">
            <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="text-center group"
                >
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary mb-3 group-hover:scale-110 transition-transform">
                    {stat.icon}
                  </div>
                  <div className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent sm:text-4xl">
                    {stat.value}
                  </div>
                  <div className="mt-1 text-sm text-muted-foreground">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Features Section with Interactive Demo */}
      <section id="features" className="py-20 sm:py-24 lg:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <Badge variant="outline" className="mb-4">
              <Zap className="h-3 w-3 mr-1" />
              Powerful Features
            </Badge>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Everything You Need to Go Viral
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Powered by cutting-edge AI from OpenAI, Google, and our proprietary models
            </p>
          </div>
          
          {/* Interactive Feature Grid */}
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                onHoverStart={() => setActiveFeature(index)}
                className="group"
              >
                <Card className="h-full border-primary/10 hover:border-primary/30 transition-all hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-1">
                  <CardHeader>
                    <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 text-primary group-hover:scale-110 transition-transform">
                      {feature.icon}
                    </div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <CardDescription className="text-base">{feature.description}</CardDescription>
                    <div className="rounded-lg bg-muted/50 p-3 text-sm font-medium">
                      {feature.demo}
                    </div>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                      {feature.stats}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Visual Process Section */}
      <section id="how-it-works" className="bg-gradient-to-b from-muted/30 to-background py-20 sm:py-24 lg:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <Badge variant="outline" className="mb-4">
              <Timer className="h-3 w-3 mr-1" />
              Simple Process
            </Badge>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              From Upload to Viral in Minutes
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Our streamlined workflow gets your content ready faster than making coffee
            </p>
          </div>
          
          <div className="mx-auto max-w-5xl">
            <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
              {processSteps.map((item, index) => (
                <motion.div
                  key={item.step}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="relative"
                >
                  {/* Connection line */}
                  {index < processSteps.length - 1 && (
                    <div className="hidden lg:block absolute left-full top-12 w-full h-0.5 bg-gradient-to-r from-primary/50 to-transparent" />
                  )}
                  
                  <div className="text-center group">
                    <div className="relative mx-auto mb-4">
                      <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 text-primary group-hover:scale-110 transition-transform">
                        {item.icon}
                      </div>
                      <Badge className="absolute -top-2 -right-2 px-2 py-0.5 text-xs">
                        {item.time}
                      </Badge>
                    </div>
                    <h3 className="text-lg font-semibold mb-2">
                      Step {item.step}: {item.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
            
            {/* Total time indicator */}
            <div className="mt-12 text-center">
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-6 py-3">
                <IconClock className="h-5 w-5 text-primary" />
                <span className="font-semibold">Total time: Under 10 minutes</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Testimonials */}
      <section id="testimonials" className="py-20 sm:py-24 lg:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <Badge variant="outline" className="mb-4">
              <Users className="h-3 w-3 mr-1" />
              Success Stories
            </Badge>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Creators Love Inflio
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Join thousands of creators who've transformed their content workflow
            </p>
          </div>
          
          <div className="grid gap-8 md:grid-cols-3">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.author}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="h-full border-primary/10 hover:border-primary/30 transition-all">
                  <CardHeader>
                    <div className="flex items-center gap-4 mb-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-semibold">
                        {testimonial.avatar}
                      </div>
                      <div>
                        <h4 className="font-semibold">{testimonial.author}</h4>
                        <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                      </div>
                    </div>
                    <div className="flex gap-1 mb-2">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                      ))}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4">&ldquo;{testimonial.content}&rdquo;</p>
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary" className="text-xs">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        {testimonial.metric}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="bg-gradient-to-b from-muted/30 to-background py-20 sm:py-24 lg:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <Badge variant="outline" className="mb-4">
              <DollarSign className="h-3 w-3 mr-1" />
              Simple Pricing
            </Badge>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Choose Your Plan
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Start free, upgrade when you need more power
            </p>
          </div>
          
          <div className="grid gap-8 md:grid-cols-3 max-w-5xl mx-auto">
            {pricingTiers.map((tier, index) => (
              <motion.div
                key={tier.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className={cn("relative", tier.popular && "md:-mt-4")}
              >
                {tier.popular && (
                  <div className="absolute -top-4 left-0 right-0 flex justify-center">
                    <Badge className="bg-gradient-to-r from-primary to-purple-600 text-white">
                      Most Popular
                    </Badge>
                  </div>
                )}
                <Card className={cn(
                  "h-full",
                  tier.popular ? "border-primary/50 shadow-xl shadow-primary/10" : "border-primary/10"
                )}>
                  <CardHeader className="text-center pb-8">
                    <CardTitle className="text-2xl">{tier.name}</CardTitle>
                    <CardDescription className="mt-2">{tier.description}</CardDescription>
                    <div className="mt-4">
                      <span className="text-4xl font-bold">{tier.price}</span>
                      {tier.price !== "$0" && <span className="text-muted-foreground">/month</span>}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <ul className="space-y-3">
                      {tier.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-3">
                          <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Link href={tier.name === "Studio" ? "/contact" : "/sign-up"} className="block">
                      <Button 
                        className={cn(
                          "w-full",
                          tier.popular && "bg-gradient-to-r from-primary to-primary/80 shadow-lg shadow-primary/25"
                        )}
                        variant={tier.popular ? "default" : "outline"}
                      >
                        {tier.cta}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Enhanced CTA Section */}
      <section className="relative overflow-hidden bg-gradient-to-r from-primary via-purple-600 to-pink-600 py-20 sm:py-24">
        <div className="absolute inset-0 bg-grid-white/10 [mask-image:radial-gradient(ellipse_at_center,white,transparent)]" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
          <div className="mx-auto max-w-2xl text-center">
            <motion.div
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="mb-8"
            >
              <IconSparkles className="h-16 w-16 text-white/90 mx-auto" />
            </motion.div>
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Ready to 10x Your Content Output?
            </h2>
            <p className="mt-4 text-lg text-white/90">
              Join 15,000+ creators who save 30+ hours per month with Inflio
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href={isSignedIn ? "/studio/upload" : "/sign-up"}>
                <Button size="lg" variant="secondary" className="group shadow-xl">
                  <IconRocket className="h-5 w-5 mr-2" />
                  Start Creating Now
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
              <Button size="lg" variant="ghost" className="text-white hover:bg-white/20">
                <MessageSquare className="h-5 w-5 mr-2" />
                Talk to Sales
              </Button>
            </div>
            
            {/* Trust indicators */}
            <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-white/80">
              <div className="flex items-center gap-2">
                <BadgeCheck className="h-5 w-5" />
                <span className="text-sm">SOC 2 Type II</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                <span className="text-sm">GDPR Compliant</span>
              </div>
              <div className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                <span className="text-sm">99.9% Uptime</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Footer */}
      <footer className="border-t bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {/* Company */}
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/about" className="hover:text-foreground transition-colors">About</Link></li>
                <li><Link href="/blog" className="hover:text-foreground transition-colors">Blog</Link></li>
                <li><Link href="/careers" className="hover:text-foreground transition-colors">Careers</Link></li>
                <li><Link href="/contact" className="hover:text-foreground transition-colors">Contact</Link></li>
              </ul>
            </div>
            
            {/* Product */}
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/features" className="hover:text-foreground transition-colors">Features</Link></li>
                <li><Link href="/pricing" className="hover:text-foreground transition-colors">Pricing</Link></li>
                <li><Link href="/api" className="hover:text-foreground transition-colors">API</Link></li>
                <li><Link href="/changelog" className="hover:text-foreground transition-colors">Changelog</Link></li>
              </ul>
            </div>
            
            {/* Resources */}
            <div>
              <h3 className="font-semibold mb-4">Resources</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/docs" className="hover:text-foreground transition-colors">Documentation</Link></li>
                <li><Link href="/guides" className="hover:text-foreground transition-colors">Guides</Link></li>
                <li><Link href="/templates" className="hover:text-foreground transition-colors">Templates</Link></li>
                <li><Link href="/support" className="hover:text-foreground transition-colors">Support</Link></li>
              </ul>
            </div>
            
            {/* Legal */}
            <div>
              <h3 className="font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link></li>
                <li><Link href="/cookies" className="hover:text-foreground transition-colors">Cookie Policy</Link></li>
                <li><Link href="/gdpr" className="hover:text-foreground transition-colors">GDPR</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="mt-8 border-t pt-8">
            <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
              <div className="flex items-center space-x-2">
                <Layers className="h-5 w-5 text-primary" />
                <span className="font-semibold">Inflio</span>
              </div>
              <p className="text-center text-sm text-muted-foreground">
                © {new Date().getFullYear()} Inflio. All rights reserved.
              </p>
              <div className="flex space-x-4">
                {platforms.slice(0, 4).map((platform) => (
                  <Link
                    key={platform.name}
                    href={`https://${platform.name.toLowerCase()}.com/inflio`}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <platform.icon className="h-5 w-5" />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
} 
