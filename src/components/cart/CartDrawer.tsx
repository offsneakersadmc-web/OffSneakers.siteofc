import React from 'react';
import { X, Trash2, ArrowRight, ShoppingBag, ShieldCheck } from 'lucide-react';
import { CartItem } from '../../types';
import { formatCurrency } from '../../utils/format';
import { resolveImageUrl, handleImageError } from '../../utils/imageHelper';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  onUpdateQuantity: (productId: string, size: string, newQty: number) => void;
  onRemoveItem: (productId: string, size: string) => void;
  onCheckout: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  cart,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout,
}) => {
  if (!isOpen) return null;

  const subtotal = cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  const pixDiscount = Math.round(subtotal * 0.05);
  const totalPix = subtotal - pixDiscount;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/75 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-[#161616] border-l border-zinc-800 h-full flex flex-col justify-between shadow-2xl">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-[#C9000B]" />
            <h2 className="font-anton text-xl tracking-wider text-white uppercase">
              SEU CARRINHO ({cart.reduce((a, b) => a + b.quantity, 0)})
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg cursor-pointer"
            aria-label="Fechar carrinho"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Item List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
          {cart.length === 0 ? (
            <div className="text-center py-16 space-y-3">
              <ShoppingBag className="w-12 h-12 text-zinc-700 mx-auto" />
              <p className="text-zinc-400 font-semibold text-sm">
                Seu carrinho está vazio
              </p>
              <p className="text-zinc-600 text-xs max-w-xs mx-auto">
                Explore o catálogo da OFF.SNEAKERSOFC e selecione seus sneakers favoritos.
              </p>
            </div>
          ) : (
            cart.map((item, index) => {
              const maxStock = item.product.inventory?.[String(item.size)] ?? 5;
              return (
                <div
                  key={`${item.product.id}-${item.size}-${index}`}
                  className="bg-zinc-900/80 p-3 sm:p-3.5 rounded-xl border border-zinc-800 flex gap-3 items-center"
                >
                  <img
                    src={resolveImageUrl(item.product.images?.[0])}
                    onError={handleImageError}
                    alt={item.product.name}
                    className="w-16 h-16 object-contain bg-zinc-950 rounded-lg p-1 shrink-0"
                  />

                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] text-[#C9000B] font-bold uppercase tracking-widest block truncate">
                      {item.product.brand}
                    </span>
                    <h4 className="text-xs font-semibold text-white truncate">
                      {item.product.name}
                    </h4>
                    <div className="flex items-center gap-2 mt-1 text-xs">
                      <span className="text-zinc-400 font-mono">Tam: {item.size}</span>
                      <span className="text-zinc-600">•</span>
                      <span className="text-white font-bold font-mono">
                        {formatCurrency(item.product.price)}
                      </span>
                    </div>

                    {/* Stepper with max quantity guard */}
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex items-center border border-zinc-700 rounded bg-zinc-950">
                        <button
                          onClick={() => onUpdateQuantity(item.product.id, item.size, item.quantity - 1)}
                          className="px-2.5 py-1 text-xs text-zinc-400 hover:text-white cursor-pointer"
                        >
                          -
                        </button>
                        <span className="px-2.5 text-xs font-bold text-white font-mono">
                          {item.quantity}
                        </span>
                        <button
                          disabled={item.quantity >= maxStock}
                          onClick={() =>
                            onUpdateQuantity(
                              item.product.id,
                              item.size,
                              Math.min(maxStock, item.quantity + 1)
                            )
                          }
                          className="px-2.5 py-1 text-xs text-zinc-400 hover:text-white disabled:opacity-30 cursor-pointer"
                        >
                          +
                        </button>
                      </div>

                      <button
                        onClick={() => onRemoveItem(item.product.id, item.size)}
                        className="text-zinc-500 hover:text-rose-400 p-1.5 rounded cursor-pointer"
                        title="Remover par"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Summary Footer */}
        {cart.length > 0 && (
          <div className="p-4 sm:p-5 border-t border-zinc-800 bg-[#141414] space-y-3">
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-zinc-400">
                <span>Subtotal:</span>
                <span className="font-mono text-zinc-200">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-emerald-400 font-semibold">
                <span>Desconto PIX (5%):</span>
                <span className="font-mono">-{formatCurrency(pixDiscount)}</span>
              </div>
              <div className="flex justify-between text-white text-base font-bold pt-2 border-t border-zinc-800">
                <span className="font-anton uppercase tracking-wider">Total no PIX:</span>
                <span className="font-anton text-xl text-[#ff4d55]">
                  {formatCurrency(totalPix)}
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                onClose();
                onCheckout();
              }}
              className="w-full py-3.5 bg-[#C9000B] hover:bg-[#a60009] active:scale-[0.99] text-white font-anton tracking-wider text-base uppercase rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-red-950/60 min-h-[48px]"
            >
              <span>Prosseguir para Checkout</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="flex items-center justify-center gap-1.5 text-[10px] text-zinc-500 text-center">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span>Compra 100% Segura • Atendimento Oficial OFF.SNEAKERSOFC</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
