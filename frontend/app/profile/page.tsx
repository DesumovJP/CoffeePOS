'use client';

/**
 * Smak - Profile Page
 *
 * Minimalistic: identity card + UI preferences.
 */

import { useState, useMemo } from 'react';
import { Text, Avatar, Badge, GlassCard, Spinner, Icon, Button, ThemeToggle } from '@/components/atoms';
import { ShiftCloseModal } from '@/components/organisms/ShiftCloseModal';
import { useEmployees } from '@/lib/hooks';
import { useAuth } from '@/lib/providers/AuthProvider';
import { useShiftStore, selectCurrentShift, usePreferencesStore, type UIDensity, type FontSizePreference } from '@/lib/store';
import styles from './page.module.css';

// ============================================
// CONSTANTS
// ============================================

const ROLE_LABELS: Record<string, string> = {
  owner: 'Власник',
  manager: 'Менеджер',
  barista: 'Бариста',
};

// ============================================
// HELPERS
// ============================================

function daysSince(dateStr: string): number {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
}

// ============================================
// UI PREFERENCES SECTION
// ============================================

function UIPreferencesSection() {
  const uiDensity = usePreferencesStore((s) => s.uiDensity);
  const setUIDensity = usePreferencesStore((s) => s.setUIDensity);
  const fontSize = usePreferencesStore((s) => s.fontSize);
  const setFontSize = usePreferencesStore((s) => s.setFontSize);
  const animationsEnabled = usePreferencesStore((s) => s.animationsEnabled);
  const setAnimationsEnabled = usePreferencesStore((s) => s.setAnimationsEnabled);

  const densityOptions: { value: UIDensity; label: string }[] = [
    { value: 'compact', label: 'Компактний' },
    { value: 'default', label: 'Стандартний' },
    { value: 'comfortable', label: 'Вільний' },
  ];

  const fontOptions: { value: FontSizePreference; label: string }[] = [
    { value: 'small', label: 'Малий' },
    { value: 'default', label: 'Стандартний' },
    { value: 'large', label: 'Великий' },
  ];

  return (
    <GlassCard className={styles.tableCard}>
      <div className={styles.tableHeader}>
        <Text variant="labelLarge" weight="semibold">Налаштування</Text>
      </div>
      <div className={styles.prefsGrid}>
        {/* Theme */}
        <div className={styles.prefRow}>
          <div className={styles.prefLabel}>
            <Icon name="moon" size="sm" color="secondary" />
            <Text variant="bodyMedium">Тема</Text>
          </div>
          <ThemeToggle variant="expanded" />
        </div>

        {/* Density */}
        <div className={styles.prefRow}>
          <div className={styles.prefLabel}>
            <Icon name="grip" size="sm" color="secondary" />
            <Text variant="bodyMedium">Щільність</Text>
          </div>
          <div className={styles.prefButtons}>
            {densityOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                className={`${styles.prefBtn} ${uiDensity === opt.value ? styles.prefBtnActive : ''}`}
                onClick={() => setUIDensity(opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Font size */}
        <div className={styles.prefRow}>
          <div className={styles.prefLabel}>
            <Icon name="eye" size="sm" color="secondary" />
            <Text variant="bodyMedium">Текст</Text>
          </div>
          <div className={styles.prefButtons}>
            {fontOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                className={`${styles.prefBtn} ${fontSize === opt.value ? styles.prefBtnActive : ''}`}
                onClick={() => setFontSize(opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Animations */}
        <div className={styles.prefRow}>
          <div className={styles.prefLabel}>
            <Icon name="sparkle" size="sm" color="secondary" />
            <Text variant="bodyMedium">Анімації</Text>
          </div>
          <button
            type="button"
            className={`${styles.toggle} ${animationsEnabled ? styles.toggleOn : ''}`}
            onClick={() => setAnimationsEnabled(!animationsEnabled)}
            role="switch"
            aria-checked={animationsEnabled}
          >
            <span className={styles.toggleThumb} />
          </button>
        </div>
      </div>
    </GlassCard>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function ProfilePage() {
  const { user } = useAuth();
  const currentShift = useShiftStore(selectCurrentShift);
  const [closeShiftOpen, setCloseShiftOpen] = useState(false);
  const { data: employees, isLoading } = useEmployees();

  const myEmployee = useMemo(() => {
    if (!employees || !user) return null;
    return (
      employees.find((e) => e.name === user.username || e.email === user.email) || null
    );
  }, [employees, user]);

  // ── Loading ──────────────────────────────────────────
  if (isLoading) {
    return (
      <div className={styles.page}>
        <div className={styles.loadingCenter}><Spinner size="md" /></div>
      </div>
    );
  }

  // ── No employee found ────────────────────────────────
  if (!myEmployee) {
    return (
      <div className={styles.page}>
        <GlassCard className={styles.emptyState}>
          <Icon name="user" size="2xl" color="tertiary" />
          <Text variant="bodyLarge" color="secondary">Профіль не знайдено</Text>
          <Text variant="bodySmall" color="tertiary">
            Обліковий запис не прив'язаний до жодного працівника
          </Text>
        </GlassCard>
      </div>
    );
  }

  const roleLabel = myEmployee.position || ROLE_LABELS[myEmployee.role] || myEmployee.role;

  return (
    <div className={styles.page}>
      {/* Identity card */}
      <GlassCard className={styles.heroCard}>
        {currentShift?.status === 'open' && (
          <div className={styles.heroShiftBar}>
            <div className={styles.heroShiftInfo}>
              <Icon name="clock" size="sm" color="success" />
              <Text variant="labelSmall" weight="semibold" color="success">
                Зміна відкрита
              </Text>
            </div>
            <Button variant="secondary" size="sm" onClick={() => setCloseShiftOpen(true)}>
              Закрити
            </Button>
          </div>
        )}

        <div className={styles.heroIdentity}>
          <Avatar
            src={myEmployee.avatar?.url}
            fallback={myEmployee.name}
            size="xl"
            status={myEmployee.isActive ? 'online' : 'offline'}
          />
          <div className={styles.heroInfo}>
            <Text variant="h4" weight="bold">{myEmployee.name}</Text>
            <div className={styles.heroMeta}>
              <Badge variant="info" size="sm">{roleLabel}</Badge>
              {myEmployee.email && (
                <Text variant="caption" color="secondary">{myEmployee.email}</Text>
              )}
            </div>
            {myEmployee.hireDate && (
              <Text variant="caption" color="tertiary">
                {daysSince(myEmployee.hireDate)} днів в команді
              </Text>
            )}
          </div>
        </div>
      </GlassCard>

      {/* Preferences */}
      <UIPreferencesSection />

      <ShiftCloseModal
        isOpen={closeShiftOpen}
        onClose={() => setCloseShiftOpen(false)}
      />
    </div>
  );
}
