'use client';

/**
 * CoffeePOS - Error Page
 *
 * Next.js error boundary page (app-level).
 * Displayed when an unhandled error occurs in a route segment.
 * Standalone page — does NOT render inside AppShell.
 */

import { useEffect } from 'react';
import styles from './error.module.css';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('App error:', error);
  }, [error]);

  return (
    <div className={styles.page}>
      {/* Animated Background */}
      <div className={styles.background}>
        <div className={styles.gradientOrb1} />
        <div className={styles.gradientOrb2} />
      </div>

      {/* Content */}
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.icon}>&#9888;&#65039;</div>
          <h1 className={styles.title}>Виникла помилка</h1>
          <p className={styles.description}>
            {error.message || 'Виникла неочікувана помилка. Спробуйте ще раз.'}
          </p>
          <button className={styles.button} onClick={reset}>
            Спробувати ще раз
          </button>
        </div>

        <p className={styles.footer}>
          CoffeePOS &copy; {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
