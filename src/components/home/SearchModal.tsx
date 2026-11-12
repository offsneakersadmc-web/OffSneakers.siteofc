import React, { useState, useMemo } from 'react';
import { Search, X, ArrowRight } from 'lucide-react';
import { Product } from '../../types';
import { formatCurrency } from '../../utils/format';
import { resolveImageUrl, handleImageError } from '../../utils/imageHelper';
import {
  getDefaultVersion,
  getProductAllSizes,
  getProductPriceRange,
  getVisibleVersions,
} from '../../utils/versionHelper';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onSelectProduct: (product: Product, preferredVersionId?: string) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  products,
  onSelectProduct,
}) => {
  const [query, setQuery] = useState('');

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();

    return products
      .filter((p) => p.status !== 'archived')
      .map((p) => {
        const visibleVersions = getVisibleVersions(p);
        const matchedVersion = visibleVersions.find(
          (v) =>
            v.name.toLowerCase().includes(q) ||
            (v.editionName && v.editionName.toLowerCase().includes(q)) ||
            (v.colorName && v.colorName.toLowerCase().includes(q)) ||
            (v.sku && v.sku.toLowerCase().includes(q))
        );
        const productMatches =
          p.name.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          p.model.toLowerCase().includes(q) ||
          (p.sku && p.sku.toLowerCase().includes(q)) ||
          (p.colorway && p.colorway.toLowerCase().includes(q));

        if (!productMatches && !matchedVersion) return null;
        return { product: p, matchedVersion };
      })
      .filter((r): r is NonNullable<typeof r> => r !== null);
  }, [products, query]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-start justify-center pt-20 px-4 animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-[#181818] border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Search Input Bar */}
        <div className="p-4 border-b border-zinc-800 flex items-center gap-3">
          <Search className="w-5 h-5 text-[#C9000B] shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Busque por sneaker, versão, cor ou SKU (ex: Chicago, Panda, Travis)..."
            className="w-full bg-transparent text-sm text-white placeholder-zinc-500 focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 text-zinc-400 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="px-2.5 py-1 text-xs text-zinc-400 hover:text-white hover:bg-zinc-800 rounded cursor-pointer"
          >
            ESC
          </button>
        </div>

        {/* Results */}
        <div className="max-h-96 overflow-y-auto p-4 space-y-2">
          {query.trim() === '' ? (
            <div className="py-8 text-center text-xs text-zinc-500">
              Digite pelo menos 2 caracteres para pesquisar em todo o catálogo da OFF.SNEAKERSOFC.
            </div>
          ) : results.length === 0 ? (
            <div className="py-8 text-center text-xs text-zinc-400">
              Nenhum sneaker ou versão encontrada para "{query}".
            </div>
          ) : (
            results.map(({ product, matchedVersion }) => {
              const displayVer = matchedVersion || getDefaultVersion(product);
              const priceRange = getProductPriceRange(product);
              const allSizes = getProductAllSizes(product, true);
              const visibleCount = getVisibleVersions(product).length;

              return (
                <button
                  key={product.id}
                  onClick={() => {
                    onSelectProduct(product, displayVer?.id);
                    onClose();
                  }}
                  className="w-full p-3 rounded-xl bg-zinc-900/60 hover:bg-zinc-800/80 border border-zinc-800 flex items-center gap-4 text-left transition-colors cursor-pointer group"
                >
                  <img
                    src={resolveImageUrl(displayVer?.images?.[0] || product.images?.[0])}
                    onError={handleImageError}
                    alt={product.name}
                    className="w-14 h-14 object-contain bg-zinc-950 rounded-lg p-1 shrink-0"
                    referrerPolicy="no-referrer"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-[#C9000B] font-bold uppercase tracking-widest">
                        {product.brand}
                      </span>
                      {visibleCount > 1 && (
                        <span className="text-[10px] text-zinc-400">
                          • {visibleCount} versões
                        </span>
                      )}
                    </div>
                    <h4 className="text-xs font-semibold text-white truncate group-hover:text-red-400">
                      {product.name}
                    </h4>
                    {matchedVersion && (
                      <p className="text-[11px] text-zinc-300 truncate">
                        Versão: {matchedVersion.editionName || matchedVersion.name}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-zinc-400">
                      <span className="font-anton text-sm text-white font-mono tabular-nums">
                        {priceRange.hasRange ? `A partir de ${formatCurrency(priceRange.min)}` : formatCurrency(priceRange.min)}
                      </span>
                      <span>•</span>
                      <span className="truncate">
                        Tamanhos: {allSizes.length > 0 ? allSizes.join(', ') : 'Consulte'}
                      </span>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-zinc-500 group-hover:text-white group-hover:translate-x-1 transition-transform shrink-0" />
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
