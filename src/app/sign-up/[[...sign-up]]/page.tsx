"use client";

import { SignUp } from "@clerk/nextjs";
import { useAuth } from "@clerk/nextjs";
import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Layers,
  ArrowRight,
  CheckCircle,
  Star,
  Users,
  Video,
  Clock,
  Sparkles,
  TrendingUp,
  Shield,
  Globe,
  Zap,
  Gift,
  Rocket,
} from "lucide-react";
import {
  IconBrandYoutube,
  IconBrandInstagram,
  IconBrandTiktok,
  IconBrandX,
  IconBrandLinkedin,
  IconBrandFacebook,
  IconSparkles,
  IconRocket,
  IconBolt,
  IconWand,
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";

const features = [
  {
    icon: <Zap className="h-5 w-5" />,
    title: "AI-Powered Clips",
    description: "Extract viral moments automatically"
  },
  {
    icon: <Globe className="h-5 w-5" />,
    title: "50+ Languages",
    description: "Perfect transcriptions worldwide"
  },
  {
    icon: <Rocket className="h-5 w-5" />,
    title: "10min Processing",
    description: "From upload to publish instantly"
  },
  {
    icon: <Shield className="h-5 w-5" />,
    title: "Enterprise Security",
    description: "SOC 2 compliant platform"
  },
];

const testimonials = [
  {
    content: "Inflio helped me grow from 10K to 2.3M subscribers in just 18 months!",
    author: "Sarah Chen",
    role: "YouTube Creator",
    rating: 5,
  },
  {
    content: "The AI is scary good at finding viral moments. My engagement tripled!",
    author: "Marcus Johnson",
    role: "TikTok Influencer",
    rating: 5,
  },
  {
    content: "I save 30+ hours every week. Best investment for content creators.",
    author: "Emily Rodriguez",
    role: "Instagram Creator",
    rating: 5,
  },
];

const platforms = [
  { icon: IconBrandYoutube, color: "text-red-600" },
  { icon: IconBrandInstagram, color: "text-pink-600" },
  { icon: IconBrandTiktok, color: "text-black dark:text-white" },
  { icon: IconBrandX, color: "text-black dark:text-white" },
  { icon: IconBrandLinkedin, color: "text-blue-600" },
  { icon: IconBrandFacebook, color: "text-blue-700" },
];

export default function SignUpPage() {
  const { isLoaded, isSignedIn } = useAuth();

  // If already signed in, redirect
  if (isLoaded && isSignedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
            <CheckCircle className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold mb-2">You're already signed in!</h1>
          <p className="text-muted-foreground mb-6">Ready to create amazing content?</p>
          <Link href="/dashboard">
            <Button className="group">
              Go to Dashboard
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Navigation */}
      <nav className="border-b bg-background/80 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center space-x-2 group">
              <div className="relative">
                <Layers className="h-6 w-6 text-primary transition-transform group-hover:scale-110" />
                <div className="absolute inset-0 bg-primary/20 blur-xl group-hover:bg-primary/30 transition-all" />
              </div>
              <span className="text-xl font-bold">Inflio</span>
            </Link>
            <Link href="/sign-in">
              <Button variant="ghost" size="sm">
                Already have an account? Sign in
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <div className="flex min-h-[calc(100vh-4rem)]">
        {/* Left side - Marketing content */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary/5 via-purple-600/5 to-pink-600/5 p-12 items-center justify-center relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute inset-0 bg-grid-white/5 [mask-image:radial-gradient(ellipse_at_center,white,transparent)]" />
          <div className="absolute top-0 left-0 -mt-40 -ml-40 w-80 h-80 bg-primary/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 -mb-40 -mr-40 w-80 h-80 bg-purple-600/20 rounded-full blur-3xl" />
          
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="relative z-10 max-w-md"
          >
            {/* Hero content */}
            <div className="mb-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5, type: "spring" }}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-primary/20 to-purple-600/20 rounded-full px-4 py-2 mb-6"
              >
                <Gift className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Start with 25 free videos/month</span>
              </motion.div>
              
              <h2 className="text-3xl font-bold mb-4">
                Join 15,000+ Creators
                <span className="block text-2xl mt-2 bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                  Growing Faster with AI
                </span>
              </h2>
              <p className="text-muted-foreground text-lg">
                Transform your content creation workflow and save 30+ hours every week
              </p>
            </div>

            {/* Features grid */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
                  className="bg-background/50 backdrop-blur-sm rounded-lg p-4 border border-primary/10"
                >
                  <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary mb-3">
                    {feature.icon}
                  </div>
                  <h3 className="font-semibold text-sm mb-1">{feature.title}</h3>
                  <p className="text-xs text-muted-foreground">{feature.description}</p>
                </motion.div>
              ))}
            </div>

            {/* Testimonials carousel */}
            <div className="mb-8">
              <h3 className="font-semibold mb-4">What creators are saying:</h3>
              <div className="space-y-3">
                {testimonials.map((testimonial, index) => (
                  <motion.div
                    key={testimonial.author}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.5 + index * 0.1 }}
                  >
                    <Card className="border-primary/10 bg-background/50 backdrop-blur-sm">
                      <div className="p-4">
                        <div className="flex gap-1 mb-2">
                          {[...Array(testimonial.rating)].map((_, i) => (
                            <Star key={i} className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                          ))}
                        </div>
                        <p className="text-sm mb-2">"{testimonial.content}"</p>
                        <p className="text-xs text-muted-foreground">
                          — {testimonial.author}, {testimonial.role}
                        </p>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Platform icons */}
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-3">
                One-click publishing to:
              </p>
              <div className="flex justify-center gap-4">
                {platforms.map((platform, index) => (
                  <motion.div
                    key={index}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.3, delay: 0.8 + index * 0.05 }}
                  >
                    <platform.icon
                      className={cn("h-6 w-6 transition-all hover:scale-110", platform.color)}
                    />
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right side - Sign up form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-md"
          >
            <div className="text-center mb-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", duration: 0.5 }}
                className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 mb-4"
              >
                <IconRocket className="h-8 w-8 text-primary" />
              </motion.div>
              <h1 className="text-3xl font-bold mb-2">Create Your Account</h1>
              <p className="text-muted-foreground">
                Start creating viral content in minutes
              </p>
            </div>

            {!isLoaded ? (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 animate-pulse mb-4">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <p className="text-muted-foreground">Loading...</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Special offer banner */}
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-gradient-to-r from-primary/10 to-purple-600/10 rounded-lg p-4 text-center border border-primary/20"
                >
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <IconBolt className="h-5 w-5 text-primary" />
                    <span className="font-semibold">Limited Time Offer</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Sign up today and get 50 bonus videos in your first month!
                  </p>
                </motion.div>

                <SignUp 
                  appearance={{
                    elements: {
                      rootBox: "mx-auto",
                      card: "shadow-none border-0 bg-transparent p-0",
                      headerTitle: "hidden",
                      headerSubtitle: "hidden",
                      socialButtonsBlockButton: "border border-input bg-background hover:bg-accent hover:text-accent-foreground h-11 px-8 rounded-md font-medium transition-colors",
                      socialButtonsBlockButtonText: "font-normal",
                      dividerRow: "hidden",
                      formFieldLabel: "text-sm font-medium text-foreground",
                      formFieldInput: "flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                      formButtonPrimary: "inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground h-11 px-8 w-full shadow-lg shadow-primary/25",
                      footerActionLink: "text-primary hover:text-primary/80 font-medium",
                      identityPreviewText: "text-sm text-muted-foreground",
                      identityPreviewEditButton: "text-primary hover:text-primary/80 text-sm font-medium",
                      formFieldInputShowPasswordButton: "text-muted-foreground hover:text-foreground",
                      otpCodeFieldInput: "flex h-11 w-11 rounded-md border border-input bg-background px-3 py-2 text-center text-sm",
                      formResendCodeLink: "text-primary hover:text-primary/80 text-sm font-medium",
                    },
                    layout: {
                      socialButtonsPlacement: "top",
                      showOptionalFields: false,
                    },
                  }}
                  redirectUrl="/onboarding"
                />
                
                {/* Benefits list */}
                <div className="space-y-2 py-4">
                  {[
                    "No credit card required",
                    "25 free videos every month",
                    "Cancel anytime",
                    "Full access to all features"
                  ].map((benefit) => (
                    <div key={benefit} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span>{benefit}</span>
                    </div>
                  ))}
                </div>
                
                {/* Terms */}
                <p className="text-xs text-center text-muted-foreground">
                  By signing up, you agree to our{" "}
                  <Link href="/terms" className="text-primary hover:underline">
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link href="/privacy" className="text-primary hover:underline">
                    Privacy Policy
                  </Link>
                </p>

                {/* Trust badges */}
                <div className="flex items-center justify-center gap-6 pt-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Shield className="h-3 w-3" />
                    SOC 2
                  </div>
                  <div className="flex items-center gap-1">
                    <Globe className="h-3 w-3" />
                    GDPR
                  </div>
                  <div className="flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    99.9% Uptime
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
} 