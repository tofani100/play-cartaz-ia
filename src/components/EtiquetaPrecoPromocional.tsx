import React from 'react';

interface EtiquetaPrecoProps {
  price: string;
  originalPrice?: string;
  unit: string;
  badge?: string;
  themeStyle?: {
    badgeBg?: string;
    badgeText?: string;
    priceBg?: string;
    priceText?: string;
  };
  size?: 'sm' | 'md' | 'lg' | 'hero';
}

export const EtiquetaPrecoPromocional: React.FC<EtiquetaPrecoProps> = ({
  price,
  originalPrice,
  unit,
  badge,
  themeStyle,
  size = 'lg',
}) => {
  // Split integer and cents (e.g. "24,90" -> "24" and "90")
  const parts = price.replace('R$', '').trim().split(/[,.]/);
  const intPart = parts[0] || '0';
  const centsPart = parts[1] ? parts[1].padEnd(2, '0').slice(0, 2) : '00';

  const isHero = size === 'hero';
  const isLg = size === 'lg';
  const isMd = size === 'md';

  return (
    <div className="flex flex-col items-start select-none">
      {/* Promotional Badge (e.g., SUPER PREÇO, OFERTA, SÓ HOJE) */}
      {badge && (
        <div 
          className="mb-1 uppercase font-black tracking-wider px-2.5 py-0.5 rounded shadow-sm text-center flex items-center justify-center border border-black/10 animate-pulse"
          style={{
            backgroundColor: themeStyle?.badgeBg || '#FACC15',
            color: themeStyle?.badgeText || '#000000',
            fontSize: isHero ? '13px' : isLg ? '11px' : '9px',
          }}
        >
          {badge}
        </div>
      )}

      {/* "De:" regular price strike-through */}
      {originalPrice && (
        <div className="text-neutral-300 font-bold tracking-tight line-through opacity-85 text-xs sm:text-sm pl-1">
          De: R$ {originalPrice.replace('R$', '').trim()}
        </div>
      )}

      {/* Main Supermarket Price Tag Badge */}
      <div 
        className="rounded-xl p-2 sm:p-3 shadow-2xl flex items-baseline border-2 border-white/20 transition-transform"
        style={{
          backgroundColor: themeStyle?.priceBg || '#FACC15',
          color: themeStyle?.priceText || '#7F1D1D',
        }}
      >
        {/* "R$" label */}
        <div className="flex flex-col justify-start mr-1 sm:mr-1.5 self-start pt-1">
          <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider opacity-90 leading-none">
            POR
          </span>
          <span className="font-extrabold text-xs sm:text-sm leading-tight">
            R$
          </span>
        </div>

        {/* Huge Integer Number */}
        <div 
          className="font-['Bebas_Neue',_Impact,_sans-serif] tracking-tight leading-none drop-shadow-sm font-black"
          style={{
            fontSize: isHero ? '5.5rem' : isLg ? '4.2rem' : isMd ? '3rem' : '2rem',
          }}
        >
          {intPart}
        </div>

        {/* Elevated Cents and Unit */}
        <div className="flex flex-col justify-start pl-0.5 self-start pt-1">
          <span 
            className="font-['Bebas_Neue',_Impact,_sans-serif] font-bold leading-none"
            style={{
              fontSize: isHero ? '2.4rem' : isLg ? '1.8rem' : isMd ? '1.3rem' : '1rem',
            }}
          >
            ,{centsPart}
          </span>
          <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider mt-0.5 opacity-90 bg-black/10 px-1 py-0.2 rounded text-center">
            {unit || 'cada'}
          </span>
        </div>
      </div>
    </div>
  );
};

export const PriceTag = EtiquetaPrecoPromocional;
