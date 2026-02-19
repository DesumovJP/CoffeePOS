'use client';

/**
 * CoffeePOS - TaskFormModal Component
 *
 * Modal form for creating and editing tasks.
 * Supports role-based assignee logic:
 * - Barista: self-assign only (disabled dropdown)
 * - Manager/Owner: assign to any active employee
 */

import { useState, useEffect, useCallback, type FormEvent } from 'react';
import { Text, Button, Input, Modal } from '@/components/atoms';
import { useToast } from '@/components/atoms';
import { useCreateTask, useUpdateTask, useEmployees } from '@/lib/hooks';
import type { Task, TaskPriority, TaskType } from '@/lib/api';
import styles from './TaskFormModal.module.css';

// ============================================
// TYPES
// ============================================

export interface TaskFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  task?: Task | null;
  onSuccess: () => void;
  currentUserName: string;
  currentUserRole: string;
}

interface TaskFormState {
  title: string;
  description: string;
  priority: TaskPriority;
  type: TaskType;
  dueDate: string;
  assignedTo: string;
}

const INITIAL_STATE: TaskFormState = {
  title: '',
  description: '',
  priority: 'medium',
  type: 'task',
  dueDate: '',
  assignedTo: '',
};

// ============================================
// COMPONENT
// ============================================

export function TaskFormModal({
  isOpen,
  onClose,
  task,
  onSuccess,
  currentUserName,
  currentUserRole,
}: TaskFormModalProps) {
  const isEditMode = !!task;
  const isBarista = currentUserRole === 'barista';
  const [form, setForm] = useState<TaskFormState>(INITIAL_STATE);
  const [errors, setErrors] = useState<Partial<Record<keyof TaskFormState, string>>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const { addToast } = useToast();

  const createMutation = useCreateTask();
  const updateMutation = useUpdateTask();
  const { data: employees } = useEmployees({ isActive: true });

  useEffect(() => {
    if (task) {
      setForm({
        title: task.title || '',
        description: task.description || '',
        priority: task.priority || 'medium',
        type: task.type || 'task',
        dueDate: task.dueDate || '',
        assignedTo: task.assignedTo || '',
      });
    } else {
      setForm({
        ...INITIAL_STATE,
        assignedTo: isBarista ? currentUserName : '',
      });
    }
    setErrors({});
    setSubmitError(null);
  }, [task, isOpen, isBarista, currentUserName]);

  const handleChange = useCallback(
    (field: keyof TaskFormState) =>
      (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setForm((prev) => ({ ...prev, [field]: e.target.value }));
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
    const newErrors: Partial<Record<keyof TaskFormState, string>> = {};
    if (!form.title.trim()) {
      newErrors.title = 'Назва обов\'язкова';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [form]);

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      if (!validate()) return;

      setSubmitError(null);

      const assignedTo = form.assignedTo || undefined;

      if (isEditMode && task) {
        updateMutation.mutate(
          {
            id: task.documentId,
            data: {
              title: form.title.trim(),
              description: form.description.trim() || undefined,
              priority: form.priority,
              type: form.type,
              dueDate: form.dueDate || undefined,
              assignedTo,
            },
          },
          {
            onSuccess: () => {
              addToast({ type: 'success', title: 'Завдання оновлено' });
              onSuccess();
              onClose();
            },
            onError: (err) => {
              setSubmitError(err instanceof Error ? err.message : 'Помилка збереження');
            },
          }
        );
      } else {
        createMutation.mutate(
          {
            title: form.title.trim(),
            description: form.description.trim() || undefined,
            priority: form.priority,
            type: form.type,
            dueDate: form.dueDate || undefined,
            assignedTo,
            createdBy: currentUserName,
          },
          {
            onSuccess: () => {
              addToast({ type: 'success', title: 'Завдання створено' });
              onSuccess();
              onClose();
            },
            onError: (err) => {
              setSubmitError(err instanceof Error ? err.message : 'Помилка створення');
            },
          }
        );
      }
    },
    [form, isEditMode, task, validate, currentUserName, createMutation, updateMutation, addToast, onSuccess, onClose]
  );

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const footer = (
    <Button
      variant="primary"
      onClick={handleSubmit as any}
      loading={isSubmitting}
      disabled={!form.title.trim()}
      fullWidth
    >
      {isEditMode ? 'Зберегти' : 'Створити завдання'}
    </Button>
  );

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title={isEditMode ? 'Редагувати завдання' : 'Нове завдання'}
      icon="check"
      size="md"
      footer={footer}
    >
      <form onSubmit={handleSubmit} className={styles.form}>
        {submitError && (
          <div className={styles.errorBanner}>
            <Text variant="bodySmall" color="error">{submitError}</Text>
          </div>
        )}

        <Input
          label="Назва *"
          value={form.title}
          onChange={handleChange('title')}
          placeholder="Назва завдання..."
          error={!!errors.title}
          errorMessage={errors.title}
          fullWidth
        />

        <div className={styles.field}>
          <label className={styles.label}>Опис</label>
          <textarea
            className={styles.textarea}
            value={form.description}
            onChange={handleChange('description')}
            placeholder="Опис завдання..."
            rows={3}
          />
        </div>

        <div className={styles.row}>
          <div className={styles.field}>
            <label className={styles.label}>Пріоритет</label>
            <select
              className={styles.select}
              value={form.priority}
              onChange={handleChange('priority')}
            >
              <option value="low">Низький</option>
              <option value="medium">Середній</option>
              <option value="high">Високий</option>
            </select>
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Тип</label>
            <select
              className={styles.select}
              value={form.type}
              onChange={handleChange('type')}
            >
              <option value="task">Завдання</option>
              <option value="daily">Щоденне</option>
            </select>
          </div>
        </div>

        <div className={styles.row}>
          <Input
            label="Дата виконання"
            type="date"
            value={form.dueDate}
            onChange={handleChange('dueDate')}
            fullWidth
          />
          <div className={styles.field}>
            <label className={styles.label}>Виконавець</label>
            <select
              className={styles.select}
              value={form.assignedTo}
              onChange={handleChange('assignedTo')}
              disabled={isBarista}
            >
              {!isBarista && <option value="">Не призначено</option>}
              {employees?.map((emp) => (
                <option key={emp.id} value={emp.name}>
                  {emp.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </form>
    </Modal>
  );
}

export default TaskFormModal;
