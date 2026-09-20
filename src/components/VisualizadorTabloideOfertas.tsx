import React from 'react';
import { Calendar, Phone, MapPin, CreditCard, ShieldCheck, Sparkles } from 'lucide-react';
import { BannerCampaign, ThemeColors } from '../tiposGeradorBanner';
import { EtiquetaPrecoPromocional } from './EtiquetaPrecoPromocional';

interface VisualizadorTabloideOfertasProps {
  campaign: BannerCampaign;
  theme: ThemeColors;
}

export const VisualizadorTabloideOfertas: React.FC<VisualizadorTabloideOfertasProps> = ({ campaign, theme }) => {
  const products = campaign.products;

  return (
    <div className="w-full flex justify-center p-2 sm:p-4">
      {/* Tabloid Container (A4 Ratio-friendly, 1080x1440 or 1080x1920) */}
      <div
        id="tabloid-capture"
        className="w-full max-w-[850px] bg-neutral-900 border-2 border-amber-500/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col justify-between select-none"
      >
        {/* HEADER: Supermarket Master Header */}
        <div 
          className="relative p-4 sm:p-6 text-white text-center flex flex-col items-center justify-center border-b-4 border-amber-400"
          style={{ backgroundColor: theme.primary }}
        >
          {/* Subtle geometric pattern background */}
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />

          <div className="relative z-10 flex flex-wrap items-center justify-between w-full gap-3">
            {/* Store Brand / Logo */}
            <div className="flex items-center gap-3">
              {campaign.showClientLogo !== false && campaign.clientLogoUrl ? (
                <div className="relative flex items-center">
                  <img 
                    src={campaign.clientLogoUrl}
                    alt={campaign.clientName || 'Logo'}
                    className="max-h-14 sm:max-h-16 w-auto object-contain drop-shadow-md"
                    referrerPolicy="no-referrer"
                  />
                </div>
              ) : (
                <div className="bg-white text-black font-black text-xl sm:text-2xl px-4 py-1.5 rounded-lg shadow-lg font-['Montserrat'] tracking-tight">
                  {campaign.clientName || 'SUPERMERCADO'}
                </div>
              )}
              <div className="text-left hidden sm:block">
                <span className="text-[11px] uppercase tracking-wider text-amber-200 font-bold block">
                  Jornal de Ofertas
                </span>
                <span className="text-xs text-white/90 font-medium">
                  {campaign.campaignSubtitle || 'Economia de verdade todos os dias'}
                </span>
              </div>
            </div>

            {/* Campaign Headline */}
            <div className="bg-amber-400 text-neutral-950 px-4 py-1 rounded-full font-black text-xs sm:text-sm uppercase tracking-wider shadow-md">
              ★ {campaign.campaignTitle} ★
            </div>
          </div>

          {/* Validity Banner Bar */}
          <div className="relative z-10 mt-3 w-full bg-black/40 backdrop-blur-sm rounded-lg py-1.5 px-3 flex items-center justify-center gap-2 text-xs sm:text-sm font-bold text-amber-300 border border-white/15">
            <Calendar className="w-4 h-4 text-amber-400" />
            <span>{campaign.validityText}</span>
          </div>
        </div>

        {/* BODY: Product Grid (Encarte de Ofertas) */}
        <div className="p-3 sm:p-5 bg-gradient-to-b from-neutral-950 via-neutral-900 to-neutral-950 flex-1">
          {products.length === 0 ? (
            <div className="text-center py-16 text-neutral-400">
              <Sparkles className="w-8 h-8 text-amber-400 mx-auto mb-2 animate-bounce" />
              <p>Nenhum produto cadastrado para o tabloide.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
              {products.map((item, idx) => {
                const isHero = item.isHero || idx === 0;

                return (
                  <div
                    key={item.id}
                    className={`relative rounded-xl overflow-hidden border transition-all flex flex-col justify-between ${
                      isHero && products.length > 2
                        ? 'col-span-2 bg-gradient-to-r from-neutral-900 via-neutral-850 to-neutral-900 border-amber-400/50 shadow-lg'
                        : 'bg-neutral-900/90 border-neutral-800 hover:border-amber-500/40 shadow'
                    }`}
                  >
                    {/* Badge top */}
                    {item.badge && (
                      <div className="absolute top-2 left-2 z-10">
                        <span 
                          className="text-[9px] sm:text-[10px] uppercase font-black px-2 py-0.5 rounded shadow text-center tracking-wider"
                          style={{
                            backgroundColor: theme.badgeBg || '#FACC15',
                            color: theme.badgeText || '#000000',
                          }}
                        >
                          {item.badge}
                        </span>
                      </div>
                    )}

                    {/* Category pill top right */}
                    <div className="absolute top-2 right-2 z-10">
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-black/60 text-neutral-300">
                        {item.unit}
                      </span>
                    </div>

                    {/* Product Image */}
                    <div className="relative pt-6 pb-2 px-3 flex items-center justify-center min-h-[140px] sm:min-h-[160px]">
                      <div className="absolute bottom-2 w-28 h-4 bg-black/50 rounded-full blur-md" />
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="relative z-10 max-h-28 sm:max-h-36 w-auto object-contain drop-shadow-lg transition-transform hover:scale-105"
                        referrerPolicy="no-referrer"
                      />
                    </div>

                    {/* Product Title & Brand */}
                    <div className="px-3 pt-1 pb-2">
                      <h4 className="text-xs sm:text-sm font-black text-white line-clamp-2 leading-tight min-h-[2.4em]">
                        {item.title}
                      </h4>
                      {item.brand && (
                        <span className="text-[10px] text-neutral-400 font-semibold block mt-0.5">
                          {item.brand}
                        </span>
                      )}
                    </div>

                    {/* Price Section */}
                    <div className="px-3 pb-3 pt-1 bg-black/40 border-t border-neutral-800/80 flex items-center justify-between">
                      <EtiquetaPrecoPromocional
                        price={item.price}
                        originalPrice={item.originalPrice}
                        unit={item.unit}
                        themeStyle={{
                          priceBg: theme.priceBg,
                          priceText: theme.priceText,
                        }}
                        size={isHero ? 'md' : 'sm'}
                      />

                      {/* Small economy tag if original price exists */}
                      {item.discountPercentage && item.discountPercentage > 0 && (
                        <div className="text-right">
                          <span className="text-[10px] font-black text-red-400 block">
                            ECONOMIZE
                          </span>
                          <span className="text-xs font-black text-amber-400">
                            -{item.discountPercentage}%
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* FOOTER: Supermarket Info, Payments, Legal */}
        <div className="p-3 sm:p-4 bg-black border-t-2 border-amber-500/40 text-neutral-300 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-neutral-800">
            {/* Payment methods */}
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-amber-400" />
              <span className="text-[11px] font-semibold text-neutral-300">
                Aceitamos PIX, Todos os Cartões e Vales Alimentação
              </span>
            </div>

            {/* Whatsapp / Phone */}
            {campaign.phoneWhatsapp && (
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-400">
                <Phone className="w-3.5 h-3.5" />
                <span>WhatsApp: {campaign.phoneWhatsapp}</span>
              </div>
            )}
          </div>

          {/* Address & Legal text */}
          <div className="pt-2 flex flex-wrap items-center justify-between gap-2 text-[9px] text-neutral-400">
            <div className="flex items-center gap-1">
              <MapPin className="w-3 h-3 text-neutral-500" />
              <span>{campaign.storeAddress || 'Consulte a loja mais próxima de você.'}</span>
            </div>
            <div>
              <span>{campaign.legalNotice || 'Imagens meramente ilustrativas. Ofertas válidas enquanto durarem os estoques.'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const TabloidPreview = VisualizadorTabloideOfertas;
