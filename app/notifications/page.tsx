"use client"

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Bell, MessageSquare, ThumbsUp, User, Settings, CheckCheck, Clock, Megaphone, BarChart3, Check, X, Loader2, Building2 } from "lucide-react"; // Added Building2
import { useToast } from "@/hooks/use-toast";
import { useNotifications } from "@/hooks/use-notifications"; // Import the hook

// Define a type for the notification structure, including invite details
// Use the type from the context if it's exported, otherwise redefine or import
// Assuming the Notification type is available or defined similarly in context
interface Notification {
  id: string;
  type: string;
  read: boolean;
  content: string;
  timestamp: string;
  user?: { // User who triggered the notification (e.g., inviter)
    name: string;
    avatar?: string | null;
  } | null;
  link?: string | null;
  inviteId?: string | null;
  inviteStatus?: "PENDING" | "ACCEPTED" | "DECLINED" | null;
}

export default function NotificationsPage() {
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const { toast } = useToast();

  // Use the notifications hook
  const {
    notifications,
    unreadCount,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
    fetchNotifications, // Get fetch function if needed for retry
  } = useNotifications();

  // Remove local state for notifications, loading, error
  // const [notifications, setNotifications] = useState<Notification[]>([]);
  // const [isLoading, setIsLoading] = useState(true);
  // const [error, setError] = useState<string | null>(null);

  // Keep state specific to this page's actions
  const [isMarkingAllRead, setIsMarkingAllRead] = useState(false); // Keep for button loading state
  const [processingInviteId, setProcessingInviteId] = useState<string | null>(null);

  // Remove local useEffect for fetching notifications
  // useEffect(() => { ... fetchNotifications ... }, [sessionStatus, router, toast]);

  // Redirect if not authenticated (can be handled by layout or middleware too)
  useEffect(() => {
    if (sessionStatus === "unauthenticated") {
      router.push("/login");
    }
  }, [sessionStatus, router]);

  // Use markAllAsRead from the hook
  const handleMarkAllAsRead = async () => {
    setIsMarkingAllRead(true);
    try {
      await markAllAsRead(); // Call the hook function
      toast({
        title: "Success",
        description: "All notifications marked as read.",
      });
    } catch (err) {
      // Error handling might already be in the hook/context, but can add specific UI feedback here
      console.error("Error marking all as read (page):", err);
      toast({
        title: "Error",
        description: "Could not mark all notifications as read.",
        variant: "destructive",
      });
    } finally {
      setIsMarkingAllRead(false);
    }
  };

  // Use markAsRead from the hook
  const handleMarkAsRead = async (id: string) => {
    try {
      await markAsRead(id); // Call the hook function
      // Optional: Add toast feedback if needed, though context might handle it
    } catch (err) {
      console.error(`Error marking notification ${id} as read (page):`, err);
      toast({
        title: "Error",
        description: "Could not mark notification as read.",
        variant: "destructive",
      });
    }
  };

  // Handler for accepting or declining an invite (remains mostly the same, but updates context state)
  const handleInviteResponse = async (inviteId: string, status: "ACCEPTED" | "DECLINED") => {
    setProcessingInviteId(inviteId);
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

      // Instead of setNotifications, trigger a re-fetch or update context if needed
      // The context's optimistic update might handle this, or we might need to enhance it.
      // For now, let's assume optimistic update in context or polling handles the UI update.
      // Or trigger a manual refresh:
      await fetchNotifications(); // Re-fetch to get updated state including invite status

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
      setProcessingInviteId(null);
    }
  };

  // ... (keep formatTimestamp and getNotificationIcon as they are helpers) ...
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
    // Use the same logic as in dashboard-header or import from a shared util
    switch (type) {
      case "MENTION":
        return <User className="h-4 w-4" />
      case "REPLY":
        return <MessageSquare className="h-4 w-4" />
      case "INVITE":
        return <User className="h-4 w-4" />
      case "SYSTEM":
         return <Settings className="h-4 w-4" />
      case "PROJECT_UPDATE":
         return <Building2 className="h-4 w-4" /> // Example, adjust as needed
      case "TASK_ASSIGNMENT":
         return <CheckCheck className="h-4 w-4" /> // Example, adjust as needed
      // Add other types from context
      default:
        return <Bell className="h-4 w-4" />
    }
  };

  // Use isLoading from the hook
  if (sessionStatus === "loading" || (sessionStatus === "authenticated" && isLoading && notifications.length === 0)) {
    // Show loading indicator only on initial load when authenticated
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading notifications...</p>
      </div>
    );
  }

  // Use error from the hook
  if (error) {
     return (
       <div className="flex min-h-screen flex-col">
         <main className="flex-1 container py-6 flex items-center justify-center">
           <Card className="w-full max-w-md text-center">
             <CardHeader>
               <CardTitle>Error Loading Notifications</CardTitle>
               <CardDescription>We couldn't fetch your notifications. Please try again later.</CardDescription>
             </CardHeader>
             <CardContent>
               <p className="text-destructive">{error}</p>
               <Button onClick={fetchNotifications} className="mt-4"> {/* Use fetchNotifications from hook */} 
                 Retry
               </Button>
             </CardContent>
           </Card>
         </main>
       </div>
     );
  }

  // Render function for individual notification items (use hook's markAsRead)
  const renderNotification = (notification: Notification) => {
    const isInvite = notification.type === "INVITE";
    // Ensure inviteStatus check handles null/undefined correctly
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
          {/* ... (Avatar/Icon rendering remains the same) ... */}
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
                  <span className="ml-1">{notification.type === "INVITE" ? "Invite" : notification.type.replace(/_/g, ' ')}</span>
                </Badge>
                {!notification.read && <div className="h-2 w-2 rounded-full bg-primary"></div>}
              </div>
              <span className="text-sm text-muted-foreground">
                {formatTimestamp(notification.timestamp)}
              </span>
            </div>
            <p className="mt-1">{notification.content}</p>

            <div className="flex justify-between items-center mt-2 space-x-2">
              {/* View Details Link */}
              {notification.link && notification.inviteStatus !== 'ACCEPTED' && notification.inviteStatus !== 'DECLINED' && (
                 <Link href={notification.link} passHref legacyBehavior>
                   <Button variant="link" className="p-0 h-auto text-sm" onClick={() => handleMarkAsRead(notification.id)}>
                     View Details
                   </Button>
                 </Link>
              )}
              {(!notification.link || notification.inviteStatus === 'ACCEPTED' || notification.inviteStatus === 'DECLINED') && (isPendingInvite || !notification.read) && <div className="flex-1"></div>}

              {/* Accept/Decline Buttons */}
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

              {/* Mark as Read Button */}
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

  // Use unreadCount from the hook
  const currentUnreadCount = notifications.filter((n) => !n.read).length; // Recalculate based on current context state if needed

  return (
    <main className="flex-1 container py-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold">Notifications</h1>
            {/* Use unreadCount from hook */} 
            {unreadCount > 0 && <Badge className="ml-2">{unreadCount} unread</Badge>}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleMarkAllAsRead} disabled={isMarkingAllRead || unreadCount === 0}>
              <CheckCheck className="mr-2 h-4 w-4" />
              {isMarkingAllRead ? "Marking..." : "Mark all as read"}
            </Button>
            {/* ... (Settings button remains) ... */}
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
                {/* Use isLoading from hook for initial loading state */}
                {isLoading && notifications.length === 0 ? (
                   <div className="text-center py-8">
                     <Loader2 className="h-12 w-12 mx-auto text-muted-foreground mb-4 animate-spin" />
                     <p className="text-muted-foreground">Loading...</p>
                   </div>
                ) : notifications.length === 0 ? (
                  <div className="text-center py-8">
                    <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No notifications</h3>
                    <p className="text-muted-foreground">You don't have any notifications yet.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Render notifications from hook */} 
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
                {/* Filter notifications from hook */} 
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
                {/* Filter notifications from hook */} 
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

        </Tabs>
      </div>
    </main>
  );
}
