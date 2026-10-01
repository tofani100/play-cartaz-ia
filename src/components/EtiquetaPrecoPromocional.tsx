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
  size?: 'compact' | 'xs' | 'sm' | 'md' | 'lg' | 'hero';
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
  const isSm = size === 'sm';
  const isXs = size === 'xs';
  const isCompact = size === 'compact';

  return (
    <div className="flex flex-col items-start select-none min-w-0">
      {/* Promotional Badge (e.g., SUPER PREÇO, OFERTA, SÓ HOJE) */}
      {badge && (
        <div 
          className="mb-1 uppercase font-black tracking-wider px-2 py-0.5 rounded shadow-sm text-center flex items-center justify-center border border-black/10 animate-pulse whitespace-nowrap shrink-0"
          style={{
            backgroundColor: themeStyle?.badgeBg || '#FACC15',
            color: themeStyle?.badgeText || '#000000',
            fontSize: isHero ? '13px' : isLg ? '11px' : isMd ? '10px' : isSm ? '9px' : '7.5px',
            whiteSpace: 'nowrap',
          }}
        >
          {badge}
        </div>
      )}

      {/* "De:" regular price strike-through */}
      {originalPrice && (
        <div className={`text-neutral-300 font-bold tracking-tight line-through opacity-85 pl-0.5 ${
          isCompact ? 'text-[7.5px]' : isXs ? 'text-[8.5px]' : isSm ? 'text-[10px]' : 'text-xs sm:text-sm'
        }`}>
          De: R$ {originalPrice.replace('R$', '').trim()}
        </div>
      )}

      {/* Main Supermarket Price Tag Badge */}
      <div 
        className={`shadow-2xl flex items-baseline border transition-transform ${
          isCompact 
            ? 'rounded-lg p-1 px-1.5 border-white/20' 
            : isXs 
            ? 'rounded-lg p-1 px-1.5 border-white/20' 
            : isSm 
            ? 'rounded-xl p-1.5 sm:p-2 border-2 border-white/20' 
            : 'rounded-xl p-2 sm:p-3 border-2 border-white/20'
        }`}
        style={{
          backgroundColor: themeStyle?.priceBg || '#FACC15',
          color: themeStyle?.priceText || '#7F1D1D',
        }}
      >
        {/* "POR R$" label */}
        <div className="flex flex-col justify-start mr-0.5 sm:mr-1 self-start pt-0.5 sm:pt-1">
          <span className={`font-black uppercase tracking-wider opacity-90 leading-none ${
            isCompact ? 'text-[6px]' : isXs ? 'text-[6.5px]' : isSm ? 'text-[8.5px]' : 'text-[10px] sm:text-xs'
          }`}>
            POR
          </span>
          <span className={`font-extrabold leading-tight ${
            isCompact ? 'text-[7.5px]' : isXs ? 'text-[8.5px]' : isSm ? 'text-[10px]' : 'text-xs sm:text-sm'
          }`}>
            R$
          </span>
        </div>

        {/* Integer Number */}
        <div 
          className="font-['Bebas_Neue',_Impact,_sans-serif] tracking-tight leading-none drop-shadow-sm font-black"
          style={{
            fontSize: isHero 
              ? '5.5rem' 
              : isLg 
              ? '4.2rem' 
              : isMd 
              ? '3rem' 
              : isSm 
              ? '2rem' 
              : isXs 
              ? '1.45rem' 
              : '1.25rem',
          }}
        >
          {intPart}
        </div>

        {/* Elevated Cents and Unit */}
        <div className="flex flex-col justify-start pl-0.5 self-start pt-0.5 sm:pt-1 min-w-0">
          <span 
            className="font-['Bebas_Neue',_Impact,_sans-serif] font-bold leading-none"
            style={{
              fontSize: isHero 
                ? '2.4rem' 
                : isLg 
                ? '1.8rem' 
                : isMd 
                ? '1.3rem' 
                : isSm 
                ? '1rem' 
                : isXs 
                ? '0.75rem' 
                : '0.65rem',
            }}
          >
            ,{centsPart}
          </span>
          <span className={`font-black uppercase tracking-tight mt-0.5 opacity-90 bg-black/15 rounded text-center whitespace-nowrap block leading-tight ${
            isCompact 
              ? 'text-[6.5px] px-1 py-0.2' 
              : isXs 
              ? 'text-[7.5px] px-1.5 py-0.2' 
              : isSm 
              ? 'text-[8.5px] sm:text-[9.5px] px-1.5 py-0.5' 
              : 'text-[10px] sm:text-[11px] px-2 py-0.5'
          }`}>
            {unit || 'cada'}
          </span>
        </div>
      </div>
    </div>
  );
};

export const PriceTag = EtiquetaPrecoPromocional;
