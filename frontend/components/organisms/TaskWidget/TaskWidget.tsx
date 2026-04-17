'use client';

/**
 * CoffeePOS - TaskWidget
 *
 * Sidebar widget: embedded card block (expanded) or icon button (collapsed).
 * Modal: simple list view with Активні / Виконані tabs.
 */

import React, { useState, useMemo, useCallback } from 'react';
import { Icon, Button, Modal, Text } from '@/components/atoms';
import { TaskFormModal, TaskCompleteModal } from '@/components/organisms';
import { useToast } from '@/components/atoms';
import {
  useTasks, useStartTask, useCompleteTask, useDeleteTask, useUpdateTask,
  useOfflineSync, useTaskTimer,
} from '@/lib/hooks';
import { useAuth } from '@/lib/providers/AuthProvider';
import { uploadFile } from '@/lib/api/upload';
import { formatDuration, formatDurationHuman } from '@/lib/utils/taskTimer';
import type { Task, TaskPriority, GetTasksParams } from '@/lib/api';
import styles from './TaskWidget.module.css';

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

function SkeletonRow() {
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

// ─── task row (list item) ─────────────────────────────────────────────────────

interface TaskRowProps {
  task: Task;
  canManage: boolean;
  onStart:    (id: string) => void;
  onComplete: (task: Task) => void;
  onEdit:     (task: Task) => void;
  onDelete:   (task: Task) => void;
}

function TaskRow({ task, canManage, onStart, onComplete, onEdit, onDelete }: TaskRowProps) {
  const [expanded, setExpanded] = useState(false);

  const isDone    = task.status === 'done';
  const isRunning = task.status === 'in_progress';
  const overdue   = !!task.dueDate && !isDone && isOverdue(task.dueDate);

  const handleRowClick = (e: React.MouseEvent) => {
    // Don't toggle when clicking action buttons
    if ((e.target as HTMLElement).closest('button')) return;
    setExpanded(prev => !prev);
  };

  return (
    <div
      className={`${styles.taskRow} ${styles[`p_${task.priority}`]} ${isDone ? styles.taskRowDone : ''} ${expanded ? styles.taskRowExpanded : ''}`}
      onClick={handleRowClick}
      role="button"
      tabIndex={0}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setExpanded(p => !p); }}
    >
      {/* Priority bar */}
      <div className={`${styles.priorityBar} ${styles[`bar_${task.priority}`]}`} />

      {/* Main content */}
      <div className={styles.rowContent}>
        <div className={styles.rowTop}>
          {/* Title + meta */}
          <div className={styles.rowLeft}>
            <span className={`${styles.rowTitle} ${isDone ? styles.rowTitleDone : ''}`}>
              {task.title}
            </span>
            <div className={styles.rowMeta}>
              {task.assignedTo && (
                <span className={styles.metaChip}>{task.assignedTo}</span>
              )}
              {task.dueDate && (
                <span className={`${styles.metaChip} ${overdue ? styles.metaChipOverdue : ''}`}>
                  {overdue && <Icon name="clock" size="xs" />}
                  {fmtDate(task.dueDate)}
                </span>
              )}
              {isRunning && (
                <TimerDisplay documentId={task.documentId} status={task.status} />
              )}
              {isDone && task.completedAt && (
                <span className={styles.metaChip}>
                  {new Date(task.completedAt).toLocaleString('uk-UA', {
                    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
                  })}
                  {task.duration != null && ` · ${formatDurationHuman(task.duration)}`}
                </span>
              )}
            </div>
          </div>

          {/* Action button */}
          <div className={styles.rowAction}>
            {isRunning && (
              <button
                className={`${styles.actionBtn} ${styles.actionBtnDone}`}
                onClick={e => { e.stopPropagation(); onComplete(task); }}
              >
                <Icon name="check" size="sm" /> Виконано
              </button>
            )}
            {task.status === 'todo' && (
              <button
                className={styles.actionBtn}
                onClick={e => { e.stopPropagation(); onStart(task.documentId); }}
              >
                Почати →
              </button>
            )}
            {isDone && (
              <span className={styles.doneStamp}>
                <Icon name="check" size="xs" color="success" />
              </span>
            )}
          </div>
        </div>

        {/* Expanded: description + manage */}
        {expanded && (
          <div className={styles.rowExpanded}>
            {task.description && (
              <p className={styles.rowDesc}>{task.description}</p>
            )}
            {task.completionNote && (
              <p className={styles.rowDesc}><em>{task.completionNote}</em></p>
            )}
            {task.completionPhoto?.url && (
              <a
                href={task.completionPhoto.url}
                target="_blank"
                rel="noreferrer"
                className={styles.photoThumbWrap}
                title="Фото виконання"
                onClick={e => e.stopPropagation()}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={task.completionPhoto.url} alt="Фото виконання" className={styles.photoThumb} />
                <div className={styles.photoOverlay}><Icon name="plus" size="sm" /></div>
              </a>
            )}
            {canManage && (
              <div className={styles.rowManage}>
                <button className={styles.iconBtn} onClick={e => { e.stopPropagation(); onEdit(task); }} aria-label="Редагувати">
                  <Icon name="settings" size="sm" /> Редагувати
                </button>
                <button className={`${styles.iconBtn} ${styles.iconBtnDelete}`} onClick={e => { e.stopPropagation(); onDelete(task); }} aria-label="Видалити">
                  <Icon name="close" size="sm" /> Видалити
                </button>
              </div>
            )}
          </div>
        )}
      </div>
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
  const [isUploading,    setIsUploading]    = useState(false);
  const [activeTab,      setActiveTab]      = useState<'active' | 'done'>('active');

  useOfflineSync();

  const queryParams = useMemo<GetTasksParams>(() => {
    const p: GetTasksParams = {};
    if (!isAdmin) p.assignedTo = currentUserName;
    return p;
  }, [isAdmin, currentUserName]);

  const { data: tasks, isLoading } = useTasks(queryParams);

  const startMutation    = useStartTask();
  const completeMutation = useCompleteTask();
  useUpdateTask(); // keep mutation available
  const deleteMutation   = useDeleteTask();

  // Separate active (todo + in_progress) and done tasks
  const activeTasks = useMemo(() => {
    const all = tasks || [];
    const active = all.filter(t => t.status === 'todo' || t.status === 'in_progress');
    const order: Record<TaskPriority, number> = { high: 0, medium: 1, low: 2 };
    return active.sort((a, b) => {
      // in_progress first, then by priority
      if (a.status === 'in_progress' && b.status !== 'in_progress') return -1;
      if (b.status === 'in_progress' && a.status !== 'in_progress') return 1;
      return order[a.priority] - order[b.priority];
    });
  }, [tasks]);

  const doneTasks = useMemo(() =>
    (tasks || []).filter(t => t.status === 'done'), [tasks]);

  // Preview: up to 3 active tasks, highest priority first
  const previewTasks = useMemo(() => activeTasks.slice(0, 3), [activeTasks]);

  const activeCount = activeTasks.length;

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

  const displayedTasks = activeTab === 'active' ? activeTasks : doneTasks;

  // ── collapsed widget ───────────────────────────────────────────────────────

  if (collapsed) {
    return (
      <>
        <div className={styles.widgetCollapsed}>
          <button
            type="button"
            className={styles.collapsedBtn}
            onClick={() => setModalOpen(true)}
            title="Завдання"
          >
            <Icon name="check" size="md" color={activeCount > 0 ? 'accent' : 'secondary'} />
            {activeCount > 0 && <span className={styles.badgeDot} />}
          </button>
        </div>

        {renderModals()}
      </>
    );
  }

  // ── expanded card widget ───────────────────────────────────────────────────

  function renderModals() {
    return (
      <>
        {/* Full task list modal */}
        <Modal
          open={modalOpen}
          onClose={() => { setModalOpen(false); onModalClose?.(); }}
          title="Завдання"
          icon="check"
          size="xl"
        >
          <div className={styles.modalBody}>
            {/* Tabs + actions in one row */}
            <div className={styles.modalToolbar}>
              <div className={styles.tabPills}>
                <button
                  className={`${styles.tabPill} ${activeTab === 'active' ? styles.tabPillActive : ''}`}
                  onClick={() => setActiveTab('active')}
                >
                  Активні
                  <span className={styles.tabCount}>{isLoading ? '…' : activeTasks.length}</span>
                </button>
                <button
                  className={`${styles.tabPill} ${activeTab === 'done' ? styles.tabPillActive : ''}`}
                  onClick={() => setActiveTab('done')}
                >
                  Виконані
                  <span className={styles.tabCount}>{isLoading ? '…' : doneTasks.length}</span>
                </button>
              </div>
              <div className={styles.toolbarActions}>
                <Button variant="primary" size="sm" onClick={openCreate}>
                  <Icon name="plus" size="sm" /> Додати
                </Button>
              </div>
            </div>

            {/* Task list */}
            <div className={styles.taskList}>
              {isLoading ? (
                <><SkeletonRow /><SkeletonRow /><SkeletonRow /></>
              ) : displayedTasks.length === 0 ? (
                <div className={styles.empty}>
                  <Icon name={activeTab === 'active' ? 'check' : 'clock'} size="xl" color="tertiary" />
                  <span className={styles.emptyText}>
                    {activeTab === 'active' ? 'Немає активних завдань' : 'Немає виконаних завдань'}
                  </span>
                  {activeTab === 'active' && isAdmin && (
                    <button className={styles.emptyAdd} onClick={openCreate}>
                      <Icon name="plus" size="sm" /> Додати завдання
                    </button>
                  )}
                </div>
              ) : (
                displayedTasks.map(task => (
                  <TaskRow
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

  return (
    <>
      {/* ── Embedded sidebar card ─────────────────────────────────────────── */}
      <div className={styles.card}>
        {/* Card header */}
        <button
          type="button"
          className={styles.cardHeader}
          onClick={() => setModalOpen(true)}
        >
          <Icon name="check" size="sm" color={activeCount > 0 ? 'accent' : 'secondary'} />
          <span className={styles.cardTitle}>Завдання</span>
          {activeCount > 0 && (
            <span className={styles.cardBadge}>{activeCount}</span>
          )}
        </button>

        {/* Preview tasks or subtle create button */}
        {previewTasks.length === 0 ? (
          <div className={styles.cardFooter}>
            <button
              type="button"
              className={styles.footerNewBtn}
              onClick={openCreate}
            >
              + Нове завдання
            </button>
          </div>
        ) : (
          <>
            <div className={styles.cardPreviews}>
              {previewTasks.map(task => (
                <button
                  key={task.documentId}
                  type="button"
                  className={`${styles.previewRow} ${styles[`row_${task.priority}`]}`}
                  onClick={() => setModalOpen(true)}
                >
                  <span className={`${styles.previewDot} ${styles[`dot_${task.priority}`]}`} />
                  <span className={styles.previewTitle}>{task.title}</span>
                  {task.assignedTo && (
                    <span className={styles.previewAssignee}>
                      {task.assignedTo.trim().split(/\s+/).slice(0, 2).map((w: string) => w[0]?.toUpperCase() ?? '').join('')}
                    </span>
                  )}
                  {task.status === 'in_progress' && (
                    <span className={styles.previewRunning}>●</span>
                  )}
                </button>
              ))}
            </div>
            <div className={styles.cardFooter}>
              <button
                type="button"
                className={styles.footerNewBtn}
                onClick={openCreate}
              >
                + Нове завдання
              </button>
            </div>
          </>
        )}
      </div>

      {renderModals()}
    </>
  );
}

export default TaskWidget;
