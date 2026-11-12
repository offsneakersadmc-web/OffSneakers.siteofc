import React, { useState, useRef } from 'react';
import {
  Plus,
  Copy,
  Trash2,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Star,
  Eye,
  EyeOff,
  Upload,
  Image as ImageIcon,
  Check,
  AlertTriangle,
  Layers,
  Tag,
  RefreshCw,
} from 'lucide-react';
import {
  MediaItem,
  ProductImageMeta,
  ProductSpec,
  ProductVersion,
} from '../../types';
import { formatCurrency } from '../../utils/format';
import { resolveImageUrl, handleImageError } from '../../utils/imageHelper';
import {
  getVersionTotalStock,
  inferColorHex,
  sortSizesList,
} from '../../utils/versionHelper';
import { uploadVersionImageFile } from '../../services/storageService';
import { storeService } from '../../services/storeService';

interface ProductVersionsEditorProps {
  productId: string;
  productName: string;
  pricingMode: 'shared' | 'individual';
  descriptionMode: 'shared' | 'individual';
  specsMode: 'shared' | 'individual';
  sharedPrice: number;
  sharedOriginalPrice?: number;
  sharedDiscountPercent?: number;
  versions: ProductVersion[];
  onChange: (versions: ProductVersion[]) => void;
}

const COLOR_PRESETS = [
  { label: 'Chicago Red', hex: '#C9000B' },
  { label: 'Preto', hex: '#18181B' },
  { label: 'Branco', hex: '#F4F4F5' },
  { label: 'Olive', hex: '#4A5D3F' },
  { label: 'Cream / Sail', hex: '#E5DEC9' },
  { label: 'Royal Blue', hex: '#1D4ED8' },
  { label: 'Cinza', hex: '#71717A' },
];

export const ProductVersionsEditor: React.FC<ProductVersionsEditorProps> = ({
  productId,
  productName,
  pricingMode,
  descriptionMode,
  specsMode,
  sharedPrice,
  sharedOriginalPrice,
  sharedDiscountPercent,
  versions,
  onChange,
}) => {
  const [selectedVersionId, setSelectedVersionId] = useState<string>(
    versions[0]?.id || ''
  );
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [uploadNotice, setUploadNotice] = useState<string | null>(null);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [replaceTargetIdx, setReplaceTargetIdx] = useState<number | null>(null);

  // Per-version dynamic size & spec inputs
  const [newSizeName, setNewSizeName] = useState('');
  const [newSizeStock, setNewSizeStock] = useState(1);
  const [newSpecLabel, setNewSpecLabel] = useState('');
  const [newSpecValue, setNewSpecValue] = useState('');

  const replaceInputRef = useRef<HTMLInputElement | null>(null);

  const selectedVersion =
    versions.find((v) => v.id === selectedVersionId) || versions[0];

  const updateVersion = (versionId: string, patch: Partial<ProductVersion>) => {
    const now = new Date().toISOString();
    onChange(
      versions.map((v) =>
        v.id === versionId ? { ...v, ...patch, updatedAt: now } : v
      )
    );
  };

  const handleAddVersion = () => {
    const now = new Date().toISOString();
    const newId = `ver-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`;
    const nextOrder = versions.length;
    const newVer: ProductVersion = {
      id: newId,
      productId,
      name: `Nova Versão ${versions.length + 1}`,
      editionName: productName ? `${productName} Edição ${versions.length + 1}` : '',
      colorName: 'Preto / Branco',
      colorHex: '#18181B',
      description: '',
      specs: [],
      images: ['/assets/images/product_jordan_retro_high_1794010895050.jpg'],
      price: sharedPrice || 990,
      originalPrice: sharedOriginalPrice,
      discountPercent: sharedDiscountPercent,
      sku: `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
      sizes: ['38', '39', '40', '41', '42'],
      inventory: { '38': 1, '39': 2, '40': 2, '41': 1, '42': 1 },
      active: true,
      hidden: false,
      isDefault: versions.length === 0,
      isFeatured: false,
      order: nextOrder,
      createdAt: now,
      updatedAt: now,
    };
    onChange([...versions, newVer]);
    setSelectedVersionId(newId);
    setConfirmDeleteId(null);
  };

  const handleDuplicateVersion = (ver: ProductVersion) => {
    const now = new Date().toISOString();
    const copyId = `ver-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`;
    const cloned: ProductVersion = {
      ...ver,
      id: copyId,
      name: `${ver.name} (Cópia)`,
      editionName: ver.editionName ? `${ver.editionName} (Cópia)` : undefined,
      sku: ver.sku ? `${ver.sku}-2` : undefined,
      images: [...(ver.images || [])],
      sizes: [...(ver.sizes || [])],
      inventory: { ...(ver.inventory || {}) },
      specs: ver.specs ? ver.specs.map((s) => ({ ...s, id: `sp-${Date.now()}-${Math.random().toString(36).slice(2, 5)}` })) : [],
      isDefault: false,
      order: versions.length,
      createdAt: now,
      updatedAt: now,
    };
    onChange([...versions, cloned]);
    setSelectedVersionId(copyId);
  };

  const handleDeleteVersion = (versionId: string) => {
    if (versions.length <= 1) {
      setUploadNotice('O produto precisa manter pelo menos 1 versão cadastrada. Você pode ocultá-la temporariamente se preferir.');
      setConfirmDeleteId(null);
      return;
    }
    const remaining = versions
      .filter((v) => v.id !== versionId)
      .map((v, idx) => ({ ...v, order: idx }));

    if (!remaining.some((v) => v.isDefault) && remaining[0]) {
      remaining[0] = { ...remaining[0], isDefault: true };
    }
    onChange(remaining);
    if (selectedVersionId === versionId && remaining[0]) {
      setSelectedVersionId(remaining[0].id);
    }
    setConfirmDeleteId(null);
  };

  const handleSetDefault = (versionId: string) => {
    onChange(
      versions.map((v) => ({
        ...v,
        isDefault: v.id === versionId,
        hidden: v.id === versionId ? false : v.hidden,
      }))
    );
  };

  const handleMoveVersion = (index: number, direction: -1 | 1) => {
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= versions.length) return;
    const copy = [...versions];
    const [moved] = copy.splice(index, 1);
    copy.splice(targetIdx, 0, moved);
    onChange(copy.map((v, idx) => ({ ...v, order: idx })));
  };

  // Multi-file upload handler for the selected version
  const handleUploadVersionImages = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedVersion) return;
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingImages(true);
    setUploadNotice(null);
    const addedUrls: string[] = [];
    let lastWarning: string | undefined;

    try {
      for (const file of Array.from(files)) {
        const res = await uploadVersionImageFile(productId, selectedVersion.id, file);
        addedUrls.push(res.url);
        if (res.warning) lastWarning = res.warning;
      }

      if (addedUrls.length > 0) {
        updateVersion(selectedVersion.id, {
          images: [...(selectedVersion.images || []), ...addedUrls],
        });
        setUploadNotice(
          lastWarning ||
            `${addedUrls.length} foto(s) adicionada(s) exclusivamente à versão "${selectedVersion.name}".`
        );
      }
    } catch {
      setUploadNotice('Erro ao processar uma das imagens selecionadas.');
    } finally {
      setUploadingImages(false);
      e.target.value = '';
    }
  };

  const handleReplaceSingleImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedVersion || replaceTargetIdx === null) return;
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImages(true);
    try {
      const res = await uploadVersionImageFile(productId, selectedVersion.id, file);
      const nextImages = [...(selectedVersion.images || [])];
      nextImages[replaceTargetIdx] = res.url;
      updateVersion(selectedVersion.id, { images: nextImages });
      setUploadNotice(res.warning || 'Imagem substituída com sucesso.');
    } catch {
      setUploadNotice('Falha ao substituir imagem.');
    } finally {
      setUploadingImages(false);
      setReplaceTargetIdx(null);
      e.target.value = '';
    }
  };

  const handleAddImageUrl = () => {
    if (!selectedVersion || !newImageUrl.trim()) return;
    updateVersion(selectedVersion.id, {
      images: [...(selectedVersion.images || []), newImageUrl.trim()],
    });
    setNewImageUrl('');
  };

  const handleSelectMediaItem = (item: MediaItem) => {
    if (!selectedVersion) return;
    if (!selectedVersion.images.includes(item.url)) {
      updateVersion(selectedVersion.id, {
        images: [...(selectedVersion.images || []), item.url],
      });
    }
    setShowMediaPicker(false);
  };

  const handleMoveGalleryImage = (idx: number, dir: -1 | 1) => {
    if (!selectedVersion) return;
    const target = idx + dir;
    if (target < 0 || target >= selectedVersion.images.length) return;
    const arr = [...selectedVersion.images];
    const [item] = arr.splice(idx, 1);
    arr.splice(target, 0, item);
    updateVersion(selectedVersion.id, { images: arr });
  };

  const handleSetPrimaryImage = (idx: number) => {
    if (!selectedVersion || idx === 0) return;
    const arr = [...selectedVersion.images];
    const [item] = arr.splice(idx, 1);
    arr.unshift(item);
    updateVersion(selectedVersion.id, { images: arr });
  };

  const handleRemoveGalleryImage = (idx: number) => {
    if (!selectedVersion) return;
    const next = selectedVersion.images.filter((_, i) => i !== idx);
    updateVersion(selectedVersion.id, { images: next });
  };

  const updateImageMeta = (imgUrl: string, metaPatch: Partial<ProductImageMeta>) => {
    if (!selectedVersion) return;
    const current = selectedVersion.imageMeta || {};
    updateVersion(selectedVersion.id, {
      imageMeta: {
        ...current,
        [imgUrl]: {
          ...(current[imgUrl] || {}),
          ...metaPatch,
        },
      },
    });
  };

  // Per-version dynamic sizes
  const handleAddSize = () => {
    if (!selectedVersion) return;
    const clean = newSizeName.trim().toUpperCase();
    if (!clean) return;
    const exists = selectedVersion.sizes.includes(clean);
    const nextSizes = exists ? selectedVersion.sizes : sortSizesList([...selectedVersion.sizes, clean]);
    updateVersion(selectedVersion.id, {
      sizes: nextSizes,
      inventory: {
        ...selectedVersion.inventory,
        [clean]: Math.max(0, newSizeStock),
      },
    });
    setNewSizeName('');
    setNewSizeStock(1);
  };

  const handleAddStandardSizeGrid = () => {
    if (!selectedVersion) return;
    const standard = ['37', '38', '39', '40', '41', '42', '43'];
    const mergedSet = new Set([...selectedVersion.sizes, ...standard]);
    const nextInv = { ...selectedVersion.inventory };
    standard.forEach((s) => {
      if (nextInv[s] === undefined) nextInv[s] = 1;
    });
    updateVersion(selectedVersion.id, {
      sizes: sortSizesList(Array.from(mergedSet)),
      inventory: nextInv,
    });
  };

  const handleRemoveSize = (size: string) => {
    if (!selectedVersion) return;
    const nextInv = { ...selectedVersion.inventory };
    delete nextInv[size];
    updateVersion(selectedVersion.id, {
      sizes: selectedVersion.sizes.filter((s) => s !== size),
      inventory: nextInv,
    });
  };

  const handleSizeQtyChange = (size: string, qty: number) => {
    if (!selectedVersion) return;
    updateVersion(selectedVersion.id, {
      inventory: {
        ...selectedVersion.inventory,
        [size]: Math.max(0, qty),
      },
    });
  };

  // Per-version specs
  const handleAddVersionSpec = () => {
    if (!selectedVersion || !newSpecLabel.trim() || !newSpecValue.trim()) return;
    const spec: ProductSpec = {
      id: `vsp-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      label: newSpecLabel.trim(),
      value: newSpecValue.trim(),
    };
    updateVersion(selectedVersion.id, {
      specs: [...(selectedVersion.specs || []), spec],
    });
    setNewSpecLabel('');
    setNewSpecValue('');
  };

  const handleRemoveVersionSpec = (specId: string) => {
    if (!selectedVersion) return;
    updateVersion(selectedVersion.id, {
      specs: (selectedVersion.specs || []).filter((s) => s.id !== specId),
    });
  };

  const mediaLibrary = storeService.getMediaItems();

  return (
    <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-4 sm:p-5 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-3">
        <div>
          <span className="text-xs font-bold text-[#C9000B] uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="w-4 h-4" />
            <span>Versões do produto ({versions.length})</span>
          </span>
          <p className="text-[11px] text-zinc-400 mt-0.5">
            Adicione quantas versões, cores ou edições desejar, cada uma com fotos, características, preço e estoque próprios.
          </p>
        </div>

        <button
          type="button"
          onClick={handleAddVersion}
          className="px-3.5 py-2 bg-[#C9000B] hover:bg-red-700 text-white font-bold text-xs uppercase rounded-xl flex items-center gap-1.5 cursor-pointer shrink-0 shadow"
        >
          <Plus className="w-4 h-4" />
          <span>Adicionar Versão</span>
        </button>
      </div>

      {/* Version Selector Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
        {versions.map((ver, idx) => {
          const isSelected = selectedVersion?.id === ver.id;
          const totalVerStock = getVersionTotalStock(ver);
          const effectiveDisplayPrice =
            pricingMode === 'shared' ? sharedPrice : ver.price;

          return (
            <div
              key={ver.id}
              onClick={() => setSelectedVersionId(ver.id)}
              className={`p-2.5 rounded-xl border cursor-pointer transition-all flex flex-col justify-between gap-2 ${
                isSelected
                  ? 'bg-[#C9000B]/15 border-[#C9000B] ring-1 ring-[#C9000B]'
                  : 'bg-zinc-950/70 border-zinc-800 hover:border-zinc-700'
              } ${ver.hidden ? 'opacity-60' : ''}`}
            >
              <div className="flex items-center gap-2.5">
                <img
                  src={resolveImageUrl(ver.images?.[0])}
                  onError={handleImageError}
                  alt={ver.name}
                  className="w-11 h-11 rounded-lg bg-zinc-900 object-contain p-0.5 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span
                      className="w-2.5 h-2.5 rounded-full border border-white/30 shrink-0"
                      style={{ backgroundColor: ver.colorHex || '#71717A' }}
                    />
                    <span className="text-xs font-bold text-white truncate">
                      {ver.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-zinc-400 mt-0.5 font-mono tabular-nums">
                    <span>{formatCurrency(effectiveDisplayPrice || 0)}</span>
                    <span>•</span>
                    <span className={totalVerStock > 0 ? 'text-emerald-400' : 'text-rose-400'}>
                      {totalVerStock} un.
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {ver.isDefault && (
                      <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        Principal
                      </span>
                    )}
                    {ver.hidden && (
                      <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300">
                        Oculta
                      </span>
                    )}
                    {!ver.active && (
                      <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-rose-950 text-rose-300">
                        Inativa
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Quick Row Actions */}
              <div
                className="flex items-center justify-between pt-1.5 border-t border-zinc-800/80 gap-1"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => handleMoveVersion(idx, -1)}
                    className="p-1 text-zinc-400 hover:text-white disabled:opacity-30 cursor-pointer"
                    title="Mover para cima"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={idx === versions.length - 1}
                    onClick={() => handleMoveVersion(idx, 1)}
                    className="p-1 text-zinc-400 hover:text-white disabled:opacity-30 cursor-pointer"
                    title="Mover para baixo"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetDefault(ver.id)}
                    className={`p-1 cursor-pointer ${
                      ver.isDefault ? 'text-amber-400' : 'text-zinc-500 hover:text-amber-300'
                    }`}
                    title="Definir como versão principal"
                  >
                    <Star className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleDuplicateVersion(ver)}
                    className="p-1 text-zinc-400 hover:text-white cursor-pointer"
                    title="Duplicar versão"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => updateVersion(ver.id, { hidden: !ver.hidden })}
                    className={`p-1 cursor-pointer ${
                      ver.hidden ? 'text-amber-400' : 'text-zinc-400 hover:text-white'
                    }`}
                    title={ver.hidden ? 'Reexibir na loja' : 'Ocultar temporariamente'}
                  >
                    {ver.hidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteId(ver.id)}
                    className="p-1 text-zinc-500 hover:text-rose-400 cursor-pointer"
                    title="Excluir versão"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {confirmDeleteId === ver.id && (
                <div
                  className="bg-rose-950/60 border border-rose-800 rounded-lg p-2 text-[11px] space-y-1.5"
                  onClick={(e) => e.stopPropagation()}
                >
                  <p className="text-rose-200 font-semibold flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    Excluir versão "{ver.name}"?
                  </p>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleDeleteVersion(ver.id)}
                      className="px-2 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded text-[10px] font-bold cursor-pointer"
                    >
                      Confirmar
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(null)}
                      className="px-2 py-1 bg-zinc-800 text-zinc-300 rounded text-[10px] cursor-pointer"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Selected Version Detailed Editor */}
      {selectedVersion && (
        <div className="bg-zinc-950/90 border border-zinc-800 rounded-xl p-4 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 pb-3">
            <div className="flex items-center gap-2">
              <span
                className="w-4 h-4 rounded-full border border-white/40"
                style={{ backgroundColor: selectedVersion.colorHex || '#71717A' }}
              />
              <h4 className="font-anton text-base text-white uppercase tracking-wide">
                Editando Versão: {selectedVersion.name}
              </h4>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-1.5 text-xs text-zinc-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedVersion.active !== false}
                  onChange={(e) =>
                    updateVersion(selectedVersion.id, { active: e.target.checked })
                  }
                />
                <span>Ativa para venda</span>
              </label>

              <label className="flex items-center gap-1.5 text-xs text-zinc-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(selectedVersion.hidden)}
                  onChange={(e) =>
                    updateVersion(selectedVersion.id, { hidden: e.target.checked })
                  }
                />
                <span>Ocultar da loja</span>
              </label>
            </div>
          </div>

          {/* 1. Identification & Color */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="sm:col-span-2">
              <label className="text-zinc-300 font-semibold block mb-1">
                Nome da Versão *
              </label>
              <input
                type="text"
                required
                value={selectedVersion.name}
                onChange={(e) =>
                  updateVersion(selectedVersion.id, { name: e.target.value })
                }
                placeholder="Ex: Triple White, Chicago Lost & Found, Reverse Mocha"
                className="w-full bg-zinc-900 px-3 py-2 rounded-lg border border-zinc-700 text-white"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-zinc-300 font-semibold block mb-1">
                Nome Comercial da Edição
              </label>
              <input
                type="text"
                value={selectedVersion.editionName || ''}
                onChange={(e) =>
                  updateVersion(selectedVersion.id, { editionName: e.target.value })
                }
                placeholder="Ex: Air Force 1 Low Triple White Premium"
                className="w-full bg-zinc-900 px-3 py-2 rounded-lg border border-zinc-700 text-white"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-zinc-300 font-semibold block mb-1">
                Nome da Cor / Colorway *
              </label>
              <input
                type="text"
                value={selectedVersion.colorName}
                onChange={(e) => {
                  const val = e.target.value;
                  updateVersion(selectedVersion.id, {
                    colorName: val,
                    colorHex: selectedVersion.colorHex || inferColorHex(val),
                  });
                }}
                placeholder="Ex: Branco / Azul Royal"
                className="w-full bg-zinc-900 px-3 py-2 rounded-lg border border-zinc-700 text-white"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-zinc-300 font-semibold block mb-1">
                Indicador Visual da Cor
              </label>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="color"
                  value={selectedVersion.colorHex || '#C9000B'}
                  onChange={(e) =>
                    updateVersion(selectedVersion.id, { colorHex: e.target.value })
                  }
                  className="w-9 h-9 rounded bg-zinc-900 border border-zinc-700 cursor-pointer p-0.5"
                />
                {COLOR_PRESETS.map((c) => (
                  <button
                    key={c.hex}
                    type="button"
                    onClick={() =>
                      updateVersion(selectedVersion.id, { colorHex: c.hex })
                    }
                    title={c.label}
                    className={`w-6 h-6 rounded-full border cursor-pointer ${
                      selectedVersion.colorHex === c.hex
                        ? 'ring-2 ring-[#C9000B] border-white'
                        : 'border-zinc-600'
                    }`}
                    style={{ backgroundColor: c.hex }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* 2. Pricing, Cost, SKU, Barcode, Logistics */}
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-300">
                Preços, SKU & Ficha Técnica da Versão
              </span>
              {pricingMode === 'shared' && (
                <span className="text-[10px] text-amber-300 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded">
                  Preço compartilhado ativo (usando preço do produto principal)
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="text-zinc-400 block mb-1">
                  Preço Venda (R$) {pricingMode === 'individual' ? '*' : ''}
                </label>
                <input
                  type="number"
                  min={0}
                  disabled={pricingMode === 'shared'}
                  value={pricingMode === 'shared' ? sharedPrice : selectedVersion.price}
                  onChange={(e) => {
                    const nextPrice = Number(e.target.value);
                    const orig = selectedVersion.originalPrice || 0;
                    const calcDisc =
                      orig > nextPrice && orig > 0
                        ? Math.round(((orig - nextPrice) / orig) * 100)
                        : selectedVersion.discountPercent;
                    updateVersion(selectedVersion.id, {
                      price: nextPrice,
                      discountPercent: calcDisc,
                    });
                  }}
                  className="w-full bg-zinc-950 disabled:opacity-50 px-2.5 py-2 rounded-lg border border-zinc-700 text-white font-mono"
                />
              </div>

              <div>
                <label className="text-zinc-400 block mb-1">Preço Anterior (R$)</label>
                <input
                  type="number"
                  min={0}
                  disabled={pricingMode === 'shared'}
                  value={
                    pricingMode === 'shared'
                      ? sharedOriginalPrice ?? ''
                      : selectedVersion.originalPrice ?? ''
                  }
                  onChange={(e) => {
                    const orig = e.target.value ? Number(e.target.value) : undefined;
                    const calcDisc =
                      orig && orig > selectedVersion.price
                        ? Math.round(((orig - selectedVersion.price) / orig) * 100)
                        : selectedVersion.discountPercent;
                    updateVersion(selectedVersion.id, {
                      originalPrice: orig,
                      discountPercent: calcDisc,
                    });
                  }}
                  className="w-full bg-zinc-950 disabled:opacity-50 px-2.5 py-2 rounded-lg border border-zinc-700 text-white font-mono"
                />
              </div>

              <div>
                <label className="text-zinc-400 block mb-1">Desconto (%)</label>
                <input
                  type="number"
                  min={0}
                  max={95}
                  disabled={pricingMode === 'shared'}
                  value={
                    pricingMode === 'shared'
                      ? sharedDiscountPercent ?? 0
                      : selectedVersion.discountPercent ?? 0
                  }
                  onChange={(e) =>
                    updateVersion(selectedVersion.id, {
                      discountPercent: Number(e.target.value),
                    })
                  }
                  className="w-full bg-zinc-950 disabled:opacity-50 px-2.5 py-2 rounded-lg border border-zinc-700 text-white font-mono"
                />
              </div>

              <div>
                <label className="text-zinc-400 block mb-1">Custo Interno (R$)</label>
                <input
                  type="number"
                  min={0}
                  value={selectedVersion.costPrice ?? ''}
                  onChange={(e) =>
                    updateVersion(selectedVersion.id, {
                      costPrice: e.target.value ? Number(e.target.value) : undefined,
                    })
                  }
                  placeholder="Opcional"
                  className="w-full bg-zinc-950 px-2.5 py-2 rounded-lg border border-zinc-700 text-white font-mono"
                />
              </div>

              <div>
                <label className="text-zinc-400 block mb-1">SKU da Versão</label>
                <input
                  type="text"
                  value={selectedVersion.sku || ''}
                  onChange={(e) =>
                    updateVersion(selectedVersion.id, { sku: e.target.value })
                  }
                  placeholder="Ex: DZ5485-612"
                  className="w-full bg-zinc-950 px-2.5 py-2 rounded-lg border border-zinc-700 text-white font-mono"
                />
              </div>

              <div>
                <label className="text-zinc-400 block mb-1">Código de Barras / EAN</label>
                <input
                  type="text"
                  value={selectedVersion.barcode || ''}
                  onChange={(e) =>
                    updateVersion(selectedVersion.id, { barcode: e.target.value })
                  }
                  placeholder="EAN-13 / UPC"
                  className="w-full bg-zinc-950 px-2.5 py-2 rounded-lg border border-zinc-700 text-white font-mono"
                />
              </div>

              <div>
                <label className="text-zinc-400 block mb-1">Peso (g)</label>
                <input
                  type="number"
                  min={0}
                  value={selectedVersion.weightGrams ?? ''}
                  onChange={(e) =>
                    updateVersion(selectedVersion.id, {
                      weightGrams: e.target.value ? Number(e.target.value) : undefined,
                    })
                  }
                  placeholder="Ex: 1100"
                  className="w-full bg-zinc-950 px-2.5 py-2 rounded-lg border border-zinc-700 text-white font-mono"
                />
              </div>

              <div>
                <label className="text-zinc-400 block mb-1">Dimensões Caixa (cm)</label>
                <input
                  type="text"
                  value={selectedVersion.dimensionsCm || ''}
                  onChange={(e) =>
                    updateVersion(selectedVersion.id, { dimensionsCm: e.target.value })
                  }
                  placeholder="Ex: 34x22x12"
                  className="w-full bg-zinc-950 px-2.5 py-2 rounded-lg border border-zinc-700 text-white font-mono"
                />
              </div>
            </div>
          </div>

          {/* 3. Description & Characteristics for Version */}
          {descriptionMode === 'individual' && (
            <div>
              <label className="text-zinc-300 font-semibold block mb-1">
                Descrição Exclusiva desta Versão
              </label>
              <textarea
                rows={2}
                value={selectedVersion.description || ''}
                onChange={(e) =>
                  updateVersion(selectedVersion.id, { description: e.target.value })
                }
                placeholder="Descreva materiais, detalhes e diferenciais específicos desta versão..."
                className="w-full bg-zinc-900 px-3 py-2 rounded-lg border border-zinc-700 text-white"
              />
            </div>
          )}

          {specsMode === 'individual' && (
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-3.5 space-y-2.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-[#C9000B]" />
                <span>Características Específicas da Versão</span>
              </span>
              <div className="flex flex-wrap gap-2">
                <input
                  type="text"
                  value={newSpecLabel}
                  onChange={(e) => setNewSpecLabel(e.target.value)}
                  placeholder="Característica (ex: Material)"
                  className="flex-1 min-w-[130px] bg-zinc-950 px-2.5 py-1.5 rounded-lg border border-zinc-700 text-white"
                />
                <input
                  type="text"
                  value={newSpecValue}
                  onChange={(e) => setNewSpecValue(e.target.value)}
                  placeholder="Detalhe (ex: Camurça Nobuck)"
                  className="flex-1 min-w-[150px] bg-zinc-950 px-2.5 py-1.5 rounded-lg border border-zinc-700 text-white"
                />
                <button
                  type="button"
                  onClick={handleAddVersionSpec}
                  className="px-3 py-1.5 bg-zinc-800 hover:bg-[#C9000B] text-white rounded-lg font-semibold cursor-pointer"
                >
                  + Adicionar
                </button>
              </div>
              {(selectedVersion.specs || []).length > 0 && (
                <div className="space-y-1">
                  {(selectedVersion.specs || []).map((sp) => (
                    <div
                      key={sp.id}
                      className="flex items-center justify-between bg-zinc-950 px-3 py-1.5 rounded-lg border border-zinc-800"
                    >
                      <span className="text-zinc-300">
                        <strong className="text-white">{sp.label}:</strong> {sp.value}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveVersionSpec(sp.id)}
                        className="text-zinc-500 hover:text-rose-400 p-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 4. Exclusive Per-Version Gallery (Firebase Storage + Media Library + Ordering + Framing) */}
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-3.5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-[#C9000B]" />
                  <span>Galeria Exclusiva da Versão ({selectedVersion.images.length} foto(s))</span>
                </span>
                <p className="text-[10px] text-zinc-400">
                  A primeira foto é a principal na loja. Envie múltiplas imagens para o Firebase Storage ou reutilize da biblioteca.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <label className="px-3 py-1.5 bg-[#C9000B] hover:bg-red-700 text-white rounded-lg font-semibold flex items-center gap-1.5 cursor-pointer">
                  <Upload className="w-3.5 h-3.5" />
                  <span>{uploadingImages ? 'Enviando...' : 'Upload Múltiplo'}</span>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    disabled={uploadingImages}
                    onChange={handleUploadVersionImages}
                    className="hidden"
                  />
                </label>

                <button
                  type="button"
                  onClick={() => setShowMediaPicker(!showMediaPicker)}
                  className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg font-semibold cursor-pointer"
                >
                  Biblioteca de Mídia
                </button>
              </div>
            </div>

            {/* Hidden input for replacing a specific gallery image */}
            <input
              ref={replaceInputRef}
              type="file"
              accept="image/*"
              onChange={handleReplaceSingleImage}
              className="hidden"
            />

            {/* Direct URL Adder */}
            <div className="flex gap-2">
              <input
                type="text"
                value={newImageUrl}
                onChange={(e) => setNewImageUrl(e.target.value)}
                placeholder="Ou cole uma URL de imagem (https://... ou /assets/...)"
                className="flex-1 bg-zinc-950 px-3 py-1.5 rounded-lg border border-zinc-700 text-white"
              />
              <button
                type="button"
                onClick={handleAddImageUrl}
                className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg font-semibold cursor-pointer"
              >
                Adicionar URL
              </button>
            </div>

            {uploadNotice && (
              <div className="p-2 rounded-lg bg-zinc-950 border border-zinc-700 text-[11px] text-zinc-300 flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>{uploadNotice}</span>
              </div>
            )}

            {/* Media Library Picker */}
            {showMediaPicker && (
              <div className="bg-zinc-950 border border-zinc-700 rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-white uppercase">
                    Selecione uma imagem existente da loja
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowMediaPicker(false)}
                    className="text-zinc-400 hover:text-white text-[11px] cursor-pointer"
                  >
                    Fechar
                  </button>
                </div>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-44 overflow-y-auto">
                  {mediaLibrary.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => handleSelectMediaItem(m)}
                      className="p-1 bg-zinc-900 hover:border-[#C9000B] border border-zinc-800 rounded-lg cursor-pointer text-left"
                      title={m.name}
                    >
                      <img
                        src={resolveImageUrl(m.url)}
                        onError={handleImageError}
                        alt={m.name}
                        className="w-full h-14 object-contain rounded"
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Gallery Thumbnails Grid with Order, Primary, Replace & Framing */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {selectedVersion.images.map((imgUrl, idx) => {
                const meta = selectedVersion.imageMeta?.[imgUrl] || {};
                return (
                  <div
                    key={`${selectedVersion.id}-img-${idx}`}
                    className={`bg-zinc-950 rounded-xl border p-2.5 space-y-2 ${
                      idx === 0 ? 'border-[#C9000B]' : 'border-zinc-800'
                    }`}
                  >
                    <div className="relative h-28 bg-zinc-900 rounded-lg overflow-hidden flex items-center justify-center p-1">
                      <img
                        src={resolveImageUrl(imgUrl)}
                        onError={handleImageError}
                        alt={`Foto ${idx + 1}`}
                        className={`w-full h-full ${
                          meta.objectFit === 'cover' ? 'object-cover' : 'object-contain'
                        }`}
                      />
                      {idx === 0 && (
                        <span className="absolute top-1.5 left-1.5 bg-[#C9000B] text-white text-[9px] font-bold uppercase px-1.5 py-0.5 rounded">
                          Principal
                        </span>
                      )}
                    </div>

                    {/* Framing & Focal Point */}
                    <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                      <select
                        value={meta.objectFit || 'contain'}
                        onChange={(e) =>
                          updateImageMeta(imgUrl, {
                            objectFit: e.target.value as 'contain' | 'cover',
                          })
                        }
                        className="bg-zinc-900 border border-zinc-800 rounded px-1.5 py-1 text-zinc-300"
                      >
                        <option value="contain">Ajuste: Inteiro</option>
                        <option value="cover">Ajuste: Preencher</option>
                      </select>
                      <select
                        value={meta.focalPoint || 'center'}
                        onChange={(e) =>
                          updateImageMeta(imgUrl, {
                            focalPoint: e.target.value as ProductImageMeta['focalPoint'],
                          })
                        }
                        className="bg-zinc-900 border border-zinc-800 rounded px-1.5 py-1 text-zinc-300"
                      >
                        <option value="center">Foco: Centro</option>
                        <option value="top">Foco: Topo</option>
                        <option value="bottom">Foco: Base</option>
                        <option value="left">Foco: Esq.</option>
                        <option value="right">Foco: Dir.</option>
                      </select>
                    </div>

                    {/* Gallery Item Controls */}
                    <div className="flex items-center justify-between pt-1 border-t border-zinc-800">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => handleMoveGalleryImage(idx, -1)}
                          className="p-1 text-zinc-400 hover:text-white disabled:opacity-30 cursor-pointer"
                          title="Mover para esquerda"
                        >
                          <ArrowLeft className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={idx === selectedVersion.images.length - 1}
                          onClick={() => handleMoveGalleryImage(idx, 1)}
                          className="p-1 text-zinc-400 hover:text-white disabled:opacity-30 cursor-pointer"
                          title="Mover para direita"
                        >
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                        {idx > 0 && (
                          <button
                            type="button"
                            onClick={() => handleSetPrimaryImage(idx)}
                            className="px-1.5 py-0.5 text-[10px] bg-zinc-800 hover:bg-[#C9000B] text-zinc-200 rounded cursor-pointer"
                            title="Definir como imagem principal"
                          >
                            Principal
                          </button>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setReplaceTargetIdx(idx);
                            replaceInputRef.current?.click();
                          }}
                          className="p-1 text-zinc-400 hover:text-white cursor-pointer"
                          title="Substituir imagem"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveGalleryImage(idx)}
                          className="p-1 text-zinc-500 hover:text-rose-400 cursor-pointer"
                          title="Remover foto"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 5. Independent Dynamic Sizes & Stock for Selected Version */}
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-3.5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-white">
                Tamanhos & Estoque da Versão "{selectedVersion.name}"
              </span>
              <button
                type="button"
                onClick={handleAddStandardSizeGrid}
                className="text-[11px] px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg cursor-pointer"
              >
                + Preencher Grade 37–43
              </button>
            </div>

            <div className="flex flex-wrap gap-2 items-center">
              <input
                type="text"
                placeholder="Tamanho (ex: 37, 38.5, 41, M)"
                value={newSizeName}
                onChange={(e) => setNewSizeName(e.target.value)}
                className="w-44 bg-zinc-950 px-3 py-1.5 rounded-lg border border-zinc-700 text-white"
              />
              <input
                type="number"
                min={0}
                placeholder="Qtd."
                value={newSizeStock}
                onChange={(e) => setNewSizeStock(Number(e.target.value))}
                className="w-20 bg-zinc-950 px-3 py-1.5 rounded-lg border border-zinc-700 text-white font-mono"
              />
              <button
                type="button"
                onClick={handleAddSize}
                className="px-3 py-1.5 bg-zinc-800 hover:bg-[#C9000B] text-white font-semibold rounded-lg cursor-pointer"
              >
                + Adicionar Tamanho
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {selectedVersion.sizes.map((s) => (
                <div
                  key={`${selectedVersion.id}-sz-${s}`}
                  className="flex items-center justify-between p-2 bg-zinc-950 rounded-lg border border-zinc-800"
                >
                  <span className="font-anton text-sm text-white font-mono">
                    Tam: {s}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-zinc-400 text-[11px]">Qtd:</span>
                    <input
                      type="number"
                      min={0}
                      value={selectedVersion.inventory?.[s] ?? 0}
                      onChange={(e) =>
                        handleSizeQtyChange(s, Number(e.target.value))
                      }
                      className="w-14 bg-zinc-900 px-1.5 py-1 rounded border border-zinc-700 text-white text-center font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveSize(s)}
                      className="p-1 text-zinc-500 hover:text-rose-400 cursor-pointer"
                      title="Remover tamanho"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
