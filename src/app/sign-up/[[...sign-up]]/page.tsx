"use client"

import { SignUp } from "@clerk/nextjs";
import { motion, useScroll, useTransform } from "framer-motion";
import { useState, useEffect } from "react";
import { 
  Video, 
  Zap, 
  Star, 
  CheckCircle, 
  Sparkles,
  TrendingUp,
  Users,
  Trophy,
  Rocket,
  ArrowRight,
  Gift,
  Shield,
  Globe,
  Layers
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// Floating icons animation
function FloatingIcon({ icon: Icon, delay, duration, x, y }: { 
  icon: any, 
  delay: number, 
  duration: number,
  x: number,
  y: number 
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ 
        opacity: [0, 1, 1, 0],
        y: [y, y - 100, y - 100, y],
        x: [x, x + 20, x - 20, x]
      }}
      transition={{ 
        delay, 
        duration, 
        repeat: Infinity,
        ease: "easeInOut"
      }}
      className="absolute"
      style={{ left: `${x}%`, top: `${y}%` }}
    >
      <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-lg flex items-center justify-center">
        <Icon className="w-6 h-6 text-white/60" />
      </div>
    </motion.div>
  );
}

// Benefit card component
function BenefitCard({ icon: Icon, title, description, delay }: {
  icon: any,
  title: string,
  description: string,
  delay: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.5 }}
    >
      <Card className="h-full hover:shadow-lg transition-all duration-300 group cursor-pointer bg-white/5 backdrop-blur-sm border-white/10">
        <CardContent className="p-6">
          <div className="mb-4">
            <motion.div
              whileHover={{ scale: 1.1, rotate: 5 }}
              className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center group-hover:shadow-lg transition-all"
            >
              <Icon className="w-6 h-6 text-white" />
            </motion.div>
          </div>
          <h3 className="font-semibold text-white mb-2">{title}</h3>
          <p className="text-sm text-white/70">{description}</p>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function SignUpPage() {
  return (
    <div className="relative min-h-screen flex items-center justify-center bg-background">
       <div 
        className="absolute inset-0 -z-10 h-full w-full bg-background 
        [background:radial-gradient(125%_125%_at_50%_10%,#fff_40%,#63e_100%)]
        dark:[background:radial-gradient(125%_125%_at_50%_10%,#000_40%,#63e_100%)]" 
      />
      <div className="w-full max-w-md p-8 space-y-8 bg-card rounded-lg shadow-lg border">
        <div className="flex flex-col items-center space-y-2">
            <Layers className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold">Create Your Inflio Account</h1>
            <p className="text-muted-foreground">Start turning your content into gold.</p>
        </div>
        <SignUp 
          path="/sign-up" 
          routing="path" 
          signInUrl="/sign-in" 
          afterSignUpUrl="/onboarding"
        />
      </div>
    </div>
  );
} 