"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { 
  IconBrandGoogle, 
  IconBrandGithub, 
  IconVideo, 
  IconSparkles, 
  IconArrowRight,
  IconCode
} from "@tabler/icons-react"

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      toast.error("Please enter your email and password")
      return
    }
    
    setIsLoading(true)
    // Simulate authentication
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    // Set auth cookie
    document.cookie = "inflio-auth=true; path=/; max-age=86400" // 24 hours
    
    toast.success("Welcome to Inflio!")
    router.push("/projects")
  }

  const handleOAuthLogin = async (provider: string) => {
    setIsLoading(true)
    toast.info(`Logging in with ${provider}...`)
    
    // Simulate OAuth
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    // Set auth cookie
    document.cookie = "inflio-auth=true; path=/; max-age=86400" // 24 hours
    
    toast.success(`Welcome to Inflio!`)
    router.push("/projects")
  }

  const handleDevSkip = () => {
    // Set auth cookie
    document.cookie = "inflio-auth=true; path=/; max-age=86400" // 24 hours
    
    toast.info("Skipping auth for development...")
    router.push("/projects")
  }

  return (
    <div className={cn("flex flex-col gap-6 w-full max-w-sm", className)} {...props}>
      {/* Logo and Header */}
      <div className="flex flex-col items-center gap-4 mb-2">
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-violet-500 to-pink-500 blur-2xl opacity-20 animate-pulse" />
          <div className="relative flex size-16 items-center justify-center rounded-full gradient-premium shadow-xl">
            <IconVideo className="size-8 text-white" />
          </div>
        </div>
        
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome to <span className="gradient-text">Inflio</span>
          </h1>
          <p className="text-sm text-muted-foreground">
            Transform your videos into amazing content with AI
          </p>
        </div>
      </div>

      {/* Login Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              className="h-11"
              required
            />
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <a 
                href="#" 
                className="text-xs text-muted-foreground hover:text-primary transition-colors"
              >
                Forgot password?
              </a>
            </div>
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              className="h-11"
              required
            />
          </div>
        </div>
        
        <Button 
          type="submit" 
          className="w-full h-11 gradient-premium hover:opacity-90 transition-opacity"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              Signing in...
            </>
          ) : (
            <>
              Sign in
              <IconArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </form>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Or continue with
          </span>
        </div>
      </div>

      {/* OAuth Buttons */}
      <div className="grid gap-3">
        <Button 
          variant="outline" 
          type="button" 
          className="w-full h-11 hover:bg-muted transition-colors"
          onClick={() => handleOAuthLogin("Google")}
          disabled={isLoading}
        >
          <IconBrandGoogle className="mr-2 h-4 w-4" />
          Google
        </Button>
        
        <Button 
          variant="outline" 
          type="button" 
          className="w-full h-11 hover:bg-muted transition-colors"
          onClick={() => handleOAuthLogin("GitHub")}
          disabled={isLoading}
        >
          <IconBrandGithub className="mr-2 h-4 w-4" />
          GitHub
        </Button>
      </div>

      {/* Sign up link */}
      <div className="text-center text-sm">
        <span className="text-muted-foreground">
          Don't have an account?{" "}
        </span>
        <a 
          href="#" 
          className="font-semibold text-primary hover:underline transition-colors"
        >
          Sign up for free
        </a>
      </div>

      {/* Terms */}
      <div className="text-center text-xs text-muted-foreground px-4">
        By continuing, you agree to our{" "}
        <a href="/terms" className="underline underline-offset-4 hover:text-primary">
          Terms
        </a>{" "}
        and{" "}
        <a href="/privacy" className="underline underline-offset-4 hover:text-primary">
          Privacy Policy
        </a>
      </div>

      {/* Dev Skip Button */}
      {process.env.NODE_ENV === "development" && (
        <div className="relative mt-6">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-dashed" />
          </div>
          <div className="relative flex justify-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDevSkip}
              className="bg-background px-4 text-xs text-muted-foreground hover:text-primary"
            >
              <IconCode className="mr-1 h-3 w-3" />
              Skip Auth (Dev Mode)
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
