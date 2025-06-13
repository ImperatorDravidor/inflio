"use client"

import { SignIn } from "@clerk/nextjs";
import { Layers } from "lucide-react";

export default function SignInPage() {
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
            <h1 className="text-2xl font-bold">Welcome Back to Inflio</h1>
            <p className="text-muted-foreground">Sign in to continue to your dashboard.</p>
        </div>
        <SignIn path="/sign-in" routing="path" signUpUrl="/sign-up" />
      </div>
    </div>
  );
} 