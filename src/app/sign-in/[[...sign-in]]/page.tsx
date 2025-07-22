"use client";

import { SignIn } from "@clerk/nextjs";
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
  Quote,
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
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";

const stats = [
  { label: "Active Creators", value: "15K+", icon: Users },
  { label: "Videos Processed", value: "2.5M+", icon: Video },
  { label: "Time Saved", value: "95%", icon: Clock },
  { label: "User Rating", value: "4.9/5", icon: Star },
];

const benefits = [
  "Extract viral clips with AI",
  "Perfect transcriptions in 50+ languages",
  "SEO-optimized blog posts",
  "Schedule to all social platforms",
  "Analytics & insights",
  "Custom branding",
];

const testimonial = {
  content: "Inflio transformed my content workflow. What took 8 hours now takes 30 minutes. The AI is incredibly accurate!",
  author: "Sarah Chen",
  role: "YouTube Creator",
  subscribers: "2.3M subscribers",
  avatar: "SC",
};

const platforms = [
  { icon: IconBrandYoutube, color: "text-red-600" },
  { icon: IconBrandInstagram, color: "text-pink-600" },
  { icon: IconBrandTiktok, color: "text-black dark:text-white" },
  { icon: IconBrandX, color: "text-black dark:text-white" },
  { icon: IconBrandLinkedin, color: "text-blue-600" },
  { icon: IconBrandFacebook, color: "text-blue-700" },
];

export default function SignInPage() {
  const { isLoaded, isSignedIn, userId } = useAuth();

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
          <p className="text-muted-foreground mb-6">Welcome back, {userId}</p>
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
            <Link href="/sign-up">
              <Button variant="ghost" size="sm">
                Don't have an account? Sign up
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <div className="flex min-h-[calc(100vh-4rem)]">
        {/* Left side - Sign in form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-md"
          >
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold mb-2">Welcome back</h1>
              <p className="text-muted-foreground">
                Sign in to continue creating amazing content
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
                <SignIn 
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
                      formButtonPrimary: "inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-11 px-8 w-full",
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
                  redirectUrl="/dashboard"
                />
                
                {/* Terms */}
                <p className="text-xs text-center text-muted-foreground">
                  By signing in, you agree to our{" "}
                  <Link href="/terms" className="text-primary hover:underline">
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link href="/privacy" className="text-primary hover:underline">
                    Privacy Policy
                  </Link>
                </p>
              </div>
            )}
          </motion.div>
        </div>

        {/* Right side - Marketing content */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary/5 via-purple-600/5 to-pink-600/5 p-12 items-center justify-center relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute inset-0 bg-grid-white/5 [mask-image:radial-gradient(ellipse_at_center,white,transparent)]" />
          <div className="absolute top-0 right-0 -mt-40 -mr-40 w-80 h-80 bg-primary/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 -mb-40 -ml-40 w-80 h-80 bg-purple-600/20 rounded-full blur-3xl" />
          
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="relative z-10 max-w-md"
          >
            {/* Logo and tagline */}
            <div className="mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 mb-4">
                <IconSparkles className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-2xl font-bold mb-2">
                Transform Your Content with AI
              </h2>
              <p className="text-muted-foreground">
                Join 15,000+ creators using Inflio to create viral content in minutes
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              {stats.map((stat) => (
                <div key={stat.label} className="bg-background/50 backdrop-blur-sm rounded-lg p-4 border border-primary/10">
                  <stat.icon className="h-5 w-5 text-primary mb-2" />
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Testimonial */}
            <Card className="mb-8 border-primary/10 bg-background/50 backdrop-blur-sm">
              <div className="p-6">
                <Quote className="h-8 w-8 text-primary/20 mb-4" />
                <p className="text-sm mb-4 italic">"{testimonial.content}"</p>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center text-sm font-semibold">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <div className="font-semibold text-sm">{testimonial.author}</div>
                    <div className="text-xs text-muted-foreground">
                      {testimonial.role} • {testimonial.subscribers}
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Benefits */}
            <div className="space-y-3 mb-8">
              <h3 className="font-semibold mb-2">Everything you need:</h3>
              {benefits.map((benefit) => (
                <div key={benefit} className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                  <span>{benefit}</span>
                </div>
              ))}
            </div>

            {/* Platform icons */}
            <div>
              <p className="text-sm text-muted-foreground mb-3">
                Publish to all platforms:
              </p>
              <div className="flex gap-3">
                {platforms.map((platform, index) => (
                  <platform.icon
                    key={index}
                    className={cn("h-5 w-5 transition-colors", platform.color)}
                  />
                ))}
              </div>
            </div>

            {/* Trust badges */}
            <div className="mt-8 pt-8 border-t border-primary/10">
              <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Shield className="h-3 w-3" />
                  SOC 2 Compliant
                </div>
                <div className="flex items-center gap-1">
                  <Globe className="h-3 w-3" />
                  GDPR Ready
                </div>
                <div className="flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  99.9% Uptime
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}