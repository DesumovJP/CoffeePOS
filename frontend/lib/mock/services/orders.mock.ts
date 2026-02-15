/**
 * CoffeePOS - Mock Orders, OrderItems, Payments API
 */

import type { ApiResponse } from '@/lib/api/client';
import type {
  Order,
  OrderInput,
  OrderStatus,
  OrderItem,
  OrderItemInput,
  Payment,
  PaymentInput,
} from '@/lib/api/types';
import type { GetOrdersParams, CreateOrderPayload } from '@/lib/api/orders';
import { getStore } from '../store';
import { mockDelay, wrapResponse, generateDocumentId, nowISO } from '../helpers';

export const mockOrdersApi = {
  async getAll(params: GetOrdersParams = {}): Promise<ApiResponse<Order[]>> {
    await mockDelay();
    let items = [...getStore().orders];

    if (params.status) {
      const statuses = Array.isArray(params.status) ? params.status : [params.status];
      items = items.filter((o) => statuses.includes(o.status));
    }
    if (params.dateFrom) {
      items = items.filter((o) => o.createdAt >= params.dateFrom!);
    }
    if (params.dateTo) {
      items = items.filter((o) => o.createdAt <= params.dateTo!);
    }

    items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return wrapResponse(items, items.length);
  },

  async getActive(): Promise<ApiResponse<Order[]>> {
    await mockDelay();
    const activeStatuses: OrderStatus[] = ['pending', 'confirmed', 'preparing', 'ready'];
    const items = getStore().orders
      .filter((o) => activeStatuses.includes(o.status))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return wrapResponse(items, items.length);
  },

  async getById(id: number): Promise<ApiResponse<Order>> {
    await mockDelay();
    const order = getStore().orders.find((o) => o.id === id);
    if (!order) throw { status: 404, name: 'NotFoundError', message: 'Order not found' };
    return wrapResponse(order);
  },

  async getByOrderNumber(orderNumber: string): Promise<ApiResponse<Order[]>> {
    await mockDelay();
    const items = getStore().orders.filter((o) => o.orderNumber === orderNumber);
    return wrapResponse(items, items.length);
  },

  async create(payload: CreateOrderPayload): Promise<ApiResponse<Order>> {
    await mockDelay();
    const store = getStore();
    const now = nowISO();
    const orderId = store.getId();

    // Build order items
    const orderItems: OrderItem[] = payload.items.map((item, idx) => ({
      id: store.getId(),
      documentId: generateDocumentId(),
      productName: item.productName,
      product: item.product ? store.products.find((p) => p.id === item.product) : undefined,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice: item.totalPrice,
      modifiers: item.modifiers,
      notes: item.notes,
      status: 'pending' as const,
      createdAt: now,
      updatedAt: now,
    }));

    // Build payment if provided
    let payment: Payment | undefined;
    if (payload.payment) {
      payment = {
        id: store.getId(),
        documentId: generateDocumentId(),
        method: payload.payment.method,
        status: 'pending',
        amount: payload.payment.amount,
        receivedAmount: payload.payment.receivedAmount,
        changeAmount: payload.payment.changeAmount ?? 0,
        tipAmount: payload.payment.tipAmount ?? 0,
        createdAt: now,
        updatedAt: now,
      };
    }

    const order: Order = {
      id: orderId,
      documentId: generateDocumentId(),
      orderNumber: store.getOrderNumber(),
      status: payload.order.status || 'pending',
      type: payload.order.type || 'dine_in',
      tableNumber: payload.order.tableNumber,
      customerName: payload.order.customerName,
      customerPhone: payload.order.customerPhone,
      subtotal: payload.order.subtotal || 0,
      discountAmount: payload.order.discountAmount || 0,
      discountType: payload.order.discountType || 'none',
      discountValue: payload.order.discountValue || 0,
      taxAmount: payload.order.taxAmount || 0,
      total: payload.order.total || 0,
      notes: payload.order.notes,
      items: orderItems,
      payment,
      priority: payload.order.priority || 'normal',
      createdAt: now,
      updatedAt: now,
    };

    store.orders.unshift(order);

    // Update shift counters
    if (store.currentShift) {
      store.currentShift.ordersCount++;
      store.currentShift.totalSales += order.total;
      if (payment?.method === 'cash') {
        store.currentShift.cashSales += order.total;
      } else {
        store.currentShift.cardSales += order.total;
      }
    }

    return wrapResponse(order);
  },

  async updateStatus(id: number, status: OrderStatus): Promise<ApiResponse<Order>> {
    await mockDelay();
    const store = getStore();
    const idx = store.orders.findIndex((o) => o.id === id);
    if (idx === -1) throw { status: 404, name: 'NotFoundError', message: 'Order not found' };

    const now = nowISO();
    const update: Partial<Order> = { status, updatedAt: now };

    if (status === 'completed') update.completedAt = now;
    if (status === 'ready') update.preparedAt = now;

    store.orders[idx] = { ...store.orders[idx], ...update };
    return wrapResponse(store.orders[idx]);
  },

  async update(id: number, data: Partial<OrderInput>): Promise<ApiResponse<Order>> {
    await mockDelay();
    const store = getStore();
    const idx = store.orders.findIndex((o) => o.id === id);
    if (idx === -1) throw { status: 404, name: 'NotFoundError', message: 'Order not found' };

    store.orders[idx] = { ...store.orders[idx], ...data, updatedAt: nowISO() } as Order;
    return wrapResponse(store.orders[idx]);
  },

  async cancel(id: number): Promise<ApiResponse<Order>> {
    return this.updateStatus(id, 'cancelled');
  },

  async getCountByStatus(): Promise<Record<OrderStatus, number>> {
    await mockDelay();
    const orders = getStore().orders;
    const counts: Record<OrderStatus, number> = {
      pending: 0, confirmed: 0, preparing: 0, ready: 0, completed: 0, cancelled: 0,
    };
    for (const order of orders) {
      counts[order.status]++;
    }
    return counts;
  },
};

export const mockOrderItemsApi = {
  async updateStatus(id: number, status: OrderItemInput['status']): Promise<ApiResponse<OrderItem>> {
    await mockDelay();
    const store = getStore();
    for (const order of store.orders) {
      const item = order.items?.find((i) => i.id === id);
      if (item) {
        const updated = { ...item, status: status || 'pending', updatedAt: nowISO() };
        const idx = order.items!.indexOf(item);
        order.items![idx] = updated;
        return wrapResponse(updated);
      }
    }
    throw { status: 404, name: 'NotFoundError', message: 'Order item not found' };
  },

  async update(id: number, data: Partial<OrderItemInput>): Promise<ApiResponse<OrderItem>> {
    await mockDelay();
    const store = getStore();
    for (const order of store.orders) {
      const item = order.items?.find((i) => i.id === id);
      if (item) {
        const updated = { ...item, ...data, updatedAt: nowISO() } as OrderItem;
        const idx = order.items!.indexOf(item);
        order.items![idx] = updated;
        return wrapResponse(updated);
      }
    }
    throw { status: 404, name: 'NotFoundError', message: 'Order item not found' };
  },

  async delete(id: number): Promise<ApiResponse<OrderItem>> {
    await mockDelay();
    const store = getStore();
    for (const order of store.orders) {
      const idx = order.items?.findIndex((i) => i.id === id) ?? -1;
      if (idx !== -1) {
        const [removed] = order.items!.splice(idx, 1);
        return wrapResponse(removed);
      }
    }
    throw { status: 404, name: 'NotFoundError', message: 'Order item not found' };
  },
};

export const mockPaymentsApi = {
  async create(data: PaymentInput): Promise<ApiResponse<Payment>> {
    await mockDelay();
    const store = getStore();
    const now = nowISO();
    const payment: Payment = {
      id: store.getId(),
      documentId: generateDocumentId(),
      method: data.method,
      status: data.status || 'pending',
      amount: data.amount,
      receivedAmount: data.receivedAmount,
      changeAmount: data.changeAmount ?? 0,
      tipAmount: data.tipAmount ?? 0,
      createdAt: now,
      updatedAt: now,
    };
    return wrapResponse(payment);
  },

  async process(orderId: number, paymentData: Omit<PaymentInput, 'order'>): Promise<ApiResponse<Payment>> {
    await mockDelay();
    const store = getStore();
    const now = nowISO();
    const payment: Payment = {
      id: store.getId(),
      documentId: generateDocumentId(),
      method: paymentData.method,
      status: 'completed',
      amount: paymentData.amount,
      receivedAmount: paymentData.receivedAmount,
      changeAmount: paymentData.changeAmount ?? 0,
      tipAmount: paymentData.tipAmount ?? 0,
      processedAt: now,
      createdAt: now,
      updatedAt: now,
    };

    // Attach payment to order
    const order = store.orders.find((o) => o.id === orderId);
    if (order) {
      order.payment = payment;
    }

    return wrapResponse(payment);
  },

  async refund(id: number, reason?: string): Promise<ApiResponse<Payment>> {
    await mockDelay();
    const store = getStore();
    for (const order of store.orders) {
      if (order.payment?.id === id) {
        order.payment = {
          ...order.payment,
          status: 'refunded',
          refundReason: reason,
          updatedAt: nowISO(),
        };
        return wrapResponse(order.payment);
      }
    }
    throw { status: 404, name: 'NotFoundError', message: 'Payment not found' };
  },

  async getByOrderId(orderId: number): Promise<ApiResponse<Payment[]>> {
    await mockDelay();
    const order = getStore().orders.find((o) => o.id === orderId);
    const payments = order?.payment ? [order.payment] : [];
    return wrapResponse(payments, payments.length);
  },
};
