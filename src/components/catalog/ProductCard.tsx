import React from 'react';
import { Eye, ShoppingBag } from 'lucide-react';
import { Product } from '../../types';
import { formatCurrency } from '../../utils/format';

interface ProductCardProps {
  product: Product;
  onSelect: (product: Product) => void;
  onQuickAdd?: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onSelect,
}) => {
  const totalStock = Object.values(product.inventory || {}).reduce((a, b) => a + b, 0);
  const isOutOfStock = product.status === 'out_of_stock' || totalStock <= 0;

  // Available sizes preview (only sizes with stock > 0)
  const inStockSizes = (product.sizes || []).filter(
    (s) => (product.inventory?.[String(s)] ?? 0) > 0
  );

  return (
    <div
      onClick={() => onSelect(product)}
      className="group bg-[#181818] rounded-xl overflow-hidden border border-zinc-800/80 hover:border-[#C9000B]/60 transition-all duration-300 flex flex-col justify-between cursor-pointer hover:-translate-y-1 shadow-lg hover:shadow-red-950/20"
    >
      <div>
        {/* Image Container with Consistent Aspect Ratio */}
        <div className="relative aspect-[4/3] w-full bg-[#202020] overflow-hidden flex items-center justify-center p-3">
          <img
            src={product.images[0] || '/src/assets/images/hero_sneaker_reseller_urban_1794010894924.jpg'}
            alt={product.name}
            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
            referrerPolicy="no-referrer"
          />

          {/* Badges */}
          <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 items-start">
            {product.discountPercent && product.discountPercent > 0 ? (
              <span className="bg-[#C9000B] text-white text-[11px] font-black px-2 py-0.5 rounded shadow">
                -{product.discountPercent}% OFF
              </span>
            ) : null}
            {product.newRelease && (
              <span className="bg-zinc-900/90 text-white text-[10px] font-bold px-1.5 py-0.5 rounded border border-zinc-700">
                LANÇAMENTO
              </span>
            )}
          </div>

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
          {/* Metadata Brand & Category */}
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
            {product.originalPrice && product.originalPrice > product.price && (
              <span className="text-xs text-zinc-500 line-through mr-2">
                {formatCurrency(product.originalPrice)}
              </span>
            )}
            <div className="flex items-baseline gap-1.5">
              <span className="font-anton text-lg sm:text-xl tracking-wide text-white">
                {formatCurrency(product.price)}
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
            onSelect(product);
          }}
          disabled={isOutOfStock}
          className={`w-full py-2.5 px-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer border min-h-[42px] ${
            isOutOfStock
              ? 'bg-zinc-900 text-zinc-600 border-zinc-800 cursor-not-allowed'
              : 'bg-zinc-900 hover:bg-[#C9000B] text-zinc-200 hover:text-white border-zinc-700/80 group-hover:border-[#C9000B]'
          }`}
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          <span>{isOutOfStock ? 'Esgotado' : 'Ver Produto'}</span>
        </button>
      </div>
    </div>
  );
};
