import { Product, ProductVersion, ProductSpec } from '../types';

export function sortSizesList(sizes: string[]): string[] {
  return [...sizes].sort((a, b) => {
    const numA = parseFloat(a);
    const numB = parseFloat(b);
    if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
    return a.localeCompare(b, 'pt-BR');
  });
}

export function createLegacyDefaultVersion(product: Product): ProductVersion {
  const now = product.updatedAt || product.createdAt || new Date().toISOString();
  const baseSizes = Array.isArray(product.sizes) ? product.sizes.map(String) : [];
  const baseInventory: Record<string, number> = {};
  baseSizes.forEach((s) => {
    baseInventory[s] = Number(product.inventory?.[s] ?? 0);
  });

  return {
    id: `ver-${product.id}-default`,
    productId: product.id,
    name: product.colorway || 'Edição Padrão',
    editionName: product.name,
    colorName: product.colorway || 'Padrão',
    colorHex: inferColorHex(product.colorway || ''),
    description: product.description || '',
    specs: product.specs || [],
    images:
      Array.isArray(product.images) && product.images.length > 0
        ? product.images
        : ['/assets/images/product_jordan_retro_high_1794010895050.jpg'],
    price: Number(product.price || 0),
    originalPrice: product.originalPrice,
    discountPercent: product.discountPercent,
    sku: product.sku,
    sizes: baseSizes,
    inventory: baseInventory,
    active: product.status !== 'archived',
    hidden: false,
    isDefault: true,
    isFeatured: product.featured ?? false,
    order: 0,
    createdAt: product.createdAt || now,
    updatedAt: now,
  };
}

export function inferColorHex(colorName: string): string {
  const c = colorName.toLowerCase();
  if (c.includes('chicago') || c.includes('red') || c.includes('vermelh') || c.includes('bred')) return '#C9000B';
  if (c.includes('olive') || c.includes('verde') || c.includes('green')) return '#4A5D3F';
  if (c.includes('blue') || c.includes('azul') || c.includes('royal') || c.includes('unc')) return '#1D4ED8';
  if (c.includes('bone') || c.includes('cream') || c.includes('sail') || c.includes('mocha')) return '#E5DEC9';
  if (c.includes('white') || c.includes('branco') || c.includes('triple white')) return '#F4F4F5';
  if (c.includes('black') || c.includes('preto') || c.includes('panda')) return '#18181B';
  if (c.includes('grey') || c.includes('gray') || c.includes('cinza')) return '#71717A';
  if (c.includes('yellow') || c.includes('amarel') || c.includes('gold')) return '#EAB308';
  if (c.includes('pink') || c.includes('rosa')) return '#EC4899';
  if (c.includes('purple') || c.includes('roxo')) return '#7C3AED';
  if (c.includes('orange') || c.includes('laranja')) return '#EA580C';
  return '#71717A';
}

export function getAllVersions(product: Product): ProductVersion[] {
  if (Array.isArray(product.versions) && product.versions.length > 0) {
    return [...product.versions].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }
  return [createLegacyDefaultVersion(product)];
}

export function getVisibleVersions(product: Product): ProductVersion[] {
  return getAllVersions(product).filter((v) => !v.hidden);
}

export function getVersionTotalStock(version: ProductVersion): number {
  const sizes = Array.isArray(version.sizes) ? version.sizes : [];
  const inv = version.inventory || {};
  if (sizes.length > 0) {
    return sizes.reduce((sum, s) => sum + Math.max(0, Number(inv[String(s)] ?? 0)), 0);
  }
  return Object.values(inv).reduce((sum, q) => sum + Math.max(0, Number(q ?? 0)), 0);
}

export function getVersionSizeStock(version: ProductVersion, size: string): number {
  return Math.max(0, Number(version.inventory?.[String(size)] ?? 0));
}

export function isVersionPurchasable(version: ProductVersion): boolean {
  return version.active !== false && !version.hidden && getVersionTotalStock(version) > 0;
}

export function getDefaultVersion(product: Product, preferredVersionId?: string): ProductVersion {
  const visible = getVisibleVersions(product);
  const pool = visible.length > 0 ? visible : getAllVersions(product);

  if (preferredVersionId) {
    const preferred = pool.find((v) => v.id === preferredVersionId);
    if (preferred) return preferred;
  }

  const explicitlyDefault = pool.find((v) => v.isDefault && v.active !== false);
  if (explicitlyDefault) return explicitlyDefault;

  const firstPurchasable = pool.find((v) => isVersionPurchasable(v));
  if (firstPurchasable) return firstPurchasable;

  return pool[0];
}

export function getEffectiveVersionPrice(
  product: Product,
  version?: ProductVersion
): { price: number; originalPrice?: number; discountPercent?: number } {
  if (product.pricingMode === 'shared' || !version) {
    return {
      price: Number(product.price || 0),
      originalPrice: product.originalPrice,
      discountPercent: product.discountPercent,
    };
  }
  return {
    price: Number(version.price ?? product.price ?? 0),
    originalPrice: version.originalPrice ?? product.originalPrice,
    discountPercent: version.discountPercent ?? product.discountPercent,
  };
}

export function getEffectiveVersionDescription(product: Product, version?: ProductVersion): string {
  if (product.descriptionMode === 'individual' && version?.description?.trim()) {
    return version.description;
  }
  return product.description || version?.description || '';
}

export function getEffectiveVersionSpecs(product: Product, version?: ProductVersion): ProductSpec[] {
  if (product.specsMode === 'individual' && Array.isArray(version?.specs) && version.specs.length > 0) {
    return version.specs;
  }
  if (Array.isArray(product.specs) && product.specs.length > 0) {
    return product.specs;
  }
  return version?.specs || [];
}

export function getProductTotalStock(product: Product): number {
  const visible = getVisibleVersions(product);
  return visible
    .filter((v) => v.active !== false)
    .reduce((sum, v) => sum + getVersionTotalStock(v), 0);
}

export function getProductPriceRange(product: Product): {
  min: number;
  max: number;
  hasRange: boolean;
  defaultPrice: number;
  defaultOriginalPrice?: number;
  maxDiscount: number;
} {
  const visible = getVisibleVersions(product);
  const def = getDefaultVersion(product);
  const defPriceObj = getEffectiveVersionPrice(product, def);

  if (product.pricingMode === 'shared' || visible.length <= 1) {
    return {
      min: defPriceObj.price,
      max: defPriceObj.price,
      hasRange: false,
      defaultPrice: defPriceObj.price,
      defaultOriginalPrice: defPriceObj.originalPrice,
      maxDiscount: defPriceObj.discountPercent || 0,
    };
  }

  const prices = visible.map((v) => getEffectiveVersionPrice(product, v));
  const min = Math.min(...prices.map((p) => p.price));
  const max = Math.max(...prices.map((p) => p.price));
  const maxDiscount = Math.max(0, ...prices.map((p) => p.discountPercent || 0));

  return {
    min,
    max,
    hasRange: min !== max,
    defaultPrice: defPriceObj.price,
    defaultOriginalPrice: defPriceObj.originalPrice,
    maxDiscount,
  };
}

export function getProductAllSizes(product: Product, inStockOnly = false): string[] {
  const visible = getVisibleVersions(product).filter((v) => v.active !== false);
  const set = new Set<string>();
  visible.forEach((v) => {
    (v.sizes || []).forEach((s) => {
      const sizeStr = String(s);
      if (!inStockOnly || getVersionSizeStock(v, sizeStr) > 0) {
        set.add(sizeStr);
      }
    });
  });
  return sortSizesList(Array.from(set));
}

export function getProductAllColors(product: Product): {
  versionId: string;
  versionName: string;
  colorName: string;
  colorHex: string;
  image?: string;
  inStock: boolean;
}[] {
  return getVisibleVersions(product).map((v) => ({
    versionId: v.id,
    versionName: v.editionName || v.name,
    colorName: v.colorName || v.name,
    colorHex: v.colorHex || inferColorHex(v.colorName || v.name),
    image: v.images?.[0],
    inStock: v.active !== false && getVersionTotalStock(v) > 0,
  }));
}

export function getCartItemKey(productId: string, versionId: string | undefined, size: string): string {
  return `${productId}::${versionId || 'default'}::${String(size)}`;
}

export function cleanFirestoreData<T>(obj: T): T {
  if (Array.isArray(obj)) {
    return obj.map((item) => cleanFirestoreData(item)) as unknown as T;
  }
  if (obj !== null && typeof obj === 'object') {
    const cleaned: Record<string, unknown> = {};
    Object.entries(obj as Record<string, unknown>).forEach(([k, v]) => {
      if (v !== undefined) {
        cleaned[k] = cleanFirestoreData(v);
      }
    });
    return cleaned as T;
  }
  return obj;
}

export function syncProductSummaryFromVersions(product: Product): Product {
  const now = new Date().toISOString();
  const rawVersions =
    Array.isArray(product.versions) && product.versions.length > 0
      ? product.versions
      : [createLegacyDefaultVersion(product)];

  const normalizedVersions: ProductVersion[] = rawVersions.map((v, idx) => {
    const sizes = Array.isArray(v.sizes) ? v.sizes.map(String) : [];
    const inv: Record<string, number> = {};
    sizes.forEach((s) => {
      inv[s] = Math.max(0, Number(v.inventory?.[s] ?? 0));
    });
    const effectivePrice =
      product.pricingMode === 'shared' ? Number(product.price || v.price || 0) : Number(v.price ?? product.price ?? 0);
    const effectiveOrig =
      product.pricingMode === 'shared' ? product.originalPrice : v.originalPrice;
    const effectiveDisc =
      product.pricingMode === 'shared' ? product.discountPercent : v.discountPercent;

    return {
      ...v,
      id: v.id || `ver-${product.id}-${idx + 1}`,
      productId: product.id,
      name: v.name || `Versão ${idx + 1}`,
      colorName: v.colorName || v.name || 'Padrão',
      colorHex: v.colorHex || inferColorHex(v.colorName || v.name || ''),
      images:
        Array.isArray(v.images) && v.images.length > 0
          ? v.images
          : ['/assets/images/product_jordan_retro_high_1794010895050.jpg'],
      price: effectivePrice,
      ...(effectiveOrig !== undefined ? { originalPrice: effectiveOrig } : {}),
      ...(effectiveDisc !== undefined ? { discountPercent: effectiveDisc } : {}),
      sizes,
      inventory: inv,
      active: v.active !== false,
      hidden: Boolean(v.hidden),
      isDefault: Boolean(v.isDefault),
      order: v.order ?? idx,
      createdAt: v.createdAt || now,
      updatedAt: now,
    };
  });

  // Ensure exactly one default if none selected
  if (!normalizedVersions.some((v) => v.isDefault && !v.hidden) && normalizedVersions.length > 0) {
    const firstVisible = normalizedVersions.find((v) => !v.hidden) || normalizedVersions[0];
    firstVisible.isDefault = true;
  }

  const visibleActive = normalizedVersions.filter((v) => !v.hidden && v.active !== false);
  const primary =
    visibleActive.find((v) => v.isDefault) ||
    visibleActive[0] ||
    normalizedVersions.find((v) => v.isDefault) ||
    normalizedVersions[0];

  // Aggregated sizes and inventory for summary compatibility
  const aggInventory: Record<string, number> = {};
  const sizeSet = new Set<string>();
  visibleActive.forEach((v) => {
    v.sizes.forEach((s) => {
      sizeSet.add(s);
      aggInventory[s] = (aggInventory[s] || 0) + (v.inventory[s] || 0);
    });
  });

  const totalStock = visibleActive.reduce((sum, v) => sum + getVersionTotalStock(v), 0);

  return cleanFirestoreData({
    ...product,
    pricingMode: product.pricingMode || 'individual',
    descriptionMode: product.descriptionMode || 'shared',
    specsMode: product.specsMode || 'shared',
    images: primary?.images?.length ? primary.images : product.images,
    price: primary ? primary.price : product.price,
    originalPrice: primary ? primary.originalPrice : product.originalPrice,
    discountPercent: primary ? primary.discountPercent : product.discountPercent,
    colorway: primary ? primary.colorName : product.colorway,
    sku: primary?.sku || product.sku,
    sizes: sortSizesList(Array.from(sizeSet)),
    inventory: aggInventory,
    status: product.status === 'archived' ? 'archived' : totalStock > 0 ? 'active' : 'out_of_stock',
    versions: normalizedVersions,
    updatedAt: now,
  });
}
