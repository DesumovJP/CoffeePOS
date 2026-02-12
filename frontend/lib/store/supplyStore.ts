/**
 * ParadisePOS - Supply Store
 *
 * Manages supply orders and deliveries
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useInventoryStore } from './inventoryStore';
import { useNotificationStore } from './notificationStore';

// ============================================
// TYPES
// ============================================

export type SupplyStatus = 'draft' | 'ordered' | 'shipped' | 'received' | 'cancelled';

export interface SupplyItem {
  id: string;
  ingredientId: number;
  ingredientName: string;
  unit: string;
  orderedQuantity: number;
  receivedQuantity?: number;
  unitCost: number;
  totalCost: number;
}

export interface Supply {
  id: string;
  supplierName: string;
  status: SupplyStatus;
  items: SupplyItem[];
  subtotal: number;
  totalCost: number;
  notes?: string;
  createdAt: string;
  orderedAt?: string;
  expectedAt?: string;
  receivedAt?: string;
  createdBy?: string;
  receivedBy?: string;
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  categories: string[];
  isActive: boolean;
}

export interface SupplyState {
  supplies: Supply[];
  suppliers: Supplier[];

  // Supply Actions
  createSupply: (supplierName: string, items: Omit<SupplyItem, 'id'>[]) => string;
  updateSupply: (id: string, updates: Partial<Supply>) => void;
  addItemToSupply: (supplyId: string, item: Omit<SupplyItem, 'id'>) => void;
  removeItemFromSupply: (supplyId: string, itemId: string) => void;
  updateSupplyItem: (supplyId: string, itemId: string, updates: Partial<SupplyItem>) => void;

  // Status transitions
  submitOrder: (id: string) => void;
  markAsShipped: (id: string, expectedAt?: string) => void;
  receiveSupply: (id: string, receivedItems: Array<{ itemId: string; quantity: number }>, receivedBy?: string) => void;
  cancelSupply: (id: string, reason?: string) => void;

  // Supplier Actions
  addSupplier: (supplier: Omit<Supplier, 'id'>) => string;
  updateSupplier: (id: string, updates: Partial<Supplier>) => void;
  deleteSupplier: (id: string) => void;

  // Queries
  getSupplyById: (id: string) => Supply | undefined;
  getSuppliesByStatus: (status: SupplyStatus) => Supply[];
  getSuppliesBySupplier: (supplierName: string) => Supply[];
  getPendingSupplies: () => Supply[];
}

// ============================================
// HELPERS
// ============================================

function generateId(): string {
  return `supply-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
}

function calculateTotals(items: SupplyItem[]): { subtotal: number; totalCost: number } {
  const subtotal = items.reduce((sum, item) => sum + item.totalCost, 0);
  return { subtotal, totalCost: subtotal };
}

// Default suppliers
const defaultSuppliers: Supplier[] = [
  { id: 'sup-1', name: 'Молочар', contactPerson: 'Іван Петренко', phone: '+380501234567', categories: ['dairy'], isActive: true },
  { id: 'sup-2', name: 'CoffeePro', contactPerson: 'Олена Коваль', phone: '+380671234567', email: 'orders@coffeepro.ua', categories: ['coffee'], isActive: true },
  { id: 'sup-3', name: 'TeaTime', contactPerson: 'Марія Шевченко', phone: '+380931234567', categories: ['tea'], isActive: true },
  { id: 'sup-4', name: 'Monin', email: 'ukraine@monin.com', categories: ['syrups'], isActive: true },
  { id: 'sup-5', name: 'Callebaut', email: 'orders@callebaut.ua', categories: ['toppings'], isActive: true },
  { id: 'sup-6', name: 'Пакувальник', contactPerson: 'Сергій Бондар', phone: '+380661234567', categories: ['packaging'], isActive: true },
  { id: 'sup-7', name: 'Пекарня "Смак"', contactPerson: 'Наталія Мельник', phone: '+380991234567', categories: ['bakery'], isActive: true },
];

// ============================================
// STORE
// ============================================

export const useSupplyStore = create<SupplyState>()(
  persist(
    (set, get) => ({
      supplies: [],
      suppliers: defaultSuppliers,

      // ========== SUPPLY ACTIONS ==========

      createSupply: (supplierName, items) => {
        const id = generateId();
        const supplyItems = items.map((item, index) => ({
          ...item,
          id: `${id}-item-${index}`,
        }));
        const { subtotal, totalCost } = calculateTotals(supplyItems);

        const supply: Supply = {
          id,
          supplierName,
          status: 'draft',
          items: supplyItems,
          subtotal,
          totalCost,
          createdAt: new Date().toISOString(),
        };

        set((state) => ({
          supplies: [supply, ...state.supplies],
        }));

        return id;
      },

      updateSupply: (id, updates) => {
        set((state) => ({
          supplies: state.supplies.map((s) =>
            s.id === id ? { ...s, ...updates } : s
          ),
        }));
      },

      addItemToSupply: (supplyId, item) => {
        set((state) => ({
          supplies: state.supplies.map((s) => {
            if (s.id !== supplyId || s.status !== 'draft') return s;

            const newItem = { ...item, id: `${supplyId}-item-${s.items.length}` };
            const newItems = [...s.items, newItem];
            const { subtotal, totalCost } = calculateTotals(newItems);

            return { ...s, items: newItems, subtotal, totalCost };
          }),
        }));
      },

      removeItemFromSupply: (supplyId, itemId) => {
        set((state) => ({
          supplies: state.supplies.map((s) => {
            if (s.id !== supplyId || s.status !== 'draft') return s;

            const newItems = s.items.filter((i) => i.id !== itemId);
            const { subtotal, totalCost } = calculateTotals(newItems);

            return { ...s, items: newItems, subtotal, totalCost };
          }),
        }));
      },

      updateSupplyItem: (supplyId, itemId, updates) => {
        set((state) => ({
          supplies: state.supplies.map((s) => {
            if (s.id !== supplyId) return s;

            const newItems = s.items.map((i) => {
              if (i.id !== itemId) return i;
              const updated = { ...i, ...updates };
              updated.totalCost = updated.orderedQuantity * updated.unitCost;
              return updated;
            });
            const { subtotal, totalCost } = calculateTotals(newItems);

            return { ...s, items: newItems, subtotal, totalCost };
          }),
        }));
      },

      // ========== STATUS TRANSITIONS ==========

      submitOrder: (id) => {
        const supply = get().supplies.find((s) => s.id === id);
        if (!supply || supply.status !== 'draft') return;

        set((state) => ({
          supplies: state.supplies.map((s) =>
            s.id === id
              ? { ...s, status: 'ordered' as SupplyStatus, orderedAt: new Date().toISOString() }
              : s
          ),
        }));

        // Notify
        useNotificationStore.getState().notifySupplyOrdered(supply.supplierName);
      },

      markAsShipped: (id, expectedAt) => {
        set((state) => ({
          supplies: state.supplies.map((s) =>
            s.id === id && s.status === 'ordered'
              ? { ...s, status: 'shipped' as SupplyStatus, expectedAt }
              : s
          ),
        }));
      },

      receiveSupply: (id, receivedItems, receivedBy) => {
        const supply = get().supplies.find((s) => s.id === id);
        if (!supply || !['ordered', 'shipped'].includes(supply.status)) return;

        const inventoryStore = useInventoryStore.getState();
        const notificationStore = useNotificationStore.getState();

        // Update supply with received quantities
        const updatedItems = supply.items.map((item) => {
          const received = receivedItems.find((r) => r.itemId === item.id);
          return {
            ...item,
            receivedQuantity: received?.quantity ?? item.orderedQuantity,
          };
        });

        set((state) => ({
          supplies: state.supplies.map((s) =>
            s.id === id
              ? {
                  ...s,
                  status: 'received' as SupplyStatus,
                  items: updatedItems,
                  receivedAt: new Date().toISOString(),
                  receivedBy,
                }
              : s
          ),
        }));

        // Add to inventory
        for (const item of updatedItems) {
          const quantity = item.receivedQuantity ?? item.orderedQuantity;
          inventoryStore.addIngredientStock(
            item.ingredientId,
            quantity,
            'supply',
            `Поставка від ${supply.supplierName}`,
            receivedBy
          );
        }

        // Notify
        notificationStore.notifySupplyReceived(supply.supplierName, updatedItems.length);
        notificationStore.notifyShiftAction(
          'Поставка отримана',
          receivedBy || 'Система',
          `${supply.supplierName}: ${updatedItems.length} позицій`
        );
      },

      cancelSupply: (id, reason) => {
        set((state) => ({
          supplies: state.supplies.map((s) =>
            s.id === id && s.status !== 'received'
              ? { ...s, status: 'cancelled' as SupplyStatus, notes: reason || s.notes }
              : s
          ),
        }));
      },

      // ========== SUPPLIER ACTIONS ==========

      addSupplier: (supplier) => {
        const id = `sup-${Date.now()}`;
        set((state) => ({
          suppliers: [...state.suppliers, { ...supplier, id }],
        }));
        return id;
      },

      updateSupplier: (id, updates) => {
        set((state) => ({
          suppliers: state.suppliers.map((s) =>
            s.id === id ? { ...s, ...updates } : s
          ),
        }));
      },

      deleteSupplier: (id) => {
        set((state) => ({
          suppliers: state.suppliers.filter((s) => s.id !== id),
        }));
      },

      // ========== QUERIES ==========

      getSupplyById: (id) => get().supplies.find((s) => s.id === id),

      getSuppliesByStatus: (status) =>
        get().supplies.filter((s) => s.status === status),

      getSuppliesBySupplier: (supplierName) =>
        get().supplies.filter((s) => s.supplierName === supplierName),

      getPendingSupplies: () =>
        get().supplies.filter((s) => ['ordered', 'shipped'].includes(s.status)),
    }),
    {
      name: 'paradise-pos-supplies',
      partialize: (state) => ({
        supplies: state.supplies.slice(0, 100),
        suppliers: state.suppliers,
      }),
    }
  )
);

// ============================================
// SELECTORS
// ============================================

export const selectSupplies = (state: SupplyState) => state.supplies;
export const selectSuppliers = (state: SupplyState) => state.suppliers;
export const selectActiveSuppliers = (state: SupplyState) =>
  state.suppliers.filter((s) => s.isActive);
export const selectDraftSupplies = (state: SupplyState) =>
  state.supplies.filter((s) => s.status === 'draft');
export const selectPendingSupplies = (state: SupplyState) =>
  state.supplies.filter((s) => ['ordered', 'shipped'].includes(s.status));
