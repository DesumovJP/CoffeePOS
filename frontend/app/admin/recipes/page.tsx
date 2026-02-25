'use client';

/**
 * CoffeePOS - Recipes Admin Page
 *
 * Manage all recipes: view by product, add/edit/delete sizes and ingredients.
 */

import { useState, useMemo, useCallback, useEffect } from 'react';
import { Text, Icon, Badge, Button, Modal } from '@/components/atoms';
import { SearchInput, CategoryTabs, type Category } from '@/components/molecules';
import { DataTable, type Column, RecipeFormModal } from '@/components/organisms';
import {
  useRecipes,
  useProducts,
  useIngredients,
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
  const [productFilter, setProductFilter] = useState<string>('all');
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  const [recipeModal, setRecipeModal] = useState<{ isOpen: boolean; recipe: ApiRecipe | null }>({
    isOpen: false,
    recipe: null,
  });
  const [deleteConfirm, setDeleteConfirm] = useState<{ documentId: string; name: string } | null>(null);

  // API data
  const { data: recipes, isLoading } = useRecipes();
  const { data: products } = useProducts();
  const { data: ingredients } = useIngredients({ pageSize: 200 });
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

  // Build product category tabs from recipes
  const productCategories = useMemo((): Category[] => {
    if (!recipes) return [];
    const seen = new Map<number, { name: string; count: number }>();
    recipes.forEach((r) => {
      if (r.product) {
        const existing = seen.get(r.product.id);
        if (existing) {
          existing.count += 1;
        } else {
          seen.set(r.product.id, { name: r.product.name, count: 1 });
        }
      }
    });
    return Array.from(seen.entries()).map(([id, { name, count }]) => ({
      id: String(id),
      name,
      count,
    }));
  }, [recipes]);

  // Filtered recipes
  const filteredRecipes = useMemo(() => {
    if (!recipes) return [];
    return recipes.filter((r) => {
      if (search && !r.product?.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (productFilter !== 'all' && String(r.product?.id) !== productFilter) return false;
      return true;
    });
  }, [recipes, search, productFilter]);

  // ============================================
  // CRUD HANDLERS
  // ============================================

  const handleEdit = useCallback((recipe: ApiRecipe) => {
    setRecipeModal({ isOpen: true, recipe });
  }, []);

  const handleDelete = useCallback((recipe: ApiRecipe) => {
    const name = recipe.product?.name
      ? `${recipe.product.name} (${recipe.sizeName})`
      : recipe.sizeName;
    setDeleteConfirm({ documentId: recipe.documentId, name });
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!deleteConfirm) return;
    try {
      await deleteRecipeMutation.mutateAsync(deleteConfirm.documentId);
      setDeleteConfirm(null);
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
      header: 'Продукт',
      render: (recipe) => (
        <Text variant="bodyMedium" weight="medium">{recipe.product?.name || '—'}</Text>
      ),
    },
    {
      key: 'size',
      header: 'Розмір',
      width: '130px',
      render: (recipe) => (
        <div className={styles.sizeCell}>
          <Text variant="bodySmall" weight="medium">{recipe.sizeName}</Text>
          {recipe.sizeVolume && (
            <Text variant="caption" color="tertiary">{recipe.sizeVolume}</Text>
          )}
        </div>
      ),
    },
    {
      key: 'price',
      header: 'Ціна',
      align: 'right',
      width: '80px',
      render: (recipe) => (
        <Text variant="labelMedium" weight="semibold">₴{recipe.price.toFixed(0)}</Text>
      ),
    },
    {
      key: 'margin',
      header: 'Маржа',
      align: 'right',
      width: '80px',
      hideOnMobile: true,
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
      width: '80px',
      hideOnMobile: true,
      render: (recipe) => (
        <Badge variant="default" size="sm">{recipe.ingredients.length} інгр.</Badge>
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      width: '80px',
      render: (recipe) => (
        <div className={styles.actions}>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => { e.stopPropagation(); handleEdit(recipe); }}
          >
            <Icon name="edit" size="sm" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => { e.stopPropagation(); handleDelete(recipe); }}
          >
            <Icon name="delete" size="sm" />
          </Button>
        </div>
      ),
    },
  ], [handleEdit, handleDelete]);

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

      {/* Product filter tabs */}
      <CategoryTabs
        categories={productCategories}
        value={productFilter === 'all' ? null : productFilter}
        showAll={true}
        allLabel="Всі"
        onChange={(id) => setProductFilter(id || 'all')}
      />

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
