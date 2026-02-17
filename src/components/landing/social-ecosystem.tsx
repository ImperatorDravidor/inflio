"use client"

import { motion } from "framer-motion"
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
import { Globe } from "lucide-react"

const platforms = [
  { name: "YouTube", icon: IconBrandYoutube, types: "Long, Shorts" },
  { name: "TikTok", icon: IconBrandTiktok, types: "Videos" },
  { name: "Instagram", icon: IconBrandInstagram, types: "Reels, Feed, Stories" },
  { name: "LinkedIn", icon: IconBrandLinkedin, types: "Posts, Articles" },
  { name: "X", icon: IconBrandX, types: "Posts, Threads" },
  { name: "Facebook", icon: IconBrandFacebook, types: "Reels, Posts" },
  { name: "Medium", icon: IconBrandMedium, types: "Articles" },
  { name: "Twitch", icon: IconBrandTwitch, types: "Clips" },
]

export function SocialEcosystemSection() {
  return (
    <section className="py-32 bg-[#0a0a0a]">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/[0.03] mb-6">
            <Globe className="h-4 w-4 text-primary" />
            <span className="text-sm text-white/60 font-medium">Platforms</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-6">
            One upload.{" "}
            <span className="bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
              Every platform.
            </span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Each piece of content is automatically optimized for its destination. 
            The right format, dimensions, and caption style — every time.
          </p>
        </motion.div>

        {/* Platform Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          viewport={{ once: true }}
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
        >
          {platforms.map((platform, index) => (
            <motion.div
              key={platform.name}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: index * 0.03 }}
              viewport={{ once: true }}
              whileHover={{ y: -4, borderColor: "rgba(124, 58, 237, 0.3)" }}
              className="group p-5 rounded-2xl border border-white/5 bg-white/[0.02] transition-all duration-300"
            >
              <div className="flex items-center gap-3 mb-3">
                <platform.icon className="h-6 w-6 text-white/60 group-hover:text-primary transition-colors" />
                <span className="font-medium text-sm">{platform.name}</span>
              </div>
              <p className="text-xs text-white/40">{platform.types}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Bottom Note */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          viewport={{ once: true }}
          className="mt-12 text-center text-sm text-white/40"
        >
          + WordPress, Substack, Pinterest, Threads, Vimeo coming soon
        </motion.p>
      </div>
    </section>
  )
}
