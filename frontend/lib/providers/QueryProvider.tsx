'use client';

/**
 * CoffeePOS - Query Provider
 *
 * TanStack Query provider for data fetching
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';

interface QueryProviderProps {
  children: ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Stale time: 5 minutes (menu rarely changes during shift)
            staleTime: 5 * 60 * 1000,
            // Cache time: 30 minutes
            gcTime: 30 * 60 * 1000,
            // Retry failed requests 2 times
            retry: 2,
            // Don't refetch on window focus for POS
            refetchOnWindowFocus: false,
          },
          mutations: {
            // Retry mutations once
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
