'use client';

/**
 * CoffeePOS - WriteoffsPanel Component
 *
 * Write-off management panel: track expired, damaged, and other ingredient losses.
 * Used as a tab within the Products admin page.
 */

import { useState, useMemo, useCallback } from 'react';
import { Text, Icon, Badge, Button, Input } from '@/components/atoms';
import { Modal } from '@/components/atoms';
import { SearchInput } from '@/components/molecules';
import { DataTable, type Column } from '@/components/organisms';
import { useWriteoffs, useCreateWriteoff, useIngredients } from '@/lib/hooks';
import type { WriteOff, WriteOffType, WriteOffItem, WriteOffCreateData, Ingredient } from '@/lib/api';
import styles from './WriteoffsPanel.module.css';

// ============================================
// CONSTANTS
// ============================================

const TYPE_LABELS: Record<WriteOffType, string> = {
  expired: 'Прострочений',
  damaged: 'Пошкоджений',
  other: 'Інше',
};

const TYPE_VARIANTS: Record<WriteOffType, 'default' | 'warning' | 'error'> = {
  expired: 'warning',
  damaged: 'error',
  other: 'default',
};

// ============================================
// CREATE WRITE-OFF MODAL
// ============================================

interface CreateWriteOffModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: WriteOffCreateData) => void;
  isSubmitting: boolean;
  ingredients: Ingredient[];
}

function CreateWriteOffModal({ isOpen, onClose, onSubmit, isSubmitting, ingredients }: CreateWriteOffModalProps) {
  const [type, setType] = useState<WriteOffType>('expired');
  const [reason, setReason] = useState('');
  const [performedBy, setPerformedBy] = useState('');
  const [items, setItems] = useState<WriteOffItem[]>([]);
  const [selectedIngredientId, setSelectedIngredientId] = useState('');
  const [itemQuantity, setItemQuantity] = useState('');

  const handleAddItem = () => {
    const ingredient = ingredients.find((i) => String(i.id) === selectedIngredientId);
    if (!ingredient || !itemQuantity) return;

    const qty = parseFloat(itemQuantity);

    setItems([...items, {
      ingredientId: ingredient.id,
      ingredientName: ingredient.name,
      quantity: qty,
      unitCost: ingredient.costPerUnit,
      totalCost: qty * ingredient.costPerUnit,
    }]);

    setSelectedIngredientId('');
    setItemQuantity('');
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const totalCost = items.reduce((sum, item) => sum + item.totalCost, 0);

  const handleSubmit = () => {
    if (!performedBy.trim() || items.length === 0) return;
    onSubmit({
      type,
      items,
      totalCost,
      reason: reason || undefined,
      performedBy: performedBy.trim(),
    });
    setType('expired');
    setReason('');
    setPerformedBy('');
    setItems([]);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Нове списання" icon="delete" size="lg">
      <div className={styles.modalContent}>
        <div className={styles.field}>
          <Text variant="labelMedium" weight="medium">Тип списання</Text>
          <div className={styles.typeButtons}>
            {(Object.entries(TYPE_LABELS) as [WriteOffType, string][]).map(([key, label]) => (
              <button
                key={key}
                className={`${styles.typeButton} ${type === key ? styles.activeType : ''}`}
                onClick={() => setType(key)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.field}>
          <Input
            label="Хто списує"
            type="text"
            fullWidth
            placeholder="Введіть ім'я..."
            value={performedBy}
            onChange={(e) => setPerformedBy(e.target.value)}
          />
        </div>

        <div className={styles.field}>
          <Text variant="labelMedium" weight="medium">Додати позицію</Text>
          <div className={styles.addItemRow}>
            <select
              className={styles.selectInput}
              value={selectedIngredientId}
              onChange={(e) => setSelectedIngredientId(e.target.value)}
            >
              <option value="">Оберіть інгредієнт...</option>
              {ingredients.map((ing) => (
                <option key={ing.id} value={ing.id}>
                  {ing.name} ({ing.unit}) — ₴{ing.costPerUnit.toFixed(2)}/{ing.unit}
                </option>
              ))}
            </select>
            <Input
              type="number"
              size="sm"
              className={styles.inputSmall}
              placeholder="К-сть"
              value={itemQuantity}
              onChange={(e) => setItemQuantity(e.target.value)}
              min="0"
              step="0.01"
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={handleAddItem}
              disabled={!selectedIngredientId || !itemQuantity}
            >
              <Icon name="plus" size="sm" />
            </Button>
          </div>
        </div>

        {items.length > 0 && (
          <div className={styles.itemsList}>
            <Text variant="labelMedium" weight="medium">Позиції ({items.length})</Text>
            {items.map((item, idx) => (
              <div key={idx} className={styles.itemRow}>
                <Text variant="bodySmall">{item.ingredientName}</Text>
                <Text variant="bodySmall" color="secondary">{item.quantity} x ₴{item.unitCost.toFixed(2)}</Text>
                <Text variant="labelSmall" weight="semibold" color="error">-₴{item.totalCost.toFixed(2)}</Text>
                <button className={styles.removeBtn} onClick={() => handleRemoveItem(idx)}>
                  <Icon name="close" size="xs" />
                </button>
              </div>
            ))}
            <div className={styles.totalRow}>
              <Text variant="labelMedium" weight="semibold">Загалом</Text>
              <Text variant="labelMedium" weight="bold" color="error">-₴{totalCost.toFixed(2)}</Text>
            </div>
          </div>
        )}

        <div className={styles.field}>
          <Text variant="labelMedium" weight="medium">Причина (необов'язково)</Text>
          <textarea
            className={styles.textarea}
            placeholder="Опишіть причину списання..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={2}
          />
        </div>

        <Button
          variant="primary"
          size="lg"
          onClick={handleSubmit}
          disabled={!performedBy.trim() || items.length === 0 || isSubmitting}
        >
          {isSubmitting ? 'Списання...' : 'Списати'}
        </Button>
      </div>
    </Modal>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export function WriteoffsPanel() {
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const writeoffParams = typeFilter !== 'all' ? { type: typeFilter as WriteOffType } : {};
  const { data: writeoffs, isLoading } = useWriteoffs(writeoffParams);
  const { data: apiIngredients } = useIngredients({ pageSize: 200 });
  const createMutation = useCreateWriteoff();

  const ingredientsList = apiIngredients || [];

  const filteredWriteoffs = useMemo(() => {
    if (!writeoffs) return [];
    if (!search.trim()) return writeoffs;
    const query = search.toLowerCase();
    return writeoffs.filter((w) =>
      w.performedBy?.toLowerCase().includes(query) ||
      w.reason?.toLowerCase().includes(query)
    );
  }, [writeoffs, search]);

  const columns: Column<WriteOff>[] = useMemo(() => [
    {
      key: 'date',
      header: 'Дата',
      render: (writeoff) => (
        <div className={styles.itemName}>
          <Text variant="bodyMedium" weight="medium">
            {new Date(writeoff.createdAt).toLocaleDateString('uk-UA')}
          </Text>
          <Text variant="caption" color="tertiary">
            {new Date(writeoff.createdAt).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Тип',
      render: (writeoff) => (
        <Badge variant={TYPE_VARIANTS[writeoff.type]} size="sm">
          {TYPE_LABELS[writeoff.type]}
        </Badge>
      ),
    },
    {
      key: 'items',
      header: 'Позицій',
      hideOnMobile: true,
      render: (writeoff) => (
        <Text variant="bodySmall" color="secondary">{writeoff.items?.length || 0}</Text>
      ),
    },
    {
      key: 'totalCost',
      header: 'Сума',
      align: 'right',
      render: (writeoff) => (
        <Text variant="labelMedium" weight="semibold" color="error">
          -₴{(writeoff.totalCost || 0).toFixed(2)}
        </Text>
      ),
    },
    {
      key: 'performedBy',
      header: 'Виконав',
      hideOnMobile: true,
      render: (writeoff) => (
        <Text variant="bodySmall" color="secondary">{writeoff.performedBy || '—'}</Text>
      ),
    },
  ], []);

  const handleCreateWriteoff = useCallback((data: WriteOffCreateData) => {
    createMutation.mutate(data, {
      onSuccess: () => setCreateModalOpen(false),
    });
  }, [createMutation]);

  return (
    <div className={styles.panel}>
      <div className={styles.toolbar}>
        <select
          className={styles.filterSelect}
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        >
          <option value="all">Всі</option>
          <option value="expired">Прострочені</option>
          <option value="damaged">Пошкоджені</option>
          <option value="other">Інше</option>
        </select>
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Пошук..."
          variant="glass"
        />
        <Button variant="primary" size="sm" onClick={() => setCreateModalOpen(true)}>
          <Icon name="plus" size="sm" />
          Списати
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={filteredWriteoffs}
        getRowKey={(writeoff) => String(writeoff.id)}
        loading={isLoading}
        emptyState={{
          icon: 'delete',
          title: 'Списань не знайдено',
          description: typeFilter !== 'all' ? 'Спробуйте змінити фільтр' : undefined,
        }}
      />

      <CreateWriteOffModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSubmit={handleCreateWriteoff}
        isSubmitting={createMutation.isPending}
        ingredients={ingredientsList}
      />
    </div>
  );
}

export default WriteoffsPanel;
