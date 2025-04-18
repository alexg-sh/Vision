"use client"

import { useState, useEffect } from "react"
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
import { useSession, signOut } from "next-auth/react"
import { useNotifications } from "@/hooks/use-notifications" // Import the hook

// Fix TypeScript errors by defining the type for organizations
interface Organization {
  id: string;
  name: string;
}

export default function DashboardHeader() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [showNotifications, setShowNotifications] = useState(false)
  const [organizations, setOrganizations] = useState<Organization[]>([])
  // Use the notifications hook
  const {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
  } = useNotifications()

  useEffect(() => {
    async function fetchOrganizations() {
      if (status === "authenticated" && session?.user?.id) {
        const response = await fetch(`/api/user/organizations`)
        const data: Organization[] = await response.json()
        setOrganizations(data)
      }
    }
    fetchOrganizations()
  }, [status, session])

  const handleLogout = () => {
    signOut({ callbackUrl: '/' }) // Use signOut from next-auth
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
      case "MENTION": // Update cases to match context types
        return <User className="h-4 w-4" />
      case "REPLY": // Update cases to match context types
        return <MessageCircle className="h-4 w-4" />
      // Add other cases from Notification context if needed
      case "INVITE":
        return <UserPlus className="h-4 w-4" />
      case "SYSTEM":
        return <Settings className="h-4 w-4" />
      case "PROJECT_UPDATE":
        return <Building2 className="h-4 w-4" />
      case "TASK_ASSIGNMENT":
        return <CheckCheck className="h-4 w-4" />
      // Keep existing cases or remove if not applicable
      // case "vote":
      //   return <ThumbsUp className="h-4 w-4" />
      // case "status":
      //   return <Clock className="h-4 w-4" />
      // case "announcement":
      //   return <Megaphone className="h-4 w-4" />
      // case "poll":
      //   return <BarChart3 className="h-4 w-4" />
      default:
        return <Bell className="h-4 w-4" />
    }
  }

  // Determine user details for display
  const userName = session?.user?.name || "User"
  const userEmail = session?.user?.email || ""
  const userImage = session?.user?.image || "/placeholder.svg?height=32&width=32"
  const userFallback = userName?.charAt(0).toUpperCase() || "U"

  return (
    <header className="border-b bg-background sticky top-0 z-10">
      {/* Adjusted padding and gap for better spacing */}
      <div className="container flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-6"> {/* Increased gap between logo and nav */}
          <Link href="/dashboard" className="flex items-center gap-2 font-bold text-xl">
            <MessageSquare className="h-6 w-6" />
            <span>Project Vision</span>
          </Link>
          {/* Adjusted gap for nav links */}
          <nav className="hidden md:flex items-center gap-4">
            <Link
              href="/dashboard"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
            >
              <LayoutDashboard className="h-4 w-4" />
              <span>Dashboard</span>
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                {/* Use text-muted-foreground for consistency */}
                <Button variant="ghost" className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                  <Building2 className="h-4 w-4" />
                  Organizations
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start"> {/* Align dropdown start */}
                <DropdownMenuLabel>Your Organizations</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {organizations.length > 0 ? (
                  organizations.map((org) => (
                    <DropdownMenuItem key={org.id} asChild> {/* Use asChild for proper Link behavior */}
                      <Link href={`/organization/${org.id}`} className="flex items-center gap-2 w-full">
                        {/* Add placeholder for org image if available */}
                        {/* <Avatar className="h-5 w-5"><AvatarImage src={org.imageUrl || undefined} /><AvatarFallback>{org.name[0]}</AvatarFallback></Avatar> */}
                        {org.name}
                      </Link>
                    </DropdownMenuItem>
                  ))
                ) : (
                  <DropdownMenuItem disabled>
                    <span className="text-xs text-muted-foreground">No organizations found</span>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild> {/* Use asChild */}
                  <Link href="/dashboard?tab=organizations" className="flex items-center gap-2 w-full text-sm">
                    View All Organizations
                  </Link>
                </DropdownMenuItem>
                 <DropdownMenuItem asChild> {/* Use asChild */}
                  <Link href="/organizations/new" className="flex items-center gap-2 w-full text-sm"> {/* Add Create New Org link */} 
                    Create New Organization
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Link
              href="/boards"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
            >
              <LayoutGrid className="h-4 w-4" />
              <span>Boards</span>
            </Link>
            <Link
              href="/discover"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
            >
              <Compass className="h-4 w-4" />
              <span>Discover</span>
            </Link>
          </nav>
        </div>
        {/* Adjusted gap for right-side items */}
        <div className="flex items-center gap-3">
          <ThemeToggle />

          <Popover open={showNotifications} onOpenChange={setShowNotifications}>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="relative" disabled={isLoading}> {/* Disable button while loading */}
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 h-4 w-4 rounded-full bg-red-500 flex items-center justify-center text-[10px] text-white font-medium">
                    {/* Display real unread count */}
                    {unreadCount > 9 ? '9+' : unreadCount}
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
                {isLoading ? (
                  <div className="p-4 text-center text-muted-foreground">
                    <p>Loading notifications...</p>
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground">
                    <p>No notifications</p>
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <Link
                      key={notification.id}
                      href={notification.link || "/notifications"} // Use link or fallback
                      onClick={async () => {
                        if (!notification.read) {
                           await markAsRead(notification.id) // Mark as read on click
                        }
                        setShowNotifications(false)
                      }}
                    >
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
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1"
                  onClick={async () => {
                    await markAllAsRead() // Call markAllAsRead from hook
                  }}
                  disabled={unreadCount === 0 || isLoading} // Disable if no unread or loading
                >
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

          {status === "authenticated" && session?.user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={userImage} alt={userName} />
                    <AvatarFallback>{userFallback}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{userName}</p>
                    {userEmail && (
                      <p className="text-xs leading-none text-muted-foreground">{userEmail}</p>
                    )}
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
                      {/* Display real unread count */}
                      {unreadCount > 9 ? '9+' : unreadCount}
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
          )}
          {status === "unauthenticated" && (
             <Button onClick={() => router.push('/login')} size="sm">Log In</Button>
          )}
        </div>
      </div>
    </header>
  )
}
