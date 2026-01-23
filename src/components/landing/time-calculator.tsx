"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Slider } from "@/components/ui/slider"
import { Calculator } from "lucide-react"

export function TimeCalculatorSection() {
  const [videosPerMonth, setVideosPerMonth] = useState(8)

  const manualHours = videosPerMonth * 6
  const inflioHours = videosPerMonth * 0.5 // 30 minutes per video
  const hoursSaved = manualHours - inflioHours
  const moneySaved = hoursSaved * 50 // $50/hour value

  return (
    <section className="py-32 bg-[#0a0a0a]">
      <div className="mx-auto max-w-3xl px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/[0.03] mb-6">
            <Calculator className="h-4 w-4 text-primary" />
            <span className="text-sm text-white/60 font-medium">ROI Calculator</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            Calculate your time savings
          </h2>
          <p className="text-muted-foreground">
            See how much time and money you could save each month.
          </p>
        </motion.div>

        {/* Calculator Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          viewport={{ once: true }}
          className="p-8 rounded-2xl border border-white/10 bg-white/[0.02]"
        >
          {/* Slider */}
          <div className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <label className="text-sm text-white/60">Videos per month</label>
              <span className="text-2xl font-bold">{videosPerMonth}</span>
            </div>
            <Slider
              value={[videosPerMonth]}
              onValueChange={([value]) => setVideosPerMonth(value)}
              min={1}
              max={30}
              step={1}
              className="py-4"
            />
            <div className="flex justify-between text-xs text-white/30 mt-2">
              <span>1</span>
              <span>30</span>
            </div>
          </div>

          {/* Results */}
          <div className="grid sm:grid-cols-3 gap-6">
            <div className="text-center p-4 rounded-xl bg-white/[0.03]">
              <p className="text-sm text-white/40 mb-1">Hours saved</p>
              <p className="text-3xl font-bold text-primary">
                {hoursSaved.toFixed(0)}
              </p>
              <p className="text-xs text-white/30 mt-1">per month</p>
            </div>
            <div className="text-center p-4 rounded-xl bg-white/[0.03]">
              <p className="text-sm text-white/40 mb-1">Value saved</p>
              <p className="text-3xl font-bold text-green-400">
                ${moneySaved.toLocaleString()}
              </p>
              <p className="text-xs text-white/30 mt-1">at $50/hr</p>
            </div>
            <div className="text-center p-4 rounded-xl bg-white/[0.03]">
              <p className="text-sm text-white/40 mb-1">Content pieces</p>
              <p className="text-3xl font-bold">
                {videosPerMonth * 20}+
              </p>
              <p className="text-xs text-white/30 mt-1">generated</p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
