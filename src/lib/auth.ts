import NextAuth from "next-auth"
import type { NextAuthConfig } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import FacebookProvider from "next-auth/providers/facebook"
import TwitterProvider from "next-auth/providers/twitter"
import LinkedInProvider from "next-auth/providers/linkedin"
import { createSupabaseBrowserClient } from "@/lib/supabase/client"
import { cookies } from "next/headers"

// Custom provider configurations for social media platforms
const providers = [
  // YouTube (via Google)
  GoogleProvider({
    clientId: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    authorization: {
      params: {
        scope: "openid email profile https://www.googleapis.com/auth/youtube.readonly https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/yt-analytics.readonly",
        access_type: "offline",
        prompt: "consent",
      },
    },
  }),
  
  // Facebook & Instagram
  FacebookProvider({
    clientId: process.env.FACEBOOK_APP_ID!,
    clientSecret: process.env.FACEBOOK_APP_SECRET!,
    authorization: {
      params: {
        scope: "email public_profile pages_show_list pages_read_engagement pages_manage_posts instagram_basic instagram_content_publish instagram_manage_insights",
      },
    },
  }),
  
  // X (Twitter)
  TwitterProvider({
    clientId: process.env.TWITTER_CLIENT_ID!,
    clientSecret: process.env.TWITTER_CLIENT_SECRET!,
    authorization: {
      url: "https://twitter.com/i/oauth2/authorize",
      params: {
        scope: "tweet.read tweet.write users.read offline.access",
      },
    },
    token: {
      url: "https://api.twitter.com/2/oauth2/token",
    },
    userinfo: {
      url: "https://api.twitter.com/2/users/me",
    },
  }),
  
  // LinkedIn
  LinkedInProvider({
    clientId: process.env.LINKEDIN_CLIENT_ID!,
    clientSecret: process.env.LINKEDIN_CLIENT_SECRET!,
    authorization: {
      params: {
        scope: "openid profile email w_member_social r_liteprofile r_emailaddress",
      },
    },
  }),
]

export const authConfig: NextAuthConfig = {
  providers,
  pages: {
    signIn: "/social",
    error: "/social",
  },
  callbacks: {
    async signIn({ user, account, profile, credentials }) {
      // This is called after successful OAuth
      if (account && user) {
        try {
          const supabase = createSupabaseBrowserClient()
          
          // Get the current user from Clerk session
          // In production, you might want to get this from cookies or a more secure method
          const clerkUserId = await getCurrentClerkUserId()
          
          if (!clerkUserId) {
            console.error('No Clerk user ID found')
            return false
          }
          
          // Get the platform from cookies (more reliable than mapping)
          const platformFromCookie = await getConnectingPlatform()
          
          // Map provider to platform name as fallback
          const platformMap: Record<string, string> = {
            google: "youtube",
            facebook: profile?.instagram_account_id ? "instagram" : "facebook",
            twitter: "x",
            linkedin: "linkedin",
          }
          
          const platform = platformFromCookie || platformMap[account.provider] || account.provider
          
          // Store the social integration
          const { error } = await supabase
            .from("social_integrations")
            .upsert({
              user_id: clerkUserId,
              platform,
              internal_id: `${platform}_${account.providerAccountId}`,
              name: user.name || profile?.name || "Unknown",
              picture: user.image || profile?.picture,
              provider_identifier: account.providerAccountId,
              token: account.access_token!,
              refresh_token: account.refresh_token,
              token_expiration: account.expires_at ? new Date(account.expires_at * 1000).toISOString() : null,
              profile: JSON.stringify(profile),
              disabled: false,
              refresh_needed: false,
            })
          
          if (error) {
            console.error("Failed to save social integration:", error)
            return false
          }
          
          // Clean up cookies after successful connection
          const cookieStore = await cookies()
          cookieStore.delete('clerk_user_id')
          cookieStore.delete('connecting_platform')
          
          return true
        } catch (error) {
          console.error("Error in signIn callback:", error)
          return false
        }
      }
      return true
    },
    
    async session({ session, token }) {
      // Add custom data to session if needed
      return session
    },
    
    async jwt({ token, account, profile }) {
      // Store account info in JWT
      if (account) {
        token.accessToken = account.access_token
        token.refreshToken = account.refresh_token
        token.expiresAt = account.expires_at
      }
      return token
    },
  },
}

export const { handlers, signIn, signOut, auth } = NextAuth(authConfig)

// Helper to get Clerk user ID from cookies
async function getCurrentClerkUserId() {
  try {
    const cookieStore = await cookies()
    const clerkUserId = cookieStore.get('clerk_user_id')?.value
    return clerkUserId || null
  } catch (error) {
    console.error('Failed to get Clerk user ID from cookies:', error)
    return null
  }
}

// Helper to get connecting platform from cookies
async function getConnectingPlatform() {
  try {
    const cookieStore = await cookies()
    const platform = cookieStore.get('connecting_platform')?.value
    return platform || null
  } catch (error) {
    console.error('Failed to get platform from cookies:', error)
    return null
  }
} 