import React from 'react';

interface BrandsSectionProps {
  onSelectBrand: (brand: string) => void;
}

export const BrandsSection: React.FC<BrandsSectionProps> = ({ onSelectBrand }) => {
  const brands = [
    { name: 'JORDAN', tag: 'AIR JORDAN RETRO' },
    { name: 'NIKE', tag: 'DUNK & AIR FORCE' },
    { name: 'ADIDAS', tag: 'YEEZY & ORIGINALS' },
    { name: 'TRAVIS SCOTT', tag: 'CACTUS JACK' },
    { name: 'NEW BALANCE', tag: '9060 & 550' },
  ];

  return (
    <section className="w-full bg-[#111111] py-16 border-t border-zinc-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#C9000B]">
              COLEÇÕES OFICIAIS
            </span>
            <h2 className="font-anton text-3xl sm:text-4xl text-white tracking-wide uppercase mt-1">
              MARCAS RECONHECIDAS
            </h2>
          </div>
          <p className="text-zinc-400 text-xs sm:text-sm max-w-md">
            Parcerias e estoque selecionado das marcas mais cobiçadas da cultura sneaker mundial.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {brands.map((b, idx) => (
            <button
              key={idx}
              onClick={() => onSelectBrand(b.name)}
              className="bg-[#181818] p-6 rounded-xl border border-zinc-800 hover:border-[#C9000B] hover:bg-[#1f1f1f] transition-all text-center group cursor-pointer flex flex-col items-center justify-center space-y-2"
            >
              <span className="font-anton text-2xl text-white tracking-widest group-hover:text-[#ff4d55] transition-colors">
                {b.name}
              </span>
              <span className="text-[10px] text-zinc-400 tracking-wider uppercase font-semibold">
                {b.tag}
              </span>
              <span className="text-xs text-[#C9000B] font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                Ver Modelos →
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};
