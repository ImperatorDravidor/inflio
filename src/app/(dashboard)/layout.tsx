'use client'

import { AppSidebar } from "@/components/app-sidebar"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { Toaster } from "sonner"
import { DashboardHeader } from "@/components/dashboard-header"
import { AnimatedBackground } from "@/components/animated-background"
import { WorkflowIndicator } from "@/components/workflow-indicator"
import { PersonaProvider } from "@/contexts/persona-context"
import { AICommandPalette } from "@/components/ai-command-palette"
import { useState } from "react"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [commandOpen, setCommandOpen] = useState(false)

  return (
    <PersonaProvider>
      <SidebarProvider
        style={
          {
            "--sidebar-width": "calc(var(--spacing) * 72)",
            "--header-height": "calc(var(--spacing) * 12)",
          } as React.CSSProperties
        }
      >
        <AppSidebar variant="inset" />
        <SidebarInset className="min-h-screen">
          <DashboardHeader />
          <div className="flex flex-1 flex-col">
            <main className="flex-1 bg-gradient-to-br from-background/95 via-background to-muted/20 dark:from-background dark:via-muted/10 dark:to-muted/5">
              <div className="@container/main flex flex-1 flex-col p-6">
                <AnimatedBackground />
                {children}
              </div>
            </main>
          </div>
        </SidebarInset>
        <Toaster position="bottom-right" />
      </SidebarProvider>
      
      {/* AI Command Palette - Global keyboard shortcut ⌘K */}
      <AICommandPalette open={commandOpen} onOpenChange={setCommandOpen} />
      
      {/* Workflow Indicator - shows processing projects */}
      <WorkflowIndicator />
    </PersonaProvider>
  )
} 
