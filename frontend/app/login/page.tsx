'use client';

/**
 * CoffeePOS - Login Page
 *
 * Authentication page with glassmorphism design.
 * Redirects to /pos after successful login.
 * Does NOT render inside AppShell.
 */

import { useState, useCallback, useEffect, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { GlassCard, Button, Input, Text, Icon } from '@/components/atoms';
import { useAuth } from '@/lib/providers/AuthProvider';
import styles from './page.module.css';

// ============================================
// COMPONENT
// ============================================

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, isLoading: authLoading } = useAuth();

  const isMock = process.env.NEXT_PUBLIC_API_MODE === 'mock';
  const [identifier, setIdentifier] = useState(isMock ? 'owner@coffeepos.com' : '');
  const [password, setPassword] = useState(isMock ? 'owner123' : '');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.replace('/pos');
    }
  }, [authLoading, isAuthenticated, router]);

  // Handle form submission
  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      setError('');

      if (!identifier.trim() || !password.trim()) {
        setError('Будь ласка, заповніть всі поля');
        return;
      }

      setIsSubmitting(true);

      try {
        await login(identifier.trim(), password);
        router.replace('/pos');
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Невірний email або пароль'
        );
      } finally {
        setIsSubmitting(false);
      }
    },
    [identifier, password, login, router]
  );

  // Show nothing while checking auth state
  if (authLoading) {
    return (
      <div className={styles.page}>
        <div className={styles.background}>
          <div className={styles.gradientOrb1} />
          <div className={styles.gradientOrb2} />
        </div>
      </div>
    );
  }

  // Already authenticated — will redirect
  if (isAuthenticated) {
    return null;
  }

  return (
    <div className={styles.page}>
      {/* Animated Background */}
      <div className={styles.background}>
        <div className={styles.gradientOrb1} />
        <div className={styles.gradientOrb2} />
      </div>

      {/* Login Card */}
      <div className={styles.container}>
        <GlassCard
          elevated
          padding="xl"
          intensity="strong"
          className={styles.card}
        >
          {/* Brand Header */}
          <div className={styles.header}>
            <div className={styles.logo}>
              <Icon name="coffee" size="xl" color="accent" />
            </div>
            <Text variant="h3" weight="bold" align="center">
              CoffeePOS
            </Text>
            <Text variant="bodyMedium" color="secondary" align="center">
              Увійдіть до системи
            </Text>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className={styles.form}>
            <Input
              label="Email або логін"
              type="text"
              placeholder="admin@coffeepos.com"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              iconLeft={<Icon name="user" size="sm" color="secondary" />}
              variant="glass"
              size="lg"
              fullWidth
              disabled={isSubmitting}
              autoComplete="username"
              autoFocus
            />

            <Input
              label="Пароль"
              type={showPassword ? 'text' : 'password'}
              placeholder="Введіть пароль"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              iconLeft={<Icon name="lock" size="sm" color="secondary" />}
              iconRight={
                <button
                  type="button"
                  className={styles.togglePassword}
                  onClick={() => setShowPassword((p) => !p)}
                  tabIndex={-1}
                  aria-label={showPassword ? 'Приховати пароль' : 'Показати пароль'}
                >
                  <Icon
                    name={showPassword ? 'eye-off' : 'eye'}
                    size="sm"
                    color="secondary"
                  />
                </button>
              }
              variant="glass"
              size="lg"
              fullWidth
              disabled={isSubmitting}
              autoComplete="current-password"
            />

            {/* Error Message */}
            {error && (
              <div className={styles.error}>
                <Icon name="error" size="sm" />
                <Text variant="bodySmall" color="error">
                  {error}
                </Text>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              loading={isSubmitting}
              disabled={isSubmitting}
            >
              Увійти
            </Button>
          </form>
        </GlassCard>

        {/* Footer */}
        <Text variant="caption" color="tertiary" align="center" className={styles.footer}>
          CoffeePOS &copy; {new Date().getFullYear()}
        </Text>
      </div>
    </div>
  );
}
