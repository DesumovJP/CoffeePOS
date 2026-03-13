'use client';

/**
 * CoffeePOS - TaskWidget
 *
 * Sidebar widget showing task preview + count badge.
 * Clicking opens a full-screen modal with the kanban board.
 */

import React, { useState, useMemo, useCallback } from 'react';
import { Icon, Button, Modal, Text } from '@/components/atoms';
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
import type { Task, TaskStatus, TaskPriority, GetTasksParams } from '@/lib/api';
import styles from './TaskWidget.module.css';

// ─── constants ────────────────────────────────────────────────────────────────

const COLUMNS: { id: TaskStatus; label: string }[] = [
  { id: 'todo',        label: 'До виконання' },
  { id: 'in_progress', label: 'В процесі'    },
  { id: 'done',        label: 'Виконано'      },
];

// ─── helpers ──────────────────────────────────────────────────────────────────

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

// ─── timer display ────────────────────────────────────────────────────────────

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
    <div className={`${styles.card} ${styles[`p_${task.priority}`]} ${isDone ? styles.cardDone : ''}`}>
      <div className={styles.body}>
        <div className={styles.titleRow}>
          <span className={`${styles.title} ${isDone ? styles.titleDone : ''}`}>{task.title}</span>
          {canManage && (
            <div className={styles.manage}>
              <button className={styles.iconBtn} onClick={() => onEdit(task)} aria-label="Редагувати">
                <Icon name="settings" size="sm" />
              </button>
              <button className={styles.iconBtn} onClick={() => onDelete(task)} aria-label="Видалити">
                <Icon name="close" size="sm" />
              </button>
            </div>
          )}
        </div>
        {task.description && <span className={styles.desc}>{task.description}</span>}
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

      {!isDone && (
        <div className={styles.actionStrip}>
          {isRunning ? (
            <>
              <div className={styles.timerSide}>
                <TimerDisplay documentId={task.documentId} status={task.status} />
              </div>
              <button className={`${styles.stripBtn} ${styles.stripBtnDone}`} onClick={() => onComplete(task)}>
                <Icon name="check" size="sm" /> Виконано
              </button>
            </>
          ) : (
            <button className={styles.stripBtn} onClick={() => onStart(task.documentId)}>
              <Icon name="clock" size="sm" /> Почати
            </button>
          )}
        </div>
      )}

      {isDone && (
        <div className={styles.doneFooter}>
          <div className={styles.doneStamp}>
            <Icon name="check" size="xs" color="success" />
            <span className={styles.doneStampText}>
              {task.completedAt && new Date(task.completedAt).toLocaleString('uk-UA', {
                day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
              })}
              {task.duration != null && ` · ${formatDurationHuman(task.duration)}`}
              {task.completedBy && ` — ${task.completedBy}`}
            </span>
            {task.completionNote && <span className={styles.doneNote} title={task.completionNote}>📝</span>}
          </div>
          {task.completionPhoto?.url && (
            <a href={task.completionPhoto.url} target="_blank" rel="noreferrer"
              className={styles.photoThumbWrap} title="Фото виконання">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={task.completionPhoto.url} alt="Фото виконання" className={styles.photoThumb} />
              <div className={styles.photoOverlay}><Icon name="plus" size="sm" /></div>
            </a>
          )}
        </div>
      )}
    </div>
  );
}

// ─── main component ───────────────────────────────────────────────────────────

export interface TaskWidgetProps {
  collapsed?: boolean;
  defaultOpen?: boolean;
  onModalClose?: () => void;
}

export function TaskWidget({ collapsed = false, defaultOpen = false, onModalClose }: TaskWidgetProps) {
  const { user }     = useAuth();
  const { addToast } = useToast();

  const currentUserName = user?.username || '';
  const currentUserRole = user?.role?.type || 'barista';
  const isAdmin         = currentUserRole === 'owner' || currentUserRole === 'manager';

  const [modalOpen,      setModalOpen]      = useState(defaultOpen);
  const [formOpen,       setFormOpen]       = useState(false);
  const [editingTask,    setEditingTask]    = useState<Task | null>(null);
  const [deleteTask,     setDeleteTask]     = useState<Task | null>(null);
  const [completingTask, setCompletingTask] = useState<Task | null>(null);
  const [searchQuery,    setSearchQuery]    = useState('');
  const [searchOpen,     setSearchOpen]     = useState(false);
  const [isUploading,    setIsUploading]    = useState(false);

  useOfflineSync();

  const queryParams = useMemo<GetTasksParams>(() => {
    const p: GetTasksParams = {};
    if (!isAdmin) p.assignedTo = currentUserName;
    if (searchQuery.trim()) p.search = searchQuery.trim();
    return p;
  }, [searchQuery, isAdmin, currentUserName]);

  const { data: tasks, isLoading } = useTasks(queryParams);

  const startMutation    = useStartTask();
  const completeMutation = useCompleteTask();
  useUpdateTask(); // keep mutation available
  const deleteMutation   = useDeleteTask();

  const tasksByStatus = useMemo(() => {
    const g: Record<TaskStatus, Task[]> = { todo: [], in_progress: [], done: [] };
    tasks?.forEach(t => g[t.status]?.push(t));
    return g;
  }, [tasks]);

  // Preview: up to 3 active (todo + in_progress) tasks, sorted by priority
  const previewTasks = useMemo(() => {
    const active = [...(tasksByStatus.in_progress || []), ...(tasksByStatus.todo || [])];
    const sorted = active.sort((a, b) => {
      const order: Record<TaskPriority, number> = { high: 0, medium: 1, low: 2 };
      return order[a.priority] - order[b.priority];
    });
    return sorted.slice(0, 3);
  }, [tasksByStatus]);

  const activeCount = (tasksByStatus.todo?.length || 0) + (tasksByStatus.in_progress?.length || 0);

  // ── handlers ──────────────────────────────────────────────────────────────

  const openCreate = useCallback(() => { setEditingTask(null); setFormOpen(true); }, []);

  const handleStart = useCallback((id: string) => {
    startMutation.mutate(id, {
      onSuccess: () => addToast({ type: 'success', title: 'Таймер запущено' }),
      onError:   () => addToast({ type: 'error',   title: 'Не вдалося розпочати' }),
    });
  }, [startMutation, addToast]);

  const handleCompleteConfirm = useCallback(async ({ note, photoFile }: { note: string; photoFile: File | null }) => {
    if (!completingTask) return;
    setIsUploading(true);
    let photoId: number | undefined;
    if (photoFile) {
      try {
        const media = await uploadFile(photoFile);
        photoId = media?.id;
      } catch {
        addToast({ type: 'error', title: 'Помилка завантаження фото' });
      }
    }
    setIsUploading(false);
    completeMutation.mutate(
      { id: completingTask.documentId, completedBy: currentUserName, completionNote: note || undefined, completionPhotoId: photoId },
      {
        onSuccess: () => { addToast({ type: 'success', title: 'Завдання виконано ✓' }); setCompletingTask(null); },
        onError:   () => addToast({ type: 'error', title: 'Помилка збереження' }),
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

  // ── widget render ─────────────────────────────────────────────────────────

  return (
    <>
      <div className={`${styles.widget} ${collapsed ? styles.widgetCollapsed : ''}`}>
        {/* Main trigger button */}
        <button
          type="button"
          className={`${styles.triggerBtn} ${collapsed ? styles.triggerCollapsed : ''}`}
          onClick={() => setModalOpen(true)}
          title={collapsed ? 'Завдання' : undefined}
        >
          <Icon name="check" size="md" color={activeCount > 0 ? 'accent' : 'secondary'} />
          {!collapsed && (
            <>
              <span className={styles.triggerLabel}>Завдання</span>
              {activeCount > 0 && (
                <span className={styles.triggerBadge}>{activeCount}</span>
              )}
            </>
          )}
          {collapsed && activeCount > 0 && <span className={styles.badgeDot} />}
        </button>

        {/* Preview rows (expanded only) */}
        {!collapsed && previewTasks.length > 0 && (
          <div className={styles.previews}>
            {previewTasks.map(task => (
              <button
                key={task.documentId}
                type="button"
                className={styles.previewRow}
                onClick={() => setModalOpen(true)}
              >
                <span className={`${styles.previewDot} ${styles[`dot_${task.priority}`]}`} />
                <span className={styles.previewTitle}>{task.title}</span>
                {task.status === 'in_progress' && (
                  <span className={styles.previewRunning}>●</span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Full task board modal ────────────────────────────────────────── */}
      <Modal
        open={modalOpen}
        onClose={() => { setModalOpen(false); onModalClose?.(); }}
        title="Завдання"
        icon="check"
        size="xl"
      >
        <div className={styles.modalBody}>
          {/* Toolbar */}
          <div className={styles.modalToolbar}>
            {searchOpen ? (
              <>
                <SearchInput
                  value={searchQuery}
                  onChange={setSearchQuery}
                  placeholder="Пошук завдань..."
                  variant="glass"
                  autoFocus
                />
                <Button variant="ghost" size="sm" iconOnly
                  onClick={() => { setSearchOpen(false); setSearchQuery(''); }}>
                  <Icon name="close" size="md" />
                </Button>
              </>
            ) : (
              <>
                <div />
                <Button variant="ghost" size="sm" iconOnly onClick={() => setSearchOpen(true)} aria-label="Пошук">
                  <Icon name="search" size="md" />
                </Button>
                {isAdmin && (
                  <Button variant="primary" size="sm" onClick={openCreate}>
                    <Icon name="plus" size="sm" /> Додати
                  </Button>
                )}
              </>
            )}
          </div>

          {/* Kanban board */}
          <div className={styles.board}>
            {COLUMNS.map(col => {
              const colTasks = tasksByStatus[col.id] || [];
              return (
                <div key={col.id} className={styles.column}>
                  <div className={styles.colHeader}>
                    <span className={styles.colLabel}>{col.label}</span>
                    <span className={styles.colCount}>{isLoading ? '…' : colTasks.length}</span>
                  </div>
                  <div className={styles.list}>
                    {isLoading ? (
                      <><SkeletonCard />{col.id === 'todo' && <SkeletonCard />}</>
                    ) : colTasks.length === 0 ? (
                      <div className={styles.empty}>
                        <span className={styles.emptyText}>Немає завдань</span>
                        {col.id === 'todo' && (
                          <button className={styles.emptyAdd} onClick={openCreate}>
                            <Icon name="plus" size="sm" /> Додати
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
                          onComplete={setCompletingTask}
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
        </div>
      </Modal>

      {/* Task form (create/edit) */}
      <TaskFormModal
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        task={editingTask}
        onSuccess={() => {}}
        currentUserName={currentUserName}
        currentUserRole={currentUserRole}
      />

      {/* Complete modal */}
      <TaskCompleteModal
        task={completingTask}
        isOpen={!!completingTask}
        onClose={() => setCompletingTask(null)}
        onConfirm={handleCompleteConfirm}
        isSubmitting={completeMutation.isPending || isUploading}
      />

      {/* Delete confirm */}
      <Modal open={!!deleteTask} onClose={() => setDeleteTask(null)}
        title="Видалити завдання?" icon="close" size="sm">
        <div className={styles.deleteBody}>
          <Text variant="bodyMedium" color="secondary">
            Ви впевнені, що хочете видалити «{deleteTask?.title}»?
          </Text>
          <div className={styles.deleteRow}>
            <Button variant="ghost" onClick={() => setDeleteTask(null)}>Скасувати</Button>
            <Button variant="primary" onClick={handleDeleteConfirm} loading={deleteMutation.isPending}>
              Видалити
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

export default TaskWidget;
