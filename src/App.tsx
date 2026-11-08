import React, { useState, useEffect } from 'react';
import {
  Product,
  CartItem,
  Order,
  StoreSettings,
  DesignSettings,
  FaqItem
} from './types';
import { storeService } from './services/storeService';
import { Navbar } from './components/Navbar';
import { HeroBanner } from './components/home/HeroBanner';
import { BenefitsSection } from './components/home/BenefitsSection';
import { BrandsSection } from './components/home/BrandsSection';
import { AboutSection } from './components/home/AboutSection';
import { FaqSection } from './components/home/FaqSection';
import { Footer } from './components/home/Footer';
import { SearchModal } from './components/home/SearchModal';
import { CatalogView } from './components/catalog/CatalogView';
import { ProductCard } from './components/catalog/ProductCard';
import { ProductModal } from './components/catalog/ProductModal';
import { CartDrawer } from './components/cart/CartDrawer';
import { CheckoutModal } from './components/checkout/CheckoutModal';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { VisualBuilder } from './components/builder/VisualBuilder';
import { MessageCircle, ArrowRight, ShieldCheck, Flame, ShoppingBag, Search, Sparkles } from 'lucide-react';

export default function App() {
  const [currentView, setCurrentView] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname.toLowerCase();
      const hash = window.location.hash.toLowerCase();
      if (path === '/admin' || hash === '#admin') return 'admin';
      if (path === '/catalog' || hash === '#catalog') return 'catalog';
      if (path === '/releases' || hash === '#releases') return 'releases';
      if (path === '/bestsellers' || hash === '#bestsellers') return 'bestsellers';
    }
    return 'home';
  });
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [storeSettings, setStoreSettings] = useState<StoreSettings>(storeService.getSettings());
  const [designSettings, setDesignSettings] = useState<DesignSettings>(storeService.getDesign());
  const [faqs, setFaqs] = useState<FaqItem[]>(storeService.getFaqs());

  // Interactive Overlays
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('offsneakers_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Selected brand filter for catalog
  const [catalogBrandFilter, setCatalogBrandFilter] = useState<string | undefined>(undefined);

  // Initial mount & sync
  useEffect(() => {
    storeService.init().then(() => {
      refreshData();
    });

    const interval = setInterval(() => {
      refreshData();
    }, 4000);

    const handleLocationChange = () => {
      const path = window.location.pathname.toLowerCase();
      const hash = window.location.hash.toLowerCase();
      if (path === '/admin' || hash === '#admin') {
        setCurrentView('admin');
      } else if (path === '/' || hash === '') {
        setCurrentView('home');
      }
    };
    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
    };
  }, []);

  const refreshData = () => {
    setProducts([...storeService.getProducts()]);
    setOrders([...storeService.getOrders()]);
    setStoreSettings({ ...storeService.getSettings() });
    setDesignSettings({ ...storeService.getDesign() });
    setFaqs([...storeService.getFaqs()]);
  };

  // Cart operations with string size support
  const handleAddToCart = (product: Product, size: string, quantity: number) => {
    setCart((prevCart) => {
      const existingIdx = prevCart.findIndex(
        (i) => i.product.id === product.id && String(i.size) === String(size)
      );
      let updated: CartItem[];
      if (existingIdx >= 0) {
        updated = [...prevCart];
        updated[existingIdx].quantity += quantity;
      } else {
        updated = [...prevCart, { product, size: String(size), quantity }];
      }
      try {
        localStorage.setItem('offsneakers_cart', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    setSelectedProduct(null);
    setIsCartOpen(true);
  };

  const handleBuyNow = (product: Product, size: string, quantity: number) => {
    setCart([{ product, size: String(size), quantity }]);
    try {
      localStorage.setItem(
        'offsneakers_cart',
        JSON.stringify([{ product, size: String(size), quantity }])
      );
    } catch {}
    setSelectedProduct(null);
    setIsCheckoutOpen(true);
  };

  const handleUpdateCartQuantity = (productId: string, size: string, newQty: number) => {
    setCart((prev) => {
      let updated: CartItem[];
      if (newQty <= 0) {
        updated = prev.filter((i) => !(i.product.id === productId && String(i.size) === String(size)));
      } else {
        updated = prev.map((i) =>
          i.product.id === productId && String(i.size) === String(size)
            ? { ...i, quantity: newQty }
            : i
        );
      }
      try {
        localStorage.setItem('offsneakers_cart', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const handleRemoveCartItem = (productId: string, size: string) => {
    setCart((prev) => {
      const updated = prev.filter(
        (i) => !(i.product.id === productId && String(i.size) === String(size))
      );
      try {
        localStorage.setItem('offsneakers_cart', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const handleOrderSuccess = (order: Order) => {
    setCart([]);
    try {
      localStorage.removeItem('offsneakers_cart');
    } catch {}
    refreshData();
  };

  const handleBrandSelect = (brandName: string) => {
    setCatalogBrandFilter(brandName);
    setCurrentView('catalog');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBannerLink = (link: string) => {
    if (link.includes('?brand=')) {
      const brand = link.split('?brand=')[1];
      setCatalogBrandFilter(brand);
      setCurrentView('catalog');
    } else if (link === 'catalog') {
      setCatalogBrandFilter(undefined);
      setCurrentView('catalog');
    } else {
      setCurrentView(link);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const totalCartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  // If in Visual Builder Mode
  if (currentView === 'builder') {
    return (
      <VisualBuilder
        currentDesign={designSettings}
        storeSettings={storeSettings}
        products={products}
        onClose={() => setCurrentView('admin')}
        onDesignPublished={(newDesign) => {
          setDesignSettings(newDesign);
          refreshData();
        }}
      />
    );
  }

  // If in Admin Dashboard Mode
  if (currentView === 'admin') {
    return (
      <AdminDashboard
        products={products}
        orders={orders}
        storeSettings={storeSettings}
        designSettings={designSettings}
        onRefreshData={refreshData}
        onOpenVisualBuilder={() => setCurrentView('builder')}
        onExitAdmin={() => {
          setCurrentView('home');
          if (typeof window !== 'undefined' && window.location.pathname === '/admin') {
            window.history.pushState(null, '', '/');
          }
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#111111] text-white flex flex-col justify-between selection:bg-[#C9000B] selection:text-white pb-16 lg:pb-0">
      {/* Top Navbar */}
      <Navbar
        currentView={currentView}
        onNavigate={(view) => {
          if (view === 'catalog') setCatalogBrandFilter(undefined);
          if (view === 'admin') {
            if (typeof window !== 'undefined') window.history.pushState(null, '', '/admin');
          } else if (view === 'home') {
            if (typeof window !== 'undefined' && window.location.pathname === '/admin') {
              window.history.pushState(null, '', '/');
            }
          }
          setCurrentView(view);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        cartCount={totalCartCount}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenSearch={() => setIsSearchOpen(true)}
        storeSettings={storeSettings}
        designSettings={designSettings}
      />

      {/* Main View Router */}
      <main className="flex-1">
        {/* HOMEPAGE */}
        {currentView === 'home' && (
          <div>
            {/* Dynamic Ordered Sections from Visual Builder */}
            {designSettings.sections
              .filter((s) => s.enabled)
              .map((section) => {
                switch (section.id) {
                  case 'hero':
                    return (
                      <HeroBanner
                        key="hero"
                        designSettings={designSettings}
                        onExplore={() => {
                          setCurrentView('catalog');
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        onViewReleases={() => {
                          setCurrentView('releases');
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        onNavigateLink={handleBannerLink}
                      />
                    );

                  case 'benefits':
                    return <BenefitsSection key="benefits" />;

                  case 'featured':
                    return (
                      <section
                        key="featured"
                        className="py-12 sm:py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 sm:mb-8 gap-3 border-b border-zinc-800 pb-4">
                          <div>
                            <span className="text-xs font-bold text-[#C9000B] uppercase tracking-[0.2em] flex items-center gap-1.5">
                              <Flame className="w-4 h-4" />
                              SELEÇÃO EXCLUSIVA
                            </span>
                            <h2 className="font-anton text-2xl sm:text-4xl text-white uppercase tracking-wide mt-1">
                              OFERTAS EM DESTAQUE
                            </h2>
                          </div>
                          <button
                            onClick={() => {
                              setCurrentView('catalog');
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            className="text-xs font-bold text-zinc-300 hover:text-[#C9000B] flex items-center gap-1 transition-colors uppercase tracking-wider cursor-pointer"
                          >
                            <span>Ver Todos os Modelos</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
                          {products.slice(0, 4).map((p) => (
                            <ProductCard
                              key={p.id}
                              product={p}
                              onSelect={(prod) => setSelectedProduct(prod)}
                            />
                          ))}
                        </div>
                      </section>
                    );

                  case 'bestsellers':
                    return (
                      <section
                        key="bestsellers"
                        className="py-12 sm:py-16 bg-[#151515] border-y border-zinc-800"
                      >
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 sm:mb-8 gap-3 border-b border-zinc-800 pb-4">
                            <div>
                              <span className="text-xs font-bold text-[#C9000B] uppercase tracking-[0.2em]">
                                MAIS BUSCADOS
                              </span>
                              <h2 className="font-anton text-2xl sm:text-4xl text-white uppercase tracking-wide mt-1">
                                MAIS VENDIDOS DA SEMANA
                              </h2>
                            </div>
                            <button
                              onClick={() => {
                                setCurrentView('bestsellers');
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                              }}
                              className="text-xs font-bold text-zinc-300 hover:text-[#C9000B] flex items-center gap-1 uppercase tracking-wider cursor-pointer"
                            >
                              <span>Ver Coleção Completa</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
                            {products
                              .filter((p) => p.bestSeller)
                              .slice(0, 4)
                              .map((p) => (
                                <ProductCard
                                  key={p.id}
                                  product={p}
                                  onSelect={(prod) => setSelectedProduct(prod)}
                                />
                              ))}
                          </div>
                        </div>
                      </section>
                    );

                  case 'brands':
                    return (
                      <BrandsSection
                        key="brands"
                        onSelectBrand={handleBrandSelect}
                      />
                    );

                  case 'about':
                    return <AboutSection key="about" />;

                  case 'faq':
                    return <FaqSection key="faq" faqs={faqs} />;

                  case 'trust':
                    return (
                      <section
                        key="trust"
                        className="py-12 bg-gradient-to-r from-[#850008] via-[#C9000B] to-[#850008] text-white"
                      >
                        <div className="max-w-5xl mx-auto px-4 text-center space-y-4">
                          <ShieldCheck className="w-12 h-12 mx-auto text-white/90" />
                          <h2 className="font-anton text-2xl sm:text-4xl uppercase tracking-wider">
                            AUTENTICIDADE E PROCEDÊNCIA GARANTIDAS
                          </h2>
                          <p className="text-xs sm:text-sm text-white/90 max-w-2xl mx-auto leading-relaxed">
                            Não vendemos réplicas. Cada sneaker anunciado passa por um rigoroso teste de autenticidade física por nossa equipe técnica especializada antes de ser despachado.
                          </p>
                          <div className="pt-2">
                            <button
                              onClick={() => {
                                setCurrentView('catalog');
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                              }}
                              className="px-8 py-3.5 bg-black hover:bg-zinc-900 text-white font-anton text-sm uppercase rounded-xl tracking-wider transition-all cursor-pointer shadow-xl min-h-[46px]"
                            >
                              Explorar Catálogo Autêntico
                            </button>
                          </div>
                        </div>
                      </section>
                    );

                  default:
                    return null;
                }
              })}
          </div>
        )}

        {/* CATALOG VIEW */}
        {currentView === 'catalog' && (
          <CatalogView
            products={products}
            onSelectProduct={(p) => setSelectedProduct(p)}
            initialFilter={{ brand: catalogBrandFilter }}
          />
        )}

        {/* BESTSELLERS VIEW */}
        {currentView === 'bestsellers' && (
          <CatalogView
            products={products}
            onSelectProduct={(p) => setSelectedProduct(p)}
            initialFilter={{ bestsellersOnly: true }}
          />
        )}

        {/* RELEASES VIEW */}
        {currentView === 'releases' && (
          <CatalogView
            products={products}
            onSelectProduct={(p) => setSelectedProduct(p)}
            initialFilter={{ releasesOnly: true }}
          />
        )}

        {/* ABOUT VIEW */}
        {currentView === 'about' && (
          <div className="pt-4">
            <AboutSection />
            <BenefitsSection />
          </div>
        )}

        {/* FAQ VIEW */}
        {currentView === 'faq' && (
          <div className="py-10">
            <FaqSection faqs={faqs} />
          </div>
        )}
      </main>

      {/* Floating WhatsApp Quick Action Button */}
      <a
        href={`https://wa.me/${storeSettings.whatsappNumber}?text=${encodeURIComponent(
          storeSettings.whatsappWelcomeMsg
        )}`}
        target="_blank"
        rel="noreferrer"
        className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-40 p-3.5 sm:p-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full shadow-2xl flex items-center gap-2 group hover:scale-105 transition-all cursor-pointer ring-4 ring-emerald-950/60"
        title="Atendimento Imediato no WhatsApp"
      >
        <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6" />
        <span className="hidden sm:inline font-bold text-xs uppercase tracking-wider">
          Falar no WhatsApp
        </span>
      </a>

      {/* Mobile Sticky Bottom Navigation Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#141414]/95 backdrop-blur-md border-t border-zinc-800 px-4 py-2 flex items-center justify-around">
        <button
          onClick={() => {
            setCurrentView('home');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={`flex flex-col items-center gap-1 text-[10px] font-semibold ${
            currentView === 'home' ? 'text-[#C9000B]' : 'text-zinc-400'
          }`}
        >
          <Flame className="w-4 h-4" />
          <span>Início</span>
        </button>

        <button
          onClick={() => {
            setCurrentView('catalog');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={`flex flex-col items-center gap-1 text-[10px] font-semibold ${
            currentView === 'catalog' ? 'text-[#C9000B]' : 'text-zinc-400'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Catálogo</span>
        </button>

        <button
          onClick={() => setIsSearchOpen(true)}
          className="flex flex-col items-center gap-1 text-[10px] font-semibold text-zinc-400"
        >
          <Search className="w-4 h-4" />
          <span>Buscar</span>
        </button>

        <button
          onClick={() => setIsCartOpen(true)}
          className="relative flex flex-col items-center gap-1 text-[10px] font-semibold text-zinc-400"
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Carrinho</span>
          {totalCartCount > 0 && (
            <span className="absolute -top-1 right-2 bg-[#C9000B] text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
              {totalCartCount}
            </span>
          )}
        </button>
      </div>

      {/* Product Modal View */}
      <ProductModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={handleAddToCart}
        onBuyNow={handleBuyNow}
      />

      {/* Cart Slide-Over Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveCartItem}
        onCheckout={() => setIsCheckoutOpen(true)}
      />

      {/* Real WhatsApp Checkout Modal with Automatic Email Dispatch */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        cart={cart}
        storeSettings={storeSettings}
        onOrderSuccess={handleOrderSuccess}
      />

      {/* Instant Search Modal */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        products={products}
        onSelectProduct={(p) => setSelectedProduct(p)}
      />

      {/* Global Footer */}
      <Footer
        storeSettings={storeSettings}
        onNavigate={(view) => {
          setCurrentView(view);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />
    </div>
  );
}
