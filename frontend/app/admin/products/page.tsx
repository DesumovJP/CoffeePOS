'use client';

/**
 * ParadisePOS - Products Admin Page
 *
 * Unified product management with five tabs:
 * - Готова продукція (Ready-made products)
 * - Рецепти напоїв (Drink recipes)
 * - Інгредієнти (Ingredients)
 * - Поставки (Supplies)
 * - Списання (Write-offs)
 */

import { useState, useMemo, useCallback } from 'react';
import { Text, Icon, Badge, Button, Modal } from '@/components/atoms';
import { SearchInput, CategoryTabs, type Category } from '@/components/molecules';
import { DataTable, type Column, SuppliesPanel, WriteoffsPanel } from '@/components/organisms';
import {
  useProducts,
  useCategories,
  useIngredients,
  useIngredientCategories,
  useRecipesByProduct,
  useSupplies,
  useWriteoffs,
} from '@/lib/hooks';
import type { Product, Ingredient, IngredientUnit, ApiRecipe } from '@/lib/api';
import styles from './page.module.css';

// ============================================
// TYPES
// ============================================

type ViewMode = 'products' | 'recipes' | 'ingredients' | 'supplies' | 'writeoffs';
type CategoryFilter = 'all' | string;

interface UnifiedProduct {
  id: number;
  name: string;
  category: string;
  categoryName: string;
  type: 'recipe' | 'simple';
  price: number;
  costPrice: number;
  quantity?: number;
  minQuantity?: number;
  isActive: boolean;
  inventoryType: string;
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
    name: product.name,
    category: product.category?.slug || '',
    categoryName: product.category?.name || '',
    type: product.inventoryType === 'recipe' ? 'recipe' : 'simple',
    price: product.price,
    costPrice: product.costPrice || 0,
    quantity: product.stockQuantity,
    minQuantity: product.lowStockThreshold,
    isActive: product.isActive,
    inventoryType: product.inventoryType,
  };
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
// MAIN COMPONENT
// ============================================

export default function ProductsAdminPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('products');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [selectedProduct, setSelectedProduct] = useState<UnifiedProduct | null>(null);

  // API data
  const { data: apiProducts, isLoading: productsLoading } = useProducts();
  const { data: apiCategories } = useCategories();
  const { data: apiIngredients, isLoading: ingredientsLoading } = useIngredients({ pageSize: 200 });
  const { data: apiIngredientCategories } = useIngredientCategories();
  const { data: suppliesData } = useSupplies({});
  const { data: writeoffsData } = useWriteoffs({});

  // Transform products to unified format
  const allProducts = useMemo(() => {
    if (!apiProducts) return [];
    return apiProducts.map(productToUnified);
  }, [apiProducts]);

  // Separate by type
  const products = useMemo(() => allProducts.filter((p) => p.type === 'simple'), [allProducts]);
  const recipes = useMemo(() => allProducts.filter((p) => p.type === 'recipe'), [allProducts]);

  const ingredientsList = apiIngredients || [];

  const activeSuppliesCount = (suppliesData || []).filter((s) => ['ordered', 'shipped'].includes(s.status)).length;

  // View mode tabs
  const viewCategories: Category[] = [
    { id: 'products', name: 'Готова продукція', count: products.length },
    { id: 'recipes', name: 'Рецепти напоїв', count: recipes.length },
    { id: 'ingredients', name: 'Інгредієнти', count: ingredientsList.length },
    { id: 'supplies', name: 'Поставки', count: activeSuppliesCount },
    { id: 'writeoffs', name: 'Списання', count: (writeoffsData || []).length },
  ];

  // Reset filters on view mode change
  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    setCategoryFilter('all');
    setSearch('');
  };

  // Category tabs based on view mode
  const categories = useMemo((): Category[] => {
    if (viewMode === 'ingredients') {
      const lowStockCount = ingredientsList.filter((ing) => ing.quantity <= ing.minQuantity).length;
      const ingCats = (apiIngredientCategories || []).map((cat) => ({
        id: cat.slug,
        name: cat.name,
        count: ingredientsList.filter((ing) => ing.category?.slug === cat.slug).length,
      })).filter((cat) => cat.count > 0);
      return [
        ...ingCats,
        { id: 'low-stock', name: 'Мало', count: lowStockCount },
      ];
    }

    const currentItems = viewMode === 'products' ? products : recipes;
    return (apiCategories || [])
      .map((cat) => ({
        id: cat.slug,
        name: cat.name,
        count: currentItems.filter((p) => p.category === cat.slug).length,
      }))
      .filter((cat) => cat.count > 0);
  }, [viewMode, products, recipes, ingredientsList, apiCategories, apiIngredientCategories]);

  // Filtered data based on view mode
  const filteredProducts = useMemo(() => {
    const currentItems = viewMode === 'products' ? products : recipes;
    return currentItems.filter((item) => {
      if (search && !item.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (categoryFilter !== 'all' && item.category !== categoryFilter) return false;
      return true;
    });
  }, [viewMode, products, recipes, search, categoryFilter]);

  const filteredIngredients = useMemo(() => {
    let result = ingredientsList;
    if (search.trim()) {
      const query = search.toLowerCase();
      result = result.filter((ing) =>
        ing.name.toLowerCase().includes(query) ||
        ing.supplier?.toLowerCase().includes(query)
      );
    }
    if (categoryFilter === 'low-stock') {
      result = result.filter((ing) => ing.quantity <= ing.minQuantity);
    } else if (categoryFilter !== 'all') {
      result = result.filter((ing) => ing.category?.slug === categoryFilter);
    }
    return result;
  }, [ingredientsList, search, categoryFilter]);

  // Product/Recipe columns
  const productColumns: Column<UnifiedProduct>[] = useMemo(() => {
    const cols: Column<UnifiedProduct>[] = [
      {
        key: 'name',
        header: 'Назва',
        render: (product) => (
          <div className={styles.itemName}>
            <Text variant="bodyMedium" weight="medium">{product.name}</Text>
            <Text variant="caption" color="tertiary">{product.categoryName}</Text>
          </div>
        ),
      },
    ];

    if (viewMode === 'products') {
      cols.push({
        key: 'stock',
        header: 'Залишок',
        hideOnMobile: true,
        render: (product) => {
          const isOutOfStock = (product.quantity || 0) <= 0;
          const isLowStock = (product.quantity || 0) > 0 && (product.quantity || 0) <= (product.minQuantity || 0);
          if (isOutOfStock) return <Badge variant="error" size="sm">Немає</Badge>;
          if (isLowStock) return <Badge variant="warning" size="sm">{product.quantity} шт</Badge>;
          return <Text variant="bodySmall" color="secondary">{product.quantity} шт</Text>;
        },
      });
    }

    cols.push({
      key: 'price',
      header: 'Ціна',
      align: 'right',
      render: (product) => (
        <div>
          <Text variant="labelMedium" weight="semibold">₴{product.price.toFixed(0)}</Text>
          <Text variant="caption" color="tertiary">собі: ₴{product.costPrice.toFixed(0)}</Text>
        </div>
      ),
    });

    return cols;
  }, [viewMode]);

  // Ingredient columns
  const ingredientColumns: Column<Ingredient>[] = useMemo(() => [
    {
      key: 'name',
      header: 'Назва',
      render: (ingredient) => {
        const isLowStock = ingredient.quantity <= ingredient.minQuantity;
        return (
          <div className={styles.itemName}>
            <Text variant="bodyMedium" weight="medium">{ingredient.name}</Text>
            {isLowStock && <Badge variant="warning" size="sm">Мало</Badge>}
          </div>
        );
      },
    },
    {
      key: 'category',
      header: 'Категорія',
      hideOnMobile: true,
      render: (ingredient) => (
        <Text variant="bodySmall" color="secondary">{ingredient.category?.name || '—'}</Text>
      ),
    },
    {
      key: 'quantity',
      header: 'Залишок',
      render: (ingredient) => {
        const isLowStock = ingredient.quantity <= ingredient.minQuantity;
        return (
          <Text variant="bodyMedium" weight="semibold" color={isLowStock ? 'error' : 'primary'}>
            {formatQuantity(ingredient.quantity, ingredient.unit)}
          </Text>
        );
      },
    },
    {
      key: 'minQuantity',
      header: 'Мін. запас',
      hideOnMobile: true,
      hideOnTablet: true,
      render: (ingredient) => (
        <Text variant="bodySmall" color="tertiary">
          {formatQuantity(ingredient.minQuantity, ingredient.unit)}
        </Text>
      ),
    },
    {
      key: 'costPerUnit',
      header: 'Ціна/од.',
      hideOnMobile: true,
      render: (ingredient) => (
        <Text variant="bodySmall">₴{ingredient.costPerUnit.toFixed(2)}/{UNIT_LABELS[ingredient.unit]}</Text>
      ),
    },
    {
      key: 'supplier',
      header: 'Постачальник',
      hideOnMobile: true,
      hideOnTablet: true,
      render: (ingredient) => (
        <Text variant="bodySmall" color="secondary">{ingredient.supplier || '—'}</Text>
      ),
    },
    {
      key: 'actions',
      header: 'Дії',
      align: 'right',
      render: (ingredient) => (
        <div className={styles.actions}>
          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); }}>
            <Icon name="plus" size="sm" />
          </Button>
          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); }}>
            <Icon name="edit" size="sm" />
          </Button>
        </div>
      ),
    },
  ], []);

  const getIngredientRowClassName = useCallback((ingredient: Ingredient) => {
    return ingredient.quantity <= ingredient.minQuantity ? styles.lowStockRow : '';
  }, []);

  const handleProductClick = useCallback((product: UnifiedProduct) => {
    setSelectedProduct(product);
  }, []);

  const isLoading = viewMode === 'ingredients' ? ingredientsLoading : productsLoading;

  return (
    <div className={styles.page}>
      {/* View Mode Toggle */}
      <div className={styles.viewToggle}>
        <CategoryTabs
          categories={viewCategories}
          value={viewMode}
          showAll={false}
          onChange={(id) => id && handleViewModeChange(id as ViewMode)}
        />
      </div>

      {/* Tab Content */}
      {viewMode === 'supplies' ? (
        <SuppliesPanel />
      ) : viewMode === 'writeoffs' ? (
        <WriteoffsPanel />
      ) : (
        <>
          {/* Toolbar */}
          <div className={styles.toolbar}>
            <CategoryTabs
              categories={categories}
              value={categoryFilter === 'all' ? null : categoryFilter}
              showAll={true}
              allLabel="Всі"
              onChange={(id) => setCategoryFilter(id || 'all')}
            />
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder={
                viewMode === 'products' ? 'Пошук продукції...' :
                viewMode === 'recipes' ? 'Пошук рецептів...' :
                'Пошук інгредієнтів...'
              }
              variant="glass"
            />
          </div>

          {/* Data Table - different based on view mode */}
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
                title: viewMode === 'products' ? 'Продукцію не знайдено' : 'Рецептів не знайдено'
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
        </>
      )}
    </div>
  );
}
