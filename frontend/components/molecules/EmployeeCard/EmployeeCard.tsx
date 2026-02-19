'use client';

/**
 * CoffeePOS - EmployeeCard Component
 *
 * Displays employee avatar + name + role badge + position
 */

import { memo } from 'react';
import { Text, Avatar, Badge } from '@/components/atoms';
import type { Employee } from '@/lib/api';
import styles from './EmployeeCard.module.css';

// ============================================
// TYPES
// ============================================

export interface EmployeeCardProps {
  employee: Employee;
  onClick?: () => void;
  compact?: boolean;
  showStatus?: boolean;
}

// ============================================
// HELPERS
// ============================================

const ROLE_LABELS: Record<string, string> = {
  owner: 'Власник',
  manager: 'Менеджер',
  barista: 'Бариста',
};

const ROLE_VARIANTS: Record<string, 'warning' | 'info' | 'default'> = {
  owner: 'warning',
  manager: 'info',
  barista: 'default',
};

// ============================================
// COMPONENT
// ============================================

export const EmployeeCard = memo(function EmployeeCard({
  employee,
  onClick,
  compact = false,
  showStatus = false,
}: EmployeeCardProps) {
  return (
    <div
      className={`${styles.card} ${compact ? styles.compact : ''} ${onClick ? styles.clickable : ''}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <Avatar
        fallback={employee.name}
        size={compact ? 'sm' : 'md'}
        status={showStatus ? (employee.isActive ? 'online' : 'offline') : undefined}
      />
      <div className={styles.info}>
        <Text variant={compact ? 'bodySmall' : 'bodyMedium'} weight="semibold" lineClamp={1}>
          {employee.name}
        </Text>
        {!compact && (
          <div className={styles.meta}>
            <Badge variant={ROLE_VARIANTS[employee.role] || 'default'} size="sm">
              {ROLE_LABELS[employee.role] || employee.role}
            </Badge>
            {employee.position && (
              <Text variant="caption" color="tertiary">{employee.position}</Text>
            )}
          </div>
        )}
      </div>
    </div>
  );
});

export default EmployeeCard;
