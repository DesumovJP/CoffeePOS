/**
 * CoffeePOS - Mock Categories API
 */

import type { ApiResponse } from '@/lib/api/client';
import type { Category, CategoryInput } from '@/lib/api/types';
import type { GetCategoriesParams } from '@/lib/api/categories';
import { getStore } from '../store';
import { mockDelay, wrapResponse, generateDocumentId, nowISO, slugify } from '../helpers';

export const mockCategoriesApi = {
  async getAll(params: GetCategoriesParams = {}): Promise<ApiResponse<Category[]>> {
    await mockDelay();
    let items = [...getStore().categories];

    if (params.isActive !== undefined) {
      items = items.filter((c) => c.isActive === params.isActive);
    }

    items.sort((a, b) => a.sortOrder - b.sortOrder);
    return wrapResponse(items, items.length);
  },

  async getActive(): Promise<ApiResponse<Category[]>> {
    await mockDelay();
    const items = getStore().categories.filter((c) => c.isActive);
    items.sort((a, b) => a.sortOrder - b.sortOrder);
    return wrapResponse(items, items.length);
  },

  async getById(id: number): Promise<ApiResponse<Category>> {
    await mockDelay();
    const category = getStore().categories.find((c) => c.id === id);
    if (!category) throw { status: 404, name: 'NotFoundError', message: 'Category not found' };
    return wrapResponse(category);
  },

  async getBySlug(slug: string): Promise<ApiResponse<Category[]>> {
    await mockDelay();
    const items = getStore().categories.filter((c) => c.slug === slug);
    return wrapResponse(items, items.length);
  },

  async create(data: CategoryInput): Promise<ApiResponse<Category>> {
    await mockDelay();
    const store = getStore();
    const now = nowISO();

    const category: Category = {
      id: store.getId(),
      documentId: generateDocumentId(),
      name: data.name,
      slug: slugify(data.name),
      description: data.description,
      icon: data.icon,
      color: data.color,
      sortOrder: data.sortOrder ?? store.categories.length + 1,
      isActive: data.isActive ?? true,
      createdAt: now,
      updatedAt: now,
    };

    store.categories.push(category);
    return wrapResponse(category);
  },

  async update(id: number, data: Partial<CategoryInput>): Promise<ApiResponse<Category>> {
    await mockDelay();
    const store = getStore();
    const idx = store.categories.findIndex((c) => c.id === id);
    if (idx === -1) throw { status: 404, name: 'NotFoundError', message: 'Category not found' };

    store.categories[idx] = {
      ...store.categories[idx],
      ...data,
      slug: data.name ? slugify(data.name) : store.categories[idx].slug,
      updatedAt: nowISO(),
    } as Category;

    return wrapResponse(store.categories[idx]);
  },

  async delete(id: number): Promise<ApiResponse<Category>> {
    await mockDelay();
    const store = getStore();
    const idx = store.categories.findIndex((c) => c.id === id);
    if (idx === -1) throw { status: 404, name: 'NotFoundError', message: 'Category not found' };
    const [removed] = store.categories.splice(idx, 1);
    return wrapResponse(removed);
  },

  async reorder(orderedIds: number[]): Promise<void> {
    await mockDelay();
    const store = getStore();
    orderedIds.forEach((id, index) => {
      const cat = store.categories.find((c) => c.id === id);
      if (cat) {
        cat.sortOrder = index;
        cat.updatedAt = nowISO();
      }
    });
  },
};
