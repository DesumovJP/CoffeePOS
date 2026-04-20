'use client';

/**
 * CoffeePOS - AppShell Component
 *
 * Desktop: persistent sidebar + content area
 * Tablet: collapsed sidebar (icons only) + content area
 * Mobile: top navbar + drawer navigation
 */

import { useState, useCallback, useEffect, type ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Sidebar } from '@/components/organisms/Sidebar';
import { Drawer } from '@/components/organisms/Drawer';
import { TaskWidget } from '@/components/organisms/TaskWidget';
import { NotificationCenter } from '@/components/organisms/NotificationCenter';
import { Text, Button, Icon, type IconName } from '@/components/atoms';
import type { NavGroup } from '@/components/organisms/Sidebar';
import { useAuth } from '@/lib/providers/AuthProvider';
import { useEmployees } from '@/lib/hooks';
import styles from './AppShell.module.css';

// ============================================
// NAVIGATION CONFIG
// ============================================

function buildNavigation(role?: string): NavGroup[] {
  const isAdmin = role === 'owner' || role === 'manager';

  const groups: NavGroup[] = [
    {
      id: 'main',
      items: [
        { id: 'pos',      label: 'Каса',      icon: 'cart',    href: '/pos' },
        { id: 'orders',   label: 'Історія',   icon: 'clock',   href: '/orders' },
        ...(isAdmin ? [
          { id: 'products',  label: 'Продукція', icon: 'package' as const, href: '/admin/products' },
          { id: 'suppliers', label: 'Поставки',  icon: 'truck'   as const, href: '/admin/suppliers' },
        ] : []),
      ],
    },
  ];

  if (isAdmin) {
    groups.push({
      id: 'management',
      label: 'Управління',
      items: [
        { id: 'analytics',  label: 'Аналітика',      icon: 'chart',   href: '/admin/dashboard' },
        { id: 'employees',  label: 'Працівники',     icon: 'user',    href: '/admin/employees' },
        { id: 'recipes',    label: 'Рецепти',        icon: 'receipt', href: '/admin/recipes' },
      ],
    });
  }

  return groups;
}

// User info is now provided by AuthProvider (see useAuth() below)

// Map routes to nav item IDs
const routeToNavId: Record<string, string> = {
  '/pos': 'pos',
  '/orders': 'orders',
  '/admin/dashboard': 'analytics',
  '/admin/products': 'products',
  '/admin/recipes': 'recipes',
  '/admin/employees': 'employees',
  '/admin/suppliers': 'suppliers',
  '/tasks': 'tasks',
  '/profile': 'profile',
};

// Page metadata with actions
interface PageMeta {
  title: string;
  icon: IconName;
  search?: boolean;
  action?: {
    label: string;
    icon: IconName;
    onClick?: () => void;
  };
}

const pageMeta: Record<string, PageMeta> = {
  '/pos': { title: 'Каса', icon: 'cart', search: true },
  '/orders': { title: 'Історія', icon: 'clock', search: true },
  '/admin/dashboard': { title: 'Аналітика', icon: 'chart' },
  '/admin/products': { title: 'Продукція', icon: 'package', search: true, action: { label: 'Додати', icon: 'plus' } },
  '/admin/recipes': { title: 'Рецепти', icon: 'receipt', search: true, action: { label: 'Додати', icon: 'plus' } },
  '/admin/employees': { title: 'Працівники', icon: 'user', search: true, action: { label: 'Додати', icon: 'plus' } },
  '/admin/suppliers': { title: 'Поставки', icon: 'truck', action: { label: 'Додати', icon: 'plus' } },
  '/tasks': { title: 'Завдання', icon: 'check', search: true, action: { label: 'Додати', icon: 'plus' } },
  '/profile': { title: 'Профіль', icon: 'user' },
};

// ============================================
// HOOKS
// ============================================

function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(query);
    setMatches(mql.matches);

    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, [query]);

  return matches;
}

// ============================================
// TYPES
// ============================================

export interface AppShellProps {
  children: ReactNode;
}

// ============================================
// AUTH REDIRECT HELPER
// ============================================

function AuthRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/login');
  }, [router]);

  return null;
}

// ============================================
// COMPONENT
// ============================================

export function AppShell({ children }: AppShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user: authUser, isAuthenticated, isLoading, logout } = useAuth();
  const { data: employees } = useEmployees();

  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const isTablet = useMediaQuery('(min-width: 768px)');

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileTasksOpen, setMobileTasksOpen] = useState(false);

  // Auto-collapse sidebar on tablet
  const effectiveCollapsed = isDesktop ? sidebarCollapsed : true;

  // Determine active nav item from current route
  const activeItemId = routeToNavId[pathname] || 'pos';

  const handleNavigation = useCallback((itemId: string, href?: string) => {
    if (href) {
      router.push(href);
    }
  }, [router]);

  // Build user info: prefer employee display name over auth username
  const myEmployee = authUser && employees
    ? employees.find((e) => e.email === authUser.email) || null
    : null;

  const user = authUser
    ? {
        name: myEmployee?.name || authUser.username,
        role: myEmployee?.position || authUser.role?.name || 'Користувач',
        avatar: myEmployee?.avatar?.url,
      }
    : { name: '', role: '' };

  // Role-filtered navigation: use employee record role (reliable) or fall back to auth role type
  const effectiveRole = myEmployee?.role || authUser?.role?.type;
  const navigation = buildNavigation(effectiveRole);

  // Don't show shell on landing page or login page
  if (pathname === '/' || pathname === '/login') {
    return <>{children}</>;
  }

  // Redirect to login if not authenticated (and not loading)
  if (!isLoading && !isAuthenticated) {
    // Use effect-based redirect to avoid render-time side effects
    return <AuthRedirect />;
  }

  // Get page metadata
  const meta = pageMeta[pathname] || { title: 'Smak', icon: 'store' as IconName };

  // Desktop/Tablet: Sidebar layout
  if (isTablet) {
    return (
      <div className={styles.shell}>
        <Sidebar
          navigation={navigation}
          widget={<TaskWidget collapsed={effectiveCollapsed} />}
          user={user}
          collapsed={effectiveCollapsed}
          activeItemId={activeItemId}
          onNavigate={handleNavigation}
          onToggleCollapse={isDesktop ? () => setSidebarCollapsed(c => !c) : undefined}
          onUserClick={() => router.push('/profile')}
          onLogout={logout}
          className={styles.sidebar}
        />

        <div className={styles.main}>
          {/* Top bar */}
          <header className={styles.topBar}>
            <div className={styles.topBarLeft}>
              <Text variant="h4" weight="semibold">
                {meta.title}
              </Text>
            </div>
            <div className={styles.topBarRight}>
              {meta.search && (
                <Button
                  variant="ghost"
                  size="sm"
                  iconOnly
                  onClick={() => window.dispatchEvent(new CustomEvent('appshell:search'))}
                  aria-label="Пошук"
                >
                  <Icon name="search" size="md" />
                </Button>
              )}
              {meta.action && (
                <Button
                  variant="ghost"
                  size="sm"
                  iconOnly
                  onClick={meta.action.onClick ?? (() => window.dispatchEvent(new CustomEvent('appshell:action')))}
                  aria-label={meta.action.label}
                >
                  <Icon name={meta.action.icon} size="md" />
                </Button>
              )}
              <NotificationCenter position="right" />
            </div>
          </header>

          {/* Content */}
          <div className={styles.content}>
            {children}
          </div>
        </div>
      </div>
    );
  }

  // Bottom nav items — role-based, max 5 for iOS tab bar pattern
  const isAdmin = effectiveRole === 'owner' || effectiveRole === 'manager';
  const bottomNavItems = [
    { id: 'pos',     label: 'Каса',       icon: 'cart'    as IconName, href: '/pos' },
    { id: 'orders',  label: 'Історія',    icon: 'clock'   as IconName, href: '/orders' },
    ...(isAdmin ? [
      { id: 'products', label: 'Продукція', icon: 'package' as IconName, href: '/admin/products' },
    ] : [
      { id: 'tasks',  label: 'Завдання',   icon: 'check'   as IconName, href: null as string | null },
    ]),
    { id: 'more',    label: 'Ще',         icon: 'menu'    as IconName, href: null as string | null },
  ];

  // Mobile: Navbar + Bottom nav + Drawer layout
  return (
    <div className={styles.shellMobile}>
      {/* Top Navbar — title + contextual actions only */}
      <header className={styles.navbar}>
        <div className={styles.navbarInner}>
          <div className={styles.navbarLeft}>
            <Text variant="h5" weight="bold" className={styles.brandName}>
              {meta.title}
            </Text>
          </div>
          <div className={styles.navbarRight}>
            {meta.action && (
              <Button
                variant="ghost"
                size="sm"
                iconOnly
                onClick={meta.action.onClick ?? (() => window.dispatchEvent(new CustomEvent('appshell:action')))}
                aria-label={meta.action.label}
              >
                <Icon name={meta.action.icon} size="md" />
              </Button>
            )}
            {meta.search && (
              <Button
                variant="ghost"
                size="sm"
                iconOnly
                onClick={() => window.dispatchEvent(new CustomEvent('appshell:search'))}
                aria-label="Пошук"
              >
                <Icon name="search" size="md" />
              </Button>
            )}
            <NotificationCenter position="right" />
          </div>
        </div>
      </header>

      {/* Content — bottom padding so it doesn't hide behind bottom nav */}
      <div className={styles.content}>
        {children}
      </div>

      {/* Bottom navigation bar */}
      <nav className={styles.bottomNav} aria-label="Навігація">
        {bottomNavItems.map((item) => {
          const isActive = item.id !== 'more' && activeItemId === item.id;
          return (
            <button
              key={item.id}
              type="button"
              className={`${styles.bottomNavItem} ${isActive ? styles.bottomNavActive : ''}`}
              onClick={() => {
                if (item.id === 'tasks') { setMobileTasksOpen(true); return; }
                if (item.id === 'more') { setDrawerOpen(true); return; }
                if (item.href) { handleNavigation(item.id, item.href); }
              }}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon name={item.icon} size="md" color={isActive ? 'accent' : 'secondary'} />
              <span className={styles.bottomNavLabel}>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Drawer (mobile only) */}
      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        navigation={navigation}
        activeItemId={activeItemId}
        onNavigate={handleNavigation}
        user={user}
        onLogout={logout}
      />

      {/* Tasks modal (mobile — triggered from bottom nav) */}
      {mobileTasksOpen && (
        <TaskWidget collapsed={false} defaultOpen onModalClose={() => setMobileTasksOpen(false)} />
      )}
    </div>
  );
}

export default AppShell;
