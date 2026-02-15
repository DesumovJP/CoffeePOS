'use client';

/**
 * CoffeePOS - Tasks (Kanban) Page
 *
 * Kanban board with 3 columns: todo, in_progress, done
 */

import { useState, useMemo, useCallback, useEffect } from 'react';
import { Text, Icon, Badge, Button, GlassCard, Input } from '@/components/atoms';
import { Modal } from '@/components/atoms';
import { useTasks, useCreateTask, useUpdateTask, useCompleteTask } from '@/lib/hooks';
import type { Task, TaskStatus, TaskPriority, TaskType, TaskCreateData } from '@/lib/api';
import styles from './page.module.css';

// ============================================
// CONSTANTS
// ============================================

const COLUMNS: { id: TaskStatus; label: string }[] = [
  { id: 'todo', label: 'До виконання' },
  { id: 'in_progress', label: 'В процесі' },
  { id: 'done', label: 'Виконано' },
];

const PRIORITY_LABELS: Record<TaskPriority, string> = {
  high: 'Високий',
  medium: 'Середній',
  low: 'Низький',
};

const PRIORITY_VARIANTS: Record<TaskPriority, 'error' | 'warning' | 'info'> = {
  high: 'error',
  medium: 'warning',
  low: 'info',
};

const TYPE_LABELS: Record<TaskType, string> = {
  daily: 'Щоденне',
  task: 'Завдання',
};

// ============================================
// CREATE TASK MODAL
// ============================================

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: TaskCreateData) => void;
  isSubmitting: boolean;
}

function CreateTaskModal({ isOpen, onClose, onSubmit, isSubmitting }: CreateTaskModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [type, setType] = useState<TaskType>('task');
  const [dueDate, setDueDate] = useState('');
  const [assignedTo, setAssignedTo] = useState('');

  const handleSubmit = () => {
    if (!title.trim()) return;
    onSubmit({
      title: title.trim(),
      description: description.trim() || undefined,
      priority,
      type,
      dueDate: dueDate || undefined,
      assignedTo: assignedTo.trim() || undefined,
    });
    setTitle('');
    setDescription('');
    setPriority('medium');
    setType('task');
    setDueDate('');
    setAssignedTo('');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Нове завдання" icon="check" size="md">
      <div className={styles.modalContent}>
        <div className={styles.field}>
          <Input
            label="Назва"
            type="text"
            fullWidth
            placeholder="Назва завдання..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div className={styles.field}>
          <Text variant="labelMedium" weight="medium">Опис (необов&apos;язково)</Text>
          <textarea
            className={styles.textarea}
            placeholder="Опис завдання..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />
        </div>

        <div className={styles.fieldRow}>
          <div className={styles.field}>
            <Text variant="labelMedium" weight="medium">Пріоритет</Text>
            <select
              className={styles.select}
              value={priority}
              onChange={(e) => setPriority(e.target.value as TaskPriority)}
            >
              <option value="low">Низький</option>
              <option value="medium">Середній</option>
              <option value="high">Високий</option>
            </select>
          </div>
          <div className={styles.field}>
            <Text variant="labelMedium" weight="medium">Тип</Text>
            <select
              className={styles.select}
              value={type}
              onChange={(e) => setType(e.target.value as TaskType)}
            >
              <option value="task">Завдання</option>
              <option value="daily">Щоденне</option>
            </select>
          </div>
        </div>

        <div className={styles.fieldRow}>
          <div className={styles.field}>
            <Input
              label="Дата виконання"
              type="date"
              fullWidth
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>
          <div className={styles.field}>
            <Input
              label="Виконавець"
              type="text"
              fullWidth
              placeholder="Ім'я..."
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
            />
          </div>
        </div>

        <Button
          variant="primary"
          size="lg"
          onClick={handleSubmit}
          disabled={!title.trim() || isSubmitting}
        >
          {isSubmitting ? 'Створення...' : 'Створити завдання'}
        </Button>
      </div>
    </Modal>
  );
}

// ============================================
// TASK CARD
// ============================================

interface TaskCardProps {
  task: Task;
  onStart: (id: number) => void;
  onComplete: (id: number) => void;
}

function TaskCard({ task, onStart, onComplete }: TaskCardProps) {
  const priorityClass = {
    high: styles.priorityHigh,
    medium: styles.priorityMedium,
    low: styles.priorityLow,
  }[task.priority];

  return (
    <GlassCard className={`${styles.taskCard} ${priorityClass}`}>
      {/* Body: title + description */}
      <div className={styles.taskBody}>
        <Text variant="labelLarge" weight="semibold">{task.title}</Text>
        {task.description && (
          <Text variant="bodySmall" color="secondary" className={styles.taskDescription}>
            {task.description}
          </Text>
        )}
      </div>

      {/* Meta block: tags + info in a grouped panel */}
      <div className={styles.taskMeta}>
        <div className={styles.taskTags}>
          <Badge variant={PRIORITY_VARIANTS[task.priority]} size="sm">
            {PRIORITY_LABELS[task.priority]}
          </Badge>
          <Badge variant="default" size="sm">
            {TYPE_LABELS[task.type]}
          </Badge>
        </div>

        {(task.dueDate || task.assignedTo) && (
          <div className={styles.taskDetails}>
            {task.dueDate && (
              <div className={styles.detailItem}>
                <Icon name="calendar" size="xs" color="tertiary" />
                <Text variant="caption" color="tertiary">
                  {new Date(task.dueDate).toLocaleDateString('uk-UA')}
                </Text>
              </div>
            )}
            {task.assignedTo && (
              <div className={styles.detailItem}>
                <Icon name="user" size="xs" color="tertiary" />
                <Text variant="caption" color="secondary">{task.assignedTo}</Text>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      {task.status !== 'done' && (
        <div className={styles.taskActions}>
          {task.status === 'todo' && (
            <Button variant="ghost" size="sm" onClick={() => onStart(task.id)}>
              <Icon name="clock" size="sm" />
              Почати
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={() => onComplete(task.id)}>
            <Icon name="check" size="sm" />
            Виконано
          </Button>
        </div>
      )}

      {task.status === 'done' && task.completedAt && (
        <div className={styles.taskCompleted}>
          <Icon name="check" size="xs" color="success" />
          <Text variant="caption" color="tertiary">
            {new Date(task.completedAt).toLocaleString('uk-UA', {
              day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
            })}
          </Text>
        </div>
      )}
    </GlassCard>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function TasksPage() {
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // Listen for AppShell header action button
  useEffect(() => {
    const handler = () => setCreateModalOpen(true);
    window.addEventListener('appshell:action', handler);
    return () => window.removeEventListener('appshell:action', handler);
  }, []);

  const { data: tasks } = useTasks();
  const createMutation = useCreateTask();
  const updateMutation = useUpdateTask();
  const completeMutation = useCompleteTask();

  const tasksByStatus = useMemo(() => {
    const grouped: Record<TaskStatus, Task[]> = { todo: [], in_progress: [], done: [] };
    if (!tasks) return grouped;
    for (const task of tasks) {
      grouped[task.status]?.push(task);
    }
    return grouped;
  }, [tasks]);

  const handleCreate = useCallback((data: TaskCreateData) => {
    createMutation.mutate(data, {
      onSuccess: () => setCreateModalOpen(false),
    });
  }, [createMutation]);

  const handleStart = useCallback((id: number) => {
    updateMutation.mutate({ id, data: { status: 'in_progress' } });
  }, [updateMutation]);

  const handleComplete = useCallback((id: number) => {
    completeMutation.mutate({ id, completedBy: 'Олена Коваленко' });
  }, [completeMutation]);

  return (
    <div className={styles.page}>
      <div className={styles.board}>
        {COLUMNS.map((col) => {
          const columnTasks = tasksByStatus[col.id];
          return (
            <div key={col.id} className={styles.column}>
              <div className={styles.columnHeader}>
                <Text variant="labelMedium" weight="semibold">{col.label}</Text>
                <span className={styles.columnCount}>{columnTasks.length}</span>
              </div>

              <div className={styles.taskList}>
                {columnTasks.length === 0 ? (
                  <div className={styles.emptyColumn}>
                    <Text variant="bodySmall" color="tertiary">Немає завдань</Text>
                  </div>
                ) : (
                  columnTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onStart={handleStart}
                      onComplete={handleComplete}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      <CreateTaskModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSubmit={handleCreate}
        isSubmitting={createMutation.isPending}
      />
    </div>
  );
}
