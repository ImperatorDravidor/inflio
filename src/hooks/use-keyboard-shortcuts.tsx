"use client"

import { useEffect, useCallback, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Project } from "@/lib/project-types"

interface KeyboardShortcut {
  key: string
  ctrlKey?: boolean
  shiftKey?: boolean
  altKey?: boolean
  description: string
  action: () => void
  global?: boolean
}

interface UseKeyboardShortcutsProps {
  shortcuts: KeyboardShortcut[]
  enabled?: boolean
}

export function useKeyboardShortcuts({ shortcuts, enabled = true }: UseKeyboardShortcutsProps) {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return

    // Don't trigger shortcuts when typing in input fields
    if (
      event.target instanceof HTMLInputElement ||
      event.target instanceof HTMLTextAreaElement ||
      event.target instanceof HTMLSelectElement ||
      (event.target as HTMLElement)?.contentEditable === 'true'
    ) {
      return
    }

    const shortcut = shortcuts.find(s => 
      s.key.toLowerCase() === event.key.toLowerCase() &&
      !!s.ctrlKey === event.ctrlKey &&
      !!s.shiftKey === event.shiftKey &&
      !!s.altKey === event.altKey
    )

    if (shortcut) {
      event.preventDefault()
      shortcut.action()
    }
  }, [shortcuts, enabled])

  useEffect(() => {
    if (enabled) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleKeyDown, enabled])
}

// Global shortcuts hook
export function useGlobalShortcuts() {
  const router = useRouter()
  const [shortcutsVisible, setShortcutsVisible] = useState(false)

  const globalShortcuts: KeyboardShortcut[] = [
    {
      key: 'u',
      ctrlKey: true,
      description: 'Upload new video',
      action: () => {
        router.push('/studio/upload')
        toast.info('Navigating to upload page')
      },
      global: true
    },
    {
      key: 'p',
      ctrlKey: true,
      description: 'View projects',
      action: () => {
        router.push('/projects')
        toast.info('Navigating to projects')
      },
      global: true
    },
    {
      key: 'h',
      ctrlKey: true,
      description: 'Go home',
      action: () => {
        router.push('/')
        toast.info('Navigating home')
      },
      global: true
    },
    {
      key: '/',
      ctrlKey: true,
      description: 'Search projects',
      action: () => {
        const searchInput = document.querySelector('input[type="search"]') as HTMLInputElement
        if (searchInput) {
          searchInput.focus()
          searchInput.select()
        }
      },
      global: true
    },
    {
      key: '?',
      shiftKey: true,
      description: 'Show keyboard shortcuts',
      action: () => {
        setShortcutsVisible(true)
      },
      global: true
    },
    {
      key: 'Escape',
      description: 'Close modals/overlays',
      action: () => {
        setShortcutsVisible(false)
        // Close any open modals or dropdowns
        const openModals = document.querySelectorAll('[data-state="open"]')
        openModals.forEach(modal => {
          const closeButton = modal.querySelector('[data-dismiss]') as HTMLElement
          closeButton?.click()
        })
      },
      global: true
    }
  ]

  useKeyboardShortcuts({ shortcuts: globalShortcuts, enabled: true })

  return {
    shortcutsVisible,
    setShortcutsVisible,
    shortcuts: globalShortcuts
  }
}

// Video player shortcuts
export function useVideoPlayerShortcuts(videoRef: React.RefObject<HTMLVideoElement>) {
  const videoShortcuts: KeyboardShortcut[] = [
    {
      key: ' ',
      description: 'Play/Pause video',
      action: () => {
        if (videoRef.current) {
          if (videoRef.current.paused) {
            videoRef.current.play()
          } else {
            videoRef.current.pause()
          }
        }
      }
    },
    {
      key: 'ArrowLeft',
      description: 'Seek backward 10s',
      action: () => {
        if (videoRef.current) {
          videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 10)
        }
      }
    },
    {
      key: 'ArrowRight',
      description: 'Seek forward 10s',
      action: () => {
        if (videoRef.current) {
          videoRef.current.currentTime = Math.min(
            videoRef.current.duration,
            videoRef.current.currentTime + 10
          )
        }
      }
    },
    {
      key: 'ArrowUp',
      description: 'Volume up',
      action: () => {
        if (videoRef.current) {
          videoRef.current.volume = Math.min(1, videoRef.current.volume + 0.1)
        }
      }
    },
    {
      key: 'ArrowDown',
      description: 'Volume down',
      action: () => {
        if (videoRef.current) {
          videoRef.current.volume = Math.max(0, videoRef.current.volume - 0.1)
        }
      }
    },
    {
      key: 'm',
      description: 'Toggle mute',
      action: () => {
        if (videoRef.current) {
          videoRef.current.muted = !videoRef.current.muted
        }
      }
    },
    {
      key: 'f',
      description: 'Toggle fullscreen',
      action: () => {
        if (videoRef.current) {
          if (document.fullscreenElement) {
            document.exitFullscreen()
          } else {
            videoRef.current.requestFullscreen()
          }
        }
      }
    }
  ]

  useKeyboardShortcuts({ shortcuts: videoShortcuts })

  return videoShortcuts
}

// Project shortcuts
export function useProjectShortcuts(projects: Project[], onSelectProject: (id: string) => void) {
  const [selectedIndex, setSelectedIndex] = useState(-1)

  const projectShortcuts: KeyboardShortcut[] = [
    {
      key: 'j',
      description: 'Next project',
      action: () => {
        setSelectedIndex(prev => Math.min(projects.length - 1, prev + 1))
      }
    },
    {
      key: 'k',
      description: 'Previous project',
      action: () => {
        setSelectedIndex(prev => Math.max(0, prev - 1))
      }
    },
    {
      key: 'Enter',
      description: 'Open selected project',
      action: () => {
        if (selectedIndex >= 0 && projects[selectedIndex]) {
          onSelectProject(projects[selectedIndex].id)
        }
      }
    },
    {
      key: 'n',
      ctrlKey: true,
      description: 'New project',
      action: () => {
        window.location.href = '/studio/upload'
      }
    }
  ]

  useKeyboardShortcuts({ shortcuts: projectShortcuts })

  return {
    selectedIndex,
    setSelectedIndex,
    shortcuts: projectShortcuts
  }
}

// Keyboard shortcuts help component
export function KeyboardShortcutsHelp({ 
  shortcuts, 
  visible, 
  onClose 
}: { 
  shortcuts: KeyboardShortcut[]
  visible: boolean
  onClose: () => void
}) {
  const formatShortcut = (shortcut: KeyboardShortcut) => {
    const parts = []
    if (shortcut.ctrlKey) parts.push('Ctrl')
    if (shortcut.shiftKey) parts.push('Shift')
    if (shortcut.altKey) parts.push('Alt')
    
    let key = shortcut.key
    if (key === ' ') key = 'Space'
    if (key === 'ArrowLeft') key = '←'
    if (key === 'ArrowRight') key = '→'
    if (key === 'ArrowUp') key = '↑'
    if (key === 'ArrowDown') key = '↓'
    
    parts.push(key)
    return parts.join(' + ')
  }

  if (!visible) return null

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border rounded-lg shadow-lg max-w-md w-full max-h-[80vh] overflow-auto">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Keyboard Shortcuts</h2>
            <button 
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground"
            >
              ✕
            </button>
          </div>
        </div>
        
        <div className="p-4 space-y-3">
          {shortcuts.map((shortcut, index) => (
            <div key={index} className="flex items-center justify-between">
              <span className="text-sm">{shortcut.description}</span>
              <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono">
                {formatShortcut(shortcut)}
              </kbd>
            </div>
          ))}
        </div>
        
        <div className="p-4 border-t text-center">
          <p className="text-xs text-muted-foreground">
            Press <kbd className="px-1 bg-muted rounded">?</kbd> to toggle this help
          </p>
        </div>
      </div>
    </div>
  )
} 
