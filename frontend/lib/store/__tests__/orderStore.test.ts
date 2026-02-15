import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock the dependent stores before importing orderStore
vi.mock('../inventoryStore', () => ({
  useInventoryStore: {
    getState: () => ({
      processSale: vi.fn().mockReturnValue({ success: true, errors: [] }),
    }),
  },
}));

vi.mock('../notificationStore', () => ({
  useNotificationStore: {
    getState: () => ({
      notifyOrderCompleted: vi.fn(),
      notifyShiftAction: vi.fn(),
    }),
  },
}));

import { useOrderStore } from '../orderStore';

function addTestItem(overrides: Partial<{
  productId: string;
  name: string;
  price: number;
  sizeId: string;
  modifiers: Array<{ id: string; name: string; price: number }>;
  notes: string;
}> = {}) {
  useOrderStore.getState().addItem({
    productId: overrides.productId ?? 'product-1',
    name: overrides.name ?? 'Espresso',
    price: overrides.price ?? 45,
    sizeId: overrides.sizeId,
    modifiers: overrides.modifiers,
    notes: overrides.notes,
  });
}

describe('Order Store', () => {
  beforeEach(() => {
    // Reset store to initial state
    useOrderStore.setState({
      currentOrder: null,
      completedOrders: [],
      isPaymentModalOpen: false,
      selectedPaymentMethod: null,
    });
  });

  // ============================================
  // createOrder / clearOrder
  // ============================================

  describe('createOrder', () => {
    it('creates a new empty order', () => {
      useOrderStore.getState().createOrder();
      const order = useOrderStore.getState().currentOrder;
      expect(order).not.toBeNull();
      expect(order!.items).toEqual([]);
      expect(order!.discounts).toEqual([]);
      expect(order!.id).toMatch(/^ORD-/);
    });
  });

  describe('clearOrder', () => {
    it('clears the current order', () => {
      useOrderStore.getState().createOrder();
      expect(useOrderStore.getState().currentOrder).not.toBeNull();

      useOrderStore.getState().clearOrder();
      expect(useOrderStore.getState().currentOrder).toBeNull();
    });

    it('resets payment state', () => {
      useOrderStore.setState({
        isPaymentModalOpen: true,
        selectedPaymentMethod: 'cash',
      });
      useOrderStore.getState().clearOrder();
      expect(useOrderStore.getState().isPaymentModalOpen).toBe(false);
      expect(useOrderStore.getState().selectedPaymentMethod).toBeNull();
    });
  });

  // ============================================
  // addItem
  // ============================================

  describe('addItem', () => {
    it('adds an item to the cart (auto-creates order)', () => {
      addTestItem();
      const order = useOrderStore.getState().currentOrder;
      expect(order).not.toBeNull();
      expect(order!.items).toHaveLength(1);
      expect(order!.items[0].name).toBe('Espresso');
      expect(order!.items[0].price).toBe(45);
      expect(order!.items[0].quantity).toBe(1);
    });

    it('increments quantity for duplicate product (same productId, no modifiers, no notes)', () => {
      addTestItem({ productId: 'p1', name: 'Latte', price: 60 });
      addTestItem({ productId: 'p1', name: 'Latte', price: 60 });

      const order = useOrderStore.getState().currentOrder!;
      expect(order.items).toHaveLength(1);
      expect(order.items[0].quantity).toBe(2);
    });

    it('adds separate item when product has notes', () => {
      addTestItem({ productId: 'p1', name: 'Latte', price: 60 });
      // The first item has no notes, add second with modifiers (creates a new line)
      addTestItem({ productId: 'p1', name: 'Latte', price: 60, modifiers: [{ id: 'm1', name: 'Sugar', price: 5 }] });

      const order = useOrderStore.getState().currentOrder!;
      expect(order.items).toHaveLength(2);
    });

    it('adds different products as separate items', () => {
      addTestItem({ productId: 'p1', name: 'Espresso', price: 45 });
      addTestItem({ productId: 'p2', name: 'Latte', price: 60 });

      const order = useOrderStore.getState().currentOrder!;
      expect(order.items).toHaveLength(2);
    });
  });

  // ============================================
  // removeItem
  // ============================================

  describe('removeItem', () => {
    it('removes an item from the cart', () => {
      addTestItem();
      const order = useOrderStore.getState().currentOrder!;
      const itemId = order.items[0].id;

      useOrderStore.getState().removeItem(itemId);
      expect(useOrderStore.getState().currentOrder!.items).toHaveLength(0);
    });

    it('does nothing when no current order exists', () => {
      expect(() => {
        useOrderStore.getState().removeItem('nonexistent');
      }).not.toThrow();
    });

    it('keeps other items when removing one', () => {
      addTestItem({ productId: 'p1', name: 'Espresso', price: 45 });
      addTestItem({ productId: 'p2', name: 'Latte', price: 60 });

      const order = useOrderStore.getState().currentOrder!;
      const firstItemId = order.items[0].id;

      useOrderStore.getState().removeItem(firstItemId);

      const updated = useOrderStore.getState().currentOrder!;
      expect(updated.items).toHaveLength(1);
      expect(updated.items[0].name).toBe('Latte');
    });
  });

  // ============================================
  // updateItemQuantity
  // ============================================

  describe('updateItemQuantity', () => {
    it('changes item quantity', () => {
      addTestItem();
      const itemId = useOrderStore.getState().currentOrder!.items[0].id;

      useOrderStore.getState().updateItemQuantity(itemId, 5);
      expect(useOrderStore.getState().currentOrder!.items[0].quantity).toBe(5);
    });

    it('removes item when quantity is set to 0', () => {
      addTestItem();
      const itemId = useOrderStore.getState().currentOrder!.items[0].id;

      useOrderStore.getState().updateItemQuantity(itemId, 0);
      expect(useOrderStore.getState().currentOrder!.items).toHaveLength(0);
    });

    it('removes item when quantity is negative', () => {
      addTestItem();
      const itemId = useOrderStore.getState().currentOrder!.items[0].id;

      useOrderStore.getState().updateItemQuantity(itemId, -1);
      expect(useOrderStore.getState().currentOrder!.items).toHaveLength(0);
    });

    it('does nothing when no current order exists', () => {
      expect(() => {
        useOrderStore.getState().updateItemQuantity('nonexistent', 5);
      }).not.toThrow();
    });
  });

  // ============================================
  // getSubtotal / getTotal / getItemCount
  // ============================================

  describe('getSubtotal', () => {
    it('returns 0 when no order exists', () => {
      expect(useOrderStore.getState().getSubtotal()).toBe(0);
    });

    it('calculates correct subtotal for single item', () => {
      addTestItem({ price: 45 });
      expect(useOrderStore.getState().getSubtotal()).toBe(45);
    });

    it('calculates correct subtotal with quantity', () => {
      addTestItem({ price: 45 });
      const itemId = useOrderStore.getState().currentOrder!.items[0].id;
      useOrderStore.getState().updateItemQuantity(itemId, 3);
      expect(useOrderStore.getState().getSubtotal()).toBe(135);
    });

    it('calculates subtotal with multiple items', () => {
      addTestItem({ productId: 'p1', price: 45 });
      addTestItem({ productId: 'p2', price: 60 });
      expect(useOrderStore.getState().getSubtotal()).toBe(105);
    });

    it('includes modifier prices in subtotal', () => {
      addTestItem({
        productId: 'p1',
        price: 45,
        modifiers: [
          { id: 'm1', name: 'Extra shot', price: 15 },
          { id: 'm2', name: 'Syrup', price: 10 },
        ],
      });
      // (45 + 15 + 10) * 1 = 70
      expect(useOrderStore.getState().getSubtotal()).toBe(70);
    });
  });

  describe('getTotal', () => {
    it('returns 0 when no order exists', () => {
      expect(useOrderStore.getState().getTotal()).toBe(0);
    });

    it('equals subtotal when no discounts', () => {
      addTestItem({ price: 100 });
      expect(useOrderStore.getState().getTotal()).toBe(100);
    });

    it('never goes below 0', () => {
      addTestItem({ price: 10 });
      useOrderStore.getState().addDiscount({
        type: 'fixed',
        value: 100,
        name: 'Big discount',
      });
      expect(useOrderStore.getState().getTotal()).toBe(0);
    });
  });

  describe('getItemCount', () => {
    it('returns 0 when no order exists', () => {
      expect(useOrderStore.getState().getItemCount()).toBe(0);
    });

    it('counts total quantity across items', () => {
      addTestItem({ productId: 'p1', price: 45 });
      addTestItem({ productId: 'p2', price: 60 });
      // Each added with quantity 1
      expect(useOrderStore.getState().getItemCount()).toBe(2);
    });

    it('counts quantity correctly after update', () => {
      addTestItem({ productId: 'p1', price: 45 });
      const itemId = useOrderStore.getState().currentOrder!.items[0].id;
      useOrderStore.getState().updateItemQuantity(itemId, 5);
      expect(useOrderStore.getState().getItemCount()).toBe(5);
    });
  });

  // ============================================
  // Discounts
  // ============================================

  describe('addDiscount', () => {
    it('adds a percentage discount', () => {
      useOrderStore.getState().createOrder();
      useOrderStore.getState().addDiscount({
        type: 'percentage',
        value: 10,
        name: '10% off',
      });
      const discounts = useOrderStore.getState().currentOrder!.discounts;
      expect(discounts).toHaveLength(1);
      expect(discounts[0].type).toBe('percentage');
      expect(discounts[0].value).toBe(10);
    });

    it('adds a fixed discount', () => {
      useOrderStore.getState().createOrder();
      useOrderStore.getState().addDiscount({
        type: 'fixed',
        value: 25,
        name: '25 off',
      });
      const discounts = useOrderStore.getState().currentOrder!.discounts;
      expect(discounts).toHaveLength(1);
      expect(discounts[0].type).toBe('fixed');
      expect(discounts[0].value).toBe(25);
    });

    it('does nothing when no current order exists', () => {
      useOrderStore.getState().addDiscount({
        type: 'fixed',
        value: 25,
        name: 'Discount',
      });
      expect(useOrderStore.getState().currentOrder).toBeNull();
    });
  });

  describe('getDiscountAmount', () => {
    it('returns 0 when no order', () => {
      expect(useOrderStore.getState().getDiscountAmount()).toBe(0);
    });

    it('calculates percentage discount correctly', () => {
      addTestItem({ price: 100 });
      useOrderStore.getState().addDiscount({
        type: 'percentage',
        value: 10,
        name: '10% off',
      });
      expect(useOrderStore.getState().getDiscountAmount()).toBe(10);
    });

    it('calculates fixed discount correctly', () => {
      addTestItem({ price: 100 });
      useOrderStore.getState().addDiscount({
        type: 'fixed',
        value: 25,
        name: '25 off',
      });
      expect(useOrderStore.getState().getDiscountAmount()).toBe(25);
    });

    it('combines percentage and fixed discounts', () => {
      addTestItem({ price: 200 });
      useOrderStore.getState().addDiscount({
        type: 'percentage',
        value: 10,
        name: '10% off',
      });
      useOrderStore.getState().addDiscount({
        type: 'fixed',
        value: 15,
        name: '15 off',
      });
      // 10% of 200 = 20, plus 15 fixed = 35
      expect(useOrderStore.getState().getDiscountAmount()).toBe(35);
    });
  });

  describe('removeDiscount', () => {
    it('removes a specific discount', () => {
      useOrderStore.getState().createOrder();
      useOrderStore.getState().addDiscount({ type: 'fixed', value: 10, name: 'D1' });
      useOrderStore.getState().addDiscount({ type: 'fixed', value: 20, name: 'D2' });

      const discountId = useOrderStore.getState().currentOrder!.discounts[0].id;
      useOrderStore.getState().removeDiscount(discountId);

      const discounts = useOrderStore.getState().currentOrder!.discounts;
      expect(discounts).toHaveLength(1);
      expect(discounts[0].name).toBe('D2');
    });
  });

  describe('clearDiscounts', () => {
    it('removes all discounts', () => {
      useOrderStore.getState().createOrder();
      useOrderStore.getState().addDiscount({ type: 'fixed', value: 10, name: 'D1' });
      useOrderStore.getState().addDiscount({ type: 'fixed', value: 20, name: 'D2' });

      useOrderStore.getState().clearDiscounts();
      expect(useOrderStore.getState().currentOrder!.discounts).toEqual([]);
    });
  });

  // ============================================
  // Order details
  // ============================================

  describe('setTableNumber', () => {
    it('sets the table number', () => {
      useOrderStore.getState().createOrder();
      useOrderStore.getState().setTableNumber(5);
      expect(useOrderStore.getState().currentOrder!.tableNumber).toBe(5);
    });

    it('clears table number with undefined', () => {
      useOrderStore.getState().createOrder();
      useOrderStore.getState().setTableNumber(5);
      useOrderStore.getState().setTableNumber(undefined);
      expect(useOrderStore.getState().currentOrder!.tableNumber).toBeUndefined();
    });
  });

  describe('setCustomerName', () => {
    it('sets the customer name', () => {
      useOrderStore.getState().createOrder();
      useOrderStore.getState().setCustomerName('Alice');
      expect(useOrderStore.getState().currentOrder!.customerName).toBe('Alice');
    });
  });

  describe('setOrderNotes', () => {
    it('sets order notes', () => {
      useOrderStore.getState().createOrder();
      useOrderStore.getState().setOrderNotes('Rush order');
      expect(useOrderStore.getState().currentOrder!.notes).toBe('Rush order');
    });
  });

  // ============================================
  // Payment UI
  // ============================================

  describe('payment modal', () => {
    it('opens payment modal', () => {
      useOrderStore.getState().openPaymentModal();
      expect(useOrderStore.getState().isPaymentModalOpen).toBe(true);
    });

    it('closes payment modal and resets method', () => {
      useOrderStore.getState().openPaymentModal();
      useOrderStore.getState().setPaymentMethod('cash');
      useOrderStore.getState().closePaymentModal();
      expect(useOrderStore.getState().isPaymentModalOpen).toBe(false);
      expect(useOrderStore.getState().selectedPaymentMethod).toBeNull();
    });

    it('sets payment method', () => {
      useOrderStore.getState().setPaymentMethod('card');
      expect(useOrderStore.getState().selectedPaymentMethod).toBe('card');
    });
  });
});
