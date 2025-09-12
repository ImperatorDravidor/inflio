"use client"

import Link from "next/link"
import { useUser } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion"
import { useState, useRef, useEffect } from "react"
import { AnalyticsService } from "@/lib/analytics-service"
import InfiniteHero from "@/components/ui/infinite-hero"
import { PricingSection } from "@/components/ui/pricing-section"
// GSAP imports - wrapped in try-catch for production
let gsap: any = null
let SplitText: any = null
let useGSAP: any = null

// Try to import GSAP, but don't fail if it's not available
if (typeof window !== 'undefined') {
  try {
    const gsapModule = require('gsap')
    const gsapReact = require('@gsap/react')
    gsap = gsapModule.gsap
    useGSAP = gsapReact.useGSAP
    // SplitText might not be available in production
    try {
      SplitText = require('gsap/SplitText').SplitText
    } catch (e) {
      console.log('SplitText not available - using fallback animations')
    }
  } catch (e) {
    console.log('GSAP not available - using fallback animations')
  }
}
import { InflioLogo } from "@/components/inflio-logo"
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
  Star,
  CheckCircle,
  Zap,
  Users,
  Globe,
  Clock,
  Shield,
  MousePointer2,
  MessageSquare,
  Calendar,
  Wand2,
  BadgeCheck,
  Timer,
  DollarSign,
  BarChart3,
  Layers,
  Crown,
  Rocket,
  Youtube,
  Instagram,
  Twitter,
  ChevronRight,
  ArrowUpRight,
  Bot,
  Mic,
  Share2,
  Download,
  Eye,
  ThumbsUp,
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
  IconRocket,
  IconVideo,
  IconScissors,
  IconMicrophone,
  IconTemplate,
  IconCalendar,
  IconBrain,
  IconWand,
  IconClock,
  IconFileText,
} from "@tabler/icons-react"

// Register SplitText only if both GSAP and SplitText are available
if (gsap && SplitText) {
  try {
    gsap.registerPlugin(SplitText)
  } catch (e) {
    console.log('Could not register SplitText plugin')
  }
}

// Platform integrations
const platforms = [
  { name: "YouTube", icon: IconBrandYoutube },
  { name: "Instagram", icon: IconBrandInstagram },
  { name: "TikTok", icon: IconBrandTiktok },
  { name: "Twitter/X", icon: IconBrandX },
  { name: "LinkedIn", icon: IconBrandLinkedin },
  { name: "Facebook", icon: IconBrandFacebook },
]

// Pricing tiers
const pricingTiers = [
  {
    name: "Starter",
    price: "$0",
    description: "Perfect for getting started",
    icon: <Sparkles className="h-6 w-6 text-primary" />,
    features: [
      { text: "25 videos per month", included: true },
      { text: "Up to 30 min videos", included: true },
      { text: "Basic AI transcription", included: true },
      { text: "5 AI clips per video", included: true },
      { text: "3 social platforms", included: true },
      { text: "Email support", included: true },
      { text: "Custom branding", included: false },
      { text: "API access", included: false },
    ],
    cta: "Start Free",
  },
  {
    name: "Creator",
    price: "$29",
    period: "month",
    description: "For serious content creators",
    icon: <Zap className="h-6 w-6 text-primary" />,
    popular: true,
    features: [
      { text: "100 videos per month", included: true },
      { text: "Up to 2 hour videos", included: true },
      { text: "Advanced AI transcription", included: true },
      { text: "15 AI clips per video", included: true },
      { text: "All social platforms", included: true },
      { text: "Priority support", included: true },
      { text: "Custom branding", included: true },
      { text: "Analytics dashboard", included: true },
    ],
    cta: "Start Free Trial",
  },
  {
    name: "Studio",
    price: "$99",
    period: "month",
    description: "For teams and agencies",
    icon: <Crown className="h-6 w-6 text-primary" />,
    features: [
      { text: "Unlimited videos", included: true },
      { text: "No duration limits", included: true },
      { text: "Multi-speaker detection", included: true },
      { text: "Unlimited AI clips", included: true },
      { text: "All social platforms", included: true },
      { text: "24/7 phone support", included: true },
      { text: "White-label options", included: true },
      { text: "API access", included: true },
    ],
    cta: "Contact Sales",
  },
]

// Stats data
const statsData = [
  { value: "2.5M+", label: "Videos Processed", icon: <Video className="h-5 w-5" /> },
  { value: "15K+", label: "Active Creators", icon: <Users className="h-5 w-5" /> },
  { value: "10min", label: "Avg. Processing", icon: <Clock className="h-5 w-5" /> },
  { value: "4.8/5", label: "Creator Rating", icon: <Star className="h-5 w-5 fill-current" /> },
]

// Custom Hero Component for Inflio
function InflioHero() {
  const rootRef = useRef<HTMLDivElement>(null)
  const logoRef = useRef<HTMLDivElement>(null)
  const h1Ref = useRef<HTMLHeadingElement>(null)
  const pRef = useRef<HTMLParagraphElement>(null)
  const ctaRef = useRef<HTMLDivElement>(null)
  const { isSignedIn } = useUser()
  const [animationReady, setAnimationReady] = useState(false)

  // Use GSAP if available, otherwise we'll use framer-motion as fallback
  useEffect(() => {
    if (useGSAP && gsap && SplitText) {
      // GSAP is available, use it
      try {
        const ctas = ctaRef.current ? Array.from(ctaRef.current.children) : []

        const h1Split = new SplitText(h1Ref.current, { type: "lines" })
        const pSplit = new SplitText(pRef.current, { type: "lines" })

        gsap.set(logoRef.current, { opacity: 0, y: -20, scale: 0.9 })
        gsap.set(h1Split.lines, {
          opacity: 0,
          y: 24,
          filter: "blur(8px)",
        })
        gsap.set(pSplit.lines, {
          opacity: 0,
          y: 16,
          filter: "blur(6px)",
        })
        if (ctas.length) gsap.set(ctas, { opacity: 0, y: 16 })

        const tl = gsap.timeline({ defaults: { ease: "power2.out" } })
        tl.to(logoRef.current, { opacity: 1, y: 0, scale: 1, duration: 0.8 }, 0)
          .to(
            h1Split.lines,
            {
              opacity: 1,
              y: 0,
              filter: "blur(0px)",
              duration: 0.8,
              stagger: 0.1,
            },
            0.3,
          )
          .to(
            pSplit.lines,
            {
              opacity: 1,
              y: 0,
              filter: "blur(0px)",
              duration: 0.6,
              stagger: 0.08,
            },
            "-=0.3",
          )
          .to(ctas, { opacity: 1, y: 0, duration: 0.6, stagger: 0.08 }, "-=0.2")

        return () => {
          h1Split.revert()
          pSplit.revert()
        }
      } catch (error) {
        console.log('GSAP animation failed, using fallback')
        setAnimationReady(true)
      }
    } else {
      // GSAP not available, trigger framer-motion fallback
      setAnimationReady(true)
    }
  }, [])

  // Framer Motion fallback animations when GSAP is not available
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2,
      }
    }
  }

  const itemVariants = {
    hidden: { 
      opacity: 0, 
      y: 30
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        type: "spring" as const,
        stiffness: 100
      }
    }
  }

  // If GSAP failed to load, use framer-motion instead
  if (animationReady) {
    return (
      <motion.div 
        ref={rootRef} 
        className="relative z-10 flex h-svh w-full items-center justify-center px-6"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <div className="text-center">
          <motion.div className="mb-8 flex justify-center" variants={itemVariants}>
            <InflioLogo size="xl" />
          </motion.div>
          <motion.h1
            className="mx-auto max-w-2xl lg:max-w-4xl text-[clamp(2.5rem,7vw,5rem)] font-extralight leading-[0.95] tracking-tight text-white"
            variants={itemVariants}
          >
            Turn One Video Into
            <span className="block bg-gradient-to-r from-white via-blue-200 to-purple-200 bg-clip-text text-transparent">
              50+ Pieces of Content
            </span>
          </motion.h1>
          <motion.p
            className="mx-auto mt-6 max-w-2xl md:text-balance text-base/7 md:text-lg/8 font-light tracking-tight text-white/80"
            variants={itemVariants}
          >
            AI-powered content repurposing that extracts clips, creates transcripts, 
            generates blog posts, and schedules to all platforms - in under 10 minutes.
          </motion.p>

          <motion.div
            className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
            variants={itemVariants}
          >
            <Link href={isSignedIn ? "/studio/upload" : "/sign-up"}>
              <button
                type="button"
                className="group relative overflow-hidden border border-white/30 bg-gradient-to-r from-white/20 to-white/10 px-8 py-3 text-base rounded-xl font-medium tracking-wide text-white backdrop-blur-sm transition-all duration-500 hover:border-white/50 hover:bg-white/20 hover:shadow-lg hover:shadow-white/10 cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  Start Creating Free
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </span>
              </button>
            </Link>

            <Link href="#demo">
              <button
                type="button"
                className="group relative px-8 py-3 text-base font-medium tracking-wide text-white/90 transition-all duration-500 hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.6)] hover:text-white cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Play className="h-5 w-5" />
                  Watch 2-min Demo
                </span>
              </button>
            </Link>
          </motion.div>
        </div>
      </motion.div>
    )
  }

  // Default return with GSAP animations (when GSAP is available)
  return (
    <div ref={rootRef} className="relative z-10 flex h-svh w-full items-center justify-center px-6">
      <div className="text-center">
        <div ref={logoRef} className="mb-8 flex justify-center">
          <InflioLogo size="xl" />
        </div>
        <h1
          ref={h1Ref}
          className="mx-auto max-w-2xl lg:max-w-4xl text-[clamp(2.5rem,7vw,5rem)] font-extralight leading-[0.95] tracking-tight text-white"
        >
          Turn One Video Into
          <span className="block bg-gradient-to-r from-white via-blue-200 to-purple-200 bg-clip-text text-transparent">
            50+ Pieces of Content
          </span>
        </h1>
        <p
          ref={pRef}
          className="mx-auto mt-6 max-w-2xl md:text-balance text-base/7 md:text-lg/8 font-light tracking-tight text-white/80"
        >
          AI-powered content repurposing that extracts clips, creates transcripts, 
          generates blog posts, and schedules to all platforms - in under 10 minutes.
        </p>

        <div
          ref={ctaRef}
          className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link href={isSignedIn ? "/studio/upload" : "/sign-up"}>
            <button
              type="button"
              className="group relative overflow-hidden border border-white/30 bg-gradient-to-r from-white/20 to-white/10 px-8 py-3 text-base rounded-xl font-medium tracking-wide text-white backdrop-blur-sm transition-all duration-500 hover:border-white/50 hover:bg-white/20 hover:shadow-lg hover:shadow-white/10 cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                Start Creating Free
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </span>
            </button>
          </Link>

          <Link href="#demo">
            <button
              type="button"
              className="group relative px-8 py-3 text-base font-medium tracking-wide text-white/90 transition-all duration-500 hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.6)] hover:text-white cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <Play className="h-5 w-5" />
                Watch 2-min Demo
              </span>
            </button>
          </Link>
        </div>
        
        <p className="mt-6 text-sm text-white/60">
          ✓ No credit card required • ✓ 25 free videos/month • ✓ Cancel anytime
        </p>
      </div>
    </div>
  )
}

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [activeDemo, setActiveDemo] = useState('upload')
  const { isSignedIn } = useUser()
  const [stats, setStats] = useState(statsData)
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20 overflow-x-hidden">
      {/* Enhanced Navigation */}
      <nav className="fixed top-0 z-50 w-full bg-black/40 backdrop-blur-xl border-b border-white/10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center">
              <Link href="/" className="flex items-center space-x-2 group">
                <InflioLogo size="sm" className="brightness-200" />
              </Link>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex md:items-center md:space-x-8">
              <Link href="#showcase" className="text-sm font-medium text-white/70 hover:text-white transition-all hover:translate-y-[-1px]">
                How It Works
              </Link>
              <Link href="#features" className="text-sm font-medium text-white/70 hover:text-white transition-all hover:translate-y-[-1px]">
                Features
              </Link>
              <Link href="#pricing" className="text-sm font-medium text-white/70 hover:text-white transition-all hover:translate-y-[-1px]">
                Pricing
              </Link>
              <Link href="#testimonials" className="text-sm font-medium text-white/70 hover:text-white transition-all hover:translate-y-[-1px]">
                Success Stories
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
                    <Button variant="ghost" className="text-white/90 hover:text-white hover:bg-white/10">Sign In</Button>
                  </Link>
                  <Link href="/sign-up">
                    <Button className="bg-gradient-to-r from-white/20 to-white/10 hover:from-white/30 hover:to-white/20 border border-white/30 text-white shadow-lg">
                      Start Free Trial
                    </Button>
                  </Link>
                </>
              )}
            </div>
            
            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 rounded-lg hover:bg-white/10 transition-colors text-white"
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
              className="md:hidden border-t border-white/10"
            >
              <div className="bg-black/95 backdrop-blur-xl">
                <div className="space-y-1 px-4 py-4">
                  <Link href="#showcase" className="block px-3 py-2 rounded-lg text-base font-medium text-white/70 hover:text-white hover:bg-white/10 transition-all">
                    How It Works
                  </Link>
                  <Link href="#features" className="block px-3 py-2 rounded-lg text-base font-medium text-white/70 hover:text-white hover:bg-white/10 transition-all">
                    Features
                  </Link>
                  <Link href="#pricing" className="block px-3 py-2 rounded-lg text-base font-medium text-white/70 hover:text-white hover:bg-white/10 transition-all">
                    Pricing
                  </Link>
                  <Link href="#testimonials" className="block px-3 py-2 rounded-lg text-base font-medium text-white/70 hover:text-white hover:bg-white/10 transition-all">
                    Success Stories
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

      {/* Hero Section with InfiniteHero */}
      <section className="relative overflow-hidden">
        <InfiniteHero />
        <div className="absolute inset-0 pointer-events-none">
          <InflioHero />
              </div>
              {/* Platform logos */}
        <div className="absolute bottom-10 left-0 right-0 z-20 pointer-events-none">
          <p className="text-sm text-white/60 mb-4 text-center">Publish to all major platforms</p>
          <div className="flex items-center justify-center gap-6">
                  {platforms.map((platform) => (
                    <platform.icon
                      key={platform.name}
                className="h-6 w-6 text-white/50 hover:text-white transition-all"
                    />
                  ))}
                </div>
        </div>
      </section>

      {/* Stats Section */}
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

      {/* Interactive Showcase Section */}
      <section id="showcase" className="py-20 sm:py-24 lg:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <Badge variant="outline" className="mb-4">
              <MousePointer2 className="h-3 w-3 mr-1" />
              See It In Action
            </Badge>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
              Watch Your Content Transform
              </h2>
            <p className="text-lg text-muted-foreground">
              See how Inflio turns one video into a complete content strategy
            </p>
          </div>

          {/* Interactive Demo */}
          <div className="mx-auto max-w-5xl">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Demo Steps */}
              <div className="space-y-4">
                <button
                  onClick={() => setActiveDemo('upload')}
                  className={cn(
                    "w-full text-left p-4 rounded-xl border transition-all",
                    activeDemo === 'upload' 
                      ? "border-primary bg-primary/10" 
                      : "border-border hover:border-primary/50"
                  )}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Upload className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">1. Upload Your Video</h3>
                    <p className="text-sm text-muted-foreground">
                        Drag & drop or paste a YouTube link. We support all major formats.
                      </p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setActiveDemo('process')}
                  className={cn(
                    "w-full text-left p-4 rounded-xl border transition-all",
                    activeDemo === 'process' 
                      ? "border-primary bg-primary/10" 
                      : "border-border hover:border-primary/50"
                  )}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Bot className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">2. AI Works Its Magic</h3>
                    <p className="text-sm text-muted-foreground">
                        Our AI analyzes, transcribes, and identifies viral moments automatically.
                      </p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setActiveDemo('customize')}
                  className={cn(
                    "w-full text-left p-4 rounded-xl border transition-all",
                    activeDemo === 'customize' 
                      ? "border-primary bg-primary/10" 
                      : "border-border hover:border-primary/50"
                  )}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Wand2 className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">3. Customize & Polish</h3>
                    <p className="text-sm text-muted-foreground">
                        Fine-tune clips, edit transcripts, and apply your brand style.
                      </p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setActiveDemo('publish')}
                  className={cn(
                    "w-full text-left p-4 rounded-xl border transition-all",
                    activeDemo === 'publish' 
                      ? "border-primary bg-primary/10" 
                      : "border-border hover:border-primary/50"
                  )}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Share2 className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">4. Publish Everywhere</h3>
                    <p className="text-sm text-muted-foreground">
                        Schedule and post to all platforms with one click.
                      </p>
                    </div>
                  </div>
                </button>
              </div>

              {/* Demo Visualization */}
              <div className="relative">
                <div className="aspect-video rounded-2xl bg-gradient-to-br from-primary/20 via-purple-600/20 to-pink-600/20 p-1">
                  <div className="w-full h-full rounded-xl bg-background/95 backdrop-blur-sm flex items-center justify-center">
                    <AnimatePresence mode="wait">
                      {activeDemo === 'upload' && (
              <motion.div
                          key="upload"
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          className="text-center p-8"
                        >
                          <Upload className="h-16 w-16 text-primary mx-auto mb-4" />
                          <p className="text-lg font-semibold">Drop your video here</p>
                          <p className="text-sm text-muted-foreground mt-2">
                            MP4, MOV, AVI • Up to 2GB
                          </p>
              </motion.div>
                      )}
                      {activeDemo === 'process' && (
              <motion.div
                          key="process"
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          className="p-8 w-full"
                        >
                          <div className="space-y-3">
                            <div className="flex items-center gap-3">
                              <Mic className="h-5 w-5 text-primary" />
                              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                                <motion.div
                                  className="h-full bg-primary"
                                  initial={{ width: 0 }}
                                  animate={{ width: "100%" }}
                                  transition={{ duration: 2, repeat: Infinity }}
                                />
                              </div>
                              <span className="text-sm">Transcribing...</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <Scissors className="h-5 w-5 text-primary" />
                              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                                <motion.div
                                  className="h-full bg-primary"
                                  initial={{ width: 0 }}
                                  animate={{ width: "100%" }}
                                  transition={{ duration: 2, delay: 0.5, repeat: Infinity }}
                                />
                              </div>
                              <span className="text-sm">Finding clips...</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <FileText className="h-5 w-5 text-primary" />
                              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                                <motion.div
                                  className="h-full bg-primary"
                                  initial={{ width: 0 }}
                                  animate={{ width: "100%" }}
                                  transition={{ duration: 2, delay: 1, repeat: Infinity }}
                                />
                              </div>
                              <span className="text-sm">Generating blog...</span>
                            </div>
                          </div>
              </motion.div>
                      )}
                      {activeDemo === 'customize' && (
                        <motion.div
                          key="customize"
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          className="p-8 w-full"
                        >
                          <div className="grid grid-cols-3 gap-3">
                            {[1, 2, 3, 4, 5, 6].map((i) => (
                              <div key={i} className="aspect-square rounded-lg bg-muted/50 flex items-center justify-center">
                                <Play className="h-6 w-6 text-muted-foreground" />
            </div>
                            ))}
                          </div>
                          <p className="text-center mt-4 text-sm text-muted-foreground">
                            6 viral clips detected
                          </p>
                        </motion.div>
                      )}
                      {activeDemo === 'publish' && (
            <motion.div
                          key="publish"
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          className="p-8"
                        >
                          <div className="grid grid-cols-3 gap-4">
                            {platforms.slice(0, 6).map((platform, i) => (
                              <motion.div
                                key={platform.name}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className="flex flex-col items-center gap-2"
                              >
                                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                                  <platform.icon className="h-6 w-6 text-primary" />
                                </div>
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              </motion.div>
                            ))}
                          </div>
                          <p className="text-center mt-4 text-sm text-muted-foreground">
                            Published to all platforms
                          </p>
            </motion.div>
                      )}
                    </AnimatePresence>
          </div>
        </div>

                {/* Time indicator */}
                <div className="absolute -bottom-6 left-1/2 -translate-x-1/2">
                  <Badge variant="secondary" className="px-3 py-1">
                    <Timer className="h-3 w-3 mr-1" />
                    Total time: Under 10 minutes
                  </Badge>
                  </div>
                  </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-20 sm:py-24 lg:py-32 bg-gradient-to-b from-muted/30 to-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <Badge variant="outline" className="mb-4">
              <Zap className="h-3 w-3 mr-1" />
              Powerful Features
            </Badge>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
              Everything You Need to Create Viral Content
            </h2>
            <p className="text-lg text-muted-foreground">
              Powered by cutting-edge AI from OpenAI, Google, and our proprietary models
            </p>
          </div>
          
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {/* AI Smart Clips */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
                viewport={{ once: true }}
                className="group"
              >
                <Card className="h-full border-primary/10 hover:border-primary/30 transition-all hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-1">
                  <CardHeader>
                    <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 text-primary group-hover:scale-110 transition-transform">
                    <Scissors className="h-6 w-6" />
                    </div>
                  <CardTitle className="text-xl">AI Smart Clips</CardTitle>
                  </CardHeader>
                <CardContent>
                  <CardDescription className="text-base mb-4">
                    Extract viral moments from long videos. Our AI identifies the best clips for maximum engagement.
                  </CardDescription>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Eye className="h-4 w-4 text-primary" />
                      <span>95% accuracy in viral detection</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <ThumbsUp className="h-4 w-4 text-primary" />
                      <span>10+ clips from 30min video</span>
                    </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

            {/* Perfect Transcriptions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              viewport={{ once: true }}
              className="group"
            >
              <Card className="h-full border-primary/10 hover:border-primary/30 transition-all hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-1">
                <CardHeader>
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 text-primary group-hover:scale-110 transition-transform">
                    <Mic className="h-6 w-6" />
          </div>
                  <CardTitle className="text-xl">Perfect Transcriptions</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base mb-4">
                    Powered by OpenAI Whisper for 99% accurate, timestamped transcriptions with speaker detection.
                  </CardDescription>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Globe className="h-4 w-4 text-primary" />
                      <span>50+ languages supported</span>
        </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="h-4 w-4 text-primary" />
                      <span>Multi-speaker detection</span>
          </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          
            {/* SEO Blog Posts */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
                  viewport={{ once: true }}
              className="group"
            >
              <Card className="h-full border-primary/10 hover:border-primary/30 transition-all hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-1">
                <CardHeader>
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 text-primary group-hover:scale-110 transition-transform">
                    <FileText className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-xl">SEO Blog Posts</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base mb-4">
                    Transform videos into comprehensive, SEO-optimized blog posts with one click.
                  </CardDescription>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <TrendingUp className="h-4 w-4 text-primary" />
                      <span>3x higher search rankings</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <FileText className="h-4 w-4 text-primary" />
                      <span>2000+ words generated</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Social Scheduler */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              viewport={{ once: true }}
              className="group"
            >
              <Card className="h-full border-primary/10 hover:border-primary/30 transition-all hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-1">
                <CardHeader>
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 text-primary group-hover:scale-110 transition-transform">
                    <Calendar className="h-6 w-6" />
                      </div>
                  <CardTitle className="text-xl">Social Scheduler</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base mb-4">
                    Schedule posts across all platforms. Optimize timing for maximum reach and engagement.
                  </CardDescription>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Share2 className="h-4 w-4 text-primary" />
                      <span>6+ platforms supported</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-primary" />
                      <span>Auto-optimized timing</span>
                  </div>
                  </div>
                </CardContent>
              </Card>
                </motion.div>

            {/* Content Intelligence */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              viewport={{ once: true }}
              className="group"
            >
              <Card className="h-full border-primary/10 hover:border-primary/30 transition-all hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-1">
                <CardHeader>
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 text-primary group-hover:scale-110 transition-transform">
                    <BarChart3 className="h-6 w-6" />
            </div>
                  <CardTitle className="text-xl">Content Intelligence</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base mb-4">
                    AI analyzes your content performance and suggests improvements for better engagement.
                  </CardDescription>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <TrendingUp className="h-4 w-4 text-primary" />
                      <span>2.5x engagement boost</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Bot className="h-4 w-4 text-primary" />
                      <span>Real-time insights</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Brand Templates */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              viewport={{ once: true }}
              className="group"
            >
              <Card className="h-full border-primary/10 hover:border-primary/30 transition-all hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-1">
                <CardHeader>
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 text-primary group-hover:scale-110 transition-transform">
                    <Layers className="h-6 w-6" />
              </div>
                  <CardTitle className="text-xl">Brand Templates</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base mb-4">
                    Maintain consistent branding across all content with customizable templates.
                  </CardDescription>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Wand2 className="h-4 w-4 text-primary" />
                      <span>One-click branding</span>
            </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-primary" />
                      <span>Save 4+ hours weekly</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing">
        <PricingSection
          tiers={pricingTiers}
          title={
            <span>
              Simple, <span className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">transparent</span> pricing
            </span>
          }
          subtitle="Start free, upgrade when you need more power"
          onSelectPlan={(tier) => {
            if (tier === "Studio") {
              window.location.href = "mailto:support@inflio.com?subject=Studio Plan Inquiry"
            } else {
              window.location.href = isSignedIn ? "/settings#upgrade" : "/sign-up"
            }
          }}
        />
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 sm:py-24 lg:py-32 bg-gradient-to-b from-muted/30 to-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <Badge variant="outline" className="mb-4">
              <Users className="h-3 w-3 mr-1" />
              Success Stories
            </Badge>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
              Creators Love Inflio
            </h2>
            <p className="text-lg text-muted-foreground">
              Join thousands of creators who've transformed their content workflow
            </p>
          </div>
          
          <div className="grid gap-8 md:grid-cols-3">
            {/* Testimonial 1 */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
                viewport={{ once: true }}
              >
                <Card className="h-full border-primary/10 hover:border-primary/30 transition-all">
                  <CardHeader>
                    <div className="flex items-center gap-4 mb-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-semibold">
                      SC
                      </div>
                      <div>
                      <h4 className="font-semibold">Sarah Chen</h4>
                      <p className="text-sm text-muted-foreground">YouTube Creator • 2.3M subscribers</p>
                      </div>
                    </div>
                    <div className="flex gap-1 mb-2">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                      ))}
                    </div>
                  </CardHeader>
                  <CardContent>
                  <p className="text-muted-foreground mb-4">
                    "Inflio cut my editing time from 8 hours to 30 minutes. The AI clips are spot-on - they actually go viral!"
                  </p>
                      <Badge variant="secondary" className="text-xs">
                        <TrendingUp className="h-3 w-3 mr-1" />
                    300% increase in shorts views
                      </Badge>
                  </CardContent>
                </Card>
              </motion.div>

            {/* Testimonial 2 */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              viewport={{ once: true }}
            >
              <Card className="h-full border-primary/10 hover:border-primary/30 transition-all">
                <CardHeader>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-semibold">
                      MJ
          </div>
                    <div>
                      <h4 className="font-semibold">Dr. Marcus Johnson</h4>
                      <p className="text-sm text-muted-foreground">EdTech Influencer • 500K followers</p>
        </div>
          </div>
                  <div className="flex gap-1 mb-2">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                    ))}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    "The transcription accuracy is incredible. It handles my technical content perfectly, even with jargon."
                  </p>
                  <Badge variant="secondary" className="text-xs">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    5x faster content production
                  </Badge>
                </CardContent>
              </Card>
            </motion.div>

            {/* Testimonial 3 */}
              <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
                viewport={{ once: true }}
            >
              <Card className="h-full border-primary/10 hover:border-primary/30 transition-all">
                <CardHeader>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-semibold">
                      ER
                  </div>
                    <div>
                      <h4 className="font-semibold">Emily Rodriguez</h4>
                      <p className="text-sm text-muted-foreground">Digital Marketing Expert</p>
                    </div>
                  </div>
                  <div className="flex gap-1 mb-2">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                    ))}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    "One long video becomes 20+ pieces of content. My engagement tripled in the first month!"
                  </p>
                  <Badge variant="secondary" className="text-xs">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    3x engagement rate
                  </Badge>
                  </CardContent>
                </Card>
              </motion.div>
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