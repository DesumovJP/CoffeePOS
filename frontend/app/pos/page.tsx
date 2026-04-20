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
  usePreferencesStore,
} from '@/lib/store';
import { useProducts, useActiveCategories, useRecipes, useKeyboardShortcuts, useProductAvailability, productKeys, type ShortcutConfig } from '@/lib/hooks';
import { useQueryClient } from '@tanstack/react-query';
import type { Product as ApiProduct } from '@/lib/api';
import { ordersApi, productsApi } from '@/lib/api';
import { ShiftGuard } from '@/components/organisms/ShiftGuard';
import { useToast } from '@/components/atoms/Toast';
import styles from './page.module.css';

// ============================================
// HELPERS
// ============================================

/**
 * Transform API product to ProductGrid format
 */
function transformApiProduct(
  product: ApiProduct,
  recipesMap: Map<number, Array<{ id: string; name: string; price: number; isDefault?: boolean }>>,
  availability: Record<string, number | null> | undefined,
): ProductGridProduct {
  const variants = recipesMap.get(product.id);

  // Prefer server-computed availability (handles both recipe-based and trackInventory).
  // Fallback: product.stockQuantity for tracked items if availability map is missing.
  const availQty = availability?.[product.documentId];
  const stockQuantity =
    availQty !== undefined && availQty !== null
      ? availQty
      : product.trackInventory
        ? product.stockQuantity
        : undefined;

  return {
    id: String(product.id),
    documentId: product.documentId,
    name: product.name,
    price: product.price,
    image: product.image?.url,
    category: product.category?.slug || '',
    inStock: product.isActive,
    stockQuantity,
    lowStockThreshold: product.lowStockThreshold,
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
  const { addToast } = useToast();
  const queryClient = useQueryClient();

  // API Data
  const { data: apiProducts, isLoading: productsLoading, error: productsError } = useProducts({ isActive: true });
  const { data: apiCategories, isLoading: categoriesLoading, error: categoriesError } = useActiveCategories();
  const { data: apiRecipes } = useRecipes();
  const { data: availability } = useProductAvailability();

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

  const products: ProductGridProduct[] = useMemo(() => {
    if (!apiProducts) return [];
    return apiProducts.map((p) => transformApiProduct(p, recipesMap, availability));
  }, [apiProducts, recipesMap, availability]);

  const categories: Category[] = useMemo(() => {
    if (!apiCategories) return [];
    return apiCategories.map(transformApiCategory);
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
    if (!currentOrder) return;

    setIsProcessingPayment(true);
    const total = getTotal();

    try {
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

      addToast({ type: 'success', title: 'Замовлення оформлено', message: `₴${total.toFixed(0)}`, duration: 3000 });
      queryClient.invalidateQueries({ queryKey: productKeys.availability() });

      // Atomic commit: clear cart + close modal ONLY after server confirmed the order.
      // If the request fails, the cart stays intact so the barista can retry.
      completePayment(method, received);
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Не вдалось оформити замовлення',
        message: err?.message || 'Перевірте з\'єднання та спробуйте ще раз',
        duration: 5000,
      });
    } finally {
      setIsProcessingPayment(false);
    }
  }, [completePayment, currentOrder, getTotal, addToast, queryClient]);

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
              showStock
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
