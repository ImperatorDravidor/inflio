"use client";

import { SignUp } from "@clerk/nextjs";
import { useAuth } from "@clerk/nextjs";
import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Layers,
  ArrowRight,
  CheckCircle,
  Sparkles,
  Gift,
  Zap,
  Shield,
} from "lucide-react";

export default function SignUpPage() {
  const { isLoaded, isSignedIn } = useAuth();

  // If already signed in, redirect
  if (isLoaded && isSignedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white to-gray-50 dark:from-gray-950 dark:to-black">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="text-center"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/20 mb-4">
            <CheckCircle className="h-10 w-10 text-green-600 dark:text-green-400" />
          </div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
            Welcome aboard!
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">Ready to create amazing content?</p>
          <Link href="/dashboard">
            <Button className="rounded-full">
              Go to Dashboard
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-gray-950 dark:to-black flex flex-col">
      {/* Simple Navigation */}
      <nav className="p-6">
        <Link href="/" className="flex items-center space-x-2 w-fit">
          <Layers className="h-6 w-6 text-primary" />
          <span className="text-xl font-semibold text-gray-900 dark:text-white">Inflio</span>
        </Link>
      </nav>

      {/* Main Content - Centered */}
      <div className="flex-1 flex items-center justify-center px-6 pb-12">
        <div className="w-full max-w-5xl grid lg:grid-cols-2 gap-12 items-center">
          {/* Left side - Value props */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
            className="hidden lg:block"
          >
            <div className="space-y-8">
              {/* Hero message */}
              <div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
                  Transform your content creation workflow
                </h2>
                <p className="text-lg text-gray-600 dark:text-gray-400">
                  Join 15,000+ creators saving 30+ hours every week
                </p>
              </div>

              {/* Key features */}
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Zap className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      AI Viral Clip Detection
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Our AI analyzes your content and extracts the most engaging moments that are proven to go viral
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      Multi-Platform Optimization
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Automatically format your content for YouTube Shorts, TikTok, Instagram Reels, and more
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Shield className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      Enterprise-Grade Security
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Your content is encrypted and secure. SOC 2 compliant with GDPR protection
                    </p>
                  </div>
                </div>
              </div>

              {/* Special offer */}
              <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-2xl p-6 border border-primary/20">
                <div className="flex items-center gap-2 mb-2">
                  <Gift className="h-5 w-5 text-primary" />
                  <span className="font-semibold text-gray-900 dark:text-white">
                    Start Free Today
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Get 25 videos/month free forever. No credit card required.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Right side - Sign up form */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="w-full max-w-md mx-auto lg:mx-0"
          >
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                Create your account
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-400">
                Start creating viral content in minutes
              </p>
            </div>

            {!isLoaded ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-2 border-gray-300 dark:border-gray-700 rounded-full animate-spin border-t-primary" />
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-8">
                <SignUp 
                  appearance={{
                    elements: {
                      rootBox: "mx-auto",
                      card: "shadow-none border-0 bg-transparent p-0",
                      headerTitle: "hidden",
                      headerSubtitle: "hidden",
                      socialButtonsBlockButton: "bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white h-11 px-4 rounded-xl font-medium transition-colors",
                      socialButtonsBlockButtonText: "font-medium",
                      dividerRow: "hidden",
                      formFieldLabel: "text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5",
                      formFieldInput: "h-11 w-full rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-4 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent transition-colors",
                      formButtonPrimary: "h-11 w-full rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-medium transition-colors",
                      footerActionLink: "text-primary hover:text-primary/80 font-medium transition-colors",
                      identityPreviewText: "text-sm text-gray-600 dark:text-gray-400",
                      identityPreviewEditButton: "text-primary hover:text-primary/80 text-sm font-medium transition-colors",
                      formFieldInputShowPasswordButton: "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors",
                      otpCodeFieldInput: "h-11 w-11 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-center text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent transition-colors",
                      formResendCodeLink: "text-primary hover:text-primary/80 text-sm font-medium transition-colors",
                    },
                    layout: {
                      socialButtonsPlacement: "top",
                      showOptionalFields: false,
                    },
                  }}
                  redirectUrl="/onboarding"
                />
                
                {/* What you get */}
                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-800">
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    {[
                      "25 free videos/month",
                      "No credit card",
                      "All AI features",
                      "Cancel anytime",
                    ].map((benefit) => (
                      <div key={benefit} className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                        <span className="text-gray-600 dark:text-gray-400">{benefit}</span>
                      </div>
                    ))}
                  </div>

                  <p className="text-center text-gray-600 dark:text-gray-400 mb-3">
                    Already have an account?
                  </p>
                  <Link href="/sign-in" className="block">
                    <Button 
                      variant="outline" 
                      className="w-full h-11 rounded-xl"
                    >
                      Sign in instead
                    </Button>
                  </Link>
                </div>

                {/* Terms - compact */}
                <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-6">
                  By signing up, you agree to our{" "}
                  <Link href="/terms" className="text-primary hover:text-primary/80">
                    Terms
                  </Link>{" "}
                  and{" "}
                  <Link href="/privacy" className="text-primary hover:text-primary/80">
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