import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { ClerkProvider } from "@clerk/nextjs";
import { UserProfileProvider } from "@/hooks/use-user-profile";
import { Toaster } from "@/components/ui/sonner"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Inflio - AI Content Transformation Platform",
  description: "Transform your videos into transcriptions, clips, blog posts, and social media content with AI-powered automation",
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body className="antialiased">
          <UserProfileProvider>
            <NextThemesProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
              <main className={`${geistSans.variable} ${geistMono.variable} font-sans`}>
                {children}
              </main>
              <Toaster />
            </NextThemesProvider>
          </UserProfileProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
