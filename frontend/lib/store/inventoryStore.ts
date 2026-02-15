/**
 * CoffeePOS - Inventory Store
 *
 * Real-time inventory management with Zustand
 * Handles ingredient tracking, deductions, and supplies
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { IngredientUnit } from '@/lib/api';
import {
  ingredients as seedIngredients,
  readyMadeProducts as seedProducts,
  getProductRecipe,
  type RecipeIngredientAmount,
} from '@/lib/data';

// ============================================
// TYPES
// ============================================

export interface InventoryItem {
  id: number;
  name: string;
  slug: string;
  unit: IngredientUnit;
  quantity: number;
  minQuantity: number;
  costPerUnit: number;
  categoryId: number;
  categoryName: string;
}

export interface SimpleProduct {
  id: string;
  name: string;
  quantity: number;
  minQuantity: number;
  costPrice: number;
  price: number;
}

export interface InventoryTransaction {
  id: string;
  timestamp: string;
  type: 'sale' | 'supply' | 'adjustment' | 'waste';
  itemType: 'ingredient' | 'product';
  itemId: number | string;
  itemName: string;
  quantity: number;
  previousQuantity: number;
  newQuantity: number;
  reference?: string;
  notes?: string;
  performedBy?: string;
}

export interface LowStockAlert {
  id: string;
  itemType: 'ingredient' | 'product';
  itemId: number | string;
  itemName: string;
  currentQuantity: number;
  minQuantity: number;
  unit: IngredientUnit | 'pcs';
  severity: 'warning' | 'critical';
  createdAt: string;
  acknowledged: boolean;
}

export interface InventoryState {
  // Data
  ingredients: InventoryItem[];
  products: SimpleProduct[];
  transactions: InventoryTransaction[];
  alerts: LowStockAlert[];

  // Actions - Ingredients
  deductIngredients: (
    deductions: Array<{ ingredientId: number; amount: number }>,
    reference?: string,
    performedBy?: string
  ) => { success: boolean; insufficientItems: string[] };

  addIngredientStock: (
    ingredientId: number,
    amount: number,
    type: 'supply' | 'adjustment',
    notes?: string,
    performedBy?: string
  ) => void;

  // Actions - Products
  deductProduct: (
    productId: string,
    quantity: number,
    reference?: string,
    performedBy?: string
  ) => boolean;

  addProductStock: (
    productId: string,
    quantity: number,
    type: 'supply' | 'adjustment',
    notes?: string,
    performedBy?: string
  ) => void;

  // Actions - Combined (for POS)
  processSale: (
    productId: string,
    sizeId: string | undefined,
    quantity: number,
    orderId: string,
    performedBy?: string
  ) => { success: boolean; errors: string[] };

  // Actions - Alerts
  checkLowStock: () => void;
  acknowledgeAlert: (alertId: string) => void;
  clearAcknowledgedAlerts: () => void;

  // Actions - Transactions
  getRecentTransactions: (limit?: number) => InventoryTransaction[];
  getTransactionsByDate: (startDate: string, endDate: string) => InventoryTransaction[];

  // Helpers
  getIngredient: (id: number) => InventoryItem | undefined;
  getProduct: (id: string) => SimpleProduct | undefined;
  getLowStockIngredients: () => InventoryItem[];
  getLowStockProducts: () => SimpleProduct[];
}

// ============================================
// HELPERS
// ============================================

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function initializeIngredients(): InventoryItem[] {
  return seedIngredients.map((ing) => ({
    id: ing.id,
    name: ing.name,
    slug: ing.slug,
    unit: ing.unit,
    quantity: ing.quantity,
    minQuantity: ing.minQuantity,
    costPerUnit: ing.costPerUnit,
    categoryId: ing.category?.id || 0,
    categoryName: ing.category?.name || 'Інше',
  }));
}

function initializeProducts(): SimpleProduct[] {
  return seedProducts.map((p) => ({
    id: p.id,
    name: p.name,
    quantity: p.quantity,
    minQuantity: p.minQuantity,
    costPrice: p.costPrice,
    price: p.price,
  }));
}

// ============================================
// STORE
// ============================================

export const useInventoryStore = create<InventoryState>()(
  persist(
    (set, get) => ({
      // Initial data
      ingredients: initializeIngredients(),
      products: initializeProducts(),
      transactions: [],
      alerts: [],

      // ========== INGREDIENT ACTIONS ==========

      deductIngredients: (deductions, reference, performedBy) => {
        const state = get();
        const insufficientItems: string[] = [];
        const updates: Map<number, { prev: number; new: number }> = new Map();

        // Check all ingredients first
        for (const { ingredientId, amount } of deductions) {
          const ingredient = state.ingredients.find((i) => i.id === ingredientId);
          if (!ingredient) {
            insufficientItems.push(`Unknown ingredient #${ingredientId}`);
            continue;
          }
          if (ingredient.quantity < amount) {
            insufficientItems.push(`${ingredient.name}: потрібно ${amount}${ingredient.unit}, є ${ingredient.quantity}${ingredient.unit}`);
          } else {
            updates.set(ingredientId, {
              prev: ingredient.quantity,
              new: ingredient.quantity - amount,
            });
          }
        }

        if (insufficientItems.length > 0) {
          return { success: false, insufficientItems };
        }

        // Apply deductions
        const newTransactions: InventoryTransaction[] = [];
        const timestamp = new Date().toISOString();

        set((state) => ({
          ingredients: state.ingredients.map((ing) => {
            const update = updates.get(ing.id);
            if (update) {
              newTransactions.push({
                id: generateId(),
                timestamp,
                type: 'sale' as const,
                itemType: 'ingredient' as const,
                itemId: ing.id,
                itemName: ing.name,
                quantity: -(ing.quantity - update.new),
                previousQuantity: update.prev,
                newQuantity: update.new,
                reference,
                performedBy,
              });
              return { ...ing, quantity: update.new };
            }
            return ing;
          }),
          transactions: [...newTransactions, ...state.transactions].slice(0, 1000),
        }));

        // Check for low stock after deduction
        setTimeout(() => get().checkLowStock(), 0);

        return { success: true, insufficientItems: [] };
      },

      addIngredientStock: (ingredientId, amount, type, notes, performedBy) => {
        const timestamp = new Date().toISOString();

        set((state) => {
          const ingredient = state.ingredients.find((i) => i.id === ingredientId);
          if (!ingredient) return state;

          const newQuantity = ingredient.quantity + amount;
          const transaction: InventoryTransaction = {
            id: generateId(),
            timestamp,
            type,
            itemType: 'ingredient' as const,
            itemId: ingredientId,
            itemName: ingredient.name,
            quantity: amount,
            previousQuantity: ingredient.quantity,
            newQuantity,
            notes,
            performedBy,
          };

          return {
            ingredients: state.ingredients.map((ing) =>
              ing.id === ingredientId ? { ...ing, quantity: newQuantity } : ing
            ),
            transactions: [transaction, ...state.transactions].slice(0, 1000),
          };
        });

        // Check low stock (may resolve alerts)
        setTimeout(() => get().checkLowStock(), 0);
      },

      // ========== PRODUCT ACTIONS ==========

      deductProduct: (productId, quantity, reference, performedBy) => {
        const state = get();
        const product = state.products.find((p) => p.id === productId);

        if (!product || product.quantity < quantity) {
          return false;
        }

        const timestamp = new Date().toISOString();
        const newQuantity = product.quantity - quantity;

        set((state) => ({
          products: state.products.map((p) =>
            p.id === productId ? { ...p, quantity: newQuantity } : p
          ),
          transactions: [
            {
              id: generateId(),
              timestamp,
              type: 'sale' as const,
              itemType: 'product' as const,
              itemId: productId,
              itemName: product.name,
              quantity: -quantity,
              previousQuantity: product.quantity,
              newQuantity,
              reference,
              performedBy,
            },
            ...state.transactions,
          ].slice(0, 1000),
        }));

        setTimeout(() => get().checkLowStock(), 0);
        return true;
      },

      addProductStock: (productId, quantity, type, notes, performedBy) => {
        const timestamp = new Date().toISOString();

        set((state) => {
          const product = state.products.find((p) => p.id === productId);
          if (!product) return state;

          const newQuantity = product.quantity + quantity;
          const transaction: InventoryTransaction = {
            id: generateId(),
            timestamp,
            type,
            itemType: 'product' as const,
            itemId: productId,
            itemName: product.name,
            quantity,
            previousQuantity: product.quantity,
            newQuantity,
            notes,
            performedBy,
          };

          return {
            products: state.products.map((p) =>
              p.id === productId ? { ...p, quantity: newQuantity } : p
            ),
            transactions: [transaction, ...state.transactions].slice(0, 1000),
          };
        });

        setTimeout(() => get().checkLowStock(), 0);
      },

      // ========== POS INTEGRATION ==========

      processSale: (productId, sizeId, quantity, orderId, performedBy) => {
        const state = get();
        const errors: string[] = [];

        // Check if it's a recipe-based product
        const recipe = getProductRecipe(productId, sizeId);

        if (recipe) {
          // Recipe product - deduct ingredients
          const deductions = recipe.map((item) => ({
            ingredientId: item.ingredientId,
            amount: item.amount * quantity,
          }));

          const result = state.deductIngredients(deductions, orderId, performedBy);
          if (!result.success) {
            return { success: false, errors: result.insufficientItems };
          }
        } else {
          // Simple product - deduct from stock
          const product = state.products.find((p) => p.id === productId);
          if (product) {
            if (product.quantity < quantity) {
              return {
                success: false,
                errors: [`${product.name}: недостатньо на складі (є ${product.quantity} шт)`],
              };
            }
            state.deductProduct(productId, quantity, orderId, performedBy);
          } else {
            // Product not found in either system - allow sale without inventory tracking
            console.warn(`Product ${productId} not found in inventory system`);
          }
        }

        return { success: true, errors: [] };
      },

      // ========== ALERTS ==========

      checkLowStock: () => {
        const state = get();
        const newAlerts: LowStockAlert[] = [];
        const timestamp = new Date().toISOString();

        // Check ingredients
        for (const ing of state.ingredients) {
          if (ing.quantity <= ing.minQuantity) {
            const existingAlert = state.alerts.find(
              (a) => a.itemType === 'ingredient' && a.itemId === ing.id && !a.acknowledged
            );

            if (!existingAlert) {
              newAlerts.push({
                id: generateId(),
                itemType: 'ingredient' as const,
                itemId: ing.id,
                itemName: ing.name,
                currentQuantity: ing.quantity,
                minQuantity: ing.minQuantity,
                unit: ing.unit,
                severity: ing.quantity === 0 ? 'critical' : 'warning',
                createdAt: timestamp,
                acknowledged: false,
              });
            }
          }
        }

        // Check products
        for (const prod of state.products) {
          if (prod.quantity <= prod.minQuantity) {
            const existingAlert = state.alerts.find(
              (a) => a.itemType === 'product' && a.itemId === prod.id && !a.acknowledged
            );

            if (!existingAlert) {
              newAlerts.push({
                id: generateId(),
                itemType: 'product' as const,
                itemId: prod.id,
                itemName: prod.name,
                currentQuantity: prod.quantity,
                minQuantity: prod.minQuantity,
                unit: 'pcs',
                severity: prod.quantity === 0 ? 'critical' : 'warning',
                createdAt: timestamp,
                acknowledged: false,
              });
            }
          }
        }

        if (newAlerts.length > 0) {
          set((state) => ({
            alerts: [...newAlerts, ...state.alerts],
          }));
        }

        // Remove alerts for items that are no longer low stock
        set((state) => ({
          alerts: state.alerts.filter((alert) => {
            if (alert.acknowledged) return true;

            if (alert.itemType === 'ingredient') {
              const ing = state.ingredients.find((i) => i.id === alert.itemId);
              return ing ? ing.quantity <= ing.minQuantity : false;
            } else {
              const prod = state.products.find((p) => p.id === alert.itemId);
              return prod ? prod.quantity <= prod.minQuantity : false;
            }
          }),
        }));
      },

      acknowledgeAlert: (alertId) => {
        set((state) => ({
          alerts: state.alerts.map((a) =>
            a.id === alertId ? { ...a, acknowledged: true } : a
          ),
        }));
      },

      clearAcknowledgedAlerts: () => {
        set((state) => ({
          alerts: state.alerts.filter((a) => !a.acknowledged),
        }));
      },

      // ========== TRANSACTIONS ==========

      getRecentTransactions: (limit = 50) => {
        return get().transactions.slice(0, limit);
      },

      getTransactionsByDate: (startDate, endDate) => {
        return get().transactions.filter((t) => {
          const date = t.timestamp;
          return date >= startDate && date <= endDate;
        });
      },

      // ========== HELPERS ==========

      getIngredient: (id) => get().ingredients.find((i) => i.id === id),

      getProduct: (id) => get().products.find((p) => p.id === id),

      getLowStockIngredients: () =>
        get().ingredients.filter((i) => i.quantity <= i.minQuantity),

      getLowStockProducts: () =>
        get().products.filter((p) => p.quantity <= p.minQuantity),
    }),
    {
      name: 'paradise-pos-inventory',
      partialize: (state) => ({
        ingredients: state.ingredients,
        products: state.products,
        transactions: state.transactions.slice(0, 500),
        alerts: state.alerts.filter((a) => !a.acknowledged),
      }),
    }
  )
);

// ============================================
// SELECTORS
// ============================================

export const selectIngredients = (state: InventoryState) => state.ingredients;
export const selectProducts = (state: InventoryState) => state.products;
export const selectTransactions = (state: InventoryState) => state.transactions;
export const selectAlerts = (state: InventoryState) => state.alerts;
export const selectUnacknowledgedAlerts = (state: InventoryState) =>
  state.alerts.filter((a) => !a.acknowledged);
export const selectCriticalAlerts = (state: InventoryState) =>
  state.alerts.filter((a) => a.severity === 'critical' && !a.acknowledged);
