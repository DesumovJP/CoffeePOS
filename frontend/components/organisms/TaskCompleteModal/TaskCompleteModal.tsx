'use client';

/**
 * TaskCompleteModal — appears when user taps "Виконано" on an in-progress task.
 *
 * Shows:
 *   • Live elapsed time ("Час виконання: 05:23")
 *   • Optional completion note textarea
 *   • Optional photo attachment (preview + remove)
 *   • Submit → calls onConfirm({ note, photoFile })
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { Button, Text, Modal } from '@/components/atoms';
import { formatDurationHuman, taskTimer } from '@/lib/utils/taskTimer';
import type { Task } from '@/lib/api';
import styles from './TaskCompleteModal.module.css';

interface Props {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: { note: string; photoFile: File | null }) => void;
  isSubmitting?: boolean;
}

export function TaskCompleteModal({ task, isOpen, onClose, onConfirm, isSubmitting }: Props) {
  const [note,      setNote]      = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [preview,   setPreview]   = useState<string | null>(null);
  const [elapsed,   setElapsed]   = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Live timer inside the modal
  useEffect(() => {
    if (!isOpen || !task) return;
    const tick = () => setElapsed(taskTimer.elapsed(task.documentId));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [isOpen, task]);

  // Reset on close
  useEffect(() => {
    if (!isOpen) {
      setNote('');
      setPhotoFile(null);
      setPreview(null);
    }
  }, [isOpen]);

  const handlePhoto = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setPhotoFile(file);
    if (file) {
      const url = URL.createObjectURL(file);
      setPreview(url);
    } else {
      setPreview(null);
    }
  }, []);

  const removePhoto = useCallback(() => {
    setPhotoFile(null);
    setPreview(null);
    if (fileRef.current) fileRef.current.value = '';
  }, []);

  const handleSubmit = useCallback(() => {
    onConfirm({ note: note.trim(), photoFile });
  }, [note, photoFile, onConfirm]);

  if (!task) return null;

  const durationLabel = elapsed != null ? formatDurationHuman(elapsed) : null;

  const footer = (
    <div className={styles.footer}>
      <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
        Скасувати
      </Button>
      <Button variant="primary" onClick={handleSubmit} loading={isSubmitting} fullWidth>
        Позначити виконаним
      </Button>
    </div>
  );

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title={task.title}
      icon="check"
      size="md"
      footer={footer}
    >
      <div className={styles.body}>

        {/* ── duration stamp ── */}
        {durationLabel && (
          <div className={styles.durationRow}>
            <span className={styles.durationIcon}>⏱</span>
            <Text variant="bodySmall" color="secondary">
              Час виконання:&nbsp;<strong>{durationLabel}</strong>
            </Text>
          </div>
        )}

        {/* ── note ── */}
        <div className={styles.field}>
          <label className={styles.label}>
            Примітка <span className={styles.optional}>(необов'язково)</span>
          </label>
          <textarea
            className={styles.textarea}
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Наприклад: «Протерла вікна, все чисто»"
            rows={3}
            maxLength={500}
          />
        </div>

        {/* ── photo ── */}
        <div className={styles.field}>
          <label className={styles.label}>
            Фото виконання <span className={styles.optional}>(необов'язково)</span>
          </label>

          {preview ? (
            <div className={styles.photoPreview}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview} alt="Фото виконання" className={styles.previewImg} />
              <button className={styles.removePhoto} onClick={removePhoto} aria-label="Видалити фото">
                ✕
              </button>
            </div>
          ) : (
            <button
              className={styles.photoBtn}
              onClick={() => fileRef.current?.click()}
              type="button"
            >
              <span className={styles.photoBtnIcon}>📷</span>
              <span>Додати фото</span>
            </button>
          )}

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            className={styles.hiddenInput}
            onChange={handlePhoto}
          />
        </div>

        {/* offline notice */}
        {typeof navigator !== 'undefined' && !navigator.onLine && (
          <div className={styles.offlineNotice}>
            📵 Офлайн — завдання збережеться локально і синхронізується при підключенні
          </div>
        )}
      </div>
    </Modal>
  );
}

export default TaskCompleteModal;
