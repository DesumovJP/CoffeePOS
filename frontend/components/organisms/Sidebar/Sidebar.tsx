'use client';

/**
 * CoffeePOS - Sidebar Component
 *
 * Main navigation sidebar for the application
 */

import { forwardRef, type HTMLAttributes } from 'react';
import { Text, Icon, Avatar, Button, Divider, type IconName } from '@/components/atoms';
import styles from './Sidebar.module.css';

// ============================================
// TYPES
// ============================================

export interface NavItem {
  id: string;
  label: string;
  icon: IconName;
  href?: string;
  badge?: number | string;
  active?: boolean;
  disabled?: boolean;
}

export interface NavGroup {
  id: string;
  label?: string;
  items: NavItem[];
}

export interface UserInfo {
  name: string;
  role: string;
  avatar?: string;
}

export interface SidebarProps extends HTMLAttributes<HTMLElement> {
  /** Navigation groups */
  navigation: NavGroup[];
  /** Current user info */
  user?: UserInfo;
  /** Collapsed state */
  collapsed?: boolean;
  /** Current active item ID */
  activeItemId?: string;
  /** Show logo/brand */
  showBrand?: boolean;
  /** Brand name */
  brandName?: string;
  /** Callback when nav item is clicked */
  onNavigate?: (itemId: string, href?: string) => void;
  /** Callback to toggle collapsed state */
  onToggleCollapse?: () => void;
  /** Callback for logout */
  onLogout?: () => void;
  /** Callback for settings */
  onSettings?: () => void;
  /** Callback when user profile is clicked */
  onUserClick?: () => void;
}

// ============================================
// COMPONENT
// ============================================

export const Sidebar = forwardRef<HTMLElement, SidebarProps>(
  (
    {
      navigation,
      user,
      collapsed = false,
      activeItemId,
      showBrand = true,
      brandName = 'CoffeePOS',
      onNavigate,
      onToggleCollapse,
      onLogout,
      onSettings,
      onUserClick,
      className,
      ...props
    },
    ref
  ) => {
    const classNames = [
      styles.sidebar,
      collapsed && styles.collapsed,
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <aside ref={ref} className={classNames} {...props}>
        {/* Brand */}
        {showBrand && (
          <div className={styles.brand}>
            <div className={styles.logo}>
              <Icon name="store" size="lg" color="accent" />
            </div>
            {!collapsed && (
              <Text variant="h5" weight="bold" className={styles.brandName}>
                {brandName}
              </Text>
            )}
          </div>
        )}

        {/* Navigation */}
        <nav className={styles.nav}>
          {navigation.map((group) => (
            <div key={group.id} className={styles.group}>
              {group.label && !collapsed && (
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
                        (activeItemId === item.id || item.active) ? styles.active : ''
                      } ${item.disabled ? styles.disabled : ''}`}
                      onClick={() => !item.disabled && onNavigate?.(item.id, item.href)}
                      disabled={item.disabled}
                      title={collapsed ? item.label : undefined}
                      aria-current={activeItemId === item.id ? 'page' : undefined}
                    >
                      <Icon
                        name={item.icon}
                        size="md"
                        color={activeItemId === item.id ? 'accent' : 'secondary'}
                        className={styles.itemIcon}
                      />
                      {!collapsed && (
                        <>
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
                        </>
                      )}
                      {collapsed && item.badge !== undefined && (
                        <span className={styles.badgeDot} />
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className={styles.footer}>
          {/* Collapse toggle */}
          {onToggleCollapse && (
            <Button
              variant="ghost"
              size="sm"
              iconOnly
              onClick={onToggleCollapse}
              className={styles.collapseButton}
              aria-label={collapsed ? 'Розгорнути меню' : 'Згорнути меню'}
            >
              <Icon
                name={collapsed ? 'chevron-right' : 'chevron-left'}
                size="sm"
              />
            </Button>
          )}

          <Divider spacing="sm" />

          {/* User */}
          {user && (
            <div className={styles.userSection}>
              <button
                type="button"
                className={styles.user}
                onClick={onUserClick}
                title={collapsed ? user.name : undefined}
              >
                <Avatar
                  src={user.avatar}
                  fallback={user.name}
                  size={collapsed ? 'sm' : 'md'}
                  status="online"
                />
                {!collapsed && (
                  <div className={styles.userInfo}>
                    <Text variant="labelMedium" color="primary" truncate>
                      {user.name}
                    </Text>
                    <Text variant="caption" color="tertiary" truncate>
                      {user.role}
                    </Text>
                  </div>
                )}
              </button>
              {onLogout && (
                <Button
                  variant="ghost"
                  size="sm"
                  iconOnly
                  onClick={onLogout}
                  aria-label="Вийти"
                  title="Вийти"
                >
                  <Icon name="logout" size="sm" />
                </Button>
              )}
            </div>
          )}
        </div>
      </aside>
    );
  }
);

Sidebar.displayName = 'Sidebar';
