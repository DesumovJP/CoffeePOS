'use client';

/**
 * CoffeePOS - Products Admin Page
 *
 * Product & ingredient management with two tabs:
 * - Продукція (Products)
 * - Інгредієнти (Ingredients)
 */

import { useState, useMemo, useCallback, useEffect } from 'react';
import { Text, Icon, Badge, Button, Modal } from '@/components/atoms';
import { SearchInput, SegmentedControl } from '@/components/molecules';
import {
  DataTable,
  type Column,
  ProductFormModal,
  IngredientFormModal,
  IngredientDetailModal,
} from '@/components/organisms';
import {
  useProducts,
  useCategories,
  useIngredients,
  useIngredientCategories,
  useRecipesByProduct,
  useDeleteProduct,
  useDeleteIngredient,
} from '@/lib/hooks';
import { useQueryClient } from '@tanstack/react-query';
import { productKeys, ingredientKeys } from '@/lib/hooks';
import type {
  Product,
  Ingredient,
  IngredientUnit,
  ApiRecipe,
} from '@/lib/api';
import styles from './page.module.css';

// ============================================
// TYPES
// ============================================

type ViewMode = 'products' | 'ingredients';

interface UnifiedProduct {
  id: number;
  documentId: string;
  name: string;
  category: string;
  categoryName: string;
  type: 'recipe' | 'simple';
  price: number;
  costPrice: number;
  trackInventory: boolean;
  quantity?: number;
  minQuantity?: number;
  isActive: boolean;
  inventoryType: string;
  image?: string;
}

// ============================================
// CONSTANTS
// ============================================

const UNIT_LABELS: Record<IngredientUnit, string> = {
  g: 'г',
  kg: 'кг',
  ml: 'мл',
  l: 'л',
  pcs: 'шт',
  portion: 'порц',
};

// ============================================
// HELPERS
// ============================================

function productToUnified(product: Product): UnifiedProduct {
  return {
    id: product.id,
    documentId: product.documentId,
    name: product.name,
    category: product.category?.slug || '',
    categoryName: product.category?.name || '',
    type: product.inventoryType === 'recipe' ? 'recipe' : 'simple',
    price: product.price,
    costPrice: product.costPrice || 0,
    trackInventory: product.trackInventory ?? false,
    quantity: product.stockQuantity,
    minQuantity: product.lowStockThreshold,
    isActive: product.isActive,
    inventoryType: product.inventoryType,
    image: product.image?.formats?.thumbnail?.url || product.image?.url,
  };
}

function formatSmartCost(costPerUnit: number, unit: IngredientUnit): string {
  switch (unit) {
    case 'g':   return `₴${(costPerUnit * 1000).toFixed(0)}/кг`;
    case 'ml':  return `₴${(costPerUnit * 100).toFixed(2)}/100мл`;
    case 'kg':  return `₴${costPerUnit.toFixed(2)}/кг`;
    case 'l':   return `₴${costPerUnit.toFixed(2)}/л`;
    case 'pcs': return `₴${costPerUnit.toFixed(2)}/шт`;
    case 'portion': return `₴${costPerUnit.toFixed(2)}/порц`;
    default:    return `₴${costPerUnit.toFixed(2)}`;
  }
}

function formatQuantity(quantity: number, unit: IngredientUnit): string {
  if (unit === 'g' && quantity >= 1000) {
    return `${(quantity / 1000).toFixed(1)} кг`;
  }
  if (unit === 'ml' && quantity >= 1000) {
    return `${(quantity / 1000).toFixed(1)} л`;
  }
  return `${quantity} ${UNIT_LABELS[unit]}`;
}

// ============================================
// PRODUCT DETAIL MODAL
// ============================================

interface ProductModalProps {
  product: UnifiedProduct;
  ingredients: Ingredient[];
  onClose: () => void;
}

function ProductModal({ product, ingredients, onClose }: ProductModalProps) {
  const { data: recipeSizes } = useRecipesByProduct(product.id);

  const [selectedSizeIdx, setSelectedSizeIdx] = useState(0);

  // Find default size
  const defaultIdx = useMemo(() => {
    if (!recipeSizes?.length) return 0;
    const idx = recipeSizes.findIndex((r: ApiRecipe) => r.isDefault);
    return idx >= 0 ? idx : 0;
  }, [recipeSizes]);

  const currentIdx = recipeSizes?.length ? selectedSizeIdx : defaultIdx;
  const selectedRecipe = recipeSizes?.[currentIdx];

  // Look up ingredient info for recipe display
  const recipeIngredients = useMemo(() => {
    if (!selectedRecipe?.ingredients) return null;
    return selectedRecipe.ingredients.map((ri: { ingredientId: number; amount: number }) => {
      const ing = ingredients.find((i) => i.id === ri.ingredientId);
      return {
        name: ing?.name || `ID: ${ri.ingredientId}`,
        unit: ing?.unit || 'g',
        costPerUnit: ing?.costPerUnit || 0,
        amount: ri.amount,
      };
    });
  }, [selectedRecipe, ingredients]);

  const totalCost = useMemo(() => {
    if (!recipeIngredients) return product.costPrice;
    return recipeIngredients.reduce((sum, item) => sum + item.amount * item.costPerUnit, 0);
  }, [recipeIngredients, product.costPrice]);

  const price = selectedRecipe?.price || product.price;
  const margin = price > 0 ? ((price - totalCost) / price) * 100 : 0;

  // Set default size on load
  useMemo(() => {
    if (recipeSizes?.length && selectedSizeIdx === 0) {
      const defIdx = recipeSizes.findIndex((r: ApiRecipe) => r.isDefault);
      if (defIdx >= 0) setSelectedSizeIdx(defIdx);
    }
  }, [recipeSizes, selectedSizeIdx]);

  return (
    <Modal
      open={true}
      onClose={onClose}
      title={product.name}
      subtitle={product.categoryName}
      icon="package"
      size="md"
    >
          {recipeSizes && recipeSizes.length > 1 && (
            <div className={styles.sizeTabs}>
              {recipeSizes.map((recipe: ApiRecipe, idx: number) => (
                <button
                  key={recipe.sizeId}
                  className={`${styles.sizeTab} ${currentIdx === idx ? styles.active : ''}`}
                  onClick={() => setSelectedSizeIdx(idx)}
                >
                  {recipe.sizeName} {recipe.sizeVolume && `(${recipe.sizeVolume})`}
                </button>
              ))}
            </div>
          )}

          <div className={styles.modalSection}>
            <Text variant="labelMedium" weight="semibold" className={styles.sectionTitle}>
              Інформація
            </Text>

            <div className={styles.detailRow}>
              <Text variant="bodySmall" className={styles.detailLabel}>Тип</Text>
              <Badge variant={product.type === 'recipe' ? 'info' : 'default'} size="sm">
                {product.type === 'recipe' ? 'Рецепт' : 'Готовий товар'}
              </Badge>
            </div>

            <div className={styles.detailRow}>
              <Text variant="bodySmall" className={styles.detailLabel}>Ціна продажу</Text>
              <Text variant="labelMedium" weight="semibold" className={styles.detailValue}>
                ₴{price.toFixed(2)}
              </Text>
            </div>

            <div className={styles.detailRow}>
              <Text variant="bodySmall" className={styles.detailLabel}>Собівартість</Text>
              <Text variant="bodySmall" className={styles.detailValue}>
                ₴{totalCost.toFixed(2)}
              </Text>
            </div>

            <div className={styles.detailRow}>
              <Text variant="bodySmall" className={styles.detailLabel}>Маржа</Text>
              <Text
                variant="labelSmall"
                weight="semibold"
                color={margin >= 50 ? 'success' : margin >= 30 ? 'warning' : 'error'}
                className={styles.detailValue}
              >
                {margin.toFixed(1)}%
              </Text>
            </div>

            {product.type === 'simple' && (
              <>
                <div className={styles.detailRow}>
                  <Text variant="bodySmall" className={styles.detailLabel}>Залишок</Text>
                  <Text
                    variant="labelMedium"
                    weight="semibold"
                    color={(product.quantity || 0) <= 0 ? 'error' : (product.quantity || 0) <= (product.minQuantity || 0) ? 'warning' : undefined}
                    className={styles.detailValue}
                  >
                    {product.quantity} шт
                  </Text>
                </div>
                <div className={styles.detailRow}>
                  <Text variant="bodySmall" className={styles.detailLabel}>Мін. залишок</Text>
                  <Text variant="bodySmall" className={styles.detailValue}>{product.minQuantity} шт</Text>
                </div>
              </>
            )}
          </div>

          {recipeIngredients && (
            <div className={styles.modalSection}>
              <Text variant="labelMedium" weight="semibold" className={styles.sectionTitle}>
                Рецепт {selectedRecipe?.sizeVolume && `(${selectedRecipe.sizeVolume})`}
              </Text>

              <div className={styles.recipeTableWrapper}>
                <table className={styles.recipeTable}>
                  <thead>
                    <tr>
                      <th>Інгредієнт</th>
                      <th>Кількість</th>
                      <th className={styles.alignRight}>Вартість</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recipeIngredients.map((item, idx) => {
                      const cost = item.amount * item.costPerUnit;
                      return (
                        <tr key={idx}>
                          <td><Text variant="bodySmall">{item.name}</Text></td>
                          <td><Text variant="bodySmall" color="secondary">{item.amount} {item.unit}</Text></td>
                          <td className={styles.alignRight}><Text variant="bodySmall">₴{cost.toFixed(2)}</Text></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className={styles.recipeTotal}>
                <Text variant="labelMedium" weight="semibold">Загальна собівартість</Text>
                <Text variant="labelMedium" weight="semibold">₴{totalCost.toFixed(2)}</Text>
              </div>
            </div>
          )}
    </Modal>
  );
}

// ============================================
// DELETE CONFIRM MODAL
// ============================================

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  isDeleting: boolean;
}

function DeleteConfirmModal({ isOpen, onClose, onConfirm, title, description, isDeleting }: DeleteConfirmModalProps) {
  const footer = (
    <Button variant="danger" onClick={onConfirm} loading={isDeleting} fullWidth>
      Видалити
    </Button>
  );

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title={title}
      icon="delete"
      variant="error"
      size="sm"
      footer={footer}
    >
      <Text variant="bodyMedium" color="secondary">{description}</Text>
    </Modal>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function ProductsAdminPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('products');
  const [search, setSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<UnifiedProduct | null>(null);
  const [selectedIngredient, setSelectedIngredient] = useState<Ingredient | null>(null);

  // CRUD modal states
  const [productModal, setProductModal] = useState<{ isOpen: boolean; product: Product | null }>({ isOpen: false, product: null });
  const [ingredientModal, setIngredientModal] = useState<{ isOpen: boolean; ingredient: Ingredient | null }>({ isOpen: false, ingredient: null });

  // Delete confirmation state
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    type: 'product' | 'ingredient';
    documentId: string;
    name: string;
  } | null>(null);

  // React Query
  const queryClient = useQueryClient();

  // API data
  const { data: apiProducts, isLoading: productsLoading } = useProducts();
  const { data: apiCategories } = useCategories();
  const { data: apiIngredients, isLoading: ingredientsLoading } = useIngredients({ pageSize: 200 });
  const { data: apiIngredientCategories } = useIngredientCategories();

  // Delete mutations
  const deleteProductMutation = useDeleteProduct();
  const deleteIngredientMutation = useDeleteIngredient();

  // Transform products to unified format
  const allProducts = useMemo(() => {
    if (!apiProducts) return [];
    return apiProducts.map(productToUnified);
  }, [apiProducts]);

  // Only show non-recipe products (готова/фізична продукція)
  const products = allProducts.filter((p) => p.type !== 'recipe');

  const ingredientsList = apiIngredients || [];

  // Reset search on view mode change
  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    setSearch('');
  };

  // Filtered data — search only, no category filter
  const filteredProducts = useMemo(() => {
    if (!search) return products;
    const q = search.toLowerCase();
    return products.filter((item) => item.name.toLowerCase().includes(q));
  }, [products, search]);

  const filteredIngredients = useMemo(() => {
    if (!search.trim()) return ingredientsList;
    const q = search.toLowerCase();
    return ingredientsList.filter((ing) =>
      ing.name.toLowerCase().includes(q) ||
      ing.supplier?.toLowerCase().includes(q)
    );
  }, [ingredientsList, search]);

  // ============================================
  // CRUD HANDLERS
  // ============================================

  // Find the original Product object by UnifiedProduct id
  const findOriginalProduct = useCallback(
    (documentId: string): Product | null => {
      return apiProducts?.find((p) => p.documentId === documentId) || null;
    },
    [apiProducts]
  );

  // Product CRUD
  const handleCreateProduct = useCallback(() => {
    setProductModal({ isOpen: true, product: null });
  }, []);

  const handleEditProduct = useCallback(
    (documentId: string) => {
      const original = findOriginalProduct(documentId);
      if (original) {
        setProductModal({ isOpen: true, product: original });
      }
    },
    [findOriginalProduct]
  );

  const handleDeleteProduct = useCallback((documentId: string, name: string) => {
    setDeleteConfirm({ isOpen: true, type: 'product', documentId, name });
  }, []);

  const handleProductSuccess = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: productKeys.lists() });
  }, [queryClient]);

  // Ingredient CRUD
  const handleCreateIngredient = useCallback(() => {
    setIngredientModal({ isOpen: true, ingredient: null });
  }, []);

  const handleEditIngredient = useCallback(
    (ingredient: Ingredient) => {
      setIngredientModal({ isOpen: true, ingredient });
    },
    []
  );

  const handleDeleteIngredient = useCallback((documentId: string, name: string) => {
    setDeleteConfirm({ isOpen: true, type: 'ingredient', documentId, name });
  }, []);

  const handleIngredientSuccess = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ingredientKeys.lists() });
  }, [queryClient]);

  // Delete confirmation handler
  const handleConfirmDelete = useCallback(async () => {
    if (!deleteConfirm) return;

    try {
      if (deleteConfirm.type === 'product') {
        await deleteProductMutation.mutateAsync(deleteConfirm.documentId);
      } else if (deleteConfirm.type === 'ingredient') {
        await deleteIngredientMutation.mutateAsync(deleteConfirm.documentId);
      }
      setDeleteConfirm(null);
    } catch {
      // Error is handled by mutation
    }
  }, [deleteConfirm, deleteProductMutation, deleteIngredientMutation]);

  // ============================================
  // COLUMNS
  // ============================================

  // Product/Recipe columns
  const productColumns: Column<UnifiedProduct>[] = useMemo(() => [
    {
      key: 'thumbnail',
      header: '',
      width: '52px',
      render: (product) => (
        product.image ? (
          <img src={product.image} alt={product.name} className={styles.thumbnail} />
        ) : (
          <div className={styles.thumbnailPlaceholder}>
            <Icon name="package" size="sm" color="tertiary" />
          </div>
        )
      ),
    },
    {
      key: 'name',
      header: 'Назва',
      width: '40%',
      render: (product) => (
        <div className={styles.itemName}>
          <Text variant="bodyMedium" weight="medium">{product.name}</Text>
          <Text variant="caption" color="tertiary">{product.categoryName}</Text>
        </div>
      ),
    },
    {
      key: 'price',
      header: 'Ціна',
      align: 'right',
      width: '80px',
      render: (product) => (
        <Text variant="labelMedium" weight="semibold" className={styles.price}>
          ₴{product.price.toFixed(0)}
        </Text>
      ),
    },
    {
      key: 'stock',
      header: 'Залишок',
      align: 'right',
      width: '110px',
      hideOnMobile: true,
      render: (product) => {
        if (!product.trackInventory) {
          return <Text variant="bodySmall" color="tertiary">—</Text>;
        }
        const qty = product.quantity ?? 0;
        const min = product.minQuantity ?? 0;
        if (qty <= 0) {
          return <Badge variant="error" size="sm">Немає</Badge>;
        }
        if (qty <= min) {
          return <Badge variant="warning" size="sm">{qty} шт</Badge>;
        }
        return <Text variant="bodySmall" color="secondary">{qty} шт</Text>;
      },
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      width: '80px',
      render: (product) => (
        <div className={styles.actions}>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => { e.stopPropagation(); handleEditProduct(product.documentId); }}
          >
            <Icon name="edit" size="sm" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => { e.stopPropagation(); handleDeleteProduct(product.documentId, product.name); }}
          >
            <Icon name="delete" size="sm" />
          </Button>
        </div>
      ),
    },
  ], [handleEditProduct, handleDeleteProduct]);

  // Ingredient columns
  const ingredientColumns: Column<Ingredient>[] = useMemo(() => [
    {
      key: 'thumbnail',
      header: '',
      width: '52px',
      render: (_ingredient) => (
        <div className={styles.thumbnailPlaceholder}>
          <Icon name="package" size="sm" color="tertiary" />
        </div>
      ),
    },
    {
      key: 'name',
      header: 'Назва',
      width: '40%',
      render: (ingredient) => {
        const isLowStock = ingredient.quantity <= ingredient.minQuantity;
        const isOutOfStock = ingredient.quantity <= 0;
        return (
          <div className={styles.itemName}>
            <Text variant="bodyMedium" weight="medium">{ingredient.name}</Text>
            {isOutOfStock
              ? <Badge variant="error" size="sm">Немає</Badge>
              : isLowStock
              ? <Badge variant="warning" size="sm">Мало</Badge>
              : null}
          </div>
        );
      },
    },
    {
      key: 'quantity',
      header: 'Залишок',
      width: '160px',
      render: (ingredient) => {
        const isLowStock = ingredient.quantity <= ingredient.minQuantity;
        const isOutOfStock = ingredient.quantity <= 0;
        // Progress: current vs 2× minimum (so "full" = 2× min)
        const max = (ingredient.minQuantity || 1) * 2;
        const pct = Math.min(100, (ingredient.quantity / max) * 100);
        const fillClass = isOutOfStock
          ? styles.stockBarFillCritical
          : isLowStock
          ? styles.stockBarFillLow
          : styles.stockBarFill;
        return (
          <div className={styles.stockCell}>
            <Text variant="bodySmall" weight="semibold" color={isOutOfStock ? 'error' : isLowStock ? 'warning' : 'primary'}>
              {formatQuantity(ingredient.quantity, ingredient.unit)}
            </Text>
            <div className={styles.stockBar}>
              <div className={`${styles.stockBarFillBase} ${fillClass}`} style={{ width: `${pct}%` }} />
            </div>
          </div>
        );
      },
    },
    {
      key: 'costPerUnit',
      header: 'Ціна/од.',
      width: '110px',
      hideOnMobile: true,
      render: (ingredient) => (
        <Text variant="bodySmall" color="secondary">
          {formatSmartCost(ingredient.costPerUnit, ingredient.unit)}
        </Text>
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      width: '80px',
      render: (ingredient) => (
        <div className={styles.actions}>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => { e.stopPropagation(); handleEditIngredient(ingredient); }}
          >
            <Icon name="edit" size="sm" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => { e.stopPropagation(); handleDeleteIngredient(ingredient.documentId, ingredient.name); }}
          >
            <Icon name="delete" size="sm" />
          </Button>
        </div>
      ),
    },
  ], [handleEditIngredient, handleDeleteIngredient]);

  const getIngredientRowClassName = useCallback((ingredient: Ingredient) => {
    return ingredient.quantity <= ingredient.minQuantity ? styles.lowStockRow : '';
  }, []);

  const handleProductClick = useCallback((product: UnifiedProduct) => {
    setSelectedProduct(product);
  }, []);

  const handleIngredientClick = useCallback((ingredient: Ingredient) => {
    setSelectedIngredient(ingredient);
  }, []);

  const isLoading = viewMode === 'ingredients' ? ingredientsLoading : productsLoading;

  // ============================================
  // Add button label based on view
  // ============================================

  const addButtonConfig = useMemo(() => {
    switch (viewMode) {
      case 'products':
        return { label: 'Додати продукт', handler: handleCreateProduct };
      case 'ingredients':
        return { label: 'Додати інгредієнт', handler: handleCreateIngredient };
      default:
        return null;
    }
  }, [viewMode, handleCreateProduct, handleCreateIngredient]);

  // Mobile search state
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  // Listen for appshell:search event (from header search button)
  useEffect(() => {
    const handler = () => setMobileSearchOpen(true);
    window.addEventListener('appshell:search', handler);
    return () => window.removeEventListener('appshell:search', handler);
  }, []);

  // Listen for appshell:action event (from header add button)
  useEffect(() => {
    const handler = () => addButtonConfig?.handler();
    window.addEventListener('appshell:action', handler);
    return () => window.removeEventListener('appshell:action', handler);
  }, [addButtonConfig]);

  const closeMobileSearch = useCallback(() => {
    setMobileSearchOpen(false);
    setSearch('');
  }, []);

  // Reset mobile search on view mode change
  const handleViewModeChangeWrapped = useCallback((mode: ViewMode) => {
    handleViewModeChange(mode);
    setMobileSearchOpen(false);
  }, []);

  return (
    <div className={styles.page}>
      {/* View Mode Toggle */}
      <SegmentedControl
        options={[
          { id: 'products', label: 'Продукція' },
          { id: 'ingredients', label: 'Інгредієнти' },
        ]}
        value={viewMode}
        onChange={(id) => handleViewModeChangeWrapped(id as ViewMode)}
      />

      {/* Mobile search bar (shown when triggered from header) */}
      {mobileSearchOpen && (
        <div className={styles.mobileSearchBar}>
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Пошук..."
            variant="glass"
            autoFocus
          />
          <Button
            variant="ghost"
            size="sm"
            iconOnly
            onClick={closeMobileSearch}
            aria-label="Закрити пошук"
            className={styles.mobileSearchClose}
          >
            <Icon name="close" size="md" />
          </Button>
        </div>
      )}

      {/* Data Table */}
      {isLoading ? (
        <div className={styles.loadingState}>
          <Icon name="clock" size="2xl" color="tertiary" />
          <Text variant="bodyLarge" color="secondary">Завантаження...</Text>
        </div>
      ) : viewMode === 'ingredients' ? (
        <DataTable
          columns={ingredientColumns}
          data={filteredIngredients}
          getRowKey={(ing) => String(ing.id)}
          getRowClassName={getIngredientRowClassName}
          onRowClick={handleIngredientClick}
          emptyState={{ icon: 'search', title: 'Інгредієнти не знайдено' }}
        />
      ) : (
        <DataTable
          columns={productColumns}
          data={filteredProducts}
          getRowKey={(product) => String(product.id)}
          onRowClick={handleProductClick}
          emptyState={{
            icon: 'package',
            title: 'Продукцію не знайдено'
          }}
        />
      )}

      {/* Product Detail Modal */}
      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          ingredients={ingredientsList}
          onClose={() => setSelectedProduct(null)}
        />
      )}

      {/* Ingredient Detail Modal */}
      <IngredientDetailModal
        ingredient={selectedIngredient}
        onClose={() => setSelectedIngredient(null)}
        onEdit={(ing) => {
          setSelectedIngredient(null);
          setIngredientModal({ isOpen: true, ingredient: ing });
        }}
      />

      {/* CRUD Modals */}
      <ProductFormModal
        isOpen={productModal.isOpen}
        onClose={() => setProductModal({ isOpen: false, product: null })}
        product={productModal.product}
        categories={apiCategories || []}
        onSuccess={handleProductSuccess}
      />

      <IngredientFormModal
        isOpen={ingredientModal.isOpen}
        onClose={() => setIngredientModal({ isOpen: false, ingredient: null })}
        ingredient={ingredientModal.ingredient}
        categories={apiIngredientCategories || []}
        onSuccess={handleIngredientSuccess}
      />

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <DeleteConfirmModal
          isOpen={deleteConfirm.isOpen}
          onClose={() => setDeleteConfirm(null)}
          onConfirm={handleConfirmDelete}
          title={`Видалити ${
            deleteConfirm.type === 'product' ? 'продукт' : 'інгредієнт'
          }?`}
          description={`Ви впевнені, що хочете видалити "${deleteConfirm.name}"? Цю дію неможливо скасувати.`}
          isDeleting={
            deleteProductMutation.isPending ||
            deleteIngredientMutation.isPending
          }
        />
      )}
    </div>
  );
}
