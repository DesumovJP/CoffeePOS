/**
 * CoffeePOS - Production Seed Data
 *
 * Complete dataset for ingredients, recipes, and products
 */

import type {
  Ingredient,
  IngredientCategory,
  IngredientUnit,
  Product,
  ProductInventoryType,
  Category,
} from '@/lib/api';

// ============================================
// INGREDIENT CATEGORIES
// ============================================

export const ingredientCategories: IngredientCategory[] = [
  { id: 1, documentId: 'ic-1', name: 'Молочні продукти', slug: 'dairy', sortOrder: 1, isActive: true, createdAt: '', updatedAt: '' },
  { id: 2, documentId: 'ic-2', name: 'Кава', slug: 'coffee', sortOrder: 2, isActive: true, createdAt: '', updatedAt: '' },
  { id: 3, documentId: 'ic-3', name: 'Чай', slug: 'tea', sortOrder: 3, isActive: true, createdAt: '', updatedAt: '' },
  { id: 4, documentId: 'ic-4', name: 'Сиропи', slug: 'syrups', sortOrder: 4, isActive: true, createdAt: '', updatedAt: '' },
  { id: 5, documentId: 'ic-5', name: 'Топінги', slug: 'toppings', sortOrder: 5, isActive: true, createdAt: '', updatedAt: '' },
  { id: 6, documentId: 'ic-6', name: 'Упаковка', slug: 'packaging', sortOrder: 6, isActive: true, createdAt: '', updatedAt: '' },
  { id: 7, documentId: 'ic-7', name: 'Інше', slug: 'other', sortOrder: 7, isActive: true, createdAt: '', updatedAt: '' },
];

// ============================================
// INGREDIENTS
// ============================================

export const ingredients: Ingredient[] = [
  // Молочні продукти
  {
    id: 1, documentId: 'ing-1', name: 'Молоко 2.5%', slug: 'milk-2-5',
    unit: 'ml', quantity: 10000, minQuantity: 3000, costPerUnit: 0.032,
    supplier: 'Молочар', isActive: true, createdAt: '', updatedAt: '',
    category: ingredientCategories[0],
  },
  {
    id: 2, documentId: 'ing-2', name: 'Вершки 33%', slug: 'cream-33',
    unit: 'ml', quantity: 2000, minQuantity: 1000, costPerUnit: 0.12,
    supplier: 'Молочар', isActive: true, createdAt: '', updatedAt: '',
    category: ingredientCategories[0],
  },
  {
    id: 3, documentId: 'ing-3', name: 'Молоко вівсяне', slug: 'oat-milk',
    unit: 'ml', quantity: 2000, minQuantity: 1000, costPerUnit: 0.08,
    supplier: 'Alpro', isActive: true, createdAt: '', updatedAt: '',
    category: ingredientCategories[0],
  },
  {
    id: 4, documentId: 'ing-4', name: 'Молоко мигдальне', slug: 'almond-milk',
    unit: 'ml', quantity: 1500, minQuantity: 800, costPerUnit: 0.10,
    supplier: 'Alpro', isActive: true, createdAt: '', updatedAt: '',
    category: ingredientCategories[0],
  },

  // Кава
  {
    id: 5, documentId: 'ing-5', name: 'Кава Арабіка (зерно)', slug: 'arabica-beans',
    unit: 'g', quantity: 5000, minQuantity: 2000, costPerUnit: 0.85,
    supplier: 'CoffeePro', isActive: true, createdAt: '', updatedAt: '',
    category: ingredientCategories[1],
  },
  {
    id: 6, documentId: 'ing-6', name: 'Кава Декаф (зерно)', slug: 'decaf-beans',
    unit: 'g', quantity: 1000, minQuantity: 500, costPerUnit: 0.95,
    supplier: 'CoffeePro', isActive: true, createdAt: '', updatedAt: '',
    category: ingredientCategories[1],
  },

  // Чай
  {
    id: 7, documentId: 'ing-7', name: 'Чай чорний (листовий)', slug: 'black-tea',
    unit: 'g', quantity: 500, minQuantity: 200, costPerUnit: 0.45,
    supplier: 'TeaTime', isActive: true, createdAt: '', updatedAt: '',
    category: ingredientCategories[2],
  },
  {
    id: 8, documentId: 'ing-8', name: 'Чай зелений (листовий)', slug: 'green-tea',
    unit: 'g', quantity: 400, minQuantity: 200, costPerUnit: 0.55,
    supplier: 'TeaTime', isActive: true, createdAt: '', updatedAt: '',
    category: ingredientCategories[2],
  },
  {
    id: 9, documentId: 'ing-9', name: 'Матча преміум', slug: 'matcha',
    unit: 'g', quantity: 200, minQuantity: 100, costPerUnit: 2.50,
    supplier: 'TeaTime', isActive: true, createdAt: '', updatedAt: '',
    category: ingredientCategories[2],
  },

  // Сиропи
  {
    id: 10, documentId: 'ing-10', name: 'Сироп ваніль', slug: 'vanilla-syrup',
    unit: 'ml', quantity: 750, minQuantity: 300, costPerUnit: 0.08,
    supplier: 'Monin', isActive: true, createdAt: '', updatedAt: '',
    category: ingredientCategories[3],
  },
  {
    id: 11, documentId: 'ing-11', name: 'Сироп карамель', slug: 'caramel-syrup',
    unit: 'ml', quantity: 750, minQuantity: 300, costPerUnit: 0.08,
    supplier: 'Monin', isActive: true, createdAt: '', updatedAt: '',
    category: ingredientCategories[3],
  },
  {
    id: 12, documentId: 'ing-12', name: 'Сироп лісовий горіх', slug: 'hazelnut-syrup',
    unit: 'ml', quantity: 500, minQuantity: 300, costPerUnit: 0.08,
    supplier: 'Monin', isActive: true, createdAt: '', updatedAt: '',
    category: ingredientCategories[3],
  },
  {
    id: 13, documentId: 'ing-13', name: 'Сироп кокос', slug: 'coconut-syrup',
    unit: 'ml', quantity: 500, minQuantity: 300, costPerUnit: 0.08,
    supplier: 'Monin', isActive: true, createdAt: '', updatedAt: '',
    category: ingredientCategories[3],
  },

  // Топінги
  {
    id: 14, documentId: 'ing-14', name: 'Шоколад темний', slug: 'dark-chocolate',
    unit: 'g', quantity: 500, minQuantity: 200, costPerUnit: 0.15,
    supplier: 'Callebaut', isActive: true, createdAt: '', updatedAt: '',
    category: ingredientCategories[4],
  },
  {
    id: 15, documentId: 'ing-15', name: 'Шоколад білий', slug: 'white-chocolate',
    unit: 'g', quantity: 300, minQuantity: 150, costPerUnit: 0.18,
    supplier: 'Callebaut', isActive: true, createdAt: '', updatedAt: '',
    category: ingredientCategories[4],
  },
  {
    id: 16, documentId: 'ing-16', name: 'Вершки збиті (балон)', slug: 'whipped-cream',
    unit: 'ml', quantity: 500, minQuantity: 200, costPerUnit: 0.10,
    supplier: 'Молочар', isActive: true, createdAt: '', updatedAt: '',
    category: ingredientCategories[4],
  },

  // Упаковка
  {
    id: 17, documentId: 'ing-17', name: 'Стакан паперовий 250мл', slug: 'cup-250',
    unit: 'pcs', quantity: 200, minQuantity: 100, costPerUnit: 2.50,
    supplier: 'Пакувальник', isActive: true, createdAt: '', updatedAt: '',
    category: ingredientCategories[5],
  },
  {
    id: 18, documentId: 'ing-18', name: 'Стакан паперовий 350мл', slug: 'cup-350',
    unit: 'pcs', quantity: 200, minQuantity: 100, costPerUnit: 3.00,
    supplier: 'Пакувальник', isActive: true, createdAt: '', updatedAt: '',
    category: ingredientCategories[5],
  },
  {
    id: 19, documentId: 'ing-19', name: 'Стакан паперовий 450мл', slug: 'cup-450',
    unit: 'pcs', quantity: 150, minQuantity: 100, costPerUnit: 3.50,
    supplier: 'Пакувальник', isActive: true, createdAt: '', updatedAt: '',
    category: ingredientCategories[5],
  },
  {
    id: 20, documentId: 'ing-20', name: 'Кришка для стакану', slug: 'cup-lid',
    unit: 'pcs', quantity: 500, minQuantity: 200, costPerUnit: 0.80,
    supplier: 'Пакувальник', isActive: true, createdAt: '', updatedAt: '',
    category: ingredientCategories[5],
  },
  {
    id: 21, documentId: 'ing-21', name: 'Трубочка паперова', slug: 'paper-straw',
    unit: 'pcs', quantity: 300, minQuantity: 150, costPerUnit: 0.50,
    supplier: 'Пакувальник', isActive: true, createdAt: '', updatedAt: '',
    category: ingredientCategories[5],
  },

  // Інше
  {
    id: 22, documentId: 'ing-22', name: 'Цукор', slug: 'sugar',
    unit: 'g', quantity: 5000, minQuantity: 2000, costPerUnit: 0.02,
    isActive: true, createdAt: '', updatedAt: '',
    category: ingredientCategories[6],
  },
  {
    id: 23, documentId: 'ing-23', name: 'Цукор тростинний', slug: 'brown-sugar',
    unit: 'g', quantity: 2000, minQuantity: 1000, costPerUnit: 0.04,
    isActive: true, createdAt: '', updatedAt: '',
    category: ingredientCategories[6],
  },
  {
    id: 24, documentId: 'ing-24', name: 'Лід', slug: 'ice',
    unit: 'g', quantity: 10000, minQuantity: 3000, costPerUnit: 0.005,
    isActive: true, createdAt: '', updatedAt: '',
    category: ingredientCategories[6],
  },
];

// ============================================
// RECIPE DEFINITIONS
// ============================================

export interface RecipeSize {
  id: string;
  name: string;
  volume?: string;
  price: number;
  costPrice: number;
  isDefault?: boolean;
  ingredients: RecipeIngredientAmount[];
}

export interface RecipeIngredientAmount {
  ingredientId: number;
  amount: number;
}

export interface ProductRecipe {
  productId: string;
  name: string;
  categorySlug: string;
  inventoryType: ProductInventoryType;
  sizes: RecipeSize[];
}

export const productRecipes: ProductRecipe[] = [
  // ========== КАВА ==========
  {
    productId: 'espresso',
    name: 'Еспресо',
    categorySlug: 'coffee',
    inventoryType: 'recipe',
    sizes: [
      {
        id: 'single', name: 'Сінгл', price: 45, costPrice: 15.30, isDefault: true,
        ingredients: [{ ingredientId: 5, amount: 18 }],
      },
      {
        id: 'double', name: 'Допіо', price: 65, costPrice: 30.60,
        ingredients: [{ ingredientId: 5, amount: 36 }],
      },
    ],
  },
  {
    productId: 'americano',
    name: 'Американо',
    categorySlug: 'coffee',
    inventoryType: 'recipe',
    sizes: [
      {
        id: 's', name: 'S', volume: '250 мл', price: 55, costPrice: 17.80, isDefault: true,
        ingredients: [
          { ingredientId: 5, amount: 18 },
          { ingredientId: 17, amount: 1 },
          { ingredientId: 20, amount: 1 },
        ],
      },
      {
        id: 'm', name: 'M', volume: '350 мл', price: 65, costPrice: 18.80,
        ingredients: [
          { ingredientId: 5, amount: 18 },
          { ingredientId: 18, amount: 1 },
          { ingredientId: 20, amount: 1 },
        ],
      },
      {
        id: 'l', name: 'L', volume: '450 мл', price: 75, costPrice: 24.70,
        ingredients: [
          { ingredientId: 5, amount: 24 },
          { ingredientId: 19, amount: 1 },
          { ingredientId: 20, amount: 1 },
        ],
      },
    ],
  },
  {
    productId: 'cappuccino',
    name: 'Капучіно',
    categorySlug: 'coffee',
    inventoryType: 'recipe',
    sizes: [
      {
        id: 's', name: 'S', volume: '250 мл', price: 65, costPrice: 23.56, isDefault: true,
        ingredients: [
          { ingredientId: 5, amount: 18 },
          { ingredientId: 1, amount: 180 },
          { ingredientId: 17, amount: 1 },
          { ingredientId: 20, amount: 1 },
        ],
      },
      {
        id: 'm', name: 'M', volume: '350 мл', price: 75, costPrice: 27.76,
        ingredients: [
          { ingredientId: 5, amount: 18 },
          { ingredientId: 1, amount: 280 },
          { ingredientId: 18, amount: 1 },
          { ingredientId: 20, amount: 1 },
        ],
      },
      {
        id: 'l', name: 'L', volume: '450 мл', price: 85, costPrice: 35.06,
        ingredients: [
          { ingredientId: 5, amount: 24 },
          { ingredientId: 1, amount: 380 },
          { ingredientId: 19, amount: 1 },
          { ingredientId: 20, amount: 1 },
        ],
      },
    ],
  },
  {
    productId: 'latte',
    name: 'Латте',
    categorySlug: 'coffee',
    inventoryType: 'recipe',
    sizes: [
      {
        id: 's', name: 'S', volume: '300 мл', price: 70, costPrice: 26.30, isDefault: true,
        ingredients: [
          { ingredientId: 5, amount: 18 },
          { ingredientId: 1, amount: 250 },
          { ingredientId: 18, amount: 1 },
          { ingredientId: 20, amount: 1 },
        ],
      },
      {
        id: 'm', name: 'M', volume: '400 мл', price: 85, costPrice: 32.50,
        ingredients: [
          { ingredientId: 5, amount: 18 },
          { ingredientId: 1, amount: 350 },
          { ingredientId: 19, amount: 1 },
          { ingredientId: 20, amount: 1 },
        ],
      },
      {
        id: 'l', name: 'L', volume: '500 мл', price: 95, costPrice: 38.10,
        ingredients: [
          { ingredientId: 5, amount: 24 },
          { ingredientId: 1, amount: 450 },
          { ingredientId: 19, amount: 1 },
          { ingredientId: 20, amount: 1 },
        ],
      },
    ],
  },
  {
    productId: 'flat-white',
    name: 'Флет Вайт',
    categorySlug: 'coffee',
    inventoryType: 'recipe',
    sizes: [
      {
        id: 'standard', name: 'Стандарт', volume: '250 мл', price: 75, costPrice: 35.60, isDefault: true,
        ingredients: [
          { ingredientId: 5, amount: 36 },
          { ingredientId: 1, amount: 150 },
          { ingredientId: 17, amount: 1 },
          { ingredientId: 20, amount: 1 },
        ],
      },
    ],
  },
  {
    productId: 'raf',
    name: 'Раф',
    categorySlug: 'coffee',
    inventoryType: 'recipe',
    sizes: [
      {
        id: 's', name: 'S', volume: '300 мл', price: 85, costPrice: 42.70, isDefault: true,
        ingredients: [
          { ingredientId: 5, amount: 18 },
          { ingredientId: 2, amount: 200 },
          { ingredientId: 10, amount: 20 },
          { ingredientId: 18, amount: 1 },
          { ingredientId: 20, amount: 1 },
        ],
      },
      {
        id: 'm', name: 'M', volume: '400 мл', price: 100, costPrice: 57.10,
        ingredients: [
          { ingredientId: 5, amount: 18 },
          { ingredientId: 2, amount: 300 },
          { ingredientId: 10, amount: 30 },
          { ingredientId: 19, amount: 1 },
          { ingredientId: 20, amount: 1 },
        ],
      },
    ],
  },
  {
    productId: 'mocha',
    name: 'Мокко',
    categorySlug: 'coffee',
    inventoryType: 'recipe',
    sizes: [
      {
        id: 'standard', name: 'Стандарт', volume: '350 мл', price: 80, costPrice: 32.10, isDefault: true,
        ingredients: [
          { ingredientId: 5, amount: 18 },
          { ingredientId: 1, amount: 200 },
          { ingredientId: 14, amount: 20 },
          { ingredientId: 16, amount: 30 },
          { ingredientId: 18, amount: 1 },
          { ingredientId: 20, amount: 1 },
        ],
      },
    ],
  },
  {
    productId: 'ice-latte',
    name: 'Айс Латте',
    categorySlug: 'coffee',
    inventoryType: 'recipe',
    sizes: [
      {
        id: 'm', name: 'M', volume: '400 мл', price: 75, costPrice: 41.10, isDefault: true,
        ingredients: [
          { ingredientId: 5, amount: 36 },
          { ingredientId: 1, amount: 250 },
          { ingredientId: 24, amount: 100 },
          { ingredientId: 19, amount: 1 },
          { ingredientId: 20, amount: 1 },
          { ingredientId: 21, amount: 1 },
        ],
      },
      {
        id: 'l', name: 'L', volume: '500 мл', price: 90, costPrice: 47.30,
        ingredients: [
          { ingredientId: 5, amount: 36 },
          { ingredientId: 1, amount: 350 },
          { ingredientId: 24, amount: 150 },
          { ingredientId: 19, amount: 1 },
          { ingredientId: 20, amount: 1 },
          { ingredientId: 21, amount: 1 },
        ],
      },
    ],
  },

  // ========== ЧАЙ ==========
  {
    productId: 'black-tea',
    name: 'Чорний чай',
    categorySlug: 'tea',
    inventoryType: 'recipe',
    sizes: [
      {
        id: 's', name: 'S', volume: '300 мл', price: 40, costPrice: 4.85, isDefault: true,
        ingredients: [
          { ingredientId: 7, amount: 3 },
          { ingredientId: 18, amount: 1 },
          { ingredientId: 20, amount: 1 },
        ],
      },
      {
        id: 'l', name: 'L', volume: '500 мл', price: 55, costPrice: 6.25,
        ingredients: [
          { ingredientId: 7, amount: 5 },
          { ingredientId: 19, amount: 1 },
          { ingredientId: 20, amount: 1 },
        ],
      },
    ],
  },
  {
    productId: 'green-tea',
    name: 'Зелений чай',
    categorySlug: 'tea',
    inventoryType: 'recipe',
    sizes: [
      {
        id: 's', name: 'S', volume: '300 мл', price: 45, costPrice: 5.15, isDefault: true,
        ingredients: [
          { ingredientId: 8, amount: 3 },
          { ingredientId: 18, amount: 1 },
          { ingredientId: 20, amount: 1 },
        ],
      },
      {
        id: 'l', name: 'L', volume: '500 мл', price: 60, costPrice: 7.05,
        ingredients: [
          { ingredientId: 8, amount: 5 },
          { ingredientId: 19, amount: 1 },
          { ingredientId: 20, amount: 1 },
        ],
      },
    ],
  },
  {
    productId: 'matcha-latte',
    name: 'Матча Латте',
    categorySlug: 'tea',
    inventoryType: 'recipe',
    sizes: [
      {
        id: 's', name: 'S', volume: '300 мл', price: 85, costPrice: 18.50, isDefault: true,
        ingredients: [
          { ingredientId: 9, amount: 3 },
          { ingredientId: 1, amount: 250 },
          { ingredientId: 18, amount: 1 },
          { ingredientId: 20, amount: 1 },
        ],
      },
      {
        id: 'm', name: 'M', volume: '400 мл', price: 100, costPrice: 24.70,
        ingredients: [
          { ingredientId: 9, amount: 4 },
          { ingredientId: 1, amount: 350 },
          { ingredientId: 19, amount: 1 },
          { ingredientId: 20, amount: 1 },
        ],
      },
    ],
  },

  // ========== НАПОЇ ==========
  {
    productId: 'lemonade',
    name: 'Лимонад',
    categorySlug: 'drinks',
    inventoryType: 'recipe',
    sizes: [
      {
        id: 's', name: 'S', volume: '300 мл', price: 55, costPrice: 12.00, isDefault: true,
        ingredients: [
          { ingredientId: 24, amount: 100 },
          { ingredientId: 18, amount: 1 },
          { ingredientId: 20, amount: 1 },
          { ingredientId: 21, amount: 1 },
        ],
      },
      {
        id: 'l', name: 'L', volume: '500 мл', price: 75, costPrice: 16.00,
        ingredients: [
          { ingredientId: 24, amount: 150 },
          { ingredientId: 19, amount: 1 },
          { ingredientId: 20, amount: 1 },
          { ingredientId: 21, amount: 1 },
        ],
      },
    ],
  },
];

// ============================================
// READY-MADE PRODUCTS (Simple inventory)
// ============================================

export interface ReadyMadeProduct {
  id: string;
  name: string;
  categorySlug: string;
  inventoryType: 'simple';
  quantity: number;
  minQuantity: number;
  costPrice: number;
  price: number;
  isActive: boolean;
}

export const readyMadeProducts: ReadyMadeProduct[] = [
  // Випічка
  { id: 'croissant', name: 'Круасан', categorySlug: 'desserts', inventoryType: 'simple', quantity: 15, minQuantity: 8, costPrice: 22, price: 55, isActive: true },
  { id: 'croissant-choco', name: 'Круасан шоколадний', categorySlug: 'desserts', inventoryType: 'simple', quantity: 12, minQuantity: 8, costPrice: 28, price: 65, isActive: true },
  { id: 'pain-au-chocolat', name: 'Пен о шоколя', categorySlug: 'desserts', inventoryType: 'simple', quantity: 10, minQuantity: 6, costPrice: 30, price: 70, isActive: true },

  // Десерти
  { id: 'cheesecake', name: 'Чізкейк Нью-Йорк', categorySlug: 'desserts', inventoryType: 'simple', quantity: 8, minQuantity: 5, costPrice: 45, price: 95, isActive: true },
  { id: 'tiramisu', name: 'Тірамісу', categorySlug: 'desserts', inventoryType: 'simple', quantity: 6, minQuantity: 4, costPrice: 52, price: 110, isActive: true },
  { id: 'eclair', name: 'Еклер', categorySlug: 'desserts', inventoryType: 'simple', quantity: 10, minQuantity: 6, costPrice: 18, price: 45, isActive: true },
  { id: 'muffin-blueberry', name: 'Маффін чорниця', categorySlug: 'desserts', inventoryType: 'simple', quantity: 8, minQuantity: 6, costPrice: 15, price: 45, isActive: true },
  { id: 'muffin-chocolate', name: 'Маффін шоколадний', categorySlug: 'desserts', inventoryType: 'simple', quantity: 8, minQuantity: 6, costPrice: 15, price: 45, isActive: true },
  { id: 'cookie-oat', name: 'Печиво вівсяне (3шт)', categorySlug: 'desserts', inventoryType: 'simple', quantity: 20, minQuantity: 10, costPrice: 12, price: 35, isActive: true },
  { id: 'brownie', name: 'Брауні', categorySlug: 'desserts', inventoryType: 'simple', quantity: 12, minQuantity: 6, costPrice: 20, price: 55, isActive: true },

  // Їжа
  { id: 'sandwich-chicken', name: 'Сендвіч з куркою', categorySlug: 'food', inventoryType: 'simple', quantity: 6, minQuantity: 4, costPrice: 55, price: 120, isActive: true },
  { id: 'sandwich-salmon', name: 'Сендвіч з лососем', categorySlug: 'food', inventoryType: 'simple', quantity: 4, minQuantity: 3, costPrice: 72, price: 145, isActive: true },
  { id: 'sandwich-vegan', name: 'Сендвіч веган', categorySlug: 'food', inventoryType: 'simple', quantity: 4, minQuantity: 3, costPrice: 48, price: 110, isActive: true },
  { id: 'salad-caesar', name: 'Салат Цезар', categorySlug: 'food', inventoryType: 'simple', quantity: 5, minQuantity: 3, costPrice: 58, price: 135, isActive: true },
  { id: 'salad-greek', name: 'Салат Грецький', categorySlug: 'food', inventoryType: 'simple', quantity: 5, minQuantity: 3, costPrice: 45, price: 115, isActive: true },
];

// ============================================
// PRODUCT CATEGORIES
// ============================================

export const productCategories: Category[] = [
  { id: 1, documentId: 'cat-1', name: 'Кава', slug: 'coffee', sortOrder: 1, isActive: true, createdAt: '', updatedAt: '' },
  { id: 2, documentId: 'cat-2', name: 'Чай', slug: 'tea', sortOrder: 2, isActive: true, createdAt: '', updatedAt: '' },
  { id: 3, documentId: 'cat-3', name: 'Десерти', slug: 'desserts', sortOrder: 3, isActive: true, createdAt: '', updatedAt: '' },
  { id: 4, documentId: 'cat-4', name: 'Їжа', slug: 'food', sortOrder: 4, isActive: true, createdAt: '', updatedAt: '' },
  { id: 5, documentId: 'cat-5', name: 'Напої', slug: 'drinks', sortOrder: 5, isActive: true, createdAt: '', updatedAt: '' },
];

// ============================================
// HELPER: Get all products for POS
// ============================================

export interface POSProduct {
  id: string;
  name: string;
  price: number;
  costPrice: number;
  category: string;
  inStock: boolean;
  stockQuantity?: number;
  lowStockThreshold?: number;
  hasModifiers?: boolean;
  inventoryType: ProductInventoryType;
  sizes?: Array<{
    id: string;
    name: string;
    volume?: string;
    price: number;
    costPrice: number;
    isDefault?: boolean;
  }>;
  recipe?: RecipeIngredientAmount[];
}

export function getPOSProducts(): POSProduct[] {
  const products: POSProduct[] = [];

  // Recipe-based products
  for (const recipe of productRecipes) {
    const defaultSize = recipe.sizes.find((s) => s.isDefault) || recipe.sizes[0];
    products.push({
      id: recipe.productId,
      name: recipe.name,
      price: defaultSize.price,
      costPrice: defaultSize.costPrice,
      category: recipe.categorySlug,
      inStock: true,
      inventoryType: recipe.inventoryType,
      sizes: recipe.sizes.map((s) => ({
        id: s.id,
        name: s.name,
        volume: s.volume,
        price: s.price,
        costPrice: s.costPrice,
        isDefault: s.isDefault,
      })),
      recipe: defaultSize.ingredients,
    });
  }

  // Ready-made products
  for (const product of readyMadeProducts) {
    const isLowStock = product.quantity <= product.minQuantity;
    products.push({
      id: product.id,
      name: product.name,
      price: product.price,
      costPrice: product.costPrice,
      category: product.categorySlug,
      inStock: product.quantity > 0,
      stockQuantity: product.quantity,
      lowStockThreshold: product.minQuantity,
      inventoryType: product.inventoryType,
    });
  }

  return products;
}

// ============================================
// HELPER: Get recipe for product + size
// ============================================

export function getProductRecipe(
  productId: string,
  sizeId?: string
): RecipeIngredientAmount[] | null {
  const recipe = productRecipes.find((r) => r.productId === productId);
  if (!recipe) return null;

  const size = sizeId
    ? recipe.sizes.find((s) => s.id === sizeId)
    : recipe.sizes.find((s) => s.isDefault) || recipe.sizes[0];

  return size?.ingredients || null;
}

// ============================================
// HELPER: Calculate ingredient deductions
// ============================================

export interface IngredientDeduction {
  ingredientId: number;
  ingredientName: string;
  amount: number;
  unit: IngredientUnit;
  available: number;
  sufficient: boolean;
}

export function calculateDeductions(
  productId: string,
  sizeId?: string,
  quantity: number = 1
): IngredientDeduction[] {
  const recipe = getProductRecipe(productId, sizeId);
  if (!recipe) return [];

  return recipe.map((item) => {
    const ingredient = ingredients.find((i) => i.id === item.ingredientId);
    if (!ingredient) {
      return {
        ingredientId: item.ingredientId,
        ingredientName: 'Unknown',
        amount: item.amount * quantity,
        unit: 'g' as IngredientUnit,
        available: 0,
        sufficient: false,
      };
    }

    const totalAmount = item.amount * quantity;
    return {
      ingredientId: ingredient.id,
      ingredientName: ingredient.name,
      amount: totalAmount,
      unit: ingredient.unit,
      available: ingredient.quantity,
      sufficient: ingredient.quantity >= totalAmount,
    };
  });
}
