'use client';

/**
 * ParadisePOS Design System - Avatar Component
 *
 * User/entity representation with image or initials fallback
 */

import { forwardRef, useState, type ImgHTMLAttributes } from 'react';
import styles from './Avatar.module.css';

// ============================================
// TYPES
// ============================================

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
export type AvatarShape = 'circle' | 'square';
export type AvatarStatus = 'online' | 'offline' | 'busy' | 'away';

export interface AvatarProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'size'> {
  /** Image source URL */
  src?: string;
  /** Alt text for the image */
  alt?: string;
  /** Fallback text (usually initials) */
  fallback?: string;
  /** Size of the avatar */
  size?: AvatarSize;
  /** Shape of the avatar */
  shape?: AvatarShape;
  /** Online status indicator */
  status?: AvatarStatus;
  /** Custom background color for fallback */
  color?: string;
}

// ============================================
// HELPERS
// ============================================

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function stringToColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash % 360);
  return `hsl(${hue}, 60%, 45%)`;
}

// ============================================
// COMPONENT
// ============================================

export const Avatar = forwardRef<HTMLDivElement, AvatarProps>(
  (
    {
      src,
      alt = '',
      fallback,
      size = 'md',
      shape = 'circle',
      status,
      color,
      className,
      ...props
    },
    ref
  ) => {
    const [imageError, setImageError] = useState(false);
    const showImage = src && !imageError;
    const initials = fallback ? getInitials(fallback) : alt ? getInitials(alt) : '?';
    const bgColor = color || (fallback || alt ? stringToColor(fallback || alt) : undefined);

    const classNames = [
      styles.avatar,
      styles[`size-${size}`],
      styles[`shape-${shape}`],
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div
        ref={ref}
        className={classNames}
        style={!showImage && bgColor ? { backgroundColor: bgColor } : undefined}
      >
        {showImage ? (
          <img
            src={src}
            alt={alt}
            className={styles.image}
            onError={() => setImageError(true)}
            {...props}
          />
        ) : (
          <span className={styles.fallback}>{initials}</span>
        )}
        {status && (
          <span
            className={`${styles.status} ${styles[`status-${status}`]}`}
            aria-label={status}
          />
        )}
      </div>
    );
  }
);

Avatar.displayName = 'Avatar';
