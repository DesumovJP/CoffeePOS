/**
 * CoffeePOS - Auth API
 *
 * Authentication endpoints for Strapi Users & Permissions plugin
 */

import { ApiClient } from './client';

// ============================================
// TYPES
// ============================================

export interface AuthUser {
  id: number;
  username: string;
  email: string;
  confirmed: boolean;
  blocked: boolean;
  role?: {
    id: number;
    name: string;
    type: string;
  };
}

export interface LoginResponse {
  jwt: string;
  user: AuthUser;
}

export interface LoginCredentials {
  identifier: string;
  password: string;
}

// ============================================
// CLIENT INSTANCE (unused directly, but keeps pattern consistent)
// ============================================

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const client = ApiClient.getInstance();

// ============================================
// AUTH API
// ============================================

const BASE_URL = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';

export const authApi = {
  /**
   * Login with identifier (email or username) and password
   * Strapi auth endpoint is at /api/auth/local, not under the REST API
   */
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const response = await fetch(`${BASE_URL}/api/auth/local`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error?.error?.message || 'Невірний email або пароль');
    }

    return response.json();
  },

  /**
   * Get current authenticated user with role populated
   */
  async getMe(): Promise<AuthUser> {
    const token = typeof window !== 'undefined'
      ? localStorage.getItem('paradise-pos-token')
      : null;

    const response = await fetch(`${BASE_URL}/api/users/me?populate=role`, {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (!response.ok) throw new Error('Not authenticated');
    return response.json();
  },
};
