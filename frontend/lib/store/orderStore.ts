/**
 * ParadisePOS - Order Store (Zustand)
 *
 * Global state management for orders
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { useInventoryStore } from './inventoryStore';
import { useNotificationStore } from './notificationStore';

// ============================================
// TYPES
// ============================================

export interface OrderItemModifier {
  id: string;
  name: string;
  price: number;
}

export interface OrderItem {
  id: string;
  productId: string;
  sizeId?: string;
  name: string;
  price: number;
  quantity: number;
  modifiers?: OrderItemModifier[];
  notes?: string;
  addedAt: number;
}

export interface Discount {
  id: string;
  type: 'percentage' | 'fixed';
  value: number;
  name: string;
  code?: string;
}

export interface Order {
  id: string;
  items: OrderItem[];
  discounts: Discount[];
  tableNumber?: number;
  customerName?: string;
  notes?: string;
  createdAt: number;
  updatedAt: number;
}

export interface OrderState {
  // Current order
  currentOrder: Order | null;

  // Order history (for current session)
  completedOrders: Order[];

  // UI state
  isPaymentModalOpen: boolean;
  selectedPaymentMethod: 'cash' | 'card' | 'qr' | null;

  // Actions - Order management
  createOrder: () => void;
  clearOrder: () => void;

  // Actions - Items
  addItem: (item: Omit<OrderItem, 'id' | 'addedAt' | 'quantity'> & { sizeId?: string }) => void;
  updateItemQuantity: (itemId: string, quantity: number) => void;
  removeItem: (itemId: string) => void;
  updateItemNotes: (itemId: string, notes: string) => void;
  updateItemModifiers: (itemId: string, modifiers: OrderItemModifier[]) => void;

  // Actions - Discounts
  addDiscount: (discount: Omit<Discount, 'id'>) => void;
  removeDiscount: (discountId: string) => void;
  clearDiscounts: () => void;

  // Actions - Order details
  setTableNumber: (tableNumber: number | undefined) => void;
  setCustomerName: (name: string | undefined) => void;
  setOrderNotes: (notes: string | undefined) => void;

  // Actions - Payment
  openPaymentModal: () => void;
  closePaymentModal: () => void;
  setPaymentMethod: (method: 'cash' | 'card' | 'qr' | null) => void;
  completePayment: (method: 'cash' | 'card' | 'qr', received?: number) => void;

  // Computed values (as functions)
  getSubtotal: () => number;
  getDiscountAmount: () => number;
  getTotal: () => number;
  getItemCount: () => number;
}

// ============================================
// HELPERS
// ============================================

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

function generateOrderId(): string {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `ORD-${dateStr}-${random}`;
}

function createEmptyOrder(): Order {
  const now = Date.now();
  return {
    id: generateOrderId(),
    items: [],
    discounts: [],
    createdAt: now,
    updatedAt: now,
  };
}

// ============================================
// STORE
// ============================================

export const useOrderStore = create<OrderState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        currentOrder: null,
        completedOrders: [],
        isPaymentModalOpen: false,
        selectedPaymentMethod: null,

        // Order management
        createOrder: () => {
          set({ currentOrder: createEmptyOrder() }, false, 'createOrder');
        },

        clearOrder: () => {
          set({
            currentOrder: null,
            isPaymentModalOpen: false,
            selectedPaymentMethod: null,
          }, false, 'clearOrder');
        },

        // Items
        addItem: (item) => {
          const { currentOrder } = get();

          // Auto-create order if none exists
          let order = currentOrder;
          if (!order) {
            order = createEmptyOrder();
          }

          // Check if item already exists (same product, no modifiers comparison for simplicity)
          const existingItemIndex = order.items.findIndex(
            (i) => i.productId === item.productId &&
                   !i.modifiers?.length &&
                   !item.modifiers?.length &&
                   !i.notes
          );

          let updatedItems: OrderItem[];

          if (existingItemIndex >= 0) {
            // Increment quantity
            updatedItems = order.items.map((i, index) =>
              index === existingItemIndex
                ? { ...i, quantity: i.quantity + 1 }
                : i
            );
          } else {
            // Add new item
            const newItem: OrderItem = {
              ...item,
              id: generateId(),
              quantity: 1,
              addedAt: Date.now(),
            };
            updatedItems = [...order.items, newItem];
          }

          set({
            currentOrder: {
              ...order,
              items: updatedItems,
              updatedAt: Date.now(),
            },
          }, false, 'addItem');
        },

        updateItemQuantity: (itemId, quantity) => {
          const { currentOrder } = get();
          if (!currentOrder) return;

          if (quantity <= 0) {
            get().removeItem(itemId);
            return;
          }

          set({
            currentOrder: {
              ...currentOrder,
              items: currentOrder.items.map((item) =>
                item.id === itemId ? { ...item, quantity } : item
              ),
              updatedAt: Date.now(),
            },
          }, false, 'updateItemQuantity');
        },

        removeItem: (itemId) => {
          const { currentOrder } = get();
          if (!currentOrder) return;

          const updatedItems = currentOrder.items.filter((item) => item.id !== itemId);

          set({
            currentOrder: {
              ...currentOrder,
              items: updatedItems,
              updatedAt: Date.now(),
            },
          }, false, 'removeItem');
        },

        updateItemNotes: (itemId, notes) => {
          const { currentOrder } = get();
          if (!currentOrder) return;

          set({
            currentOrder: {
              ...currentOrder,
              items: currentOrder.items.map((item) =>
                item.id === itemId ? { ...item, notes: notes || undefined } : item
              ),
              updatedAt: Date.now(),
            },
          }, false, 'updateItemNotes');
        },

        updateItemModifiers: (itemId, modifiers) => {
          const { currentOrder } = get();
          if (!currentOrder) return;

          set({
            currentOrder: {
              ...currentOrder,
              items: currentOrder.items.map((item) =>
                item.id === itemId ? { ...item, modifiers } : item
              ),
              updatedAt: Date.now(),
            },
          }, false, 'updateItemModifiers');
        },

        // Discounts
        addDiscount: (discount) => {
          const { currentOrder } = get();
          if (!currentOrder) return;

          const newDiscount: Discount = {
            ...discount,
            id: generateId(),
          };

          set({
            currentOrder: {
              ...currentOrder,
              discounts: [...currentOrder.discounts, newDiscount],
              updatedAt: Date.now(),
            },
          }, false, 'addDiscount');
        },

        removeDiscount: (discountId) => {
          const { currentOrder } = get();
          if (!currentOrder) return;

          set({
            currentOrder: {
              ...currentOrder,
              discounts: currentOrder.discounts.filter((d) => d.id !== discountId),
              updatedAt: Date.now(),
            },
          }, false, 'removeDiscount');
        },

        clearDiscounts: () => {
          const { currentOrder } = get();
          if (!currentOrder) return;

          set({
            currentOrder: {
              ...currentOrder,
              discounts: [],
              updatedAt: Date.now(),
            },
          }, false, 'clearDiscounts');
        },

        // Order details
        setTableNumber: (tableNumber) => {
          const { currentOrder } = get();
          if (!currentOrder) return;

          set({
            currentOrder: {
              ...currentOrder,
              tableNumber,
              updatedAt: Date.now(),
            },
          }, false, 'setTableNumber');
        },

        setCustomerName: (name) => {
          const { currentOrder } = get();
          if (!currentOrder) return;

          set({
            currentOrder: {
              ...currentOrder,
              customerName: name,
              updatedAt: Date.now(),
            },
          }, false, 'setCustomerName');
        },

        setOrderNotes: (notes) => {
          const { currentOrder } = get();
          if (!currentOrder) return;

          set({
            currentOrder: {
              ...currentOrder,
              notes,
              updatedAt: Date.now(),
            },
          }, false, 'setOrderNotes');
        },

        // Payment
        openPaymentModal: () => {
          set({ isPaymentModalOpen: true }, false, 'openPaymentModal');
        },

        closePaymentModal: () => {
          set({
            isPaymentModalOpen: false,
            selectedPaymentMethod: null,
          }, false, 'closePaymentModal');
        },

        setPaymentMethod: (method) => {
          set({ selectedPaymentMethod: method }, false, 'setPaymentMethod');
        },

        completePayment: (method, received) => {
          const { currentOrder, completedOrders } = get();
          if (!currentOrder || currentOrder.items.length === 0) return;

          const inventoryStore = useInventoryStore.getState();
          const notificationStore = useNotificationStore.getState();

          // Process inventory deductions for each item
          const errors: string[] = [];
          for (const item of currentOrder.items) {
            const result = inventoryStore.processSale(
              item.productId,
              item.sizeId,
              item.quantity,
              currentOrder.id
            );

            if (!result.success) {
              errors.push(...result.errors);
            }
          }

          // Log errors but don't block the sale
          if (errors.length > 0) {
            console.warn('Inventory deduction warnings:', errors);
            // Could notify about inventory issues
          }

          // Add to completed orders
          const completedOrder: Order = {
            ...currentOrder,
            updatedAt: Date.now(),
          };

          const total = get().getTotal();

          set({
            completedOrders: [...completedOrders, completedOrder],
            currentOrder: null,
            isPaymentModalOpen: false,
            selectedPaymentMethod: null,
          }, false, 'completePayment');

          // Notify about completed order
          notificationStore.notifyOrderCompleted(
            currentOrder.id.split('-').pop() || currentOrder.id,
            total
          );

          // Log shift action
          notificationStore.notifyShiftAction(
            'Продаж',
            'Касир',
            `Замовлення #${currentOrder.id.split('-').pop()}: ₴${total.toFixed(2)}`
          );

          console.log('Payment completed:', { method, received, order: completedOrder });
        },

        // Computed values
        getSubtotal: () => {
          const { currentOrder } = get();
          if (!currentOrder) return 0;

          return currentOrder.items.reduce((sum, item) => {
            const modifiersTotal = item.modifiers?.reduce((m, mod) => m + mod.price, 0) || 0;
            return sum + (item.price + modifiersTotal) * item.quantity;
          }, 0);
        },

        getDiscountAmount: () => {
          const { currentOrder } = get();
          if (!currentOrder) return 0;

          const subtotal = get().getSubtotal();

          return currentOrder.discounts.reduce((sum, discount) => {
            if (discount.type === 'percentage') {
              return sum + (subtotal * discount.value) / 100;
            }
            return sum + discount.value;
          }, 0);
        },

        getTotal: () => {
          const subtotal = get().getSubtotal();
          const discount = get().getDiscountAmount();
          return Math.max(0, subtotal - discount);
        },

        getItemCount: () => {
          const { currentOrder } = get();
          if (!currentOrder) return 0;

          return currentOrder.items.reduce((sum, item) => sum + item.quantity, 0);
        },
      }),
      {
        name: 'paradise-pos-order',
        partialize: (state) => ({
          // Only persist current order, not UI state
          currentOrder: state.currentOrder,
        }),
      }
    ),
    { name: 'OrderStore' }
  )
);

// ============================================
// SELECTORS (for optimized re-renders)
// ============================================

export const selectCurrentOrder = (state: OrderState) => state.currentOrder;
export const selectOrderItems = (state: OrderState) => state.currentOrder?.items ?? [];
export const selectDiscounts = (state: OrderState) => state.currentOrder?.discounts ?? [];
export const selectIsPaymentModalOpen = (state: OrderState) => state.isPaymentModalOpen;
export const selectCompletedOrders = (state: OrderState) => state.completedOrders;
