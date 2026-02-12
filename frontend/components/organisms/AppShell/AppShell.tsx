'use client';

/**
 * ParadisePOS - AppShell Component
 *
 * Desktop: persistent sidebar + content area
 * Tablet: collapsed sidebar (icons only) + content area
 * Mobile: top navbar + drawer navigation
 */

import { useState, useCallback, useEffect, type ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Sidebar } from '@/components/organisms/Sidebar';
import { Drawer } from '@/components/organisms/Drawer';
import { NotificationCenter } from '@/components/organisms/NotificationCenter';
import { Text, Button, Icon, type IconName, MockBanner } from '@/components/atoms';
import type { NavGroup } from '@/components/organisms/Sidebar';
import { IS_MOCK } from '@/lib/mock/helpers';
import styles from './AppShell.module.css';

// ============================================
// NAVIGATION CONFIG
// ============================================

const navigation: NavGroup[] = [
  {
    id: 'main',
    items: [
      { id: 'pos', label: 'Каса', icon: 'cart', href: '/pos' },
      { id: 'orders', label: 'Замовлення', icon: 'receipt', href: '/orders' },
      { id: 'tables', label: 'Столи', icon: 'store', href: '/tables' },
      { id: 'tasks', label: 'Завдання', icon: 'check', href: '/tasks' },
    ],
  },
  {
    id: 'management',
    label: 'Управління',
    items: [
      { id: 'products', label: 'Продукція', icon: 'package', href: '/admin/products' },
      { id: 'reports', label: 'Звіти', icon: 'chart', href: '/admin/reports' },
    ],
  },
];

const user = {
  name: 'Олена Коваленко',
  role: 'Бариста',
};

// Map routes to nav item IDs
const routeToNavId: Record<string, string> = {
  '/pos': 'pos',
  '/orders': 'orders',
  '/tables': 'tables',
  '/tasks': 'tasks',
  '/admin/products': 'products',
  '/admin/reports': 'reports',
  '/profile': 'profile',
};

// Page metadata with actions
interface PageMeta {
  title: string;
  action?: {
    label: string;
    icon: IconName;
    onClick?: () => void;
  };
}

const pageMeta: Record<string, PageMeta> = {
  '/pos': { title: 'Каса' },
  '/orders': { title: 'Замовлення' },
  '/tables': {
    title: 'Столи',
    action: { label: 'Додати стіл', icon: 'plus' },
  },
  '/tasks': {
    title: 'Завдання',
    action: { label: 'Нове завдання', icon: 'plus' },
  },
  '/admin/products': { title: 'Продукція' },
  '/admin/reports': { title: 'Звіти' },
  '/profile': { title: 'Профіль' },
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
// COMPONENT
// ============================================

export function AppShell({ children }: AppShellProps) {
  const router = useRouter();
  const pathname = usePathname();

  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const isTablet = useMediaQuery('(min-width: 768px)');

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Auto-collapse sidebar on tablet
  const effectiveCollapsed = isDesktop ? sidebarCollapsed : true;

  // Determine active nav item from current route
  const activeItemId = routeToNavId[pathname] || 'pos';

  const handleNavigation = useCallback((itemId: string, href?: string) => {
    if (href) {
      router.push(href);
    }
  }, [router]);

  // Don't show shell on landing page
  if (pathname === '/') {
    return <>{children}</>;
  }

  // Get page metadata
  const meta = pageMeta[pathname] || { title: 'ParadisePOS' };

  // Desktop/Tablet: Sidebar layout
  if (isTablet) {
    return (
      <div className={styles.shell}>
        <Sidebar
          navigation={navigation}
          user={user}
          collapsed={effectiveCollapsed}
          activeItemId={activeItemId}
          onNavigate={handleNavigation}
          onToggleCollapse={isDesktop ? () => setSidebarCollapsed(c => !c) : undefined}
          onUserClick={() => router.push('/profile')}
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
              {meta.action && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={meta.action.onClick ?? (() => window.dispatchEvent(new CustomEvent('appshell:action')))}
                >
                  <Icon name={meta.action.icon} size="sm" />
                  {meta.action.label}
                </Button>
              )}
              {IS_MOCK && <MockBanner />}
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

  // Mobile: Navbar + Drawer layout
  return (
    <div className={styles.shellMobile}>
      {/* Top Navbar */}
      <header className={styles.navbar}>
        <div className={styles.navbarInner}>
          <div className={styles.navbarLeft}>
            <Button
              variant="ghost"
              size="sm"
              iconOnly
              onClick={() => setDrawerOpen(true)}
              aria-label="Відкрити меню"
            >
              <Icon name="menu" size="md" />
            </Button>
            <div className={styles.brand}>
              <Icon name="store" size="md" color="accent" />
              <Text variant="h5" weight="bold" className={styles.brandName}>
                {meta.title}
              </Text>
            </div>
          </div>
          <div className={styles.navbarRight}>
            {meta.action && (
              <Button
                variant="primary"
                size="sm"
                onClick={meta.action.onClick ?? (() => window.dispatchEvent(new CustomEvent('appshell:action')))}
              >
                <Icon name={meta.action.icon} size="sm" />
                {meta.action.label}
              </Button>
            )}
            {IS_MOCK && <MockBanner />}
            <NotificationCenter position="right" />
          </div>
        </div>
      </header>

      {/* Content */}
      <div className={styles.content}>
        {children}
      </div>

      {/* Drawer (mobile only) */}
      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        navigation={navigation}
        activeItemId={activeItemId}
        onNavigate={handleNavigation}
        user={user}
      />
    </div>
  );
}

export default AppShell;
