"use client";

import React, { createContext, useState, useEffect, useCallback, useContext, ReactNode } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from '@/hooks/use-toast'; // Assuming use-toast provides a toast function

// Define the shape of a notification
interface Notification {
  id: string;
  type: 'INVITE' | 'MENTION' | 'REPLY' | 'SYSTEM' | 'PROJECT_UPDATE' | 'TASK_ASSIGNMENT';
  content: string;
  link?: string;
  read: boolean;
  timestamp: string; // ISO 8601 date string
  userId: string;
  organizationId?: string;
  projectId?: string;
  taskId?: string;
  senderId?: string;
  inviteStatus?: 'PENDING' | 'ACCEPTED' | 'DECLINED';
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  fetchNotifications: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  addNotification: (notification: Notification) => void; // For potential real-time updates
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { data: session, status: sessionStatus } = useSession();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    if (sessionStatus !== 'authenticated' || !session?.user?.id) {
      // Don't fetch if not authenticated or session is loading
      // console.log("Notification fetch skipped: Session status:", sessionStatus);
       setNotifications([]); // Clear notifications if logged out
       setIsLoading(false);
      return;
    }
    // console.log("Fetching notifications for user:", session.user.id);
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/notifications');
      if (!response.ok) {
        throw new Error(`Failed to fetch notifications: ${response.statusText}`);
      }
      const data: Notification[] = await response.json();
      data.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setNotifications(data);
    } catch (err: any) {
      console.error("Error fetching notifications:", err);
      setError(err.message || "An unexpected error occurred while fetching notifications.");
      // Avoid showing toast on initial load error potentially, or make it less intrusive
      // toast({ title: "Error", description: "Could not load notifications.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [sessionStatus, session?.user?.id]);

  useEffect(() => {
    // Initial fetch
    fetchNotifications();

    // Optional: Implement polling or connect to WebSocket/SSE here for real-time updates
    const intervalId = setInterval(fetchNotifications, 60000); // Poll every 60 seconds

    return () => clearInterval(intervalId); // Cleanup interval on unmount
  }, [fetchNotifications]); // Depend on fetchNotifications callback

  const markAsRead = async (notificationId: string) => {
    // Optimistic update
    const originalNotifications = [...notifications];
    setNotifications(prev =>
      prev.map(n => (n.id === notificationId ? { ...n, read: true } : n))
    );

    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, { method: 'PATCH' });
      if (!response.ok) {
        throw new Error('Failed to mark notification as read');
      }
      // No need to re-fetch, optimistic update is likely sufficient
      // await fetchNotifications(); // Or just update state locally if API confirms success
    } catch (err: any) {
      console.error("Error marking notification as read:", err);
      setNotifications(originalNotifications); // Revert optimistic update on error
      toast({ title: "Error", description: "Could not mark notification as read.", variant: "destructive" });
    }
  };

  const markAllAsRead = async () => {
     // Optimistic update
    const originalNotifications = [...notifications];
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));

    try {
      const response = await fetch('/api/notifications/mark-all-read', { method: 'POST' });
      if (!response.ok) {
        throw new Error('Failed to mark all notifications as read');
      }
       // No need to re-fetch, optimistic update is likely sufficient
       // await fetchNotifications();
    } catch (err: any) {
      console.error("Error marking all notifications as read:", err);
      setNotifications(originalNotifications); // Revert optimistic update
      toast({ title: "Error", description: "Could not mark all notifications as read.", variant: "destructive" });
    }
  };

  // Function to add a notification (e.g., from WebSocket/SSE)
  const addNotification = (notification: Notification) => {
    setNotifications(prev => [notification, ...prev]
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
     toast({ title: "New Notification", description: notification.content });
  };


  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, isLoading, error, fetchNotifications, markAsRead, markAllAsRead, addNotification }}>
      {children}
    </NotificationContext.Provider>
  );
};

// Custom hook to use the NotificationContext
export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
