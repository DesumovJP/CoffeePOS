'use client';

/**
 * CoffeePOS - ErrorBoundary Component
 *
 * Global error boundary that catches unhandled React errors.
 * Displays a glassmorphism fallback UI with reload option.
 * Class component required by React error boundary API.
 */

import React from 'react';
import styles from './ErrorBoundary.module.css';

// ============================================
// TYPES
// ============================================

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

// ============================================
// COMPONENT
// ============================================

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
    // Future: send to Sentry or other monitoring service
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className={styles.container}>
          {/* Animated Background */}
          <div className={styles.background}>
            <div className={styles.gradientOrb1} />
            <div className={styles.gradientOrb2} />
          </div>

          <div className={styles.card}>
            <div className={styles.icon}>&#9888;&#65039;</div>
            <h2 className={styles.title}>Щось пішло не так</h2>
            <p className={styles.message}>
              {this.state.error?.message || 'Виникла неочікувана помилка'}
            </p>
            <button
              className={styles.button}
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
            >
              Перезавантажити сторінку
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
