"use client"

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react"; // Import useSession
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Bell, MessageSquare, ThumbsUp, User, Settings, CheckCheck, Clock, Megaphone, BarChart3, Check, X, Loader2 } from "lucide-react"; // Added Check, X, Loader2
import DashboardHeader from "@/components/dashboard-header";
import { useToast } from "@/hooks/use-toast"; // Import useToast

// Define a type for the notification structure, including invite details
interface Notification {
  id: string; // Use string ID from DB
  type: string;
  read: boolean;
  content: string;
  timestamp: string;
  user?: { // User who triggered the notification (e.g., inviter)
    name: string;
    avatar?: string | null;
  } | null;
  link?: string | null;
  inviteId?: string | null; // Link to the Invite record
  inviteStatus?: "PENDING" | "ACCEPTED" | "DECLINED" | null; // Status of the related invite
}

export default function NotificationsPage() {
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession(); // Get session
  const { toast } = useToast(); // Initialize toast

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true); // Loading state for initial fetch
  const [error, setError] = useState<string | null>(null); // Error state for initial fetch
  const [isMarkingAllRead, setIsMarkingAllRead] = useState(false);
  const [processingInviteId, setProcessingInviteId] = useState<string | null>(null); // Track which invite is being processed

  // Fetch notifications when component mounts and session is loaded
  useEffect(() => {
    if (sessionStatus === "authenticated") {
      const fetchNotifications = async () => {
        setIsLoading(true);
        setError(null);
        try {
          // Assume an API endpoint /api/notifications exists
          const response = await fetch("/api/notifications");
          if (!response.ok) {
            throw new Error("Failed to fetch notifications");
          }
          const data: Notification[] = await response.json();
          // Sort by timestamp descending (newest first)
          data.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
          setNotifications(data);
        } catch (err: any) {
          setError(err.message || "An unexpected error occurred.");
          toast({
            title: "Error",
            description: "Could not load notifications.",
            variant: "destructive",
          });
        } finally {
          setIsLoading(false);
        }
      };
      fetchNotifications();
    } else if (sessionStatus === "unauthenticated") {
      // Redirect to login if not authenticated
      router.push("/login");
    }
    // Run effect when session status changes
  }, [sessionStatus, router, toast]);


  const handleMarkAllAsRead = async () => {
    setIsMarkingAllRead(true);
    try {
      // Assume an API endpoint /api/notifications/mark-all-read exists
      const response = await fetch("/api/notifications/mark-all-read", { method: "POST" });
      if (!response.ok) {
        throw new Error("Failed to mark all as read");
      }
      setNotifications(notifications.map((notification) => ({ ...notification, read: true })));
      toast({
        title: "Success",
        description: "All notifications marked as read.",
      });
    } catch (err: any) {
      console.error("Error marking all as read:", err);
      toast({
        title: "Error",
        description: "Could not mark all notifications as read.",
        variant: "destructive",
      });
    } finally {
      setIsMarkingAllRead(false);
    }
  };

  const handleMarkAsRead = async (id: string) => {
     // Optimistically update UI
     const originalNotifications = [...notifications];
     setNotifications(
       notifications.map((notification) => (notification.id === id ? { ...notification, read: true } : notification)),
     );

    try {
      // Assume an API endpoint /api/notifications/[id]/mark-read exists
      const response = await fetch(`/api/notifications/${id}/mark-read`, { method: "POST" });
      if (!response.ok) {
        // Revert optimistic update on failure
        setNotifications(originalNotifications);
        throw new Error("Failed to mark as read");
      }
      // No need to re-set state if API call succeeds, already done optimistically
    } catch (err: any) {
      console.error(`Error marking notification ${id} as read:`, err);
      // Revert optimistic update on failure
      setNotifications(originalNotifications);
      toast({
        title: "Error",
        description: "Could not mark notification as read.",
        variant: "destructive",
      });
    }
  };

  // Handler for accepting or declining an invite
  const handleInviteResponse = async (inviteId: string, status: "ACCEPTED" | "DECLINED") => {
    setProcessingInviteId(inviteId); // Set loading state for this specific invite
    try {
      const response = await fetch(`/api/invites/${inviteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || `Failed to ${status.toLowerCase()} invite`);
      }

      // Update the notification state to reflect the change
      setNotifications(prevNotifications =>
        prevNotifications.map(notif => {
          if (notif.inviteId === inviteId) {
            return {
              ...notif,
              read: true, // Mark as read upon action
              inviteStatus: status, // Update invite status
              // Optionally update content based on the action
              content: `You ${status.toLowerCase()} the invitation.`, // Update content to reflect action
            };
          }
          return notif;
        })
      );

      toast({
        title: "Success",
        description: result.message || `Invitation ${status.toLowerCase()} successfully.`,
      });

    } catch (err: any) {
      console.error(`Error responding to invite ${inviteId}:`, err);
      toast({
        title: "Error",
        description: err.message || "Could not process your response to the invitation.",
        variant: "destructive",
      });
    } finally {
      setProcessingInviteId(null); // Clear loading state
    }
  };


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
  };

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
      case "INVITE": // Match the type from the backend
        return <User className="h-4 w-4" />
      default:
        return <Bell className="h-4 w-4" />
    }
  };

  // Calculate unread count based on fetched data
  const unreadCount = notifications.filter((notification) => !notification.read).length;

  // Handle loading state for session
  if (sessionStatus === "loading" || isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading notifications...</p>
      </div>
    );
  }

  // Handle error state for initial fetch
  if (error) {
     return (
       <div className="flex min-h-screen flex-col">
         <DashboardHeader />
         <main className="flex-1 container py-6 flex items-center justify-center">
           <Card className="w-full max-w-md text-center">
             <CardHeader>
               <CardTitle>Error Loading Notifications</CardTitle>
               <CardDescription>We couldn't fetch your notifications. Please try again later.</CardDescription>
             </CardHeader>
             <CardContent>
               <p className="text-destructive">{error}</p>
               <Button onClick={() => window.location.reload()} className="mt-4">
                 Retry
               </Button>
             </CardContent>
           </Card>
         </main>
       </div>
     );
  }


  // Render function for individual notification items
  const renderNotification = (notification: Notification) => {
    const isInvite = notification.type === "INVITE";
    const isPendingInvite = isInvite && notification.inviteStatus === "PENDING";
    const isProcessingThisInvite = processingInviteId === notification.inviteId;

    return (
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
                  {/* Display 'Invite' instead of 'INVITE' */}
                  <span className="ml-1">{notification.type === "INVITE" ? "Invite" : notification.type}</span>
                </Badge>
                {!notification.read && <div className="h-2 w-2 rounded-full bg-primary"></div>}
              </div>
              <span className="text-sm text-muted-foreground">
                {formatTimestamp(notification.timestamp)}
              </span>
            </div>
            <p className="mt-1">{notification.content}</p>

            {/* Action buttons area */}
            <div className="flex justify-between items-center mt-2 space-x-2">
              {/* View Details Link (always show if link exists, unless it's a processed invite?) */}
              {notification.link && notification.inviteStatus !== 'ACCEPTED' && notification.inviteStatus !== 'DECLINED' && (
                 <Link href={notification.link} passHref legacyBehavior>
                   <Button variant="link" className="p-0 h-auto text-sm">
                     View Details
                   </Button>
                 </Link>
              )}
               {/* Spacer if no details link but other buttons exist */}
               {(!notification.link || notification.inviteStatus === 'ACCEPTED' || notification.inviteStatus === 'DECLINED') && (isPendingInvite || !notification.read) && <div className="flex-1"></div>}


              {/* Accept/Decline Buttons for Pending Invites */}
              {isPendingInvite && notification.inviteId && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleInviteResponse(notification.inviteId!, "DECLINED")}
                    disabled={isProcessingThisInvite}
                  >
                    {isProcessingThisInvite ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <X className="mr-2 h-4 w-4" />}
                    Decline
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleInviteResponse(notification.inviteId!, "ACCEPTED")}
                    disabled={isProcessingThisInvite}
                  >
                    {isProcessingThisInvite ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                    Accept
                  </Button>
                </div>
              )}

              {/* Mark as Read Button (only if not read and not a pending invite) */}
              {!notification.read && !isPendingInvite && (
                <Button variant="ghost" size="sm" onClick={() => handleMarkAsRead(notification.id)}>
                  Mark as read
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };


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
              {/* Add other filters if needed */}
              {/* <TabsTrigger value="mentions">Mentions</TabsTrigger> */}
              {/* <TabsTrigger value="replies">Replies</TabsTrigger> */}
               <TabsTrigger value="invites">Invites</TabsTrigger>
            </TabsList>

            {/* All Notifications Tab */}
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
                      {notifications.map(renderNotification)}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Unread Notifications Tab */}
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
                        .map(renderNotification)}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

             {/* Invites Tab */}
            <TabsContent value="invites">
              <Card>
                <CardHeader>
                  <CardTitle>Invitations</CardTitle>
                  <CardDescription>View your pending and past invitations.</CardDescription>
                </CardHeader>
                <CardContent>
                  {notifications.filter(n => n.type === 'INVITE').length === 0 ? (
                    <div className="text-center py-8">
                      <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium mb-2">No Invitations</h3>
                      <p className="text-muted-foreground">You haven't received any invitations yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {notifications
                        .filter(notification => notification.type === 'INVITE')
                        .map(renderNotification)}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Add other TabsContent sections if needed */}

          </Tabs>
        </div>
      </main>
    </div>
  );
}
