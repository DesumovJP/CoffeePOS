'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Text, Icon, Button, GlassCard, Modal } from '@/components/atoms';
import { SearchInput } from '@/components/molecules';
import { TaskFormModal, TaskCompleteModal } from '@/components/organisms';
import { useToast } from '@/components/atoms';
import {
  useTasks, useStartTask, useCompleteTask, useDeleteTask, useUpdateTask,
  useOfflineSync, useTaskTimer,
} from '@/lib/hooks';
import { useAuth } from '@/lib/providers/AuthProvider';
import { uploadFile } from '@/lib/api/upload';
import { formatDuration, formatDurationHuman } from '@/lib/utils/taskTimer';
import type { Task, TaskStatus, TaskPriority, TaskType, GetTasksParams } from '@/lib/api';
import styles from './page.module.css';

// ─── constants ────────────────────────────────────────────────────────────────

const COLUMNS: { id: TaskStatus; label: string }[] = [
  { id: 'todo',        label: 'До виконання' },
  { id: 'in_progress', label: 'В процесі'    },
  { id: 'done',        label: 'Виконано'      },
];

const PRIORITY_LABEL: Record<TaskPriority, string> = {
  high: 'Високий', medium: 'Середній', low: 'Низький',
};

const TYPE_LABEL: Record<TaskType, string> = {
  daily: 'Щоденне', task: 'Завдання',
};

// ─── helpers ─────────────────────────────────────────────────────────────────

function isOverdue(dueDate: string): boolean {
  const [y, m, d] = dueDate.split('-').map(Number);
  const due = new Date(y, m - 1, d);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  return due < today;
}

function fmtDate(dueDate: string): string {
  const [y, m, d] = dueDate.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('uk-UA', { day: 'numeric', month: 'short' });
}

// ─── skeleton ─────────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className={styles.skeletonCard} aria-hidden>
      <div className={styles.skeletonTitle} />
      <div className={styles.skeletonSub}   />
      <div className={styles.skeletonFoot}  />
    </div>
  );
}

// ─── live timer display (single card scope) ───────────────────────────────────

function TimerDisplay({ documentId, status }: { documentId: string; status: string }) {
  const elapsed = useTaskTimer(documentId, status);
  if (elapsed === null) return null;
  return (
    <span className={styles.timerDisplay}>
      <Icon name="clock" size="xs" />
      {formatDuration(elapsed)}
    </span>
  );
}

// ─── task card ────────────────────────────────────────────────────────────────

interface TaskCardProps {
  task: Task;
  canManage: boolean;
  onStart:    (id: string) => void;
  onComplete: (task: Task) => void;
  onEdit:     (task: Task) => void;
  onDelete:   (task: Task) => void;
}

function TaskCard({ task, canManage, onStart, onComplete, onEdit, onDelete }: TaskCardProps) {
  const isDone    = task.status === 'done';
  const isRunning = task.status === 'in_progress';
  const overdue   = !!task.dueDate && !isDone && isOverdue(task.dueDate);

  // Meta items: date · type · assignee
  const metaItems: React.ReactNode[] = [];
  if (task.dueDate) {
    metaItems.push(
      <span key="date" className={overdue ? styles.metaOverdue : styles.metaMuted}>
        {overdue && <Icon name="clock" size="xs" />}{fmtDate(task.dueDate)}
      </span>
    );
  }
  if (task.type === 'daily') metaItems.push(<span key="type" className={styles.metaMuted}>Щоденне</span>);
  if (task.assignedTo)       metaItems.push(<span key="who"  className={styles.metaMuted}>{task.assignedTo}</span>);

  return (
    <GlassCard className={`${styles.card} ${styles[`p_${task.priority}`]} ${isDone ? styles.cardDone : ''}`}>

      {/* ── body ── */}
      <div className={styles.body}>

        {/* title row + manage icons */}
        <div className={styles.titleRow}>
          <span className={`${styles.title} ${isDone ? styles.titleDone : ''}`}>
            {task.title}
          </span>
          {canManage && (
            <div className={styles.manage}>
              <button className={styles.iconBtn} onClick={() => onEdit(task)} aria-label="Редагувати завдання">
                <Icon name="settings" size="sm" />
              </button>
              <button className={styles.iconBtn} onClick={() => onDelete(task)} aria-label="Видалити завдання">
                <Icon name="close" size="sm" />
              </button>
            </div>
          )}
        </div>

        {/* description */}
        {task.description && <span className={styles.desc}>{task.description}</span>}

        {/* meta line */}
        {metaItems.length > 0 && (
          <div className={styles.footerMeta}>
            <span className={`${styles.priorityDot} ${styles[`dot_${task.priority}`]}`} />
            {metaItems.map((item, i) => (
              <React.Fragment key={i}>
                {i > 0 && <span className={styles.metaSep}>·</span>}
                {item}
              </React.Fragment>
            ))}
          </div>
        )}
      </div>

      {/* ── action strip (todo / in_progress) ── */}
      {!isDone && (
        <div className={styles.actionStrip}>
          {isRunning ? (
            <>
              <div className={styles.timerSide}>
                <TimerDisplay documentId={task.documentId} status={task.status} />
              </div>
              <button className={`${styles.stripBtn} ${styles.stripBtnDone}`} onClick={() => onComplete(task)}>
                <Icon name="check" size="sm" />
                Виконано
              </button>
            </>
          ) : (
            <button className={styles.stripBtn} onClick={() => onStart(task.documentId)}>
              <Icon name="clock" size="sm" />
              Почати
            </button>
          )}
        </div>
      )}

      {/* ── done footer ── */}
      {isDone && (
        <div className={styles.doneFooter}>
          {/* info row */}
          <div className={styles.doneStamp}>
            <Icon name="check" size="xs" color="success" />
            <span className={styles.doneStampText}>
              {task.completedAt && new Date(task.completedAt).toLocaleString('uk-UA', {
                day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
              })}
              {task.duration != null && ` · ${formatDurationHuman(task.duration)}`}
              {task.completedBy && ` — ${task.completedBy}`}
            </span>
            {task.completionNote && (
              <span className={styles.doneNote} title={task.completionNote}>📝</span>
            )}
          </div>

          {/* photo thumbnail — full-width preview */}
          {task.completionPhoto?.url && (
            <a
              href={task.completionPhoto.url}
              target="_blank"
              rel="noreferrer"
              className={styles.photoThumbWrap}
              title="Фото виконання — натисніть для перегляду"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={task.completionPhoto.url}
                alt="Фото виконання"
                className={styles.photoThumb}
              />
              <div className={styles.photoOverlay}>
                <Icon name="plus" size="sm" />
              </div>
            </a>
          )}
        </div>
      )}
    </GlassCard>
  );
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default function TasksPage() {
  const { user }     = useAuth();
  const { addToast } = useToast();

  const currentUserName = user?.username || '';
  const currentUserRole = user?.role?.type || 'barista';
  const isAdmin         = currentUserRole === 'owner' || currentUserRole === 'manager';

  // UI state
  const [formOpen,      setFormOpen]      = useState(false);
  const [editingTask,   setEditingTask]   = useState<Task | null>(null);
  const [deleteTask,    setDeleteTask]    = useState<Task | null>(null);
  const [completingTask, setCompletingTask] = useState<Task | null>(null);
  const [searchQuery,   setSearchQuery]   = useState('');
  const [searchOpen,    setSearchOpen]    = useState(false);
  const [isUploading,   setIsUploading]   = useState(false);

  // Sync offline queue when reconnected
  useOfflineSync();

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
  const startMutation    = useStartTask();
  const completeMutation = useCompleteTask();
  const updateMutation   = useUpdateTask();
  const deleteMutation   = useDeleteTask();

  const tasksByStatus = useMemo(() => {
    const g: Record<TaskStatus, Task[]> = { todo: [], in_progress: [], done: [] };
    tasks?.forEach(t => g[t.status]?.push(t));
    return g;
  }, [tasks]);

  // ── handlers ──────────────────────────────────────────────────────────────

  const handleStart = useCallback((id: string) => {
    startMutation.mutate(id, {
      onSuccess: () => addToast({ type: 'success', title: 'Таймер запущено' }),
      onError:   () => addToast({ type: 'error',   title: 'Не вдалося розпочати' }),
    });
  }, [startMutation, addToast]);

  const handleCompleteRequest = useCallback((task: Task) => {
    setCompletingTask(task);
  }, []);

  const handleCompleteConfirm = useCallback(async ({ note, photoFile }: { note: string; photoFile: File | null }) => {
    if (!completingTask) return;

    setIsUploading(true);
    let photoId: number | undefined;

    if (photoFile) {
      if (!navigator.onLine) {
        addToast({ type: 'warning', title: 'Фото збережеться коли з\'явиться інтернет' });
      } else {
        try {
          const media = await uploadFile(photoFile);
          photoId = media?.id;
        } catch {
          addToast({ type: 'error', title: 'Помилка завантаження фото' });
        }
      }
    }

    setIsUploading(false);

    completeMutation.mutate(
      {
        id: completingTask.documentId,
        completedBy: currentUserName,
        completionNote: note || undefined,
        completionPhotoId: photoId,
      },
      {
        onSuccess: () => {
          addToast({ type: 'success', title: 'Завдання виконано ✓' });
          setCompletingTask(null);
        },
        onError: () => addToast({ type: 'error', title: 'Помилка збереження' }),
      }
    );
  }, [completingTask, completeMutation, currentUserName, addToast]);

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

  // ── render ────────────────────────────────────────────────────────────────

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
                    <TaskCard
                      key={task.documentId}
                      task={task}
                      canManage={canManage(task)}
                      onStart={handleStart}
                      onComplete={handleCompleteRequest}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* create / edit task */}
      <TaskFormModal
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        task={editingTask}
        onSuccess={() => {}}
        currentUserName={currentUserName}
        currentUserRole={currentUserRole}
      />

      {/* completion modal */}
      <TaskCompleteModal
        task={completingTask}
        isOpen={!!completingTask}
        onClose={() => setCompletingTask(null)}
        onConfirm={handleCompleteConfirm}
        isSubmitting={completeMutation.isPending || isUploading}
      />

      {/* delete confirm */}
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
