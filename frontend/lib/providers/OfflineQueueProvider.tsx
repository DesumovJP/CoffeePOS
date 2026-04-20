'use client';

/**
 * Drives the offline order-queue. On mount and on `online` events it flushes
 * the queue. When orders drain successfully it fires a toast through the
 * existing toast bridge so the barista knows delayed orders went through.
 *
 * This is render-less — it registers listeners only.
 */

import { useEffect } from 'react';
import { flush, subscribe, getQueueSize, type FlushResult } from '@/lib/offline/orderQueue';
import { useToast } from '@/components/atoms/Toast';
import { useQueryClient } from '@tanstack/react-query';
import { productKeys } from '@/lib/hooks/useProducts';
import { orderKeys } from '@/lib/hooks/useOrders';

export function OfflineQueueProvider() {
  const { addToast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    let mounted = true;

    const announce = (result: FlushResult) => {
      if (!mounted) return;
      if (result.sent > 0) {
        addToast({
          type: 'success',
          title: 'Офлайн-черга відправлена',
          message: `Надіслано замовлень: ${result.sent}`,
          duration: 4000,
        });
        queryClient.invalidateQueries({ queryKey: productKeys.availability() });
        queryClient.invalidateQueries({ queryKey: orderKeys.all });
      }
      if (result.dropped > 0) {
        addToast({
          type: 'error',
          title: 'Частину черги скасовано',
          message: `Вичерпано спроб: ${result.dropped}. Перевірте лог.`,
          duration: 6000,
        });
      }
    };

    // Initial flush on mount (e.g., after a page reload post-outage)
    if (getQueueSize() > 0) {
      flush().then(announce).catch(() => {});
    }

    const onOnline = () => {
      flush().then(announce).catch(() => {});
    };
    window.addEventListener('online', onOnline);

    // Periodic retry — every 30s if the queue has items.
    const interval = window.setInterval(() => {
      if (getQueueSize() > 0 && navigator.onLine) {
        flush().then(announce).catch(() => {});
      }
    }, 30_000);

    const unsub = subscribe(() => {
      // No-op; the listener ensures re-registration hook if we later add UI.
    });

    return () => {
      mounted = false;
      window.removeEventListener('online', onOnline);
      window.clearInterval(interval);
      unsub();
    };
  }, [addToast, queryClient]);

  return null;
}
