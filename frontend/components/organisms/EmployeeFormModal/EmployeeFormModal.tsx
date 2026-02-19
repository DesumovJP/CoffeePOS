'use client';

/**
 * CoffeePOS - EmployeeFormModal Component
 *
 * Modal form for creating and editing employees.
 */

import { useState, useEffect, useCallback, type FormEvent } from 'react';
import { Text, Button, Input, Modal } from '@/components/atoms';
import { employeesApi } from '@/lib/api';
import type { Employee, EmployeeInput } from '@/lib/api';
import styles from './EmployeeFormModal.module.css';

// ============================================
// TYPES
// ============================================

export interface EmployeeFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee?: Employee | null;
  onSuccess: () => void;
}

interface EmployeeFormState {
  name: string;
  email: string;
  phone: string;
  role: string;
  position: string;
  hireDate: string;
  salary: string;
  notes: string;
  isActive: boolean;
}

const INITIAL_STATE: EmployeeFormState = {
  name: '',
  email: '',
  phone: '',
  role: 'barista',
  position: '',
  hireDate: new Date().toISOString().split('T')[0],
  salary: '',
  notes: '',
  isActive: true,
};

const ROLE_OPTIONS = [
  { value: 'owner', label: 'Власник' },
  { value: 'manager', label: 'Менеджер' },
  { value: 'barista', label: 'Бариста' },
];

const POSITION_SUGGESTIONS: Record<string, string> = {
  owner: 'Власник',
  manager: 'Менеджер зміни',
  barista: 'Бариста',
};

// ============================================
// COMPONENT
// ============================================

export function EmployeeFormModal({
  isOpen,
  onClose,
  employee,
  onSuccess,
}: EmployeeFormModalProps) {
  const isEditMode = !!employee;
  const [form, setForm] = useState<EmployeeFormState>(INITIAL_STATE);
  const [errors, setErrors] = useState<Partial<Record<keyof EmployeeFormState, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (employee) {
      setForm({
        name: employee.name || '',
        email: employee.email || '',
        phone: employee.phone || '',
        role: employee.role || 'barista',
        position: employee.position || '',
        hireDate: employee.hireDate || '',
        salary: employee.salary ? String(employee.salary) : '',
        notes: employee.notes || '',
        isActive: employee.isActive ?? true,
      });
    } else {
      setForm(INITIAL_STATE);
    }
    setErrors({});
    setSubmitError(null);
  }, [employee, isOpen]);

  const handleChange = useCallback(
    (field: keyof EmployeeFormState) =>
      (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const value = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
        setForm((prev) => {
          const next = { ...prev, [field]: value };
          // Auto-suggest position when role changes
          if (field === 'role' && !prev.position) {
            next.position = POSITION_SUGGESTIONS[value as string] || '';
          }
          return next;
        });
        if (errors[field]) {
          setErrors((prev) => {
            const next = { ...prev };
            delete next[field];
            return next;
          });
        }
      },
    [errors]
  );

  const validate = useCallback((): boolean => {
    const newErrors: Partial<Record<keyof EmployeeFormState, string>> = {};

    if (!form.name.trim()) {
      newErrors.name = "Ім'я обов'язкове";
    }
    if (!form.role) {
      newErrors.role = "Оберіть роль";
    }
    if (form.salary && Number(form.salary) < 0) {
      newErrors.salary = 'Зарплата не може бути від\'ємною';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [form]);

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      if (!validate()) return;

      setIsSubmitting(true);
      setSubmitError(null);

      const data: EmployeeInput = {
        name: form.name.trim(),
        email: form.email.trim() || undefined,
        phone: form.phone.trim() || undefined,
        role: form.role as EmployeeInput['role'],
        position: form.position.trim() || undefined,
        hireDate: form.hireDate || undefined,
        salary: form.salary ? Number(form.salary) : undefined,
        notes: form.notes.trim() || undefined,
        isActive: form.isActive,
      };

      try {
        if (isEditMode && employee) {
          await employeesApi.update(employee.documentId, data);
        } else {
          await employeesApi.create(data);
        }
        onSuccess();
        onClose();
      } catch (err) {
        setSubmitError(
          err instanceof Error ? err.message : 'Помилка збереження працівника'
        );
      } finally {
        setIsSubmitting(false);
      }
    },
    [form, isEditMode, employee, validate, onSuccess, onClose]
  );

  const footer = (
    <Button
      variant="primary"
      onClick={handleSubmit as any}
      loading={isSubmitting}
      fullWidth
    >
      {isEditMode ? 'Зберегти' : 'Створити'}
    </Button>
  );

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title={isEditMode ? 'Редагувати працівника' : 'Новий працівник'}
      icon="user"
      size="lg"
      footer={footer}
    >
      <form onSubmit={handleSubmit} className={styles.form}>
        {submitError && (
          <div className={styles.errorBanner}>
            <Text variant="bodySmall" color="error">{submitError}</Text>
          </div>
        )}

        <Input
          label="Ім'я *"
          value={form.name}
          onChange={handleChange('name')}
          placeholder="Введіть ім'я працівника"
          error={!!errors.name}
          errorMessage={errors.name}
          fullWidth
        />

        <div className={styles.row}>
          <Input
            label="Email"
            type="email"
            value={form.email}
            onChange={handleChange('email')}
            placeholder="email@paradise.cafe"
            fullWidth
          />
          <Input
            label="Телефон"
            value={form.phone}
            onChange={handleChange('phone')}
            placeholder="+380 67 000 0000"
            fullWidth
          />
        </div>

        <div className={styles.row}>
          <div className={styles.field}>
            <label className={styles.label}>Роль *</label>
            <select
              className={styles.select}
              value={form.role}
              onChange={handleChange('role')}
            >
              {ROLE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            {errors.role && (
              <Text variant="caption" color="error">{errors.role}</Text>
            )}
          </div>
          <Input
            label="Посада"
            value={form.position}
            onChange={handleChange('position')}
            placeholder="Напр. Старший бариста"
            fullWidth
          />
        </div>

        <div className={styles.row}>
          <Input
            label="Дата найму"
            type="date"
            value={form.hireDate}
            onChange={handleChange('hireDate')}
            fullWidth
          />
          <Input
            label="Зарплата (грн)"
            type="number"
            min="0"
            value={form.salary}
            onChange={handleChange('salary')}
            placeholder="0"
            error={!!errors.salary}
            errorMessage={errors.salary}
            fullWidth
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Нотатки</label>
          <textarea
            className={styles.textarea}
            value={form.notes}
            onChange={handleChange('notes')}
            placeholder="Додаткова інформація про працівника"
            rows={3}
          />
        </div>

        <div className={styles.toggleRow}>
          <label className={styles.toggle}>
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={handleChange('isActive')}
              className={styles.checkbox}
            />
            <span className={styles.toggleLabel}>Активний</span>
          </label>
        </div>
      </form>
    </Modal>
  );
}

export default EmployeeFormModal;
