import React, { useState, useEffect } from 'react';
import { Eye, ShoppingBag, Layers } from 'lucide-react';
import { Product } from '../../types';
import { formatCurrency } from '../../utils/format';
import { resolveImageUrl, handleImageError } from '../../utils/imageHelper';
import {
  getDefaultVersion,
  getEffectiveVersionPrice,
  getProductAllColors,
  getProductAllSizes,
  getProductPriceRange,
  getProductTotalStock,
  getVisibleVersions,
} from '../../utils/versionHelper';

interface ProductCardProps {
  product: Product;
  onSelect: (product: Product, preferredVersionId?: string) => void;
  preferredVersionId?: string;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onSelect,
  preferredVersionId,
}) => {
  const visibleVersions = getVisibleVersions(product);
  const [previewVersionId, setPreviewVersionId] = useState<string | undefined>(preferredVersionId);

  useEffect(() => {
    setPreviewVersionId(preferredVersionId);
  }, [preferredVersionId, product.id]);

  const activeVersion = getDefaultVersion(product, previewVersionId);
  const totalStock = getProductTotalStock(product);
  const isOutOfStock = product.status === 'out_of_stock' || product.status === 'archived' || totalStock <= 0;

  const priceRange = getProductPriceRange(product);
  const activeVersionPrice = getEffectiveVersionPrice(product, activeVersion);
  const displayPrice = previewVersionId ? activeVersionPrice.price : priceRange.min;
  const displayOriginalPrice = previewVersionId
    ? activeVersionPrice.originalPrice
    : priceRange.defaultOriginalPrice;
  const displayDiscount = previewVersionId
    ? activeVersionPrice.discountPercent || 0
    : priceRange.maxDiscount;

  const colors = getProductAllColors(product);
  const inStockSizes = getProductAllSizes(product, true);
  const primaryImage = activeVersion?.images?.[0] || product.images?.[0];

  return (
    <div
      onClick={() => onSelect(product, activeVersion?.id)}
      className="group bg-[#181818] rounded-xl overflow-hidden border border-zinc-800/80 hover:border-[#C9000B]/60 transition-all duration-300 flex flex-col justify-between cursor-pointer hover:-translate-y-1 shadow-lg hover:shadow-red-950/20"
    >
      <div>
        {/* Image Container with Consistent Aspect Ratio */}
        <div className="relative aspect-[4/3] w-full bg-[#202020] overflow-hidden flex items-center justify-center p-3">
          <img
            src={resolveImageUrl(primaryImage)}
            onError={handleImageError}
            alt={`${product.name} ${activeVersion?.name || ''}`}
            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
            referrerPolicy="no-referrer"
          />

          {/* Badges */}
          <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 items-start">
            {displayDiscount > 0 ? (
              <span className="bg-[#C9000B] text-white text-[11px] font-black px-2 py-0.5 rounded shadow">
                -{displayDiscount}% OFF
              </span>
            ) : null}
            {product.newRelease && (
              <span className="bg-zinc-900/90 text-white text-[10px] font-bold px-1.5 py-0.5 rounded border border-zinc-700">
                LANÇAMENTO
              </span>
            )}
          </div>

          {visibleVersions.length > 1 && (
            <div className="absolute top-2.5 right-2.5 bg-black/80 backdrop-blur-xs text-zinc-200 text-[10px] font-bold px-2 py-0.5 rounded border border-zinc-700/80 flex items-center gap-1">
              <Layers className="w-3 h-3 text-[#C9000B]" />
              <span>{visibleVersions.length} versões</span>
            </div>
          )}

          {isOutOfStock && (
            <div className="absolute inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-300 bg-rose-950/80 border border-rose-800 px-3 py-1 rounded">
                ESGOTADO
              </span>
            </div>
          )}

          {/* Quick Action Overlay Button on desktop */}
          <div className="absolute bottom-2.5 right-2.5 opacity-0 group-hover:opacity-100 transition-opacity hidden sm:block">
            <span className="bg-black/80 hover:bg-[#C9000B] text-white p-2 rounded-lg flex items-center justify-center shadow-md">
              <Eye className="w-4 h-4" />
            </span>
          </div>
        </div>

        {/* Product Details */}
        <div className="p-3.5 sm:p-4 space-y-1.5 sm:space-y-2">
          {/* Metadata Brand & Sizes Count */}
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span className="font-bold tracking-wider uppercase text-[#C9000B]">
              {product.brand}
            </span>
            <span className="text-zinc-500 text-[11px]">
              {isOutOfStock
                ? 'Sem estoque'
                : `${inStockSizes.length} tamanho${inStockSizes.length > 1 ? 's' : ''}`}
            </span>
          </div>

          {/* Product Name */}
          <h3 className="font-semibold text-white text-xs sm:text-sm line-clamp-2 group-hover:text-red-400 transition-colors leading-snug">
            {product.name}
          </h3>

          {/* Interactive Version Color Swatches */}
          {colors.length > 0 && (
            <div className="flex items-center gap-1.5 pt-0.5">
              {colors.slice(0, 5).map((c) => {
                const isSelected = activeVersion?.id === c.versionId;
                return (
                  <button
                    key={c.versionId}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPreviewVersionId(c.versionId);
                    }}
                    title={`${c.versionName} (${c.colorName})${c.inStock ? '' : ' - Esgotado'}`}
                    className={`w-4 h-4 rounded-full border transition-all cursor-pointer shrink-0 ${
                      isSelected
                        ? 'ring-2 ring-[#C9000B] ring-offset-1 ring-offset-[#181818] border-white scale-110'
                        : 'border-zinc-600 opacity-80 hover:opacity-100'
                    } ${!c.inStock ? 'opacity-35' : ''}`}
                    style={{ backgroundColor: c.colorHex }}
                  />
                );
              })}
              {colors.length > 5 && (
                <span className="text-[10px] text-zinc-400 font-semibold">+{colors.length - 5}</span>
              )}
              {activeVersion && visibleVersions.length > 1 && (
                <span className="text-[10px] text-zinc-400 truncate ml-1">
                  {activeVersion.name}
                </span>
              )}
            </div>
          )}

          {/* Available Sizes List (Truncated) */}
          <div className="text-[11px] text-zinc-400 truncate">
            {inStockSizes.length > 0 ? (
              <span>Tam: {inStockSizes.join(', ')}</span>
            ) : (
              <span className="text-zinc-500">Consulte reposição</span>
            )}
          </div>

          {/* Pricing Block */}
          <div className="pt-1">
            {displayOriginalPrice && displayOriginalPrice > displayPrice && (
              <span className="text-xs text-zinc-500 line-through mr-2 tabular-nums">
                {formatCurrency(displayOriginalPrice)}
              </span>
            )}
            <div className="flex flex-wrap items-baseline gap-1.5">
              {!previewVersionId && priceRange.hasRange && (
                <span className="text-[10px] text-zinc-400 font-medium">A partir de</span>
              )}
              <span className="font-anton text-lg sm:text-xl tracking-wide text-white tabular-nums">
                {formatCurrency(displayPrice)}
              </span>
              <span className="text-[10px] text-emerald-400 font-bold uppercase">
                no PIX
              </span>
            </div>
            <p className="text-[11px] text-zinc-400">
              ou até 12x no cartão
            </p>
          </div>
        </div>
      </div>

      {/* Card Action Footer */}
      <div className="px-3.5 pb-3.5 sm:px-4 sm:pb-4 pt-1">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSelect(product, activeVersion?.id);
          }}
          className={`w-full py-2.5 px-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer border min-h-[42px] ${
            isOutOfStock
              ? 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-700'
              : 'bg-zinc-900 hover:bg-[#C9000B] text-zinc-200 hover:text-white border-zinc-700/80 group-hover:border-[#C9000B]'
          }`}
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          <span>{isOutOfStock ? 'Ver Detalhes' : 'Ver Produto'}</span>
        </button>
      </div>
    </div>
  );
};
