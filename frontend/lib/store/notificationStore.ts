/**
 * ParadisePOS - Notification Store
 *
 * Centralized notification management
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ============================================
// TYPES
// ============================================

export type NotificationType =
  | 'low_stock'
  | 'out_of_stock'
  | 'supply_received'
  | 'supply_expected'
  | 'supply_ordered'
  | 'shift_action'
  | 'order_completed'
  | 'order_cancelled'
  | 'high_sales'
  | 'system'
  | 'info'
  | 'warning'
  | 'error'
  | 'success';

export type NotificationPriority = 'critical' | 'high' | 'normal' | 'low' | 'info';

export interface Notification {
  id: string;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  read: boolean;
  actionUrl?: string;
  actionLabel?: string;
  createdAt: string;
  expiresAt?: string;
  source?: string;
}

export interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  soundEnabled: boolean;

  // Actions
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) => string;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
  clearExpired: () => void;
  toggleSound: () => void;

  // Quick notification creators
  notifyLowStock: (itemName: string, current: number, min: number, unit: string) => void;
  notifyOutOfStock: (itemName: string) => void;
  notifySupplyReceived: (supplierName: string, totalItems: number) => void;
  notifySupplyOrdered: (supplierName: string) => void;
  notifyShiftAction: (action: string, performer: string, details?: string) => void;
  notifyOrderCompleted: (orderNumber: string, total: number) => void;
  notifyError: (title: string, message: string) => void;
  notifySuccess: (title: string, message: string) => void;
}

// ============================================
// HELPERS
// ============================================

function generateId(): string {
  return `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function getPriorityForType(type: NotificationType): NotificationPriority {
  switch (type) {
    case 'out_of_stock':
    case 'error':
      return 'critical';
    case 'low_stock':
    case 'warning':
      return 'high';
    case 'supply_received':
    case 'order_completed':
    case 'success':
      return 'normal';
    case 'shift_action':
    case 'info':
      return 'low';
    default:
      return 'normal';
  }
}

// ============================================
// STORE
// ============================================

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      notifications: [],
      unreadCount: 0,
      soundEnabled: true,

      addNotification: (notification) => {
        const id = generateId();
        const newNotification: Notification = {
          ...notification,
          id,
          createdAt: new Date().toISOString(),
          read: false,
          priority: notification.priority || getPriorityForType(notification.type),
        };

        set((state) => ({
          notifications: [newNotification, ...state.notifications].slice(0, 100),
          unreadCount: state.unreadCount + 1,
        }));

        // Play sound for high priority notifications
        if (get().soundEnabled && ['critical', 'high'].includes(newNotification.priority)) {
          // Sound would be played here in a real implementation
          console.log('🔔 Notification:', newNotification.title);
        }

        return id;
      },

      markAsRead: (id) => {
        set((state) => {
          const notification = state.notifications.find((n) => n.id === id);
          if (!notification || notification.read) return state;

          return {
            notifications: state.notifications.map((n) =>
              n.id === id ? { ...n, read: true } : n
            ),
            unreadCount: Math.max(0, state.unreadCount - 1),
          };
        });
      },

      markAllAsRead: () => {
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, read: true })),
          unreadCount: 0,
        }));
      },

      removeNotification: (id) => {
        set((state) => {
          const notification = state.notifications.find((n) => n.id === id);
          return {
            notifications: state.notifications.filter((n) => n.id !== id),
            unreadCount: notification && !notification.read
              ? Math.max(0, state.unreadCount - 1)
              : state.unreadCount,
          };
        });
      },

      clearAll: () => {
        set({ notifications: [], unreadCount: 0 });
      },

      clearExpired: () => {
        const now = new Date().toISOString();
        set((state) => {
          const active = state.notifications.filter(
            (n) => !n.expiresAt || n.expiresAt > now
          );
          const removedUnread = state.notifications.filter(
            (n) => n.expiresAt && n.expiresAt <= now && !n.read
          ).length;
          return {
            notifications: active,
            unreadCount: Math.max(0, state.unreadCount - removedUnread),
          };
        });
      },

      toggleSound: () => {
        set((state) => ({ soundEnabled: !state.soundEnabled }));
      },

      // ========== QUICK CREATORS ==========

      notifyLowStock: (itemName, current, min, unit) => {
        get().addNotification({
          type: 'low_stock',
          priority: 'high',
          title: 'Мало на складі',
          message: `${itemName}: залишилось ${current} ${unit} (мін: ${min} ${unit})`,
          data: { itemName, current, min, unit },
          actionUrl: '/admin/inventory',
          actionLabel: 'Перейти до складу',
        });
      },

      notifyOutOfStock: (itemName) => {
        get().addNotification({
          type: 'out_of_stock',
          priority: 'critical',
          title: 'Закінчився товар',
          message: `${itemName} закінчився на складі!`,
          data: { itemName },
          actionUrl: '/admin/inventory',
          actionLabel: 'Замовити',
        });
      },

      notifySupplyReceived: (supplierName, totalItems) => {
        get().addNotification({
          type: 'supply_received',
          priority: 'normal',
          title: 'Поставка отримана',
          message: `Отримано поставку від ${supplierName} (${totalItems} позицій)`,
          data: { supplierName, totalItems },
        });
      },

      notifySupplyOrdered: (supplierName) => {
        get().addNotification({
          type: 'supply_ordered',
          priority: 'normal',
          title: 'Замовлення відправлено',
          message: `Замовлення відправлено постачальнику ${supplierName}`,
          data: { supplierName },
        });
      },

      notifyShiftAction: (action, performer, details) => {
        get().addNotification({
          type: 'shift_action',
          priority: 'low',
          title: action,
          message: details ? `${performer}: ${details}` : performer,
          data: { action, performer, details },
          source: 'shift',
        });
      },

      notifyOrderCompleted: (orderNumber, total) => {
        get().addNotification({
          type: 'order_completed',
          priority: 'info',
          title: 'Замовлення завершено',
          message: `Замовлення #${orderNumber} - ₴${total.toFixed(2)}`,
          data: { orderNumber, total },
          expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 min
        });
      },

      notifyError: (title, message) => {
        get().addNotification({
          type: 'error',
          priority: 'critical',
          title,
          message,
        });
      },

      notifySuccess: (title, message) => {
        get().addNotification({
          type: 'success',
          priority: 'normal',
          title,
          message,
          expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 min
        });
      },
    }),
    {
      name: 'paradise-pos-notifications',
      partialize: (state) => ({
        notifications: state.notifications.slice(0, 50),
        soundEnabled: state.soundEnabled,
      }),
    }
  )
);

// ============================================
// SELECTORS
// ============================================

export const selectNotifications = (state: NotificationState) => state.notifications;
export const selectUnreadCount = (state: NotificationState) => state.unreadCount;
export const selectUnreadNotifications = (state: NotificationState) =>
  state.notifications.filter((n) => !n.read);
export const selectCriticalNotifications = (state: NotificationState) =>
  state.notifications.filter((n) => n.priority === 'critical' && !n.read);
export const selectNotificationsByType = (type: NotificationType) => (state: NotificationState) =>
  state.notifications.filter((n) => n.type === type);
