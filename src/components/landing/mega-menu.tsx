"use client"

import * as React from "react"
import Link from "next/link"
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from "framer-motion"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Scissors,
  Mic,
  Captions,
  FileText,
  MessageSquare,
  Image,
  Bot,
  Palette,
  Eye,
  Globe,
  Calendar,
  BarChart3,
  ChevronDown,
  Menu,
  X,
  ArrowRight,
  Sparkles,
  Users,
  Building2,
  Mail,
  BookOpen,
  HelpCircle,
  FileCheck,
  Shield,
} from "lucide-react"
import { InflioLogo } from "@/components/inflio-logo"

interface MenuItem {
  title: string
  description: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

interface MenuCategory {
  title: string
  description: string
  items: MenuItem[]
}

const featureCategories: MenuCategory[] = [
  {
    title: "Video Processing",
    description: "Transform videos into content",
    items: [
      {
        title: "AI Clip Generation",
        description: "Extract viral moments automatically",
        href: "/features/clip-generation",
        icon: Scissors,
      },
      {
        title: "Transcription",
        description: "99% accurate, 50+ languages",
        href: "/features/transcription",
        icon: Mic,
      },
      {
        title: "Subtitle Creation",
        description: "Auto-generate and edit subtitles",
        href: "/features/subtitles",
        icon: Captions,
      },
    ],
  },
  {
    title: "Content Creation",
    description: "AI-powered content engine",
    items: [
      {
        title: "Blog Generator",
        description: "SEO-optimized articles in seconds",
        href: "/features/blog-generator",
        icon: FileText,
      },
      {
        title: "Social Posts",
        description: "Platform-optimized captions",
        href: "/features/social-posts",
        icon: MessageSquare,
      },
      {
        title: "Thumbnail Generator",
        description: "Eye-catching visuals with AI",
        href: "/features/thumbnails",
        icon: Image,
      },
    ],
  },
  {
    title: "AI Persona",
    description: "Your digital twin",
    items: [
      {
        title: "Avatar Training",
        description: "Train AI on your likeness",
        href: "/features/avatar-training",
        icon: Bot,
      },
      {
        title: "Brand Identity",
        description: "Colors, fonts, voice & style",
        href: "/features/brand-identity",
        icon: Palette,
      },
      {
        title: "Consistent Visuals",
        description: "Your face in every thumbnail",
        href: "/features/consistent-visuals",
        icon: Eye,
      },
    ],
  },
  {
    title: "Publishing",
    description: "Distribute everywhere",
    items: [
      {
        title: "Multi-Platform",
        description: "13 platforms, one click",
        href: "/features/multi-platform",
        icon: Globe,
      },
      {
        title: "Scheduler",
        description: "Plan your content calendar",
        href: "/features/scheduler",
        icon: Calendar,
      },
      {
        title: "Analytics",
        description: "Track performance across platforms",
        href: "/features/analytics",
        icon: BarChart3,
      },
    ],
  },
]

const companyLinks = [
  { title: "About Us", description: "Our story and mission", href: "/about", icon: Building2 },
  { title: "Blog", description: "Tips, updates, and insights", href: "/blog", icon: BookOpen },
  { title: "Careers", description: "Join our team", href: "/careers", icon: Users },
  { title: "Contact", description: "Get in touch", href: "/contact", icon: Mail },
]

const resourceLinks = [
  { title: "Help Center", description: "FAQs and support", href: "/support", icon: HelpCircle },
  { title: "Terms of Service", description: "Legal terms", href: "/terms", icon: FileCheck },
  { title: "Privacy Policy", description: "How we protect your data", href: "/privacy", icon: Shield },
]

interface MegaMenuProps {
  isSignedIn?: boolean
}

export function MegaMenu({ isSignedIn }: MegaMenuProps) {
  const [activeMenu, setActiveMenu] = React.useState<string | null>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false)
  const [scrolled, setScrolled] = React.useState(false)
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null)
  const navRef = React.useRef<HTMLElement>(null)
  
  const { scrollY } = useScroll()
  
  useMotionValueEvent(scrollY, "change", (latest) => {
    setScrolled(latest > 20)
  })

  const handleMouseEnter = (menu: string) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    setActiveMenu(menu)
  }

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setActiveMenu(null)
    }, 150)
  }

  // Close menu when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setActiveMenu(null)
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <>
      <motion.nav
        ref={navRef}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className={cn(
          "fixed top-0 z-50 w-full transition-all duration-300",
          scrolled
            ? "bg-black/95 backdrop-blur-xl border-b border-white/10"
            : "bg-gradient-to-b from-black/50 to-transparent"
        )}
      >
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex h-18 items-center justify-between">
            {/* Logo */}
            <Link href="/" className="relative z-10">
              <motion.div
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                <InflioLogo size="sm" variant="dark" />
              </motion.div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex lg:items-center lg:gap-0.5">
              {/* Features Dropdown */}
              <div
                className="relative"
                onMouseEnter={() => handleMouseEnter("features")}
                onMouseLeave={handleMouseLeave}
              >
                <button
                  className={cn(
                    "flex items-center gap-1 px-3.5 py-2 text-sm font-medium transition-all duration-200 rounded-lg",
                    activeMenu === "features"
                      ? "text-white bg-white/10"
                      : "text-white/70 hover:text-white hover:bg-white/5"
                  )}
                >
                  Features
                  <ChevronDown className={cn(
                    "h-3.5 w-3.5 transition-transform duration-200",
                    activeMenu === "features" && "rotate-180"
                  )} />
                </button>
              </div>

              {/* Company Dropdown */}
              <div
                className="relative"
                onMouseEnter={() => handleMouseEnter("company")}
                onMouseLeave={handleMouseLeave}
              >
                <button
                  className={cn(
                    "flex items-center gap-1 px-3.5 py-2 text-sm font-medium transition-all duration-200 rounded-lg",
                    activeMenu === "company"
                      ? "text-white bg-white/10"
                      : "text-white/70 hover:text-white hover:bg-white/5"
                  )}
                >
                  Company
                  <ChevronDown className={cn(
                    "h-3.5 w-3.5 transition-transform duration-200",
                    activeMenu === "company" && "rotate-180"
                  )} />
                </button>
                
                {/* Company Dropdown Menu - positioned relative to button */}
                <AnimatePresence>
                  {activeMenu === "company" && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      transition={{ duration: 0.15, ease: "easeOut" }}
                      className="absolute left-0 top-full pt-2 z-50"
                    >
                      <div className="w-64 rounded-xl border border-white/10 bg-[#0c0c0c]/98 backdrop-blur-xl shadow-2xl overflow-hidden">
                        <div className="p-2">
                          {companyLinks.map((link) => (
                            <Link
                              key={link.title}
                              href={link.href}
                              onClick={() => setActiveMenu(null)}
                              className="group flex items-center gap-3 p-2.5 rounded-lg hover:bg-white/5 transition-colors"
                            >
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-white/5 text-primary group-hover:bg-primary/10 transition-colors">
                                <link.icon className="h-4 w-4" />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-white/90 group-hover:text-white transition-colors">
                                  {link.title}
                                </p>
                                <p className="text-xs text-white/40">{link.description}</p>
                              </div>
                            </Link>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Resources Dropdown */}
              <div
                className="relative"
                onMouseEnter={() => handleMouseEnter("resources")}
                onMouseLeave={handleMouseLeave}
              >
                <button
                  className={cn(
                    "flex items-center gap-1 px-3.5 py-2 text-sm font-medium transition-all duration-200 rounded-lg",
                    activeMenu === "resources"
                      ? "text-white bg-white/10"
                      : "text-white/70 hover:text-white hover:bg-white/5"
                  )}
                >
                  Resources
                  <ChevronDown className={cn(
                    "h-3.5 w-3.5 transition-transform duration-200",
                    activeMenu === "resources" && "rotate-180"
                  )} />
                </button>
                
                {/* Resources Dropdown Menu - positioned relative to button */}
                <AnimatePresence>
                  {activeMenu === "resources" && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      transition={{ duration: 0.15, ease: "easeOut" }}
                      className="absolute left-0 top-full pt-2 z-50"
                    >
                      <div className="w-64 rounded-xl border border-white/10 bg-[#0c0c0c]/98 backdrop-blur-xl shadow-2xl overflow-hidden">
                        <div className="p-2">
                          {resourceLinks.map((link) => (
                            <Link
                              key={link.title}
                              href={link.href}
                              onClick={() => setActiveMenu(null)}
                              className="group flex items-center gap-3 p-2.5 rounded-lg hover:bg-white/5 transition-colors"
                            >
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-white/5 text-primary group-hover:bg-primary/10 transition-colors">
                                <link.icon className="h-4 w-4" />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-white/90 group-hover:text-white transition-colors">
                                  {link.title}
                                </p>
                                <p className="text-xs text-white/40">{link.description}</p>
                              </div>
                            </Link>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <Link
                href="/#pricing"
                className="px-3.5 py-2 text-sm font-medium text-white/70 hover:text-white hover:bg-white/5 rounded-lg transition-all duration-200"
              >
                Pricing
              </Link>
            </div>

            {/* Desktop Auth */}
            <div className="hidden lg:flex lg:items-center lg:gap-2">
              {isSignedIn ? (
                <Link href="/dashboard">
                  <Button size="sm" className="gap-1.5 bg-white text-black hover:bg-white/90 font-medium h-9">
                    Dashboard
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              ) : (
                <>
                  <Link href="/sign-in">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-white/80 hover:text-white hover:bg-white/10 font-medium h-9"
                    >
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/sign-up">
                    <Button size="sm" className="gap-1.5 bg-white text-black hover:bg-white/90 font-medium h-9 px-4">
                      <Sparkles className="h-3.5 w-3.5" />
                      Get Started
                    </Button>
                  </Link>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              className="lg:hidden p-2 rounded-lg hover:bg-white/10 transition-colors text-white"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Features Mega Menu Dropdown - Full Width */}
        <AnimatePresence>
          {activeMenu === "features" && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="absolute left-0 right-0 top-full pt-2"
              onMouseEnter={() => handleMouseEnter("features")}
              onMouseLeave={handleMouseLeave}
            >
              <div className="mx-auto max-w-7xl px-6 lg:px-8">
                <div className="rounded-xl border border-white/10 bg-[#0c0c0c]/98 backdrop-blur-xl shadow-2xl overflow-hidden">
                  <div className="grid grid-cols-4 divide-x divide-white/5">
                    {featureCategories.map((category) => (
                      <div key={category.title} className="p-5">
                        <h3 className="font-medium text-white text-sm mb-0.5">{category.title}</h3>
                        <p className="text-xs text-white/40 mb-4">{category.description}</p>
                        <ul className="space-y-0.5">
                          {category.items.map((item) => (
                            <li key={item.title}>
                              <Link
                                href={item.href}
                                onClick={() => setActiveMenu(null)}
                                className="group flex items-start gap-2.5 p-2 -mx-2 rounded-lg hover:bg-white/5 transition-colors"
                              >
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white/5 text-primary group-hover:bg-primary/10 transition-colors">
                                  <item.icon className="h-4 w-4" />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-sm font-medium text-white/90 group-hover:text-white transition-colors truncate">
                                    {item.title}
                                  </p>
                                  <p className="text-xs text-white/40 truncate">
                                    {item.description}
                                  </p>
                                </div>
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-white/5 px-5 py-3.5 flex items-center justify-between bg-white/[0.02]">
                    <div>
                      <p className="text-sm font-medium text-white">Ready to transform your content?</p>
                      <p className="text-xs text-white/40">14-day money-back guarantee</p>
                    </div>
                    <Link href={isSignedIn ? "/dashboard" : "/sign-up"}>
                      <Button size="sm" className="gap-1.5 bg-white text-black hover:bg-white/90 h-8">
                        <Sparkles className="h-3.5 w-3.5" />
                        Get Started
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 lg:hidden"
          >
            <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
              className="absolute right-0 top-0 bottom-0 w-full max-w-xs bg-[#0a0a0a] border-l border-white/10 overflow-y-auto"
            >
              <div className="p-5">
                {/* Mobile Header */}
                <div className="flex items-center justify-between mb-6">
                  <Link href="/" onClick={() => setMobileMenuOpen(false)}>
                    <InflioLogo size="sm" variant="dark" />
                  </Link>
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-1.5 rounded-lg hover:bg-white/10 text-white/60"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Mobile Nav Links */}
                <div className="space-y-5">
                  {/* Features */}
                  <div>
                    <h3 className="text-[11px] font-medium text-white/30 uppercase tracking-wider mb-2 px-2">Features</h3>
                    <div className="space-y-0.5">
                      {featureCategories.flatMap((cat) => cat.items).slice(0, 6).map((item) => (
                        <Link
                          key={item.title}
                          href={item.href}
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center gap-2.5 px-2 py-2 rounded-lg text-white/70 hover:text-white hover:bg-white/5 transition-colors"
                        >
                          <item.icon className="h-4 w-4 text-primary/80" />
                          <span className="text-sm">{item.title}</span>
                        </Link>
                      ))}
                    </div>
                  </div>

                  {/* Company */}
                  <div>
                    <h3 className="text-[11px] font-medium text-white/30 uppercase tracking-wider mb-2 px-2">Company</h3>
                    <div className="space-y-0.5">
                      {companyLinks.map((link) => (
                        <Link
                          key={link.title}
                          href={link.href}
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center gap-2.5 px-2 py-2 rounded-lg text-white/70 hover:text-white hover:bg-white/5 transition-colors"
                        >
                          <link.icon className="h-4 w-4 text-primary/80" />
                          <span className="text-sm">{link.title}</span>
                        </Link>
                      ))}
                    </div>
                  </div>

                  {/* Resources */}
                  <div>
                    <h3 className="text-[11px] font-medium text-white/30 uppercase tracking-wider mb-2 px-2">Resources</h3>
                    <div className="space-y-0.5">
                      {resourceLinks.map((link) => (
                        <Link
                          key={link.title}
                          href={link.href}
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center gap-2.5 px-2 py-2 rounded-lg text-white/70 hover:text-white hover:bg-white/5 transition-colors"
                        >
                          <link.icon className="h-4 w-4 text-primary/80" />
                          <span className="text-sm">{link.title}</span>
                        </Link>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-white/10">
                    <Link href="/#pricing" onClick={() => setMobileMenuOpen(false)} className="block mb-2">
                      <Button variant="outline" size="sm" className="w-full border-white/10 text-white hover:bg-white/5 h-9">
                        View Pricing
                      </Button>
                    </Link>
                  </div>

                  {/* Mobile Auth */}
                  <div className="space-y-2">
                    {isSignedIn ? (
                      <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)} className="block">
                        <Button size="sm" className="w-full bg-white text-black hover:bg-white/90 h-9">
                          Go to Dashboard
                        </Button>
                      </Link>
                    ) : (
                      <>
                        <Link href="/sign-in" onClick={() => setMobileMenuOpen(false)} className="block">
                          <Button variant="outline" size="sm" className="w-full border-white/10 text-white hover:bg-white/5 h-9">
                            Sign In
                          </Button>
                        </Link>
                        <Link href="/sign-up" onClick={() => setMobileMenuOpen(false)} className="block">
                          <Button size="sm" className="w-full bg-white text-black hover:bg-white/90 h-9 gap-1.5">
                            <Sparkles className="h-3.5 w-3.5" />
                            Get Started
                          </Button>
                        </Link>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
