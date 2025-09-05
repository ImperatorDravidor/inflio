"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  IconUser,
  IconBell,
  IconShield,
  IconVideo,
  IconBrandStripe,
  IconDeviceMobile,
  IconCheck,
  IconDatabase,
  IconDownload,
  IconTrash,
  IconSparkles,
  IconRefresh
} from "@tabler/icons-react"
import { toast } from "sonner"
import { AnimatedBackground } from "@/components/animated-background"
import { UsageService } from "@/lib/services"
import type { UsageData } from "@/lib/usage-service"
import { useUser } from "@clerk/nextjs"
import Link from "next/link"

export default function SettingsPage() {
  const { user } = useUser()
  const [loading, setLoading] = useState(false)
  const [usageData, setUsageData] = useState<UsageData>({
    used: 0,
    limit: 25,
    plan: 'basic',
    resetDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString()
  })
  const [settings, setSettings] = useState({
    // Account
    email: user?.primaryEmailAddress?.emailAddress || "",
    username: user?.username || user?.firstName || "",
    language: "en",
    timezone: "UTC-5",
    
    // Preferences
    autoProcessing: true,
    defaultClipDuration: 60,
    defaultBlogStyle: "professional",
    videoQuality: "high",
    
    // Notifications
    emailNotifications: true,
    projectUpdates: true,
    weeklyDigest: true,
    marketingEmails: false,
    
    // Security
    twoFactorEnabled: false,
    sessionTimeout: 30,
    
    // Billing
    plan: "basic",
    billingEmail: user?.primaryEmailAddress?.emailAddress || "",
    autoRenew: true
  })

  useEffect(() => {
    // Load usage data
    const usage = UsageService.getUsage()
    setUsageData(usage)
    
    // Update settings with user data
    if (user) {
      setSettings(prev => ({ 
        ...prev, 
        plan: usage.plan,
        email: user.primaryEmailAddress?.emailAddress || "",
        username: user.username || user.firstName || "",
        billingEmail: user.primaryEmailAddress?.emailAddress || ""
      }))
    }
    
    // Listen for usage updates
    const handleUsageUpdate = (e: CustomEvent<UsageData>) => {
      setUsageData(e.detail)
      setSettings(prev => ({ ...prev, plan: e.detail.plan }))
    }
    
    window.addEventListener('usageUpdate', handleUsageUpdate as EventListener)
    
    return () => {
      window.removeEventListener('usageUpdate', handleUsageUpdate as EventListener)
    }
  }, [user])

  const handleSave = async (section: string) => {
    setLoading(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    setLoading(false)
    toast.success(`${section} settings saved successfully!`)
  }

  const handleExportData = () => {
    toast.info("Preparing your data export...")
    // Simulate export
    setTimeout(() => {
      toast.success("Your data has been exported successfully!")
    }, 2000)
  }

  const handleDeleteAccount = () => {
    if (confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
      toast.error("Account deletion requested. You will receive a confirmation email.")
    }
  }

  return (
    <div className="relative">
      <AnimatedBackground variant="subtle" />
      
      <div className="relative max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground mt-1">
            Manage your account settings and preferences
          </p>
        </div>

        {/* Settings Tabs */}
        <Tabs defaultValue="account" className="space-y-6">
          <TabsList className="grid grid-cols-5 w-full">
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="preferences">Preferences</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="billing">Billing</TabsTrigger>
          </TabsList>

          {/* Account Settings */}
          <TabsContent value="account" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IconUser className="h-5 w-5" />
                  Account Information
                </CardTitle>
                <CardDescription>
                  Update your account details and preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input 
                      id="email" 
                      type="email"
                      value={settings.email}
                      onChange={(e) => setSettings({...settings, email: e.target.value})}
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="username">Username</Label>
                    <Input 
                      id="username"
                      value={settings.username}
                      onChange={(e) => setSettings({...settings, username: e.target.value})}
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="language">Language</Label>
                    <Select 
                      value={settings.language}
                      onValueChange={(value) => setSettings({...settings, language: value})}
                    >
                      <SelectTrigger id="language">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="es">Spanish</SelectItem>
                        <SelectItem value="fr">French</SelectItem>
                        <SelectItem value="de">German</SelectItem>
                        <SelectItem value="ja">Japanese</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="timezone">Timezone</Label>
                    <Select 
                      value={settings.timezone}
                      onValueChange={(value) => setSettings({...settings, timezone: value})}
                    >
                      <SelectTrigger id="timezone">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="UTC-8">Pacific Time (UTC-8)</SelectItem>
                        <SelectItem value="UTC-5">Eastern Time (UTC-5)</SelectItem>
                        <SelectItem value="UTC+0">London (UTC+0)</SelectItem>
                        <SelectItem value="UTC+1">Central Europe (UTC+1)</SelectItem>
                        <SelectItem value="UTC+9">Tokyo (UTC+9)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <Separator />
                
                <div className="flex justify-between">
                  <Button 
                    onClick={() => handleSave("Account")}
                    disabled={loading}
                  >
                    {loading ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Data Management */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IconDatabase className="h-5 w-5" />
                  Data Management
                </CardTitle>
                <CardDescription>
                  Export your data or delete your account
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg border">
                  <div>
                    <h4 className="font-medium">Export Your Data</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Download all your projects, settings, and content
                    </p>
                  </div>
                  <Button variant="outline" onClick={handleExportData}>
                    <IconDownload className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>
                
                <Link href="/settings/reset-usage" className="block">
                  <div className="flex items-center justify-between p-4 rounded-lg border border-orange-500/50 hover:border-orange-500 transition-colors cursor-pointer">
                    <div>
                      <h4 className="font-medium text-orange-600">Reset Usage Limit</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Reset your monthly video processing limit (temporary fix)
                      </p>
                    </div>
                    <IconRefresh className="h-5 w-5 text-orange-600" />
                  </div>
                </Link>

                <Link href="/settings/reset-onboarding" className="block">
                  <div className="flex items-center justify-between p-4 rounded-lg border border-blue-500/50 hover:border-blue-500 transition-colors cursor-pointer">
                    <div>
                      <h4 className="font-medium text-blue-600">Reset Onboarding</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Test the onboarding flow again (for developers)
                      </p>
                    </div>
                    <IconRefresh className="h-5 w-5 text-blue-600" />
                  </div>
                </Link>
                
                <div className="flex items-center justify-between p-4 rounded-lg border border-destructive/50">
                  <div>
                    <h4 className="font-medium text-destructive">Delete Account</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Permanently delete your account and all data
                    </p>
                  </div>
                  <Button 
                    variant="destructive" 
                    onClick={handleDeleteAccount}
                  >
                    <IconTrash className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Preferences */}
          <TabsContent value="preferences" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IconVideo className="h-5 w-5" />
                  Processing Preferences
                </CardTitle>
                <CardDescription>
                  Configure default settings for video processing
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Auto-Processing</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically start processing after upload
                    </p>
                  </div>
                  <Switch 
                    checked={settings.autoProcessing}
                    onCheckedChange={(checked) => setSettings({...settings, autoProcessing: checked})}
                  />
                </div>
                
                <Separator />
                
                <div className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="clipDuration">Default Clip Duration</Label>
                    <Select 
                      value={settings.defaultClipDuration.toString()}
                      onValueChange={(value) => setSettings({...settings, defaultClipDuration: parseInt(value)})}
                    >
                      <SelectTrigger id="clipDuration">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="30">30 seconds</SelectItem>
                        <SelectItem value="60">60 seconds</SelectItem>
                        <SelectItem value="90">90 seconds</SelectItem>
                        <SelectItem value="120">120 seconds</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="blogStyle">Default Blog Style</Label>
                    <Select 
                      value={settings.defaultBlogStyle}
                      onValueChange={(value) => setSettings({...settings, defaultBlogStyle: value})}
                    >
                      <SelectTrigger id="blogStyle">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="professional">Professional</SelectItem>
                        <SelectItem value="casual">Casual</SelectItem>
                        <SelectItem value="technical">Technical</SelectItem>
                        <SelectItem value="educational">Educational</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="quality">Video Processing Quality</Label>
                    <Select 
                      value={settings.videoQuality}
                      onValueChange={(value) => setSettings({...settings, videoQuality: value})}
                    >
                      <SelectTrigger id="quality">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low (Faster)</SelectItem>
                        <SelectItem value="medium">Medium (Balanced)</SelectItem>
                        <SelectItem value="high">High (Best Quality)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <Separator />
                
                <Button onClick={() => handleSave("Preferences")} disabled={loading}>
                  {loading ? "Saving..." : "Save Preferences"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications */}
          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IconBell className="h-5 w-5" />
                  Notification Preferences
                </CardTitle>
                <CardDescription>
                  Choose what notifications you want to receive
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Email Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive notifications via email
                      </p>
                    </div>
                    <Switch 
                      checked={settings.emailNotifications}
                      onCheckedChange={(checked) => setSettings({...settings, emailNotifications: checked})}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Project Updates</Label>
                      <p className="text-sm text-muted-foreground">
                        Get notified when processing completes
                      </p>
                    </div>
                    <Switch 
                      checked={settings.projectUpdates}
                      onCheckedChange={(checked) => setSettings({...settings, projectUpdates: checked})}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Weekly Digest</Label>
                      <p className="text-sm text-muted-foreground">
                        Summary of your weekly activity
                      </p>
                    </div>
                    <Switch 
                      checked={settings.weeklyDigest}
                      onCheckedChange={(checked) => setSettings({...settings, weeklyDigest: checked})}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Marketing Emails</Label>
                      <p className="text-sm text-muted-foreground">
                        Product updates and special offers
                      </p>
                    </div>
                    <Switch 
                      checked={settings.marketingEmails}
                      onCheckedChange={(checked) => setSettings({...settings, marketingEmails: checked})}
                    />
                  </div>
                </div>
                
                <Separator />
                
                <Button onClick={() => handleSave("Notifications")} disabled={loading}>
                  {loading ? "Saving..." : "Save Preferences"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security */}
          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IconShield className="h-5 w-5" />
                  Security Settings
                </CardTitle>
                <CardDescription>
                  Manage your account security and privacy
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-lg border">
                    <div className="space-y-0.5">
                      <Label className="text-base">Two-Factor Authentication</Label>
                      <p className="text-sm text-muted-foreground">
                        Add an extra layer of security to your account
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {settings.twoFactorEnabled ? (
                        <Badge variant="default" className="gap-1">
                          <IconCheck className="h-3 w-3" />
                          Enabled
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Disabled</Badge>
                      )}
                      <Button 
                        variant="outline"
                        onClick={() => setSettings({...settings, twoFactorEnabled: !settings.twoFactorEnabled})}
                      >
                        {settings.twoFactorEnabled ? "Disable" : "Enable"}
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Change Password</Label>
                    <div className="grid gap-2">
                      <Input type="password" placeholder="Current password" />
                      <Input type="password" placeholder="New password" />
                      <Input type="password" placeholder="Confirm new password" />
                    </div>
                    <Button className="mt-2">Update Password</Button>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-2">
                    <Label htmlFor="sessionTimeout">Session Timeout</Label>
                    <Select 
                      value={settings.sessionTimeout.toString()}
                      onValueChange={(value) => setSettings({...settings, sessionTimeout: parseInt(value)})}
                    >
                      <SelectTrigger id="sessionTimeout">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="15">15 minutes</SelectItem>
                        <SelectItem value="30">30 minutes</SelectItem>
                        <SelectItem value="60">1 hour</SelectItem>
                        <SelectItem value="120">2 hours</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-muted-foreground">
                      Automatically log out after this period of inactivity
                    </p>
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-4">
                  <h4 className="text-sm font-medium">Active Sessions</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <IconDeviceMobile className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium text-sm">Windows PC</p>
                          <p className="text-xs text-muted-foreground">Current session</p>
                        </div>
                      </div>
                      <Badge variant="secondary" className="text-xs">Active</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Billing */}
          <TabsContent value="billing" className="space-y-6" id="upgrade">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IconBrandStripe className="h-5 w-5" />
                  Billing & Subscription
                </CardTitle>
                <CardDescription>
                  Manage your subscription and payment methods
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Current Plan */}
                <div className="p-4 rounded-lg border bg-gradient-to-r from-primary/10 to-accent/10">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold flex items-center gap-2">
                      <IconSparkles className="h-5 w-5 text-primary" />
                      {usageData.plan.charAt(0).toUpperCase() + usageData.plan.slice(1)} Plan
                    </h4>
                    <Badge>Active</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    {usageData.plan === 'basic' ? 'Free' : usageData.plan === 'pro' ? '$49/month' : 'Custom pricing'} • Resets {new Date(usageData.resetDate).toLocaleDateString()}
                  </p>
                  
                  {/* Usage Stats */}
                  <div className="space-y-3 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span>Monthly Video Usage</span>
                      <span className="font-medium">{usageData.used} / {usageData.limit}</span>
                    </div>
                    <Progress value={UsageService.getUsagePercentage()} className="h-2" />
                    <p className="text-xs text-muted-foreground">
                      {UsageService.getRemainingVideos()} videos remaining this month
                    </p>
                  </div>
                  
                  <div className="flex gap-2">
                    {usageData.plan === 'basic' && (
                      <Button 
                        className="w-full gradient-premium text-white" 
                        size="lg"
                        onClick={() => window.open('https://inflio.com/pricing', '_blank')}
                      >
                        Upgrade to Pro
                      </Button>
                    )}
                    {usageData.plan !== 'basic' && (
                      <>
                        <Button variant="outline" size="sm">Change Plan</Button>
                        <Button variant="outline" size="sm">Cancel Subscription</Button>
                      </>
                    )}
                  </div>
                </div>
                
                {/* Available Plans */}
                <div className="space-y-4">
                  <h4 className="text-sm font-medium">Available Plans</h4>
                  <div className="grid gap-4">
                    {/* Basic Plan */}
                    <div className={`p-4 rounded-lg border ${usageData.plan === 'basic' ? 'border-primary bg-primary/5' : ''}`}>
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h5 className="font-semibold">Basic Plan</h5>
                          <p className="text-sm text-muted-foreground">Perfect for getting started</p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold">Free</p>
                        </div>
                      </div>
                      <ul className="space-y-1 text-sm text-muted-foreground">
                        <li className="flex items-center gap-2">
                          <IconCheck className="h-4 w-4 text-green-500" />
                          25 videos per month
                        </li>
                        <li className="flex items-center gap-2">
                          <IconCheck className="h-4 w-4 text-green-500" />
                          Basic AI features
                        </li>
                        <li className="flex items-center gap-2">
                          <IconCheck className="h-4 w-4 text-green-500" />
                          Standard support
                        </li>
                      </ul>
                      {usageData.plan === 'basic' && (
                        <Badge className="mt-3" variant="secondary">Current Plan</Badge>
                      )}
                    </div>
                    
                    {/* Pro Plan */}
                    <div className={`p-4 rounded-lg border ${usageData.plan === 'pro' ? 'border-primary bg-primary/5' : ''}`}>
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h5 className="font-semibold">Pro Plan</h5>
                          <p className="text-sm text-muted-foreground">For content creators</p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold">$49<span className="text-sm font-normal">/mo</span></p>
                        </div>
                      </div>
                      <ul className="space-y-1 text-sm text-muted-foreground">
                        <li className="flex items-center gap-2">
                          <IconCheck className="h-4 w-4 text-green-500" />
                          100 videos per month
                        </li>
                        <li className="flex items-center gap-2">
                          <IconCheck className="h-4 w-4 text-green-500" />
                          Advanced AI features
                        </li>
                        <li className="flex items-center gap-2">
                          <IconCheck className="h-4 w-4 text-green-500" />
                          Priority support
                        </li>
                        <li className="flex items-center gap-2">
                          <IconCheck className="h-4 w-4 text-green-500" />
                          Custom branding
                        </li>
                      </ul>
                      {usageData.plan === 'pro' ? (
                        <Badge className="mt-3" variant="secondary">Current Plan</Badge>
                      ) : (
                        <Button className="mt-3 w-full" variant="outline">
                          Upgrade to Pro
                        </Button>
                      )}
                    </div>
                    
                    {/* Enterprise Plan */}
                    <div className={`p-4 rounded-lg border ${usageData.plan === 'enterprise' ? 'border-primary bg-primary/5' : ''}`}>
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h5 className="font-semibold">Enterprise Plan</h5>
                          <p className="text-sm text-muted-foreground">For teams and businesses</p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold">Custom</p>
                        </div>
                      </div>
                      <ul className="space-y-1 text-sm text-muted-foreground">
                        <li className="flex items-center gap-2">
                          <IconCheck className="h-4 w-4 text-green-500" />
                          Unlimited videos
                        </li>
                        <li className="flex items-center gap-2">
                          <IconCheck className="h-4 w-4 text-green-500" />
                          All AI features
                        </li>
                        <li className="flex items-center gap-2">
                          <IconCheck className="h-4 w-4 text-green-500" />
                          Dedicated support
                        </li>
                        <li className="flex items-center gap-2">
                          <IconCheck className="h-4 w-4 text-green-500" />
                          API access
                        </li>
                        <li className="flex items-center gap-2">
                          <IconCheck className="h-4 w-4 text-green-500" />
                          Team collaboration
                        </li>
                      </ul>
                      {usageData.plan === 'enterprise' ? (
                        <Badge className="mt-3" variant="secondary">Current Plan</Badge>
                      ) : (
                        <Button className="mt-3 w-full" variant="outline">
                          Contact Sales
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-4">
                  <h4 className="text-sm font-medium">Payment Method</h4>
                  <div className="flex items-center justify-between p-4 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-16 rounded bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center text-white text-xs font-bold">
                        VISA
                      </div>
                      <div>
                        <p className="font-medium">•••• •••• •••• 4242</p>
                        <p className="text-xs text-muted-foreground">Expires 12/25</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">Update</Button>
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Auto-Renewal</Label>
                      <p className="text-sm text-muted-foreground">
                        Automatically renew your subscription
                      </p>
                    </div>
                    <Switch 
                      checked={settings.autoRenew}
                      onCheckedChange={(checked) => setSettings({...settings, autoRenew: checked})}
                    />
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-4">
                  <h4 className="text-sm font-medium">Billing History</h4>
                  <div className="space-y-2">
                    {[
                      { date: "Feb 1, 2024", amount: "$29.00", status: "Paid" },
                      { date: "Jan 1, 2024", amount: "$29.00", status: "Paid" },
                      { date: "Dec 1, 2023", amount: "$29.00", status: "Paid" },
                    ].map((invoice, i) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-lg border">
                        <div>
                          <p className="font-medium text-sm">{invoice.date}</p>
                          <p className="text-xs text-muted-foreground">Pro Plan</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-medium">{invoice.amount}</span>
                          <Button variant="ghost" size="sm">
                            <IconDownload className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
} 
