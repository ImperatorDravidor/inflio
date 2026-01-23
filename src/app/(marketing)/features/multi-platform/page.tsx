"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import {
  ArrowRight,
  Sparkles,
  Globe,
} from "lucide-react"
import {
  IconBrandYoutube,
  IconBrandInstagram,
  IconBrandTiktok,
  IconBrandX,
  IconBrandLinkedin,
  IconBrandFacebook,
  IconBrandThreads,
} from "@tabler/icons-react"

const platforms = [
  { name: "TikTok", icon: IconBrandTiktok, status: "full", notes: "Direct upload, scheduling, analytics" },
  { name: "Instagram Reels", icon: IconBrandInstagram, status: "full", notes: "Requires business account" },
  { name: "YouTube Shorts", icon: IconBrandYoutube, status: "full", notes: "Direct upload via API" },
  { name: "X / Twitter", icon: IconBrandX, status: "full", notes: "Video posts and threads" },
  { name: "LinkedIn", icon: IconBrandLinkedin, status: "full", notes: "Personal or company pages" },
  { name: "Facebook Reels", icon: IconBrandFacebook, status: "full", notes: "Pages only" },
  { name: "Threads", icon: IconBrandThreads, status: "limited", notes: "Text posts (video coming)" },
]

export default function MultiPlatformPage() {
  return (
    <div className="pt-28 pb-20">
      {/* Hero */}
      <section className="mx-auto max-w-4xl px-6 lg:px-8 mb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/[0.03] mb-6">
            <Globe className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs text-white/60 font-medium">Publishing</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-6 text-white">
            One clip, seven platforms, one click
          </h1>
          <p className="text-lg text-white/60 max-w-2xl leading-relaxed mb-8">
            The same clip needs to go to TikTok, Instagram, YouTube, LinkedIn, and Twitter. 
            The old way: download, re-upload, write captions, post — five times. The Inflio way: 
            check boxes, review captions, publish.
          </p>
          <Link href="/sign-up">
            <Button size="lg" className="gap-2 bg-white text-black hover:bg-white/90 h-11 px-5">
              <Sparkles className="h-4 w-4" />
              Get started
            </Button>
          </Link>
        </motion.div>
      </section>

      {/* Platforms */}
      <section className="mx-auto max-w-4xl px-6 lg:px-8 mb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="mb-8"
        >
          <h2 className="text-2xl font-bold text-white mb-3">
            Where you can publish
          </h2>
          <p className="text-white/50 text-sm">
            Connect once, publish whenever.
          </p>
        </motion.div>

        <div className="space-y-2">
          {platforms.map((platform, index) => (
            <motion.div
              key={platform.name}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.03 }}
              viewport={{ once: true }}
              className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/5"
            >
              <platform.icon className="h-5 w-5 text-white/50 shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="font-medium text-white text-sm">{platform.name}</span>
              </div>
              <span className="text-xs text-white/40 hidden sm:block">{platform.notes}</span>
              {platform.status === "limited" && (
                <span className="px-2 py-0.5 text-[10px] rounded-full bg-orange-500/20 text-orange-400">Limited</span>
              )}
            </motion.div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="mx-auto max-w-4xl px-6 lg:px-8 mb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="p-8 rounded-2xl bg-white/[0.02] border border-white/10"
        >
          <h2 className="text-xl font-semibold text-white mb-6">
            The actual workflow
          </h2>
          <div className="space-y-4 text-sm text-white/60">
            <p>When you have a clip ready:</p>
            <ol className="space-y-2 ml-4">
              <li>1. Check which platforms you want to post to</li>
              <li>2. Review the auto-generated caption for each (we write platform-specific versions)</li>
              <li>3. Edit any caption if needed</li>
              <li>4. Hit publish or schedule for later</li>
            </ol>
            <p className="text-white/40">
              We handle format differences (aspect ratios, file specs) and character limits automatically.
            </p>
          </div>
        </motion.div>
      </section>

      {/* What We Can't Do */}
      <section className="mx-auto max-w-4xl px-6 lg:px-8 mb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="p-6 rounded-2xl bg-orange-500/5 border border-orange-500/20"
        >
          <h3 className="font-semibold text-orange-400 mb-3">Platform API limitations</h3>
          <div className="text-white/60 text-sm space-y-2">
            <p>Some things we can't do because platforms don't allow it:</p>
            <ul className="ml-4 space-y-1">
              <li>• Instagram carousels (API doesn't support)</li>
              <li>• Adding TikTok sounds/music (copyright)</li>
              <li>• Personal Instagram accounts (business/creator only)</li>
              <li>• Story posts on most platforms</li>
            </ul>
          </div>
        </motion.div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-4xl px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center p-10 rounded-2xl bg-white/[0.02] border border-white/10"
        >
          <h2 className="text-2xl font-bold text-white mb-3">
            Connect your accounts
          </h2>
          <p className="text-white/50 max-w-md mx-auto mb-6">
            Link once. Publish to any of them from your dashboard.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/sign-up">
              <Button size="lg" className="gap-2 bg-white text-black hover:bg-white/90">
                Get started
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/features">
              <Button variant="outline" size="lg" className="border-white/10 text-white hover:bg-white/5">
                See all features
              </Button>
            </Link>
          </div>
        </motion.div>
      </section>
    </div>
  )
}
