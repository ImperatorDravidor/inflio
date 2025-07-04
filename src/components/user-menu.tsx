"use client"

import { UserButton } from "@clerk/nextjs"
import { useEffect, useState } from "react"

export function UserMenu() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Only render the UserButton after mounting to prevent hydration mismatches
  if (!mounted) {
    // Return a placeholder with the same dimensions to prevent layout shift
    return (
      <div className="h-9 w-9 rounded-full bg-muted animate-pulse" />
    )
  }

  return (
    <UserButton 
      appearance={{
        elements: {
          avatarBox: "h-9 w-9",
          userButtonTrigger: "focus:shadow-none",
          userButtonPopoverCard: "shadow-lg border border-gray-200 dark:border-gray-700",
          userButtonPopoverActionButton: "hover:bg-gray-100 dark:hover:bg-gray-800",
          userButtonPopoverActionButtonText: "font-medium text-gray-700 dark:text-gray-300",
          userButtonPopoverActionButtonIcon: "text-gray-600 dark:text-gray-400",
          userButtonPopoverFooter: "hidden",
          userPreviewMainIdentifier: "font-semibold text-gray-900 dark:text-gray-100",
          userPreviewSecondaryIdentifier: "text-gray-600 dark:text-gray-400 text-sm",
          userButtonPopoverMain: "bg-white dark:bg-gray-900",
        },
        variables: {
          borderRadius: "0.5rem",
          colorBackground: "#ffffff",
          colorText: "#1f2937",
        }
      }}
      userProfileProps={{
        appearance: {
          elements: {
            card: "shadow-none",
            navbar: "hidden",
            pageScrollBox: "p-8",
            profileSectionTitle: "text-gray-900 dark:text-gray-100 font-semibold",
            formFieldLabel: "text-gray-700 dark:text-gray-300 font-medium",
            formFieldInput: "border-gray-300 dark:border-gray-700 dark:bg-gray-800 focus:ring-2 focus:ring-blue-500",
            formButtonPrimary: "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg",
            badge: "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200",
            profileSectionContent: "text-gray-600 dark:text-gray-400",
            accordionTriggerButton: "hover:bg-gray-50 dark:hover:bg-gray-800",
          },
          variables: {
            borderRadius: "0.5rem",
          }
        }
      }}
    />
  )
} 
