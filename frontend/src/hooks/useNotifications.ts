import { useState, useEffect, useCallback, useRef } from 'react';
import { Notification } from '../types';
import apiService from '../services/apiService';

const POLLING_INTERVAL = 30000; // 30 seconds

interface UseNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  refreshNotifications: () => Promise<void>;
  markAsRead: (id: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

export const useNotifications = (authUser: any): UseNotificationsReturn => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isAuthenticatedRef = useRef<boolean>(false);

  // Update authentication status ref
  useEffect(() => {
    isAuthenticatedRef.current = !!authUser;
  }, [authUser]);

  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticatedRef.current) {
      return;
    }

    try {
      const [notifs, count] = await Promise.all([
        apiService.getNotifications(50),
        apiService.getUnreadNotificationsCount()
      ]);

      setNotifications(notifs);
      setUnreadCount(count);
      setError(null);
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError('Error al cargar notificaciones');
    }
  }, []);

  const refreshNotifications = useCallback(async () => {
    setIsLoading(true);
    try {
      await fetchNotifications();
    } finally {
      setIsLoading(false);
    }
  }, [fetchNotifications]);

  const markAsRead = useCallback(async (id: number) => {
    try {
      await apiService.markNotificationAsRead(id);

      // Update local state
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Error marking notification as read:', err);
      throw err;
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await apiService.markAllNotificationsAsRead();

      // Update local state
      setNotifications(prev =>
        prev.map(n => ({ ...n, is_read: true }))
      );
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
      throw err;
    }
  }, []);

  // Initial fetch when user logs in
  useEffect(() => {
    if (authUser) {
      refreshNotifications();
    } else {
      // Clear notifications when user logs out
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [authUser, refreshNotifications]);

  // Set up polling
  useEffect(() => {
    if (!authUser) {
      // Clear interval if user is not authenticated
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Start polling
    intervalRef.current = setInterval(() => {
      if (isAuthenticatedRef.current) {
        fetchNotifications();
      }
    }, POLLING_INTERVAL);

    // Cleanup on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [authUser, fetchNotifications]);

  // Also refresh when window regains focus
  useEffect(() => {
    const handleFocus = () => {
      if (isAuthenticatedRef.current) {
        fetchNotifications();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [fetchNotifications]);

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    refreshNotifications,
    markAsRead,
    markAllAsRead
  };
};

export default useNotifications;
