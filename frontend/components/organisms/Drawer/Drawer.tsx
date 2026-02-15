'use client';

/**
 * CoffeePOS - Drawer Component
 *
 * Slide-out navigation panel with overlay backdrop
 */

import { useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Text, Icon, Button, Avatar, Divider } from '@/components/atoms';
import type { NavGroup, UserInfo } from '@/components/organisms/Sidebar';
import styles from './Drawer.module.css';

// ============================================
// TYPES
// ============================================

export interface DrawerProps {
  /** Whether the drawer is open */
  open: boolean;
  /** Callback to close the drawer */
  onClose: () => void;
  /** Navigation groups */
  navigation: NavGroup[];
  /** Current active item ID */
  activeItemId?: string;
  /** Callback when nav item is clicked */
  onNavigate?: (itemId: string, href?: string) => void;
  /** Current user info */
  user?: UserInfo;
}

// ============================================
// COMPONENT
// ============================================

export function Drawer({
  open,
  onClose,
  navigation,
  activeItemId,
  onNavigate,
  user,
}: DrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  // Handle escape key
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    },
    [onClose]
  );

  // Focus trap and body scroll lock
  useEffect(() => {
    if (open) {
      previousActiveElement.current = document.activeElement as HTMLElement;
      drawerRef.current?.focus();

      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';

      document.addEventListener('keydown', handleKeyDown);

      return () => {
        document.removeEventListener('keydown', handleKeyDown);

        const savedScrollY = document.body.style.top;
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        window.scrollTo(0, parseInt(savedScrollY || '0') * -1);

        previousActiveElement.current?.focus();
      };
    }
  }, [open, handleKeyDown]);

  const handleItemClick = useCallback(
    (itemId: string, href?: string) => {
      onNavigate?.(itemId, href);
      onClose();
    },
    [onNavigate, onClose]
  );

  if (!open) return null;

  const content = (
    <>
      {/* Overlay */}
      <div className={styles.overlay} onClick={onClose} aria-hidden="true" />

      {/* Drawer panel */}
      <div
        ref={drawerRef}
        className={styles.drawer}
        role="dialog"
        aria-modal="true"
        aria-label="Навігаційне меню"
        tabIndex={-1}
      >
        {/* Brand */}
        <div className={styles.brand}>
          <div className={styles.brandLeft}>
            <div className={styles.logo}>
              <Icon name="store" size="lg" color="accent" />
            </div>
            <Text variant="h5" weight="bold" className={styles.brandName}>
              CoffeePOS
            </Text>
          </div>
          <Button
            variant="ghost"
            size="sm"
            iconOnly
            onClick={onClose}
            aria-label="Закрити меню"
          >
            <Icon name="close" size="md" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className={styles.nav}>
          {navigation.map((group) => (
            <div key={group.id} className={styles.group}>
              {group.label && (
                <Text
                  variant="overline"
                  color="tertiary"
                  className={styles.groupLabel}
                >
                  {group.label}
                </Text>
              )}

              <ul className={styles.items}>
                {group.items.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      className={`${styles.item} ${
                        activeItemId === item.id || item.active ? styles.active : ''
                      } ${item.disabled ? styles.disabled : ''}`}
                      onClick={() =>
                        !item.disabled && handleItemClick(item.id, item.href)
                      }
                      disabled={item.disabled}
                      aria-current={activeItemId === item.id ? 'page' : undefined}
                    >
                      <Icon
                        name={item.icon}
                        size="md"
                        color={activeItemId === item.id ? 'accent' : 'secondary'}
                        className={styles.itemIcon}
                      />
                      <Text
                        variant="labelMedium"
                        color={activeItemId === item.id ? 'primary' : 'secondary'}
                        className={styles.itemLabel}
                      >
                        {item.label}
                      </Text>
                      {item.badge !== undefined && (
                        <span className={styles.badge}>{item.badge}</span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        {/* Footer — User profile */}
        {user && (
          <div className={styles.footer}>
            <Divider spacing="sm" />
            <button
              type="button"
              className={`${styles.userButton} ${activeItemId === 'profile' ? styles.active : ''}`}
              onClick={() => handleItemClick('profile', '/profile')}
            >
              <Avatar
                fallback={user.name}
                size="sm"
                status="online"
              />
              <div className={styles.userInfo}>
                <Text variant="labelMedium" color="primary" truncate>
                  {user.name}
                </Text>
                <Text variant="caption" color="tertiary" truncate>
                  {user.role}
                </Text>
              </div>
            </button>
          </div>
        )}
      </div>
    </>
  );

  if (typeof window !== 'undefined') {
    return createPortal(content, document.body);
  }

  return null;
}
