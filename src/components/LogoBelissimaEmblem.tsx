import React from 'react';

interface LogoBelissimaProps {
  className?: string;
  width?: number | string;
  height?: number | string;
}

/**
 * Componente do Logotipo Oficial Belíssima Casa di Frutas.
 * Utiliza rigorosamente a arte e tipografia oficial do cliente sem alterações.
 */
export const LogoBelissimaEmblem: React.FC<LogoBelissimaProps> = ({
  className = 'w-auto h-28 sm:h-32 md:h-36',
  width,
  height,
}) => {
  return (
    <div
      id="logo-oficial-belissima"
      className={`relative inline-flex items-center justify-center select-none ${className}`}
      style={{ width, height }}
    >
      <img
        src="/logos/belissima-casa-di-frutas.png"
        alt="Belíssima Casa di Frutas - Logotipo Oficial"
        className="w-full h-full object-contain drop-shadow-[0_10px_25px_rgba(0,0,0,0.65)] select-none pointer-events-none"
        referrerPolicy="no-referrer"
        onError={(e) => {
          // Fallback para o SVG incorporado caso necessário
          const target = e.currentTarget;
          if (target.src.endsWith('.png')) {
            target.src = '/logos/belissima-casa-di-frutas.svg';
          }
        }}
      />
    </div>
  );
};
