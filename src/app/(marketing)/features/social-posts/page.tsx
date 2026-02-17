"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import {
  ArrowRight,
  Sparkles,
  MessageSquare,
} from "lucide-react"
import {
  IconBrandInstagram,
  IconBrandTiktok,
  IconBrandX,
  IconBrandLinkedin,
} from "@tabler/icons-react"

export default function SocialPostsPage() {
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
            <MessageSquare className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs text-white/60 font-medium">Content Creation</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-6 text-white">
            Captions that don't scream "AI wrote this"
          </h1>
          <p className="text-lg text-white/60 max-w-2xl leading-relaxed mb-8">
            We've all scrolled past those generic AI captions. "Here's the thing about..." 
            "You won't believe..." They're dead on arrival. These are different because they're 
            based on what you actually said, not a template.
          </p>
          <Link href="/sign-up">
            <Button size="lg" className="gap-2 bg-white text-black hover:bg-white/90 h-11 px-5">
              <Sparkles className="h-4 w-4" />
              Get started
            </Button>
          </Link>
        </motion.div>
      </section>

      {/* Example Output */}
      <section className="mx-auto max-w-4xl px-6 lg:px-8 mb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="mb-8"
        >
          <h2 className="text-xl font-semibold text-white mb-2">
            Same clip, different platforms
          </h2>
          <p className="text-white/50 text-sm">
            Your clip is about why you quit meetings. Here's what we'd generate:
          </p>
        </motion.div>

        <div className="space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            viewport={{ once: true }}
            className="p-5 rounded-xl bg-white/[0.02] border border-white/10"
          >
            <div className="flex items-center gap-2 mb-3">
              <IconBrandLinkedin className="h-5 w-5 text-[#0A66C2]" />
              <span className="text-sm font-medium text-white">LinkedIn</span>
            </div>
            <p className="text-sm text-white/70 leading-relaxed">
              I stopped accepting meeting invites without an agenda.
              <br /><br />
              Sounds harsh? Maybe. But here's what happened:
              <br />
              → 60% fewer meetings on my calendar
              <br />
              → The meetings that remained actually needed me
              <br />
              → People started sending better agendas
              <br /><br />
              The real cost of a meeting isn't the hour. It's the focus you lose for the rest of the day.
              <br /><br />
              What's your meeting policy?
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            viewport={{ once: true }}
            className="p-5 rounded-xl bg-white/[0.02] border border-white/10"
          >
            <div className="flex items-center gap-2 mb-3">
              <IconBrandTiktok className="h-5 w-5 text-white" />
              <span className="text-sm font-medium text-white">TikTok</span>
            </div>
            <p className="text-sm text-white/70 leading-relaxed">
              i started saying no to every meeting without an agenda and people lost their minds 😭
              <br /><br />
              but also... my calendar has never been cleaner??
              <br /><br />
              the trick is making it a policy not a personal rejection. "oh sorry, company policy, need an agenda" hits different than "i don't want to meet with you"
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            viewport={{ once: true }}
            className="p-5 rounded-xl bg-white/[0.02] border border-white/10"
          >
            <div className="flex items-center gap-2 mb-3">
              <IconBrandX className="h-5 w-5 text-white" />
              <span className="text-sm font-medium text-white">X / Twitter</span>
            </div>
            <p className="text-sm text-white/70 leading-relaxed">
              Started declining every meeting without an agenda.
              <br /><br />
              Result: 60% fewer meetings, none of which were actually needed.
              <br /><br />
              The real productivity hack isn't better meetings. It's fewer meetings.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
            viewport={{ once: true }}
            className="p-5 rounded-xl bg-white/[0.02] border border-white/10"
          >
            <div className="flex items-center gap-2 mb-3">
              <IconBrandInstagram className="h-5 w-5 text-[#E4405F]" />
              <span className="text-sm font-medium text-white">Instagram</span>
            </div>
            <p className="text-sm text-white/70 leading-relaxed">
              The meeting policy that changed everything 📅❌
              <br /><br />
              No agenda = no meeting. Simple rule, dramatic results.
              <br /><br />
              Not being dramatic but my focus has never been better. Save this for when you need permission to protect your calendar.
              <br /><br />
              #productivitytips #remotework #workfromhome #meetingfree #entrepreneurlife
            </p>
          </motion.div>
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
            Why these feel different
          </h2>
          <div className="space-y-4 text-white/60 leading-relaxed">
            <p>
              Generic AI just writes about a topic. We write from your transcript — the actual 
              words you used, the specific examples you gave, the way you phrased things.
            </p>
            <p>
              Then we adapt for platform norms:
            </p>
            <ul className="space-y-2 ml-4 text-sm">
              <li>• <span className="text-white">LinkedIn</span> — professional but not corporate-speak, hook-driven, asks for engagement</li>
              <li>• <span className="text-white">TikTok</span> — casual, lowercase energy, relatability over authority</li>
              <li>• <span className="text-white">X/Twitter</span> — concise, punchy, no fluff, strong take</li>
              <li>• <span className="text-white">Instagram</span> — visual callouts, hashtag strategy, save-worthy formatting</li>
            </ul>
            <p>
              You get 3-4 versions for each platform. Pick your favorite or edit from there.
            </p>
          </div>
        </motion.div>
      </section>

      {/* Voice Settings */}
      <section className="mx-auto max-w-4xl px-6 lg:px-8 mb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="p-8 rounded-2xl bg-gradient-to-br from-primary/5 to-purple-500/5 border border-white/10"
        >
          <h2 className="text-xl font-semibold text-white mb-4">
            Teach it your voice
          </h2>
          <p className="text-white/60 leading-relaxed mb-4">
            In your brand settings, you can specify:
          </p>
          <div className="grid sm:grid-cols-2 gap-3 text-sm text-white/50">
            <div>• Formal vs. casual tone</div>
            <div>• Emoji: heavy, light, or never</div>
            <div>• First person vs. "we"</div>
            <div>• Phrases you always use</div>
            <div>• Words to avoid</div>
            <div>• Hashtag preferences</div>
          </div>
          <p className="text-white/40 text-sm mt-4">
            The more you configure, the less editing you'll do.
          </p>
        </motion.div>
      </section>

      {/* Honest Disclaimer */}
      <section className="mx-auto max-w-4xl px-6 lg:px-8 mb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="p-8 rounded-2xl bg-orange-500/5 border border-orange-500/20"
        >
          <h2 className="text-lg font-semibold text-orange-400 mb-3">
            Still a first draft
          </h2>
          <p className="text-white/60 leading-relaxed text-sm">
            Even good AI captions usually need a tweak. A word that doesn't sound like you. 
            A hook that could be sharper. The goal is 80% done — skip the blank page, 
            get something workable, polish as needed. If you're expecting perfect copy every time, 
            you'll be disappointed. If you want a solid starting point, this delivers.
          </p>
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
            See what it writes for your content
          </h2>
          <p className="text-white/50 max-w-md mx-auto mb-6">
            Upload a clip. Check if the generated captions are actually useful 
            or just more generic AI noise.
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
