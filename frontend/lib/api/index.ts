/**
 * CoffeePOS - API Module
 *
 * Central export for all API functionality
 * Supports mock mode via NEXT_PUBLIC_API_MODE=mock
 */

// Client
export { apiClient, ApiClient, type ApiResponse, type ApiError, type RequestOptions } from './client';

// Auth
export { authApi, type AuthUser, type LoginResponse, type LoginCredentials } from './auth';

// Types (always from real modules)
export * from './types';
export { type GetProductsParams } from './products';
export { type GetCategoriesParams } from './categories';
export { type GetOrdersParams, type CreateOrderPayload } from './orders';
export {
  type GetIngredientsParams,
  type GetIngredientCategoriesParams,
  type GetInventoryTransactionsParams,
} from './ingredients';
export { type Shift, type ShiftOpenData, type ShiftCloseData, type GetShiftsParams } from './shifts';
export { type Supply, type SupplyItem, type SupplyCreateData, type SupplyStatus, type GetSuppliesParams } from './supplies';
export { type WriteOff, type WriteOffItem, type WriteOffCreateData, type WriteOffType, type GetWriteOffsParams } from './writeoffs';
export {
  type DailyReport,
  type MonthlyReport,
  type MonthlyDayData,
  type DailyReportSummary,
  type MonthlyReportSummary,
  type TopProduct,
  type PaymentBreakdown,
  type OrderTypeBreakdown,
  type ProductAnalytics,
  type ProductsReport,
  type XReport,
  type ZReport,
  type ShiftActivity,
  type ShiftActivityType,
} from './reports';
export { type ApiRecipe, type ApiRecipeInput, type GetRecipesParams } from './recipes';
export { type GetModifierGroupsParams } from './modifier-groups';
export { type Task, type TaskStatus, type TaskPriority, type TaskType, type TaskCreateData, type TaskUpdateData, type GetTasksParams } from './tasks';
export { type ApiInventoryTransaction, type ApiTransactionType, type GetTransactionsParams } from './inventory-transactions';
export { type GetTablesParams } from './tables';

// API Services — real implementations
import { productsApi as _realProductsApi } from './products';
import { categoriesApi as _realCategoriesApi } from './categories';
import { ordersApi as _realOrdersApi, orderItemsApi as _realOrderItemsApi, paymentsApi as _realPaymentsApi } from './orders';
import { ingredientsApi as _realIngredientsApi, ingredientCategoriesApi as _realIngredientCategoriesApi, inventoryTransactionsApi as _realInventoryTransactionsApi } from './ingredients';
import { shiftsApi as _realShiftsApi } from './shifts';
import { suppliesApi as _realSuppliesApi } from './supplies';
import { writeoffsApi as _realWriteoffsApi } from './writeoffs';
import { reportsApi as _realReportsApi } from './reports';
import { recipesApi as _realRecipesApi } from './recipes';
import { apiInventoryTransactionsApi as _realApiInventoryTransactionsApi } from './inventory-transactions';
import { tablesApi as _realTablesApi } from './tables';
import { tasksApi as _realTasksApi } from './tasks';
import { modifierGroupsApi as _realModifierGroupsApi, modifiersApi as _realModifiersApi } from './modifier-groups';

// Conditional mock/real services
const IS_MOCK = process.env.NEXT_PUBLIC_API_MODE === 'mock';

let productsApi = _realProductsApi;
let categoriesApi = _realCategoriesApi;
let ordersApi = _realOrdersApi;
let orderItemsApi = _realOrderItemsApi;
let paymentsApi = _realPaymentsApi;
let ingredientsApi = _realIngredientsApi;
let ingredientCategoriesApi = _realIngredientCategoriesApi;
let inventoryTransactionsApi = _realInventoryTransactionsApi;
let shiftsApi = _realShiftsApi;
let suppliesApi = _realSuppliesApi;
let writeoffsApi = _realWriteoffsApi;
let reportsApi = _realReportsApi;
let recipesApi = _realRecipesApi;
let apiInventoryTransactionsApi = _realApiInventoryTransactionsApi;
let tablesApi = _realTablesApi;
let tasksApi = _realTasksApi;
let modifierGroupsApi = _realModifierGroupsApi;
let modifiersApi = _realModifiersApi;

if (IS_MOCK) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mock = require('@/lib/mock/services');
  productsApi = mock.productsApi;
  categoriesApi = mock.categoriesApi;
  ordersApi = mock.ordersApi;
  orderItemsApi = mock.orderItemsApi;
  paymentsApi = mock.paymentsApi;
  ingredientsApi = mock.ingredientsApi;
  ingredientCategoriesApi = mock.ingredientCategoriesApi;
  inventoryTransactionsApi = mock.inventoryTransactionsApi;
  shiftsApi = mock.shiftsApi;
  suppliesApi = mock.suppliesApi;
  writeoffsApi = mock.writeoffsApi;
  reportsApi = mock.reportsApi;
  recipesApi = mock.recipesApi;
  apiInventoryTransactionsApi = mock.apiInventoryTransactionsApi;
  tablesApi = mock.tablesApi;
  tasksApi = mock.tasksApi;
}

export {
  productsApi,
  categoriesApi,
  ordersApi,
  orderItemsApi,
  paymentsApi,
  ingredientsApi,
  ingredientCategoriesApi,
  inventoryTransactionsApi,
  shiftsApi,
  suppliesApi,
  writeoffsApi,
  reportsApi,
  recipesApi,
  apiInventoryTransactionsApi,
  tablesApi,
  tasksApi,
  modifierGroupsApi,
  modifiersApi,
};
