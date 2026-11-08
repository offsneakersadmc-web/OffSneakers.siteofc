import React, { useState } from 'react';
import {
  Monitor,
  Tablet,
  Smartphone,
  Save,
  RotateCcw,
  RotateCw,
  Eye,
  Send,
  Layers,
  Palette,
  Type,
  Image as ImageIcon,
  Sliders,
  Check,
  ArrowUp,
  ArrowDown,
  EyeOff,
  Sparkles,
  X
} from 'lucide-react';
import { DesignSettings, SectionConfig, StoreSettings, Product } from '../../types';
import { storeService } from '../../services/storeService';
import { HeroBanner } from '../home/HeroBanner';
import { BenefitsSection } from '../home/BenefitsSection';
import { BrandsSection } from '../home/BrandsSection';
import { AboutSection } from '../home/AboutSection';
import { FaqSection } from '../home/FaqSection';
import { ProductCard } from '../catalog/ProductCard';

interface VisualBuilderProps {
  currentDesign: DesignSettings;
  storeSettings: StoreSettings;
  products: Product[];
  onClose: () => void;
  onDesignPublished: (newDesign: DesignSettings) => void;
}

export const VisualBuilder: React.FC<VisualBuilderProps> = ({
  currentDesign,
  storeSettings,
  products,
  onClose,
  onDesignPublished,
}) => {
  // Working draft
  const [draftDesign, setDraftDesign] = useState<DesignSettings>({ ...currentDesign });
  const [history, setHistory] = useState<DesignSettings[]>([{ ...currentDesign }]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Viewport mode
  const [viewportMode, setViewportMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');

  // Left panel active tab
  const [activeTab, setActiveTab] = useState<'sections' | 'banner' | 'colors' | 'typography'>('sections');

  const [savingNotice, setSavingNotice] = useState<string | null>(null);

  const updateDraft = (updater: (prev: DesignSettings) => DesignSettings) => {
    setDraftDesign((prev) => {
      const next = updater(prev);
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(next);
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
      return next;
    });
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setDraftDesign(history[historyIndex - 1]);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setDraftDesign(history[historyIndex + 1]);
    }
  };

  const handleSaveDraft = async () => {
    await storeService.saveDesign(draftDesign, false);
    setSavingNotice('Rascunho salvo no Firebase!');
    setTimeout(() => setSavingNotice(null), 3000);
  };

  const handlePublish = async () => {
    await storeService.saveDesign(draftDesign, true);
    onDesignPublished(draftDesign);
    setSavingNotice('✨ Loja Oficial Atualizada e Publicada no Firebase!');
    setTimeout(() => setSavingNotice(null), 3500);
  };

  const toggleSection = (id: string) => {
    updateDraft((prev) => ({
      ...prev,
      sections: prev.sections.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s)),
    }));
  };

  const moveSection = (index: number, direction: 'up' | 'down') => {
    updateDraft((prev) => {
      const newSections = [...prev.sections];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= newSections.length) return prev;
      const temp = newSections[index];
      newSections[index] = newSections[targetIndex];
      newSections[targetIndex] = temp;
      return { ...prev, sections: newSections };
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#0f0f0f] text-white overflow-hidden">
      {/* Top Header Bar */}
      <header className="h-16 bg-[#161616] border-b border-zinc-800 px-4 sm:px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <img
            src="/assets/aistudio/Perfil_Instagram_OFFSNEAKERS1_97329a12.png"
            alt="OFF.SNEAKERSOFC"
            className="w-8 h-8 object-contain rounded"
          />
          <div>
            <span className="font-anton text-lg tracking-wider uppercase text-white">
              EDITOR VISUAL DA LOJA
            </span>
            <span className="text-[10px] text-zinc-400 block -mt-1">
              Construtor em Tempo Real • Versão {draftDesign.version}
            </span>
          </div>
        </div>

        {/* Viewport Selectors */}
        <div className="hidden md:flex items-center bg-zinc-900 border border-zinc-700/80 rounded-xl p-1 gap-1">
          <button
            onClick={() => setViewportMode('desktop')}
            className={`p-2 rounded-lg transition-colors cursor-pointer ${
              viewportMode === 'desktop' ? 'bg-[#C9000B] text-white shadow' : 'text-zinc-400 hover:text-white'
            }`}
            title="Desktop (100% Largura)"
          >
            <Monitor className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewportMode('tablet')}
            className={`p-2 rounded-lg transition-colors cursor-pointer ${
              viewportMode === 'tablet' ? 'bg-[#C9000B] text-white shadow' : 'text-zinc-400 hover:text-white'
            }`}
            title="Tablet (768px)"
          >
            <Tablet className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewportMode('mobile')}
            className={`p-2 rounded-lg transition-colors cursor-pointer ${
              viewportMode === 'mobile' ? 'bg-[#C9000B] text-white shadow' : 'text-zinc-400 hover:text-white'
            }`}
            title="Mobile (375px)"
          >
            <Smartphone className="w-4 h-4" />
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Undo / Redo */}
          <div className="flex items-center gap-1 border-r border-zinc-800 pr-2">
            <button
              onClick={handleUndo}
              disabled={historyIndex <= 0}
              className="p-2 text-zinc-400 hover:text-white disabled:opacity-30 rounded cursor-pointer"
              title="Desfazer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={handleRedo}
              disabled={historyIndex >= history.length - 1}
              className="p-2 text-zinc-400 hover:text-white disabled:opacity-30 rounded cursor-pointer"
              title="Refazer"
            >
              <RotateCw className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={handleSaveDraft}
            className="hidden sm:flex items-center gap-1.5 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Salvar Rascunho</span>
          </button>

          <button
            onClick={handlePublish}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#C9000B] hover:bg-red-700 text-white font-anton text-xs uppercase tracking-wider rounded-lg transition-colors cursor-pointer shadow-lg shadow-red-950/40"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Publicar Loja</span>
          </button>

          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg cursor-pointer"
            title="Fechar Editor"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Editor Main Canvas: Left Panel + Center Real Preview */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Control Panel */}
        <div className="w-80 bg-[#141414] border-r border-zinc-800 flex flex-col shrink-0">
          {/* Tab Strip */}
          <div className="grid grid-cols-4 bg-[#181818] border-b border-zinc-800 text-zinc-400">
            <button
              onClick={() => setActiveTab('sections')}
              className={`py-3 text-center flex flex-col items-center gap-1 border-b-2 cursor-pointer ${
                activeTab === 'sections' ? 'border-[#C9000B] text-white bg-zinc-900/60' : 'border-transparent hover:text-white'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span className="text-[10px] font-bold uppercase">Seções</span>
            </button>

            <button
              onClick={() => setActiveTab('banner')}
              className={`py-3 text-center flex flex-col items-center gap-1 border-b-2 cursor-pointer ${
                activeTab === 'banner' ? 'border-[#C9000B] text-white bg-zinc-900/60' : 'border-transparent hover:text-white'
              }`}
            >
              <ImageIcon className="w-4 h-4" />
              <span className="text-[10px] font-bold uppercase">Banner</span>
            </button>

            <button
              onClick={() => setActiveTab('colors')}
              className={`py-3 text-center flex flex-col items-center gap-1 border-b-2 cursor-pointer ${
                activeTab === 'colors' ? 'border-[#C9000B] text-white bg-zinc-900/60' : 'border-transparent hover:text-white'
              }`}
            >
              <Palette className="w-4 h-4" />
              <span className="text-[10px] font-bold uppercase">Cores</span>
            </button>

            <button
              onClick={() => setActiveTab('typography')}
              className={`py-3 text-center flex flex-col items-center gap-1 border-b-2 cursor-pointer ${
                activeTab === 'typography' ? 'border-[#C9000B] text-white bg-zinc-900/60' : 'border-transparent hover:text-white'
              }`}
            >
              <Type className="w-4 h-4" />
              <span className="text-[10px] font-bold uppercase">Textos</span>
            </button>
          </div>

          {/* Tab Contents */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* SECTIONS MANAGEMENT */}
            {activeTab === 'sections' && (
              <div className="space-y-3">
                <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
                  Organização & Visibilidade da Homepage
                </span>
                <p className="text-[11px] text-zinc-500">
                  Oculte ou alterne a ordem das seções na página inicial.
                </p>

                <div className="space-y-2 pt-2">
                  {draftDesign.sections.map((section, idx) => (
                    <div
                      key={section.id}
                      className="p-3 bg-zinc-900/80 rounded-xl border border-zinc-800 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleSection(section.id)}
                          className={`p-1.5 rounded cursor-pointer ${
                            section.enabled ? 'text-emerald-400 bg-emerald-950/60' : 'text-zinc-500 bg-zinc-800'
                          }`}
                          title={section.enabled ? 'Ocultar Seção' : 'Exibir Seção'}
                        >
                          {section.enabled ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                        </button>
                        <span className={`font-semibold ${section.enabled ? 'text-white' : 'text-zinc-500 line-through'}`}>
                          {section.name}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          disabled={idx === 0}
                          onClick={() => moveSection(idx, 'up')}
                          className="p-1 text-zinc-400 hover:text-white disabled:opacity-20 cursor-pointer"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          disabled={idx === draftDesign.sections.length - 1}
                          onClick={() => moveSection(idx, 'down')}
                          className="p-1 text-zinc-400 hover:text-white disabled:opacity-20 cursor-pointer"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* BANNER EDITING */}
            {activeTab === 'banner' && (
              <div className="space-y-4">
                <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
                  Customização do Banner Principal
                </span>

                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1">
                    Título Principal (Bebas / Anton)
                  </label>
                  <textarea
                    rows={2}
                    value={draftDesign.heroTitle}
                    onChange={(e) => updateDraft((p) => ({ ...p, heroTitle: e.target.value }))}
                    className="w-full bg-zinc-900 text-xs px-3 py-2 rounded-lg border border-zinc-700 text-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1">
                    Subtítulo Promocional
                  </label>
                  <textarea
                    rows={3}
                    value={draftDesign.heroSubtitle}
                    onChange={(e) => updateDraft((p) => ({ ...p, heroSubtitle: e.target.value }))}
                    className="w-full bg-zinc-900 text-xs px-3 py-2 rounded-lg border border-zinc-700 text-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1">
                    Texto do Botão Principal
                  </label>
                  <input
                    type="text"
                    value={draftDesign.heroButtonText}
                    onChange={(e) => updateDraft((p) => ({ ...p, heroButtonText: e.target.value }))}
                    className="w-full bg-zinc-900 text-xs px-3 py-2 rounded-lg border border-zinc-700 text-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1">
                    Etiqueta Superior (Badge)
                  </label>
                  <input
                    type="text"
                    value={draftDesign.heroBadgeText}
                    onChange={(e) => updateDraft((p) => ({ ...p, heroBadgeText: e.target.value }))}
                    className="w-full bg-zinc-900 text-xs px-3 py-2 rounded-lg border border-zinc-700 text-white"
                  />
                </div>
              </div>
            )}

            {/* COLORS EDITING */}
            {activeTab === 'colors' && (
              <div className="space-y-4">
                <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
                  Paleta de Cores Oficial OFF.SNEAKERSOFC
                </span>

                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1">
                    Vermelho Principal (Destaques e CTAs)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={draftDesign.primaryColor}
                      onChange={(e) => updateDraft((p) => ({ ...p, primaryColor: e.target.value }))}
                      className="w-10 h-10 rounded border border-zinc-700 cursor-pointer bg-transparent"
                    />
                    <span className="font-mono text-xs text-white uppercase">{draftDesign.primaryColor}</span>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1">
                    Vermelho Escuro (Sombras e Degradês)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={draftDesign.primaryDark}
                      onChange={(e) => updateDraft((p) => ({ ...p, primaryDark: e.target.value }))}
                      className="w-10 h-10 rounded border border-zinc-700 cursor-pointer bg-transparent"
                    />
                    <span className="font-mono text-xs text-white uppercase">{draftDesign.primaryDark}</span>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() =>
                      updateDraft((p) => ({
                        ...p,
                        primaryColor: '#C9000B',
                        primaryDark: '#850008',
                      }))
                    }
                    className="w-full py-2 bg-zinc-900 hover:bg-zinc-800 text-xs text-zinc-300 rounded-lg border border-zinc-700 cursor-pointer"
                  >
                    Restaurar Padrão Oficial (#C9000B)
                  </button>
                </div>
              </div>
            )}

            {/* TYPOGRAPHY & ANNOUNCEMENT */}
            {activeTab === 'typography' && (
              <div className="space-y-4">
                <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
                  Faixa de Anúncio Superior
                </span>

                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1">
                    Texto da Barra de Aviso (Topo da Página)
                  </label>
                  <textarea
                    rows={3}
                    value={draftDesign.announcementText}
                    onChange={(e) => updateDraft((p) => ({ ...p, announcementText: e.target.value }))}
                    className="w-full bg-zinc-900 text-xs px-3 py-2 rounded-lg border border-zinc-700 text-white"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Center Live Preview Frame */}
        <div className="flex-1 bg-[#090909] p-4 flex items-center justify-center overflow-auto">
          <div
            className={`transition-all duration-300 bg-[#111111] border border-zinc-800 rounded-2xl shadow-2xl overflow-y-auto h-full max-h-[92vh] ${
              viewportMode === 'mobile'
                ? 'w-[375px]'
                : viewportMode === 'tablet'
                ? 'w-[768px]'
                : 'w-full max-w-[1440px]'
            }`}
          >
            {/* Live Simulated View */}
            <div className="relative">
              {/* Top Announcement Bar */}
              {draftDesign.announcementText && (
                <div
                  style={{ backgroundColor: draftDesign.primaryColor }}
                  className="text-white text-xs text-center py-2 px-4 font-semibold tracking-wide"
                >
                  {draftDesign.announcementText}
                </div>
              )}

              {/* Render dynamic sections according to order and enabled state */}
              {draftDesign.sections
                .filter((s) => s.enabled)
                .map((sec) => {
                  if (sec.id === 'hero') {
                    return (
                      <HeroBanner
                        key="hero"
                        designSettings={draftDesign}
                        onExplore={() => {}}
                        onViewReleases={() => {}}
                      />
                    );
                  }
                  if (sec.id === 'benefits') {
                    return <BenefitsSection key="benefits" />;
                  }
                  if (sec.id === 'featured') {
                    return (
                      <section key="featured" className="py-12 px-6 max-w-7xl mx-auto">
                        <div className="mb-6">
                          <span className="text-xs font-bold text-[#C9000B] uppercase tracking-wider">
                            VITRINE
                          </span>
                          <h2 className="font-anton text-3xl text-white uppercase">
                            Ofertas em Destaque
                          </h2>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                          {products.slice(0, 3).map((p) => (
                            <ProductCard key={p.id} product={p} onSelect={() => {}} />
                          ))}
                        </div>
                      </section>
                    );
                  }
                  if (sec.id === 'brands') {
                    return <BrandsSection key="brands" onSelectBrand={() => {}} />;
                  }
                  if (sec.id === 'about') {
                    return <AboutSection key="about" />;
                  }
                  if (sec.id === 'faq') {
                    return <FaqSection key="faq" faqs={storeService.getFaqs()} />;
                  }
                  return null;
                })}
            </div>
          </div>
        </div>
      </div>

      {/* Floating Notice Toast */}
      {savingNotice && (
        <div className="fixed bottom-6 right-6 z-50 p-4 bg-emerald-950 border border-emerald-700 text-emerald-300 text-xs font-semibold rounded-xl shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <Check className="w-4 h-4" />
          <span>{savingNotice}</span>
        </div>
      )}
    </div>
  );
};
