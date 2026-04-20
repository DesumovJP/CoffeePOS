/**
 * CoffeePOS - API Module
 *
 * Central export for all API functionality
 */

// Client
export { apiClient, ApiClient, type ApiResponse, type ApiError, type RequestOptions } from './client';

// Upload
export { uploadFile } from './upload';

// Auth
export { authApi, type AuthUser, type LoginResponse, type LoginCredentials } from './auth';

// Types
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
export { type Task, type TaskMedia, type TaskStatus, type TaskPriority, type TaskType, type TaskCreateData, type TaskUpdateData, type TaskCompleteData, type GetTasksParams } from './tasks';
export { type ApiInventoryTransaction, type ApiTransactionType, type GetTransactionsParams } from './inventory-transactions';
export { type Supplier, type SupplierCreateData } from './suppliers';
export { type GetTablesParams } from './tables';
export { type GetActivitiesParams, type ActivitiesResponse } from './activities';
export {
  type Employee,
  type EmployeeInput,
  type EmployeeStats,
  type EmployeePerformance,
  type EmployeeRole,
  type GetEmployeesParams,
} from './employees';

// API Services
export { productsApi } from './products';
export { categoriesApi } from './categories';
export { ordersApi, orderItemsApi, paymentsApi } from './orders';
export { ingredientsApi, ingredientCategoriesApi, inventoryTransactionsApi } from './ingredients';
export { shiftsApi } from './shifts';
export { suppliesApi } from './supplies';
export { writeoffsApi } from './writeoffs';
export { reportsApi } from './reports';
export { recipesApi } from './recipes';
export { apiInventoryTransactionsApi } from './inventory-transactions';
export { tablesApi } from './tables';
export { tasksApi } from './tasks';
export { modifierGroupsApi, modifiersApi } from './modifier-groups';
export { activitiesApi } from './activities';
export { employeesApi } from './employees';
export { suppliersApi } from './suppliers';
