'use client';

/**
 * CoffeePOS - Toast Notification System
 *
 * Provides toast/snackbar notifications with glass styling
 * ToastProvider + useToast hook pattern
 */

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  type ReactNode,
} from 'react';
import { Icon, type IconName } from '@/components/atoms/Icon';
import { Text } from '@/components/atoms/Text';
import styles from './Toast.module.css';

// ============================================
// TYPES
// ============================================

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextValue {
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
}

// ============================================
// CONSTANTS
// ============================================

const MAX_TOASTS = 5;
const DEFAULT_DURATION = 4000;

const TOAST_ICONS: Record<ToastType, IconName> = {
  success: 'success',
  error: 'error',
  warning: 'warning',
  info: 'info',
};

// ============================================
// CONTEXT
// ============================================

const ToastContext = createContext<ToastContextValue | null>(null);

// ============================================
// HOOK
// ============================================

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

// ============================================
// TOAST ITEM COMPONENT
// ============================================

interface ToastItemProps {
  toast: Toast;
  onRemove: (id: string) => void;
}

function ToastItem({ toast, onRemove }: ToastItemProps) {
  const [isExiting, setIsExiting] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleRemove = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => onRemove(toast.id), 300);
  }, [toast.id, onRemove]);

  useEffect(() => {
    const duration = toast.duration ?? DEFAULT_DURATION;
    if (duration > 0) {
      timerRef.current = setTimeout(handleRemove, duration);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [toast.duration, handleRemove]);

  const classNames = [
    styles.toast,
    styles[toast.type],
    isExiting && styles.exiting,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classNames} role="alert" aria-live="polite">
      <div className={styles.toastIcon}>
        <Icon
          name={TOAST_ICONS[toast.type]}
          size="md"
          color={toast.type as 'success' | 'error' | 'warning' | 'info'}
        />
      </div>
      <div className={styles.toastContent}>
        <Text variant="labelMedium" color="primary">
          {toast.title}
        </Text>
        {toast.message && (
          <Text variant="bodySmall" color="secondary">
            {toast.message}
          </Text>
        )}
      </div>
      <button
        type="button"
        className={styles.closeButton}
        onClick={handleRemove}
        aria-label="Закрити"
      >
        <Icon name="close" size="sm" color="tertiary" />
      </button>
    </div>
  );
}

// ============================================
// PROVIDER COMPONENT
// ============================================

export interface ToastProviderProps {
  children: ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setToasts((prev) => {
      const next = [...prev, { ...toast, id }];
      // Keep only the last MAX_TOASTS
      if (next.length > MAX_TOASTS) {
        return next.slice(next.length - MAX_TOASTS);
      }
      return next;
    });
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      {/* Toast container */}
      <div className={styles.container} aria-label="Сповіщення">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}
