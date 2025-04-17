"use client"

import type React from "react"

import { useState, useRef, useEffect, type KeyboardEvent } from "react"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Clock, Star } from "lucide-react"

interface MentionUser {
  id: string
  name: string
  username: string
  avatar?: string
  role: string
  recentlyInteracted?: boolean
  frequentlyMentioned?: boolean
}

interface SmartMentionsInputProps {
  placeholder?: string
  value: string
  onChange: (value: string) => void
  onMention?: (userId: string) => void
  className?: string
  rows?: number
  boardId?: string
}

export default function SmartMentionsInput({
  placeholder = "Write your comment...",
  value,
  onChange,
  onMention,
  className = "",
  rows = 3,
  boardId,
}: SmartMentionsInputProps) {
  const [mentionSearch, setMentionSearch] = useState("")
  const [mentionResults, setMentionResults] = useState<MentionUser[]>([])
  const [showMentions, setShowMentions] = useState(false)
  const [mentionIndex, setMentionIndex] = useState(0)
  const [cursorPosition, setCursorPosition] = useState(0)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const mentionsRef = useRef<HTMLDivElement>(null)

  // In a real app, this would be fetched from your API
  const allUsers: MentionUser[] = [
    {
      id: "user1",
      name: "John Doe",
      username: "johndoe",
      avatar: "/placeholder.svg?height=32&width=32",
      role: "admin",
      recentlyInteracted: true,
      frequentlyMentioned: true,
    },
    {
      id: "user2",
      name: "Jane Smith",
      username: "janesmith",
      avatar: "/placeholder.svg?height=32&width=32",
      role: "moderator",
      recentlyInteracted: true,
    },
    {
      id: "user3",
      name: "Mike Wilson",
      username: "mikewilson",
      avatar: "/placeholder.svg?height=32&width=32",
      role: "member",
    },
    {
      id: "user4",
      name: "Sarah Johnson",
      username: "sarahj",
      avatar: "/placeholder.svg?height=32&width=32",
      role: "member",
      frequentlyMentioned: true,
    },
    {
      id: "user5",
      name: "Alex Thompson",
      username: "alext",
      avatar: "/placeholder.svg?height=32&width=32",
      role: "member",
    },
  ]

  // Function to check if we're in a mention context
  const checkForMention = (text: string, cursorPos: number) => {
    if (cursorPos <= 0) return false

    // Find the last @ symbol before the cursor
    const lastAtIndex = text.lastIndexOf("@", cursorPos - 1)
    if (lastAtIndex === -1) return false

    // Check if there's a space between the @ and the cursor
    const textBetween = text.substring(lastAtIndex + 1, cursorPos)
    if (textBetween.includes(" ")) return false

    // We're in a mention context
    setMentionSearch(textBetween.toLowerCase())
    return true
  }

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value
    const cursorPos = e.target.selectionStart || 0

    onChange(newValue)
    setCursorPosition(cursorPos)

    const inMentionContext = checkForMention(newValue, cursorPos)
    setShowMentions(inMentionContext)

    if (!inMentionContext) {
      setMentionResults([])
      return
    }

    // Filter and sort users based on the mention search
    const filteredUsers = allUsers.filter((user) => {
      return user.name.toLowerCase().includes(mentionSearch) || user.username.toLowerCase().includes(mentionSearch)
    })

    // Sort users: recently interacted > frequently mentioned > alphabetical
    filteredUsers.sort((a, b) => {
      if (a.recentlyInteracted && !b.recentlyInteracted) return -1
      if (!a.recentlyInteracted && b.recentlyInteracted) return 1
      if (a.frequentlyMentioned && !b.frequentlyMentioned) return -1
      if (!a.frequentlyMentioned && b.frequentlyMentioned) return 1
      return a.name.localeCompare(b.name)
    })

    setMentionResults(filteredUsers)
    setMentionIndex(0)
  }

  // Handle selecting a mention
  const selectMention = (user: MentionUser) => {
    if (!textareaRef.current) return

    const text = value
    const cursorPos = cursorPosition

    // Find the position of the @ symbol
    const lastAtIndex = text.lastIndexOf("@", cursorPos - 1)
    if (lastAtIndex === -1) return

    // Replace the @mention with the selected user
    const newText = text.substring(0, lastAtIndex) + `@${user.username} ` + text.substring(cursorPos)
    onChange(newText)

    // Update cursor position
    const newCursorPos = lastAtIndex + user.username.length + 2 // +2 for @ and space
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus()
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos)
        setCursorPosition(newCursorPos)
      }
    }, 0)

    setShowMentions(false)
    setMentionResults([])

    // Notify parent component about the mention
    if (onMention) {
      onMention(user.id)
    }
  }

  // Handle keyboard navigation in mentions dropdown
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (!showMentions || mentionResults.length === 0) return

    // Arrow down
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setMentionIndex((prevIndex) => (prevIndex + 1) % mentionResults.length)
    }

    // Arrow up
    if (e.key === "ArrowUp") {
      e.preventDefault()
      setMentionIndex((prevIndex) => (prevIndex - 1 + mentionResults.length) % mentionResults.length)
    }

    // Enter or Tab to select
    if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault()
      selectMention(mentionResults[mentionIndex])
    }

    // Escape to close
    if (e.key === "Escape") {
      e.preventDefault()
      setShowMentions(false)
    }
  }

  // Position the mentions dropdown
  useEffect(() => {
    if (!showMentions || !textareaRef.current || !mentionsRef.current) return

    const textareaRect = textareaRef.current.getBoundingClientRect()
    const lineHeight = Number.parseInt(getComputedStyle(textareaRef.current).lineHeight)
    const text = textareaRef.current.value.substring(0, cursorPosition)
    const lines = text.split("\n")
    const currentLine = lines.length

    mentionsRef.current.style.top = `${textareaRect.top + (currentLine * lineHeight) + 8}px`
    mentionsRef.current.style.left = `${textareaRect.left}px`
    mentionsRef.current.style.width = `${textareaRect.width}px`
  }, [showMentions, cursorPosition])

  return (
    <div className="relative">
      <Textarea
        ref={textareaRef}
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        className={className}
        rows={rows}
      />

      {showMentions && mentionResults.length > 0 && (
        <div
          ref={mentionsRef}
          className="absolute z-50 bg-background border rounded-md shadow-md max-h-60 overflow-y-auto"
        >
          <div className="p-2 text-xs text-muted-foreground border-b">Suggested mentions</div>
          <div>
            {mentionResults.map((user, index) => (
              <div
                key={user.id}
                className={`flex items-center gap-2 p-2 hover:bg-muted cursor-pointer ${
                  index === mentionIndex ? "bg-muted" : ""
                }`}
                onClick={() => selectMention(user)}
              >
                <Avatar className="h-6 w-6">
                  <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
                  <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium truncate">{user.name}</span>
                    <span className="text-xs text-muted-foreground">@{user.username}</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Badge variant="outline" className="text-[10px] h-4 px-1">
                      {user.role}
                    </Badge>
                    {user.recentlyInteracted && (
                      <Badge variant="outline" className="text-[10px] h-4 px-1 flex items-center gap-0.5">
                        <Clock className="h-2.5 w-2.5" />
                        <span>Recent</span>
                      </Badge>
                    )}
                    {user.frequentlyMentioned && (
                      <Badge variant="outline" className="text-[10px] h-4 px-1 flex items-center gap-0.5">
                        <Star className="h-2.5 w-2.5" />
                        <span>Frequent</span>
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
