"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Keyboard } from "lucide-react"

interface ShortcutGroup {
  name: string
  shortcuts: {
    keys: string[]
    description: string
  }[]
}

export function useKeyboardShortcut(key: string, ctrlKey: boolean, callback: () => void) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === key.toLowerCase() && event.ctrlKey === ctrlKey) {
        event.preventDefault()
        callback()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [key, ctrlKey, callback])
}

export function KeyboardShortcutsDialog() {
  const [isOpen, setIsOpen] = useState(false)

  useKeyboardShortcut("?", true, () => setIsOpen(true))

  const shortcutGroups: ShortcutGroup[] = [
    {
      name: "Navigation",
      shortcuts: [
        { keys: ["g", "h"], description: "Go to Home" },
        { keys: ["g", "b"], description: "Go to Boards" },
        { keys: ["g", "d"], description: "Go to Discover" },
        { keys: ["g", "n"], description: "Go to Notifications" },
        { keys: ["g", "s"], description: "Go to Settings" },
        { keys: ["Esc"], description: "Close dialogs" },
      ],
    },
    {
      name: "Board Actions",
      shortcuts: [
        { keys: ["c"], description: "Create new post" },
        { keys: ["f"], description: "Focus search" },
        { keys: ["r"], description: "Refresh board" },
        { keys: ["s"], description: "Save changes" },
        { keys: ["Ctrl", "Enter"], description: "Submit form" },
      ],
    },
    {
      name: "Post Actions",
      shortcuts: [
        { keys: ["e"], description: "Edit post" },
        { keys: ["d"], description: "Delete post" },
        { keys: ["u"], description: "Upvote" },
        { keys: ["Shift", "u"], description: "Downvote" },
        { keys: ["c"], description: "Add comment" },
      ],
    },
    {
      name: "General",
      shortcuts: [
        { keys: ["Ctrl", "?"], description: "Show keyboard shortcuts" },
        { keys: ["Ctrl", "d"], description: "Toggle dark mode" },
        { keys: ["Ctrl", "b"], description: "Toggle sidebar" },
        { keys: ["/"], description: "Focus global search" },
      ],
    },
  ]

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setIsOpen(true)}>
        <Keyboard className="h-4 w-4 mr-2" />
        Keyboard Shortcuts
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Keyboard Shortcuts</DialogTitle>
            <DialogDescription>Use these keyboard shortcuts to navigate and perform actions quickly.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
            {shortcutGroups.map((group) => (
              <div key={group.name}>
                <h3 className="font-medium mb-2">{group.name}</h3>
                <div className="space-y-2">
                  {group.shortcuts.map((shortcut, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">{shortcut.description}</span>
                      <div className="flex items-center gap-1">
                        {shortcut.keys.map((key, keyIndex) => (
                          <span key={keyIndex}>
                            <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                              {key}
                            </kbd>
                            {keyIndex < shortcut.keys.length - 1 && <span className="mx-1">+</span>}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

export function KeyboardShortcutsHelper() {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Show keyboard shortcuts dialog when Ctrl+? is pressed
      if (event.key === "?" && (event.ctrlKey || event.metaKey)) {
        event.preventDefault()
        setIsOpen(true)
      }

      // Global navigation shortcuts
      if (event.key === "g" && !event.ctrlKey && !event.metaKey) {
        const navigationTimeout = setTimeout(() => {
          // Reset if second key not pressed
          clearTimeout(navigationTimeout)
        }, 1000)

        const handleSecondKey = (e: KeyboardEvent) => {
          if (e.key === "h") {
            window.location.href = "/dashboard"
          } else if (e.key === "b") {
            window.location.href = "/boards"
          } else if (e.key === "d") {
            window.location.href = "/discover"
          } else if (e.key === "n") {
            window.location.href = "/notifications"
          } else if (e.key === "s") {
            window.location.href = "/settings"
          }

          document.removeEventListener("keydown", handleSecondKey)
          clearTimeout(navigationTimeout)
        }

        document.addEventListener("keydown", handleSecondKey)
      }

      // Toggle dark mode with Ctrl+D
      if (event.key === "d" && (event.ctrlKey || event.metaKey)) {
        event.preventDefault()
        const html = document.documentElement
        const currentTheme = html.classList.contains("dark") ? "light" : "dark"
        html.classList.remove("light", "dark")
        html.classList.add(currentTheme)
        localStorage.setItem("theme", currentTheme)
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [])

  return (
    <>
      <div className="fixed bottom-4 right-4 z-50">
        <Button variant="outline" size="sm" onClick={() => setIsOpen(true)} className="rounded-full">
          <Keyboard className="h-4 w-4" />
        </Button>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Keyboard Shortcuts</DialogTitle>
            <DialogDescription>Use these keyboard shortcuts to navigate and perform actions quickly.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
            <div>
              <h3 className="font-medium mb-2">Navigation</h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Go to Home</span>
                  <div className="flex items-center gap-1">
                    <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                      g
                    </kbd>
                    <span className="mx-1">then</span>
                    <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                      h
                    </kbd>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Go to Boards</span>
                  <div className="flex items-center gap-1">
                    <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                      g
                    </kbd>
                    <span className="mx-1">then</span>
                    <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                      b
                    </kbd>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <h3 className="font-medium mb-2">General</h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Show keyboard shortcuts</span>
                  <div className="flex items-center gap-1">
                    <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                      Ctrl
                    </kbd>
                    <span className="mx-1">+</span>
                    <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                      ?
                    </kbd>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Toggle dark mode</span>
                  <div className="flex items-center gap-1">
                    <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                      Ctrl
                    </kbd>
                    <span className="mx-1">+</span>
                    <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                      d
                    </kbd>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
