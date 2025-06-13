import { IconBell, IconUpload, IconSparkles } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { ThemeToggle } from "@/components/theme-toggle"
import { InflioLogo } from "@/components/inflio-logo"
import Link from "next/link"

export function SiteHeader() {
  return (
    <header className="flex h-[var(--header-height)] shrink-0 items-center gap-2 border-b border-border/50 bg-background/95 backdrop-blur-sm sticky top-0 z-50 shadow-sm dark:shadow-none">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1 hover:bg-muted/50" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4 bg-border/50"
        />
        
        {/* Logo/Title for mobile */}
        <div className="flex-1 flex items-center lg:hidden">
          <Link href="/" className="flex items-center px-2">
            <InflioLogo size="sm" />
          </Link>
        </div>

        {/* Action Buttons */}
        <div className="ml-auto flex items-center gap-2">
          <Link href="/studio/upload">
            <Button variant="default" size="sm" className="gap-2 gradient-premium hover:opacity-90 transition-opacity shadow-sm">
              <IconUpload className="h-4 w-4" />
              <span className="hidden sm:inline">Upload Video</span>
            </Button>
          </Link>
          <div className="relative">
            <Button variant="ghost" size="icon" className="h-9 w-9 hover:bg-muted/50">
              <IconBell className="h-4 w-4" />
              <span className="sr-only">Notifications</span>
            </Button>
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-accent animate-pulse" />
          </div>
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
