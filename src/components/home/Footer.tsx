import React from 'react';
import { MessageCircle, Instagram, Shield, ArrowUp, Mail, MapPin } from 'lucide-react';
import { StoreSettings } from '../../types';

interface FooterProps {
  storeSettings: StoreSettings;
  onNavigate: (view: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ storeSettings, onNavigate }) => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleWhatsapp = () => {
    window.open(`https://wa.me/${storeSettings.whatsappNumber}`, '_blank');
  };

  return (
    <footer className="w-full bg-[#0d0d0d] text-zinc-400 border-t border-zinc-900 pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 pb-12 border-b border-zinc-800/80">
          {/* Brand Info */}
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center gap-3">
              <img
                src="/assets/aistudio/Perfil_Instagram_OFFSNEAKERS1_97329a12.png"
                alt="OFF.SNEAKERSOFC"
                className="w-12 h-12 object-contain rounded-md border border-red-900/60"
              />
              <div>
                <h3 className="font-anton text-2xl text-white tracking-wider uppercase leading-none">
                  OFF.SNEAKERSOFC
                </h3>
                <span className="text-[10px] text-[#C9000B] font-bold tracking-[0.25em] uppercase font-condensed">
                  {storeSettings.slogan || 'SNEAKER RESELLER.'}
                </span>
              </div>
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed max-w-sm">
              Especializada na comercialização de sneakers, calçados e artigos de marcas reconhecidas com preços muito abaixo dos valores tradicionalmente encontrados no mercado.
            </p>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={handleWhatsapp}
                className="p-2.5 bg-zinc-900 hover:bg-emerald-600 text-white rounded-lg transition-colors cursor-pointer"
                title="WhatsApp Oficial"
              >
                <MessageCircle className="w-4 h-4" />
              </button>
              <a
                href={`https://instagram.com/${storeSettings.instagram.replace('@', '')}`}
                target="_blank"
                rel="noreferrer"
                className="p-2.5 bg-zinc-900 hover:bg-[#C9000B] text-white rounded-lg transition-colors cursor-pointer"
                title="Instagram Oficial"
              >
                <Instagram className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Quick Nav Links */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="font-anton text-sm text-white tracking-wider uppercase">
              NAVEGAÇÃO RÁPIDA
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={() => onNavigate('home')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Início
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('catalog')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Catálogo Completo
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('bestsellers')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Mais Vendidos
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('releases')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Lançamentos & Novidades
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('about')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Sobre a OFF.SNEAKERSOFC
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('faq')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Perguntas Frequentes (FAQ)
                </button>
              </li>
            </ul>
          </div>

          {/* Contact & Legal */}
          <div className="lg:col-span-4 space-y-3">
            <h4 className="font-anton text-sm text-white tracking-wider uppercase">
              ATENDIMENTO & LOCALIZAÇÃO
            </h4>
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-[#C9000B] shrink-0" />
                <span className="text-zinc-300 select-all">{storeSettings.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <MessageCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span className="text-zinc-300">WhatsApp Oficial Nacional</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-[#C9000B] shrink-0" />
                <span className="text-zinc-200 font-medium">{storeSettings.address || 'Salvador, BA — Atendimento Especializado'}</span>
              </div>
            </div>

            <div className="pt-2">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-300">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Base em <strong>Salvador, BA</strong> • Atendimento e Envio para Todo o Brasil</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
          <p>
            © {new Date().getFullYear()} OFF.SNEAKERSOFC — SNEAKER RESELLER. Todos os direitos reservados.
          </p>

          <div className="flex items-center gap-4">
            <button
              onClick={() => onNavigate('admin')}
              className="text-zinc-600 hover:text-zinc-400 text-[11px] flex items-center gap-1 cursor-pointer"
            >
              <Shield className="w-3 h-3" />
              <span>Painel Administrativo</span>
            </button>

            <button
              onClick={scrollToTop}
              className="p-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-lg transition-colors cursor-pointer"
              aria-label="Voltar ao topo"
            >
              <ArrowUp className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
