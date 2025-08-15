"use client"

import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Sparkles, 
  Image, 
  RefreshCw, 
  Video,
  Calendar,
  Settings,
  Wand2,
  Users,
  FileText,
  ArrowRight
} from 'lucide-react'

export default function TestFeaturesPage() {
  const router = useRouter()

  const features = [
    {
      title: 'Onboarding Wizard',
      description: 'Complete 7-step onboarding flow with persona setup',
      icon: Sparkles,
      action: () => router.push('/onboarding'),
      status: 'completed',
      color: 'text-purple-500'
    },
    {
      title: 'Reset Onboarding',
      description: 'Reset your onboarding status to test the flow again',
      icon: RefreshCw,
      action: () => router.push('/settings/reset-onboarding'),
      status: 'utility',
      color: 'text-orange-500'
    },
    {
      title: 'AI Thumbnail Generator',
      description: 'Generate platform-optimized thumbnails with AI',
      icon: Image,
      action: () => alert('Select a project first, then navigate to /projects/[id]/thumbnails'),
      status: 'completed',
      color: 'text-blue-500'
    },
    {
      title: 'Enhanced Thumbnail Features',
      description: 'Smart prompts, variations, magic enhance, competitor analysis',
      icon: Wand2,
      action: () => alert('Available in project thumbnail page'),
      status: 'completed',
      color: 'text-indigo-500'
    },
    {
      title: 'Posts Feature',
      description: 'Generate social media posts with AI (Coming Soon)',
      icon: FileText,
      action: () => alert('Posts feature - Next to implement'),
      status: 'pending',
      color: 'text-gray-400'
    },
    {
      title: 'Long-form Workflow',
      description: 'Video viewer with transcript and chapters (Coming Soon)',
      icon: Video,
      action: () => alert('Long-form workflow - Coming soon'),
      status: 'pending',
      color: 'text-gray-400'
    },
    {
      title: 'Smart Scheduling',
      description: 'Stage, schedule, and publish content (Coming Soon)',
      icon: Calendar,
      action: () => alert('Scheduling - Coming soon'),
      status: 'pending',
      color: 'text-gray-400'
    },
    {
      title: 'Persona Training',
      description: 'Train AI models with your face for consistent branding',
      icon: Users,
      action: () => alert('Upload photos in onboarding to create personas'),
      status: 'documented',
      color: 'text-green-500'
    }
  ]

  const getStatusBadge = (status: string) => {
    const badges = {
      completed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      pending: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
      documented: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      utility: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300'
    }
    return badges[status as keyof typeof badges] || badges.pending
  }

  const getStatusText = (status: string) => {
    const texts = {
      completed: 'Ready to Use',
      pending: 'Coming Soon',
      documented: 'Documented',
      utility: 'Utility'
    }
    return texts[status as keyof typeof texts] || 'Pending'
  }

  return (
    <div className="container mx-auto p-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Test New Features</h1>
        <p className="text-muted-foreground">
          Access and test all the newly implemented features in Inflio
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((feature, index) => {
          const Icon = feature.icon
          return (
            <Card 
              key={index} 
              className={`hover:shadow-lg transition-all cursor-pointer ${
                feature.status === 'pending' ? 'opacity-60' : ''
              }`}
              onClick={feature.action}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className={`p-2 rounded-lg bg-background ${feature.color}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${getStatusBadge(feature.status)}`}>
                    {getStatusText(feature.status)}
                  </span>
                </div>
                <CardTitle className="mt-4">{feature.title}</CardTitle>
                <CardDescription>{feature.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  variant="ghost" 
                  className="w-full justify-between"
                  disabled={feature.status === 'pending'}
                >
                  Test Feature
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="mt-12 p-6 bg-muted rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Quick Start Guide</h2>
        <ol className="space-y-3 text-sm">
          <li className="flex gap-3">
            <span className="font-semibold text-primary">1.</span>
            <div>
              <strong>Reset Onboarding:</strong> Go to the reset page to clear your onboarding status
            </div>
          </li>
          <li className="flex gap-3">
            <span className="font-semibold text-primary">2.</span>
            <div>
              <strong>Complete Onboarding:</strong> Experience the full 7-step wizard with photo uploads
            </div>
          </li>
          <li className="flex gap-3">
            <span className="font-semibold text-primary">3.</span>
            <div>
              <strong>Create a Project:</strong> Upload a video in the dashboard to create a project
            </div>
          </li>
          <li className="flex gap-3">
            <span className="font-semibold text-primary">4.</span>
            <div>
              <strong>Test Thumbnails:</strong> Navigate to <code className="bg-background px-2 py-1 rounded">/projects/[id]/thumbnails</code> to test the AI thumbnail generator
            </div>
          </li>
        </ol>
      </div>

      <div className="mt-8 p-6 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
        <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">API Endpoints Available</h3>
        <ul className="text-sm space-y-1 text-blue-800 dark:text-blue-200">
          <li>• <code>/api/thumbnail/generate-enhanced</code> - Main thumbnail generation</li>
          <li>• <code>/api/thumbnail/smart-prompt</code> - AI prompt suggestions</li>
          <li>• <code>/api/thumbnail/variations</code> - Generate variations</li>
          <li>• <code>/api/thumbnail/magic-enhance</code> - One-click enhancement</li>
          <li>• <code>/api/thumbnail/batch-generate</code> - Bulk generation</li>
          <li>• <code>/api/thumbnail/competitor-analysis</code> - Analyze competitors</li>
          <li>• <code>/api/reset-onboarding</code> - Reset onboarding status</li>
        </ul>
      </div>
    </div>
  )
}