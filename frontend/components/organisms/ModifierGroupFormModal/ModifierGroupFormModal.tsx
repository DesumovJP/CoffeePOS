'use client';

/**
 * CoffeePOS - ModifierGroupFormModal Component
 *
 * Create/edit modifier groups with inline modifier list
 */

import { useState, useEffect, useCallback } from 'react';
import { Text, Button, Icon, Input } from '@/components/atoms';
import { Modal } from '@/components/atoms/Modal';
import { modifierGroupsApi, modifiersApi } from '@/lib/api';
import type { ModifierGroup } from '@/lib/api/types';
import styles from './ModifierGroupFormModal.module.css';

// ============================================
// TYPES
// ============================================

interface ModifierRow {
  id: string;
  existingDocumentId?: string; // Strapi documentId if editing existing
  name: string;
  price: number;
  isDefault: boolean;
}

export interface ModifierGroupFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  group?: ModifierGroup | null;
  onSuccess: () => void;
}

// ============================================
// HELPERS
// ============================================

let modRowCounter = 0;
function generateModRowId(): string {
  modRowCounter += 1;
  return `mod-${Date.now()}-${modRowCounter}`;
}

// ============================================
// COMPONENT
// ============================================

export function ModifierGroupFormModal({
  isOpen,
  onClose,
  group,
  onSuccess,
}: ModifierGroupFormModalProps) {
  const isEditing = !!group;

  // Form state
  const [name, setName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [type, setType] = useState<'single' | 'multiple'>('single');
  const [isRequired, setIsRequired] = useState(false);
  const [minSelections, setMinSelections] = useState<string>('0');
  const [maxSelections, setMaxSelections] = useState<string>('1');
  const [isActive, setIsActive] = useState(true);
  const [modifierRows, setModifierRows] = useState<ModifierRow[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      if (group) {
        setName(group.name || '');
        setDisplayName(group.displayName || '');
        setType(group.type || 'single');
        setIsRequired(group.isRequired || false);
        setMinSelections(String(group.minSelections ?? 0));
        setMaxSelections(String(group.maxSelections ?? 1));
        setIsActive(group.isActive ?? true);
        setModifierRows(
          (group.modifiers || []).map((mod) => ({
            id: generateModRowId(),
            existingDocumentId: mod.documentId,
            name: mod.name,
            price: mod.price,
            isDefault: mod.isDefault,
          }))
        );
      } else {
        setName('');
        setDisplayName('');
        setType('single');
        setIsRequired(false);
        setMinSelections('0');
        setMaxSelections('1');
        setIsActive(true);
        setModifierRows([]);
      }
      setError(null);
      setSubmitting(false);
    }
  }, [isOpen, group]);

  // Modifier row management
  const addModifierRow = useCallback(() => {
    setModifierRows((prev) => [
      ...prev,
      { id: generateModRowId(), name: '', price: 0, isDefault: false },
    ]);
  }, []);

  const removeModifierRow = useCallback((rowId: string) => {
    setModifierRows((prev) => prev.filter((r) => r.id !== rowId));
  }, []);

  const updateModifierRow = useCallback(
    (rowId: string, field: keyof Omit<ModifierRow, 'id' | 'existingDocumentId'>, value: string | number | boolean) => {
      setModifierRows((prev) =>
        prev.map((r) => (r.id === rowId ? { ...r, [field]: value } : r))
      );
    },
    []
  );

  // Submit handler
  const handleSubmit = async () => {
    setError(null);

    if (!name.trim()) {
      setError('Вкажіть назву групи');
      return;
    }

    setSubmitting(true);

    try {
      const groupPayload = {
        name: name.trim(),
        displayName: displayName.trim() || undefined,
        type,
        isRequired,
        minSelections: parseInt(minSelections) || 0,
        maxSelections: parseInt(maxSelections) || undefined,
        isActive,
      };

      let groupId: number;

      if (isEditing && group) {
        await modifierGroupsApi.update(group.documentId, groupPayload);
        groupId = group.id;
      } else {
        const result = await modifierGroupsApi.create(groupPayload);
        groupId = result.data.id;
      }

      // Handle modifiers: create new, update existing, delete removed
      const validModifiers = modifierRows.filter((r) => r.name.trim());

      // If editing, delete modifiers that were removed
      if (isEditing && group?.modifiers) {
        const remainingDocIds = new Set(
          validModifiers.filter((r) => r.existingDocumentId).map((r) => r.existingDocumentId)
        );
        for (const existingMod of group.modifiers) {
          if (!remainingDocIds.has(existingMod.documentId)) {
            await modifiersApi.delete(existingMod.documentId);
          }
        }
      }

      // Create or update modifiers
      for (let i = 0; i < validModifiers.length; i++) {
        const row = validModifiers[i];
        const modPayload = {
          name: row.name.trim(),
          price: row.price || 0,
          isDefault: row.isDefault,
          sortOrder: i,
          isActive: true,
          modifierGroup: groupId,
        };

        if (row.existingDocumentId) {
          await modifiersApi.update(row.existingDocumentId, modPayload);
        } else {
          await modifiersApi.create(modPayload);
        }
      }

      onSuccess();
      onClose();
    } catch (err: unknown) {
      const apiErr = err as { message?: string };
      setError(apiErr.message || 'Помилка збереження');
    } finally {
      setSubmitting(false);
    }
  };

  const footer = (
    <Button
      variant="primary"
      size="lg"
      onClick={handleSubmit}
      loading={submitting}
      fullWidth
    >
      <Icon name="check" size="md" />
      {isEditing ? 'Зберегти' : 'Створити'}
    </Button>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Редагувати групу модифікаторів' : 'Нова група модифікаторів'}
      subtitle="Налаштуйте опції для продуктів"
      icon="settings"
      size="lg"
      footer={footer}
    >
      <div className={styles.form}>
        {error && (
          <div className={styles.errorBanner}>
            <Icon name="warning" size="sm" color="error" />
            <Text variant="bodySmall" color="error">{error}</Text>
          </div>
        )}

        {/* Name fields */}
        <div className={styles.row}>
          <Input
            label="Назва (системна)"
            placeholder="milk_type"
            value={name}
            onChange={(e) => setName(e.target.value)}
            fullWidth
          />
          <Input
            label="Відображувана назва"
            placeholder="Тип молока"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            fullWidth
          />
        </div>

        {/* Type and required */}
        <div className={styles.row}>
          <div className={styles.field}>
            <label className={styles.label}>Тип вибору</label>
            <select
              className={styles.select}
              value={type}
              onChange={(e) => setType(e.target.value as 'single' | 'multiple')}
            >
              <option value="single">Один (single)</option>
              <option value="multiple">Декілька (multiple)</option>
            </select>
          </div>
          <div className={styles.field}>
            <label className={styles.label}>&nbsp;</label>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={isRequired}
                onChange={(e) => setIsRequired(e.target.checked)}
                className={styles.checkbox}
              />
              <Text variant="bodyMedium">Обов&apos;язковий</Text>
            </label>
          </div>
          <div className={styles.field}>
            <label className={styles.label}>&nbsp;</label>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className={styles.checkbox}
              />
              <Text variant="bodyMedium">Активний</Text>
            </label>
          </div>
        </div>

        {/* Selection limits */}
        <div className={styles.row}>
          <Input
            label="Мін. вибір"
            type="number"
            placeholder="0"
            value={minSelections}
            onChange={(e) => setMinSelections(e.target.value)}
            min={0}
            fullWidth
          />
          <Input
            label="Макс. вибір"
            type="number"
            placeholder="1"
            value={maxSelections}
            onChange={(e) => setMaxSelections(e.target.value)}
            min={0}
            fullWidth
          />
        </div>

        {/* Modifiers section */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <Text variant="h5" weight="semibold">Модифікатори</Text>
            <Text variant="caption" color="tertiary">
              {modifierRows.length} {modifierRows.length === 1 ? 'модифікатор' : 'модифікаторів'}
            </Text>
          </div>

          <div className={styles.modifierList}>
            {/* Column headers */}
            {modifierRows.length > 0 && (
              <div className={styles.modifierHeader}>
                <Text variant="caption" color="tertiary" className={styles.modNameHeader}>Назва</Text>
                <Text variant="caption" color="tertiary" className={styles.modPriceHeader}>Ціна (₴)</Text>
                <Text variant="caption" color="tertiary" className={styles.modDefaultHeader}>За замовч.</Text>
                <span className={styles.modRemoveHeader} />
              </div>
            )}

            {modifierRows.map((row) => (
              <div key={row.id} className={styles.modifierRow}>
                <Input
                  placeholder="Назва модифікатора"
                  value={row.name}
                  onChange={(e) => updateModifierRow(row.id, 'name', e.target.value)}
                  size="sm"
                  fullWidth
                />
                <Input
                  type="number"
                  placeholder="0"
                  value={row.price || ''}
                  onChange={(e) =>
                    updateModifierRow(row.id, 'price', parseFloat(e.target.value) || 0)
                  }
                  min={0}
                  step={0.5}
                  size="sm"
                  className={styles.modPriceInput}
                />
                <label className={styles.modDefaultCheck}>
                  <input
                    type="checkbox"
                    checked={row.isDefault}
                    onChange={(e) => updateModifierRow(row.id, 'isDefault', e.target.checked)}
                    className={styles.checkbox}
                  />
                </label>
                <Button
                  variant="danger"
                  size="xs"
                  iconOnly
                  onClick={() => removeModifierRow(row.id)}
                  className={styles.removeButton}
                >
                  <Icon name="close" size="xs" />
                </Button>
              </div>
            ))}

            <button
              type="button"
              className={styles.addButton}
              onClick={addModifierRow}
            >
              <Icon name="plus" size="sm" color="accent" />
              <Text variant="labelMedium" color="accent">Додати модифікатор</Text>
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
