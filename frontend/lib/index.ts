/**
 * ParadisePOS - Lib Module
 *
 * Central export for utilities, hooks, API, and state management
 */

// API (types and services)
export * from './api';

// React Query Hooks
export * from './hooks';

// Providers
export * from './providers';

// State Management (with renamed types to avoid conflicts)
export {
  useOrderStore,
  selectCurrentOrder,
  selectOrderItems,
  selectDiscounts,
  selectIsPaymentModalOpen,
  selectCompletedOrders,
  type OrderItemModifier as StoreOrderItemModifier,
  type OrderItem as StoreOrderItem,
  type Discount as StoreDiscount,
  type Order as StoreOrder,
  type OrderState,
} from './store';
