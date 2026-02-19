'use client';

/**
 * CoffeePOS - Tasks (Kanban) Page
 *
 * Production-ready Kanban board with CRUD, filtering, search, role-based views.
 * 3 columns: todo, in_progress, done
 */

import { useState, useMemo, useCallback, useEffect } from 'react';
import { Text, Icon, Badge, Button, GlassCard, Modal } from '@/components/atoms';
import { SearchInput, CategoryTabs, type Category } from '@/components/molecules';
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

const FILTER_CATEGORIES: Category[] = [
  { id: 'all', name: 'Всі' },
  { id: 'mine', name: 'Мої завдання' },
  { id: 'high', name: 'Високий пріоритет' },
];

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
}

function TaskCard({ task, canManage, onStart, onComplete, onEdit, onDelete }: TaskCardProps) {
  const priorityClass = {
    high: styles.priorityHigh,
    medium: styles.priorityMedium,
    low: styles.priorityLow,
  }[task.priority];

  const showCreatedBy = task.createdBy && task.createdBy !== task.assignedTo;

  return (
    <GlassCard className={`${styles.taskCard} ${priorityClass}`}>
      <div className={styles.taskBody}>
        <Text variant="labelLarge" weight="semibold">{task.title}</Text>
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

        {(task.dueDate || task.assignedTo || showCreatedBy) && (
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

        {showCreatedBy && (
          <Text variant="caption" color="tertiary" className={styles.createdByLabel}>
            Від: {task.createdBy}
          </Text>
        )}
      </div>

      {/* Actions */}
      <div className={styles.taskActions}>
        {task.status !== 'done' && (
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

        {task.status === 'done' && task.completedAt && (
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
            <Button variant="ghost" size="sm" onClick={() => onEdit(task)}>
              <Icon name="settings" size="sm" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => onDelete(task)}>
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
  const [activeFilter, setActiveFilter] = useState<string | null>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  // Listen for AppShell events
  useEffect(() => {
    const actionHandler = () => {
      setEditingTask(null);
      setFormModalOpen(true);
    };
    window.addEventListener('appshell:action', actionHandler);
    return () => window.removeEventListener('appshell:action', actionHandler);
  }, []);

  useEffect(() => {
    const searchHandler = () => setMobileSearchOpen(true);
    window.addEventListener('appshell:search', searchHandler);
    return () => window.removeEventListener('appshell:search', searchHandler);
  }, []);

  // Build query params based on filter + role
  const queryParams = useMemo<GetTasksParams>(() => {
    const params: GetTasksParams = {};

    // Barista always sees only their own tasks
    if (!isAdmin) {
      params.assignedTo = currentUserName;
    } else if (activeFilter === 'mine') {
      params.assignedTo = currentUserName;
    }

    if (activeFilter === 'high') {
      params.priority = 'high';
    }

    if (searchQuery.trim()) {
      params.search = searchQuery.trim();
    }

    return params;
  }, [activeFilter, searchQuery, isAdmin, currentUserName]);

  const { data: tasks } = useTasks(queryParams);
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
    updateMutation.mutate({ id, data: { status: 'in_progress' } });
  }, [updateMutation]);

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
        <CategoryTabs
          categories={FILTER_CATEGORIES}
          value={activeFilter}
          onChange={setActiveFilter}
          showAll={false}
        />
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
