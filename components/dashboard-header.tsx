"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Bell,
  MessageSquare,
  Settings,
  User,
  Building2,
  LogOut,
  CheckCheck,
  ThumbsUp,
  MessageCircle,
  Clock,
  UserPlus,
  Megaphone,
  BarChart3,
  LayoutDashboard,
  LayoutGrid,
  Compass,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { ThemeToggle } from "@/components/theme-toggle"
import { Badge } from "@/components/ui/badge"

export default function DashboardHeader() {
  const router = useRouter()
  const [showNotifications, setShowNotifications] = useState(false)

  // Mock notifications
  const notifications = [
    {
      id: 1,
      type: "mention",
      read: false,
      content: "Jane Smith mentioned you in a comment",
      timestamp: new Date(Date.now() - 1000 * 60 * 10).toISOString(), // 10 minutes ago
      link: "/board/1/post/1",
    },
    {
      id: 2,
      type: "reply",
      read: false,
      content: "Mike Johnson replied to your comment",
      timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
      link: "/board/1/post/2",
    },
    {
      id: 3,
      type: "announcement",
      read: false,
      content: "New announcement: Upcoming maintenance",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(), // 12 hours ago
      link: "/board/1/post/3",
    },
  ]

  const unreadCount = notifications.filter((n) => !n.read).length

  const handleLogout = () => {
    // In a real app, this would call an API to log the user out
    router.push("/")
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffSec = Math.floor(diffMs / 1000)
    const diffMin = Math.floor(diffSec / 60)
    const diffHour = Math.floor(diffMin / 60)

    if (diffSec < 60) {
      return "just now"
    } else if (diffMin < 60) {
      return `${diffMin}m ago`
    } else if (diffHour < 24) {
      return `${diffHour}h ago`
    } else {
      return date.toLocaleDateString()
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "mention":
        return <User className="h-4 w-4" />
      case "reply":
        return <MessageCircle className="h-4 w-4" />
      case "vote":
        return <ThumbsUp className="h-4 w-4" />
      case "status":
        return <Clock className="h-4 w-4" />
      case "announcement":
        return <Megaphone className="h-4 w-4" />
      case "poll":
        return <BarChart3 className="h-4 w-4" />
      case "invite":
        return <UserPlus className="h-4 w-4" />
      default:
        return <Bell className="h-4 w-4" />
    }
  }

  return (
    <header className="border-b bg-background sticky top-0 z-10">
      <div className="container flex h-16 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="flex items-center gap-2 font-bold text-xl">
            <MessageSquare className="h-6 w-6" />
            <span>Project Vision</span>
          </Link>
          <nav className="hidden md:flex gap-6">
            <Link
              href="/dashboard"
              className="text-sm font-medium hover:underline underline-offset-4 flex items-center gap-1"
            >
              <LayoutDashboard className="h-4 w-4" />
              <span>Dashboard</span>
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-1 text-sm font-medium">
                  <Building2 className="h-4 w-4" />
                  Organizations
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Your Organizations</DropdownMenuLabel>
                <DropdownMenuItem>
                  <Link href="/organization/1" className="flex items-center gap-2 w-full">
                    Acme Corp
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Link href="/dashboard?tab=organizations" className="flex items-center gap-2 w-full">
                    View All Organizations
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Link
              href="/boards"
              className="text-sm font-medium hover:underline underline-offset-4 flex items-center gap-1"
            >
              <LayoutGrid className="h-4 w-4" />
              <span>Boards</span>
            </Link>
            <Link
              href="/discover"
              className="text-sm font-medium hover:underline underline-offset-4 flex items-center gap-1"
            >
              <Compass className="h-4 w-4" />
              <span>Discover</span>
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />

          <Popover open={showNotifications} onOpenChange={setShowNotifications}>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 h-4 w-4 rounded-full bg-red-500 flex items-center justify-center text-[10px] text-white font-medium">
                    {unreadCount}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
              <div className="p-4 border-b">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold">Notifications</h4>
                  <Link href="/notifications" onClick={() => setShowNotifications(false)}>
                    <Button variant="ghost" size="sm">
                      View All
                    </Button>
                  </Link>
                </div>
              </div>
              <div className="max-h-[300px] overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground">
                    <p>No notifications</p>
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <Link key={notification.id} href={notification.link} onClick={() => setShowNotifications(false)}>
                      <div
                        className={`p-4 border-b hover:bg-muted/50 cursor-pointer ${
                          !notification.read ? "bg-primary/5" : ""
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`mt-0.5 rounded-full p-1.5 ${!notification.read ? "bg-primary/10" : "bg-muted"}`}
                          >
                            {getNotificationIcon(notification.type)}
                          </div>
                          <div className="flex-1 space-y-1">
                            <p className="text-sm">{notification.content}</p>
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-muted-foreground">
                                {formatTimestamp(notification.timestamp)}
                              </span>
                              {!notification.read && (
                                <Badge variant="outline" className="text-[10px] h-5 bg-primary/10">
                                  New
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))
                )}
              </div>
              <div className="p-3 border-t flex justify-between items-center">
                <Button variant="ghost" size="sm" className="gap-1">
                  <CheckCheck className="h-4 w-4" />
                  Mark all as read
                </Button>
                <Link href="/settings?tab=notifications" onClick={() => setShowNotifications(false)}>
                  <Button variant="ghost" size="sm" className="gap-1">
                    <Settings className="h-4 w-4" />
                    Settings
                  </Button>
                </Link>
              </div>
            </PopoverContent>
          </Popover>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="/placeholder.svg?height=32&width=32" alt="@user" />
                  <AvatarFallback>U</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">John Doe</p>
                  <p className="text-xs leading-none text-muted-foreground">john.doe@example.com</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push("/settings")}>
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push("/settings")}>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push("/notifications")}>
                <Bell className="mr-2 h-4 w-4" />
                <span>Notifications</span>
                {unreadCount > 0 && (
                  <Badge className="ml-auto" variant="outline">
                    {unreadCount}
                  </Badge>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
