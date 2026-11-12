import React, { useState, useEffect } from 'react';
import {
  X,
  ShieldCheck,
  MessageCircle,
  AlertCircle,
  ShoppingBag,
  Layers,
  Tag,
  Ruler,
  Package,
} from 'lucide-react';
import { Product, ProductVersion } from '../../types';
import { formatCurrency } from '../../utils/format';
import { resolveImageUrl, handleImageError } from '../../utils/imageHelper';
import {
  getDefaultVersion,
  getEffectiveVersionDescription,
  getEffectiveVersionPrice,
  getEffectiveVersionSpecs,
  getVersionSizeStock,
  getVersionTotalStock,
  getVisibleVersions,
} from '../../utils/versionHelper';

interface ProductModalProps {
  product: Product | null;
  initialVersionId?: string;
  isPreview?: boolean;
  onClose: () => void;
  onAddToCart: (product: Product, version: ProductVersion, size: string, quantity: number) => void;
  onBuyNow: (product: Product, version: ProductVersion, size: string, quantity: number) => void;
}

const FOCAL_CLASSES: Record<string, string> = {
  center: 'object-center',
  top: 'object-top',
  bottom: 'object-bottom',
  left: 'object-left',
  right: 'object-right',
};

export const ProductModal: React.FC<ProductModalProps> = ({
  product,
  initialVersionId,
  isPreview = false,
  onClose,
  onAddToCart,
  onBuyNow,
}) => {
  const [selectedVersionId, setSelectedVersionId] = useState<string>('');
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    if (!product) return;
    const def = getDefaultVersion(product, initialVersionId);
    setSelectedVersionId(def.id);
    setActiveImageIndex(0);
    setSelectedSize(null);
    setQuantity(1);
    setValidationError('');
  }, [product?.id, initialVersionId]);

  if (!product) return null;

  const visibleVersions = getVisibleVersions(product);
  const selectedVersion =
    visibleVersions.find((v) => v.id === selectedVersionId) ||
    getDefaultVersion(product, initialVersionId);

  const versionImages =
    selectedVersion?.images && selectedVersion.images.length > 0
      ? selectedVersion.images
      : product.images || [];
  const activeImgUrl = versionImages[activeImageIndex] || versionImages[0];
  const activeImgMeta = selectedVersion?.imageMeta?.[activeImgUrl];
  const imgFitClass = activeImgMeta?.objectFit === 'cover' ? 'object-cover' : 'object-contain';
  const imgFocalClass = FOCAL_CLASSES[activeImgMeta?.focalPoint || 'center'] || 'object-center';

  const effectivePrice = getEffectiveVersionPrice(product, selectedVersion);
  const effectiveDescription = getEffectiveVersionDescription(product, selectedVersion);
  const effectiveSpecs = getEffectiveVersionSpecs(product, selectedVersion);
  const versionTotalStock = getVersionTotalStock(selectedVersion);
  const isVersionAvailable = selectedVersion.active !== false && versionTotalStock > 0;

  const currentSizeStock = selectedSize
    ? getVersionSizeStock(selectedVersion, String(selectedSize))
    : 0;

  const handleSelectVersion = (ver: ProductVersion) => {
    setSelectedVersionId(ver.id);
    setActiveImageIndex(0);
    setQuantity(1);
    setValidationError('');

    // Preserve selected size only if it has stock in the newly chosen version
    if (selectedSize && getVersionSizeStock(ver, selectedSize) <= 0) {
      setSelectedSize(null);
    }
  };

  const handleSizeClick = (size: string) => {
    if (!isVersionAvailable) return;
    const stock = getVersionSizeStock(selectedVersion, size);
    if (stock <= 0) return;
    setSelectedSize(size);
    setQuantity(1);
    setValidationError('');
  };

  const validateSelection = (): boolean => {
    if (!isVersionAvailable) {
      setValidationError('Esta versão está indisponível ou esgotada no momento. Escolha outra edição.');
      return false;
    }
    if (!selectedSize) {
      setValidationError('Por favor, selecione um tamanho disponível antes de continuar.');
      return false;
    }
    if (currentSizeStock <= 0) {
      setValidationError('Este tamanho está esgotado nesta versão.');
      return false;
    }
    if (quantity > currentSizeStock) {
      setValidationError(`Apenas ${currentSizeStock} unidade(s) disponíveis neste tamanho.`);
      return false;
    }
    return true;
  };

  const handleAddToCart = () => {
    if (isPreview) {
      setValidationError('Modo de pré-visualização: salve o produto para habilitar compras.');
      return;
    }
    if (!validateSelection() || !selectedSize) return;
    setValidationError('');
    onAddToCart(product, selectedVersion, selectedSize, quantity);
  };

  const handleBuyNow = () => {
    if (isPreview) {
      setValidationError('Modo de pré-visualização: salve o produto para habilitar compras.');
      return;
    }
    if (!validateSelection() || !selectedSize) return;
    setValidationError('');
    onBuyNow(product, selectedVersion, selectedSize, quantity);
  };

  const displaySku = selectedVersion.sku || product.sku;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl bg-[#161616] border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden my-4 sm:my-8 flex flex-col max-h-[92vh]">
        {isPreview && (
          <div className="bg-amber-500/15 border-b border-amber-500/40 px-4 py-2 text-xs text-amber-300 font-semibold flex items-center justify-between">
            <span>PRÉ-VISUALIZAÇÃO DA LOJA — Assim seus clientes verão este produto e suas versões</span>
          </div>
        )}

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 sm:top-4 sm:right-4 z-20 p-2 text-zinc-400 hover:text-white bg-zinc-900/90 hover:bg-[#C9000B] rounded-full transition-colors cursor-pointer"
          aria-label="Fechar"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-12 overflow-y-auto flex-1">
          {/* Left Column: Exclusive Per-Version Image Gallery */}
          <div className="md:col-span-6 bg-[#1b1b1b] p-4 sm:p-6 flex flex-col justify-between border-b md:border-b-0 md:border-r border-zinc-800">
            <div>
              <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-[#222222] flex items-center justify-center p-3">
                <img
                  key={`${selectedVersion.id}-${activeImageIndex}`}
                  src={resolveImageUrl(activeImgUrl)}
                  onError={handleImageError}
                  alt={`${product.name} — ${selectedVersion.editionName || selectedVersion.name}`}
                  className={`w-full h-full ${imgFitClass} ${imgFocalClass} transition-opacity duration-200`}
                  referrerPolicy="no-referrer"
                />

                {effectivePrice.discountPercent && effectivePrice.discountPercent > 0 ? (
                  <span className="absolute top-3 left-3 bg-[#C9000B] text-white text-xs font-black px-2.5 py-1 rounded shadow">
                    -{effectivePrice.discountPercent}% OFF
                  </span>
                ) : null}

                {!isVersionAvailable && (
                  <div className="absolute inset-0 bg-black/65 flex items-center justify-center">
                    <span className="px-4 py-1.5 rounded-lg bg-rose-950/90 border border-rose-700 text-rose-200 text-xs font-bold uppercase tracking-wider">
                      Versão Indisponível / Esgotada
                    </span>
                  </div>
                )}
              </div>

              {/* Thumbnails exclusively for the selected version */}
              {versionImages.length > 1 && (
                <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
                  {versionImages.map((img, i) => (
                    <button
                      key={`${selectedVersion.id}-thumb-${i}`}
                      type="button"
                      onClick={() => setActiveImageIndex(i)}
                      className={`w-16 h-16 rounded-lg bg-[#222222] p-1 border cursor-pointer shrink-0 transition-all ${
                        activeImageIndex === i
                          ? 'border-[#C9000B] scale-105'
                          : 'border-zinc-700/60 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img
                        src={resolveImageUrl(img)}
                        onError={handleImageError}
                        alt={`${selectedVersion.name} foto ${i + 1}`}
                        className="w-full h-full object-contain"
                        referrerPolicy="no-referrer"
                      />
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

          {/* Right Column: Contiguous Purchase & Version Selector Module */}
          <div className="md:col-span-6 p-4 sm:p-6 lg:p-7 space-y-4 flex flex-col justify-between">
            <div className="space-y-4">
              {/* Brand & SKU */}
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-400 pr-8">
                <span className="text-[#C9000B] font-bold tracking-widest uppercase">
                  {product.brand} {product.category ? `• ${product.category}` : ''}
                </span>
                {displaySku && <span className="font-mono text-zinc-400">SKU: {displaySku}</span>}
              </div>

              {/* Title + Selected Version Edition */}
              <div>
                <h2 className="font-anton text-2xl sm:text-3xl text-white tracking-wide uppercase leading-tight">
                  {product.name}
                </h2>
                <div className="flex flex-wrap items-center gap-2 mt-1.5">
                  {selectedVersion.colorHex && (
                    <span
                      className="w-3.5 h-3.5 rounded-full border border-white/30 shrink-0"
                      style={{ backgroundColor: selectedVersion.colorHex }}
                    />
                  )}
                  <span className="text-xs font-bold text-zinc-200">
                    {selectedVersion.editionName || selectedVersion.name}
                  </span>
                  {selectedVersion.colorName && (
                    <span className="text-[11px] text-zinc-400">
                      ({selectedVersion.colorName})
                    </span>
                  )}
                </div>
              </div>

              {/* Pricing Box */}
              <div className="p-3.5 sm:p-4 rounded-xl bg-zinc-900/90 border border-zinc-800">
                <div className="flex flex-wrap items-baseline gap-2">
                  {effectivePrice.originalPrice && effectivePrice.originalPrice > effectivePrice.price && (
                    <span className="text-xs sm:text-sm text-zinc-500 line-through tabular-nums">
                      {formatCurrency(effectivePrice.originalPrice)}
                    </span>
                  )}
                  <span className="font-anton text-2xl sm:text-3xl text-white tracking-wide tabular-nums">
                    {formatCurrency(effectivePrice.price)}
                  </span>
                  <span className="text-xs font-bold text-emerald-400 uppercase bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
                    5% OFF NO PIX
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mt-1">
                  Ou parcele no cartão em até 12x mediante atendimento no WhatsApp.
                </p>
              </div>

              {/* VISUAL VERSION SELECTOR */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-[#C9000B]" />
                    <span>Escolha a Versão / Edição ({visibleVersions.length}):</span>
                  </label>
                  <span className="text-[11px] text-zinc-400">
                    {isVersionAvailable
                      ? `${versionTotalStock} par(es) disponíveis`
                      : 'Sem estoque'}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {visibleVersions.map((ver) => {
                    const isSelected = ver.id === selectedVersion.id;
                    const vStock = getVersionTotalStock(ver);
                    const vAvailable = ver.active !== false && vStock > 0;
                    const vPrice = getEffectiveVersionPrice(product, ver);

                    return (
                      <button
                        key={ver.id}
                        type="button"
                        onClick={() => handleSelectVersion(ver)}
                        className={`p-2 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2.5 min-h-[56px] ${
                          isSelected
                            ? 'bg-[#C9000B]/15 border-[#C9000B] ring-1 ring-[#C9000B] shadow-md shadow-red-950/30'
                            : vAvailable
                            ? 'bg-zinc-900/80 border-zinc-800 hover:border-zinc-600'
                            : 'bg-zinc-950/70 border-zinc-800/60 opacity-60 hover:opacity-90'
                        }`}
                      >
                        <img
                          src={resolveImageUrl(ver.images?.[0] || product.images?.[0])}
                          onError={handleImageError}
                          alt={ver.name}
                          className="w-10 h-10 object-contain rounded-lg bg-[#222222] p-0.5 shrink-0"
                          referrerPolicy="no-referrer"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1">
                            {ver.colorHex && (
                              <span
                                className="w-2.5 h-2.5 rounded-full border border-white/30 shrink-0"
                                style={{ backgroundColor: ver.colorHex }}
                              />
                            )}
                            <span className="text-[11px] font-bold text-white truncate block">
                              {ver.name}
                            </span>
                          </div>
                          <span className="text-[10px] font-mono tabular-nums text-zinc-400 block">
                            {formatCurrency(vPrice.price)}
                          </span>
                          <span
                            className={`text-[9px] font-semibold uppercase block ${
                              vAvailable ? 'text-emerald-400' : 'text-rose-400'
                            }`}
                          >
                            {vAvailable ? `${vStock} un.` : 'Esgotado'}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Description */}
              {effectiveDescription && (
                <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                  {effectiveDescription}
                </p>
              )}

              {/* Version / Product Characteristics & Details */}
              {(effectiveSpecs.length > 0 ||
                product.condition ||
                selectedVersion.weightGrams ||
                selectedVersion.dimensionsCm) && (
                <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-3 space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                    <Tag className="w-3 h-3 text-[#C9000B]" />
                    <span>Características da Versão</span>
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px]">
                    {product.condition && (
                      <div className="flex items-center justify-between gap-2 bg-zinc-950/60 px-2.5 py-1.5 rounded-lg">
                        <span className="text-zinc-400">Condição</span>
                        <span className="text-zinc-200 font-medium text-right truncate">
                          {product.condition}
                        </span>
                      </div>
                    )}
                    {effectiveSpecs.map((spec) => (
                      <div
                        key={spec.id}
                        className="flex items-center justify-between gap-2 bg-zinc-950/60 px-2.5 py-1.5 rounded-lg"
                      >
                        <span className="text-zinc-400">{spec.label}</span>
                        <span className="text-zinc-200 font-medium text-right truncate">
                          {spec.value}
                        </span>
                      </div>
                    ))}
                    {selectedVersion.weightGrams ? (
                      <div className="flex items-center justify-between gap-2 bg-zinc-950/60 px-2.5 py-1.5 rounded-lg">
                        <span className="text-zinc-400 flex items-center gap-1">
                          <Package className="w-3 h-3" /> Peso
                        </span>
                        <span className="text-zinc-200 font-mono">{selectedVersion.weightGrams}g</span>
                      </div>
                    ) : null}
                    {selectedVersion.dimensionsCm ? (
                      <div className="flex items-center justify-between gap-2 bg-zinc-950/60 px-2.5 py-1.5 rounded-lg">
                        <span className="text-zinc-400 flex items-center gap-1">
                          <Ruler className="w-3 h-3" /> Caixa
                        </span>
                        <span className="text-zinc-200 font-mono">{selectedVersion.dimensionsCm} cm</span>
                      </div>
                    ) : null}
                  </div>
                </div>
              )}

              {/* Dynamic Sizes Selector for the Selected Version */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-white">
                    Selecione o Tamanho ({selectedVersion.name}):
                  </label>
                  <span className="text-[11px] text-zinc-400 tabular-nums">
                    {selectedSize ? `Estoque: ${currentSizeStock} un.` : 'Clique para selecionar'}
                  </span>
                </div>

                {selectedVersion.sizes.length === 0 ? (
                  <p className="text-xs text-zinc-500 bg-zinc-900/60 border border-zinc-800 rounded-lg p-3">
                    Nenhum tamanho disponível nesta versão no momento.
                  </p>
                ) : (
                  <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                    {selectedVersion.sizes.map((size) => {
                      const sizeKey = String(size);
                      const isSelected = selectedSize === sizeKey;
                      const stock = getVersionSizeStock(selectedVersion, sizeKey);
                      const hasStock = isVersionAvailable && stock > 0;

                      return (
                        <button
                          key={`${selectedVersion.id}-size-${sizeKey}`}
                          type="button"
                          disabled={!hasStock}
                          onClick={() => handleSizeClick(sizeKey)}
                          className={`py-2 px-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex flex-col items-center justify-center border min-h-[44px] ${
                            !hasStock
                              ? 'bg-zinc-900/40 text-zinc-600 border-zinc-800/60 cursor-not-allowed line-through'
                              : isSelected
                              ? 'bg-[#C9000B] text-white border-[#C9000B] shadow-md shadow-red-950/50 scale-105'
                              : 'bg-zinc-900 text-zinc-200 border-zinc-700 hover:border-[#C9000B]'
                          }`}
                        >
                          <span className="font-anton text-sm">{sizeKey}</span>
                          <span className="text-[9px] font-normal opacity-75 tabular-nums">
                            {!hasStock ? 'Esgotado' : stock === 1 ? 'Último' : `${stock} un`}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {validationError && (
                  <p className="mt-2 text-xs text-rose-400 flex items-center gap-1.5 font-medium">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{validationError}</span>
                  </p>
                )}
              </div>

              {/* Quantity Stepper (Bounded by Selected Version + Size Stock) */}
              {selectedSize && currentSizeStock > 0 && isVersionAvailable && (
                <div className="flex items-center gap-3 pt-1">
                  <span className="text-xs text-zinc-300 font-semibold">Quantidade:</span>
                  <div className="flex items-center border border-zinc-700 rounded-lg overflow-hidden bg-zinc-900">
                    <button
                      type="button"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="px-3 py-1.5 text-zinc-300 hover:text-white hover:bg-zinc-800 cursor-pointer text-xs min-h-[36px]"
                    >
                      -
                    </button>
                    <span className="px-3 py-1 text-xs font-bold text-white font-mono tabular-nums">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      disabled={quantity >= currentSizeStock}
                      onClick={() => setQuantity(Math.min(currentSizeStock, quantity + 1))}
                      className="px-3 py-1.5 text-zinc-300 hover:text-white hover:bg-zinc-800 disabled:opacity-30 cursor-pointer text-xs min-h-[36px]"
                    >
                      +
                    </button>
                  </div>
                  <span className="text-[11px] text-zinc-500 tabular-nums">
                    (Máximo disponível: {currentSizeStock})
                  </span>
                </div>
              )}
            </div>

            {/* CTAs */}
            <div className="pt-4 space-y-2.5 border-t border-zinc-800">
              <button
                type="button"
                disabled={!isVersionAvailable}
                onClick={handleAddToCart}
                className="w-full py-3.5 px-4 bg-zinc-900 hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.99] text-white font-bold text-xs uppercase tracking-wider rounded-xl border border-zinc-700 hover:border-zinc-500 transition-colors flex items-center justify-center gap-2 cursor-pointer shadow min-h-[46px]"
              >
                <ShoppingBag className="w-4 h-4 text-[#C9000B]" />
                <span>
                  {isVersionAvailable ? 'Adicionar ao Carrinho' : 'Versão Indisponível'}
                </span>
              </button>

              <button
                type="button"
                disabled={!isVersionAvailable}
                onClick={handleBuyNow}
                className="w-full py-3.5 px-4 bg-[#C9000B] hover:bg-[#a60009] disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.99] text-white font-anton tracking-wider text-base uppercase rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-red-950/50 min-h-[48px]"
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
