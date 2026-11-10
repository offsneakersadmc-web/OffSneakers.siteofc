import React, { useState, useMemo } from 'react';
import { Search, X, ArrowRight } from 'lucide-react';
import { Product } from '../../types';
import { formatCurrency } from '../../utils/format';
import { resolveImageUrl, handleImageError } from '../../utils/imageHelper';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onSelectProduct: (product: Product) => void;
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
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.model.toLowerCase().includes(q) ||
        (p.sku && p.sku.toLowerCase().includes(q))
    );
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
            placeholder="Digite o sneaker que você procura (ex: Jordan 1, Yeezy, Travis)..."
            className="w-full bg-transparent text-sm text-white placeholder-zinc-500 focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 text-zinc-400 hover:text-white"
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
              Nenhum sneaker encontrado para "{query}".
            </div>
          ) : (
            results.map((product) => (
              <button
                key={product.id}
                onClick={() => {
                  onSelectProduct(product);
                  onClose();
                }}
                className="w-full p-3 rounded-xl bg-zinc-900/60 hover:bg-zinc-800/80 border border-zinc-800 flex items-center gap-4 text-left transition-colors cursor-pointer group"
              >
                <img
                  src={resolveImageUrl(product.images?.[0])}
                  onError={handleImageError}
                  alt={product.name}
                  className="w-14 h-14 object-contain bg-zinc-950 rounded-lg p-1 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] text-[#C9000B] font-bold uppercase tracking-widest block">
                    {product.brand}
                  </span>
                  <h4 className="text-xs font-semibold text-white truncate group-hover:text-red-400">
                    {product.name}
                  </h4>
                  <div className="flex items-center gap-2 mt-0.5 text-xs text-zinc-400">
                    <span className="font-anton text-sm text-white font-mono">
                      {formatCurrency(product.price)}
                    </span>
                    <span>•</span>
                    <span>Tamanhos: {product.sizes.join(', ')}</span>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-zinc-500 group-hover:text-white group-hover:translate-x-1 transition-transform" />
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
