'use client';

/**
 * ParadisePOS - NotificationCenter Component
 *
 * Dropdown notification panel with bell icon
 */

import { forwardRef, useState, useCallback, useEffect, useRef, type HTMLAttributes } from 'react';
import { Text, Button, Icon, Badge } from '@/components/atoms';
import {
  useNotificationStore,
  selectUnreadCount,
  selectNotifications,
  type Notification,
  type NotificationType,
} from '@/lib/store';
import styles from './NotificationCenter.module.css';

// ============================================
// TYPES
// ============================================

export interface NotificationCenterProps extends HTMLAttributes<HTMLDivElement> {
  /** Position of the dropdown */
  position?: 'left' | 'right';
  /** Max notifications to show */
  maxItems?: number;
}

// ============================================
// HELPERS
// ============================================

const TYPE_ICONS: Record<NotificationType, string> = {
  low_stock: 'warning',
  out_of_stock: 'error',
  supply_received: 'package',
  supply_expected: 'truck',
  supply_ordered: 'cart',
  shift_action: 'clock',
  order_completed: 'check',
  order_cancelled: 'close',
  high_sales: 'chart',
  system: 'settings',
  info: 'info',
  warning: 'warning',
  error: 'error',
  success: 'success',
};

const TYPE_COLORS: Record<NotificationType, 'primary' | 'success' | 'warning' | 'error' | 'secondary'> = {
  low_stock: 'warning',
  out_of_stock: 'error',
  supply_received: 'success',
  supply_expected: 'primary',
  supply_ordered: 'primary',
  shift_action: 'secondary',
  order_completed: 'success',
  order_cancelled: 'error',
  high_sales: 'success',
  system: 'secondary',
  info: 'primary',
  warning: 'warning',
  error: 'error',
  success: 'success',
};

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'щойно';
  if (diffMins < 60) return `${diffMins} хв тому`;
  if (diffHours < 24) return `${diffHours} год тому`;
  if (diffDays === 1) return 'вчора';
  return `${diffDays} дн тому`;
}

// ============================================
// COMPONENT
// ============================================

export const NotificationCenter = forwardRef<HTMLDivElement, NotificationCenterProps>(
  ({ position = 'right', maxItems = 20, className, ...props }, ref) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const unreadCount = useNotificationStore(selectUnreadCount);
    const notifications = useNotificationStore(selectNotifications);
    const { markAsRead, markAllAsRead, removeNotification, clearAll } = useNotificationStore();

    // Close on click outside
    useEffect(() => {
      function handleClickOutside(event: MouseEvent) {
        if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
          setIsOpen(false);
        }
      }

      if (isOpen) {
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
      }
    }, [isOpen]);

    const toggleOpen = useCallback(() => {
      setIsOpen((prev) => !prev);
    }, []);

    const handleNotificationClick = useCallback(
      (notification: Notification) => {
        markAsRead(notification.id);
        if (notification.actionUrl) {
          window.location.href = notification.actionUrl;
        }
      },
      [markAsRead]
    );

    const handleRemove = useCallback(
      (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        removeNotification(id);
      },
      [removeNotification]
    );

    const displayedNotifications = notifications.slice(0, maxItems);

    const classNames = [styles.container, className].filter(Boolean).join(' ');

    return (
      <div ref={containerRef} className={classNames} {...props}>
        {/* Bell Button */}
        <button
          className={styles.bellButton}
          onClick={toggleOpen}
          aria-label={`Сповіщення${unreadCount > 0 ? ` (${unreadCount} непрочитаних)` : ''}`}
        >
          <Icon name="bell" size="md" />
          {unreadCount > 0 && (
            <span className={styles.badge}>{unreadCount > 99 ? '99+' : unreadCount}</span>
          )}
        </button>

        {/* Dropdown Panel */}
        {isOpen && (
          <div className={`${styles.dropdown} ${styles[position]}`}>
            {/* Header */}
            <div className={styles.header}>
              <Text variant="labelLarge" weight="semibold">
                Сповіщення
              </Text>
              {notifications.length > 0 && (
                <div className={styles.headerActions}>
                  {unreadCount > 0 && (
                    <button className={styles.headerBtn} onClick={markAllAsRead}>
                      Прочитати всі
                    </button>
                  )}
                  <button className={styles.headerBtn} onClick={clearAll}>
                    Очистити
                  </button>
                </div>
              )}
            </div>

            {/* Notifications List */}
            <div className={styles.list}>
              {displayedNotifications.length === 0 ? (
                <div className={styles.empty}>
                  <Icon name="bell" size="xl" color="tertiary" />
                  <Text variant="bodySmall" color="tertiary">
                    Немає сповіщень
                  </Text>
                </div>
              ) : (
                displayedNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`${styles.item} ${!notification.read ? styles.unread : ''} ${
                      styles[`priority-${notification.priority}`]
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                    role="button"
                    tabIndex={0}
                  >
                    <div className={`${styles.itemIcon} ${styles[`color-${TYPE_COLORS[notification.type]}`]}`}>
                      <Icon
                        name={TYPE_ICONS[notification.type] as any}
                        size="sm"
                      />
                    </div>
                    <div className={styles.itemContent}>
                      <Text variant="labelSmall" weight="medium" className={styles.itemTitle}>
                        {notification.title}
                      </Text>
                      <Text variant="caption" color="secondary" className={styles.itemMessage}>
                        {notification.message}
                      </Text>
                      <Text variant="caption" color="tertiary" className={styles.itemTime}>
                        {formatTimeAgo(notification.createdAt)}
                      </Text>
                    </div>
                    <button
                      className={styles.itemClose}
                      onClick={(e) => handleRemove(e, notification.id)}
                      aria-label="Видалити"
                    >
                      <Icon name="close" size="xs" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            {notifications.length > maxItems && (
              <div className={styles.footer}>
                <Text variant="caption" color="tertiary">
                  Показано {maxItems} з {notifications.length} сповіщень
                </Text>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }
);

NotificationCenter.displayName = 'NotificationCenter';
