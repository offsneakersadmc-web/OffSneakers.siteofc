import React from 'react';
import { Award, CheckCircle2, ShieldCheck, Sparkles, MessageCircle } from 'lucide-react';

export const AboutSection: React.FC = () => {
  return (
    <section className="w-full bg-[#141414] py-16 sm:py-24 border-t border-zinc-850 relative overflow-hidden">
      {/* Visual Ambient */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#C9000B]/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#850008]/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          {/* Left Column: Official Institutional Manifesto */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#C9000B]/10 border border-[#C9000B]/30 text-[#ff4d55] text-xs font-bold tracking-widest uppercase">
              <Award className="w-3.5 h-3.5 text-[#C9000B]" />
              <span>APRESENTAÇÃO OFF.SNEAKERSOFC</span>
            </div>

            <h2 className="font-anton text-3xl sm:text-5xl text-white tracking-wide uppercase leading-tight">
              CURADORIA, AUTENTICIDADE E EXCLUSIVIDADE
            </h2>

            <div className="space-y-4 text-zinc-300 text-sm sm:text-base leading-relaxed">
              <p>
                A <strong className="text-white">OFF.SNEAKERSOFC</strong> é especializada na curadoria e comercialização de sneakers, calçados e artigos de marcas reconhecidas, conectando estilo, autenticidade e oportunidades exclusivas, com atendimento sediado em Salvador, BA e alcance para todo o Brasil.
              </p>
              <p>
                Nossa proposta é oferecer uma experiência de compra diferenciada, reunindo produtos desejados, seleção criteriosa e condições especiais para quem valoriza qualidade e identidade.
              </p>
              <p>
                Acreditamos que estilo vai além de tendências. É expressão, personalidade e atitude. Por isso, buscamos oferecer uma seleção de produtos que acompanhe diferentes estilos e permita que cada cliente encontre peças alinhadas à sua identidade.
              </p>
              <p className="text-zinc-400">
                Trabalhamos com compromisso com a transparência, atenção minuciosa à procedência dos produtos e um atendimento próximo em cada etapa da compra diretamente de Salvador, BA.
              </p>
              <p className="font-semibold text-white">
                Mais do que comercializar produtos, queremos construir uma experiência de confiança com pessoas que compartilham nossa paixão pelo universo sneaker.
              </p>
            </div>

            {/* Slogan Lockup */}
            <div className="p-4 sm:p-5 rounded-2xl bg-[#1c1c1c] border border-zinc-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <span className="font-anton text-xl tracking-wider text-white uppercase block">
                  OFF.SNEAKERSOFC — SNEAKER RESELLER.
                </span>
                <span className="text-xs text-[#ff4d55] font-semibold">
                  Seu estilo, sua identidade, sua escolha. • Salvador, BA
                </span>
              </div>
              <img
                src="/assets/aistudio/Perfil_Instagram_OFFSNEAKERS1_97329a12.png"
                alt="OFF.SNEAKERSOFC Selo Oficial"
                className="w-12 h-12 object-contain rounded-md shrink-0 border border-red-900/40"
              />
            </div>
          </div>

          {/* Right Column: Visual Verification Trust Card */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-[#1a1a1a] p-6 sm:p-8 rounded-2xl border border-zinc-800 space-y-6 shadow-xl">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-[#C9000B] text-white flex items-center justify-center font-anton text-2xl shadow-md">
                  OS
                </div>
                <div>
                  <h3 className="font-anton text-xl text-white uppercase tracking-wide">
                    COMPROMISSO INEGOCIÁVEL
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Inspeção física individual par por par
                  </p>
                </div>
              </div>

              <div className="space-y-4 pt-1">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase">
                      Legit Check Físico Rigoroso
                    </h4>
                    <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">
                      Avaliação detalhada de costuras, matriz de materiais, palmilhas, etiquetas e peso com tecnologia e olhar técnico.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase">
                      Caixas Originais & Tags Lacradas
                    </h4>
                    <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">
                      Todos os itens acompanham suas caixas originais, cadarços extras e identificadores de fábrica.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase">
                      Vídeos e Fotos Reais no WhatsApp
                    </h4>
                    <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">
                      Você pode solicitar fotos em alta resolução e vídeo 360º do seu par exato antes do envio.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-zinc-800 text-center">
                <span className="text-[11px] text-zinc-500 font-mono tracking-wider">
                  VERIFICAÇÃO MANUAL GARANTIDA • PRODUTOS 100% ORIGINAIS
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
