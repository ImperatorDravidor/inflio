"use client"

import { motion } from "framer-motion"
import Link from "next/link"

export default function TermsPage() {
  return (
    <div className="pt-28 pb-20">
      <div className="mx-auto max-w-2xl px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-12 pb-8 border-b border-white/10"
        >
          <p className="text-xs text-primary font-medium uppercase tracking-wider mb-2">Legal</p>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3 text-white">
            Terms of Service
          </h1>
          <p className="text-sm text-white/40">
            Last updated: January 15, 2026
          </p>
        </motion.div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="space-y-8"
        >
          <p className="text-white/60 leading-relaxed">
            Welcome to Inflio. By accessing or using our service, you agree to be bound by these Terms of Service. Please read them carefully.
          </p>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">1. Acceptance of Terms</h2>
            <div className="space-y-3 text-white/60 leading-relaxed">
              <p>
                By creating an account or using Inflio ("Service"), you agree to these Terms of Service ("Terms") and our Privacy Policy. If you don't agree, please don't use our Service.
              </p>
              <p>
                We may update these Terms from time to time. If we make significant changes, we'll notify you through the Service or via email. Continued use after changes means you accept the new Terms.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">2. Description of Service</h2>
            <p className="text-white/60 leading-relaxed mb-3">
              Inflio is an AI-powered content repurposing platform that helps you transform video content into multiple formats including clips, blog posts, social media content, and thumbnails. The Service includes:
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-white/60">
              <li>Video upload and processing</li>
              <li>AI-powered transcription</li>
              <li>Automated clip generation</li>
              <li>Blog post generation</li>
              <li>Social media post creation</li>
              <li>Thumbnail generation</li>
              <li>Multi-platform publishing</li>
              <li>AI Persona training</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">3. Account Registration</h2>
            <p className="text-white/60 leading-relaxed mb-3">
              To use Inflio, you must create an account. You agree to:
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-white/60">
              <li>Provide accurate, current, and complete information</li>
              <li>Keep your account credentials secure</li>
              <li>Notify us immediately of any unauthorized access</li>
              <li>Be responsible for all activity under your account</li>
            </ul>
            <p className="text-white/60 leading-relaxed mt-3">
              You must be at least 18 years old or the age of majority in your jurisdiction to use Inflio.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">4. Acceptable Use</h2>
            <p className="text-white/60 leading-relaxed mb-3">You agree not to:</p>
            <ul className="list-disc list-inside space-y-1.5 text-white/60">
              <li>Upload content you don't have rights to</li>
              <li>Use the Service for illegal purposes</li>
              <li>Generate harmful, abusive, or misleading content</li>
              <li>Attempt to bypass rate limits or usage restrictions</li>
              <li>Reverse engineer or copy our AI systems</li>
              <li>Resell access to the Service without authorization</li>
              <li>Use the Service to train competing AI models</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">5. Content Ownership</h2>
            
            <h3 className="text-base font-medium text-white mb-2">Your Content</h3>
            <p className="text-white/60 leading-relaxed mb-4">
              You retain all rights to content you upload ("Your Content"). By using Inflio, you grant us a license to process, store, and transform Your Content solely to provide the Service.
            </p>
            
            <h3 className="text-base font-medium text-white mb-2">Generated Content</h3>
            <p className="text-white/60 leading-relaxed mb-4">
              Content generated by our AI based on Your Content ("Generated Content") belongs to you. You may use Generated Content for any lawful purpose, including commercial use.
            </p>

            <h3 className="text-base font-medium text-white mb-2">AI Training</h3>
            <p className="text-white/60 leading-relaxed">
              We do not use Your Content or Generated Content to train our AI models without explicit consent. Your content is processed in real-time and is not retained for training purposes.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">6. Subscriptions and Billing</h2>
            
            <h3 className="text-base font-medium text-white mb-2">Free Tier</h3>
            <p className="text-white/60 leading-relaxed mb-4">
              We offer a free tier with limited features. Free tier usage is subject to fair use limits.
            </p>

            <h3 className="text-base font-medium text-white mb-2">Paid Plans</h3>
            <p className="text-white/60 leading-relaxed mb-4">
              Paid subscriptions are billed monthly or annually. By subscribing, you authorize us to charge your payment method automatically.
            </p>

            <h3 className="text-base font-medium text-white mb-2">Refunds</h3>
            <p className="text-white/60 leading-relaxed mb-4">
              We offer a 30-day money-back guarantee for new subscribers. After 30 days, refunds are at our discretion.
            </p>

            <h3 className="text-base font-medium text-white mb-2">Cancellation</h3>
            <p className="text-white/60 leading-relaxed">
              You may cancel your subscription at any time. You'll retain access until the end of your current billing period.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">7. Privacy</h2>
            <p className="text-white/60 leading-relaxed">
              Your privacy is important to us. Please review our{" "}
              <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>
              {" "}for information on how we collect, use, and protect your data.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">8. Intellectual Property</h2>
            <p className="text-white/60 leading-relaxed">
              Inflio and its features, functionality, and underlying technology are owned by Inflio, Inc. and protected by copyright, trademark, and other intellectual property laws.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">9. Disclaimers</h2>
            <p className="text-white/60 leading-relaxed uppercase text-sm">
              The Service is provided "as is" without warranties of any kind. We do not guarantee that the Service will be uninterrupted, error-free, or that AI-generated content will be accurate or suitable for your purposes.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">10. Limitation of Liability</h2>
            <p className="text-white/60 leading-relaxed uppercase text-sm">
              To the maximum extent permitted by law, Inflio shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">11. Indemnification</h2>
            <p className="text-white/60 leading-relaxed">
              You agree to indemnify and hold harmless Inflio from any claims, damages, or expenses arising from your use of the Service or violation of these Terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">12. Termination</h2>
            <p className="text-white/60 leading-relaxed">
              We may suspend or terminate your account for violation of these Terms or for any reason with notice. You may terminate your account at any time through your account settings.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">13. Governing Law</h2>
            <p className="text-white/60 leading-relaxed">
              These Terms are governed by the laws of the State of California, without regard to conflict of law principles.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">14. Contact</h2>
            <p className="text-white/60 leading-relaxed mb-3">
              Questions about these Terms? Contact us at:
            </p>
            <ul className="space-y-1.5 text-white/60">
              <li>
                Email:{" "}
                <a href="mailto:legal@inflio.com" className="text-primary hover:underline">
                  legal@inflio.com
                </a>
              </li>
            </ul>
          </section>
        </motion.div>
      </div>
    </div>
  )
}
