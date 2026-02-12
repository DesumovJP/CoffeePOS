'use client';

/**
 * ParadisePOS - Inventory Page Redirect
 *
 * Redirects to /admin/products with ingredients tab selected
 */

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function InventoryRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin/products?view=ingredients');
  }, [router]);

  return null;
}
