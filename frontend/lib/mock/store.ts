/**
 * CoffeePOS - MockStore Singleton
 *
 * In-memory database for mock API mode
 */

import type {
  Category,
  Product,
  Ingredient,
  IngredientCategory,
  Order,
  CafeTable,
} from '@/lib/api/types';
import type { Shift } from '@/lib/api/shifts';
import type { Supply } from '@/lib/api/supplies';
import type { WriteOff } from '@/lib/api/writeoffs';
import type { ApiRecipe } from '@/lib/api/recipes';
import type { ApiInventoryTransaction } from '@/lib/api/inventory-transactions';
import type { Task } from '@/lib/api/tasks';
import {
  initCategories,
  initProducts,
  initIngredients,
  initIngredientCategories,
  initTables,
  initRecipes,
  initOrders,
  initShift,
  initClosedShifts,
  initSupplies,
  initWriteoffs,
  initTransactions,
  initTasks,
} from './data/init';

class MockStore {
  categories: Category[];
  products: Product[];
  ingredients: Ingredient[];
  ingredientCategories: IngredientCategory[];
  orders: Order[];
  tables: CafeTable[];
  currentShift: Shift | null;
  closedShifts: Shift[];
  supplies: Supply[];
  writeoffs: WriteOff[];
  recipes: ApiRecipe[];
  transactions: ApiInventoryTransaction[];
  tasks: Task[];
  private nextId: number;
  private nextOrderNum: number;

  constructor() {
    this.categories = initCategories();
    this.ingredientCategories = initIngredientCategories();
    this.ingredients = initIngredients(this.ingredientCategories);
    this.products = initProducts(this.categories);
    this.tables = initTables();
    this.recipes = initRecipes(this.products);
    this.orders = initOrders(this.products, this.tables);
    this.currentShift = initShift();
    this.closedShifts = initClosedShifts();
    this.supplies = initSupplies(this.ingredients);
    this.writeoffs = initWriteoffs(this.ingredients);
    this.transactions = initTransactions(this.ingredients, this.products);
    this.tasks = initTasks();
    this.nextId = 2000;
    this.nextOrderNum = 1020;
  }

  getId(): number {
    return ++this.nextId;
  }

  getOrderNumber(): string {
    return `P-${String(++this.nextOrderNum).slice(1)}`;
  }
}

// Singleton — persists across HMR in dev
let _store: MockStore | null = null;

export function getStore(): MockStore {
  if (!_store) {
    _store = new MockStore();
    if (typeof window !== 'undefined') {
      console.log(
        '%c[MockStore] Initialized with %d products, %d orders, %d ingredients',
        'color: #FF9500; font-weight: bold',
        _store.products.length,
        _store.orders.length,
        _store.ingredients.length
      );
    }
  }
  return _store;
}
