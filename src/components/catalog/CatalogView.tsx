import React, { useState, useMemo } from 'react';
import { Search, SlidersHorizontal, ArrowUpDown, X, Tag, Check, Filter } from 'lucide-react';
import { Product } from '../../types';
import { ProductCard } from './ProductCard';
import { storeService } from '../../services/storeService';
import { formatCurrency } from '../../utils/format';

interface CatalogViewProps {
  products: Product[];
  onSelectProduct: (product: Product) => void;
  initialFilter?: {
    brand?: string;
    bestsellersOnly?: boolean;
    releasesOnly?: boolean;
  };
}

export const CatalogView: React.FC<CatalogViewProps> = ({
  products,
  onSelectProduct,
  initialFilter,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBrand, setSelectedBrand] = useState<string>(initialFilter?.brand || 'all');
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [maxPrice, setMaxPrice] = useState<number>(5000);
  const [sortBy, setSortBy] = useState<'bestseller' | 'price_asc' | 'price_desc' | 'discount' | 'newest'>('bestseller');
  const [bestsellerOnly, setBestsellerOnly] = useState(initialFilter?.bestsellersOnly || false);
  const [releasesOnly, setReleasesOnly] = useState(initialFilter?.releasesOnly || false);

  // Mobile Filter Drawer State
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Dynamic Brands & Categories
  const brands = useMemo(() => {
    const list = storeService.getBrands();
    return ['all', ...list];
  }, [products]);

  const categories = useMemo(() => {
    const list = storeService.getCategories();
    return ['all', ...list];
  }, [products]);

  // Collect all unique sizes across current products
  const availableSizes = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      (p.sizes || []).forEach((s) => set.add(String(s)));
    });
    return Array.from(set).sort((a, b) => {
      const numA = parseFloat(a);
      const numB = parseFloat(b);
      if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
      return a.localeCompare(b);
    });
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match =
          product.name.toLowerCase().includes(q) ||
          product.brand.toLowerCase().includes(q) ||
          product.model.toLowerCase().includes(q) ||
          (product.sku && product.sku.toLowerCase().includes(q)) ||
          (product.colorway && product.colorway.toLowerCase().includes(q));
        if (!match) return false;
      }

      // Brand
      if (selectedBrand !== 'all' && product.brand.toLowerCase() !== selectedBrand.toLowerCase()) {
        return false;
      }

      // Category
      if (selectedCategory !== 'all' && product.category.toLowerCase() !== selectedCategory.toLowerCase()) {
        return false;
      }

      // In stock only
      if (inStockOnly) {
        const totalStock = Object.values(product.inventory || {}).reduce((a, b) => a + b, 0);
        if (totalStock <= 0 || product.status === 'out_of_stock') return false;
      }

      // Price limit
      if (product.price > maxPrice) {
        return false;
      }

      // Size
      if (selectedSize !== null) {
        const hasSize = (product.sizes || []).some((s) => String(s) === selectedSize);
        const sizeStock = product.inventory?.[selectedSize] ?? 0;
        if (!hasSize || sizeStock <= 0) return false;
      }

      // Quick flags
      if (bestsellerOnly && !product.bestSeller) return false;
      if (releasesOnly && !product.newRelease) return false;

      return true;
    }).sort((a, b) => {
      if (sortBy === 'price_asc') return a.price - b.price;
      if (sortBy === 'price_desc') return b.price - a.price;
      if (sortBy === 'discount') return (b.discountPercent || 0) - (a.discountPercent || 0);
      if (sortBy === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      return (b.bestSeller ? 1 : 0) - (a.bestSeller ? 1 : 0);
    });
  }, [
    products,
    searchQuery,
    selectedBrand,
    selectedCategory,
    selectedSize,
    inStockOnly,
    maxPrice,
    bestsellerOnly,
    releasesOnly,
    sortBy,
  ]);

  const hasActiveFilters =
    searchQuery ||
    selectedBrand !== 'all' ||
    selectedSize !== null ||
    selectedCategory !== 'all' ||
    inStockOnly ||
    maxPrice < 5000 ||
    bestsellerOnly ||
    releasesOnly;

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedBrand('all');
    setSelectedSize(null);
    setSelectedCategory('all');
    setInStockOnly(false);
    setMaxPrice(5000);
    setBestsellerOnly(false);
    setReleasesOnly(false);
  };

  return (
    <div className="w-full bg-[#111111] min-h-screen py-8 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 sm:space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-zinc-800 pb-5">
          <div>
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#C9000B]">
              CATÁLOGO OFICIAL OFF.SNEAKERSOFC
            </span>
            <h1 className="font-anton text-3xl sm:text-4xl lg:text-5xl text-white tracking-wide uppercase mt-1">
              TODOS OS SNEAKERS & DROPS
            </h1>
            <p className="text-zinc-400 text-xs sm:text-sm mt-1">
              Pares autênticos com procedência verificada e condições especiais de revenda.
            </p>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-3">
            {/* Mobile Filter Button */}
            <button
              onClick={() => setIsMobileFilterOpen(true)}
              className="lg:hidden flex items-center gap-2 px-4 py-2.5 bg-zinc-900 border border-zinc-700 rounded-xl text-xs font-bold text-white uppercase cursor-pointer"
            >
              <Filter className="w-4 h-4 text-[#C9000B]" />
              <span>Filtros {hasActiveFilters ? '●' : ''}</span>
            </button>

            <div className="text-xs text-zinc-400">
              <span className="font-mono tabular-nums text-white font-bold">{filteredProducts.length}</span>
              <span> par(es) encontrado(s)</span>
            </div>
          </div>
        </div>

        {/* Desktop Filter Controls Bar */}
        <div className="hidden lg:block bg-[#181818] p-5 rounded-2xl border border-zinc-800/80 space-y-4">
          <div className="grid grid-cols-12 gap-4">
            {/* Search Input */}
            <div className="col-span-5 relative">
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-zinc-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por nome, marca ou modelo..."
                className="w-full pl-10 pr-8 py-2.5 bg-zinc-900 text-xs text-white placeholder-zinc-500 rounded-xl border border-zinc-700/80 focus:outline-none focus:border-[#C9000B]"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-3 text-zinc-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Brand Dropdown */}
            <div className="col-span-3">
              <select
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
                className="w-full py-2.5 px-3 bg-zinc-900 text-xs text-white rounded-xl border border-zinc-700/80 focus:outline-none focus:border-[#C9000B] cursor-pointer"
              >
                <option value="all">Todas as Marcas ({brands.length - 1})</option>
                {brands
                  .filter((b) => b !== 'all')
                  .map((brand) => (
                    <option key={brand} value={brand}>
                      {brand}
                    </option>
                  ))}
              </select>
            </div>

            {/* Category Dropdown */}
            <div className="col-span-2">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full py-2.5 px-3 bg-zinc-900 text-xs text-white rounded-xl border border-zinc-700/80 focus:outline-none focus:border-[#C9000B] cursor-pointer"
              >
                <option value="all">Categorias</option>
                {categories
                  .filter((c) => c !== 'all')
                  .map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
              </select>
            </div>

            {/* Sort Dropdown */}
            <div className="col-span-2">
              <div className="flex items-center gap-2">
                <ArrowUpDown className="w-4 h-4 text-zinc-400 shrink-0" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="w-full py-2.5 px-3 bg-zinc-900 text-xs text-white rounded-xl border border-zinc-700/80 focus:outline-none focus:border-[#C9000B] cursor-pointer"
                >
                  <option value="bestseller">Mais Vendidos</option>
                  <option value="price_asc">Menor Preço</option>
                  <option value="price_desc">Maior Preço</option>
                  <option value="discount">Maior Desconto</option>
                  <option value="newest">Lançamentos Recentes</option>
                </select>
              </div>
            </div>
          </div>

          {/* Size Filter Pills & Quick Toggles */}
          <div className="pt-3 border-t border-zinc-800/60 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs text-zinc-400 font-semibold mr-2">Tamanhos Disponíveis:</span>
              <button
                onClick={() => setSelectedSize(null)}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                  selectedSize === null
                    ? 'bg-[#C9000B] text-white'
                    : 'bg-zinc-900 text-zinc-400 hover:text-white'
                }`}
              >
                Todos
              </button>
              {availableSizes.map((size) => (
                <button
                  key={size}
                  onClick={() => setSelectedSize(selectedSize === size ? null : size)}
                  className={`w-9 h-8 text-xs font-anton tracking-wide rounded-lg transition-colors cursor-pointer flex items-center justify-center ${
                    selectedSize === size
                      ? 'bg-[#C9000B] text-white shadow-md'
                      : 'bg-zinc-900 text-zinc-300 hover:text-white hover:bg-zinc-800'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setInStockOnly(!inStockOnly)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors flex items-center gap-1.5 ${
                  inStockOnly
                    ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-600'
                    : 'bg-zinc-900 text-zinc-400 hover:text-white'
                }`}
              >
                <Check className={`w-3.5 h-3.5 ${inStockOnly ? 'opacity-100' : 'opacity-40'}`} />
                <span>Apenas em Estoque</span>
              </button>

              <button
                onClick={() => setBestsellerOnly(!bestsellerOnly)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                  bestsellerOnly
                    ? 'bg-[#C9000B] text-white'
                    : 'bg-zinc-900 text-zinc-400 hover:text-white'
                }`}
              >
                ★ Destaques
              </button>

              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="text-xs text-zinc-400 hover:text-rose-400 underline ml-2 cursor-pointer"
                >
                  Limpar Filtros
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Filter Drawer / Bottom Sheet */}
        {isMobileFilterOpen && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex justify-end animate-in fade-in duration-150">
            <div className="w-full max-w-sm bg-[#161616] h-full p-5 flex flex-col justify-between overflow-y-auto border-l border-zinc-800">
              <div className="space-y-5">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-[#C9000B]" />
                    <h3 className="font-anton text-lg text-white uppercase tracking-wider">
                      Filtros do Catálogo
                    </h3>
                  </div>
                  <button
                    onClick={() => setIsMobileFilterOpen(false)}
                    className="p-1.5 text-zinc-400 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Mobile Search */}
                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1">
                    Buscar Sneaker
                  </label>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Nome, modelo..."
                    className="w-full px-3 py-2 bg-zinc-900 text-xs text-white rounded-lg border border-zinc-700"
                  />
                </div>

                {/* Mobile Brands */}
                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1">
                    Marca
                  </label>
                  <select
                    value={selectedBrand}
                    onChange={(e) => setSelectedBrand(e.target.value)}
                    className="w-full p-2 bg-zinc-900 text-xs text-white rounded-lg border border-zinc-700"
                  >
                    <option value="all">Todas as Marcas</option>
                    {brands
                      .filter((b) => b !== 'all')
                      .map((brand) => (
                        <option key={brand} value={brand}>
                          {brand}
                        </option>
                      ))}
                  </select>
                </div>

                {/* Mobile Sizes */}
                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-2">
                    Tamanho Disponível
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {availableSizes.map((size) => (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(selectedSize === size ? null : size)}
                        className={`py-2 text-xs font-anton rounded-lg border ${
                          selectedSize === size
                            ? 'bg-[#C9000B] text-white border-[#C9000B]'
                            : 'bg-zinc-900 text-zinc-300 border-zinc-700'
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>

                {/* In Stock Toggle */}
                <div>
                  <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={inStockOnly}
                      onChange={(e) => setInStockOnly(e.target.checked)}
                      className="rounded text-[#C9000B]"
                    />
                    <span>Ocultar pares esgotados</span>
                  </label>
                </div>

                {/* Sort */}
                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1">
                    Ordenar Por
                  </label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="w-full p-2 bg-zinc-900 text-xs text-white rounded-lg border border-zinc-700"
                  >
                    <option value="bestseller">Mais Vendidos</option>
                    <option value="price_asc">Menor Preço</option>
                    <option value="price_desc">Maior Preço</option>
                    <option value="discount">Maior Desconto</option>
                    <option value="newest">Lançamentos Recentes</option>
                  </select>
                </div>
              </div>

              {/* Mobile Actions */}
              <div className="space-y-2 pt-6 border-t border-zinc-800">
                <button
                  onClick={() => setIsMobileFilterOpen(false)}
                  className="w-full py-3 bg-[#C9000B] hover:bg-red-700 text-white font-anton text-sm uppercase rounded-xl"
                >
                  Aplicar Filtros ({filteredProducts.length})
                </button>
                {hasActiveFilters && (
                  <button
                    onClick={() => {
                      clearFilters();
                      setIsMobileFilterOpen(false);
                    }}
                    className="w-full py-2.5 bg-zinc-900 text-zinc-400 text-xs uppercase rounded-xl"
                  >
                    Limpar Tudo
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Product Grid (2 columns on mobile, 3-4 on desktop) */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-20 bg-[#161616] rounded-2xl border border-zinc-800 space-y-4">
            <Tag className="w-12 h-12 text-zinc-700 mx-auto" />
            <h3 className="font-anton text-2xl text-white uppercase">
              Nenhum sneaker encontrado
            </h3>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto">
              Não encontramos nenhum par com os filtros atuais. Tente ajustar os parâmetros ou limpar os filtros.
            </p>
            <button
              onClick={clearFilters}
              className="px-6 py-2.5 bg-[#C9000B] hover:bg-red-700 text-white font-anton text-xs uppercase rounded-lg cursor-pointer"
            >
              Resetar Filtros
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onSelect={onSelectProduct}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
