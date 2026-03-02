/**
 * CoffeePOS - Mock Employees API
 */

import type { ApiResponse } from '@/lib/api/client';
import type {
  Employee,
  EmployeeInput,
  EmployeeStats,
  EmployeePerformance,
  GetEmployeesParams,
} from '@/lib/api/employees';
import { getStore } from '../store';
import { mockDelay, wrapResponse, generateDocumentId, nowISO } from '../helpers';

function getDurationHours(openedAt: string, closedAt?: string): number {
  const start = new Date(openedAt).getTime();
  const end = closedAt ? new Date(closedAt).getTime() : Date.now();
  return (end - start) / (1000 * 60 * 60);
}

export const mockEmployeesApi = {
  async getAll(params: GetEmployeesParams = {}): Promise<ApiResponse<Employee[]>> {
    await mockDelay();
    const store = getStore();
    let items = [...store.employees];

    if (params.role) {
      items = items.filter((e) => e.role === params.role);
    }
    if (params.isActive !== undefined) {
      items = items.filter((e) => e.isActive === params.isActive);
    }
    if (params.search) {
      const q = params.search.toLowerCase();
      items = items.filter(
        (e) =>
          e.name.toLowerCase().includes(q) ||
          e.email.toLowerCase().includes(q) ||
          e.phone.includes(q)
      );
    }

    return wrapResponse(items, items.length);
  },

  async getById(documentId: string): Promise<ApiResponse<Employee>> {
    await mockDelay();
    const store = getStore();
    const emp = store.employees.find((e) => e.documentId === documentId);
    if (!emp) throw { status: 404, name: 'NotFoundError', message: 'Employee not found' };
    return wrapResponse(emp);
  },

  async create(data: EmployeeInput): Promise<ApiResponse<Employee>> {
    await mockDelay();
    const store = getStore();
    const now = nowISO();

    const employee: Employee = {
      id: store.getId(),
      documentId: generateDocumentId(),
      name: data.name,
      email: data.email || '',
      phone: data.phone || '',
      role: data.role,
      position: data.position || '',
      isActive: data.isActive ?? true,
      hireDate: data.hireDate || now.split('T')[0],
      salary: data.salary,
      notes: data.notes,
      createdAt: now,
      updatedAt: now,
    };

    store.employees.push(employee);
    return wrapResponse(employee);
  },

  async update(documentId: string, data: Partial<EmployeeInput>): Promise<ApiResponse<Employee>> {
    await mockDelay();
    const store = getStore();
    const idx = store.employees.findIndex((e) => e.documentId === documentId);
    if (idx === -1) throw { status: 404, name: 'NotFoundError', message: 'Employee not found' };

    const { avatar: _avatar, ...rest } = data;
    store.employees[idx] = {
      ...store.employees[idx],
      ...rest,
      updatedAt: nowISO(),
    };

    return wrapResponse(store.employees[idx]);
  },

  async delete(documentId: string): Promise<ApiResponse<void>> {
    await mockDelay();
    const store = getStore();
    const idx = store.employees.findIndex((e) => e.documentId === documentId);
    if (idx === -1) throw { status: 404, name: 'NotFoundError', message: 'Employee not found' };

    store.employees.splice(idx, 1);
    return wrapResponse(undefined as any);
  },

  async getStats(documentId: string): Promise<ApiResponse<EmployeeStats>> {
    await mockDelay();
    const store = getStore();
    const emp = store.employees.find((e) => e.documentId === documentId);
    if (!emp) throw { status: 404, name: 'NotFoundError', message: 'Employee not found' };

    const name = emp.name;

    // Shifts (current + closed)
    const allShifts = [...store.closedShifts];
    if (store.currentShift) allShifts.unshift(store.currentShift);
    const myShifts = allShifts.filter((s) => s.openedBy === name);

    const totalShifts = myShifts.length;
    const totalHours = myShifts.reduce((sum, s) => sum + getDurationHours(s.openedAt, s.closedAt), 0);

    // Orders
    const myOrders = store.orders.filter((o) => o.createdBy === name && o.status === 'completed');
    const totalOrders = myOrders.length;
    const totalSales = myOrders.reduce((sum, o) => sum + o.total, 0);
    const avgOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

    // Daily sales/hours for last 7 days
    const now = new Date();
    const dailySales: { date: string; sales: number }[] = [];
    const dailyHours: { date: string; hours: number }[] = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const shortDate = `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}`;

      const daySales = myOrders
        .filter((o) => o.createdAt.startsWith(key))
        .reduce((sum, o) => sum + o.total, 0);

      const dayHours = myShifts
        .filter((s) => s.openedAt.startsWith(key))
        .reduce((sum, s) => sum + getDurationHours(s.openedAt, s.closedAt), 0);

      dailySales.push({ date: shortDate, sales: Math.round(daySales) });
      dailyHours.push({ date: shortDate, hours: Math.round(dayHours * 10) / 10 });
    }

    return wrapResponse({
      totalShifts,
      totalHours: Math.round(totalHours * 10) / 10,
      totalOrders,
      totalSales: Math.round(totalSales),
      avgOrderValue: Math.round(avgOrderValue),
      dailySales,
      dailyHours,
    });
  },

  async getPerformance(): Promise<ApiResponse<EmployeePerformance[]>> {
    await mockDelay();
    const store = getStore();

    const allShifts = [...store.closedShifts];
    if (store.currentShift) allShifts.unshift(store.currentShift);

    const performance: EmployeePerformance[] = store.employees
      .filter((e) => e.isActive)
      .map((emp) => {
        const myShifts = allShifts.filter((s) => s.openedBy === emp.name);
        const myOrders = store.orders.filter((o) => o.createdBy === emp.name && o.status === 'completed');

        const totalSales = myOrders.reduce((sum, o) => sum + o.total, 0);
        const totalHours = myShifts.reduce((sum, s) => sum + getDurationHours(s.openedAt, s.closedAt), 0);
        const totalOrders = myOrders.length;

        return {
          employeeId: emp.id,
          employeeName: emp.name,
          role: emp.role,
          totalSales: Math.round(totalSales),
          totalHours: Math.round(totalHours * 10) / 10,
          totalOrders,
          avgOrderValue: totalOrders > 0 ? Math.round(totalSales / totalOrders) : 0,
          shiftsCount: myShifts.length,
        };
      })
      .sort((a, b) => b.totalSales - a.totalSales);

    return wrapResponse(performance, performance.length);
  },
};
