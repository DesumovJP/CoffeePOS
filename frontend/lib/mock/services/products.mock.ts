/**
 * CoffeePOS - Mock Products API
 */

import type { ApiResponse } from '@/lib/api/client';
import type { Product, ProductInput } from '@/lib/api/types';
import type { GetProductsParams } from '@/lib/api/products';
import { getStore } from '../store';
import { mockDelay, wrapResponse, generateDocumentId, nowISO, slugify } from '../helpers';

export const mockProductsApi = {
  async getAll(params: GetProductsParams = {}): Promise<ApiResponse<Product[]>> {
    await mockDelay();
    const store = getStore();
    let items = [...store.products];

    if (params.category) {
      items = items.filter((p) => p.category?.id === Number(params.category));
    }
    if (params.search) {
      const q = params.search.toLowerCase();
      items = items.filter((p) => p.name.toLowerCase().includes(q));
    }
    if (params.isActive !== undefined) {
      items = items.filter((p) => p.isActive === params.isActive);
    }
    if (params.isFeatured !== undefined) {
      items = items.filter((p) => p.isFeatured === params.isFeatured);
    }

    return wrapResponse(items, items.length);
  },

  async getById(id: number): Promise<ApiResponse<Product>> {
    await mockDelay();
    const product = getStore().products.find((p) => p.id === id);
    if (!product) throw { status: 404, name: 'NotFoundError', message: 'Product not found' };
    return wrapResponse(product);
  },

  async getBySlug(slug: string): Promise<ApiResponse<Product[]>> {
    await mockDelay();
    const products = getStore().products.filter((p) => p.slug === slug);
    return wrapResponse(products, products.length);
  },

  async create(data: ProductInput): Promise<ApiResponse<Product>> {
    await mockDelay();
    const store = getStore();
    const now = nowISO();
    const category = data.category
      ? store.categories.find((c) => c.id === data.category)
      : undefined;

    const product: Product = {
      id: store.getId(),
      documentId: generateDocumentId(),
      name: data.name,
      slug: slugify(data.name),
      description: data.description,
      shortDescription: data.shortDescription,
      sku: data.sku,
      barcode: data.barcode,
      price: data.price,
      costPrice: data.costPrice,
      compareAtPrice: data.compareAtPrice,
      category,
      isActive: data.isActive ?? true,
      isFeatured: data.isFeatured ?? false,
      trackInventory: data.trackInventory ?? false,
      inventoryType: 'none',
      stockQuantity: data.stockQuantity ?? 0,
      lowStockThreshold: data.lowStockThreshold ?? 0,
      sortOrder: data.sortOrder ?? store.products.length + 1,
      preparationTime: data.preparationTime,
      calories: data.calories,
      allergens: data.allergens,
      tags: data.tags,
      createdAt: now,
      updatedAt: now,
    };

    store.products.push(product);
    return wrapResponse(product);
  },

  async update(id: number, data: Partial<ProductInput>): Promise<ApiResponse<Product>> {
    await mockDelay();
    const store = getStore();
    const idx = store.products.findIndex((p) => p.id === id);
    if (idx === -1) throw { status: 404, name: 'NotFoundError', message: 'Product not found' };

    const existing = store.products[idx];
    const category = data.category !== undefined
      ? store.categories.find((c) => c.id === data.category)
      : existing.category;

    store.products[idx] = {
      ...existing,
      ...data,
      category,
      updatedAt: nowISO(),
    } as Product;

    return wrapResponse(store.products[idx]);
  },

  async delete(id: number): Promise<ApiResponse<Product>> {
    await mockDelay();
    const store = getStore();
    const idx = store.products.findIndex((p) => p.id === id);
    if (idx === -1) throw { status: 404, name: 'NotFoundError', message: 'Product not found' };
    const [removed] = store.products.splice(idx, 1);
    return wrapResponse(removed);
  },

  async updateStock(id: number, quantity: number): Promise<ApiResponse<Product>> {
    await mockDelay();
    const store = getStore();
    const idx = store.products.findIndex((p) => p.id === id);
    if (idx === -1) throw { status: 404, name: 'NotFoundError', message: 'Product not found' };
    store.products[idx] = { ...store.products[idx], stockQuantity: quantity, updatedAt: nowISO() };
    return wrapResponse(store.products[idx]);
  },

  async getLowStock(): Promise<ApiResponse<Product[]>> {
    await mockDelay();
    const items = getStore().products.filter(
      (p) => p.trackInventory && p.inventoryType === 'simple' && p.stockQuantity <= p.lowStockThreshold
    );
    return wrapResponse(items, items.length);
  },

  async getFeatured(): Promise<ApiResponse<Product[]>> {
    await mockDelay();
    const items = getStore().products.filter((p) => p.isFeatured && p.isActive);
    return wrapResponse(items, items.length);
  },
};
