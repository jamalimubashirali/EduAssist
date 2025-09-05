import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

export interface Notification {
  id: string
  type: string
  title: string
  message: string
  timestamp: string
  read: boolean
  icon: string
  color: string
  xp: number
  actionUrl: string
}

// Initial empty state - notifications will be loaded from backend
const initialNotifications: Notification[] = []

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  setNotifications: (notifications: Notification[]) => void;
  addNotification: (notification: Partial<Notification>) => void;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
}

export const useNotificationStore = create<NotificationState>()(
  devtools(
    (set) => ({
      notifications: initialNotifications,
      unreadCount: initialNotifications.filter(n => !n.read).length,
      setNotifications: (notifications) => set({ 
        notifications,
        unreadCount: notifications.filter(n => !n.read).length
      }),
      addNotification: (notification) => set((state) => {
        const newNotification: Notification = {
          id: `notif_${Date.now()}`,
          timestamp: new Date().toISOString(),
          read: false,
          type: 'system',
          icon: '🔔',
          color: 'from-gray-500 to-gray-600',
          xp: 0,
          actionUrl: '/',
          ...notification,
          title: notification.title || 'New Notification',
          message: notification.message || '',
        };
        const notifications = [newNotification, ...state.notifications];
        return {
          notifications,
          unreadCount: notifications.filter(n => !n.read).length
        };
      }),
      markAsRead: (notificationId) => set((state) => {
        const notifications = state.notifications.map(n => 
          n.id === notificationId ? { ...n, read: true } : n
        );
        return {
          notifications,
          unreadCount: notifications.filter(n => !n.read).length
        };
      }),
      markAllAsRead: () => set((state) => {
        const notifications = state.notifications.map(n => ({ ...n, read: true }));
        return {
          notifications,
          unreadCount: 0
        };
      }),
      clearAll: () => set({ notifications: [], unreadCount: 0 }),
    }),
    { name: 'notification-store' }
  )
);
