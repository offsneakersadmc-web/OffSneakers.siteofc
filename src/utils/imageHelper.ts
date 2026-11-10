/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const FALLBACK_PRODUCT_IMAGE = '/assets/images/hero_sneaker_reseller_urban_1794010894924.jpg';
export const FALLBACK_LOGO_IMAGE = '/assets/aistudio/Perfil_Instagram_OFFSNEAKERS1_97329a12.png';

/**
 * Resolves and normalizes image URLs for cross-environment compatibility (Local Vite & Netlify Production).
 * Automatically migrates any legacy `/src/assets/` references to static `/assets/` paths.
 */
export function resolveImageUrl(url?: string | null, fallback = FALLBACK_PRODUCT_IMAGE): string {
  if (!url || typeof url !== 'string' || url.trim() === '') {
    return fallback;
  }
  const clean = url.trim();

  // Handle /src/assets/ -> /assets/ migration for static production builds
  if (clean.startsWith('/src/assets/')) {
    return clean.replace('/src/assets/', '/assets/');
  }
  if (clean.startsWith('src/assets/')) {
    return '/' + clean.replace('src/assets/', 'assets/');
  }

  return clean;
}

/**
 * Image error handler that prevents broken image icons on production by setting a graceful fallback.
 */
export function handleImageError(
  event: React.SyntheticEvent<HTMLImageElement, Event>,
  fallback = FALLBACK_PRODUCT_IMAGE
): void {
  const target = event.currentTarget;
  if (!target.src.endsWith(fallback)) {
    target.src = fallback;
  }
}
