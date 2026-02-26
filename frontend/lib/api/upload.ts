/**
 * CoffeePOS - Strapi Upload API
 *
 * Handles file uploads via multipart/form-data to POST /api/upload
 */

import type { StrapiMedia } from './types';

function getUploadBaseUrl(): string {
  if (typeof window === 'undefined') return '';
  const isProxyMode = process.env.NEXT_PUBLIC_API_MODE === 'live';
  if (isProxyMode) return '';
  return (
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.NEXT_PUBLIC_STRAPI_URL ||
    'http://localhost:1337'
  ).replace(/\/+$/, '');
}

/**
 * Upload a single file to Strapi's upload endpoint.
 * Returns the resulting StrapiMedia object.
 */
export async function uploadFile(file: File): Promise<StrapiMedia> {
  const formData = new FormData();
  formData.append('files', file);

  const token =
    typeof window !== 'undefined'
      ? localStorage.getItem('paradise-pos-token')
      : null;

  const response = await fetch(`${getUploadBaseUrl()}/api/upload`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.error?.message || 'Помилка завантаження файлу');
  }

  const results: StrapiMedia[] = await response.json();
  if (!results.length) throw new Error('Upload returned no results');
  return results[0];
}
