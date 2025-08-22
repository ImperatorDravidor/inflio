"use client"

import { IconVideo } from "@tabler/icons-react"

interface VideoPlaceholderProps {
  className?: string
  message?: string
}

export function VideoPlaceholder({ 
  className = "",
  message = "Video preview"
}: VideoPlaceholderProps) {
  return (
    <div className={`flex items-center justify-center h-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 ${className}`}>
      <div className="text-center">
        <div className="p-6 rounded-full bg-white/80 dark:bg-black/40 shadow-lg">
          <IconVideo className="h-12 w-12 text-slate-600 dark:text-slate-400" />
        </div>
        {message && (
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-3">{message}</p>
        )}
      </div>
    </div>
  )
}
