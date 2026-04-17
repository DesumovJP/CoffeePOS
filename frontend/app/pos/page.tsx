'use client';

/**
 * CoffeePOS - POS Interface
 *
 * Main point of sale interface
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
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
import { Icon, Text } from '@/components/atoms';
import { SegmentedControl } from '@/components/molecules';
import {
  useOrderStore,
  selectCurrentOrder,
  selectIsPaymentModalOpen,
  useShiftStore,
  usePreferencesStore,
} from '@/lib/store';
import { useProducts, useActiveCategories, useRecipes, useKeyboardShortcuts, type ShortcutConfig } from '@/lib/hooks';
import type { Product as ApiProduct } from '@/lib/api';
import { ordersApi, productsApi } from '@/lib/api';
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
  { id: '2', name: 'Американо', price: 55, category: 'coffee', inStock: true, variants: [
    { id: 's', name: '250 мл', price: 55, isDefault: true },
    { id: 'm', name: '350 мл', price: 65 },
    { id: 'l', name: '450 мл', price: 75 },
  ]},
  { id: '3', name: 'Капучіно', price: 65, category: 'coffee', inStock: true, variants: [
    { id: 's', name: '250 мл', price: 65, isDefault: true },
    { id: 'm', name: '350 мл', price: 75 },
    { id: 'l', name: '450 мл', price: 85 },
  ]},
  { id: '4', name: 'Латте', price: 70, category: 'coffee', inStock: true, variants: [
    { id: 's', name: '300 мл', price: 70, isDefault: true },
    { id: 'm', name: '400 мл', price: 85 },
    { id: 'l', name: '500 мл', price: 95 },
  ]},
  { id: '5', name: 'Флет Вайт', price: 75, category: 'coffee', inStock: true },
  { id: '6', name: 'Раф', price: 85, category: 'coffee', inStock: true, variants: [
    { id: 's', name: '300 мл', price: 85, isDefault: true },
    { id: 'm', name: '400 мл', price: 100 },
  ]},
  { id: '7', name: 'Мокко', price: 80, category: 'coffee', inStock: true },
  { id: '8', name: 'Айс Латте', price: 75, category: 'coffee', inStock: true, variants: [
    { id: 'm', name: '400 мл', price: 75, isDefault: true },
    { id: 'l', name: '500 мл', price: 90 },
  ]},
  { id: '9', name: 'Чорний чай', price: 40, category: 'tea', inStock: true, variants: [
    { id: 's', name: '300 мл', price: 40, isDefault: true },
    { id: 'l', name: '500 мл', price: 55 },
  ]},
  { id: '10', name: 'Зелений чай', price: 45, category: 'tea', inStock: true, variants: [
    { id: 's', name: '300 мл', price: 45, isDefault: true },
    { id: 'l', name: '500 мл', price: 60 },
  ]},
  { id: '11', name: 'Матча Латте', price: 85, category: 'tea', inStock: true, variants: [
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
  { id: '19', name: 'Лимонад', price: 55, category: 'drinks', inStock: true, variants: [
    { id: 's', name: '300 мл', price: 55, isDefault: true },
    { id: 'l', name: '500 мл', price: 75 },
  ]},
  { id: '20', name: 'Фреш апельсин', price: 75, category: 'drinks', inStock: true, variants: [
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
function transformApiProduct(
  product: ApiProduct,
  recipesMap: Map<number, Array<{ id: string; name: string; price: number; isDefault?: boolean }>>,
): ProductGridProduct {
  const variants = recipesMap.get(product.id);
  return {
    id: String(product.id),
    documentId: product.documentId,
    name: product.name,
    price: product.price,
    image: product.image?.url,
    category: product.category?.slug || '',
    inStock: product.isActive,
    stockQuantity: product.trackInventory ? product.stockQuantity : undefined,
    lowStockThreshold: product.trackInventory ? product.lowStockThreshold : undefined,
    hasModifiers: (product.modifierGroups?.length || 0) > 0,
    variants: variants && variants.length > 1 ? variants : undefined,
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
    documentId: product.documentId,
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
// POS SETTINGS POPOVER
// ============================================

function PosSettingsPopover({
  showShortcuts,
  setShowShortcuts,
}: {
  showShortcuts: boolean;
  setShowShortcuts: (fn: (v: boolean) => boolean) => void;
}) {
  const posGridColumns = usePreferencesStore((s) => s.posGridColumns);
  const posCardSize = usePreferencesStore((s) => s.posCardSize);
  const setPosGridColumns = usePreferencesStore((s) => s.setPosGridColumns);
  const setPosCardSize = usePreferencesStore((s) => s.setPosCardSize);

  return (
    <div className={styles.shortcutsIndicator}>
      <button
        type="button"
        className={styles.shortcutsButton}
        onClick={() => setShowShortcuts((v: boolean) => !v)}
        title="Налаштування"
        aria-label="Налаштування відображення"
      >
        <Icon name="settings" size="sm" color="secondary" />
      </button>
      {showShortcuts && (
        <div className={styles.shortcutsTooltip}>
          {/* Grid settings */}
          <Text variant="labelMedium" weight="semibold">Сітка товарів</Text>
          <div className={styles.settingRow}>
            <Text variant="bodySmall" color="secondary">Колонки</Text>
            <div className={styles.columnButtons}>
              {[null, 2, 3, 4, 5, 6].map((cols) => (
                <button
                  key={cols ?? 'auto'}
                  type="button"
                  className={`${styles.columnBtn} ${posGridColumns === cols ? styles.columnBtnActive : ''}`}
                  onClick={() => setPosGridColumns(cols)}
                >
                  {cols ?? 'Auto'}
                </button>
              ))}
            </div>
          </div>
          <div className={styles.settingRow}>
            <Text variant="bodySmall" color="secondary">Розмір</Text>
            <div className={styles.columnButtons}>
              {(['small', 'medium', 'large'] as const).map((size) => (
                <button
                  key={size}
                  type="button"
                  className={`${styles.columnBtn} ${posCardSize === size ? styles.columnBtnActive : ''}`}
                  onClick={() => setPosCardSize(size)}
                >
                  {size === 'small' ? 'S' : size === 'medium' ? 'M' : 'L'}
                </button>
              ))}
            </div>
          </div>

          {/* Keyboard shortcuts */}
          <div className={styles.settingDivider} />
          <Text variant="labelMedium" weight="semibold">Гарячі клавіші</Text>
          <div className={styles.shortcutsList}>
            <div className={styles.shortcutItem}>
              <kbd className={styles.kbd}>Enter</kbd>
              <Text variant="bodySmall" color="secondary">Оплата</Text>
            </div>
            <div className={styles.shortcutItem}>
              <kbd className={styles.kbd}>Esc</kbd>
              <Text variant="bodySmall" color="secondary">Закрити</Text>
            </div>
            <div className={styles.shortcutItem}>
              <kbd className={styles.kbd}>F1</kbd>
              <Text variant="bodySmall" color="secondary">Пошук</Text>
            </div>
            <div className={styles.shortcutItem}>
              <kbd className={styles.kbd}>Del</kbd>
              <Text variant="bodySmall" color="secondary">Очистити</Text>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// COMPONENT
// ============================================

export default function POSPage() {
  // API Data
  const { data: apiProducts, isLoading: productsLoading, error: productsError } = useProducts({ isActive: true });
  const { data: apiCategories, isLoading: categoriesLoading, error: categoriesError } = useActiveCategories();
  const { data: apiRecipes } = useRecipes();

  // Build recipes map: productId → variants array
  const recipesMap = useMemo(() => {
    const map = new Map<number, Array<{ id: string; name: string; price: number; isDefault?: boolean }>>();
    if (apiRecipes) {
      for (const recipe of apiRecipes) {
        if (!recipe.product) continue;
        const productId = recipe.product.id;
        if (!map.has(productId)) map.set(productId, []);
        map.get(productId)!.push({
          id: recipe.variantId,
          name: recipe.variantName,
          price: recipe.price,
          isDefault: recipe.isDefault || undefined,
        });
      }
    }
    return map;
  }, [apiRecipes]);

  // Transform API data or use mock data as fallback
  const products: ProductGridProduct[] = useMemo(() => {
    if (apiProducts && apiProducts.length > 0) {
      return apiProducts.map((p) => transformApiProduct(p, recipesMap));
    }
    return mockProducts;
  }, [apiProducts, recipesMap]);

  const categories: Category[] = useMemo(() => {
    if (apiCategories && apiCategories.length > 0) {
      return apiCategories.map(transformApiCategory);
    }
    return mockCategories;
  }, [apiCategories]);

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

  // Keyboard shortcuts tooltip
  const [showShortcuts, setShowShortcuts] = useState(false);

  // Search (triggered from AppShell header search icon)
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  useEffect(() => {
    const handler = () => setMobileSearchOpen(true);
    window.addEventListener('appshell:search', handler);
    return () => window.removeEventListener('appshell:search', handler);
  }, []);


  // Transform store items to OrderSummary format
  const orderItems: OrderItemData[] = useMemo(() => {
    if (!currentOrder) return [];

    return currentOrder.items.map((item) => ({
      id: item.id,
      productId: item.productId,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      image: item.image,
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

  // Mobile cart drawer (side panel)
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);

  useEffect(() => {
    if (orderItems.length === 0) setCartDrawerOpen(false);
  }, [orderItems.length]);

  // Handlers
  const handleProductAdd = useCallback(async (event: ProductAddEvent) => {
    const { product, size } = event;

    // Check if product has modifiers (not variants)
    if (product.hasModifiers && product.documentId) {
      // Fetch product with modifiers on-demand
      try {
        const response = await productsApi.getById(product.documentId);
        const apiProduct = response.data;
        if (apiProduct && apiProduct.modifierGroups && apiProduct.modifierGroups.length > 0) {
          setSelectedProductForModifier(transformToModifierProduct(apiProduct));
          setModifierModalOpen(true);
          return;
        }
      } catch {
        // Fallback: add without modifiers
      }
    }

    // Determine name and price (with size if selected)
    const itemName = size ? `${product.name} (${size.name})` : product.name;
    const itemPrice = size ? size.price : product.price;

    // Add to order with variantId for inventory tracking
    addItem({
      productId: product.id,
      productDocumentId: product.documentId,
      variantId: size?.id,
      name: itemName,
      price: itemPrice,
      image: product.image,
    });
  }, [addItem]);

  const handleModifierComplete = useCallback((result: ModifierModalResult) => {
    addItem({
      productId: result.productId,
      productDocumentId: result.productDocumentId,
      name: selectedProductForModifier?.name || '',
      price: result.totalPrice / result.quantity,
      image: selectedProductForModifier?.image,
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
            productDocumentId: item.productDocumentId,
            productName: item.name,
            quantity: item.quantity,
            unitPrice: item.price,
            totalPrice: item.price * item.quantity,
            modifiers: item.modifiers,
            variantId: item.variantId,
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
      // Fall back to local-only order tracking
    }

    completePayment(method, received);
    setIsProcessingPayment(false);
  }, [completePayment, currentOrder, getTotal]);

  // Loading state
  const isLoading = productsLoading || categoriesLoading;

  // Keyboard shortcuts
  const shortcuts: ShortcutConfig[] = useMemo(() => [
    {
      key: 'Enter',
      action: () => {
        if (orderItems.length > 0 && !isPaymentModalOpen) {
          openPaymentModal();
        }
      },
      description: 'Відкрити оплату',
    },
    {
      key: 'Escape',
      action: () => {
        if (isPaymentModalOpen) {
          closePaymentModal();
        } else if (modifierModalOpen) {
          setModifierModalOpen(false);
          setSelectedProductForModifier(null);
        } else if (searchQuery) {
          setSearchQuery('');
        } else if (showShortcuts) {
          setShowShortcuts(false);
        }
      },
      description: 'Закрити модальне вікно / Очистити пошук',
    },
    {
      key: 'F1',
      action: () => {
        const searchInput = document.querySelector<HTMLInputElement>('input[type="search"]');
        if (searchInput) {
          searchInput.focus();
        }
      },
      description: 'Фокус на пошук',
    },
    {
      key: 'Delete',
      action: () => {
        if (orderItems.length > 0 && !isPaymentModalOpen) {
          if (window.confirm('Очистити кошик?')) {
            clearOrder();
          }
        }
      },
      description: 'Очистити кошик',
    },
  ], [orderItems.length, isPaymentModalOpen, modifierModalOpen, searchQuery, openPaymentModal, closePaymentModal, clearOrder, showShortcuts]);

  useKeyboardShortcuts(shortcuts);

  return (
    <ShiftGuard>
      <div className={styles.layout}>
        {/* Main content */}
        <main className={styles.main}>
          {/* Product grid */}
          <div className={`${styles.products} ${orderItems.length === 0 ? styles.productsFullHeight : ''}`}>
            <ProductGrid
              products={products}
              categories={categories}
              selectedCategory={selectedCategory}
              searchQuery={searchQuery}
              onProductAdd={handleProductAdd}
              onCategoryChange={setSelectedCategory}
              onSearchChange={setSearchQuery}
              loading={isLoading}
              mobileSearchOpen={mobileSearchOpen}
              onMobileSearchClose={() => setMobileSearchOpen(false)}
              headerExtra={
                <PosSettingsPopover showShortcuts={showShortcuts} setShowShortcuts={setShowShortcuts} />
              }
            />
          </div>

          {/* Order summary — desktop/tablet inline panel */}
          <div className={styles.order}>
            <OrderSummary
              items={orderItems}
              orderNumber={orderNumber}
              onQuantityChange={handleQuantityChange}
              onRemoveItem={handleRemoveItem}
              onClear={handleClearOrder}
              onCheckout={handleCheckout}
              onAddDiscount={() => {}}
            />
          </div>
        </main>

        {/* Mobile: cart FAB + side drawer */}
        {orderItems.length > 0 && (
          <button
            type="button"
            className={styles.cartFab}
            onClick={() => setCartDrawerOpen(true)}
            aria-label={`Кошик — ${orderItems.reduce((s, i) => s + i.quantity, 0)} позицій`}
          >
            <Icon name="cart" size="md" />
            <span className={styles.cartFabBadge}>
              {orderItems.reduce((s, i) => s + i.quantity, 0)}
            </span>
          </button>
        )}

        {cartDrawerOpen && (
          <>
            <div className={styles.cartOverlay} onClick={() => setCartDrawerOpen(false)} aria-hidden="true" />
            <div className={styles.cartDrawer}>
              <OrderSummary
                items={orderItems}
                orderNumber={orderNumber}
                onQuantityChange={handleQuantityChange}
                onRemoveItem={handleRemoveItem}
                onClear={handleClearOrder}
                onCheckout={() => { setCartDrawerOpen(false); handleCheckout(); }}
                onAddDiscount={() => {}}
              />
            </div>
          </>
        )}

        {/* Payment Modal */}
        <PaymentModal
          open={isPaymentModalOpen}
          onClose={closePaymentModal}
          total={getTotal()}
          onPaymentComplete={handlePaymentComplete}
          processing={isProcessingPayment}
          onPrintReceipt={() => window.print()}
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
