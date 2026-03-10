'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { Text, Icon, Button, GlassCard, Modal } from '@/components/atoms';
import { SearchInput } from '@/components/molecules';
import { TaskFormModal } from '@/components/organisms';
import { useToast } from '@/components/atoms';
import { useTasks, useUpdateTask, useCompleteTask, useDeleteTask } from '@/lib/hooks';
import { useAuth } from '@/lib/providers/AuthProvider';
import type { Task, TaskStatus, TaskPriority, TaskType, GetTasksParams } from '@/lib/api';
import styles from './page.module.css';

// ─── constants ───────────────────────────────────────────────────────────────

const COLUMNS: { id: TaskStatus; label: string }[] = [
  { id: 'todo',        label: 'До виконання' },
  { id: 'in_progress', label: 'В процесі'    },
  { id: 'done',        label: 'Виконано'      },
];

const PRIORITY_LABEL: Record<TaskPriority, string> = {
  high:   'Високий',
  medium: 'Середній',
  low:    'Низький',
};

const TYPE_LABEL: Record<TaskType, string> = {
  daily: 'Щоденне',
  task:  'Завдання',
};

// ─── helpers ─────────────────────────────────────────────────────────────────

function isOverdue(dueDate: string): boolean {
  const [y, m, d] = dueDate.split('-').map(Number);
  const due   = new Date(y, m - 1, d);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  return due < today;
}

function fmtDate(dueDate: string): string {
  const [y, m, d] = dueDate.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('uk-UA', {
    day: 'numeric', month: 'short',
  });
}

// ─── skeleton ────────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className={styles.skeletonCard} aria-hidden>
      <div className={styles.skeletonTitle} />
      <div className={styles.skeletonSub}   />
      <div className={styles.skeletonFoot}  />
    </div>
  );
}

// ─── task card ───────────────────────────────────────────────────────────────

interface TaskCardProps {
  task: Task;
  canManage: boolean;
  onStart:    (id: string) => void;
  onComplete: (id: string) => void;
  onEdit:     (task: Task) => void;
  onDelete:   (task: Task) => void;
}

function TaskCard({ task, canManage, onStart, onComplete, onEdit, onDelete }: TaskCardProps) {
  const isDone  = task.status === 'done';
  const overdue = !!task.dueDate && !isDone && isOverdue(task.dueDate);

  const priorityChipClass = {
    high:   styles.chipHigh,
    medium: styles.chipMedium,
    low:    styles.chipLow,
  }[task.priority];

  return (
    <GlassCard className={`${styles.card} ${styles[`p_${task.priority}`]} ${isDone ? styles.cardDone : ''}`}>

      {/* ── title + description ── */}
      <div className={styles.body}>
        <span className={`${styles.title} ${isDone ? styles.titleDone : ''}`}>
          {task.title}
        </span>
        {task.description && (
          <span className={styles.desc}>{task.description}</span>
        )}
      </div>

      {/* ── meta: chips + edit/delete ── */}
      <div className={styles.meta}>
        <div className={styles.chips}>
          <span className={`${styles.chip} ${styles.chipPriority} ${priorityChipClass}`}>
            {PRIORITY_LABEL[task.priority]}
          </span>
          {task.type === 'daily' && (
            <span className={`${styles.chip} ${styles.chipType}`}>
              {TYPE_LABEL[task.type]}
            </span>
          )}
          {task.dueDate && (
            <span className={`${styles.chip} ${overdue ? styles.chipOverdue : styles.chipDate}`}>
              {overdue && <Icon name="clock" size="xs" />}
              {fmtDate(task.dueDate)}
            </span>
          )}
          {task.assignedTo && (
            <span className={`${styles.chip} ${styles.chipAssignee}`}>
              {task.assignedTo}
            </span>
          )}
        </div>

        {canManage && (
          <div className={styles.manage}>
            <button className={styles.iconBtn} onClick={() => onEdit(task)}
              aria-label="Редагувати завдання">
              <Icon name="settings" size="sm" />
            </button>
            <button className={styles.iconBtn} onClick={() => onDelete(task)}
              aria-label="Видалити завдання">
              <Icon name="close" size="sm" />
            </button>
          </div>
        )}
      </div>

      {/* ── iOS action strip ── */}
      {!isDone && (
        <div className={styles.actionStrip}>
          {task.status === 'todo' && (
            <button className={styles.stripBtn} onClick={() => onStart(task.documentId)}>
              <Icon name="clock" size="sm" />
              Почати
            </button>
          )}
          <button
            className={`${styles.stripBtn} ${styles.stripBtnDone}`}
            onClick={() => onComplete(task.documentId)}
          >
            <Icon name="check" size="sm" />
            Виконано
          </button>
        </div>
      )}

      {/* ── completed stamp ── */}
      {isDone && task.completedAt && (
        <div className={styles.completedStamp}>
          <Icon name="check" size="xs" color="success" />
          <span>
            {new Date(task.completedAt).toLocaleString('uk-UA', {
              day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
            })}
            {task.completedBy && ` — ${task.completedBy}`}
          </span>
        </div>
      )}
    </GlassCard>
  );
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default function TasksPage() {
  const { user }        = useAuth();
  const { addToast }    = useToast();

  const currentUserName = user?.username || '';
  const currentUserRole = user?.role?.type || 'barista';
  const isAdmin         = currentUserRole === 'owner' || currentUserRole === 'manager';

  const [formOpen,    setFormOpen]    = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deleteTask,  setDeleteTask]  = useState<Task | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen,  setSearchOpen]  = useState(false);

  const openCreate = useCallback(() => { setEditingTask(null); setFormOpen(true); }, []);

  useEffect(() => {
    window.addEventListener('appshell:action', openCreate);
    return () => window.removeEventListener('appshell:action', openCreate);
  }, [openCreate]);

  useEffect(() => {
    const h = () => setSearchOpen(true);
    window.addEventListener('appshell:search', h);
    return () => window.removeEventListener('appshell:search', h);
  }, []);

  const queryParams = useMemo<GetTasksParams>(() => {
    const p: GetTasksParams = {};
    if (!isAdmin) p.assignedTo = currentUserName;
    if (searchQuery.trim()) p.search = searchQuery.trim();
    return p;
  }, [searchQuery, isAdmin, currentUserName]);

  const { data: tasks, isLoading } = useTasks(queryParams);
  const updateMutation   = useUpdateTask();
  const completeMutation = useCompleteTask();
  const deleteMutation   = useDeleteTask();

  const tasksByStatus = useMemo(() => {
    const g: Record<TaskStatus, Task[]> = { todo: [], in_progress: [], done: [] };
    tasks?.forEach(t => g[t.status]?.push(t));
    return g;
  }, [tasks]);

  const handleStart = useCallback((id: string) => {
    updateMutation.mutate(
      { id, data: { status: 'in_progress' } },
      { onSuccess: () => addToast({ type: 'success', title: 'Завдання розпочато' }) },
    );
  }, [updateMutation, addToast]);

  const handleComplete = useCallback((id: string) => {
    completeMutation.mutate(
      { id, completedBy: currentUserName },
      { onSuccess: () => addToast({ type: 'success', title: 'Завдання виконано' }) },
    );
  }, [completeMutation, currentUserName, addToast]);

  const handleEdit   = useCallback((task: Task) => { setEditingTask(task); setFormOpen(true); }, []);
  const handleDelete = useCallback((task: Task) => setDeleteTask(task), []);

  const handleDeleteConfirm = useCallback(() => {
    if (!deleteTask) return;
    deleteMutation.mutate(deleteTask.documentId, {
      onSuccess: () => { addToast({ type: 'success', title: 'Завдання видалено' }); setDeleteTask(null); },
    });
  }, [deleteTask, deleteMutation, addToast]);

  const canManage = useCallback(
    (task: Task) => isAdmin || task.assignedTo === currentUserName,
    [isAdmin, currentUserName],
  );

  return (
    <div className={styles.page}>

      {searchOpen && (
        <div className={styles.searchBar}>
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Пошук завдань..."
            variant="glass"
            autoFocus
          />
          <Button variant="ghost" size="sm" iconOnly aria-label="Закрити пошук"
            onClick={() => { setSearchOpen(false); setSearchQuery(''); }}>
            <Icon name="close" size="md" />
          </Button>
        </div>
      )}

      <div className={styles.board}>
        {COLUMNS.map(col => {
          const colTasks = tasksByStatus[col.id];
          return (
            <div key={col.id} className={styles.column}>

              <div className={styles.colHeader}>
                <span className={styles.colLabel}>{col.label}</span>
                {isLoading
                  ? <span className={styles.colCountSkeleton} />
                  : <span className={styles.colCount}>{colTasks.length}</span>
                }
              </div>

              <div className={styles.list}>
                {isLoading ? (
                  <><SkeletonCard />{col.id === 'todo' && <SkeletonCard />}</>
                ) : colTasks.length === 0 ? (
                  <div className={styles.empty}>
                    <span className={styles.emptyText}>Немає завдань</span>
                    {col.id === 'todo' && (
                      <button className={styles.emptyAdd} onClick={openCreate}>
                        <Icon name="plus" size="sm" />
                        Додати
                      </button>
                    )}
                  </div>
                ) : (
                  colTasks.map(task => (
                    <TaskCard key={task.documentId} task={task} canManage={canManage(task)}
                      onStart={handleStart} onComplete={handleComplete}
                      onEdit={handleEdit}   onDelete={handleDelete} />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      <TaskFormModal
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        task={editingTask}
        onSuccess={() => {}}
        currentUserName={currentUserName}
        currentUserRole={currentUserRole}
      />

      <Modal open={!!deleteTask} onClose={() => setDeleteTask(null)}
        title="Видалити завдання?" icon="close" size="sm">
        <div className={styles.deleteBody}>
          <Text variant="bodyMedium" color="secondary">
            Ви впевнені, що хочете видалити &laquo;{deleteTask?.title}&raquo;?
          </Text>
          <div className={styles.deleteRow}>
            <Button variant="ghost" onClick={() => setDeleteTask(null)}>Скасувати</Button>
            <Button variant="primary" onClick={handleDeleteConfirm} loading={deleteMutation.isPending}>
              Видалити
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
