import React, { useState, useEffect } from 'react';
import { ArrowRight, ShieldCheck, Flame, Zap, ChevronLeft, ChevronRight, MapPin } from 'lucide-react';
import { DesignSettings, Banner } from '../../types';
import { resolveImageUrl, handleImageError } from '../../utils/imageHelper';

interface HeroBannerProps {
  designSettings: DesignSettings;
  onExplore: () => void;
  onViewReleases: () => void;
  onNavigateLink?: (link: string) => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  designSettings,
  onExplore,
  onViewReleases,
  onNavigateLink,
}) => {
  const banners: Banner[] =
    designSettings.banners && designSettings.banners.length > 0
      ? designSettings.banners.filter((b) => b.active)
      : [
          {
            id: 'default-hero',
            title: designSettings.heroTitle || 'SEU ESTILO. SUAS MARCAS. SEU MELHOR PREÇO.',
            subtitle:
              designSettings.heroSubtitle ||
              'Descubra uma seleção exclusiva de sneakers e artigos de marcas reconhecidas com condições especiais.',
            buttonText: designSettings.heroButtonText || 'EXPLORAR COLEÇÃO',
            buttonLink: 'catalog',
            badgeText: designSettings.heroBadgeText || 'OFF.SNEAKERSOFC — SNEAKER RESELLER',
            desktopImage: resolveImageUrl(designSettings.heroImage || '/assets/images/hero_sneaker_reseller_urban_1794010894924.jpg'),
            mobileImage: designSettings.heroMobileImage ? resolveImageUrl(designSettings.heroMobileImage) : undefined,
            focalPoint: 'center',
            objectFit: 'cover',
            active: true,
            order: 1,
          },
        ];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const intervalTime = (designSettings.carouselInterval || 6) * 1000;

  useEffect(() => {
    if (banners.length <= 1 || isPaused) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, intervalTime);
    return () => clearInterval(timer);
  }, [banners.length, isPaused, intervalTime]);

  const currentBanner = banners[currentIndex] || banners[0];

  const handleCtaClick = () => {
    if (currentBanner.buttonLink) {
      if (onNavigateLink) {
        onNavigateLink(currentBanner.buttonLink);
      } else {
        onExplore();
      }
    } else {
      onExplore();
    }
  };

  return (
    <section
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className="relative w-full overflow-hidden bg-[#111111] text-white border-b border-zinc-850"
    >
      {/* Background Ambience with Brand Red Glow */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-[#C9000B]/20 rounded-full blur-[140px]" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-[#850008]/20 rounded-full blur-[160px]" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#111111] via-[#111111]/85 to-transparent z-10 hidden lg:block" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#111111] via-[#111111]/60 to-transparent z-10 lg:hidden" />
      </div>

      <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 lg:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column: Headlines & Actions */}
          <div className="lg:col-span-7 space-y-5 sm:space-y-6">
            {/* Tagline Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#C9000B]/15 border border-[#C9000B]/40 text-[#ff4d55] text-xs font-bold tracking-widest uppercase">
              <Flame className="w-3.5 h-3.5 text-[#C9000B] shrink-0" />
              <span>{currentBanner.badgeText || 'OFF.SNEAKERSOFC — SNEAKER RESELLER'}</span>
            </div>

            {/* Main Headline */}
            <h1 className="font-anton text-3xl sm:text-5xl lg:text-6xl xl:text-7xl tracking-wide uppercase leading-[0.98] text-white">
              {currentBanner.title}
            </h1>

            {/* Subtitle */}
            <p className="text-zinc-300 text-sm sm:text-base lg:text-lg max-w-2xl font-normal leading-relaxed">
              {currentBanner.subtitle}
            </p>

            {/* Commercial Highlights */}
            <div className="flex flex-wrap items-center gap-3 sm:gap-4 pt-1 text-xs text-zinc-300 font-medium">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#C9000B] shrink-0" />
                <span>100% Autênticos Verificados</span>
              </div>
              <span className="text-zinc-600 hidden sm:inline">•</span>
              <div className="flex items-center gap-1.5 text-zinc-200">
                <MapPin className="w-4 h-4 text-[#C9000B] shrink-0" />
                <span className="font-semibold text-white">Salvador, BA</span>
                <span className="text-zinc-400">para todo o Brasil</span>
              </div>
              <span className="text-zinc-600 hidden sm:inline">•</span>
              <div className="flex items-center gap-1.5">
                <span className="text-emerald-400 font-bold">5% OFF</span>
                <span>no PIX</span>
              </div>
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 pt-3">
              <button
                onClick={handleCtaClick}
                className="px-8 py-4 bg-[#C9000B] hover:bg-[#a60009] active:scale-[0.98] text-white font-anton tracking-wider text-base sm:text-lg uppercase rounded-xl shadow-lg shadow-red-950/60 hover:shadow-red-800/40 transition-all flex items-center justify-center gap-3 cursor-pointer group min-h-[48px]"
              >
                <span>{currentBanner.buttonText || 'EXPLORAR COLEÇÃO'}</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={onViewReleases}
                className="px-6 py-4 bg-zinc-900/90 hover:bg-zinc-800 active:scale-[0.98] text-zinc-200 hover:text-white font-semibold text-xs sm:text-sm tracking-wide uppercase rounded-xl border border-zinc-700 transition-colors flex items-center justify-center cursor-pointer min-h-[48px]"
              >
                Ver Lançamentos Recentes
              </button>
            </div>
          </div>

          {/* Right Column: Visual Banner Showcase */}
          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto max-w-md lg:max-w-none">
              <div className="absolute -inset-1.5 bg-gradient-to-tr from-[#C9000B] to-[#111111] rounded-2xl blur-md opacity-35" />

              <div className="relative rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-950 shadow-2xl">
                <picture>
                  {currentBanner.mobileImage && (
                    <source media="(max-width: 640px)" srcSet={resolveImageUrl(currentBanner.mobileImage)} />
                  )}
                  <img
                    src={resolveImageUrl(currentBanner.desktopImage)}
                    onError={handleImageError}
                    alt={currentBanner.title}
                    className="w-full h-[280px] sm:h-[380px] lg:h-[420px] object-cover transition-transform duration-700"
                    style={{
                      objectPosition: currentBanner.focalPoint || 'center',
                    }}
                  />
                </picture>

                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent pointer-events-none" />

                {/* Banner Mini Floating Tag */}
                <div className="absolute bottom-3 left-3 right-3 sm:bottom-4 sm:left-4 sm:right-4 bg-zinc-900/90 backdrop-blur-md border border-zinc-700/80 p-3 sm:p-4 rounded-xl flex items-center justify-between">
                  <div className="min-w-0 pr-2">
                    <span className="text-[10px] font-bold text-[#C9000B] uppercase tracking-widest block truncate">
                      {currentBanner.badgeText || 'DESTAQUE EXCLUSIVO'}
                    </span>
                    <h3 className="text-white font-bold text-xs sm:text-sm truncate">
                      {currentBanner.title}
                    </h3>
                  </div>
                  <button
                    onClick={handleCtaClick}
                    className="px-3 py-2 bg-[#C9000B] hover:bg-red-700 text-white text-xs font-bold rounded-lg uppercase cursor-pointer shrink-0"
                  >
                    Ver Pares
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Carousel Controls (if more than 1 banner) */}
        {banners.length > 1 && (
          <div className="flex items-center justify-between pt-6 mt-4 border-t border-zinc-800/60">
            <div className="flex items-center gap-2">
              {banners.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentIndex(i)}
                  className={`h-1.5 rounded-full transition-all cursor-pointer ${
                    currentIndex === i ? 'w-8 bg-[#C9000B]' : 'w-2 bg-zinc-700 hover:bg-zinc-500'
                  }`}
                  aria-label={`Banner ${i + 1}`}
                />
              ))}
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentIndex((prev) => (prev === 0 ? banners.length - 1 : prev - 1))}
                className="p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 transition-colors cursor-pointer"
                aria-label="Banner anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentIndex((prev) => (prev + 1) % banners.length)}
                className="p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 transition-colors cursor-pointer"
                aria-label="Próximo banner"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
