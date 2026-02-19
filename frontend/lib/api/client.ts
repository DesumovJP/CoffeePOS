/**
 * CoffeePOS - API Client
 *
 * Centralized API client for Strapi backend communication
 */

// ============================================
// TYPES
// ============================================

export interface ApiResponse<T> {
  data: T;
  meta?: {
    pagination?: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
}

export interface ApiError {
  status: number;
  name: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: unknown;
  params?: Record<string, string | number | boolean | undefined>;
  headers?: Record<string, string>;
  cache?: RequestCache;
}

// ============================================
// CONFIG
// ============================================

// In live mode, use relative URL so Next.js rewrites can proxy to Strapi (avoids CORS)
const isProxyMode =
  typeof window !== 'undefined' &&
  process.env.NEXT_PUBLIC_API_MODE === 'live';

const API_URL = isProxyMode
  ? ''
  : (process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337').replace(/\/+$/, '');
const API_PREFIX = '/api';

// ============================================
// HELPERS
// ============================================

function buildUrl(endpoint: string, params?: Record<string, string | number | boolean | undefined>): string {
  const path = `${API_URL}${API_PREFIX}${endpoint}`;

  if (!params || Object.keys(params).length === 0) {
    return path;
  }

  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) {
      searchParams.append(key, String(value));
    }
  });

  return `${path}?${searchParams.toString()}`;
}

function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('paradise-pos-token');
}

// ============================================
// MAIN CLIENT
// ============================================

export class ApiClient {
  private static instance: ApiClient;

  private constructor() {}

  static getInstance(): ApiClient {
    if (!ApiClient.instance) {
      ApiClient.instance = new ApiClient();
    }
    return ApiClient.instance;
  }

  async request<T>(endpoint: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
    const { method = 'GET', body, params, headers = {}, cache } = options;

    const url = buildUrl(endpoint, params);

    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...headers,
    };

    const token = getAuthToken();
    if (token) {
      requestHeaders['Authorization'] = `Bearer ${token}`;
    }

    const fetchOptions: RequestInit = {
      method,
      headers: requestHeaders,
      cache,
    };

    if (body && method !== 'GET') {
      fetchOptions.body = JSON.stringify(body);
    }

    try {
      const response = await fetch(url, fetchOptions);

      if (!response.ok) {
        // Auto-logout on 401 (expired/invalid JWT)
        if (response.status === 401 && typeof window !== 'undefined') {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
          throw { status: 401, name: 'Unauthorized', message: 'Сесія закінчилась' } as ApiError;
        }

        const error = await response.json().catch(() => ({
          error: {
            status: response.status,
            name: 'ApiError',
            message: response.statusText,
          },
        }));

        throw {
          status: response.status,
          name: error.error?.name || 'ApiError',
          message: error.error?.message || response.statusText,
          details: error.error?.details,
        } as ApiError;
      }

      // Handle no content response
      if (response.status === 204) {
        return { data: null as T };
      }

      return response.json();
    } catch (error) {
      if ((error as ApiError).status) {
        throw error;
      }

      // Network or other error
      throw {
        status: 0,
        name: 'NetworkError',
        message: error instanceof Error ? error.message : 'Network error occurred',
      } as ApiError;
    }
  }

  // Convenience methods
  async get<T>(endpoint: string, params?: Record<string, string | number | boolean | undefined>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET', params });
  }

  async post<T>(endpoint: string, body: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'POST', body });
  }

  async put<T>(endpoint: string, body: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'PUT', body });
  }

  async patch<T>(endpoint: string, body: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'PATCH', body });
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

// Export singleton instance
export const apiClient = ApiClient.getInstance();
