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
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    setIsLoading(false)
    setIsSubscribed(true)
  }

  return (
    <div className="pt-28 pb-20">
      <div className="mx-auto max-w-3xl px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary mx-auto mb-4">
            <BookOpen className="h-6 w-6" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3 text-white">
            The Inflio Blog
          </h1>
          <p className="text-white/50 max-w-lg mx-auto">
            Insights on content strategy, AI tools, and growing your audience. 
            Coming soon.
          </p>
        </motion.div>

        {/* Newsletter Signup */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-16"
        >
          <div className="p-8 rounded-2xl bg-gradient-to-br from-primary/5 via-purple-500/5 to-pink-500/5 border border-white/10">
            {isSubscribed ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-4"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-500/20 mx-auto mb-4">
                  <Check className="h-6 w-6 text-green-400" />
                </div>
                <h3 className="font-semibold text-white mb-1">You're on the list</h3>
                <p className="text-sm text-white/50">
                  We'll notify you when we publish our first articles.
                </p>
              </motion.div>
            ) : (
              <>
                <div className="flex items-center gap-2 mb-4">
                  <Bell className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-semibold text-white">Get notified when we launch</h2>
                </div>
                <p className="text-sm text-white/50 mb-6">
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
                    className="flex-1 h-11 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-primary/50"
                  />
                  <Button 
                    type="submit" 
                    className="h-11 px-6 bg-white text-black hover:bg-white/90 gap-2"
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
          className="mb-16"
        >
          <h2 className="text-lg font-semibold text-white mb-4">What we'll cover</h2>
          <div className="space-y-2">
            {upcomingTopics.map((topic, index) => (
              <motion.div
                key={topic}
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                viewport={{ once: true }}
                className="flex items-start gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/5"
              >
                <Zap className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <span className="text-sm text-white/70">{topic}</span>
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
          className="mb-16"
        >
          <h2 className="text-lg font-semibold text-white mb-4">Follow us now</h2>
          <p className="text-sm text-white/50 mb-6">
            Can't wait for the blog? We're already sharing content on social media.
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
                className="group flex items-center gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/10 hover:border-primary/30 transition-all"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/5 text-white/50 group-hover:text-white group-hover:bg-white/10 transition-colors">
                  <channel.icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white text-sm">{channel.name}</span>
                    <span className="text-xs text-white/40">{channel.handle}</span>
                  </div>
                  <p className="text-xs text-white/50 truncate">{channel.description}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-white/30 group-hover:text-primary transition-colors" />
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
          className="text-center p-8 rounded-2xl bg-white/[0.02] border border-white/10"
        >
          <Sparkles className="h-8 w-8 text-primary mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Ready to try Inflio?</h2>
          <p className="text-sm text-white/50 max-w-md mx-auto mb-5">
            Don't wait for the blog. Start repurposing your content today.
          </p>
          <Link href="/sign-up">
            <Button className="gap-2 bg-white text-black hover:bg-white/90">
              Get started
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </div>
  )
}
