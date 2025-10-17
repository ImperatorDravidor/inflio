"use client";

import { useAuth, useSignIn } from "@clerk/nextjs";
import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SignInPage, Testimonial } from "@/components/ui/sign-in";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import {
  ArrowRight,
  CheckCircle,
} from "lucide-react";
import { InflioLogo } from "@/components/inflio-logo";

const testimonials: Testimonial[] = [
  {
    avatarSrc: "https://ui-avatars.com/api/?name=Sarah+Chen&background=6366f1&color=fff",
    name: "Sarah Chen",
    handle: "@sarahcreates",
    text: "Cut my editing time from 8 hours to 30 minutes. The AI clips are spot-on!"
  },
  {
    avatarSrc: "https://ui-avatars.com/api/?name=Marcus+Johnson&background=8b5cf6&color=fff",
    name: "Dr. Marcus Johnson",
    handle: "@drmarcus",
    text: "The transcription accuracy is incredible. Handles technical content perfectly!"
  },
  {
    avatarSrc: "https://ui-avatars.com/api/?name=Emily+Rodriguez&background=ec4899&color=fff",
    name: "Emily Rodriguez",
    handle: "@emilymarketing",
    text: "One video becomes 20+ pieces of content. My engagement tripled!"
  }
];

export default function ClerkSignInPage() {
  const { isLoaded, isSignedIn } = useAuth();
  const { signIn, setActive } = useSignIn();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

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

  // Handle email/password sign in
  const handleSignIn = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    
    if (!isLoaded || !signIn) return;
    
    setIsLoading(true);
    const formData = new FormData(event.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    
    try {
      const result = await signIn.create({
        identifier: email,
        password,
      });
      
      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        router.push('/dashboard');
      }
    } catch (err: any) {
      console.error('Sign in error:', err);
      toast.error(err.errors?.[0]?.message || 'Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle Google OAuth
  const handleGoogleSignIn = async () => {
    if (!isLoaded || !signIn) return;
    
    try {
      await signIn.authenticateWithRedirect({
        strategy: 'oauth_google',
        redirectUrl: '/sso-callback',
        redirectUrlComplete: '/dashboard',
      });
    } catch (err: any) {
      console.error('Google sign in error:', err);
      toast.error('Failed to sign in with Google');
    }
  };
  
  return (
    <>
      {/* Navigation Bar */}
      <nav className="fixed top-0 z-50 w-full bg-white/80 dark:bg-black/40 backdrop-blur-xl border-b border-gray-200 dark:border-white/10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center space-x-2 group">
              <InflioLogo size="sm" />
            </Link>
            <Link href="/sign-up">
              <Button variant="outline" className="rounded-xl">
                Create Account
              </Button>
            </Link>
          </div>
        </div>
      </nav>
      
      {/* Sign In Component */}
      <div className="fixed inset-0 pt-16">
        <SignInPage
          title={
            <span className="font-light text-foreground tracking-tighter">
              Welcome back to <span className="font-semibold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">Inflio</span>
            </span>
          }
          description="Sign in to continue creating amazing content that goes viral"
          heroImageSrc="https://images.unsplash.com/photo-1642615835477-d303d7dc9ee9?w=2160&q=80"
          testimonials={testimonials}
          onSignIn={handleSignIn}
          onGoogleSignIn={handleGoogleSignIn}
          onResetPassword={() => router.push('/reset-password')}
          onCreateAccount={() => router.push('/sign-up')}
        />
      </div>
    </>
  );
}