/**
 * ParadisePOS - Mock Data Initialization
 *
 * Transforms seed data into Strapi-compatible entity shapes
 */

import type {
  Category,
  Product,
  Ingredient,
  IngredientCategory,
  Order,
  OrderItem,
  Payment,
  CafeTable,
} from '@/lib/api/types';
import type { Shift } from '@/lib/api/shifts';
import type { Supply, SupplyItem } from '@/lib/api/supplies';
import type { WriteOff } from '@/lib/api/writeoffs';
import type { ApiRecipe } from '@/lib/api/recipes';
import type { ApiInventoryTransaction } from '@/lib/api/inventory-transactions';
import type { Task } from '@/lib/api/tasks';
import type { StrapiMedia } from '@/lib/api/types';
import {
  productCategories,
  ingredientCategories as seedIngredientCategories,
  ingredients as seedIngredients,
  productRecipes,
  readyMadeProducts,
} from '@/lib/data/seed';
import { strapiTimestamps } from '../helpers';

// ============================================
// PRODUCT IMAGES (Unsplash)
// ============================================

const productImages: Record<string, StrapiMedia> = {
  cappuccino: {
    id: 901,
    name: 'cappuccino.jpg',
    alternativeText: 'Капучіно з латте-артом',
    url: 'https://images.unsplash.com/photo-1572442388796-11e88e7d1e7a?w=400&q=80',
    width: 400,
    height: 300,
    provider: 'unsplash',
  },
  croissant: {
    id: 902,
    name: 'croissant.jpg',
    alternativeText: 'Свіжий круасан',
    url: 'https://images.unsplash.com/photo-1555507036-ab1f4038024a?w=400&q=80',
    width: 400,
    height: 300,
    provider: 'unsplash',
  },
};

// ============================================
// CATEGORIES
// ============================================

export function initCategories(): Category[] {
  const ts = strapiTimestamps();
  return productCategories.map((c) => ({
    ...c,
    ...ts,
  }));
}

// ============================================
// INGREDIENT CATEGORIES
// ============================================

export function initIngredientCategories(): IngredientCategory[] {
  const ts = strapiTimestamps();
  return seedIngredientCategories.map((ic) => ({
    ...ic,
    ...ts,
  }));
}

// ============================================
// INGREDIENTS
// ============================================

export function initIngredients(ingredientCategories: IngredientCategory[]): Ingredient[] {
  const ts = strapiTimestamps();
  return seedIngredients.map((ing) => {
    const cat = ingredientCategories.find(
      (ic) => ic.slug === ing.category?.slug
    );
    return {
      ...ing,
      ...ts,
      category: cat,
    };
  });
}

// ============================================
// PRODUCTS
// ============================================

export function initProducts(categories: Category[]): Product[] {
  const ts = strapiTimestamps();
  const products: Product[] = [];
  let id = 1;

  // Recipe-based products
  for (const recipe of productRecipes) {
    const category = categories.find((c) => c.slug === recipe.categorySlug);
    const defaultSize = recipe.sizes.find((s) => s.isDefault) || recipe.sizes[0];

    products.push({
      id: id,
      documentId: `prod-${recipe.productId}`,
      name: recipe.name,
      slug: recipe.productId,
      price: defaultSize.price,
      costPrice: defaultSize.costPrice,
      category,
      image: productImages[recipe.productId],
      isActive: true,
      isFeatured: ['cappuccino', 'latte', 'cheesecake'].includes(recipe.productId),
      trackInventory: true,
      inventoryType: 'recipe',
      stockQuantity: 999,
      lowStockThreshold: 0,
      sortOrder: id,
      ...ts,
    });
    id++;
  }

  // Ready-made products
  for (const rmp of readyMadeProducts) {
    const category = categories.find((c) => c.slug === rmp.categorySlug);

    products.push({
      id: id,
      documentId: `prod-${rmp.id}`,
      name: rmp.name,
      slug: rmp.id,
      price: rmp.price,
      costPrice: rmp.costPrice,
      category,
      image: productImages[rmp.id],
      isActive: rmp.isActive,
      isFeatured: ['cheesecake', 'tiramisu', 'croissant'].includes(rmp.id),
      trackInventory: true,
      inventoryType: 'simple',
      stockQuantity: rmp.quantity,
      lowStockThreshold: rmp.minQuantity,
      sortOrder: id,
      ...ts,
    });
    id++;
  }

  return products;
}

// ============================================
// RECIPES
// ============================================

export function initRecipes(products: Product[]): ApiRecipe[] {
  const ts = strapiTimestamps();
  const recipes: ApiRecipe[] = [];
  let recipeId = 1;

  for (const pr of productRecipes) {
    const product = products.find((p) => p.slug === pr.productId);
    if (!product) continue;

    for (const size of pr.sizes) {
      recipes.push({
        id: recipeId,
        documentId: `recipe-${recipeId}`,
        product: { id: product.id, name: product.name, slug: product.slug },
        sizeId: size.id,
        sizeName: size.name,
        sizeVolume: size.volume,
        price: size.price,
        costPrice: size.costPrice,
        isDefault: size.isDefault || false,
        ingredients: size.ingredients.map((i) => ({
          ingredientId: i.ingredientId,
          amount: i.amount,
        })),
        ...ts,
      });
      recipeId++;
    }
  }

  return recipes;
}

// ============================================
// CAFE TABLES
// ============================================

export function initTables(): CafeTable[] {
  const ts = strapiTimestamps();
  const tables: CafeTable[] = [];
  const zones = [
    { name: 'Зал', count: 6, startSeats: 2 },
    { name: 'Тераса', count: 4, startSeats: 4 },
    { name: 'VIP', count: 2, startSeats: 6 },
  ];

  let id = 1;
  for (const zone of zones) {
    for (let i = 0; i < zone.count; i++) {
      tables.push({
        id,
        documentId: `table-${id}`,
        number: id,
        seats: zone.startSeats + (i % 2) * 2,
        zone: zone.name,
        isActive: true,
        sortOrder: id,
        ...ts,
      });
      id++;
    }
  }

  return tables;
}

// ============================================
// ORDERS
// ============================================

export function initOrders(products: Product[], tables: CafeTable[]): Order[] {
  const orders: Order[] = [];
  const statuses: Order['status'][] = ['completed', 'completed', 'completed', 'completed', 'completed',
    'completed', 'completed', 'completed', 'completed', 'completed',
    'cancelled', 'cancelled', 'pending', 'confirmed', 'preparing', 'ready'];
  const types: Order['type'][] = ['dine_in', 'takeaway', 'dine_in', 'dine_in'];
  const paymentMethods: Payment['method'][] = ['cash', 'card', 'cash', 'card', 'card'];

  const now = new Date();

  for (let i = 0; i < 16; i++) {
    const id = i + 1;
    const status = statuses[i];
    const type = types[i % types.length];
    const orderDate = new Date(now.getTime() - (16 - i) * 30 * 60 * 1000);
    const dateStr = orderDate.toISOString();

    // Pick 1-3 products for this order
    const itemCount = 1 + (i % 3);
    const orderItems: OrderItem[] = [];
    let subtotal = 0;

    for (let j = 0; j < itemCount; j++) {
      const product = products[(i * 3 + j) % products.length];
      const qty = 1 + (j % 2);
      const unitPrice = product.price;
      const totalPrice = unitPrice * qty;
      subtotal += totalPrice;

      orderItems.push({
        id: i * 10 + j + 1,
        documentId: `oi-${id}-${j}`,
        productName: product.name,
        product,
        quantity: qty,
        unitPrice,
        totalPrice,
        status: status === 'cancelled' ? 'cancelled' : status === 'completed' ? 'served' : 'pending',
        createdAt: dateStr,
        updatedAt: dateStr,
      });
    }

    const total = subtotal;
    const table = type === 'dine_in' ? tables[i % tables.length] : undefined;

    const payment: Payment = {
      id,
      documentId: `pay-${id}`,
      method: paymentMethods[i % paymentMethods.length],
      status: status === 'cancelled' ? 'refunded' : status === 'completed' ? 'completed' : 'pending',
      amount: total,
      receivedAmount: paymentMethods[i % paymentMethods.length] === 'cash' ? Math.ceil(total / 10) * 10 : total,
      changeAmount: paymentMethods[i % paymentMethods.length] === 'cash' ? Math.ceil(total / 10) * 10 - total : 0,
      tipAmount: 0,
      processedAt: status === 'completed' ? dateStr : undefined,
      createdAt: dateStr,
      updatedAt: dateStr,
    };

    orders.push({
      id,
      documentId: `order-${id}`,
      orderNumber: `P-${String(1000 + id).slice(1)}`,
      status,
      type,
      tableNumber: table ? String(table.number) : undefined,
      subtotal,
      discountAmount: 0,
      discountType: 'none',
      discountValue: 0,
      taxAmount: 0,
      total,
      items: orderItems,
      payment,
      priority: 'normal',
      completedAt: status === 'completed' ? dateStr : undefined,
      createdAt: dateStr,
      updatedAt: dateStr,
    });
  }

  return orders;
}

// ============================================
// SHIFT
// ============================================

export function initShift(): Shift {
  const ts = strapiTimestamps();
  return {
    id: 1,
    documentId: 'shift-1',
    openedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    openedBy: 'Олена Коваленко',
    openingCash: 2000,
    closingCash: 0,
    status: 'open',
    cashSales: 1250,
    cardSales: 2350,
    totalSales: 3600,
    ordersCount: 12,
    writeOffsTotal: 150,
    suppliesTotal: 0,
    ...ts,
  };
}

export function initClosedShifts(): Shift[] {
  const ts = strapiTimestamps();
  const shifts: Shift[] = [];
  const now = new Date();

  for (let i = 1; i <= 5; i++) {
    const openDate = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    openDate.setHours(8, 0, 0, 0);
    const closeDate = new Date(openDate.getTime() + 10 * 60 * 60 * 1000);

    shifts.push({
      id: 100 + i,
      documentId: `shift-closed-${i}`,
      openedAt: openDate.toISOString(),
      closedAt: closeDate.toISOString(),
      openedBy: 'Олена Коваленко',
      closedBy: 'Олена Коваленко',
      openingCash: 2000,
      closingCash: 3500 + i * 200,
      status: 'closed',
      cashSales: 1800 + i * 100,
      cardSales: 3200 + i * 150,
      totalSales: 5000 + i * 250,
      ordersCount: 25 + i * 3,
      writeOffsTotal: 100 + i * 20,
      suppliesTotal: i % 2 === 0 ? 2500 : 0,
      ...ts,
    });
  }

  return shifts;
}

// ============================================
// SUPPLIES
// ============================================

export function initSupplies(ingredients: Ingredient[]): Supply[] {
  const ts = strapiTimestamps();
  const now = new Date();

  const makeItems = (ids: number[]): SupplyItem[] =>
    ids.map((ingId) => {
      const ing = ingredients.find((i) => i.id === ingId);
      return {
        ingredientId: ingId,
        ingredientName: ing?.name || 'Інгредієнт',
        quantity: 10 + ingId * 2,
        unitCost: ing?.costPerUnit || 1,
        totalCost: (10 + ingId * 2) * (ing?.costPerUnit || 1),
      };
    });

  const items1 = makeItems([1, 2]);
  const items2 = makeItems([5, 6]);
  const items3 = makeItems([10, 11, 12, 13]);
  const items4 = makeItems([17, 18, 19, 20, 21]);
  const sumCost = (items: SupplyItem[]) => items.reduce((s, i) => s + i.totalCost, 0);

  return [
    {
      id: 1, documentId: 'supply-1',
      supplierName: 'Молочар',
      status: 'received' as const,
      items: items1,
      totalCost: sumCost(items1),
      orderedAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      receivedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      createdBy_barista: 'Олена Коваленко',
      receivedBy: 'Олена Коваленко',
      ...ts,
    },
    {
      id: 2, documentId: 'supply-2',
      supplierName: 'CoffeePro',
      status: 'shipped' as const,
      items: items2,
      totalCost: sumCost(items2),
      orderedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      shippedAt: now.toISOString(),
      createdBy_barista: 'Олена Коваленко',
      ...ts,
    },
    {
      id: 3, documentId: 'supply-3',
      supplierName: 'Monin',
      status: 'ordered' as const,
      items: items3,
      totalCost: sumCost(items3),
      orderedAt: now.toISOString(),
      createdBy_barista: 'Олена Коваленко',
      ...ts,
    },
    {
      id: 4, documentId: 'supply-4',
      supplierName: 'Пакувальник',
      status: 'draft' as const,
      items: items4,
      totalCost: sumCost(items4),
      createdBy_barista: 'Олена Коваленко',
      ...ts,
    },
  ];
}

// ============================================
// WRITEOFFS
// ============================================

export function initWriteoffs(ingredients: Ingredient[]): WriteOff[] {
  const ts = strapiTimestamps();
  const now = new Date();

  return [
    {
      id: 1, documentId: 'wo-1',
      type: 'expired',
      items: [
        {
          ingredientId: 1,
          ingredientName: ingredients.find((i) => i.id === 1)?.name || 'Молоко',
          quantity: 500,
          unitCost: 0.032,
          totalCost: 16,
        },
      ],
      totalCost: 16,
      reason: 'Термін придатності минув',
      performedBy: 'Олена Коваленко',
      createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 2, documentId: 'wo-2',
      type: 'damaged',
      items: [
        {
          ingredientId: 14,
          ingredientName: ingredients.find((i) => i.id === 14)?.name || 'Шоколад',
          quantity: 100,
          unitCost: 0.15,
          totalCost: 15,
        },
        {
          ingredientId: 15,
          ingredientName: ingredients.find((i) => i.id === 15)?.name || 'Шоколад білий',
          quantity: 50,
          unitCost: 0.18,
          totalCost: 9,
        },
      ],
      totalCost: 24,
      reason: 'Пошкоджена упаковка при доставці',
      performedBy: 'Олена Коваленко',
      createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 3, documentId: 'wo-3',
      type: 'other',
      items: [
        {
          ingredientId: 17,
          ingredientName: ingredients.find((i) => i.id === 17)?.name || 'Стакан 250мл',
          quantity: 10,
          unitCost: 2.50,
          totalCost: 25,
        },
      ],
      totalCost: 25,
      reason: 'Бракована партія',
      performedBy: 'Олена Коваленко',
      ...ts,
    },
  ];
}

// ============================================
// INVENTORY TRANSACTIONS
// ============================================

export function initTransactions(
  ingredients: Ingredient[],
  products: Product[]
): ApiInventoryTransaction[] {
  const ts = strapiTimestamps();
  const transactions: ApiInventoryTransaction[] = [];
  let id = 1;

  // Some sale transactions
  for (let i = 0; i < 5; i++) {
    const ing = ingredients[i % ingredients.length];
    transactions.push({
      id: id++,
      documentId: `tx-${id}`,
      type: 'sale',
      ingredient: { id: ing.id, name: ing.name },
      product: products[i] ? { id: products[i].id, name: products[i].name } : undefined,
      quantity: -10 - i * 5,
      previousQty: ing.quantity + 10 + i * 5,
      newQty: ing.quantity,
      performedBy: 'Система',
      shift: { id: 1 },
      ...ts,
    });
  }

  // A supply transaction
  const milk = ingredients[0];
  transactions.push({
    id: id++,
    documentId: `tx-${id}`,
    type: 'supply',
    ingredient: { id: milk.id, name: milk.name },
    quantity: 5000,
    previousQty: milk.quantity - 5000,
    newQty: milk.quantity,
    reference: 'supply-1',
    performedBy: 'Олена Коваленко',
    ...ts,
  });

  // A writeoff transaction
  transactions.push({
    id: id++,
    documentId: `tx-${id}`,
    type: 'writeoff',
    ingredient: { id: milk.id, name: milk.name },
    quantity: -500,
    previousQty: milk.quantity + 500,
    newQty: milk.quantity,
    reference: 'wo-1',
    performedBy: 'Олена Коваленко',
    ...ts,
  });

  return transactions;
}

// ============================================
// TASKS
// ============================================

export function initTasks(): Task[] {
  const ts = strapiTimestamps();
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  return [
    {
      id: 1, documentId: 'task-1',
      title: 'Перевірити термін придатності молочної продукції',
      description: 'Перевірити всі молочні інгредієнти у холодильнику та списати прострочені',
      status: 'todo',
      priority: 'high',
      assignedTo: 'Олена Коваленко',
      dueDate: today,
      type: 'daily',
      ...ts,
    },
    {
      id: 2, documentId: 'task-2',
      title: 'Прийняти поставку від CoffeePro',
      description: 'Очікується доставка кави та сиропів. Перевірити комплектність.',
      status: 'in_progress',
      priority: 'high',
      assignedTo: 'Олена Коваленко',
      dueDate: today,
      type: 'task',
      ...ts,
    },
    {
      id: 3, documentId: 'task-3',
      title: 'Протерти кавомашину',
      description: 'Щоденне чищення групи та трубки пароутворювача',
      status: 'done',
      priority: 'medium',
      assignedTo: 'Олена Коваленко',
      dueDate: today,
      type: 'daily',
      completedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
      completedBy: 'Олена Коваленко',
      ...ts,
    },
    {
      id: 4, documentId: 'task-4',
      title: 'Замовити стаканчики 350мл',
      description: 'Залишилось менше 50 штук, потрібно замовити нову партію',
      status: 'todo',
      priority: 'medium',
      assignedTo: 'Олена Коваленко',
      dueDate: tomorrow,
      type: 'task',
      ...ts,
    },
    {
      id: 5, documentId: 'task-5',
      title: 'Провести інвентаризацію сиропів',
      description: 'Порівняти фактичні залишки сиропів з даними в системі',
      status: 'todo',
      priority: 'low',
      assignedTo: 'Олена Коваленко',
      dueDate: tomorrow,
      type: 'task',
      ...ts,
    },
    {
      id: 6, documentId: 'task-6',
      title: 'Поповнити вітрину випічкою',
      description: 'Викласти свіжі круасани та чізкейки на вітрину',
      status: 'done',
      priority: 'medium',
      assignedTo: 'Олена Коваленко',
      dueDate: today,
      type: 'daily',
      completedAt: new Date(now.getTime() - 5 * 60 * 60 * 1000).toISOString(),
      completedBy: 'Олена Коваленко',
      ...ts,
    },
    {
      id: 7, documentId: 'task-7',
      title: 'Помити підлогу в залі',
      description: 'Вологе прибирання підлоги у залі та на терасі',
      status: 'in_progress',
      priority: 'low',
      assignedTo: 'Олена Коваленко',
      dueDate: today,
      type: 'daily',
      ...ts,
    },
  ];
}
