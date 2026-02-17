"use client"

import { motion } from "framer-motion"
import Link from "next/link"

export default function PrivacyPage() {
  return (
    <div className="pt-32 pb-24">
      <div className="mx-auto max-w-2xl px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-12 pb-8 border-b border-white/[0.06]"
        >
          <p className="text-sm font-medium text-primary/80 tracking-wide uppercase mb-3">Legal</p>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3 text-white">
            Privacy Policy
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
            At Inflio, we take your privacy seriously. This policy explains how we collect, use, and protect your personal information.
          </p>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">1. Information We Collect</h2>
            
            <h3 className="text-base font-medium text-white mb-2">Account Information</h3>
            <p className="text-white/60 leading-relaxed mb-3">When you create an account, we collect:</p>
            <ul className="list-disc list-inside space-y-1.5 text-white/60 mb-4">
              <li>Name and email address</li>
              <li>Profile photo (optional)</li>
              <li>Password (encrypted)</li>
              <li>Billing information (processed by Stripe)</li>
            </ul>

            <h3 className="text-base font-medium text-white mb-2">Content Data</h3>
            <p className="text-white/60 leading-relaxed mb-3">When you use our service, we process:</p>
            <ul className="list-disc list-inside space-y-1.5 text-white/60 mb-4">
              <li>Videos you upload</li>
              <li>Audio transcriptions</li>
              <li>Generated content (clips, blogs, social posts)</li>
              <li>Brand and persona settings</li>
              <li>Photos for AI persona training (if enabled)</li>
            </ul>

            <h3 className="text-base font-medium text-white mb-2">Usage Data</h3>
            <p className="text-white/60 leading-relaxed mb-3">We automatically collect:</p>
            <ul className="list-disc list-inside space-y-1.5 text-white/60">
              <li>Device and browser information</li>
              <li>IP address and location (approximate)</li>
              <li>Pages visited and features used</li>
              <li>Time spent on the platform</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">2. How We Use Your Information</h2>
            <p className="text-white/60 leading-relaxed mb-3">We use your information to:</p>
            <ul className="list-disc list-inside space-y-1.5 text-white/60">
              <li><span className="text-white/80 font-medium">Provide the Service:</span> Process videos, generate content, and enable publishing</li>
              <li><span className="text-white/80 font-medium">Improve the Service:</span> Analyze usage patterns to enhance features</li>
              <li><span className="text-white/80 font-medium">Communicate:</span> Send service updates, security alerts, and marketing (with consent)</li>
              <li><span className="text-white/80 font-medium">Support:</span> Respond to your questions and provide assistance</li>
              <li><span className="text-white/80 font-medium">Security:</span> Detect and prevent fraud or abuse</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">3. AI Training and Your Content</h2>
            <p className="text-white/80 font-medium leading-relaxed mb-3">
              We do not use your uploaded videos, generated content, or personal photos to train our general AI models.
            </p>
            <p className="text-white/60 leading-relaxed mb-3">
              If you enable AI Persona training, your photos are used solely to create your personal AI avatar model. This model is:
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-white/60">
              <li>Stored securely and encrypted</li>
              <li>Only accessible to your account</li>
              <li>Deleted upon your request or account termination</li>
              <li>Never used to train other models</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">4. Data Sharing</h2>
            <p className="text-white/60 leading-relaxed mb-3">We share your data only with:</p>
            <ul className="list-disc list-inside space-y-1.5 text-white/60 mb-3">
              <li><span className="text-white/80 font-medium">Service Providers:</span> Cloud hosting, payment processing (Stripe), AI processing, authentication (Clerk)</li>
              <li><span className="text-white/80 font-medium">Social Platforms:</span> When you publish content (with your authorization)</li>
              <li><span className="text-white/80 font-medium">Legal Requirements:</span> When required by law or to protect rights and safety</li>
            </ul>
            <p className="text-white/60 leading-relaxed">We never sell your personal information to third parties.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">5. Data Retention</h2>
            <ul className="list-disc list-inside space-y-1.5 text-white/60">
              <li><span className="text-white/80 font-medium">Account Data:</span> Retained while your account is active</li>
              <li><span className="text-white/80 font-medium">Uploaded Videos:</span> Processed and deleted within 30 days unless saved to your library</li>
              <li><span className="text-white/80 font-medium">Generated Content:</span> Retained until you delete it</li>
              <li><span className="text-white/80 font-medium">Usage Logs:</span> Retained for 12 months</li>
              <li><span className="text-white/80 font-medium">AI Persona Models:</span> Retained until you delete them or close your account</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">6. Data Security</h2>
            <p className="text-white/60 leading-relaxed mb-3">We protect your data with:</p>
            <ul className="list-disc list-inside space-y-1.5 text-white/60">
              <li>End-to-end encryption for data in transit (TLS 1.3)</li>
              <li>AES-256 encryption for data at rest</li>
              <li>Regular security audits and penetration testing</li>
              <li>Strict access controls and authentication</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">7. Your Rights</h2>
            <p className="text-white/60 leading-relaxed mb-3">You have the right to:</p>
            <ul className="list-disc list-inside space-y-1.5 text-white/60 mb-3">
              <li><span className="text-white/80 font-medium">Access:</span> Request a copy of your personal data</li>
              <li><span className="text-white/80 font-medium">Correction:</span> Update inaccurate information</li>
              <li><span className="text-white/80 font-medium">Deletion:</span> Request deletion of your data</li>
              <li><span className="text-white/80 font-medium">Portability:</span> Export your data in a standard format</li>
              <li><span className="text-white/80 font-medium">Objection:</span> Opt out of marketing communications</li>
            </ul>
            <p className="text-white/60 leading-relaxed">
              To exercise these rights, contact us at{" "}
              <a href="mailto:privacy@inflio.com" className="text-primary hover:underline">privacy@inflio.com</a>
              {" "}or use the settings in your account.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">8. Cookies</h2>
            <p className="text-white/60 leading-relaxed mb-3">We use cookies for:</p>
            <ul className="list-disc list-inside space-y-1.5 text-white/60 mb-3">
              <li><span className="text-white/80 font-medium">Essential:</span> Authentication and security</li>
              <li><span className="text-white/80 font-medium">Functional:</span> Remembering your preferences</li>
              <li><span className="text-white/80 font-medium">Analytics:</span> Understanding usage (with consent)</li>
            </ul>
            <p className="text-white/60 leading-relaxed">
              You can manage cookie preferences in your browser settings.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">9. International Transfers</h2>
            <p className="text-white/60 leading-relaxed">
              Your data may be processed in the United States and other countries where our service providers operate. We ensure appropriate safeguards are in place for international transfers.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">10. Children's Privacy</h2>
            <p className="text-white/60 leading-relaxed">
              Inflio is not intended for children under 18. We do not knowingly collect data from children. If you believe a child has provided us with personal information, please contact us.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">11. Changes to This Policy</h2>
            <p className="text-white/60 leading-relaxed">
              We may update this policy periodically. We'll notify you of significant changes via email or through the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">12. Contact Us</h2>
            <p className="text-white/60 leading-relaxed mb-3">
              For privacy questions or to exercise your rights:
            </p>
            <ul className="space-y-1.5 text-white/60">
              <li>
                Email:{" "}
                <a href="mailto:privacy@inflio.com" className="text-primary hover:underline">
                  privacy@inflio.com
                </a>
              </li>
            </ul>
          </section>
        </motion.div>
      </div>
    </div>
  )
}
