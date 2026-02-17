"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { ArrowRight, Sparkles } from "lucide-react"

interface FinalCTAProps {
  isSignedIn?: boolean
}

export function FinalCTA({ isSignedIn }: FinalCTAProps) {
  return (
    <section className="relative py-32 lg:py-40 overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_50%,rgba(120,80,220,0.08),transparent_70%)]" />
      </div>

      <div className="relative z-10 mx-auto max-w-3xl px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6 leading-tight">
            Stop repurposing manually.
            <br />
            <span className="bg-gradient-to-r from-[#a78bfa] via-[#c084fc] to-[#f472b6] bg-clip-text text-transparent">
              Start creating more.
            </span>
          </h2>
          
          <p className="text-lg text-white/40 mb-12 max-w-xl mx-auto leading-relaxed">
            Join creators who&apos;ve already transformed their content workflow.
            Upload your first video and see the difference.
          </p>

          <Link href={isSignedIn ? "/studio/upload" : "/sign-up"}>
            <Button size="lg" className="group h-14 px-8 bg-white text-black hover:bg-white/90 font-medium text-base rounded-xl shadow-[0_0_40px_-5px_rgba(167,139,250,0.3)] hover:shadow-[0_0_50px_-5px_rgba(167,139,250,0.4)] transition-all duration-300">
              <Sparkles className="h-4 w-4 mr-2" />
              Start creating free
              <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-0.5 transition-transform" />
            </Button>
          </Link>

          <div className="mt-6 flex items-center justify-center gap-6 text-sm text-white/25">
            <span>No credit card required</span>
            <span className="h-1 w-1 rounded-full bg-white/20" />
            <span>14-day money-back guarantee</span>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
