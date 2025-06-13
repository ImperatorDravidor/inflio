import { AppSidebar } from "@/components/app-sidebar"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { Toaster } from "sonner"
import { DashboardHeader } from "@/components/dashboard-header"
import { OnboardingCheck } from "@/components/onboarding-check"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <OnboardingCheck />
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
                {children}
              </div>
            </main>
          </div>
        </SidebarInset>
        <Toaster position="bottom-right" />
      </SidebarProvider>
    </>
  )
} 