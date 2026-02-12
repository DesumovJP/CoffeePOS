/**
 * ParadisePOS - Mock Services Barrel Export
 *
 * Re-exports all mock services with the same names as real API services
 */

export { mockProductsApi as productsApi } from './products.mock';
export { mockCategoriesApi as categoriesApi } from './categories.mock';
export { mockOrdersApi as ordersApi, mockOrderItemsApi as orderItemsApi, mockPaymentsApi as paymentsApi } from './orders.mock';
export { mockIngredientsApi as ingredientsApi, mockIngredientCategoriesApi as ingredientCategoriesApi, mockInventoryTransactionsApi as inventoryTransactionsApi } from './ingredients.mock';
export { mockShiftsApi as shiftsApi } from './shifts.mock';
export { mockSuppliesApi as suppliesApi } from './supplies.mock';
export { mockWriteoffsApi as writeoffsApi } from './writeoffs.mock';
export { mockReportsApi as reportsApi } from './reports.mock';
export { mockRecipesApi as recipesApi } from './recipes.mock';
export { mockTablesApi as tablesApi } from './tables.mock';
export { mockApiInventoryTransactionsApi as apiInventoryTransactionsApi } from './inventory-transactions.mock';
export { mockTasksApi as tasksApi } from './tasks.mock';
