'use client';

/**
 * CoffeePOS - Auth Provider
 *
 * Manages authentication state, token persistence, and user context.
 * Supports mock mode (auto-auth) via NEXT_PUBLIC_API_MODE=mock.
 */

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import { authApi, type AuthUser } from '@/lib/api/auth';
import { IS_MOCK } from '@/lib/mock/helpers';

// ============================================
// TYPES
// ============================================

export type UserRole = 'owner' | 'manager' | 'barista';

export interface AuthState {
  /** Current authenticated user */
  user: AuthUser | null;
  /** JWT token */
  token: string | null;
  /** Whether auth state is being loaded */
  isLoading: boolean;
  /** Whether user is authenticated */
  isAuthenticated: boolean;
}

export interface AuthContextValue extends AuthState {
  /** Login with identifier (email/username) and password */
  login: (identifier: string, password: string) => Promise<void>;
  /** Logout and redirect to /login */
  logout: () => void;
}

// ============================================
// MOCK USER
// ============================================

const MOCK_USER: AuthUser = {
  id: 3,
  username: 'Олена Коваленко',
  email: 'olena@paradise.cafe',
  confirmed: true,
  blocked: false,
  role: {
    id: 3,
    name: 'Barista',
    type: 'barista',
  },
};

const MOCK_TOKEN = 'mock-jwt-token';

// ============================================
// STORAGE KEY
// ============================================

const TOKEN_KEY = 'paradise-pos-token';

// ============================================
// CONTEXT
// ============================================

const AuthContext = createContext<AuthContextValue | null>(null);

// ============================================
// PROVIDER
// ============================================

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const router = useRouter();

  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user && !!token;

  // ------------------------------------------
  // Initialize auth state on mount
  // ------------------------------------------
  useEffect(() => {
    async function initAuth() {
      // Mock mode: auto-authenticate
      if (IS_MOCK) {
        setUser(MOCK_USER);
        setToken(MOCK_TOKEN);
        localStorage.setItem(TOKEN_KEY, MOCK_TOKEN);
        setIsLoading(false);
        return;
      }

      // Check for existing token in localStorage
      const savedToken = localStorage.getItem(TOKEN_KEY);

      if (!savedToken) {
        setIsLoading(false);
        return;
      }

      // Validate token by fetching current user
      try {
        const currentUser = await authApi.getMe();
        setUser(currentUser);
        setToken(savedToken);
      } catch {
        // Token is invalid — clear it
        localStorage.removeItem(TOKEN_KEY);
        setUser(null);
        setToken(null);
      } finally {
        setIsLoading(false);
      }
    }

    initAuth();
  }, []);

  // ------------------------------------------
  // Login
  // ------------------------------------------
  const login = useCallback(async (identifier: string, password: string) => {
    const response = await authApi.login({ identifier, password });

    localStorage.setItem(TOKEN_KEY, response.jwt);
    setToken(response.jwt);
    setUser(response.user);
  }, []);

  // ------------------------------------------
  // Logout
  // ------------------------------------------
  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
    router.push('/login');
  }, [router]);

  // ------------------------------------------
  // Context value (memoized)
  // ------------------------------------------
  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isLoading,
      isAuthenticated,
      login,
      logout,
    }),
    [user, token, isLoading, isAuthenticated, login, logout]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// ============================================
// HOOK
// ============================================

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}
