import React, { useState } from 'react';
import { ShoppingBag, Search, Shield, Menu, X, ArrowRight, MessageCircle } from 'lucide-react';
import { StoreSettings, DesignSettings } from '../types';

interface NavbarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  cartCount: number;
  onOpenCart: () => void;
  onOpenSearch: () => void;
  storeSettings: StoreSettings;
  designSettings: DesignSettings;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  cartCount,
  onOpenCart,
  onOpenSearch,
  storeSettings,
  designSettings,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [announcementDismissed, setAnnouncementDismissed] = useState(false);

  const navLinks = [
    { id: 'home', label: 'Início' },
    { id: 'catalog', label: 'Catálogo Completo' },
    { id: 'bestsellers', label: 'Mais Vendidos' },
    { id: 'releases', label: 'Lançamentos' },
    { id: 'about', label: 'Sobre Nós' },
    { id: 'faq', label: 'FAQ' },
  ];

  const handleLinkClick = (id: string) => {
    onNavigate(id);
    setMobileMenuOpen(false);
  };

  const handleWhatsappDirect = () => {
    const text = encodeURIComponent(storeSettings.whatsappWelcomeMsg || 'Olá! Vim pelo site da OFF.SNEAKERSOFC.');
    window.open(`https://wa.me/${storeSettings.whatsappNumber}?text=${text}`, '_blank');
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-[#111111]/95 backdrop-blur-md border-b border-[#222222]">
      {/* Announcement Bar */}
      {!announcementDismissed && designSettings.announcementText && (
        <div className="bg-[#C9000B] text-white px-4 py-1.5 text-xs font-semibold tracking-wider flex items-center justify-between">
          <div className="w-6" />
          <p className="text-center truncate px-2">
            {designSettings.announcementText}
          </p>
          <button
            onClick={() => setAnnouncementDismissed(true)}
            className="text-white/80 hover:text-white p-0.5 rounded cursor-pointer"
            aria-label="Fechar aviso"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Top Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-8">
          {/* Brand Zone */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => handleLinkClick('home')}
              className="flex items-center gap-3 text-left group cursor-pointer focus:outline-none"
            >
              <img
                src="/assets/aistudio/Perfil_Instagram_OFFSNEAKERS1_97329a12.png"
                alt="OFF.SNEAKERSOFC Logo"
                className="w-12 h-12 object-contain rounded-md shadow-md shadow-red-950/40 border border-red-900/50 group-hover:scale-105 transition-transform"
              />
              <div className="flex flex-col">
                <div className="flex items-center gap-1">
                  <span className="font-anton text-2xl tracking-wider text-white uppercase leading-none">
                    OFF.SNEAKERSOFC
                  </span>
                </div>
                <span className="text-[10px] tracking-[0.25em] text-[#C9000B] font-bold uppercase font-condensed leading-tight">
                  {storeSettings.slogan || 'SNEAKER RESELLER.'}
                </span>
              </div>
            </button>
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden lg:flex items-center gap-7 text-sm font-medium">
            {navLinks.map((link) => {
              const active = currentView === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => handleLinkClick(link.id)}
                  className={`whitespace-nowrap shrink-0 transition-colors cursor-pointer py-1 text-xs uppercase tracking-wider font-semibold ${
                    active
                      ? 'text-[#C9000B] border-b-2 border-[#C9000B]'
                      : 'text-zinc-300 hover:text-white'
                  }`}
                >
                  {link.label}
                </button>
              );
            })}
          </nav>

          {/* Action Zone */}
          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            {/* Search Trigger */}
            <button
              onClick={onOpenSearch}
              className="p-2 text-zinc-300 hover:text-white hover:bg-zinc-800/80 rounded-lg transition-colors cursor-pointer"
              title="Buscar Sneakers"
              aria-label="Buscar"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Direct WhatsApp Contact Button */}
            <button
              onClick={handleWhatsappDirect}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 text-xs font-semibold bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 rounded-lg hover:bg-emerald-600/30 transition-colors cursor-pointer"
              title="Falar no WhatsApp"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>WhatsApp VIP</span>
            </button>

            {/* Cart Trigger */}
            <button
              onClick={onOpenCart}
              className="relative p-2.5 text-white bg-zinc-800/90 hover:bg-[#C9000B] rounded-lg transition-colors cursor-pointer flex items-center justify-center shadow-inner"
              title="Ver Carrinho"
              aria-label="Carrinho de Compras"
            >
              <ShoppingBag className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-[#C9000B] text-white text-[10px] font-extrabold w-5 h-5 rounded-full flex items-center justify-center border-2 border-[#111111] animate-pulse">
                  {cartCount}
                </span>
              )}
            </button>

            {/* Admin Panel Direct Access */}
            <button
              onClick={() => onNavigate('admin')}
              className={`p-2 rounded-lg transition-colors cursor-pointer ${
                currentView === 'admin' || currentView === 'builder'
                  ? 'text-white bg-[#C9000B]'
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/60'
              }`}
              title="Painel Administrativo & Editor"
              aria-label="Área Administrativa"
            >
              <Shield className="w-4 h-4" />
            </button>

            {/* Mobile Menu Hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-lg cursor-pointer"
              aria-label="Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#161616] border-b border-[#282828] px-4 pt-3 pb-6 space-y-3 animate-in fade-in slide-in-from-top-4 duration-150">
          <div className="grid grid-cols-1 gap-1">
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => handleLinkClick(link.id)}
                className={`flex items-center justify-between w-full px-4 py-3 rounded-lg text-left text-sm font-semibold transition-colors ${
                  currentView === link.id
                    ? 'bg-[#C9000B] text-white'
                    : 'text-zinc-300 hover:bg-zinc-800 hover:text-white'
                }`}
              >
                <span>{link.label}</span>
                <ArrowRight className="w-4 h-4 opacity-70" />
              </button>
            ))}
          </div>

          <div className="pt-3 border-t border-zinc-800 flex flex-col gap-2">
            <button
              onClick={handleWhatsappDirect}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-emerald-600 text-white font-semibold text-sm hover:bg-emerald-500 transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Chamar Atendente no WhatsApp</span>
            </button>
            <button
              onClick={() => handleLinkClick('admin')}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-zinc-800 text-zinc-300 hover:text-white text-xs font-semibold transition-colors"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Acesso Administrativo (/admin)</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
