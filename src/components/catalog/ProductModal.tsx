import React, { useState } from 'react';
import { X, ShieldCheck, MessageCircle, AlertCircle, ShoppingBag, Check } from 'lucide-react';
import { Product } from '../../types';
import { formatCurrency } from '../../utils/format';

interface ProductModalProps {
  product: Product | null;
  onClose: () => void;
  onAddToCart: (product: Product, size: string, quantity: number) => void;
  onBuyNow: (product: Product, size: string, quantity: number) => void;
}

export const ProductModal: React.FC<ProductModalProps> = ({
  product,
  onClose,
  onAddToCart,
  onBuyNow,
}) => {
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [validationError, setValidationError] = useState('');

  if (!product) return null;

  const currentStock = selectedSize
    ? product.inventory?.[String(selectedSize)] ?? 0
    : 0;

  const handleSizeClick = (size: string) => {
    const stock = product.inventory?.[String(size)] ?? 0;
    if (stock <= 0) return;
    setSelectedSize(size);
    setQuantity(1);
    setValidationError('');
  };

  const handleAddToCart = () => {
    if (!selectedSize) {
      setValidationError('Por favor, selecione um tamanho disponível antes de adicionar.');
      return;
    }
    if (currentStock <= 0) {
      setValidationError('Este tamanho está esgotado no momento.');
      return;
    }
    setValidationError('');
    onAddToCart(product, selectedSize, quantity);
  };

  const handleBuyNow = () => {
    if (!selectedSize) {
      setValidationError('Por favor, selecione um tamanho disponível antes de comprar.');
      return;
    }
    if (currentStock <= 0) {
      setValidationError('Este tamanho está esgotado no momento.');
      return;
    }
    setValidationError('');
    onBuyNow(product, selectedSize, quantity);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-[#161616] border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden my-4 sm:my-8 flex flex-col max-h-[92vh]">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 sm:top-4 sm:right-4 z-20 p-2 text-zinc-400 hover:text-white bg-zinc-900/90 hover:bg-[#C9000B] rounded-full transition-colors cursor-pointer"
          aria-label="Fechar"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-12 overflow-y-auto flex-1">
          {/* Left Column: Image Gallery */}
          <div className="md:col-span-6 bg-[#1b1b1b] p-4 sm:p-6 flex flex-col justify-between border-b md:border-b-0 md:border-r border-zinc-800">
            <div>
              <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-[#222222] flex items-center justify-center p-4">
                <img
                  src={product.images[activeImageIndex] || product.images[0]}
                  alt={product.name}
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                />
                {product.discountPercent && product.discountPercent > 0 ? (
                  <span className="absolute top-3 left-3 bg-[#C9000B] text-white text-xs font-black px-2.5 py-1 rounded shadow">
                    -{product.discountPercent}% OFF
                  </span>
                ) : null}
              </div>

              {/* Thumbnails if multiple images */}
              {product.images.length > 1 && (
                <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
                  {product.images.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveImageIndex(i)}
                      className={`w-16 h-16 rounded-lg bg-[#222222] p-1 border cursor-pointer shrink-0 transition-all ${
                        activeImageIndex === i
                          ? 'border-[#C9000B] scale-105'
                          : 'border-zinc-700/60 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={img} alt="Miniatura" className="w-full h-full object-contain" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Authenticity Guarantee Card */}
            <div className="mt-5 p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-1.5">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span>GARANTIA DE AUTENTICIDADE OFF.SNEAKERSOFC</span>
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Cada exemplar é verificado fisicamente par a par por especialistas: costuras, etiquetas, palmilha, material e caixa original com procedência 100% garantida.
              </p>
            </div>
          </div>

          {/* Right Column: Contiguous Purchase Module */}
          <div className="md:col-span-6 p-4 sm:p-6 lg:p-8 space-y-4 flex flex-col justify-between">
            <div className="space-y-4">
              {/* Brand, Model & SKU */}
              <div className="flex items-center justify-between text-xs text-zinc-400">
                <span className="text-[#C9000B] font-bold tracking-widest uppercase">
                  {product.brand}
                </span>
                {product.sku && <span className="font-mono text-zinc-500">SKU: {product.sku}</span>}
              </div>

              {/* Title */}
              <h2 className="font-anton text-2xl sm:text-3xl text-white tracking-wide uppercase leading-tight">
                {product.name}
              </h2>

              {/* Pricing Box */}
              <div className="p-3.5 sm:p-4 rounded-xl bg-zinc-900/90 border border-zinc-800">
                <div className="flex flex-wrap items-baseline gap-2">
                  {product.originalPrice && product.originalPrice > product.price && (
                    <span className="text-xs sm:text-sm text-zinc-500 line-through">
                      {formatCurrency(product.originalPrice)}
                    </span>
                  )}
                  <span className="font-anton text-2xl sm:text-3xl text-white tracking-wide">
                    {formatCurrency(product.price)}
                  </span>
                  <span className="text-xs font-bold text-emerald-400 uppercase bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
                    5% OFF NO PIX
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mt-1">
                  Ou parcele no cartão em até 12x mediante atendimento no WhatsApp.
                </p>
              </div>

              {/* Description */}
              <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                {product.description}
              </p>

              {/* Dynamic Sizes Selector */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-white">
                    Selecione o Tamanho:
                  </label>
                  <span className="text-[11px] text-zinc-400">
                    {selectedSize ? `Estoque: ${currentStock} un.` : 'Clique para selecionar'}
                  </span>
                </div>

                <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                  {(product.sizes || []).map((size) => {
                    const isSelected = selectedSize === String(size);
                    const stock = product.inventory?.[String(size)] ?? 0;
                    const hasStock = stock > 0;

                    return (
                      <button
                        key={String(size)}
                        type="button"
                        disabled={!hasStock}
                        onClick={() => handleSizeClick(String(size))}
                        className={`py-2 px-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex flex-col items-center justify-center border min-h-[44px] ${
                          !hasStock
                            ? 'bg-zinc-900/40 text-zinc-600 border-zinc-800/60 cursor-not-allowed line-through'
                            : isSelected
                            ? 'bg-[#C9000B] text-white border-[#C9000B] shadow-md shadow-red-950/50 scale-105'
                            : 'bg-zinc-900 text-zinc-200 border-zinc-700 hover:border-[#C9000B]'
                        }`}
                      >
                        <span className="font-anton text-sm">{size}</span>
                        <span className="text-[9px] font-normal opacity-75">
                          {!hasStock ? 'Esgotado' : stock === 1 ? 'Último' : `${stock} un`}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {validationError && (
                  <p className="mt-2 text-xs text-rose-400 flex items-center gap-1.5 font-medium animate-bounce">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{validationError}</span>
                  </p>
                )}
              </div>

              {/* Quantity Stepper (Bounded by Stock) */}
              {selectedSize && currentStock > 0 && (
                <div className="flex items-center gap-3 pt-1">
                  <span className="text-xs text-zinc-300 font-semibold">Quantidade:</span>
                  <div className="flex items-center border border-zinc-700 rounded-lg overflow-hidden bg-zinc-900">
                    <button
                      type="button"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="px-3 py-1.5 text-zinc-300 hover:text-white hover:bg-zinc-800 cursor-pointer text-xs"
                    >
                      -
                    </button>
                    <span className="px-3 py-1 text-xs font-bold text-white font-mono">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      disabled={quantity >= currentStock}
                      onClick={() => setQuantity(Math.min(currentStock, quantity + 1))}
                      className="px-3 py-1.5 text-zinc-300 hover:text-white hover:bg-zinc-800 disabled:opacity-30 cursor-pointer text-xs"
                    >
                      +
                    </button>
                  </div>
                  <span className="text-[11px] text-zinc-500">
                    (Máximo disponível: {currentStock})
                  </span>
                </div>
              )}
            </div>

            {/* CTAs */}
            <div className="pt-4 space-y-2.5 border-t border-zinc-800">
              <button
                type="button"
                onClick={handleAddToCart}
                className="w-full py-3.5 px-4 bg-zinc-900 hover:bg-zinc-800 active:scale-[0.99] text-white font-bold text-xs uppercase tracking-wider rounded-xl border border-zinc-700 hover:border-zinc-500 transition-colors flex items-center justify-center gap-2 cursor-pointer shadow min-h-[46px]"
              >
                <ShoppingBag className="w-4 h-4 text-[#C9000B]" />
                <span>Adicionar ao Carrinho</span>
              </button>

              <button
                type="button"
                onClick={handleBuyNow}
                className="w-full py-3.5 px-4 bg-[#C9000B] hover:bg-[#a60009] active:scale-[0.99] text-white font-anton tracking-wider text-base uppercase rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-red-950/50 min-h-[48px]"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Comprar Agora no WhatsApp</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
