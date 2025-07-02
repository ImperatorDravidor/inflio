"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useUser, useAuth } from "@clerk/nextjs"
import { motion, AnimatePresence } from "framer-motion"
import {
  Sparkles,
  User,
  Paintbrush,
  Target,
  ChevronLeft,
  ChevronRight,
  Layers,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { toast } from "sonner"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import Link from "next/link"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"

const steps = [
  { id: 'welcome', title: 'Welcome', icon: Sparkles },
  { id: 'profile', title: 'Your Profile', icon: User },
  { id: 'brand', title: 'Brand Kit', icon: Paintbrush },
  { id: 'strategy', title: 'Content Strategy', icon: Target },
];

const INDUSTRIES = [ "Technology", "Education", "Healthcare", "Finance", "E-commerce", "Marketing", "Entertainment", "Other"];
const BRAND_VOICES = ["Professional", "Casual", "Friendly", "Playful", "Inspirational"];
const CONTENT_GOALS = ["Brand Awareness", "Audience Engagement", "Lead Generation", "Direct Sales", "Education"];

export default function OnboardingPage() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const { userId } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    fullName: "",
    companyName: "",
    industry: "",
    brandVoice: "",
    brandColors: { primary: "#6366F1", accent: "#EC4899" },
    contentGoals: [] as string[],
  });

  useEffect(() => {
    if (user) {
      setFormData(prev => ({ ...prev, fullName: user.fullName || "" }));
    }
  }, [user]);

  const progress = ((currentStep + 1) / steps.length) * 100;

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    if (!user) return;
    
    setIsSubmitting(true);
    toast.info("Setting up your workspace...");
    
    try {
      // Prepare data with defaults for missing fields
      const onboardingData = {
        clerkUserId: user.id,
        email: user.primaryEmailAddress?.emailAddress,
        fullName: formData.fullName,
        companyName: formData.companyName || "",
        industry: formData.industry || "Other",
        companySize: "1-10", // Default
        role: "Content Creator", // Default
        targetAge: ["25-34", "35-44"], // Default age groups
        targetInterests: "General audience", // Default
        audienceDescription: "General content audience", // Default
        brandColors: formData.brandColors,
        brandFonts: { heading: "Inter", body: "Roboto" }, // Fixed structure
        brandVoice: formData.brandVoice || "Professional",
        logoUrl: "", // No logo for now
        contentTypes: ["video", "blog"], // Default content types
        videoStyle: "modern", // Default
        transitionStyle: "smooth", // Default
        musicPreference: "upbeat", // Default
        contentGoals: formData.contentGoals.length > 0 ? formData.contentGoals : ["Brand Awareness"],
        primaryPlatforms: ["youtube", "instagram"], // Default platforms
        postingFrequency: "weekly", // Default
        preferredTimes: ["morning", "evening"], // Default
        onboarding_completed: true
      };

      const response = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(onboardingData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save onboarding data");
      }

      toast.success("Welcome to Inflio! Let's create amazing content together 🚀");
      
      // Small delay for user to see success message
      setTimeout(() => {
        router.push("/dashboard");
      }, 1000);
      
    } catch (error) {
      console.error("Onboarding error:", error);
      toast.error("Something went wrong. Please try again.");
      setIsSubmitting(false);
    }
  };

  
  if (!isLoaded) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-primary/5 via-accent/5 to-primary/5">
        <div className="text-center">
          <Layers className="h-8 w-8 text-primary animate-pulse mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-accent/5 to-primary/5 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <Link href="/" className="flex items-center justify-center gap-2 mb-4 text-2xl font-bold">
            <Layers className="h-7 w-7 text-primary" />
            <span>Inflio</span>
          </Link>
          <p className="text-muted-foreground">Let&apos;s personalize your AI content experience.</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
            <Progress value={progress} className="h-2" />
            <div className="mt-2 flex justify-between text-sm text-muted-foreground">
                {steps.map((step, index) => (
                    <div key={step.id} className={`w-1/4 text-center ${currentStep >= index ? 'font-semibold text-primary' : ''}`}>
                        {step.title}
                    </div>
                ))}
            </div>
        </div>

        {/* Form Content */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
                {(() => {
                  const Icon = steps[currentStep].icon;
                  return Icon ? <Icon className="h-6 w-6" /> : null;
                })()}
                {steps[currentStep].title}
            </CardTitle>
            <CardDescription>
                {currentStep === 0 && "Welcome! Let's get started."}
                {currentStep === 1 && "Tell us a bit about you and your work."}
                {currentStep === 2 && "Define your brand's look and feel."}
                {currentStep === 3 && "What are you hoping to achieve with your content?"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.3 }}
              >
                {currentStep === 0 && (
                  <div className="text-center py-8">
                    <h2 className="text-2xl font-semibold mb-2">Welcome to Inflio, {user?.firstName}!</h2>
                    <p className="text-muted-foreground">This quick setup will help our AI learn your style.</p>
                  </div>
                )}

                {currentStep === 1 && (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="fullName">Full Name</Label>
                      <Input id="fullName" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} />
                    </div>
                    <div>
                      <Label htmlFor="companyName">Company Name (Optional)</Label>
                      <Input id="companyName" value={formData.companyName} onChange={e => setFormData({...formData, companyName: e.target.value})} />
                    </div>
                    <div>
                      <Label htmlFor="industry">Industry</Label>
                      <Select value={formData.industry} onValueChange={value => setFormData({...formData, industry: value})}>
                        <SelectTrigger><SelectValue placeholder="Select your industry" /></SelectTrigger>
                        <SelectContent>
                          {INDUSTRIES.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
                
                {currentStep === 2 && (
                    <div className="space-y-6">
                        <div>
                            <Label>Brand Voice</Label>
                            <p className="text-sm text-muted-foreground mb-2">How do you want your content to sound?</p>
                            <Select value={formData.brandVoice} onValueChange={value => setFormData({...formData, brandVoice: value})}>
                                <SelectTrigger><SelectValue placeholder="Select a voice" /></SelectTrigger>
                                <SelectContent>
                                    {BRAND_VOICES.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label>Brand Colors</Label>
                             <p className="text-sm text-muted-foreground mb-2">This helps us generate on-brand assets.</p>
                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <Label htmlFor="primaryColor" className="font-normal">Primary</Label>
                                    <Input id="primaryColor" type="color" value={formData.brandColors.primary} onChange={e => setFormData({...formData, brandColors: {...formData.brandColors, primary: e.target.value}})} className="h-12"/>
                                </div>
                                <div className="flex-1">
                                    <Label htmlFor="accentColor" className="font-normal">Accent</Label>
                                    <Input id="accentColor" type="color" value={formData.brandColors.accent} onChange={e => setFormData({...formData, brandColors: {...formData.brandColors, accent: e.target.value}})} className="h-12"/>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {currentStep === 3 && (
                    <div>
                        <Label>Content Goals</Label>
                        <p className="text-sm text-muted-foreground mb-4">Select all that apply.</p>
                        <div className="grid grid-cols-2 gap-2">
                            {CONTENT_GOALS.map(goal => (
                                <label key={goal} className={`p-4 border rounded-md cursor-pointer text-sm flex items-center ${formData.contentGoals.includes(goal) ? 'border-primary bg-primary/10' : ''}`}>
                                    <Checkbox 
                                        checked={formData.contentGoals.includes(goal)} 
                                        onCheckedChange={checked => {
                                            const newGoals = checked ? [...formData.contentGoals, goal] : formData.contentGoals.filter(g => g !== goal);
                                            setFormData({...formData, contentGoals: newGoals});
                                        }}
                                        className="mr-2"
                                    />
                                    {goal}
                                </label>
                            ))}
                        </div>
                    </div>
                )}
              </motion.div>
            </AnimatePresence>
          </CardContent>
        </Card>
        
        {/* Navigation */}
        <div className="mt-8 flex justify-between">
          <Button variant="ghost" onClick={handleBack} disabled={currentStep === 0}>
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Button onClick={handleNext} disabled={isSubmitting}>
            {currentStep === steps.length - 1 ? "Finish" : "Next"}
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
} 
