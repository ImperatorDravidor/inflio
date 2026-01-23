"use client"

import { useUser } from "@clerk/nextjs"
import Link from "next/link"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import {
  MegaMenu,
  HeroSection,
  FinalCTA,
} from "@/components/landing"
import { InflioLogo } from "@/components/inflio-logo"
import {
  Sparkles,
  Zap,
  Crown,
  ArrowRight,
  Check,
  X,
  Upload,
  Wand2,
  Eye,
  Send,
  Scissors,
  Mic,
  FileText,
  MessageSquare,
  Image,
  Bot,
  Globe,
  ChevronDown,
  Clock,
  Video,
  TrendingUp,
  Calculator,
} from "lucide-react"
import {
  IconBrandYoutube,
  IconBrandInstagram,
  IconBrandTiktok,
  IconBrandX,
  IconBrandLinkedin,
  IconBrandFacebook,
  IconBrandMedium,
  IconBrandTwitch,
} from "@tabler/icons-react"
import { useState, useRef, useEffect } from "react"
import { useInView } from "framer-motion"
import { Slider } from "@/components/ui/slider"

// ============================================================================
// LOGOS SECTION - Social Proof
// ============================================================================
function LogosSection() {
  return (
    <section className="py-16 border-b border-white/5">
      <div className="mx-auto max-w-5xl px-6 lg:px-8">
        <p className="text-center text-sm text-white/30 mb-8">
          Trusted by creators and teams at
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6 text-white/20">
          {["Spotify", "Notion", "Linear", "Vercel", "Stripe", "Figma"].map((name) => (
            <span key={name} className="text-lg font-semibold tracking-tight">
              {name}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}

// ============================================================================
// PROBLEM/SOLUTION SECTION - The Core Value Prop
// ============================================================================
function ProblemSolutionSection() {
  const comparison = [
    { task: "Find viral moments", manual: "2 hours", auto: "5 min" },
    { task: "Edit clips", manual: "3 hours", auto: "Auto" },
    { task: "Write blog post", manual: "2 hours", auto: "15 min" },
    { task: "Create social posts", manual: "1 hour", auto: "Auto" },
    { task: "Design thumbnails", manual: "45 min", auto: "3 min" },
    { task: "Post everywhere", manual: "30 min", auto: "1 click" },
  ]

  return (
    <section className="py-24 lg:py-32">
      <div className="mx-auto max-w-6xl px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
            Content repurposing is{" "}
            <span className="text-red-400">broken</span>
          </h2>
          <p className="text-lg text-white/50 max-w-2xl mx-auto">
            You spend more time reformatting than creating. 
            Inflio fixes that.
          </p>
        </motion.div>

        {/* Comparison Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto"
        >
          <div className="rounded-2xl border border-white/10 overflow-hidden">
            {/* Header */}
            <div className="grid grid-cols-3 gap-4 px-6 py-4 bg-white/5 border-b border-white/10">
              <div className="text-sm font-medium text-white/50">Task</div>
              <div className="text-sm font-medium text-center text-red-400/80">Manual</div>
              <div className="text-sm font-medium text-center text-green-400">With Inflio</div>
            </div>

            {/* Rows */}
            {comparison.map((row, i) => (
              <div
                key={row.task}
                className="grid grid-cols-3 gap-4 px-6 py-4 border-b border-white/5 last:border-0"
              >
                <div className="text-sm text-white/70">{row.task}</div>
                <div className="text-sm text-center text-red-400/60">{row.manual}</div>
                <div className="text-sm text-center text-green-400 font-medium">{row.auto}</div>
              </div>
            ))}

            {/* Total */}
            <div className="grid grid-cols-3 gap-4 px-6 py-5 bg-white/[0.03]">
              <div className="text-sm font-semibold text-white">Total per video</div>
              <div className="text-center">
                <span className="text-lg font-bold text-red-400">9+ hours</span>
              </div>
              <div className="text-center">
                <span className="text-lg font-bold text-green-400">~30 min</span>
              </div>
            </div>
          </div>

          {/* Bottom stat */}
          <p className="text-center text-white/40 text-sm mt-6">
            That's <span className="text-primary font-semibold">98% less time</span> spent on repurposing.
          </p>
        </motion.div>
      </div>
    </section>
  )
}

// ============================================================================
// HOW IT WORKS SECTION
// ============================================================================
function HowItWorksSection() {
  const steps = [
    { icon: Upload, title: "Upload", desc: "Drop your video or paste a link" },
    { icon: Wand2, title: "Process", desc: "AI generates all your content" },
    { icon: Eye, title: "Review", desc: "Preview and edit if needed" },
    { icon: Send, title: "Publish", desc: "Schedule or post everywhere" },
  ]

  return (
    <section className="py-24 lg:py-32 bg-white/[0.02]">
      <div className="mx-auto max-w-5xl px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
            Four steps. Ten minutes.
          </h2>
          <p className="text-lg text-white/50">
            From raw video to published content across every platform.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, i) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              viewport={{ once: true }}
              className="relative text-center p-6"
            >
              {/* Connector */}
              {i < steps.length - 1 && (
                <div className="hidden lg:block absolute top-1/3 left-full w-full h-px bg-gradient-to-r from-white/10 to-transparent -translate-x-6" />
              )}

              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5 border border-white/10 mx-auto mb-5">
                <step.icon className="h-7 w-7 text-primary" />
              </div>
              <p className="text-xs text-primary font-medium mb-2">0{i + 1}</p>
              <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
              <p className="text-sm text-white/50">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ============================================================================
// FEATURES SECTION
// ============================================================================
function FeaturesSection() {
  const features = [
    { icon: Scissors, title: "Clip Generation", desc: "AI finds viral moments and creates clips automatically" },
    { icon: Mic, title: "Transcription", desc: "99% accurate, 50+ languages, speaker detection" },
    { icon: FileText, title: "Blog Posts", desc: "SEO-optimized articles generated from your video" },
    { icon: MessageSquare, title: "Social Posts", desc: "Platform-optimized captions with hashtags" },
    { icon: Image, title: "Thumbnails", desc: "Eye-catching visuals that drive clicks" },
    { icon: Bot, title: "AI Persona", desc: "Your face in every thumbnail, consistently" },
  ]

  return (
    <section id="features" className="py-24 lg:py-32">
      <div className="mx-auto max-w-6xl px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
            Everything you need
          </h2>
          <p className="text-lg text-white/50 max-w-2xl mx-auto">
            One platform replaces your entire content repurposing workflow.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              viewport={{ once: true }}
              className="group p-6 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/10 transition-all"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary mb-4 group-hover:bg-primary/20 transition-colors">
                <feature.icon className="h-5 w-5" />
              </div>
              <h3 className="font-semibold mb-2">{feature.title}</h3>
              <p className="text-sm text-white/50">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ============================================================================
// PLATFORMS SECTION
// ============================================================================
function PlatformsSection() {
  const platforms = [
    { name: "YouTube", icon: IconBrandYoutube, types: "Long-form, Shorts" },
    { name: "TikTok", icon: IconBrandTiktok, types: "Videos" },
    { name: "Instagram", icon: IconBrandInstagram, types: "Reels, Feed, Stories" },
    { name: "LinkedIn", icon: IconBrandLinkedin, types: "Posts, Articles" },
    { name: "X", icon: IconBrandX, types: "Posts, Threads" },
    { name: "Facebook", icon: IconBrandFacebook, types: "Reels, Posts" },
    { name: "Medium", icon: IconBrandMedium, types: "Articles" },
    { name: "Twitch", icon: IconBrandTwitch, types: "Clips" },
  ]

  return (
    <section id="social-ecosystem" className="py-24 lg:py-32 bg-white/[0.02]">
      <div className="mx-auto max-w-5xl px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
            One upload. 13 platforms.
          </h2>
          <p className="text-lg text-white/50 max-w-xl mx-auto">
            Content optimized for each destination. The right format, length, and style — automatically.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {platforms.map((platform, i) => (
            <motion.div
              key={platform.name}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: i * 0.03 }}
              viewport={{ once: true }}
              className="group p-5 rounded-xl border border-white/5 bg-white/[0.02] hover:border-white/10 transition-all text-center"
            >
              <platform.icon className="h-7 w-7 mx-auto mb-3 text-white/50 group-hover:text-white transition-colors" />
              <p className="font-medium text-sm mb-1">{platform.name}</p>
              <p className="text-xs text-white/40">{platform.types}</p>
            </motion.div>
          ))}
        </div>

        <p className="text-center text-sm text-white/30 mt-8">
          + 5 more platforms including Vimeo, Twitch, Substack, WordPress, Pinterest
        </p>
      </div>
    </section>
  )
}

// ============================================================================
// PRICING SECTION
// ============================================================================
function PricingSection({ isSignedIn }: { isSignedIn?: boolean }) {
  const tiers = [
    {
      name: "Starter",
      price: "$19",
      period: "/mo",
      desc: "For individual creators",
      features: ["25 videos/month", "30 min max", "5 clips/video", "3 platforms", "Email support"],
      cta: "Get Started",
      popular: false,
    },
    {
      name: "Creator",
      price: "$49",
      period: "/mo",
      desc: "For serious creators",
      features: ["100 videos/month", "2 hour max", "15 clips/video", "All 13 platforms", "AI Persona", "Priority support"],
      cta: "Get Started",
      popular: true,
    },
    {
      name: "Studio",
      price: "$149",
      period: "/mo",
      desc: "For teams at scale",
      features: ["Unlimited videos", "No limits", "Unlimited clips", "All platforms", "Multiple Personas", "API access", "24/7 support"],
      cta: "Contact Sales",
      popular: false,
    },
  ]

  return (
    <section id="pricing" className="py-24 lg:py-32">
      <div className="mx-auto max-w-5xl px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
            Simple pricing
          </h2>
          <p className="text-lg text-white/50">
            Plans for every creator.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {tiers.map((tier, i) => (
            <motion.div
              key={tier.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              viewport={{ once: true }}
              className={`relative p-6 rounded-2xl border ${
                tier.popular
                  ? "border-primary/50 bg-primary/5"
                  : "border-white/10 bg-white/[0.02]"
              }`}
            >
              {tier.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-primary text-xs font-medium text-white">
                  Most Popular
                </div>
              )}

              <div className="mb-6">
                <h3 className="font-semibold text-lg mb-1">{tier.name}</h3>
                <p className="text-sm text-white/50 mb-4">{tier.desc}</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold">{tier.price}</span>
                  <span className="text-white/50">{tier.period}</span>
                </div>
              </div>

              <ul className="space-y-3 mb-6">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-primary shrink-0" />
                    <span className="text-white/70">{feature}</span>
                  </li>
                ))}
              </ul>

              <Link
                href={tier.name === "Studio" ? "mailto:sales@inflio.com" : isSignedIn ? "/dashboard" : "/sign-up"}
              >
                <Button
                  className={`w-full ${
                    tier.popular
                      ? "bg-white text-black hover:bg-white/90"
                      : "bg-white/10 hover:bg-white/20"
                  }`}
                >
                  {tier.cta}
                </Button>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ============================================================================
// FAQ SECTION
// ============================================================================
function FAQSection() {
  const [open, setOpen] = useState<number | null>(null)
  const faqs = [
    { q: "How long does processing take?", a: "Most videos are fully processed in 20-30 minutes, depending on length. You'll get transcription, clips, blog posts, social captions, and thumbnails all at once." },
    { q: "What video formats work?", a: "We support MP4, MOV, AVI, MKV, and WebM up to 2GB. You can also paste a YouTube URL directly." },
    { q: "How accurate is transcription?", a: "We use OpenAI's Whisper model — 99% accuracy in English, 50+ languages supported, with speaker detection." },
    { q: "How does AI Persona work?", a: "Upload 5-10 photos of yourself and we train a model on your likeness. Then generate thumbnails featuring 'you' in any scenario." },
    { q: "Can I try before committing?", a: "Yes. We offer a 14-day money-back guarantee on all plans. If it's not for you, just email us for a full refund." },
    { q: "Can I cancel anytime?", a: "Yes, no contracts. Cancel from your dashboard anytime. We also offer a 30-day money-back guarantee." },
  ]

  return (
    <section id="faq" className="py-24 lg:py-32 bg-white/[0.02]">
      <div className="mx-auto max-w-2xl px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            Questions
          </h2>
        </motion.div>

        <div className="space-y-2">
          {faqs.map((faq, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
              viewport={{ once: true }}
            >
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full text-left px-5 py-4 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
              >
                <div className="flex justify-between items-center gap-4">
                  <span className="font-medium">{faq.q}</span>
                  <ChevronDown className={`h-4 w-4 text-white/40 shrink-0 transition-transform ${open === i ? "rotate-180" : ""}`} />
                </div>
                {open === i && (
                  <p className="mt-3 text-sm text-white/50 pr-8">{faq.a}</p>
                )}
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ============================================================================
// FOOTER
// ============================================================================
function Footer() {
  const links = {
    product: [
      { label: "Features", href: "/#features" },
      { label: "Pricing", href: "/#pricing" },
      { label: "Platforms", href: "/#social-ecosystem" },
    ],
    company: [
      { label: "About", href: "/about" },
      { label: "Blog", href: "/blog" },
      { label: "Contact", href: "/contact" },
    ],
    legal: [
      { label: "Terms", href: "/terms" },
      { label: "Privacy", href: "/privacy" },
    ],
  }

  return (
    <footer className="border-t border-white/5 py-12">
      <div className="mx-auto max-w-6xl px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          {/* Brand */}
          <div className="col-span-2">
            <Link href="/" className="mb-4 inline-block">
              <InflioLogo size="sm" variant="dark" />
            </Link>
            <p className="text-sm text-white/40 max-w-xs">
              Transform video into multi-platform content with AI.
            </p>
          </div>

          <div>
            <h4 className="font-medium text-sm mb-3">Product</h4>
            <ul className="space-y-2">
              {links.product.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-white/40 hover:text-white/70 transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-medium text-sm mb-3">Company</h4>
            <ul className="space-y-2">
              {links.company.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-white/40 hover:text-white/70 transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-medium text-sm mb-3">Legal</h4>
            <ul className="space-y-2">
              {links.legal.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-white/40 hover:text-white/70 transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-white/30">© {new Date().getFullYear()} Inflio, Inc.</p>
          <div className="flex gap-4">
            {[IconBrandX, IconBrandLinkedin, IconBrandYoutube].map((Icon, i) => (
              <a key={i} href="#" className="text-white/30 hover:text-white/60 transition-colors">
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}

// ============================================================================
// MAIN PAGE
// ============================================================================
export default function LandingPage() {
  const { isSignedIn } = useUser()

  return (
    <div className="min-h-screen bg-[#09090b] text-white">
      <MegaMenu isSignedIn={isSignedIn} />
      <HeroSection isSignedIn={isSignedIn} />
      <LogosSection />
      <ProblemSolutionSection />
      <section id="how-it-works">
        <HowItWorksSection />
      </section>
      <FeaturesSection />
      <PlatformsSection />
      <PricingSection isSignedIn={isSignedIn} />
      <FAQSection />
      <FinalCTA isSignedIn={isSignedIn} />
      <Footer />
    </div>
  )
}
