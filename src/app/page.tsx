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
  ArrowRight,
  Check,
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
import { useState } from "react"

// ============================================================================
// PROBLEM/SOLUTION SECTION
// ============================================================================
function ProblemSolutionSection() {
  const comparison = [
    { task: "Find viral moments", manual: "2 hours", auto: "5 min" },
    { task: "Edit clips", manual: "3 hours", auto: "Automatic" },
    { task: "Write blog post", manual: "2 hours", auto: "15 min" },
    { task: "Create social posts", manual: "1 hour", auto: "Automatic" },
    { task: "Design thumbnails", manual: "45 min", auto: "3 min" },
    { task: "Post everywhere", manual: "30 min", auto: "1 click" },
  ]

  return (
    <section className="relative py-28 lg:py-36">
      <div className="mx-auto max-w-6xl px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <p className="text-sm font-medium text-primary/80 tracking-wide uppercase mb-4">
            The Problem
          </p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-5">
            Content repurposing is{" "}
            <span className="text-red-400/90">broken</span>
          </h2>
          <p className="text-lg text-white/40 max-w-2xl mx-auto leading-relaxed">
            You spend more time reformatting than creating.
            Here&apos;s what a single video costs you.
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
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
            {/* Header */}
            <div className="grid grid-cols-3 gap-4 px-6 py-4 bg-white/[0.03] border-b border-white/[0.06]">
              <div className="text-sm font-medium text-white/40">Task</div>
              <div className="text-sm font-medium text-center text-red-400/70">Manual</div>
              <div className="text-sm font-medium text-center text-emerald-400/80">With Inflio</div>
            </div>

            {/* Rows */}
            {comparison.map((row) => (
              <div
                key={row.task}
                className="grid grid-cols-3 gap-4 px-6 py-4 border-b border-white/[0.04] last:border-0"
              >
                <div className="text-sm text-white/60">{row.task}</div>
                <div className="text-sm text-center text-red-400/50">{row.manual}</div>
                <div className="text-sm text-center text-emerald-400 font-medium">{row.auto}</div>
              </div>
            ))}

            {/* Total */}
            <div className="grid grid-cols-3 gap-4 px-6 py-5 bg-white/[0.02] border-t border-white/[0.06]">
              <div className="text-sm font-semibold text-white">Total per video</div>
              <div className="text-center">
                <span className="text-lg font-bold text-red-400/80">9+ hours</span>
              </div>
              <div className="text-center">
                <span className="text-lg font-bold text-emerald-400">~30 min</span>
              </div>
            </div>
          </div>

          <p className="text-center text-white/30 text-sm mt-6">
            That&apos;s <span className="text-primary font-semibold">18x faster</span> content production.
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
    { icon: Upload, title: "Upload", desc: "Drop your video or paste a YouTube link. Any format, up to 2GB.", color: "from-blue-500/20 to-blue-500/5" },
    { icon: Wand2, title: "Process", desc: "AI transcribes, analyzes, and generates all content types simultaneously.", color: "from-purple-500/20 to-purple-500/5" },
    { icon: Eye, title: "Review", desc: "Preview every piece. Edit text, swap thumbnails, adjust tone — you're in control.", color: "from-amber-500/20 to-amber-500/5" },
    { icon: Send, title: "Publish", desc: "Push to all platforms at once, or schedule for the perfect time.", color: "from-emerald-500/20 to-emerald-500/5" },
  ]

  return (
    <section className="relative py-28 lg:py-36">
      {/* Subtle background accent */}
      <div className="absolute inset-0 bg-white/[0.01]" />
      
      <div className="relative mx-auto max-w-6xl px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <p className="text-sm font-medium text-primary/80 tracking-wide uppercase mb-4">
            How It Works
          </p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-5">
            Four steps. Ten minutes.
          </h2>
          <p className="text-lg text-white/40 max-w-lg mx-auto">
            From raw video to published content across every platform.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {steps.map((step, i) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              viewport={{ once: true }}
              className="group relative"
            >
              <div className="relative p-6 rounded-2xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.1] transition-all duration-300 h-full">
                {/* Step number */}
                <div className="text-[80px] font-bold text-white/[0.03] absolute top-2 right-4 leading-none select-none">
                  {i + 1}
                </div>

                <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-b ${step.color} border border-white/[0.06] mb-5`}>
                  <step.icon className="h-5 w-5 text-white/80" />
                </div>

                <h3 className="text-lg font-semibold mb-2 text-white/90">{step.title}</h3>
                <p className="text-sm text-white/40 leading-relaxed">{step.desc}</p>
              </div>
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
    {
      icon: Scissors,
      title: "AI Clip Generation",
      desc: "Automatically finds the most engaging moments in your video and creates clips optimized for short-form platforms.",
      gradient: "from-violet-500/15 to-violet-500/5",
    },
    {
      icon: Mic,
      title: "Transcription",
      desc: "99% accurate transcription in 50+ languages with automatic speaker detection and timestamps.",
      gradient: "from-sky-500/15 to-sky-500/5",
    },
    {
      icon: FileText,
      title: "Blog Posts",
      desc: "SEO-optimized articles generated from your video content, ready to publish to your blog or Medium.",
      gradient: "from-emerald-500/15 to-emerald-500/5",
    },
    {
      icon: MessageSquare,
      title: "Social Captions",
      desc: "Platform-optimized posts with relevant hashtags, tailored for each social network's audience.",
      gradient: "from-orange-500/15 to-orange-500/5",
    },
    {
      icon: Image,
      title: "Thumbnails",
      desc: "Eye-catching AI-generated thumbnails that drive clicks, featuring your brand style and colors.",
      gradient: "from-pink-500/15 to-pink-500/5",
    },
    {
      icon: Bot,
      title: "AI Persona",
      desc: "Train AI on your likeness and generate thumbnails featuring you in any scenario, consistently.",
      gradient: "from-indigo-500/15 to-indigo-500/5",
    },
  ]

  return (
    <section id="features" className="relative py-28 lg:py-36">
      <div className="mx-auto max-w-6xl px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <p className="text-sm font-medium text-primary/80 tracking-wide uppercase mb-4">
            Features
          </p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-5">
            Everything you need,{" "}
            <span className="bg-gradient-to-r from-[#a78bfa] to-[#c084fc] bg-clip-text text-transparent">
              nothing you don&apos;t
            </span>
          </h2>
          <p className="text-lg text-white/40 max-w-2xl mx-auto leading-relaxed">
            One platform replaces your entire content repurposing workflow. No more juggling tools.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.06 }}
              viewport={{ once: true }}
              className="group"
            >
              <div className="p-6 rounded-2xl border border-white/[0.06] bg-white/[0.015] hover:bg-white/[0.04] hover:border-white/[0.1] transition-all duration-300 h-full">
                <div className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-b ${feature.gradient} border border-white/[0.06] mb-5 group-hover:scale-105 transition-transform duration-300`}>
                  <feature.icon className="h-5 w-5 text-white/80" />
                </div>
                <h3 className="font-semibold text-white/90 mb-2">{feature.title}</h3>
                <p className="text-sm text-white/40 leading-relaxed">{feature.desc}</p>
              </div>
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
    <section id="social-ecosystem" className="relative py-28 lg:py-36">
      <div className="absolute inset-0 bg-white/[0.01]" />

      <div className="relative mx-auto max-w-5xl px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <p className="text-sm font-medium text-primary/80 tracking-wide uppercase mb-4">
            Platforms
          </p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-5">
            One upload. Every platform.
          </h2>
          <p className="text-lg text-white/40 max-w-xl mx-auto leading-relaxed">
            Content optimized for each destination — the right format, length, and style, automatically.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {platforms.map((platform, i) => (
            <motion.div
              key={platform.name}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: i * 0.04 }}
              viewport={{ once: true }}
              className="group"
            >
              <div className="p-5 rounded-xl border border-white/[0.06] bg-white/[0.015] hover:border-white/[0.1] hover:bg-white/[0.04] transition-all duration-300 text-center">
                <platform.icon className="h-7 w-7 mx-auto mb-3 text-white/40 group-hover:text-white/70 transition-colors duration-300" />
                <p className="font-medium text-sm mb-1 text-white/80">{platform.name}</p>
                <p className="text-xs text-white/30">{platform.types}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <p className="text-center text-sm text-white/20 mt-8">
          + more platforms including Vimeo, Substack, WordPress, and Pinterest
        </p>
      </div>
    </section>
  )
}

// ============================================================================
// PRICING SECTION
// ============================================================================
function PricingSection({ isSignedIn }: { isSignedIn?: boolean }) {
  const [annual, setAnnual] = useState(false)

  const tiers = [
    {
      name: "Creator",
      monthlyPrice: 79,
      yearlyPrice: 63,
      desc: "For individual creators ready to 10x their content output.",
      features: [
        "30 videos per month",
        "Up to 2 hours per video",
        "AI transcription in 50+ languages",
        "10 AI clips per video with virality scoring",
        "SEO-optimized blog post generation",
        "Social captions for 6 platforms",
        "3 AI thumbnail concepts per video",
        "1 AI persona with 10 reference portraits",
        "Full brand customization suite",
        "Scheduled publishing & content calendar",
        "Email support",
      ],
      cta: "Start Creating",
      popular: false,
    },
    {
      name: "Pro",
      monthlyPrice: 199,
      yearlyPrice: 159,
      desc: "For professional creators and teams publishing at scale.",
      features: [
        "Everything in Creator, plus:",
        "100 videos per month (up to 3 hrs each)",
        "20 AI clips per video with deep analysis",
        "Unlimited AI thumbnail iterations",
        "All 13+ platforms supported",
        "Carousels, quote cards & thread generation",
        "Advanced content analysis & insights",
        "Full analytics dashboard",
        "5 AI personas with brand voice learning",
        "One-click multi-platform publishing",
        "Priority support & live chat",
      ],
      cta: "Start Free Trial",
      popular: true,
    },
    {
      name: "Enterprise",
      monthlyPrice: null,
      yearlyPrice: null,
      desc: "For agencies and organizations operating at any scale.",
      features: [
        "Everything in Pro, plus:",
        "Unlimited videos — no duration or size limits",
        "Unlimited clips, thumbnails & personas",
        "Full API access for custom workflows",
        "Team workspaces & collaboration tools",
        "SSO / SAML authentication",
        "Custom integrations & webhooks",
        "Dedicated account manager",
        "99.9% uptime SLA guarantee",
        "Invoice billing & volume discounts",
      ],
      cta: "Talk to Sales",
      popular: false,
    },
  ]

  const replacedTools = [
    { name: "Descript", cost: "$24/mo" },
    { name: "Opus Clip", cost: "$50/mo" },
    { name: "Jasper AI", cost: "$49/mo" },
    { name: "Canva Pro", cost: "$13/mo" },
    { name: "Buffer", cost: "$36/mo" },
    { name: "HeyGen", cost: "$48/mo" },
  ]

  return (
    <section id="pricing" className="relative py-28 lg:py-36">
      <div className="mx-auto max-w-6xl px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <p className="text-sm font-medium text-primary/80 tracking-wide uppercase mb-4">
            Pricing
          </p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-5">
            One platform. Everything you need.
          </h2>
          <p className="text-lg text-white/40 max-w-2xl mx-auto mb-10">
            Replace your entire content stack with Inflio.
            Stop juggling 6 different tools — start creating.
          </p>

          {/* Billing toggle */}
          <div className="inline-flex items-center gap-1 bg-white/[0.04] rounded-full p-1.5 border border-white/[0.06]">
            <button
              onClick={() => setAnnual(false)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                !annual ? "bg-white text-black shadow-sm" : "text-white/50 hover:text-white/70"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setAnnual(true)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                annual ? "bg-white text-black shadow-sm" : "text-white/50 hover:text-white/70"
              }`}
            >
              Yearly
              <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                annual ? "bg-emerald-600 text-white" : "bg-emerald-500/20 text-emerald-400"
              }`}>
                -20%
              </span>
            </button>
          </div>
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-5 lg:gap-6">
          {tiers.map((tier, i) => (
            <motion.div
              key={tier.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div
                className={`relative p-7 rounded-2xl border h-full flex flex-col ${
                  tier.popular
                    ? "border-primary/30 bg-primary/[0.04] shadow-[0_0_60px_-12px_rgba(167,139,250,0.2)]"
                    : "border-white/[0.06] bg-white/[0.015]"
                }`}
              >
                {tier.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-gradient-to-r from-[#a78bfa] to-[#c084fc] text-xs font-semibold text-white shadow-lg">
                    Most Popular
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="font-semibold text-lg mb-1.5 text-white/90">{tier.name}</h3>
                  <p className="text-sm text-white/40 mb-5 leading-relaxed">{tier.desc}</p>
                  <div className="flex items-baseline gap-1">
                    {tier.monthlyPrice ? (
                      <>
                        <span className="text-5xl font-bold text-white">
                          ${annual ? tier.yearlyPrice : tier.monthlyPrice}
                        </span>
                        <span className="text-white/40 ml-1">/mo</span>
                        {annual && (
                          <span className="ml-2 text-sm text-white/25 line-through">
                            ${tier.monthlyPrice}
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="text-4xl font-bold text-white">Custom</span>
                    )}
                  </div>
                  {annual && tier.yearlyPrice && (
                    <p className="text-xs text-white/30 mt-1.5">
                      Billed annually at ${tier.yearlyPrice * 12}/yr
                    </p>
                  )}
                </div>

                <ul className="space-y-3 mb-8 flex-1">
                  {tier.features.map((feature, fi) => (
                    <li key={fi} className="flex items-start gap-2.5 text-sm">
                      {fi === 0 && feature.startsWith("Everything") ? (
                        <span className="text-primary/70 font-medium text-xs uppercase tracking-wide pt-0.5">
                          {feature}
                        </span>
                      ) : (
                        <>
                          <Check className="h-4 w-4 text-primary/80 shrink-0 mt-0.5" />
                          <span className="text-white/60">{feature}</span>
                        </>
                      )}
                    </li>
                  ))}
                </ul>

                <Link
                  href={tier.name === "Enterprise" ? "mailto:enterprise@inflio.com" : isSignedIn ? "/dashboard" : "/sign-up"}
                  className="block"
                >
                  <Button
                    className={`w-full rounded-xl h-12 font-medium text-sm ${
                      tier.popular
                        ? "bg-white text-black hover:bg-white/90 shadow-[0_0_20px_rgba(167,139,250,0.15)]"
                        : "bg-white/[0.06] hover:bg-white/[0.1] text-white/80 border border-white/[0.06]"
                    }`}
                  >
                    {tier.cta}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Replaces your tools section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          viewport={{ once: true }}
          className="mt-16"
        >
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8">
            <p className="text-center text-sm font-medium text-white/50 uppercase tracking-wide mb-6">
              Replaces your entire content stack
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {replacedTools.map((tool) => (
                <div key={tool.name} className="text-center py-2">
                  <p className="text-sm font-medium text-white/60">{tool.name}</p>
                  <p className="text-xs text-white/25 line-through mt-0.5">{tool.cost}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 pt-5 border-t border-white/[0.06] text-center">
              <p className="text-white/40 text-sm">
                That&apos;s <span className="text-red-400 font-semibold line-through">$220+/mo</span> in separate tools —{" "}
                <span className="text-emerald-400 font-semibold">all included in every Inflio plan</span>
              </p>
            </div>
          </div>
        </motion.div>

        {/* Trust signals */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-white/30">
          {["14-day money-back guarantee", "Cancel anytime", "No setup fees", "SOC 2 compliant"].map((signal) => (
            <div key={signal} className="flex items-center gap-2">
              <Check className="h-3.5 w-3.5 text-emerald-500/70" />
              <span>{signal}</span>
            </div>
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
    { q: "What video formats are supported?", a: "We support MP4, MOV, AVI, MKV, and WebM up to 2GB. You can also paste a YouTube URL directly." },
    { q: "How accurate is the transcription?", a: "We use OpenAI's Whisper model — 99% accuracy in English with support for 50+ languages and automatic speaker detection." },
    { q: "How does AI Persona work?", a: "Upload 5-10 photos of yourself and we train a model on your likeness. Then generate thumbnails featuring you in any scenario, with consistent brand styling." },
    { q: "Can I try before committing?", a: "Every plan comes with a 14-day money-back guarantee. If it's not for you, just email us for a full refund. No questions asked." },
    { q: "Can I cancel anytime?", a: "Absolutely. No contracts, no lock-in. Cancel from your dashboard anytime and you won't be charged again." },
  ]

  return (
    <section id="faq" className="relative py-28 lg:py-36">
      <div className="absolute inset-0 bg-white/[0.01]" />
      
      <div className="relative mx-auto max-w-2xl px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <p className="text-sm font-medium text-primary/80 tracking-wide uppercase mb-4">
            FAQ
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Common questions
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
                className="w-full text-left px-6 py-5 rounded-xl border border-white/[0.06] bg-white/[0.015] hover:bg-white/[0.03] transition-all duration-200"
              >
                <div className="flex justify-between items-center gap-4">
                  <span className="font-medium text-white/80">{faq.q}</span>
                  <ChevronDown
                    className={`h-4 w-4 text-white/30 shrink-0 transition-transform duration-200 ${
                      open === i ? "rotate-180" : ""
                    }`}
                  />
                </div>
                {open === i && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="mt-3 text-sm text-white/40 pr-8 leading-relaxed"
                  >
                    {faq.a}
                  </motion.p>
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
      { label: "Features", href: "/features" },
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
    <footer className="border-t border-white/[0.05] bg-[#050508]">
      <div className="mx-auto max-w-6xl px-6 lg:px-8 py-14">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          {/* Brand */}
          <div className="col-span-2">
            <Link href="/" className="mb-4 inline-block">
              <InflioLogo size="sm" variant="dark" />
            </Link>
            <p className="text-sm text-white/30 max-w-xs leading-relaxed">
              Transform video into multi-platform content with AI. Built for creators who value their time.
            </p>
          </div>

          <div>
            <h4 className="font-medium text-sm mb-4 text-white/60">Product</h4>
            <ul className="space-y-2.5">
              {links.product.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-white/30 hover:text-white/60 transition-colors duration-200">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-medium text-sm mb-4 text-white/60">Company</h4>
            <ul className="space-y-2.5">
              {links.company.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-white/30 hover:text-white/60 transition-colors duration-200">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-medium text-sm mb-4 text-white/60">Legal</h4>
            <ul className="space-y-2.5">
              {links.legal.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-white/30 hover:text-white/60 transition-colors duration-200">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-white/[0.04] flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-white/20">&copy; {new Date().getFullYear()} Inflio, Inc.</p>
          <div className="flex gap-3">
            {[IconBrandX, IconBrandLinkedin, IconBrandYoutube].map((Icon, i) => (
              <a key={i} href="#" className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.03] text-white/25 hover:text-white/50 hover:bg-white/[0.06] transition-all duration-200">
                <Icon className="h-3.5 w-3.5" />
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
