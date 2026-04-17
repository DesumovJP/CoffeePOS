'use client';

/**
 * CoffeePOS - Recipes Admin Page
 *
 * Manage all recipes: view by product, add/edit/delete sizes and ingredients.
 */

import { useState, useMemo, useCallback, useEffect } from 'react';
import { Text, Icon, Badge, Button, Modal } from '@/components/atoms';
import { SearchInput } from '@/components/molecules';
import { DataTable, type Column, RecipeFormModal } from '@/components/organisms';
import {
  useRecipes,
  useProducts,
  useIngredients,
  useCategories,
  useDeleteRecipe,
  recipeKeys,
} from '@/lib/hooks';
import { useQueryClient } from '@tanstack/react-query';
import type { ApiRecipe } from '@/lib/api';
import styles from './page.module.css';

// ============================================
// MAIN COMPONENT
// ============================================

export default function RecipesAdminPage() {
  const [search, setSearch] = useState('');
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const [recipeModal, setRecipeModal] = useState<{ isOpen: boolean; recipe: ApiRecipe | null }>({
    isOpen: false,
    recipe: null,
  });
  const [deleteConfirm, setDeleteConfirm] = useState<{ documentId: string; name: string } | null>(null);

  // API data
  const { data: recipes, isLoading } = useRecipes();
  const { data: products } = useProducts();
  const { data: ingredients } = useIngredients({ pageSize: 200 });
  const { data: categories } = useCategories();
  const deleteRecipeMutation = useDeleteRecipe();
  const queryClient = useQueryClient();

  // AppShell events
  useEffect(() => {
    const handler = () => setRecipeModal({ isOpen: true, recipe: null });
    window.addEventListener('appshell:action', handler);
    return () => window.removeEventListener('appshell:action', handler);
  }, []);

  useEffect(() => {
    const handler = () => setMobileSearchOpen(true);
    window.addEventListener('appshell:search', handler);
    return () => window.removeEventListener('appshell:search', handler);
  }, []);

  // Product image + category maps for thumbnails and filtering
  const productImageMap = useMemo(() => {
    const map = new Map<number, string>();
    (products || []).forEach((p) => {
      const url = p.image?.formats?.thumbnail?.url || p.image?.url;
      if (url) map.set(p.id, url);
    });
    return map;
  }, [products]);

  const productCategoryMap = useMemo(() => {
    const map = new Map<number, string>();
    (products || []).forEach((p) => {
      if (p.category?.slug) map.set(p.id, p.category.slug);
    });
    return map;
  }, [products]);

  // Categories that actually have recipes
  const recipeCategories = useMemo(() => {
    if (!categories || !recipes) return [];
    const slugsWithRecipes = new Set<string>();
    for (const r of recipes) {
      const slug = productCategoryMap.get(r.product?.id ?? -1);
      if (slug) slugsWithRecipes.add(slug);
    }
    return categories.filter((c) => slugsWithRecipes.has(c.slug));
  }, [categories, recipes, productCategoryMap]);

  // Filtered recipes — category + search
  const filteredRecipes = useMemo(() => {
    if (!recipes) return [];
    let list = recipes;
    if (selectedCategory) {
      list = list.filter((r) => productCategoryMap.get(r.product?.id ?? -1) === selectedCategory);
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((r) => r.product?.name.toLowerCase().includes(q));
    }
    return list;
  }, [recipes, search, selectedCategory, productCategoryMap]);

  // ============================================
  // CRUD HANDLERS
  // ============================================

  const handleEdit = useCallback((recipe: ApiRecipe) => {
    setRecipeModal({ isOpen: true, recipe });
  }, []);

  const handleDelete = useCallback((recipe: ApiRecipe) => {
    const name = recipe.product?.name
      ? `${recipe.product.name} (${recipe.variantName})`
      : recipe.variantName;
    setDeleteConfirm({ documentId: recipe.documentId, name });
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!deleteConfirm) return;
    try {
      await deleteRecipeMutation.mutateAsync(deleteConfirm.documentId);
      setDeleteConfirm(null);
      setRecipeModal({ isOpen: false, recipe: null });
    } catch {
      // Error handled by mutation
    }
  }, [deleteConfirm, deleteRecipeMutation]);

  const handleRecipeSuccess = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: recipeKeys.lists() });
  }, [queryClient]);

  // ============================================
  // COLUMNS
  // ============================================

  const columns: Column<ApiRecipe>[] = useMemo(() => [
    {
      key: 'name',
      header: 'Назва',
      type: 'primary' as const,
      render: (recipe) => {
        const imageUrl = productImageMap.get(recipe.product?.id ?? -1);
        return (
          <div className={styles.nameCell}>
            {imageUrl ? (
              <img src={imageUrl} alt={recipe.product?.name} className={styles.thumbnail} />
            ) : (
              <div className={styles.thumbnailPlaceholder}>
                <Icon name="receipt" size="sm" color="tertiary" />
              </div>
            )}
            <div className={styles.nameInfo}>
              <Text variant="bodyMedium" weight="medium">{recipe.product?.name || '—'}</Text>
              <Text variant="caption" color="tertiary">
                {recipe.variantName}{recipe.variantDescription ? ` · ${recipe.variantDescription}` : ''}
              </Text>
            </div>
          </div>
        );
      },
    },
    {
      key: 'price',
      header: 'Ціна',
      type: 'numeric' as const,
      align: 'right',
      width: '100px',
      render: (recipe) => (
        <div className={styles.priceCell}>
          <Text variant="labelMedium" weight="semibold">₴{recipe.price.toFixed(0)}</Text>
          {recipe.costPrice > 0 && (
            <Text variant="caption" color="tertiary">₴{recipe.costPrice.toFixed(0)}</Text>
          )}
        </div>
      ),
    },
    {
      key: 'margin',
      header: 'Маржа',
      type: 'numeric' as const,
      align: 'right',
      width: '80px',
      hideOnMobile: true,
      showInCard: false,
      render: (recipe) => {
        if (!recipe.costPrice || recipe.price <= 0) {
          return <Text variant="bodySmall" color="tertiary">—</Text>;
        }
        const margin = ((recipe.price - recipe.costPrice) / recipe.price) * 100;
        const colorClass =
          margin >= 50 ? styles.marginGood :
          margin >= 30 ? styles.marginWarn :
          styles.marginBad;
        return (
          <Text variant="labelSmall" weight="semibold" className={colorClass}>
            {margin.toFixed(0)}%
          </Text>
        );
      },
    },
    {
      key: 'ingredients',
      header: 'Склад',
      align: 'right',
      width: '120px',
      hideOnMobile: true,
      showInCard: false,
      render: (recipe) => (
        <Text variant="bodySmall" color="secondary">{recipe.ingredients.length} інгр.</Text>
      ),
    },
  ], [handleEdit, productImageMap]);

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className={styles.page}>
      {/* Mobile search bar */}
      {mobileSearchOpen && (
        <div className={styles.mobileSearchBar}>
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Пошук за продуктом..."
            variant="glass"
            autoFocus
          />
          <Button
            variant="ghost"
            size="sm"
            iconOnly
            onClick={() => { setMobileSearchOpen(false); setSearch(''); }}
            aria-label="Закрити пошук"
            className={styles.mobileSearchClose}
          >
            <Icon name="close" size="md" />
          </Button>
        </div>
      )}

      {/* Category filter — dropdown */}
      {recipeCategories.length > 0 && (
        <div className={styles.filterRow}>
          <div className={styles.selectWrap}>
            <Icon name="filter" size="xs" className={styles.selectIconLeft} />
            <select
              className={styles.filterSelect}
              value={selectedCategory || ''}
              onChange={(e) => setSelectedCategory(e.target.value || null)}
            >
              <option value="">Всі категорії</option>
              {recipeCategories.map((cat) => (
                <option key={cat.slug} value={cat.slug}>{cat.name}</option>
              ))}
            </select>
            <Icon name="chevron-down" size="xs" className={styles.selectIconRight} />
          </div>
        </div>
      )}

      {/* Data Table */}
      {isLoading ? (
        <div className={styles.loadingState}>
          <Icon name="clock" size="2xl" color="tertiary" />
          <Text variant="bodyLarge" color="secondary">Завантаження...</Text>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={filteredRecipes}
          getRowKey={(r) => r.documentId}
          onRowClick={handleEdit}
          emptyState={{ icon: 'menu', title: 'Рецепти не знайдено' }}
        />
      )}

      {/* Recipe Form Modal */}
      <RecipeFormModal
        isOpen={recipeModal.isOpen}
        onClose={() => setRecipeModal({ isOpen: false, recipe: null })}
        recipe={recipeModal.recipe}
        products={products || []}
        ingredients={ingredients || []}
        onSuccess={handleRecipeSuccess}
        onDelete={recipeModal.recipe ? () => handleDelete(recipeModal.recipe!) : undefined}
      />

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <Modal
          open={true}
          onClose={() => setDeleteConfirm(null)}
          title="Видалити рецепт?"
          icon="delete"
          variant="error"
          size="sm"
          footer={
            <Button
              variant="danger"
              onClick={handleConfirmDelete}
              loading={deleteRecipeMutation.isPending}
              fullWidth
            >
              Видалити
            </Button>
          }
        >
          <Text variant="bodyMedium" color="secondary">
            Ви впевнені, що хочете видалити &quot;{deleteConfirm.name}&quot;? Цю дію неможливо скасувати.
          </Text>
        </Modal>
      )}
    </div>
  );
}
