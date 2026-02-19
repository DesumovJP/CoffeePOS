/**
 * CoffeePOS - Orders API
 *
 * API methods for order management
 */

import { apiClient, type ApiResponse } from './client';
import type {
  Order,
  OrderInput,
  OrderItem,
  OrderItemInput,
  OrderStatus,
  Payment,
  PaymentInput,
} from './types';

// ============================================
// TYPES
// ============================================

export interface GetOrdersParams {
  page?: number;
  pageSize?: number;
  status?: OrderStatus | OrderStatus[];
  dateFrom?: string;
  dateTo?: string;
  sort?: string;
}

export interface CreateOrderPayload {
  order: OrderInput;
  items: Omit<OrderItemInput, 'order'>[];
  payment?: Omit<PaymentInput, 'order'>;
}

// ============================================
// ORDER API METHODS
// ============================================

export const ordersApi = {
  /**
   * Get all orders with optional filtering
   */
  async getAll(params: GetOrdersParams = {}): Promise<ApiResponse<Order[]>> {
    const queryParams: Record<string, string | number | boolean | undefined> = {
      'pagination[page]': params.page,
      'pagination[pageSize]': params.pageSize || 50,
      'populate': 'items,payment',
      'sort': params.sort || 'createdAt:desc',
    };

    if (params.status) {
      if (Array.isArray(params.status)) {
        params.status.forEach((s, i) => {
          queryParams[`filters[status][$in][${i}]`] = s;
        });
      } else {
        queryParams['filters[status][$eq]'] = params.status;
      }
    }

    if (params.dateFrom) {
      queryParams['filters[createdAt][$gte]'] = params.dateFrom;
    }

    if (params.dateTo) {
      queryParams['filters[createdAt][$lte]'] = params.dateTo;
    }

    return apiClient.get<Order[]>('/orders', queryParams);
  },

  /**
   * Get active orders (for KDS)
   */
  async getActive(): Promise<ApiResponse<Order[]>> {
    return apiClient.get<Order[]>('/orders', {
      'filters[status][$in][0]': 'pending',
      'filters[status][$in][1]': 'confirmed',
      'filters[status][$in][2]': 'preparing',
      'filters[status][$in][3]': 'ready',
      'populate': 'items',
      'sort': 'priority:desc,createdAt:asc',
    });
  },

  /**
   * Get a single order by ID
   */
  async getById(documentId: string): Promise<ApiResponse<Order>> {
    return apiClient.get<Order>(`/orders/${documentId}`, {
      populate: 'items.product,payment,createdByUser',
    });
  },

  /**
   * Get a single order by order number
   */
  async getByOrderNumber(orderNumber: string): Promise<ApiResponse<Order[]>> {
    return apiClient.get<Order[]>('/orders', {
      'filters[orderNumber][$eq]': orderNumber,
      'populate': 'items.product,payment',
    });
  },

  /**
   * Create a new order with items and payment in a single request.
   * Backend custom controller expects: { data: { order, items, payment } }
   */
  async create(payload: CreateOrderPayload): Promise<ApiResponse<Order>> {
    return apiClient.post<Order>('/orders', {
      data: {
        order: payload.order,
        items: payload.items,
        payment: payload.payment,
      },
    });
  },

  /**
   * Update order status
   */
  async updateStatus(documentId: string, status: OrderStatus): Promise<ApiResponse<Order>> {
    const data: Partial<OrderInput> = { status };

    if (status === 'completed') {
      data.completedAt = new Date().toISOString();
    } else if (status === 'ready') {
      data.preparedAt = new Date().toISOString();
    }

    return apiClient.put<Order>(`/orders/${documentId}`, { data });
  },

  /**
   * Update order
   */
  async update(documentId: string, data: Partial<OrderInput>): Promise<ApiResponse<Order>> {
    return apiClient.put<Order>(`/orders/${documentId}`, { data });
  },

  /**
   * Cancel an order
   */
  async cancel(documentId: string): Promise<ApiResponse<Order>> {
    return ordersApi.updateStatus(documentId, 'cancelled');
  },

  /**
   * Get orders count by status
   */
  async getCountByStatus(): Promise<Record<OrderStatus, number>> {
    const statuses: OrderStatus[] = ['pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled'];
    const counts: Record<OrderStatus, number> = {} as Record<OrderStatus, number>;

    await Promise.all(
      statuses.map(async (status) => {
        const response = await apiClient.get<Order[]>('/orders', {
          'filters[status][$eq]': status,
          'pagination[pageSize]': 1,
        });
        counts[status] = response.meta?.pagination?.total || 0;
      })
    );

    return counts;
  },
};

// ============================================
// ORDER ITEM API METHODS
// ============================================

export const orderItemsApi = {
  /**
   * Update order item status
   */
  async updateStatus(documentId: string, status: OrderItemInput['status']): Promise<ApiResponse<OrderItem>> {
    const data: Partial<OrderItemInput> = { status };

    if (status === 'ready') {
      data.preparedAt = new Date().toISOString();
    }

    return apiClient.put<OrderItem>(`/order-items/${documentId}`, { data });
  },

  /**
   * Update order item
   */
  async update(documentId: string, data: Partial<OrderItemInput>): Promise<ApiResponse<OrderItem>> {
    return apiClient.put<OrderItem>(`/order-items/${documentId}`, { data });
  },

  /**
   * Delete order item
   */
  async delete(documentId: string): Promise<ApiResponse<OrderItem>> {
    return apiClient.delete<OrderItem>(`/order-items/${documentId}`);
  },
};

// ============================================
// PAYMENT API METHODS
// ============================================

export const paymentsApi = {
  /**
   * Create a payment
   */
  async create(data: PaymentInput): Promise<ApiResponse<Payment>> {
    return apiClient.post<Payment>('/payments', { data });
  },

  /**
   * Process a payment
   */
  async process(orderDocumentId: string, paymentData: Omit<PaymentInput, 'order'>): Promise<ApiResponse<Payment>> {
    const data: PaymentInput = {
      ...paymentData,
      order: orderDocumentId as any,
      status: 'completed',
      processedAt: new Date().toISOString(),
    };

    return apiClient.post<Payment>('/payments', { data });
  },

  /**
   * Refund a payment
   */
  async refund(documentId: string, reason?: string): Promise<ApiResponse<Payment>> {
    return apiClient.put<Payment>(`/payments/${documentId}`, {
      data: {
        status: 'refunded',
        refundReason: reason,
      },
    });
  },

  /**
   * Get payment by order ID
   */
  async getByOrderId(orderDocumentId: string): Promise<ApiResponse<Payment[]>> {
    return apiClient.get<Payment[]>('/payments', {
      'filters[order][documentId][$eq]': orderDocumentId,
    });
  },
};
