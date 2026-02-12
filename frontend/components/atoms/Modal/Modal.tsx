'use client';

/**
 * ParadisePOS Design System - Modal Component
 *
 * Unified accessible modal dialog with animations, icons, variants
 */

import {
  forwardRef,
  useEffect,
  useRef,
  useCallback,
  type HTMLAttributes,
  type ReactNode,
  type KeyboardEvent,
} from 'react';
import { createPortal } from 'react-dom';
import { Text, Button, Icon, type IconName } from '@/components/atoms';
import styles from './Modal.module.css';

// ============================================
// TYPES
// ============================================

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';
export type ModalVariant = 'default' | 'info' | 'success' | 'warning' | 'error';

export interface ModalProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  /** Whether modal is open */
  open?: boolean;
  /** Alias for open (molecule Modal compat) */
  isOpen?: boolean;
  /** Callback to close modal */
  onClose: () => void;
  /** Modal title */
  title?: ReactNode;
  /** Optional subtitle */
  subtitle?: string;
  /** Optional icon in header */
  icon?: IconName;
  /** Modal description */
  description?: string;
  /** Size variant */
  size?: ModalSize;
  /** Modal variant (affects header icon background) */
  variant?: ModalVariant;
  /** Show close button */
  showClose?: boolean;
  /** Close on backdrop click */
  closeOnBackdrop?: boolean;
  /** Close on Escape key */
  closeOnEscape?: boolean;
  /** Prevent body scroll when open */
  preventScroll?: boolean;
  /** Glass effect */
  glass?: boolean;
  /** Footer content */
  footer?: ReactNode;
  /** Children content */
  children?: ReactNode;
}

// ============================================
// COMPONENT
// ============================================

export const Modal = forwardRef<HTMLDivElement, ModalProps>(
  (
    {
      open,
      isOpen,
      onClose,
      title,
      subtitle,
      icon,
      description,
      size = 'md',
      variant = 'default',
      showClose = true,
      closeOnBackdrop = true,
      closeOnEscape = true,
      preventScroll = true,
      glass = true,
      footer,
      children,
      className,
      ...props
    },
    ref
  ) => {
    const modalRef = useRef<HTMLDivElement>(null);
    const previousActiveElement = useRef<HTMLElement | null>(null);

    // Support both open and isOpen props
    const isVisible = open ?? isOpen ?? false;

    // Handle escape key
    const handleKeyDown = useCallback(
      (e: KeyboardEvent) => {
        if (e.key === 'Escape' && closeOnEscape) {
          onClose();
        }
      },
      [closeOnEscape, onClose]
    );

    // Handle backdrop click
    const handleBackdropClick = useCallback(
      (e: React.MouseEvent) => {
        if (e.target === e.currentTarget && closeOnBackdrop) {
          onClose();
        }
      },
      [closeOnBackdrop, onClose]
    );

    // Focus trap and body scroll lock
    useEffect(() => {
      if (isVisible) {
        // Save current focus
        previousActiveElement.current = document.activeElement as HTMLElement;

        // Focus modal
        modalRef.current?.focus();

        // Prevent body scroll
        if (preventScroll) {
          const scrollY = window.scrollY;
          document.body.style.position = 'fixed';
          document.body.style.top = `-${scrollY}px`;
          document.body.style.width = '100%';
        }

        return () => {
          // Restore body scroll
          if (preventScroll) {
            const scrollY = document.body.style.top;
            document.body.style.position = '';
            document.body.style.top = '';
            document.body.style.width = '';
            window.scrollTo(0, parseInt(scrollY || '0') * -1);
          }

          // Restore focus
          previousActiveElement.current?.focus();
        };
      }
    }, [isVisible, preventScroll]);

    // Don't render if not open
    if (!isVisible) return null;

    const modalClassNames = [
      styles.modal,
      styles[`size-${size}`],
      glass && styles.glass,
      className,
    ]
      .filter(Boolean)
      .join(' ');

    const iconColor = variant === 'default' ? 'accent' : variant;

    const modalContent = (
      <div
        className={styles.backdrop}
        onClick={handleBackdropClick}
        onKeyDown={handleKeyDown as any}
        role="presentation"
      >
        <div
          ref={(node) => {
            (modalRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
            if (typeof ref === 'function') ref(node);
            else if (ref) ref.current = node;
          }}
          className={modalClassNames}
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? 'modal-title' : undefined}
          aria-describedby={description ? 'modal-description' : undefined}
          tabIndex={-1}
          {...props}
        >
          {/* Header */}
          {(title || showClose) && (
            <div className={styles.header}>
              <div className={styles.headerContent}>
                {icon && (
                  <div className={`${styles.headerIcon} ${styles[`variant-${variant}`]}`}>
                    <Icon name={icon} size="lg" color={iconColor as any} />
                  </div>
                )}
                <div className={styles.headerText}>
                  {title && (
                    <Text id="modal-title" variant="h4" weight="semibold">
                      {title}
                    </Text>
                  )}
                  {subtitle && (
                    <Text variant="bodySmall" color="tertiary">
                      {subtitle}
                    </Text>
                  )}
                  {description && !subtitle && (
                    <Text
                      id="modal-description"
                      variant="bodySmall"
                      color="secondary"
                    >
                      {description}
                    </Text>
                  )}
                </div>
              </div>
              {showClose && (
                <Button
                  variant="ghost"
                  size="sm"
                  iconOnly
                  onClick={onClose}
                  className={styles.closeButton}
                  aria-label="Закрити"
                >
                  <Icon name="close" size="md" />
                </Button>
              )}
            </div>
          )}

          {/* Body */}
          <div className={styles.body}>{children}</div>

          {/* Footer */}
          {footer && <div className={styles.footer}>{footer}</div>}
        </div>
      </div>
    );

    // Render in portal
    if (typeof window !== 'undefined') {
      return createPortal(modalContent, document.body);
    }

    return null;
  }
);

Modal.displayName = 'Modal';

// ============================================
// MODAL FOOTER COMPONENT
// ============================================

export interface ModalFooterProps {
  children: ReactNode;
  align?: 'left' | 'center' | 'right' | 'between';
}

export function ModalFooter({ children, align = 'right' }: ModalFooterProps) {
  return (
    <div className={`${styles.footerContent} ${styles[`align-${align}`]}`}>
      {children}
    </div>
  );
}
