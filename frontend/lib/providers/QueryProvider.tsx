'use client';

/**
 * CoffeePOS - Query Provider
 *
 * TanStack Query provider for data fetching
 */

import { QueryClient, QueryClientProvider, MutationCache } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { emitToast } from '@/lib/toastBridge';

interface QueryProviderProps {
  children: ReactNode;
}

interface ToastMeta {
  success?: string;
  error?: string;
  message?: string;
  silent?: boolean;
}

function extractErrorMessage(err: unknown): string | undefined {
  if (!err) return undefined;
  const e = err as { message?: string; response?: { data?: { error?: { message?: string } } } };
  return e?.response?.data?.error?.message || e?.message || undefined;
}

export function QueryProvider({ children }: QueryProviderProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        mutationCache: new MutationCache({
          onSuccess: (_data, _vars, _ctx, mutation) => {
            const toast = mutation.meta?.toast as ToastMeta | undefined;
            if (!toast || toast.silent) return;
            if (toast.success) {
              emitToast({ type: 'success', title: toast.success, message: toast.message, duration: 3000 });
            }
          },
          onError: (error, _vars, _ctx, mutation) => {
            const toast = mutation.meta?.toast as ToastMeta | undefined;
            if (toast?.silent) return;
            const title = toast?.error || 'Помилка операції';
            const message = extractErrorMessage(error);
            emitToast({ type: 'error', title, message, duration: 4000 });
          },
        }),
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000,
            gcTime: 30 * 60 * 1000,
            retry: 2,
            refetchOnWindowFocus: false,
          },
          mutations: {
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
