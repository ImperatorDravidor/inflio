"use client";

import { SignIn } from "@clerk/nextjs";
import { useAuth } from "@clerk/nextjs";
import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Layers,
  ArrowRight,
  CheckCircle,
  Sparkles,
  Video,
  Clock,
  Users,
} from "lucide-react";

export default function SignInPage() {
  const { isLoaded, isSignedIn, userId } = useAuth();

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
            You're already signed in!
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">Welcome back</p>
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
          {/* Left side - Sign in form */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
            className="w-full max-w-md mx-auto lg:mx-0"
          >
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                Welcome back
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-400">
                Sign in to continue creating amazing content
              </p>
            </div>

            {!isLoaded ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-2 border-gray-300 dark:border-gray-700 rounded-full animate-spin border-t-primary" />
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-8">
                <SignIn 
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
                  redirectUrl="/dashboard"
                />
                
                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-800">
                  <p className="text-center text-gray-600 dark:text-gray-400 mb-3">
                    Don't have an account?
                  </p>
                  <Link href="/sign-up" className="block">
                    <Button 
                      variant="outline" 
                      className="w-full h-11 rounded-xl"
                    >
                      Create an account
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </motion.div>

          {/* Right side - Value props */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="hidden lg:block"
          >
            <div className="space-y-8">
              {/* Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 mb-2">
                    <Video className="h-6 w-6 text-primary" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">2.5M+</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Videos Processed</div>
                </div>
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 mb-2">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">15K+</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Active Creators</div>
                </div>
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 mb-2">
                    <Clock className="h-6 w-6 text-primary" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">10min</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Avg. Processing</div>
                </div>
              </div>

              {/* Feature list */}
              <div className="bg-gray-50 dark:bg-gray-900/50 rounded-2xl p-6">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                  Everything you need to grow:
                </h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">AI-Powered Clips</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Extract viral moments automatically from long videos
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Perfect Transcriptions</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        99% accuracy in 50+ languages with speaker detection
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Multi-Platform Publishing</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Schedule to YouTube, TikTok, Instagram & more
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Testimonial */}
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
                <div className="flex items-center gap-1 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Sparkles key={i} className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                  ))}
                </div>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  "Inflio cut my editing time from 8 hours to 30 minutes. The AI clips are spot-on!"
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
                    SC
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Sarah Chen</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">2.3M YouTube subscribers</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}