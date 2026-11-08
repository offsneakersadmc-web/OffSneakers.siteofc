import React from 'react';
import { ShieldCheck, Sparkles, Tag, MessageCircle } from 'lucide-react';

export const BenefitsSection: React.FC = () => {
  const benefits = [
    {
      icon: ShieldCheck,
      title: 'AUTENTICIDADE',
      subtitle: 'Produtos 100% originais e procedência verificável.',
      desc: 'Rigoroso controle físico de qualidade e autenticidade (legit check) em cada exemplar antes do envio.',
    },
    {
      icon: Sparkles,
      title: 'EXCLUSIVIDADE',
      subtitle: 'Seleção apurada das melhores marcas.',
      desc: 'Acesso a lançamentos concorridos, colaborações históricas e colorways raras difíceis de encontrar.',
    },
    {
      icon: Tag,
      title: 'PREÇOS ESPECIAIS',
      subtitle: 'Condições fora do padrão de mercado.',
      desc: 'Oportunidades reais com preços competitivos abaixo dos valores inflacionados do mercado tradicional.',
    },
    {
      icon: MessageCircle,
      title: 'ATENDIMENTO VIP',
      subtitle: 'Diretamente de Salvador, BA para todo o Brasil.',
      desc: 'Atendimento humanizado no WhatsApp oficial, fotos e vídeos reais do par, conferência de medidas e envio seguro com rastreamento.',
    },
  ];

  return (
    <section className="w-full bg-[#161616] py-16 border-y border-[#262626]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#C9000B]">
            POR QUE COMPRAR NA OFF.SNEAKERSOFC?
          </span>
          <h2 className="font-anton text-3xl sm:text-4xl text-white tracking-wide uppercase mt-2">
            A EXPERIÊNCIA DEFINITIVA EM SNEAKERS
          </h2>
          <p className="text-zinc-400 text-sm mt-3">
            Construímos uma ponte confiável entre o colecionador e os pares mais desejados do mundo.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {benefits.map((b, idx) => {
            const Icon = b.icon;
            return (
              <div
                key={idx}
                className="bg-[#1c1c1c] p-6 rounded-xl border border-zinc-800/80 hover:border-[#C9000B]/50 hover:bg-[#202020] transition-all group flex flex-col justify-between"
              >
                <div>
                  <div className="w-12 h-12 rounded-lg bg-[#C9000B]/10 border border-[#C9000B]/30 flex items-center justify-center mb-5 text-[#C9000B] group-hover:bg-[#C9000B] group-hover:text-white transition-colors">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-anton text-xl tracking-wider text-white uppercase">
                    {b.title}
                  </h3>
                  <p className="text-xs font-semibold text-zinc-300 mt-1">
                    {b.subtitle}
                  </p>
                  <p className="text-xs text-zinc-400 mt-3 leading-relaxed">
                    {b.desc}
                  </p>
                </div>
                <div className="pt-4 mt-4 border-t border-zinc-800/50 flex items-center justify-between text-[11px] text-[#C9000B] font-bold">
                  <span>PADRÃO OFF.SNEAKERSOFC</span>
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity">✓</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
