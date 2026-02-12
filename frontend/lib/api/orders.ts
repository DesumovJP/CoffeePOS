/**
 * ParadisePOS - Orders API
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
  async getById(id: number): Promise<ApiResponse<Order>> {
    return apiClient.get<Order>(`/orders/${id}`, {
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
   * Create a new order with items
   */
  async create(payload: CreateOrderPayload): Promise<ApiResponse<Order>> {
    // First create the order
    const orderResponse = await apiClient.post<Order>('/orders', {
      data: payload.order,
    });

    const orderId = orderResponse.data.id;

    // Create order items
    await Promise.all(
      payload.items.map((item) =>
        apiClient.post('/order-items', {
          data: { ...item, order: orderId },
        })
      )
    );

    // Create payment if provided
    if (payload.payment) {
      await apiClient.post('/payments', {
        data: { ...payload.payment, order: orderId },
      });
    }

    // Return the complete order
    return ordersApi.getById(orderId);
  },

  /**
   * Update order status
   */
  async updateStatus(id: number, status: OrderStatus): Promise<ApiResponse<Order>> {
    const data: Partial<OrderInput> = { status };

    if (status === 'completed') {
      data.completedAt = new Date().toISOString();
    } else if (status === 'ready') {
      data.preparedAt = new Date().toISOString();
    }

    return apiClient.put<Order>(`/orders/${id}`, { data });
  },

  /**
   * Update order
   */
  async update(id: number, data: Partial<OrderInput>): Promise<ApiResponse<Order>> {
    return apiClient.put<Order>(`/orders/${id}`, { data });
  },

  /**
   * Cancel an order
   */
  async cancel(id: number): Promise<ApiResponse<Order>> {
    return ordersApi.updateStatus(id, 'cancelled');
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
  async updateStatus(id: number, status: OrderItemInput['status']): Promise<ApiResponse<OrderItem>> {
    const data: Partial<OrderItemInput> = { status };

    if (status === 'ready') {
      data.preparedAt = new Date().toISOString();
    }

    return apiClient.put<OrderItem>(`/order-items/${id}`, { data });
  },

  /**
   * Update order item
   */
  async update(id: number, data: Partial<OrderItemInput>): Promise<ApiResponse<OrderItem>> {
    return apiClient.put<OrderItem>(`/order-items/${id}`, { data });
  },

  /**
   * Delete order item
   */
  async delete(id: number): Promise<ApiResponse<OrderItem>> {
    return apiClient.delete<OrderItem>(`/order-items/${id}`);
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
  async process(orderId: number, paymentData: Omit<PaymentInput, 'order'>): Promise<ApiResponse<Payment>> {
    const data: PaymentInput = {
      ...paymentData,
      order: orderId,
      status: 'completed',
      processedAt: new Date().toISOString(),
    };

    return apiClient.post<Payment>('/payments', { data });
  },

  /**
   * Refund a payment
   */
  async refund(id: number, reason?: string): Promise<ApiResponse<Payment>> {
    return apiClient.put<Payment>(`/payments/${id}`, {
      data: {
        status: 'refunded',
        refundReason: reason,
      },
    });
  },

  /**
   * Get payment by order ID
   */
  async getByOrderId(orderId: number): Promise<ApiResponse<Payment[]>> {
    return apiClient.get<Payment[]>('/payments', {
      'filters[order][id][$eq]': orderId,
    });
  },
};
