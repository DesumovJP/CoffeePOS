'use client';

/**
 * CoffeePOS - SuppliesPanel Component
 *
 * Supply management panel: create, track, and receive ingredient deliveries.
 * Used as a tab within the Products admin page.
 */

import { useState, useMemo, useCallback } from 'react';
import { Text, Icon, Badge, Button, Input } from '@/components/atoms';
import { Modal } from '@/components/atoms';
import { SearchInput } from '@/components/molecules';
import { DataTable, type Column } from '@/components/organisms';
import { useSupplies, useCreateSupply, useReceiveSupply, useCancelSupply, useIngredients } from '@/lib/hooks';
import type { Supply, SupplyStatus, SupplyItem, SupplyCreateData, Ingredient } from '@/lib/api';
import styles from './SuppliesPanel.module.css';

// ============================================
// CONSTANTS
// ============================================

const STATUS_LABELS: Record<SupplyStatus, string> = {
  draft: 'Чернетка',
  ordered: 'Замовлено',
  shipped: 'В дорозі',
  received: 'Отримано',
  cancelled: 'Скасовано',
};

const STATUS_VARIANTS: Record<SupplyStatus, 'default' | 'info' | 'warning' | 'success' | 'error'> = {
  draft: 'default',
  ordered: 'info',
  shipped: 'warning',
  received: 'success',
  cancelled: 'error',
};

// ============================================
// CREATE SUPPLY MODAL
// ============================================

interface CreateSupplyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: SupplyCreateData) => void;
  isSubmitting: boolean;
  ingredients: Ingredient[];
}

function CreateSupplyModal({ isOpen, onClose, onSubmit, isSubmitting, ingredients }: CreateSupplyModalProps) {
  const [supplierName, setSupplierName] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<SupplyItem[]>([]);
  const [selectedIngredientId, setSelectedIngredientId] = useState('');
  const [itemQuantity, setItemQuantity] = useState('');
  const [itemUnitCost, setItemUnitCost] = useState('');

  const handleAddItem = () => {
    const ingredient = ingredients.find((i) => String(i.id) === selectedIngredientId);
    if (!ingredient || !itemQuantity || !itemUnitCost) return;

    const qty = parseFloat(itemQuantity);
    const cost = parseFloat(itemUnitCost);

    setItems([...items, {
      ingredientId: ingredient.id,
      ingredientName: ingredient.name,
      quantity: qty,
      unitCost: cost,
      totalCost: qty * cost,
    }]);

    setSelectedIngredientId('');
    setItemQuantity('');
    setItemUnitCost('');
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const totalCost = items.reduce((sum, item) => sum + item.totalCost, 0);

  const handleSubmit = () => {
    if (!supplierName.trim() || items.length === 0) return;
    onSubmit({
      supplierName: supplierName.trim(),
      items,
      totalCost,
      notes: notes || undefined,
    });
    setSupplierName('');
    setNotes('');
    setItems([]);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Нова поставка" icon="truck" size="lg">
      <div className={styles.modalContent}>
        <div className={styles.field}>
          <Input
            label="Постачальник"
            type="text"
            fullWidth
            placeholder="Назва постачальника..."
            value={supplierName}
            onChange={(e) => setSupplierName(e.target.value)}
          />
        </div>

        <div className={styles.field}>
          <Text variant="labelMedium" weight="medium">Додати інгредієнт</Text>
          <div className={styles.addItemRow}>
            <select
              className={styles.selectInput}
              value={selectedIngredientId}
              onChange={(e) => setSelectedIngredientId(e.target.value)}
            >
              <option value="">Оберіть інгредієнт...</option>
              {ingredients.map((ing) => (
                <option key={ing.id} value={ing.id}>{ing.name} ({ing.unit})</option>
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
            <Input
              type="number"
              size="sm"
              className={styles.inputSmall}
              placeholder="Ціна/од."
              value={itemUnitCost}
              onChange={(e) => setItemUnitCost(e.target.value)}
              min="0"
              step="0.01"
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={handleAddItem}
              disabled={!selectedIngredientId || !itemQuantity || !itemUnitCost}
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
                <Text variant="labelSmall" weight="semibold">₴{item.totalCost.toFixed(2)}</Text>
                <button className={styles.removeBtn} onClick={() => handleRemoveItem(idx)}>
                  <Icon name="close" size="xs" />
                </button>
              </div>
            ))}
            <div className={styles.totalRow}>
              <Text variant="labelMedium" weight="semibold">Загалом</Text>
              <Text variant="labelMedium" weight="bold">₴{totalCost.toFixed(2)}</Text>
            </div>
          </div>
        )}

        <div className={styles.field}>
          <Text variant="labelMedium" weight="medium">Примітки (необов'язково)</Text>
          <textarea
            className={styles.textarea}
            placeholder="Примітки до поставки..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
          />
        </div>

        <Button
          variant="primary"
          size="lg"
          onClick={handleSubmit}
          disabled={!supplierName.trim() || items.length === 0 || isSubmitting}
        >
          {isSubmitting ? 'Створення...' : 'Створити поставку'}
        </Button>
      </div>
    </Modal>
  );
}

// ============================================
// RECEIVE SUPPLY MODAL
// ============================================

interface ReceiveSupplyModalProps {
  isOpen: boolean;
  onClose: () => void;
  supply: Supply | null;
  onReceive: (id: string, receivedBy: string) => void;
  isReceiving: boolean;
}

function ReceiveSupplyModal({ isOpen, onClose, supply, onReceive, isReceiving }: ReceiveSupplyModalProps) {
  const [receivedBy, setReceivedBy] = useState('');

  if (!supply) return null;

  const handleReceive = () => {
    if (!receivedBy.trim()) return;
    onReceive(supply.documentId, receivedBy.trim());
    setReceivedBy('');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Прийняти поставку" icon="check" size="md">
      <div className={styles.modalContent}>
        <div className={styles.receiveSummary}>
          <div className={styles.receiveRow}>
            <Text variant="bodySmall" color="secondary">Постачальник</Text>
            <Text variant="labelMedium" weight="semibold">{supply.supplierName}</Text>
          </div>
          <div className={styles.receiveRow}>
            <Text variant="bodySmall" color="secondary">Позицій</Text>
            <Text variant="labelMedium" weight="semibold">{supply.items?.length || 0}</Text>
          </div>
          <div className={styles.receiveRow}>
            <Text variant="bodySmall" color="secondary">Сума</Text>
            <Text variant="labelMedium" weight="bold">₴{(supply.totalCost || 0).toFixed(2)}</Text>
          </div>
        </div>

        {supply.items && supply.items.length > 0 && (
          <div className={styles.itemsList}>
            <Text variant="labelSmall" weight="medium" color="secondary">Позиції</Text>
            {supply.items.map((item, idx) => (
              <div key={idx} className={styles.itemRow}>
                <Text variant="bodySmall">{item.ingredientName || item.name || '—'}</Text>
                <Text variant="bodySmall" color="secondary">{item.quantity}</Text>
                <Text variant="labelSmall" weight="semibold">₴{item.totalCost.toFixed(2)}</Text>
              </div>
            ))}
          </div>
        )}

        <div className={styles.field}>
          <Input
            label="Хто приймає"
            type="text"
            fullWidth
            placeholder="Введіть ім'я..."
            value={receivedBy}
            onChange={(e) => setReceivedBy(e.target.value)}
          />
        </div>

        <Button
          variant="primary"
          size="lg"
          onClick={handleReceive}
          disabled={!receivedBy.trim() || isReceiving}
        >
          {isReceiving ? 'Прийняття...' : 'Прийняти поставку'}
        </Button>
      </div>
    </Modal>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export function SuppliesPanel() {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [receiveModalOpen, setReceiveModalOpen] = useState(false);
  const [selectedSupply, setSelectedSupply] = useState<Supply | null>(null);

  const supplyParams = statusFilter !== 'all' ? { status: statusFilter as SupplyStatus } : {};
  const { data: supplies, isLoading } = useSupplies(supplyParams);
  const { data: apiIngredients } = useIngredients({ pageSize: 200 });
  const createMutation = useCreateSupply();
  const receiveMutation = useReceiveSupply();
  const cancelMutation = useCancelSupply();

  const ingredientsList = apiIngredients || [];

  const filteredSupplies = useMemo(() => {
    if (!supplies) return [];
    if (!search.trim()) return supplies;
    const query = search.toLowerCase();
    return supplies.filter((s) =>
      s.supplierName.toLowerCase().includes(query)
    );
  }, [supplies, search]);

  const columns: Column<Supply>[] = useMemo(() => [
    {
      key: 'supplier',
      header: 'Постачальник',
      render: (supply) => (
        <div className={styles.itemName}>
          <Text variant="bodyMedium" weight="medium">{supply.supplierName}</Text>
          <Text variant="caption" color="tertiary">
            {new Date(supply.createdAt).toLocaleDateString('uk-UA')}
          </Text>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Статус',
      render: (supply) => (
        <Badge variant={STATUS_VARIANTS[supply.status]} size="sm">
          {STATUS_LABELS[supply.status]}
        </Badge>
      ),
    },
    {
      key: 'items',
      header: 'Позицій',
      hideOnMobile: true,
      render: (supply) => (
        <Text variant="bodySmall" color="secondary">{supply.items?.length || 0}</Text>
      ),
    },
    {
      key: 'totalCost',
      header: 'Сума',
      align: 'right',
      render: (supply) => (
        <Text variant="labelMedium" weight="semibold">₴{(supply.totalCost || 0).toFixed(2)}</Text>
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (supply) => (
        <div className={styles.actions}>
          {(supply.status === 'ordered' || supply.status === 'shipped') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedSupply(supply);
                setReceiveModalOpen(true);
              }}
            >
              <Icon name="check" size="sm" />
            </Button>
          )}
          {supply.status === 'draft' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                cancelMutation.mutate(supply.documentId);
              }}
            >
              <Icon name="close" size="sm" />
            </Button>
          )}
        </div>
      ),
    },
  ], [cancelMutation]);

  const handleCreateSupply = useCallback((data: SupplyCreateData) => {
    createMutation.mutate(data, {
      onSuccess: () => setCreateModalOpen(false),
    });
  }, [createMutation]);

  const handleReceiveSupply = useCallback((id: string, receivedBy: string) => {
    receiveMutation.mutate({ id, receivedBy }, {
      onSuccess: () => {
        setReceiveModalOpen(false);
        setSelectedSupply(null);
      },
    });
  }, [receiveMutation]);

  return (
    <div className={styles.panel}>
      <div className={styles.toolbar}>
        <select
          className={styles.filterSelect}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">Всі</option>
          <option value="draft">Чернетки</option>
          <option value="ordered">Замовлені</option>
          <option value="shipped">В дорозі</option>
          <option value="received">Отримані</option>
          <option value="cancelled">Скасовані</option>
        </select>
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Пошук постачальника..."
          variant="glass"
        />
        <Button variant="primary" size="sm" onClick={() => setCreateModalOpen(true)}>
          <Icon name="plus" size="sm" />
          Нова поставка
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={filteredSupplies}
        getRowKey={(supply) => String(supply.id)}
        loading={isLoading}
        emptyState={{
          icon: 'truck',
          title: 'Поставок не знайдено',
          description: statusFilter !== 'all' ? 'Спробуйте змінити фільтр' : undefined,
        }}
      />

      <CreateSupplyModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSubmit={handleCreateSupply}
        isSubmitting={createMutation.isPending}
        ingredients={ingredientsList}
      />

      <ReceiveSupplyModal
        isOpen={receiveModalOpen}
        onClose={() => {
          setReceiveModalOpen(false);
          setSelectedSupply(null);
        }}
        supply={selectedSupply}
        onReceive={handleReceiveSupply}
        isReceiving={receiveMutation.isPending}
      />
    </div>
  );
}

export default SuppliesPanel;
