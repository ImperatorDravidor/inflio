"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { motion } from "framer-motion"
import { ArrowLeft, Layers, FileText, AlertCircle, CreditCard, Shield, Ban, Scale, Globe, Mail } from "lucide-react"

export default function TermsOfServicePage() {
  const lastUpdated = "December 13, 2024"
  const effectiveDate = "December 15, 2024"

  const sections = [
    {
      id: "acceptance",
      title: "Acceptance of Terms",
      icon: <FileText className="h-5 w-5" />,
      content: `By accessing and using Inflio ("Service"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this Service.

      These Terms apply to all visitors, users, and others who access or use the Service. By using the Service, you agree to these Terms and our Privacy Policy.`
    },
    {
      id: "description",
      title: "Service Description",
      icon: <Globe className="h-5 w-5" />,
      content: `Inflio is an AI-powered content creation platform that provides:

      • Video processing and clip generation
      • AI-powered transcription services
      • Content generation and optimization
      • Social media publishing tools
      • Analytics and performance tracking

      We reserve the right to modify, suspend, or discontinue any part of the Service at any time.`
    },
    {
      id: "account",
      title: "User Accounts",
      icon: <Shield className="h-5 w-5" />,
      content: `Account Registration:
      • You must provide accurate and complete information
      • You are responsible for maintaining account security
      • One person or entity per account
      • You must be 18+ years old to create an account

      Account Security:
      • Keep your password confidential
      • Notify us immediately of unauthorized access
      • You are responsible for all activities under your account
      • We are not liable for losses due to unauthorized access`
    },
    {
      id: "acceptable-use",
      title: "Acceptable Use Policy",
      icon: <AlertCircle className="h-5 w-5" />,
      content: `You agree NOT to use the Service to:

      • Upload illegal, harmful, or offensive content
      • Violate intellectual property rights
      • Harass, abuse, or harm others
      • Spread malware or viruses
      • Attempt to gain unauthorized access
      • Use the Service for illegal activities
      • Scrape or copy content without permission
      • Violate any applicable laws or regulations

      We reserve the right to terminate accounts that violate these terms.`
    },
    {
      id: "content",
      title: "User Content",
      icon: <FileText className="h-5 w-5" />,
      content: `Content Ownership:
      • You retain ownership of content you upload
      • You grant us a license to process and display your content
      • You are responsible for your content's legality

      Content License:
      By uploading content, you grant Inflio a worldwide, non-exclusive, royalty-free license to:
      • Store, process, and transform your content
      • Display content within the Service
      • Create derivatives (clips, transcriptions, etc.)
      • Share content as you direct (social media publishing)

      This license ends when you delete your content, except where required by law.`
    },
    {
      id: "intellectual-property",
      title: "Intellectual Property",
      icon: <Shield className="h-5 w-5" />,
      content: `Inflio Property:
      • The Service, its features, and functionality are owned by Inflio
      • Our trademarks, logos, and brand features are protected
      • You may not copy, modify, or reverse engineer our Service

      DMCA Compliance:
      • We respect intellectual property rights
      • Report copyright violations to: dmca@inflio.com
      • We will remove infringing content upon valid notice
      • Repeat infringers will be terminated`
    },
    {
      id: "payment",
      title: "Payment Terms",
      icon: <CreditCard className="h-5 w-5" />,
      content: `Subscription Plans:
      • Payments are processed through Stripe
      • Subscriptions auto-renew unless cancelled
      • Prices may change with 30 days notice
      • All fees are in USD unless stated otherwise

      Billing:
      • You authorize automatic charges
      • Update payment methods to avoid interruption
      • Failed payments may result in service suspension

      Refunds:
      • 14-day money-back guarantee for new subscribers
      • No refunds for partial months
      • Refunds at our discretion for technical issues`
    },
    {
      id: "termination",
      title: "Termination",
      icon: <Ban className="h-5 w-5" />,
      content: `Either party may terminate:
      • You: Cancel anytime through account settings
      • Us: For Terms violations or at our discretion

      Upon Termination:
      • Access to the Service ends immediately
      • Content may be deleted after 30 days
      • No refunds for unused subscription time
      • Certain provisions survive termination

      We may suspend accounts pending investigation of violations.`
    },
    {
      id: "disclaimers",
      title: "Disclaimers & Limitations",
      icon: <AlertCircle className="h-5 w-5" />,
      content: `Service Provided "AS IS":
      • No warranties of any kind
      • Not responsible for user content
      • No guarantee of availability or accuracy
      • AI-generated content may contain errors

      Limitation of Liability:
      • Not liable for indirect or consequential damages
      • Total liability limited to fees paid in last 12 months
      • Some jurisdictions don't allow limitations

      You use the Service at your own risk.`
    },
    {
      id: "indemnification",
      title: "Indemnification",
      icon: <Scale className="h-5 w-5" />,
      content: `You agree to indemnify and hold harmless Inflio, its officers, directors, employees, and agents from any claims, damages, losses, liabilities, and expenses (including legal fees) arising from:

      • Your use of the Service
      • Your violation of these Terms
      • Your violation of any third-party rights
      • Your content or activities

      This indemnification survives termination of these Terms.`
    },
    {
      id: "privacy",
      title: "Privacy",
      icon: <Shield className="h-5 w-5" />,
      content: `Your use of the Service is subject to our Privacy Policy. By using the Service, you consent to our collection and use of information as described in the Privacy Policy.

      Key points:
      • We collect data to provide and improve the Service
      • We don't sell your personal information
      • You control your data and can request deletion
      • We use industry-standard security measures`
    },
    {
      id: "modifications",
      title: "Modifications to Terms",
      icon: <FileText className="h-5 w-5" />,
      content: `We may modify these Terms at any time. Changes will be effective upon posting unless stated otherwise.

      • Material changes: 30 days notice via email
      • Minor changes: Effective immediately
      • Continued use constitutes acceptance
      • Review Terms periodically

      If you disagree with changes, stop using the Service and close your account.`
    },
    {
      id: "governing-law",
      title: "Governing Law",
      icon: <Scale className="h-5 w-5" />,
      content: `These Terms are governed by the laws of the State of California, USA, without regard to conflict of law principles.

      Dispute Resolution:
      • First, try to resolve informally via support@inflio.com
      • Binding arbitration for unresolved disputes
      • No class actions or jury trials
      • Small claims court exceptions apply

      Legal proceedings must be brought in San Francisco, California.`
    },
    {
      id: "general",
      title: "General Provisions",
      icon: <FileText className="h-5 w-5" />,
      content: `Additional Terms:
      • Entire Agreement: These Terms constitute the entire agreement
      • Severability: Invalid provisions will be modified or severed
      • No Waiver: Failure to enforce doesn't waive our rights
      • Assignment: We may assign these Terms; you may not
      • Force Majeure: Not liable for events beyond our control

      No agency, partnership, or employment relationship is created.`
    },
    {
      id: "contact",
      title: "Contact Information",
      icon: <Mail className="h-5 w-5" />,
      content: `For questions about these Terms:

      • Email: legal@inflio.com
      • Support: support@inflio.com
      • Address: Inflio, Inc., San Francisco, CA 94105
      • Response Time: 2-3 business days

      For urgent matters, please indicate in the subject line.`
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
                <FileText className="h-6 w-6" />
              </div>
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
                Terms of Service
              </h1>
              <p className="mt-4 text-lg text-muted-foreground">
                Please read these terms carefully before using Inflio.
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

          {/* Agreement Notice */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="mt-12 rounded-lg border bg-primary/5 p-6 text-center"
          >
            <h3 className="mb-3 font-semibold">By using Inflio, you agree to these Terms</h3>
            <p className="text-sm text-muted-foreground">
              If you have any questions or concerns about these terms, please contact us before using the Service.
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