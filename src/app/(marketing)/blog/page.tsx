"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import {
  ArrowRight,
  Mail,
  Check,
  Sparkles,
  Bell,
  Zap,
  BookOpen,
} from "lucide-react"
import {
  IconBrandX,
  IconBrandYoutube,
  IconBrandLinkedin,
} from "@tabler/icons-react"

const upcomingTopics = [
  "How we built Inflio's clip detection AI",
  "The creator's guide to multi-platform content strategy",
  "Why your thumbnails aren't getting clicks (and how to fix it)",
  "From 1 video to 30 posts: A real workflow breakdown",
  "AI personas explained: How to maintain brand consistency",
]

const socialChannels = [
  {
    name: "X (Twitter)",
    handle: "@inflioai",
    description: "Daily tips, product updates, and creator insights",
    icon: IconBrandX,
    href: "https://x.com/inflioai",
  },
  {
    name: "YouTube",
    handle: "@inflio",
    description: "Tutorials, walkthroughs, and creator stories",
    icon: IconBrandYoutube,
    href: "https://youtube.com/@inflio",
  },
  {
    name: "LinkedIn",
    handle: "Inflio",
    description: "Industry insights and company updates",
    icon: IconBrandLinkedin,
    href: "https://linkedin.com/company/inflio",
  },
]

export default function BlogPage() {
  const [email, setEmail] = useState("")
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    setIsLoading(true)
    await new Promise(resolve => setTimeout(resolve, 1000))
    setIsLoading(false)
    setIsSubscribed(true)
  }

  return (
    <div className="pt-32 pb-24">
      <div className="mx-auto max-w-3xl px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-b from-violet-500/20 to-violet-500/5 border border-white/[0.06] mx-auto mb-5">
            <BookOpen className="h-6 w-6 text-white/80" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4 text-white">
            The Inflio Blog
          </h1>
          <p className="text-white/40 max-w-lg mx-auto leading-relaxed">
            Insights on content strategy, AI tools, and growing your audience.
            Coming soon.
          </p>
        </motion.div>

        {/* Newsletter Signup */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-20"
        >
          <div className="p-8 rounded-2xl bg-gradient-to-br from-primary/[0.04] via-purple-500/[0.03] to-pink-500/[0.03] border border-white/[0.06]">
            {isSubscribed ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-6"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/15 mx-auto mb-4">
                  <Check className="h-6 w-6 text-emerald-400" />
                </div>
                <h3 className="font-semibold text-white/90 mb-1">You&apos;re on the list</h3>
                <p className="text-sm text-white/40">
                  We&apos;ll notify you when we publish our first articles.
                </p>
              </motion.div>
            ) : (
              <>
                <div className="flex items-center gap-2 mb-4">
                  <Bell className="h-5 w-5 text-primary/70" />
                  <h2 className="text-lg font-semibold text-white/90">Get notified when we launch</h2>
                </div>
                <p className="text-sm text-white/40 mb-6 leading-relaxed">
                  Be the first to read our articles on content strategy, AI workflows, and creator growth.
                  No spam, unsubscribe anytime.
                </p>
                <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3">
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="flex-1 h-11 bg-white/[0.03] border-white/[0.08] text-white placeholder:text-white/25 focus:border-primary/40 rounded-lg"
                  />
                  <Button
                    type="submit"
                    className="h-11 px-6 bg-white text-black hover:bg-white/90 gap-2 rounded-xl font-medium"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      "Subscribing..."
                    ) : (
                      <>
                        <Mail className="h-4 w-4" />
                        Subscribe
                      </>
                    )}
                  </Button>
                </form>
              </>
            )}
          </div>
        </motion.div>

        {/* What to Expect */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="mb-20"
        >
          <p className="text-sm font-medium text-primary/70 tracking-wide uppercase mb-4">
            Coming Soon
          </p>
          <h2 className="text-lg font-semibold text-white/90 mb-5">What we&apos;ll cover</h2>
          <div className="space-y-2">
            {upcomingTopics.map((topic, index) => (
              <motion.div
                key={topic}
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                viewport={{ once: true }}
                className="flex items-start gap-3 p-4 rounded-xl bg-white/[0.015] border border-white/[0.04]"
              >
                <Zap className="h-4 w-4 text-primary/60 mt-0.5 shrink-0" />
                <span className="text-sm text-white/60">{topic}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Follow Us */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="mb-20"
        >
          <p className="text-sm font-medium text-primary/70 tracking-wide uppercase mb-4">
            Social
          </p>
          <h2 className="text-lg font-semibold text-white/90 mb-4">Follow us now</h2>
          <p className="text-sm text-white/40 mb-6 leading-relaxed">
            Can&apos;t wait for the blog? We&apos;re already sharing content on social media.
          </p>
          <div className="grid gap-3">
            {socialChannels.map((channel, index) => (
              <motion.a
                key={channel.name}
                href={channel.href}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                viewport={{ once: true }}
                className="group flex items-center gap-4 p-4 rounded-xl bg-white/[0.015] border border-white/[0.06] hover:border-white/[0.12] hover:bg-white/[0.03] transition-all duration-300"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/[0.03] text-white/40 group-hover:text-white/70 group-hover:bg-white/[0.06] transition-all duration-300">
                  <channel.icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white/80 text-sm">{channel.name}</span>
                    <span className="text-xs text-white/30">{channel.handle}</span>
                  </div>
                  <p className="text-xs text-white/35 truncate">{channel.description}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-white/20 group-hover:text-white/50 transition-colors" />
              </motion.a>
            ))}
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center p-10 rounded-2xl bg-white/[0.015] border border-white/[0.06]"
        >
          <Sparkles className="h-8 w-8 text-primary/70 mx-auto mb-5" />
          <h2 className="text-xl font-bold text-white mb-3">Ready to try Inflio?</h2>
          <p className="text-sm text-white/40 max-w-md mx-auto mb-6 leading-relaxed">
            Don&apos;t wait for the blog. Start repurposing your content today.
          </p>
          <Link href="/sign-up">
            <Button className="group gap-2 bg-white text-black hover:bg-white/90 rounded-xl h-11 px-6 font-medium">
              Get started
              <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </div>
  )
}
