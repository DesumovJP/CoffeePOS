'use client';

/**
 * ParadisePOS - POS Interface
 *
 * Main point of sale interface
 */

import { useState, useCallback, useMemo } from 'react';
import {
  ProductGrid,
  OrderSummary,
  PaymentModal,
  ModifierModal,
  type Product as ProductGridProduct,
  type ProductAddEvent,
  type OrderItemData,
  type Category,
  type PaymentMethod,
  type ProductForModifier,
  type ModifierModalResult,
} from '@/components';
import {
  useOrderStore,
  selectCurrentOrder,
  selectIsPaymentModalOpen,
  useShiftStore,
} from '@/lib/store';
import { useProducts, useActiveCategories } from '@/lib/hooks';
import type { Product as ApiProduct } from '@/lib/api';
import { ordersApi } from '@/lib/api';
import { ShiftGuard } from '@/components/organisms/ShiftGuard';
import styles from './page.module.css';

// ============================================
// MOCK DATA (fallback when API unavailable)
// ============================================

const mockCategories: Category[] = [
  { id: 'coffee', name: 'Кава' },
  { id: 'tea', name: 'Чай' },
  { id: 'desserts', name: 'Десерти' },
  { id: 'food', name: 'Їжа' },
  { id: 'drinks', name: 'Напої' },
];

const mockProducts: ProductGridProduct[] = [
  { id: '1', name: 'Еспресо', price: 45, category: 'coffee', inStock: true },
  { id: '2', name: 'Американо', price: 55, category: 'coffee', inStock: true, sizes: [
    { id: 's', name: '250 мл', price: 55, isDefault: true },
    { id: 'm', name: '350 мл', price: 65 },
    { id: 'l', name: '450 мл', price: 75 },
  ]},
  { id: '3', name: 'Капучіно', price: 65, category: 'coffee', inStock: true, sizes: [
    { id: 's', name: '250 мл', price: 65, isDefault: true },
    { id: 'm', name: '350 мл', price: 75 },
    { id: 'l', name: '450 мл', price: 85 },
  ]},
  { id: '4', name: 'Латте', price: 70, category: 'coffee', inStock: true, sizes: [
    { id: 's', name: '300 мл', price: 70, isDefault: true },
    { id: 'm', name: '400 мл', price: 85 },
    { id: 'l', name: '500 мл', price: 95 },
  ]},
  { id: '5', name: 'Флет Вайт', price: 75, category: 'coffee', inStock: true },
  { id: '6', name: 'Раф', price: 85, category: 'coffee', inStock: true, sizes: [
    { id: 's', name: '300 мл', price: 85, isDefault: true },
    { id: 'm', name: '400 мл', price: 100 },
  ]},
  { id: '7', name: 'Мокко', price: 80, category: 'coffee', inStock: true },
  { id: '8', name: 'Айс Латте', price: 75, category: 'coffee', inStock: true, sizes: [
    { id: 'm', name: '400 мл', price: 75, isDefault: true },
    { id: 'l', name: '500 мл', price: 90 },
  ]},
  { id: '9', name: 'Чорний чай', price: 40, category: 'tea', inStock: true, sizes: [
    { id: 's', name: '300 мл', price: 40, isDefault: true },
    { id: 'l', name: '500 мл', price: 55 },
  ]},
  { id: '10', name: 'Зелений чай', price: 45, category: 'tea', inStock: true, sizes: [
    { id: 's', name: '300 мл', price: 45, isDefault: true },
    { id: 'l', name: '500 мл', price: 60 },
  ]},
  { id: '11', name: 'Матча Латте', price: 85, category: 'tea', inStock: true, sizes: [
    { id: 's', name: '300 мл', price: 85, isDefault: true },
    { id: 'm', name: '400 мл', price: 100 },
  ]},
  { id: '12', name: 'Чізкейк', price: 95, category: 'desserts', inStock: true },
  { id: '13', name: 'Тірамісу', price: 110, category: 'desserts', inStock: true },
  { id: '14', name: 'Круасан', price: 55, category: 'desserts', inStock: true },
  { id: '15', name: 'Маффін', price: 45, category: 'desserts', stockQuantity: 2, lowStockThreshold: 5, inStock: true },
  { id: '16', name: 'Сендвіч з куркою', price: 120, category: 'food', inStock: true },
  { id: '17', name: 'Сендвіч з лососем', price: 145, category: 'food', inStock: false },
  { id: '18', name: 'Салат Цезар', price: 135, category: 'food', inStock: true },
  { id: '19', name: 'Лимонад', price: 55, category: 'drinks', inStock: true, sizes: [
    { id: 's', name: '300 мл', price: 55, isDefault: true },
    { id: 'l', name: '500 мл', price: 75 },
  ]},
  { id: '20', name: 'Фреш апельсин', price: 75, category: 'drinks', inStock: true, sizes: [
    { id: 's', name: '300 мл', price: 75, isDefault: true },
    { id: 'l', name: '500 мл', price: 95 },
  ]},
];


// ============================================
// HELPERS
// ============================================

/**
 * Transform API product to ProductGrid format
 */
function transformApiProduct(product: ApiProduct): ProductGridProduct {
  return {
    id: String(product.id),
    name: product.name,
    price: product.price,
    image: product.image?.url,
    category: product.category?.slug || '',
    inStock: product.isActive,
    stockQuantity: product.trackInventory ? product.stockQuantity : undefined,
    lowStockThreshold: product.trackInventory ? product.lowStockThreshold : undefined,
    hasModifiers: (product.modifierGroups?.length || 0) > 0,
  };
}

/**
 * Transform API category to Category format
 */
function transformApiCategory(category: { id: number; slug: string; name: string }): Category {
  return {
    id: category.slug,
    name: category.name,
  };
}

/**
 * Transform API product to ModifierModal format
 */
function transformToModifierProduct(product: ApiProduct): ProductForModifier {
  return {
    id: String(product.id),
    name: product.name,
    basePrice: product.price,
    image: product.image?.url,
    modifierGroups: (product.modifierGroups || []).map((group) => ({
      id: String(group.id),
      name: group.displayName || group.name,
      type: group.type,
      required: group.isRequired,
      options: (group.modifiers || []).map((mod) => ({
        id: String(mod.id),
        name: mod.displayName || mod.name,
        price: mod.price,
      })),
    })),
  };
}

// ============================================
// COMPONENT
// ============================================

export default function POSPage() {
  // API Data
  const { data: apiProducts, isLoading: productsLoading, error: productsError } = useProducts({ isActive: true });
  const { data: apiCategories, isLoading: categoriesLoading, error: categoriesError } = useActiveCategories();

  // Transform API data or use mock data as fallback
  const products: ProductGridProduct[] = useMemo(() => {
    if (apiProducts && apiProducts.length > 0) {
      return apiProducts.map(transformApiProduct);
    }
    return mockProducts;
  }, [apiProducts]);

  const categories: Category[] = useMemo(() => {
    if (apiCategories && apiCategories.length > 0) {
      return apiCategories.map(transformApiCategory);
    }
    return mockCategories;
  }, [apiCategories]);

  // Keep reference to original API products for modifier data
  const apiProductsMap = useMemo(() => {
    const map = new Map<string, ApiProduct>();
    if (apiProducts) {
      apiProducts.forEach((p) => map.set(String(p.id), p));
    }
    return map;
  }, [apiProducts]);

  // Zustand store
  const currentOrder = useOrderStore(selectCurrentOrder);
  const isPaymentModalOpen = useOrderStore(selectIsPaymentModalOpen);
  const {
    addItem,
    updateItemQuantity,
    removeItem,
    clearOrder,
    openPaymentModal,
    closePaymentModal,
    completePayment,
    getTotal,
  } = useOrderStore();

  // Local UI state
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Modifier modal state
  const [modifierModalOpen, setModifierModalOpen] = useState(false);
  const [selectedProductForModifier, setSelectedProductForModifier] = useState<ProductForModifier | null>(null);

  // Transform store items to OrderSummary format
  const orderItems: OrderItemData[] = useMemo(() => {
    if (!currentOrder) return [];

    return currentOrder.items.map((item) => ({
      id: item.id,
      productId: item.productId,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      modifiers: item.modifiers,
      notes: item.notes,
    }));
  }, [currentOrder]);

  // Order number from current order
  const orderNumber = useMemo(() => {
    if (!currentOrder) return '---';
    const parts = currentOrder.id.split('-');
    return parts[parts.length - 1] || '---';
  }, [currentOrder]);

  // Handlers
  const handleProductAdd = useCallback((event: ProductAddEvent) => {
    const { product, size } = event;

    // Check if product has modifiers (not sizes)
    if (product.hasModifiers) {
      // Try to get full API product data
      const apiProduct = apiProductsMap.get(product.id);
      if (apiProduct && apiProduct.modifierGroups && apiProduct.modifierGroups.length > 0) {
        setSelectedProductForModifier(transformToModifierProduct(apiProduct));
        setModifierModalOpen(true);
        return;
      }
    }

    // Determine name and price (with size if selected)
    const itemName = size ? `${product.name} (${size.name})` : product.name;
    const itemPrice = size ? size.price : product.price;

    // Add to order with sizeId for inventory tracking
    addItem({
      productId: product.id,
      sizeId: size?.id,
      name: itemName,
      price: itemPrice,
    });
  }, [addItem, apiProductsMap]);

  const handleModifierComplete = useCallback((result: ModifierModalResult) => {
    addItem({
      productId: result.productId,
      name: selectedProductForModifier?.name || '',
      price: result.totalPrice / result.quantity,
      modifiers: result.modifiers,
      notes: result.notes,
    });
  }, [addItem, selectedProductForModifier]);

  const handleQuantityChange = useCallback((itemId: string, quantity: number) => {
    updateItemQuantity(itemId, quantity);
  }, [updateItemQuantity]);

  const handleRemoveItem = useCallback((itemId: string) => {
    removeItem(itemId);
  }, [removeItem]);

  const handleClearOrder = useCallback(() => {
    clearOrder();
  }, [clearOrder]);

  const handleCheckout = useCallback(() => {
    if (orderItems.length > 0) {
      openPaymentModal();
    }
  }, [orderItems.length, openPaymentModal]);

  const handlePaymentComplete = useCallback(async (method: PaymentMethod, received?: number) => {
    setIsProcessingPayment(true);

    const shiftStore = useShiftStore.getState();
    const total = getTotal();

    // Try API-based order creation
    try {
      if (currentOrder) {
        const orderPayload = {
          order: {
            orderNumber: currentOrder.id,
            status: 'completed' as const,
            type: 'dine_in' as const,
            subtotal: total,
            total,
            completedAt: new Date().toISOString(),
          },
          items: currentOrder.items.map((item) => ({
            product: parseInt(item.productId) || undefined,
            productName: item.name,
            quantity: item.quantity,
            unitPrice: item.price,
            totalPrice: item.price * item.quantity,
            modifiers: item.modifiers,
            sizeId: item.sizeId,
            status: 'served' as const,
          })),
          payment: {
            method: method as 'cash' | 'card' | 'qr',
            amount: total,
            receivedAmount: received,
            changeAmount: received ? Math.max(0, received - total) : 0,
          },
        };

        await ordersApi.create({ order: orderPayload.order, items: orderPayload.items, payment: orderPayload.payment });
      }
    } catch {
      // Fall back to local-only
      console.warn('API order creation failed, using local fallback');
    }

    completePayment(method, received);
    setIsProcessingPayment(false);
  }, [completePayment, currentOrder, getTotal]);

  // Loading state
  const isLoading = productsLoading || categoriesLoading;

  return (
    <ShiftGuard>
      <div className={styles.layout}>
        {/* Main content */}
        <main className={styles.main}>
          {/* Product grid */}
          <div className={styles.products}>
            <ProductGrid
              products={products}
              categories={categories}
              selectedCategory={selectedCategory}
              searchQuery={searchQuery}
              onProductAdd={handleProductAdd}
              onCategoryChange={setSelectedCategory}
              onSearchChange={setSearchQuery}
              loading={isLoading}
            />
          </div>

          {/* Order summary */}
          <div className={styles.order}>
            <OrderSummary
              items={orderItems}
              orderNumber={orderNumber}
              onQuantityChange={handleQuantityChange}
              onRemoveItem={handleRemoveItem}
              onClear={handleClearOrder}
              onCheckout={handleCheckout}
              onAddDiscount={() => console.log('Add discount')}
            />
          </div>
        </main>

        {/* Payment Modal */}
        <PaymentModal
          open={isPaymentModalOpen}
          onClose={closePaymentModal}
          total={getTotal()}
          onPaymentComplete={handlePaymentComplete}
          processing={isProcessingPayment}
        />

        {/* Modifier Modal */}
        <ModifierModal
          open={modifierModalOpen}
          onClose={() => {
            setModifierModalOpen(false);
            setSelectedProductForModifier(null);
          }}
          product={selectedProductForModifier}
          onAddToOrder={handleModifierComplete}
        />
      </div>
    </ShiftGuard>
  );
}
