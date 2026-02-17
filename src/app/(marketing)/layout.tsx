"use client"

import { MegaMenu } from "@/components/landing"
import { useUser } from "@clerk/nextjs"
import Link from "next/link"
import { InflioLogo } from "@/components/inflio-logo"
import {
  IconBrandYoutube,
  IconBrandX,
  IconBrandLinkedin,
} from "@tabler/icons-react"

const footerLinks = {
  product: [
    { label: "All Features", href: "/features" },
    { label: "AI Clip Generation", href: "/features/clip-generation" },
    { label: "AI Thumbnails", href: "/features/thumbnails" },
    { label: "Avatar Training", href: "/features/avatar-training" },
    { label: "Pricing", href: "/#pricing" },
  ],
  company: [
    { label: "About", href: "/about" },
    { label: "Blog", href: "/blog" },
    { label: "Careers", href: "/careers" },
    { label: "Contact", href: "/contact" },
  ],
  support: [
    { label: "Help Center", href: "/support" },
    { label: "Terms", href: "/terms" },
    { label: "Privacy", href: "/privacy" },
  ],
}

const socialLinks = [
  { icon: IconBrandX, href: "https://x.com/inflioai", label: "X" },
  { icon: IconBrandYoutube, href: "https://youtube.com/@inflio", label: "YouTube" },
  { icon: IconBrandLinkedin, href: "https://linkedin.com/company/inflio", label: "LinkedIn" },
]

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { isSignedIn } = useUser()

  return (
    <div className="min-h-screen bg-[#09090b] text-white">
      <MegaMenu isSignedIn={isSignedIn} />
      
      <main>{children}</main>

      {/* Footer - consistent with landing page */}
      <footer className="border-t border-white/[0.05] bg-[#050508]">
        <div className="mx-auto max-w-7xl px-6 lg:px-8 py-14">
          <div className="flex flex-col md:flex-row items-start justify-between gap-10">
            {/* Brand */}
            <div className="flex flex-col gap-4 max-w-xs">
              <Link href="/">
                <InflioLogo size="sm" variant="dark" />
              </Link>
              <p className="text-sm text-white/30 leading-relaxed">
                Transform your video content into a complete multi-platform presence with AI.
              </p>
            </div>

            {/* Links */}
            <div className="flex flex-wrap gap-14">
              <div>
                <h3 className="font-medium text-sm text-white/60 mb-4">Product</h3>
                <ul className="space-y-2.5">
                  {footerLinks.product.map((link) => (
                    <li key={link.href}>
                      <Link href={link.href} className="text-sm text-white/30 hover:text-white/60 transition-colors duration-200">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="font-medium text-sm text-white/60 mb-4">Company</h3>
                <ul className="space-y-2.5">
                  {footerLinks.company.map((link) => (
                    <li key={link.href}>
                      <Link href={link.href} className="text-sm text-white/30 hover:text-white/60 transition-colors duration-200">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="font-medium text-sm text-white/60 mb-4">Support</h3>
                <ul className="space-y-2.5">
                  {footerLinks.support.map((link) => (
                    <li key={link.href}>
                      <Link href={link.href} className="text-sm text-white/30 hover:text-white/60 transition-colors duration-200">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Social */}
            <div className="flex gap-2">
              {socialLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={link.label}
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/[0.03] hover:bg-white/[0.06] text-white/25 hover:text-white/50 transition-all duration-200"
                >
                  <link.icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Bottom */}
          <div className="mt-12 pt-8 border-t border-white/[0.04] flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-white/20">
              &copy; {new Date().getFullYear()} Inflio, Inc. All rights reserved.
            </p>
            <p className="text-xs text-white/20">
              Made with care in San Francisco
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
