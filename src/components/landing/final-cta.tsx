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
    <section className="py-24 lg:py-32">
      <div className="mx-auto max-w-3xl px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-6">
            Ready to save{" "}
            <span className="bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
              40+ hours
            </span>
            {" "}a month?
          </h2>
          
          <p className="text-lg text-white/50 mb-10 max-w-xl mx-auto">
            Join creators who've already transformed their content workflow. 
            Start saving hours every week.
          </p>

          <Link href={isSignedIn ? "/studio/upload" : "/sign-up"}>
            <Button size="lg" className="h-12 px-8 bg-white text-black hover:bg-white/90 font-medium">
              <Sparkles className="h-4 w-4 mr-2" />
              Start creating free
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>

          <p className="mt-4 text-sm text-white/30">
            14-day money-back guarantee
          </p>
        </motion.div>
      </div>
    </section>
  )
}
