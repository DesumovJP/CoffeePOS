'use client';

/**
 * CoffeePOS - Tasks (Kanban) Page
 *
 * Production-ready Kanban board with CRUD, filtering, search, role-based views.
 * 3 columns: todo, in_progress, done
 */

import { useState, useMemo, useCallback, useEffect } from 'react';
import { Text, Icon, Badge, Button, GlassCard, Modal } from '@/components/atoms';
import { SearchInput } from '@/components/molecules';
import { TaskFormModal } from '@/components/organisms';
import { useToast } from '@/components/atoms';
import { useTasks, useUpdateTask, useCompleteTask, useDeleteTask } from '@/lib/hooks';
import { useAuth } from '@/lib/providers/AuthProvider';
import type { Task, TaskStatus, TaskPriority, TaskType, GetTasksParams } from '@/lib/api';
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
// HELPERS
// ============================================

function isOverdue(dueDate: string): boolean {
  // Parse date-only string without UTC shift (treat as local midnight)
  const [y, m, d] = dueDate.split('-').map(Number);
  const due = new Date(y, m - 1, d);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return due < today;
}

function formatDate(dueDate: string): string {
  const [y, m, d] = dueDate.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('uk-UA');
}

// ============================================
// SKELETON CARD
// ============================================

function SkeletonCard() {
  return (
    <div className={styles.skeletonCard} aria-hidden="true">
      <div className={styles.skeletonLine} style={{ width: '70%', height: '1rem' }} />
      <div className={styles.skeletonLine} style={{ width: '90%', height: '0.75rem', marginTop: '0.5rem' }} />
      <div className={styles.skeletonMeta}>
        <div className={styles.skeletonPill} />
        <div className={styles.skeletonPill} />
      </div>
    </div>
  );
}

// ============================================
// TASK CARD
// ============================================

interface TaskCardProps {
  task: Task;
  canManage: boolean;
  onStart: (documentId: string) => void;
  onComplete: (documentId: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onAdd?: () => void;
}

function TaskCard({ task, canManage, onStart, onComplete, onEdit, onDelete }: TaskCardProps) {
  const isDone = task.status === 'done';
  const priorityClass = {
    high: styles.priorityHigh,
    medium: styles.priorityMedium,
    low: styles.priorityLow,
  }[task.priority];

  const dueDateOverdue = task.dueDate && !isDone && isOverdue(task.dueDate);

  return (
    <GlassCard className={`${styles.taskCard} ${priorityClass} ${isDone ? styles.taskCardDone : ''}`}>
      <div className={styles.taskBody}>
        <Text
          variant="labelLarge"
          weight="semibold"
          className={isDone ? styles.taskTitleDone : undefined}
        >
          {task.title}
        </Text>
        {task.description && (
          <Text variant="bodySmall" color="secondary" className={styles.taskDescription}>
            {task.description}
          </Text>
        )}
      </div>

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
              <div className={`${styles.detailItem} ${dueDateOverdue ? styles.overdue : ''}`}>
                <Icon name="calendar" size="xs" color={dueDateOverdue ? 'error' : 'tertiary'} />
                <Text variant="caption" color={dueDateOverdue ? 'error' : 'tertiary'}>
                  {formatDate(task.dueDate)}
                  {dueDateOverdue && ' — прострочено'}
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
      <div className={styles.taskActions}>
        {!isDone && (
          <>
            {task.status === 'todo' && (
              <Button variant="ghost" size="sm" onClick={() => onStart(task.documentId)}>
                <Icon name="clock" size="sm" />
                Почати
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={() => onComplete(task.documentId)}>
              <Icon name="check" size="sm" />
              Виконано
            </Button>
          </>
        )}

        {isDone && task.completedAt && (
          <div className={styles.taskCompleted}>
            <Icon name="check" size="xs" color="success" />
            <Text variant="caption" color="tertiary">
              {new Date(task.completedAt).toLocaleString('uk-UA', {
                day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
              })}
              {task.completedBy && ` — ${task.completedBy}`}
            </Text>
          </div>
        )}

        {canManage && (
          <div className={styles.taskManageActions}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(task)}
              aria-label="Редагувати завдання"
            >
              <Icon name="settings" size="sm" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(task)}
              aria-label="Видалити завдання"
            >
              <Icon name="close" size="sm" />
            </Button>
          </div>
        )}
      </div>
    </GlassCard>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function TasksPage() {
  const { user } = useAuth();
  const { addToast } = useToast();

  const currentUserName = user?.username || '';
  const currentUserRole = user?.role?.type || 'barista';
  const isAdmin = currentUserRole === 'owner' || currentUserRole === 'manager';

  // UI state
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deleteTask, setDeleteTask] = useState<Task | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  const openCreate = useCallback(() => {
    setEditingTask(null);
    setFormModalOpen(true);
  }, []);

  // Listen for AppShell events
  useEffect(() => {
    window.addEventListener('appshell:action', openCreate);
    return () => window.removeEventListener('appshell:action', openCreate);
  }, [openCreate]);

  useEffect(() => {
    const searchHandler = () => setMobileSearchOpen(true);
    window.addEventListener('appshell:search', searchHandler);
    return () => window.removeEventListener('appshell:search', searchHandler);
  }, []);

  // Build query params
  const queryParams = useMemo<GetTasksParams>(() => {
    const params: GetTasksParams = {};
    if (!isAdmin) params.assignedTo = currentUserName;
    if (searchQuery.trim()) params.search = searchQuery.trim();
    return params;
  }, [searchQuery, isAdmin, currentUserName]);

  const { data: tasks, isLoading } = useTasks(queryParams);
  const updateMutation = useUpdateTask();
  const completeMutation = useCompleteTask();
  const deleteMutation = useDeleteTask();

  const tasksByStatus = useMemo(() => {
    const grouped: Record<TaskStatus, Task[]> = { todo: [], in_progress: [], done: [] };
    if (!tasks) return grouped;
    for (const task of tasks) {
      grouped[task.status]?.push(task);
    }
    return grouped;
  }, [tasks]);

  const handleStart = useCallback((id: string) => {
    updateMutation.mutate(
      { id, data: { status: 'in_progress' } },
      { onSuccess: () => addToast({ type: 'success', title: 'Завдання розпочато' }) }
    );
  }, [updateMutation, addToast]);

  const handleComplete = useCallback((id: string) => {
    completeMutation.mutate(
      { id, completedBy: currentUserName },
      { onSuccess: () => addToast({ type: 'success', title: 'Завдання виконано' }) }
    );
  }, [completeMutation, currentUserName, addToast]);

  const handleEdit = useCallback((task: Task) => {
    setEditingTask(task);
    setFormModalOpen(true);
  }, []);

  const handleDeleteRequest = useCallback((task: Task) => {
    setDeleteTask(task);
  }, []);

  const handleDeleteConfirm = useCallback(() => {
    if (!deleteTask) return;
    deleteMutation.mutate(deleteTask.documentId, {
      onSuccess: () => {
        addToast({ type: 'success', title: 'Завдання видалено' });
        setDeleteTask(null);
      },
    });
  }, [deleteTask, deleteMutation, addToast]);

  const closeMobileSearch = useCallback(() => {
    setMobileSearchOpen(false);
    setSearchQuery('');
  }, []);

  const canManageTask = useCallback((task: Task) => {
    return isAdmin || task.assignedTo === currentUserName;
  }, [isAdmin, currentUserName]);

  return (
    <div className={styles.page}>
      {/* Toolbar */}
      <div className={styles.toolbar}>
        {mobileSearchOpen && (
          <div className={styles.mobileSearchBar}>
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Пошук завдань..."
              variant="glass"
              autoFocus
            />
            <Button
              variant="ghost"
              size="sm"
              iconOnly
              onClick={closeMobileSearch}
              aria-label="Закрити пошук"
            >
              <Icon name="close" size="md" />
            </Button>
          </div>
        )}
      </div>

      {/* Kanban Board */}
      <div className={styles.board}>
        {COLUMNS.map((col) => {
          const columnTasks = tasksByStatus[col.id];
          return (
            <div key={col.id} className={styles.column}>
              <div className={styles.columnHeader}>
                <Text variant="labelMedium" weight="semibold">{col.label}</Text>
                {isLoading ? (
                  <div className={styles.columnCountSkeleton} />
                ) : (
                  <span className={styles.columnCount}>{columnTasks.length}</span>
                )}
              </div>

              <div className={styles.taskList}>
                {isLoading ? (
                  <>
                    <SkeletonCard />
                    {col.id === 'todo' && <SkeletonCard />}
                  </>
                ) : columnTasks.length === 0 ? (
                  <div className={styles.emptyColumn}>
                    <Text variant="bodySmall" color="tertiary">Немає завдань</Text>
                    {col.id === 'todo' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={openCreate}
                        className={styles.emptyColumnCta}
                      >
                        <Icon name="plus" size="sm" />
                        Додати завдання
                      </Button>
                    )}
                  </div>
                ) : (
                  columnTasks.map((task) => (
                    <TaskCard
                      key={task.documentId}
                      task={task}
                      canManage={canManageTask(task)}
                      onStart={handleStart}
                      onComplete={handleComplete}
                      onEdit={handleEdit}
                      onDelete={handleDeleteRequest}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* TaskFormModal (create/edit) */}
      <TaskFormModal
        isOpen={formModalOpen}
        onClose={() => setFormModalOpen(false)}
        task={editingTask}
        onSuccess={() => {}}
        currentUserName={currentUserName}
        currentUserRole={currentUserRole}
      />

      {/* Delete Confirmation Modal */}
      <Modal
        open={!!deleteTask}
        onClose={() => setDeleteTask(null)}
        title="Видалити завдання?"
        icon="close"
        size="sm"
      >
        <div className={styles.deleteContent}>
          <Text variant="bodyMedium" color="secondary">
            Ви впевнені, що хочете видалити завдання &laquo;{deleteTask?.title}&raquo;?
          </Text>
          <div className={styles.deleteFooter}>
            <Button variant="ghost" onClick={() => setDeleteTask(null)}>
              Скасувати
            </Button>
            <Button
              variant="primary"
              onClick={handleDeleteConfirm}
              loading={deleteMutation.isPending}
            >
              Видалити
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
