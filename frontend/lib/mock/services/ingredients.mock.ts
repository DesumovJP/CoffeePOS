/**
 * CoffeePOS - Mock Ingredients, IngredientCategories, InventoryTransactions API
 */

import type { ApiResponse } from '@/lib/api/client';
import type {
  Ingredient,
  IngredientInput,
  IngredientCategory,
  IngredientCategoryInput,
  InventoryTransaction,
  InventoryTransactionInput,
} from '@/lib/api/types';
import type {
  GetIngredientsParams,
  GetIngredientCategoriesParams,
  GetInventoryTransactionsParams,
} from '@/lib/api/ingredients';
import { getStore } from '../store';
import { mockDelay, wrapResponse, generateDocumentId, nowISO, slugify } from '../helpers';

export const mockIngredientsApi = {
  async getAll(params: GetIngredientsParams = {}): Promise<ApiResponse<Ingredient[]>> {
    await mockDelay();
    let items = [...getStore().ingredients];

    if (params.search) {
      const q = params.search.toLowerCase();
      items = items.filter((i) => i.name.toLowerCase().includes(q));
    }
    if (params.category) {
      items = items.filter((i) => i.category?.id === Number(params.category));
    }
    if (params.isActive !== undefined) {
      items = items.filter((i) => i.isActive === params.isActive);
    }
    if (params.isLowStock) {
      items = items.filter((i) => i.quantity <= i.minQuantity);
    }

    if (params.sortBy) {
      const dir = params.sortOrder === 'desc' ? -1 : 1;
      items.sort((a, b) => {
        const aVal = a[params.sortBy as keyof Ingredient];
        const bVal = b[params.sortBy as keyof Ingredient];
        if (typeof aVal === 'string' && typeof bVal === 'string') return aVal.localeCompare(bVal) * dir;
        return ((aVal as number) - (bVal as number)) * dir;
      });
    }

    return wrapResponse(items, items.length);
  },

  async getById(id: number): Promise<ApiResponse<Ingredient>> {
    await mockDelay();
    const ingredient = getStore().ingredients.find((i) => i.id === id);
    if (!ingredient) throw { status: 404, name: 'NotFoundError', message: 'Ingredient not found' };
    return wrapResponse(ingredient);
  },

  async create(data: IngredientInput): Promise<ApiResponse<Ingredient>> {
    await mockDelay();
    const store = getStore();
    const now = nowISO();
    const cat = data.category
      ? store.ingredientCategories.find((c) => c.id === Number(data.category))
      : undefined;

    const ingredient: Ingredient = {
      id: store.getId(),
      documentId: generateDocumentId(),
      name: data.name,
      slug: slugify(data.name),
      description: data.description,
      unit: data.unit,
      quantity: data.quantity ?? 0,
      minQuantity: data.minQuantity ?? 0,
      costPerUnit: data.costPerUnit ?? 0,
      supplier: data.supplier,
      isActive: data.isActive ?? true,
      category: cat,
      createdAt: now,
      updatedAt: now,
    };

    store.ingredients.push(ingredient);
    return wrapResponse(ingredient);
  },

  async update(id: number, data: Partial<IngredientInput>): Promise<ApiResponse<Ingredient>> {
    await mockDelay();
    const store = getStore();
    const idx = store.ingredients.findIndex((i) => i.id === id);
    if (idx === -1) throw { status: 404, name: 'NotFoundError', message: 'Ingredient not found' };

    const existing = store.ingredients[idx];
    const cat = data.category !== undefined
      ? store.ingredientCategories.find((c) => c.id === Number(data.category))
      : existing.category;

    store.ingredients[idx] = {
      ...existing,
      ...data,
      category: cat,
      updatedAt: nowISO(),
    } as Ingredient;

    return wrapResponse(store.ingredients[idx]);
  },

  async delete(id: number): Promise<ApiResponse<Ingredient>> {
    await mockDelay();
    const store = getStore();
    const idx = store.ingredients.findIndex((i) => i.id === id);
    if (idx === -1) throw { status: 404, name: 'NotFoundError', message: 'Ingredient not found' };
    const [removed] = store.ingredients.splice(idx, 1);
    return wrapResponse(removed);
  },

  async adjustQuantity(
    id: number,
    adjustment: number,
    type?: string,
    notes?: string
  ): Promise<ApiResponse<Ingredient>> {
    await mockDelay();
    const store = getStore();
    const idx = store.ingredients.findIndex((i) => i.id === id);
    if (idx === -1) throw { status: 404, name: 'NotFoundError', message: 'Ingredient not found' };

    const prev = store.ingredients[idx].quantity;
    store.ingredients[idx] = {
      ...store.ingredients[idx],
      quantity: prev + adjustment,
      updatedAt: nowISO(),
    };

    return wrapResponse(store.ingredients[idx]);
  },

  async getLowStock(): Promise<ApiResponse<Ingredient[]>> {
    return this.getAll({ isLowStock: true, isActive: true });
  },
};

export const mockIngredientCategoriesApi = {
  async getAll(params: GetIngredientCategoriesParams = {}): Promise<ApiResponse<IngredientCategory[]>> {
    await mockDelay();
    let items = [...getStore().ingredientCategories];

    if (params.isActive !== undefined) {
      items = items.filter((c) => c.isActive === params.isActive);
    }

    if (params.sortBy) {
      const dir = params.sortOrder === 'desc' ? -1 : 1;
      items.sort((a, b) => {
        const aVal = a[params.sortBy as keyof IngredientCategory];
        const bVal = b[params.sortBy as keyof IngredientCategory];
        if (typeof aVal === 'string' && typeof bVal === 'string') return aVal.localeCompare(bVal) * dir;
        return ((aVal as number) - (bVal as number)) * dir;
      });
    }

    return wrapResponse(items, items.length);
  },

  async getById(id: number): Promise<ApiResponse<IngredientCategory>> {
    await mockDelay();
    const store = getStore();
    const cat = store.ingredientCategories.find((c) => c.id === id);
    if (!cat) throw { status: 404, name: 'NotFoundError', message: 'Ingredient category not found' };
    // Attach ingredients
    const withIngredients = {
      ...cat,
      ingredients: store.ingredients.filter((i) => i.category?.id === id),
    };
    return wrapResponse(withIngredients);
  },

  async create(data: IngredientCategoryInput): Promise<ApiResponse<IngredientCategory>> {
    await mockDelay();
    const store = getStore();
    const now = nowISO();

    const cat: IngredientCategory = {
      id: store.getId(),
      documentId: generateDocumentId(),
      name: data.name,
      slug: slugify(data.name),
      sortOrder: data.sortOrder ?? store.ingredientCategories.length + 1,
      isActive: data.isActive ?? true,
      createdAt: now,
      updatedAt: now,
    };

    store.ingredientCategories.push(cat);
    return wrapResponse(cat);
  },

  async update(id: number, data: Partial<IngredientCategoryInput>): Promise<ApiResponse<IngredientCategory>> {
    await mockDelay();
    const store = getStore();
    const idx = store.ingredientCategories.findIndex((c) => c.id === id);
    if (idx === -1) throw { status: 404, name: 'NotFoundError', message: 'Ingredient category not found' };

    store.ingredientCategories[idx] = {
      ...store.ingredientCategories[idx],
      ...data,
      updatedAt: nowISO(),
    } as IngredientCategory;

    return wrapResponse(store.ingredientCategories[idx]);
  },

  async delete(id: number): Promise<ApiResponse<IngredientCategory>> {
    await mockDelay();
    const store = getStore();
    const idx = store.ingredientCategories.findIndex((c) => c.id === id);
    if (idx === -1) throw { status: 404, name: 'NotFoundError', message: 'Ingredient category not found' };
    const [removed] = store.ingredientCategories.splice(idx, 1);
    return wrapResponse(removed);
  },
};

export const mockInventoryTransactionsApi = {
  async getAll(params: GetInventoryTransactionsParams = {}): Promise<ApiResponse<InventoryTransaction[]>> {
    await mockDelay();
    // Return empty — the store uses ApiInventoryTransaction format, this is a different type
    return wrapResponse([] as InventoryTransaction[], 0);
  },

  async create(data: InventoryTransactionInput): Promise<ApiResponse<InventoryTransaction>> {
    await mockDelay();
    const store = getStore();
    const now = nowISO();
    const transaction = {
      id: store.getId(),
      documentId: generateDocumentId(),
      type: data.type,
      quantity: data.quantity,
      previousQuantity: 0,
      newQuantity: data.quantity,
      unitCost: data.unitCost,
      reference: data.reference,
      notes: data.notes,
      performedBy: data.performedBy,
      createdAt: now,
      updatedAt: now,
    } as InventoryTransaction;

    return wrapResponse(transaction);
  },
};
