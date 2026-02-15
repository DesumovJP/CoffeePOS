/**
 * CoffeePOS - 404 Not Found Page
 *
 * Standalone page with glassmorphism card.
 * Does NOT render inside AppShell.
 */

import Link from 'next/link';
import styles from './not-found.module.css';

export default function NotFound() {
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
          <span className={styles.code}>404</span>
          <h1 className={styles.title}>Сторінку не знайдено</h1>
          <p className={styles.description}>
            Схоже, ця сторінка не існує або була переміщена
          </p>
          <Link href="/pos" className={styles.button}>
            На головну
          </Link>
        </div>

        <p className={styles.footer}>
          CoffeePOS &copy; {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
