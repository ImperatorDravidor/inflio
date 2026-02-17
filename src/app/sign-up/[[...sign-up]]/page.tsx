"use client";

import { SignUp } from "@clerk/nextjs";
import { useAuth } from "@clerk/nextjs";
import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { InflioLogo } from "@/components/inflio-logo";
import {
  ArrowRight,
  CheckCircle,
  Check,
  Shield,
  Scissors,
  Globe,
  Bot,
} from "lucide-react";

export default function SignUpPage() {
  const { isLoaded, isSignedIn } = useAuth();

  // If already signed in, redirect
  if (isLoaded && isSignedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#09090b]">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="text-center"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-500/10 mb-4">
            <CheckCircle className="h-10 w-10 text-emerald-400" />
          </div>
          <h1 className="text-2xl font-semibold text-white mb-2">
            Welcome aboard!
          </h1>
          <p className="text-white/50 mb-6">Ready to create amazing content?</p>
          <Link href="/dashboard">
            <Button className="rounded-full bg-white text-black hover:bg-white/90">
              Go to Dashboard
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </motion.div>
      </div>
    );
  }

  const features = [
    {
      icon: Scissors,
      title: "AI Viral Clip Detection",
      desc: "Finds the most engaging moments and creates platform-optimized clips with virality scoring.",
      gradient: "from-violet-500/20 to-violet-500/5",
    },
    {
      icon: Globe,
      title: "13+ Platforms, One Click",
      desc: "Publish to YouTube, TikTok, Instagram, LinkedIn, X, and more — optimized for each platform.",
      gradient: "from-sky-500/20 to-sky-500/5",
    },
    {
      icon: Bot,
      title: "AI Persona & Thumbnails",
      desc: "Train AI on your likeness. Generate thumbnails featuring you in any scenario, consistently on-brand.",
      gradient: "from-pink-500/20 to-pink-500/5",
    },
  ];

  return (
    <div className="min-h-screen bg-[#09090b] text-white flex flex-col">
      {/* Navigation */}
      <nav className="fixed top-0 z-50 w-full bg-[#09090b]/80 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center">
              <InflioLogo size="sm" variant="dark" />
            </Link>
            <Link href="/sign-in">
              <Button
                variant="outline"
                className="rounded-xl border-white/10 text-white/70 hover:text-white hover:bg-white/[0.06] bg-transparent"
              >
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-6 pt-24 pb-12">
        <div className="w-full max-w-5xl grid lg:grid-cols-2 gap-16 items-center">
          {/* Left side - Value props */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="hidden lg:block"
          >
            <div className="space-y-8">
              <div>
                <p className="text-sm font-medium text-primary/80 tracking-wide uppercase mb-3">
                  Start for free
                </p>
                <h2 className="text-3xl lg:text-4xl font-bold tracking-tight mb-4">
                  Your entire content team,{" "}
                  <span className="bg-gradient-to-r from-[#a78bfa] to-[#c084fc] bg-clip-text text-transparent">
                    powered by AI
                  </span>
                </h2>
                <p className="text-lg text-white/40 leading-relaxed">
                  One video becomes 20+ pieces of content across every platform.
                  Join thousands of creators saving 30+ hours every week.
                </p>
              </div>

              {/* Feature highlights */}
              <div className="space-y-5">
                {features.map((feature) => (
                  <div key={feature.title} className="flex items-start gap-4">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-b ${feature.gradient} border border-white/[0.06] shrink-0`}
                    >
                      <feature.icon className="h-5 w-5 text-white/80" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white/90 mb-1">
                        {feature.title}
                      </h3>
                      <p className="text-sm text-white/40 leading-relaxed">
                        {feature.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Guarantee */}
              <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-5">
                <div className="flex items-center gap-2 mb-1.5">
                  <Shield className="h-4 w-4 text-emerald-400" />
                  <span className="font-semibold text-white/80 text-sm">
                    14-Day Money-Back Guarantee
                  </span>
                </div>
                <p className="text-sm text-white/35">
                  Try Inflio risk-free. Not for you? Full refund, no questions
                  asked.
                </p>
              </div>

              {/* Replaces mini */}
              <p className="text-xs text-white/20">
                Replaces Descript, Opus Clip, Jasper, Canva Pro, Buffer &
                more — saving you $220+/mo in separate tools.
              </p>
            </div>
          </motion.div>

          {/* Right side - Sign up form */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="w-full max-w-md mx-auto lg:mx-0"
          >
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-white mb-2">
                Create your account
              </h1>
              <p className="text-white/40">
                Start creating viral content in minutes
              </p>
            </div>

            {!isLoaded ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-2 border-white/10 rounded-full animate-spin border-t-primary" />
              </div>
            ) : (
              <div className="rounded-2xl bg-white/[0.03] border border-white/[0.08] p-8">
                <SignUp
                  appearance={{
                    elements: {
                      rootBox: "mx-auto",
                      card: "shadow-none border-0 bg-transparent p-0",
                      headerTitle: "hidden",
                      headerSubtitle: "hidden",
                      socialButtonsBlockButton:
                        "bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] text-white h-11 px-4 rounded-xl font-medium transition-all",
                      socialButtonsBlockButtonText: "font-medium text-white/90",
                      socialButtonsBlockButtonArrow: "text-white/50",
                      dividerRow: "my-4",
                      dividerLine: "bg-white/[0.06]",
                      dividerText: "text-white/30 text-xs uppercase",
                      formFieldLabel:
                        "text-sm font-medium text-white/50 mb-1.5",
                      formFieldInput:
                        "h-11 w-full rounded-xl bg-white/[0.04] border border-white/[0.08] px-4 text-white placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent transition-all",
                      formButtonPrimary:
                        "h-11 w-full rounded-xl bg-white text-black hover:bg-white/90 font-medium transition-colors",
                      footerActionLink:
                        "text-primary hover:text-primary/80 font-medium transition-colors",
                      identityPreviewText: "text-sm text-white/50",
                      identityPreviewEditButton:
                        "text-primary hover:text-primary/80 text-sm font-medium transition-colors",
                      formFieldInputShowPasswordButton:
                        "text-white/30 hover:text-white/60 transition-colors",
                      otpCodeFieldInput:
                        "h-11 w-11 rounded-xl bg-white/[0.04] border border-white/[0.08] text-center text-white focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent transition-all",
                      formResendCodeLink:
                        "text-primary hover:text-primary/80 text-sm font-medium transition-colors",
                      footer: "hidden",
                      footerAction: "hidden",
                      alertText: "text-red-400 text-sm",
                      formFieldErrorText: "text-red-400 text-xs mt-1",
                      formFieldSuccessText: "text-emerald-400 text-xs mt-1",
                    },
                    layout: {
                      socialButtonsPlacement: "top",
                      showOptionalFields: false,
                    },
                  }}
                  redirectUrl="/onboarding"
                />

                {/* Benefits */}
                <div className="mt-6 pt-6 border-t border-white/[0.06]">
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    {[
                      "All AI features included",
                      "14-day money-back",
                      "Cancel anytime",
                      "No credit card required",
                    ].map((benefit) => (
                      <div
                        key={benefit}
                        className="flex items-center gap-2 text-sm"
                      >
                        <Check className="h-3.5 w-3.5 text-emerald-500/80 flex-shrink-0" />
                        <span className="text-white/40">{benefit}</span>
                      </div>
                    ))}
                  </div>

                  <p className="text-center text-white/40 mb-3 text-sm">
                    Already have an account?
                  </p>
                  <Link href="/sign-in" className="block">
                    <Button
                      variant="outline"
                      className="w-full h-11 rounded-xl border-white/[0.08] text-white/70 hover:text-white hover:bg-white/[0.06] bg-transparent"
                    >
                      Sign in instead
                    </Button>
                  </Link>
                </div>

                {/* Terms */}
                <p className="text-xs text-center text-white/20 mt-6">
                  By signing up, you agree to our{" "}
                  <Link
                    href="/terms"
                    className="text-white/40 hover:text-white/60 underline"
                  >
                    Terms
                  </Link>{" "}
                  and{" "}
                  <Link
                    href="/privacy"
                    className="text-white/40 hover:text-white/60 underline"
                  >
                    Privacy Policy
                  </Link>
                </p>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
