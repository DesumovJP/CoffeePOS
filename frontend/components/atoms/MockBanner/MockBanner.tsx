'use client';

/**
 * ParadisePOS - MockBanner
 *
 * Visible warning banner shown when running in mock API mode
 */

import styles from './MockBanner.module.css';

export function MockBanner() {
  return (
    <div className={styles.banner}>
      <span className={styles.icon}>⚠</span>
      <span className={styles.text}>Тестовий режим</span>
      <span className={styles.textFull}> — дані не зберігаються</span>
    </div>
  );
}
