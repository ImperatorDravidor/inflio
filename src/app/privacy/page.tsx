"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { motion } from "framer-motion"
import { ArrowLeft, Layers, Shield, Lock, Eye, Users, Globe, Mail, Calendar } from "lucide-react"

export default function PrivacyPolicyPage() {
  const lastUpdated = "December 13, 2024"
  const effectiveDate = "December 15, 2024"

  const sections = [
    {
      id: "introduction",
      title: "Introduction",
      icon: <Shield className="h-5 w-5" />,
      content: `Welcome to Inflio ("we," "our," or "us"). We are committed to protecting your personal information and your right to privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our service.`
    },
    {
      id: "information-collection",
      title: "Information We Collect",
      icon: <Eye className="h-5 w-5" />,
      content: `We collect information you provide directly to us, such as:
      
      • Account Information: Name, email address, password, and profile information
      • Content Data: Videos, images, text, and other content you upload or create
      • Payment Information: Billing details and transaction history (processed securely via Stripe)
      • Communication Data: Messages, feedback, and support requests
      • Usage Data: How you interact with our services, features used, and preferences`
    },
    {
      id: "automatic-collection",
      title: "Information Automatically Collected",
      icon: <Globe className="h-5 w-5" />,
      content: `When you use Inflio, we automatically collect:
      
      • Device Information: IP address, browser type, operating system, and device identifiers
      • Log Data: Access times, pages viewed, and actions taken within the app
      • Cookies and Similar Technologies: To enhance user experience and analyze usage patterns
      • Analytics Data: Performance metrics and error reports to improve our service`
    },
    {
      id: "use-of-information",
      title: "How We Use Your Information",
      icon: <Users className="h-5 w-5" />,
      content: `We use the collected information to:
      
      • Provide and maintain our services
      • Process your content with AI tools (transcription, clip generation, etc.)
      • Personalize your experience and improve our algorithms
      • Process payments and manage subscriptions
      • Send service-related communications and updates
      • Respond to support requests and user inquiries
      • Analyze usage patterns to enhance features
      • Comply with legal obligations and protect our rights`
    },
    {
      id: "ai-processing",
      title: "AI and Content Processing",
      icon: <Lock className="h-5 w-5" />,
      content: `Your content is processed using AI services including:
      
      • OpenAI: For transcription (Whisper), content generation (GPT-4), and image creation (DALL-E)
      • Content Analysis: To identify key moments and generate clips
      • Data Retention: Processed content is stored securely and deleted according to your preferences
      • No Training: Your content is NOT used to train AI models without explicit consent
      • Processing Location: Content processing occurs on secure servers with encryption`
    },
    {
      id: "data-sharing",
      title: "Information Sharing and Disclosure",
      icon: <Users className="h-5 w-5" />,
      content: `We share your information only in these circumstances:
      
      • Service Providers: With trusted third parties who assist in operating our service
      • Social Media Platforms: When you authorize publishing to your connected accounts
      • Legal Requirements: If required by law or to protect rights and safety
      • Business Transfers: In connection with mergers, acquisitions, or asset sales
      • Consent: With your explicit consent for specific purposes
      
      We NEVER sell your personal information to third parties.`
    },
    {
      id: "data-security",
      title: "Data Security",
      icon: <Lock className="h-5 w-5" />,
      content: `We implement robust security measures including:
      
      • Encryption: All data is encrypted in transit (TLS/SSL) and at rest
      • Access Controls: Role-based access and authentication requirements
      • Regular Audits: Security assessments and vulnerability testing
      • Secure Infrastructure: Cloud services with SOC 2 compliance
      • Incident Response: Procedures for detecting and responding to breaches
      • Employee Training: Regular security awareness training`
    },
    {
      id: "your-rights",
      title: "Your Rights and Choices",
      icon: <Shield className="h-5 w-5" />,
      content: `You have the right to:
      
      • Access: Request a copy of your personal information
      • Correction: Update or correct inaccurate information
      • Deletion: Request deletion of your account and associated data
      • Portability: Export your data in a machine-readable format
      • Opt-out: Unsubscribe from marketing communications
      • Restrict Processing: Limit how we use your information
      • Object: Object to certain processing activities`
    },
    {
      id: "cookies",
      title: "Cookies and Tracking",
      icon: <Eye className="h-5 w-5" />,
      content: `We use cookies and similar technologies for:
      
      • Essential Functions: Authentication and security
      • Preferences: Remembering your settings and choices
      • Analytics: Understanding usage patterns (via privacy-focused tools)
      • Performance: Optimizing loading times and functionality
      
      You can manage cookie preferences through your browser settings.`
    },
    {
      id: "third-party",
      title: "Third-Party Services",
      icon: <Globe className="h-5 w-5" />,
      content: `We integrate with third-party services including:
      
      • Clerk: Authentication and user management
      • Stripe: Secure payment processing
      • Supabase: Database and file storage
      • OpenAI: AI-powered features
      • Vercel: Hosting and deployment
      • Social Media APIs: For content publishing
      
      Each service has its own privacy policy. We recommend reviewing them.`
    },
    {
      id: "children",
      title: "Children's Privacy",
      icon: <Users className="h-5 w-5" />,
      content: `Inflio is not intended for users under 18 years of age. We do not knowingly collect personal information from children. If we discover that a child has provided us with personal information, we will delete such information from our systems.`
    },
    {
      id: "international",
      title: "International Data Transfers",
      icon: <Globe className="h-5 w-5" />,
      content: `Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place for international transfers, including:
      
      • Standard contractual clauses
      • Privacy Shield frameworks (where applicable)
      • Adequacy decisions by data protection authorities`
    },
    {
      id: "retention",
      title: "Data Retention",
      icon: <Calendar className="h-5 w-5" />,
      content: `We retain your information for as long as necessary to:
      
      • Provide our services
      • Comply with legal obligations
      • Resolve disputes
      • Enforce our agreements
      
      When you delete your account, we remove your personal information within 30 days, except where retention is required by law.`
    },
    {
      id: "changes",
      title: "Changes to This Policy",
      icon: <Calendar className="h-5 w-5" />,
      content: `We may update this Privacy Policy from time to time. We will notify you of material changes by:
      
      • Posting the new policy on this page
      • Updating the "Last Updated" date
      • Sending email notifications for significant changes
      • Requiring acknowledgment for substantial modifications`
    },
    {
      id: "contact",
      title: "Contact Us",
      icon: <Mail className="h-5 w-5" />,
      content: `If you have questions about this Privacy Policy or our practices:
      
      • Email: privacy@inflio.com
      • Support: support@inflio.com
      • Address: Inflio, Inc., San Francisco, CA 94105
      • Data Protection Officer: dpo@inflio.com
      
      We aim to respond to all inquiries within 48 hours.`
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center">
              <Link href="/" className="flex items-center space-x-2">
                <Layers className="h-6 w-6 text-primary" />
                <span className="text-xl font-bold">Inflio</span>
              </Link>
            </div>
            
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="py-16 sm:py-20">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mx-auto max-w-3xl text-center"
            >
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Shield className="h-6 w-6" />
              </div>
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
                Privacy Policy
              </h1>
              <p className="mt-4 text-lg text-muted-foreground">
                Your privacy is important to us. This policy explains how we handle your data.
              </p>
              <div className="mt-6 flex items-center justify-center gap-4 text-sm text-muted-foreground">
                <span>Last Updated: {lastUpdated}</span>
                <span>•</span>
                <span>Effective: {effectiveDate}</span>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Table of Contents */}
      <section className="border-y bg-muted/30">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="py-8">
            <h2 className="mb-4 text-lg font-semibold">Table of Contents</h2>
            <div className="grid gap-2 sm:grid-cols-2">
              {sections.map((section) => (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {section.title}
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Content Sections */}
      <section className="py-12 sm:py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="space-y-12">
            {sections.map((section, index) => (
              <motion.div
                key={section.id}
                id={section.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        {section.icon}
                      </div>
                      <div className="flex-1">
                        <h2 className="mb-4 text-2xl font-semibold">{section.title}</h2>
                        <div className="prose prose-gray dark:prose-invert max-w-none">
                          <p className="whitespace-pre-line text-muted-foreground">
                            {section.content}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Additional Legal Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="mt-12 rounded-lg border bg-muted/50 p-6"
          >
            <h3 className="mb-3 font-semibold">California Privacy Rights</h3>
            <p className="text-sm text-muted-foreground">
              If you are a California resident, you have additional rights under the California Consumer Privacy Act (CCPA), including the right to know what personal information we collect, the right to delete your information, and the right to opt-out of the sale of your information (which we do not do).
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="mt-6 rounded-lg border bg-muted/50 p-6"
          >
            <h3 className="mb-3 font-semibold">GDPR Rights</h3>
            <p className="text-sm text-muted-foreground">
              If you are located in the European Economic Area (EEA), you have additional rights under the General Data Protection Regulation (GDPR), including the right to data portability, the right to restrict processing, and the right to lodge a complaint with your local data protection authority.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center space-x-2">
              <Layers className="h-5 w-5 text-primary" />
              <span className="font-semibold">Inflio</span>
            </div>
            <p className="text-center text-sm text-muted-foreground">
              © {new Date().getFullYear()} Inflio. All rights reserved.
            </p>
            <div className="flex space-x-6">
              <Link href="/privacy" className="text-sm text-muted-foreground hover:text-foreground">
                Privacy
              </Link>
              <Link href="/terms" className="text-sm text-muted-foreground hover:text-foreground">
                Terms
              </Link>
              <Link href="mailto:support@inflio.com" className="text-sm text-muted-foreground hover:text-foreground">
                Contact
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
} 