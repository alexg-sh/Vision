"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Bell, MessageSquare, ThumbsUp, User, Settings, CheckCheck, Clock, Megaphone, BarChart3 } from "lucide-react"
import DashboardHeader from "@/components/dashboard-header"

export default function NotificationsPage() {
  const router = useRouter()
  const [isMarkingAllRead, setIsMarkingAllRead] = useState(false)

  // Mock notifications data
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: "mention",
      read: false,
      content: "Jane Smith mentioned you in a comment on 'Add dark mode support'",
      timestamp: new Date(Date.now() - 1000 * 60 * 10).toISOString(), // 10 minutes ago
      user: {
        name: "Jane Smith",
        avatar: "/placeholder.svg?height=40&width=40",
      },
      link: "/board/1/post/1",
    },
    {
      id: 2,
      type: "reply",
      read: false,
      content: "Mike Johnson replied to your comment on 'Improve mobile responsiveness'",
      timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
      user: {
        name: "Mike Johnson",
        avatar: "/placeholder.svg?height=40&width=40",
      },
      link: "/board/1/post/2",
    },
    {
      id: 3,
      type: "vote",
      read: true,
      content: "Your post 'Add export to CSV feature' received 5 new upvotes",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
      link: "/board/1/post/3",
    },
    {
      id: 4,
      type: "status",
      read: true,
      content: "The status of 'Add dark mode support' changed from 'Planned' to 'In Progress'",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), // 5 hours ago
      link: "/board/1/post/1",
    },
    {
      id: 5,
      type: "announcement",
      read: false,
      content: "New announcement: 'Important: Upcoming maintenance'",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(), // 12 hours ago
      user: {
        name: "Admin User",
        avatar: "/placeholder.svg?height=40&width=40",
      },
      link: "/board/1/post/3",
    },
    {
      id: 6,
      type: "poll",
      read: true,
      content: "New poll: 'Which feature should we prioritize next?'",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
      user: {
        name: "Jane Smith",
        avatar: "/placeholder.svg?height=40&width=40",
      },
      link: "/board/1/post/4",
    },
    {
      id: 7,
      type: "invite",
      read: false,
      content: "You were invited to join the 'Design Team' organization",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString(), // 1.5 days ago
      user: {
        name: "Sarah Williams",
        avatar: "/placeholder.svg?height=40&width=40",
      },
      link: "/organization/2",
    },
  ])

  const handleMarkAllAsRead = () => {
    setIsMarkingAllRead(true)
    // Simulate API call
    setTimeout(() => {
      setNotifications(notifications.map((notification) => ({ ...notification, read: true })))
      setIsMarkingAllRead(false)
    }, 1000)
  }

  const handleMarkAsRead = (id: number) => {
    setNotifications(
      notifications.map((notification) => (notification.id === id ? { ...notification, read: true } : notification)),
    )
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffSec = Math.floor(diffMs / 1000)
    const diffMin = Math.floor(diffSec / 60)
    const diffHour = Math.floor(diffMin / 60)
    const diffDay = Math.floor(diffHour / 24)

    if (diffSec < 60) {
      return "just now"
    } else if (diffMin < 60) {
      return `${diffMin} minute${diffMin > 1 ? "s" : ""} ago`
    } else if (diffHour < 24) {
      return `${diffHour} hour${diffHour > 1 ? "s" : ""} ago`
    } else if (diffDay < 7) {
      return `${diffDay} day${diffDay > 1 ? "s" : ""} ago`
    } else {
      return date.toLocaleDateString()
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "mention":
        return <User className="h-4 w-4" />
      case "reply":
        return <MessageSquare className="h-4 w-4" />
      case "vote":
        return <ThumbsUp className="h-4 w-4" />
      case "status":
        return <Clock className="h-4 w-4" />
      case "announcement":
        return <Megaphone className="h-4 w-4" />
      case "poll":
        return <BarChart3 className="h-4 w-4" />
      case "invite":
        return <User className="h-4 w-4" />
      default:
        return <Bell className="h-4 w-4" />
    }
  }

  const unreadCount = notifications.filter((notification) => !notification.read).length

  return (
    <div className="flex min-h-screen flex-col">
      <DashboardHeader />
      <main className="flex-1 container py-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold">Notifications</h1>
              {unreadCount > 0 && <Badge className="ml-2">{unreadCount} unread</Badge>}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleMarkAllAsRead} disabled={isMarkingAllRead || unreadCount === 0}>
                <CheckCheck className="mr-2 h-4 w-4" />
                {isMarkingAllRead ? "Marking..." : "Mark all as read"}
              </Button>
              <Button variant="outline" onClick={() => router.push("/settings?tab=notifications")}>
                <Settings className="mr-2 h-4 w-4" />
                Notification Settings
              </Button>
            </div>
          </div>

          <Tabs defaultValue="all" className="space-y-6">
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="unread">Unread</TabsTrigger>
              <TabsTrigger value="mentions">Mentions</TabsTrigger>
              <TabsTrigger value="replies">Replies</TabsTrigger>
            </TabsList>

            <TabsContent value="all">
              <Card>
                <CardHeader>
                  <CardTitle>All Notifications</CardTitle>
                  <CardDescription>View all your recent notifications.</CardDescription>
                </CardHeader>
                <CardContent>
                  {notifications.length === 0 ? (
                    <div className="text-center py-8">
                      <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium mb-2">No notifications</h3>
                      <p className="text-muted-foreground">You don't have any notifications yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`p-4 rounded-lg border ${
                            !notification.read ? "bg-primary/5 border-primary/20" : ""
                          }`}
                        >
                          <div className="flex gap-4">
                            {notification.user ? (
                              <Avatar className="h-10 w-10">
                                <AvatarImage
                                  src={notification.user.avatar || "/placeholder.svg"}
                                  alt={notification.user.name}
                                />
                                <AvatarFallback>{notification.user.name.charAt(0)}</AvatarFallback>
                              </Avatar>
                            ) : (
                              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                {getNotificationIcon(notification.type)}
                              </div>
                            )}
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="capitalize">
                                    {getNotificationIcon(notification.type)}
                                    <span className="ml-1">{notification.type}</span>
                                  </Badge>
                                  {!notification.read && <div className="h-2 w-2 rounded-full bg-primary"></div>}
                                </div>
                                <span className="text-sm text-muted-foreground">
                                  {formatTimestamp(notification.timestamp)}
                                </span>
                              </div>
                              <p className="mt-1">{notification.content}</p>
                              <div className="flex justify-between items-center mt-2">
                                <Link href={notification.link}>
                                  <Button variant="link" className="p-0 h-auto">
                                    View Details
                                  </Button>
                                </Link>
                                {!notification.read && (
                                  <Button variant="ghost" size="sm" onClick={() => handleMarkAsRead(notification.id)}>
                                    Mark as read
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="unread">
              <Card>
                <CardHeader>
                  <CardTitle>Unread Notifications</CardTitle>
                  <CardDescription>View your unread notifications.</CardDescription>
                </CardHeader>
                <CardContent>
                  {notifications.filter((n) => !n.read).length === 0 ? (
                    <div className="text-center py-8">
                      <CheckCheck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium mb-2">All caught up!</h3>
                      <p className="text-muted-foreground">You have no unread notifications.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {notifications
                        .filter((notification) => !notification.read)
                        .map((notification) => (
                          <div key={notification.id} className="p-4 rounded-lg border bg-primary/5 border-primary/20">
                            <div className="flex gap-4">
                              {notification.user ? (
                                <Avatar className="h-10 w-10">
                                  <AvatarImage
                                    src={notification.user.avatar || "/placeholder.svg"}
                                    alt={notification.user.name}
                                  />
                                  <AvatarFallback>{notification.user.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                              ) : (
                                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                  {getNotificationIcon(notification.type)}
                                </div>
                              )}
                              <div className="flex-1">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="capitalize">
                                      {getNotificationIcon(notification.type)}
                                      <span className="ml-1">{notification.type}</span>
                                    </Badge>
                                    <div className="h-2 w-2 rounded-full bg-primary"></div>
                                  </div>
                                  <span className="text-sm text-muted-foreground">
                                    {formatTimestamp(notification.timestamp)}
                                  </span>
                                </div>
                                <p className="mt-1">{notification.content}</p>
                                <div className="flex justify-between items-center mt-2">
                                  <Link href={notification.link}>
                                    <Button variant="link" className="p-0 h-auto">
                                      View Details
                                    </Button>
                                  </Link>
                                  <Button variant="ghost" size="sm" onClick={() => handleMarkAsRead(notification.id)}>
                                    Mark as read
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="mentions">
              <Card>
                <CardHeader>
                  <CardTitle>Mentions</CardTitle>
                  <CardDescription>View notifications where you were mentioned.</CardDescription>
                </CardHeader>
                <CardContent>
                  {notifications.filter((n) => n.type === "mention").length === 0 ? (
                    <div className="text-center py-8">
                      <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium mb-2">No mentions</h3>
                      <p className="text-muted-foreground">You haven't been mentioned yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {notifications
                        .filter((notification) => notification.type === "mention")
                        .map((notification) => (
                          <div
                            key={notification.id}
                            className={`p-4 rounded-lg border ${
                              !notification.read ? "bg-primary/5 border-primary/20" : ""
                            }`}
                          >
                            <div className="flex gap-4">
                              <Avatar className="h-10 w-10">
                                <AvatarImage
                                  src={notification.user?.avatar || "/placeholder.svg"}
                                  alt={notification.user?.name}
                                />
                                <AvatarFallback>{notification.user?.name.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="capitalize">
                                      <User className="h-4 w-4" />
                                      <span className="ml-1">mention</span>
                                    </Badge>
                                    {!notification.read && <div className="h-2 w-2 rounded-full bg-primary"></div>}
                                  </div>
                                  <span className="text-sm text-muted-foreground">
                                    {formatTimestamp(notification.timestamp)}
                                  </span>
                                </div>
                                <p className="mt-1">{notification.content}</p>
                                <div className="flex justify-between items-center mt-2">
                                  <Link href={notification.link}>
                                    <Button variant="link" className="p-0 h-auto">
                                      View Details
                                    </Button>
                                  </Link>
                                  {!notification.read && (
                                    <Button variant="ghost" size="sm" onClick={() => handleMarkAsRead(notification.id)}>
                                      Mark as read
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="replies">
              <Card>
                <CardHeader>
                  <CardTitle>Replies</CardTitle>
                  <CardDescription>View notifications for replies to your posts and comments.</CardDescription>
                </CardHeader>
                <CardContent>
                  {notifications.filter((n) => n.type === "reply").length === 0 ? (
                    <div className="text-center py-8">
                      <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium mb-2">No replies</h3>
                      <p className="text-muted-foreground">You haven't received any replies yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {notifications
                        .filter((notification) => notification.type === "reply")
                        .map((notification) => (
                          <div
                            key={notification.id}
                            className={`p-4 rounded-lg border ${
                              !notification.read ? "bg-primary/5 border-primary/20" : ""
                            }`}
                          >
                            <div className="flex gap-4">
                              <Avatar className="h-10 w-10">
                                <AvatarImage
                                  src={notification.user?.avatar || "/placeholder.svg"}
                                  alt={notification.user?.name}
                                />
                                <AvatarFallback>{notification.user?.name.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="capitalize">
                                      <MessageSquare className="h-4 w-4" />
                                      <span className="ml-1">reply</span>
                                    </Badge>
                                    {!notification.read && <div className="h-2 w-2 rounded-full bg-primary"></div>}
                                  </div>
                                  <span className="text-sm text-muted-foreground">
                                    {formatTimestamp(notification.timestamp)}
                                  </span>
                                </div>
                                <p className="mt-1">{notification.content}</p>
                                <div className="flex justify-between items-center mt-2">
                                  <Link href={notification.link}>
                                    <Button variant="link" className="p-0 h-auto">
                                      View Details
                                    </Button>
                                  </Link>
                                  {!notification.read && (
                                    <Button variant="ghost" size="sm" onClick={() => handleMarkAsRead(notification.id)}>
                                      Mark as read
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}
