"use client"

import { Shield, Lock, FileText, AlertCircle, Check, ExternalLink } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { Card } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface LegalConsentStepProps {
  data: any
  onChange: (updates: any) => void
}

export function LegalConsentStep({ data, onChange }: LegalConsentStepProps) {
  const consentRepurpose = data.consentRepurpose || false
  const mediaRelease = data.mediaRelease || false
  const privacyAccepted = data.privacyAccepted || false
  
  const allAccepted = consentRepurpose && mediaRelease && privacyAccepted

  return (
    <div className="space-y-6">
      {/* Security Promise */}
      <Card className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center flex-shrink-0">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="font-semibold mb-2">Your Data is Safe</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Your content and data are always yours</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>We never sell or share your information</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>You can export or delete your data anytime</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Bank-level encryption for all data</span>
              </li>
            </ul>
          </div>
        </div>
      </Card>

      {/* Legal Agreements */}
      <div className="space-y-4">
        {/* Content Repurposing */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className={cn(
            "p-6 transition-all",
            consentRepurpose && "border-green-500/50 bg-green-50/50 dark:bg-green-950/20"
          )}>
            <label className="flex items-start space-x-3 cursor-pointer">
              <Checkbox
                checked={consentRepurpose}
                onCheckedChange={(checked) => onChange({ consentRepurpose: checked })}
                className="mt-1"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <FileText className="h-4 w-4 text-primary" />
                  <p className="font-medium">Content Repurposing Consent</p>
                  {consentRepurpose && (
                    <Badge variant="outline" className="ml-auto">
                      <Check className="h-3 w-3 mr-1" />
                      Accepted
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  I consent to Inflio using AI to repurpose my uploaded content into various formats 
                  (clips, blogs, social posts, thumbnails) to help me create more content efficiently.
                </p>
                <div className="p-3 bg-muted/50 rounded-lg space-y-1">
                  <p className="text-xs font-medium">What this means:</p>
                  <ul className="text-xs text-muted-foreground space-y-1 ml-4">
                    <li>• AI will analyze your videos to create clips and highlights</li>
                    <li>• Generate blog posts and social media content from transcripts</li>
                    <li>• Create thumbnails and graphics based on your content</li>
                    <li>• All generated content is yours to use commercially</li>
                  </ul>
                </div>
              </div>
            </label>
          </Card>
        </motion.div>

        {/* Media Release */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className={cn(
            "p-6 transition-all",
            mediaRelease && "border-green-500/50 bg-green-50/50 dark:bg-green-950/20"
          )}>
            <label className="flex items-start space-x-3 cursor-pointer">
              <Checkbox
                checked={mediaRelease}
                onCheckedChange={(checked) => onChange({ mediaRelease: checked })}
                className="mt-1"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Lock className="h-4 w-4 text-primary" />
                  <p className="font-medium">Media Release for AI Likeness</p>
                  {mediaRelease && (
                    <Badge variant="outline" className="ml-auto">
                      <Check className="h-3 w-3 mr-1" />
                      Accepted
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  I grant permission for AI to use my likeness from uploaded photos to generate 
                  personalized thumbnails and content featuring me. This can be revoked anytime.
                </p>
                <div className="p-3 bg-muted/50 rounded-lg space-y-1">
                  <p className="text-xs font-medium">What this means:</p>
                  <ul className="text-xs text-muted-foreground space-y-1 ml-4">
                    <li>• AI will train on your photos to create a persona model</li>
                    <li>• Generate thumbnails with you in them</li>
                    <li>• Create social media graphics featuring your likeness</li>
                    <li>• You can delete your persona and all photos anytime</li>
                  </ul>
                </div>
                <Alert className="mt-3">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    Your photos are encrypted and never shared. The AI model is private to your account only.
                  </AlertDescription>
                </Alert>
              </div>
            </label>
          </Card>
        </motion.div>

        {/* Privacy Policy & Terms */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className={cn(
            "p-6 transition-all",
            privacyAccepted && "border-green-500/50 bg-green-50/50 dark:bg-green-950/20"
          )}>
            <label className="flex items-start space-x-3 cursor-pointer">
              <Checkbox
                checked={privacyAccepted}
                onCheckedChange={(checked) => onChange({ privacyAccepted: checked })}
                className="mt-1"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Shield className="h-4 w-4 text-primary" />
                  <p className="font-medium">Privacy Policy & Terms of Service</p>
                  {privacyAccepted && (
                    <Badge variant="outline" className="ml-auto">
                      <Check className="h-3 w-3 mr-1" />
                      Accepted
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  I have read and accept the Privacy Policy and Terms of Service.
                </p>
                <div className="flex gap-4">
                  <Link 
                    href="/privacy" 
                    target="_blank"
                    className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                  >
                    Read Privacy Policy
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                  <Link 
                    href="/terms" 
                    target="_blank"
                    className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                  >
                    Read Terms of Service
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            </label>
          </Card>
        </motion.div>
      </div>

      {/* Status Alert */}
      {!allAccepted && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            All agreements must be accepted to use Inflio's AI features. 
            Please review and accept the terms above.
          </AlertDescription>
        </Alert>
      )}

      {allAccepted && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring' }}
        >
          <Alert className="border-green-500 bg-green-50 dark:bg-green-950/20">
            <Check className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-900 dark:text-green-100">
              Perfect! All legal requirements are accepted. You're ready to start creating with AI.
            </AlertDescription>
          </Alert>
        </motion.div>
      )}

      {/* Additional Information */}
      <Card className="p-6 bg-muted/50">
        <h4 className="font-medium mb-3 flex items-center gap-2">
          <Shield className="h-4 w-4" />
          Your Rights & Control
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            <p className="font-medium">You can always:</p>
            <ul className="space-y-1 text-muted-foreground ml-4">
              <li>• Export all your data</li>
              <li>• Delete specific content</li>
              <li>• Revoke AI permissions</li>
              <li>• Close your account</li>
            </ul>
          </div>
          <div className="space-y-2">
            <p className="font-medium">We will never:</p>
            <ul className="space-y-1 text-muted-foreground ml-4">
              <li>• Sell your data</li>
              <li>• Share without permission</li>
              <li>• Use for other users</li>
              <li>• Keep data after deletion</li>
            </ul>
          </div>
        </div>
      </Card>

      {/* Contact Support */}
      <div className="text-center p-4 bg-muted/30 rounded-lg">
        <p className="text-sm text-muted-foreground">
          Questions about privacy or data handling?
        </p>
        <Button variant="link" className="text-primary">
          Contact our Privacy Team
        </Button>
      </div>
    </div>
  )
}