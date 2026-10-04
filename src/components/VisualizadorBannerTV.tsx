import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar,
  Volume2,
  Camera,
  Search,
  Upload,
  CheckCircle2,
  RefreshCw,
  ShieldCheck,
  Copy,
  Check,
  SlidersHorizontal,
  Wand2,
  Sparkles,
  ChevronDown,
  MessageCircle
} from 'lucide-react';
import { BannerCampaign, ProductItem, ThemeColors, BannerCustomStyles } from '../tiposGeradorBanner';
import { LogoBelissimaEmblem } from './LogoBelissimaEmblem';
import { handleImageError } from '../utils/imageFallback';
import { buildCommercialProductPrompts, copyTextToClipboard } from '../utils/commercialPromptEngine';
import { compressImageToDataUrl } from '../utils/imageCompressor';

interface VisualizadorBannerTVProps {
  campaign: BannerCampaign;
  theme: ThemeColors;
  currentProductIndex: number;
  onSelectProductIndex: (index: number) => void;
  onReorderProduct?: (fromIndex: number, toIndex: number) => void;
  isTvPlayerMode?: boolean;
  onUpdateProductImage?: (productId: string, newImageUrl: string) => void;
  onUpdateProductItem?: (index: number, updated: Partial<ProductItem>) => void;
}

export const VisualizadorBannerTV: React.FC<VisualizadorBannerTVProps> = ({
  campaign,
  theme,
  currentProductIndex,
  onSelectProductIndex,
  onReorderProduct,
  isTvPlayerMode = false,
  onUpdateProductImage,
  onUpdateProductItem,
}) => {
  const [isSearchingRealImage, setIsSearchingRealImage] = useState(false);
  const [isGeneratingAiImage, setIsGeneratingAiImage] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [draggedBulletIdx, setDraggedBulletIdx] = useState<number | null>(null);
  const [dragOverBulletIdx, setDragOverBulletIdx] = useState<number | null>(null);
  const cardFileInputRef = useRef<HTMLInputElement>(null);
  const [animCycle, setAnimCycle] = useState(0);

  useEffect(() => {
    const handleTriggerReplay = () => {
      setAnimCycle((c) => c + 1);
    };
    window.addEventListener('tv-replay-animation', handleTriggerReplay);
    return () => {
      window.removeEventListener('tv-replay-animation', handleTriggerReplay);
    };
  }, []);

  const product: ProductItem = campaign.products[currentProductIndex] || {
    id: 'empty',
    title: 'Refrigerante Coca-Cola Garrafa 2L',
    category: 'Bebidas',
    brand: 'Coca-Cola',
    unit: '2L',
    price: '8,99',
    originalPrice: '10,99',
    discountPercentage: 19,
    badge: 'OFERTA DO DIA',
    imageUrl: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=1000&auto=format&fit=crop&q=85',
  };

  // Fusão de estilos: Estilos específicos do produto têm prioridade sobre os estilos globais da campanha
  const effectiveStyles: BannerCustomStyles = {
    ...(campaign.customStyles || {}),
    ...(product.customStyles || {}),
    ...(product.badgeBgColor ? { badgeBgColor: product.badgeBgColor } : {}),
    ...(product.badgeTextColor ? { badgeTextColor: product.badgeTextColor } : {}),
    ...(product.secondBadgeBgColor ? { secondBadgeBgColor: product.secondBadgeBgColor } : {}),
    ...(product.secondBadgeTextColor ? { secondBadgeTextColor: product.secondBadgeTextColor } : {}),
  };

  const isVertical = campaign.format === '9:16' || campaign.format === '4:5';
  const isSquare = campaign.format === '1:1';

  // Canonical reference resolution matching exactly the Mini Player's golden proportions
  const targetWidth = campaign.format === '9:16' ? 440 : campaign.format === '1:1' ? 680 : campaign.format === '4:5' ? 540 : 1120;
  const targetHeight = campaign.format === '9:16' ? 782 : campaign.format === '1:1' ? 680 : campaign.format === '4:5' ? 675 : 630;

  const stageContainerRef = useRef<HTMLDivElement>(null);
  const [workspaceScale, setWorkspaceScale] = useState<number>(1);

  // Dynamic GPU Scale Engine para a Prancheta do Workspace:
  // Garante proporção 100% congelada de cinema tanto no Samsung (1920x1080) quanto no Dell (1280x800)
  useEffect(() => {
    if (isTvPlayerMode) return;

    const measureAndScale = () => {
      if (!stageContainerRef.current) return;
      const rect = stageContainerRef.current.getBoundingClientRect();
      const availW = rect.width;
      const availH = rect.height;

      if (availW > 0 && availH > 0) {
        const sW = availW / targetWidth;
        const sH = availH / targetHeight;
        // Permite escala suave para encaixar perfeitamente sem scroll; teto em 1.0 para manter resolução nativa no Samsung 1080p
        const computed = Math.min(sW, sH, 1.0);
        setWorkspaceScale(Math.max(0.15, computed));
      }
    };

    measureAndScale();
    const ro = new ResizeObserver(measureAndScale);
    if (stageContainerRef.current) {
      ro.observe(stageContainerRef.current);
    }
    window.addEventListener('resize', measureAndScale);

    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measureAndScale);
    };
  }, [targetWidth, targetHeight, isTvPlayerMode]);

  // Bloco 1: Nome Comercial do Produto (exceto o selo)
  const getBlock1Props = () => {
    if (campaign.animationStyle === 'none') {
      return {
        initial: { opacity: 1 },
        animate: { opacity: 1 },
        transition: { duration: 0 },
      };
    }
    if (campaign.animationStyle === 'slide') {
      return {
        initial: { x: isVertical ? 0 : -45, y: isVertical ? -25 : 0, opacity: 0 },
        animate: { x: 0, y: 0, opacity: 1 },
        exit: { opacity: 0 },
        transition: { duration: 0.45, delay: 0.14, ease: [0.22, 1, 0.36, 1] as const },
      };
    }
    if (campaign.animationStyle === 'pulse') {
      return {
        initial: { scale: 0.94, opacity: 0, y: -8 },
        animate: { scale: 1, opacity: 1, y: 0 },
        exit: { opacity: 0 },
        transition: { duration: 0.42, delay: 0.14, ease: 'easeOut' as const },
      };
    }
    // Padrão: 'zoom' (Entrada tipográfica suave e cinematográfica de TV)
    return {
      initial: { x: isVertical ? 0 : -30, y: isVertical ? -15 : 0, opacity: 0 },
      animate: { x: 0, y: 0, opacity: 1 },
      exit: { opacity: 0 },
      transition: { duration: 0.45, delay: 0.14, ease: [0.22, 1, 0.36, 1] as const },
    };
  };

  // 1º Selo Promocional (Topo): Carimbo oficial de selo independente do nome comercial
  const getBadge1Props = () => {
    if (campaign.animationStyle === 'none') {
      return {
        initial: { opacity: 1 },
        animate: { opacity: 1 },
        transition: { duration: 0 },
      };
    }
    if (campaign.animationStyle === 'slide') {
      return {
        initial: { y: -20, opacity: 0 },
        animate: { y: 0, opacity: 1 },
        transition: { duration: 0.35, delay: 0.08, ease: 'easeOut' as const },
      };
    }
    if (campaign.animationStyle === 'pulse') {
      return {
        initial: { scale: 0.6, opacity: 0 },
        animate: { scale: [0.6, 1.14, 1], opacity: 1 },
        transition: { duration: 0.38, delay: 0.08, ease: 'easeOut' as const },
      };
    }
    // Padrão: 'zoom' - Carimbo oficial de selo com pop
    return {
      initial: { scale: 0.72, opacity: 0 },
      animate: { scale: 1, opacity: 1 },
      transition: { duration: 0.38, delay: 0.08, ease: [0.34, 1.45, 0.64, 1] as const },
    };
  };

  // Bloco 2: Foto da Embalagem / Packshot Comercial (Card 4:3) - Fluxo liso e contínuo da margem direita ao ponto focal
  const getBlock2Props = () => {
    if (campaign.animationStyle === 'none') {
      return {
        initial: { opacity: 1 },
        animate: { opacity: 1 },
        transition: { duration: 0 },
      };
    }
    const initialX = isVertical ? 0 : 40;
    const initialY = isVertical ? 24 : 0;
    const initialScale = campaign.animationStyle === 'pulse' ? 0.94 : 0.96;

    return {
      initial: { x: initialX, y: initialY, scale: initialScale, opacity: 0 },
      animate: { x: 0, y: 0, scale: 1, opacity: 1 },
      transition: { duration: 0.52, delay: 0, ease: [0.16, 1, 0.3, 1] as const },
    };
  };

  // Bloco 3: Preço Por (R$), Preço De (R$), Unidade e 2º Selo Promocional
  const getBlock3Props = () => {
    if (campaign.animationStyle === 'none') {
      return {
        initial: { opacity: 1 },
        animate: { opacity: 1 },
        transition: { duration: 0 },
      };
    }
    if (campaign.animationStyle === 'slide') {
      return {
        initial: { y: 35, opacity: 0 },
        animate: { y: 0, opacity: 1 },
        exit: { opacity: 0 },
        transition: { duration: 0.45, delay: 0.28, ease: [0.22, 1, 0.36, 1] as const },
      };
    }
    if (campaign.animationStyle === 'pulse') {
      return {
        initial: { scale: 0.8, opacity: 0 },
        animate: { scale: [0.8, 1.1, 0.98, 1], opacity: 1 },
        exit: { opacity: 0 },
        transition: { duration: 0.52, delay: 0.28, ease: 'easeOut' as const },
      };
    }
    // Padrão: 'zoom' (Impacto comercial de etiqueta de supermercado com suave bounce)
    return {
      initial: { scale: 0.84, y: 16, opacity: 0 },
      animate: { scale: 1, y: 0, opacity: 1 },
      exit: { opacity: 0 },
      transition: { duration: 0.45, delay: 0.28, ease: [0.34, 1.3, 0.64, 1] as const },
    };
  };

  const getAnimationProps = getBlock2Props;

  // Price splitting for the supermarket price tag
  const priceClean = (product.price || '8,99').replace('R$', '').trim();
  const priceParts = priceClean.split(/[,.]/);
  const intPrice = priceParts[0] || '8';
  const centsPrice = priceParts[1] ? priceParts[1].padEnd(2, '0').slice(0, 2) : '99';

  const isBelissima = 
    campaign.clientName.toLowerCase().includes('belíssima') || 
    campaign.clientName.toLowerCase().includes('belissima') ||
    (campaign.clientLogoUrl && campaign.clientLogoUrl.includes('belissima'));

  const bannerContent = (
    <div
      id="tv-banner-capture"
      style={{
        width: isTvPlayerMode ? '100%' : `${targetWidth}px`,
        height: isTvPlayerMode ? '100%' : `${targetHeight}px`,
      }}
      className={`relative overflow-hidden ${
        isTvPlayerMode ? 'rounded-none border-none shadow-none shrink-0' : 'rounded-2xl shadow-2xl border border-emerald-500/20'
      } select-none bg-[#073620] flex flex-col justify-between`}
    >
        {/* GPU Isolated Background Layer: Rendered once, zero redraw overhead on frame updates */}
        <div 
          id="tv-banner-bg-layer"
          style={{ contain: 'strict', willChange: 'contents', transform: 'translateZ(0)' }}
          className="absolute inset-0 pointer-events-none overflow-hidden"
        >
          {/* Deep Green Texture Background / Custom Background / Custom Background Image */}
          {effectiveStyles.bannerBgImageUrl ? (
            <div 
              style={{
                backgroundImage: `url(${effectiveStyles.bannerBgImageUrl})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
              className="absolute inset-0"
            />
          ) : (
            <div 
              style={{
                background: effectiveStyles.bannerBgGradient || (effectiveStyles.bannerBgColor 
                  ? `radial-gradient(circle at 60% 50%, ${effectiveStyles.bannerBgColor}ee, ${effectiveStyles.bannerBgColor} 70%, #000000 100%)` 
                  : undefined)
              }}
              className={`absolute inset-0 ${!effectiveStyles.bannerBgGradient && !effectiveStyles.bannerBgColor ? 'bg-gradient-to-br from-[#06331e] via-[#083c24] to-[#042214]' : ''}`} 
            />
          )}

          {/* Subtle Watermark Geometric/Botanical Texture Pattern */}
          <svg className="absolute inset-0 w-full h-full opacity-[0.06]" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="marketPattern" width="80" height="80" patternUnits="userSpaceOnUse">
                <circle cx="40" cy="40" r="32" fill="none" stroke="#ffffff" strokeWidth="1.5" />
                <circle cx="40" cy="40" r="18" fill="none" stroke="#ffffff" strokeWidth="1" />
                <path d="M 40 0 L 40 80 M 0 40 L 80 40" stroke="#ffffff" strokeWidth="1" opacity="0.6" />
                <circle cx="0" cy="0" r="12" fill="none" stroke="#ffffff" strokeWidth="1" />
                <circle cx="80" cy="0" r="12" fill="none" stroke="#ffffff" strokeWidth="1" />
                <circle cx="0" cy="80" r="12" fill="none" stroke="#ffffff" strokeWidth="1" />
                <circle cx="80" cy="80" r="12" fill="none" stroke="#ffffff" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#marketPattern)" />
          </svg>

          {/* Commercial Studio Lighting & Ambient Spotlight */}
          <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-[700px] h-[700px] bg-gradient-to-r from-amber-400/10 via-emerald-400/15 to-transparent rounded-full blur-3xl pointer-events-none" />
          <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-10 -left-10 w-96 h-96 bg-black/40 rounded-full blur-2xl" />
        </div>

        {/* TOP HEADER: Perfectly Proportioned Across All Screen Sizes (1:1 with Mini Player) */}
        {/* TOP HEADER: Perfectly Proportioned Across All Screen Sizes (1:1 with Mini Player) */}
        {/* TOP HEADER: Perfectly Proportioned Across All Screen Sizes */}
        {(isSquare || isVertical) ? (
          <div 
            id="tv-banner-header"
            className={`relative z-10 ${
              isVertical ? 'px-2.5 sm:px-3 pt-2 sm:pt-2.5 pb-1 sm:pb-1.5' : 'px-3.5 sm:px-5 pt-3 sm:pt-3.5 pb-2 sm:pb-2.5'
            } flex flex-col shrink-0 w-full justify-between border-b-2 sm:border-b-4 overflow-hidden`}
            style={{
              borderBottomColor: effectiveStyles.cardBorderColor || '#f59e0b',
              fontFamily: effectiveStyles.campaignTitleFont || "'Montserrat', sans-serif"
            }}
          >
            {/* Ondas Finas e Elegantes no Fundo (Linhas Douradas Sinuosas de Alta Sofisticação) */}
            <svg 
              className="absolute inset-0 w-full h-full pointer-events-none opacity-45 overflow-hidden" 
              preserveAspectRatio="none" 
              viewBox="0 0 1000 240"
            >
              <defs>
                <linearGradient id="feedSquareGoldWave1" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.1" />
                  <stop offset="35%" stopColor="#fde047" stopOpacity="0.8" />
                  <stop offset="70%" stopColor="#d97706" stopOpacity="0.65" />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.15" />
                </linearGradient>
                <linearGradient id="feedSquareGoldWave2" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#fde047" stopOpacity="0.08" />
                  <stop offset="50%" stopColor="#ffffff" stopOpacity="0.7" />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.18" />
                </linearGradient>
                <linearGradient id="feedSquareGoldWave3" x1="0%" y1="100%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.12" />
                  <stop offset="45%" stopColor="#fef08a" stopOpacity="0.75" />
                  <stop offset="85%" stopColor="#b45309" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.05" />
                </linearGradient>
              </defs>

              <path d="M -60,35 Q 220,185 500,65 T 1060,105" fill="none" stroke="url(#feedSquareGoldWave1)" strokeWidth="1.6" />
              <path d="M -60,60 Q 240,210 520,90 T 1060,130" fill="none" stroke="url(#feedSquareGoldWave2)" strokeWidth="1.0" />
              <path d="M -60,105 Q 200,245 560,115 T 1060,170" fill="none" stroke="url(#feedSquareGoldWave1)" strokeWidth="1.4" />
              
              <path d="M -60,165 Q 320,35 680,175 T 1060,85" fill="none" stroke="url(#feedSquareGoldWave3)" strokeWidth="1.2" />
              <path d="M -60,190 Q 340,60 700,200 T 1060,110" fill="none" stroke="url(#feedSquareGoldWave2)" strokeWidth="1.0" />
              <path d="M -60,225 Q 380,95 740,230 T 1060,145" fill="none" stroke="url(#feedSquareGoldWave1)" strokeWidth="1.8" />
            </svg>

            {/* Sutil iluminação ambiente */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute top-1/2 left-10 -translate-y-1/2 w-64 h-64 bg-white/5 rounded-full blur-2xl pointer-events-none" />

            {/* Linha Superior do Cabeçalho: Logo à Esquerda e Título + WhatsApp à Direita */}
            <div className="relative z-10 flex flex-row items-center justify-between w-full gap-2 sm:gap-3 pb-1 sm:pb-1.5">
              {/* Esquerda: Logo Oficial */}
              <div className={`flex items-center justify-start shrink-0 ${isVertical ? 'max-w-[38%]' : 'max-w-[44%] sm:max-w-[46%]'} py-0.5`}>
                {campaign.showClientLogo !== false && (
                  isBelissima ? (
                    <img
                      id="tv-banner-client-logo"
                      crossOrigin="anonymous"
                      src="/logos/belissima-casa-di-frutas.png"
                      alt={campaign.clientName || 'Belíssima Casa di Frutas'}
                      className={`${
                        isVertical ? 'max-h-16 sm:max-h-20' : 'max-h-20 sm:max-h-24 md:max-h-28'
                      } w-auto max-w-full object-contain drop-shadow-[0_8px_24px_rgba(0,0,0,0.85)] filter contrast-105 saturate-[1.08] select-none shrink-0 pointer-events-none`}
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        const target = e.currentTarget;
                        if (target.src.endsWith('.png')) {
                          target.src = '/logos/belissima-casa-di-frutas.svg';
                        }
                      }}
                    />
                  ) : campaign.clientLogoUrl ? (
                    <img
                      id="tv-banner-client-logo"
                      crossOrigin="anonymous"
                      src={campaign.clientLogoUrl}
                      alt={campaign.clientName || 'Logo Oficial'}
                      className={`${
                        isVertical ? 'max-h-16 sm:max-h-20' : 'max-h-20 sm:max-h-24 md:max-h-28'
                      } w-auto max-w-full object-contain drop-shadow-[0_8px_24px_rgba(0,0,0,0.85)] filter contrast-105 saturate-[1.08] select-none shrink-0 pointer-events-none`}
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="bg-amber-400 text-black font-black text-xs sm:text-sm px-2.5 py-1 rounded-xl shadow-lg font-['Montserrat'] tracking-tight">
                      {campaign.clientName || 'SUPERMERCADO'}
                    </div>
                  )
                )}
              </div>

              {/* Direita: Título da Campanha e WhatsApp CTA */}
              <div className={`flex-1 min-w-0 ${isVertical ? 'max-w-[63%]' : 'max-w-[56%]'} flex flex-col items-end text-right justify-center gap-1.5 sm:gap-2`}>
                {/* Título Superior */}
                <div className="w-full flex flex-col items-end text-right">
                  <h1 
                    className={`w-full ${
                      isVertical ? 'text-[15px] sm:text-[17px] md:text-[18px] leading-[1.12]' : 'text-base sm:text-lg md:text-xl lg:text-[22px] leading-[1.15]'
                    } font-black uppercase drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)] tracking-tight block break-words`}
                    style={{
                      fontFamily: effectiveStyles.campaignTitleFont || "'Montserrat', sans-serif",
                      color: effectiveStyles.campaignTitleColor || '#fde047',
                    }}
                  >
                    {campaign.campaignTitle || 'FESTIVAL DE OFERTAS'}
                  </h1>
                </div>

                {/* WhatsApp CTA: Destaque visual aumentado, chamativo e sempre em linha única */}
                <div className="w-full flex items-center justify-end">
                  <div 
                    className={`inline-flex items-center ${
                      isVertical ? 'gap-1.5 px-2.5 py-1' : 'gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.2'
                    } rounded-full bg-emerald-600 hover:bg-emerald-500 border border-emerald-300/60 text-white shadow-lg backdrop-blur-xs transition-colors shrink-0 max-w-full`}
                    title={`Peça no WhatsApp: ${campaign.phoneWhatsapp || '(11) 98765-4321'}`}
                  >
                    <MessageCircle className={`${isVertical ? 'w-3 h-3 sm:w-3.5 sm:h-3.5' : 'w-3 h-3 sm:w-3.5 sm:h-3.5'} text-emerald-200 shrink-0`} />
                    <span className={`${
                      isVertical
                        ? ((campaign.phoneWhatsapp && campaign.phoneWhatsapp.length > 18) ? 'text-[8px] sm:text-[8.5px]' : 'text-[9px] sm:text-[9.5px]')
                        : 'text-[9.5px] sm:text-[10.5px]'
                    } font-black tracking-tight whitespace-nowrap`}>
                      Peça no WhatsApp: {campaign.phoneWhatsapp || '(11) 98765-4321'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Base do Cabeçalho: Validade Centralizada na Largura Total, Sem Caixa, em Linha Única sem Cortar */}
            <div className="relative z-10 w-full flex items-center justify-center gap-1 sm:gap-1.5 pt-1 border-t border-white/10 text-center px-1">
              <Calendar className={`${isVertical ? 'w-2.5 h-2.5' : 'w-3 h-3'} text-amber-400 shrink-0 drop-shadow`} />
              <span 
                className={`${
                  isVertical
                    ? ((campaign.validityText && campaign.validityText.length > 55) ? 'text-[6.8px] sm:text-[7.2px]' : 'text-[7.5px] sm:text-[8px]')
                    : 'text-[8.5px] sm:text-[9.5px] md:text-[10px]'
                } font-bold text-amber-200 ${isVertical ? 'tracking-normal' : 'tracking-wide'} uppercase whitespace-nowrap drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]`}
                style={{ fontFamily: "'Montserrat', sans-serif" }}
                title={campaign.validityText || 'Ofertas válidas até domingo ou enquanto durarem os estoques'}
              >
                {campaign.validityText || 'Ofertas válidas até domingo ou enquanto durarem os estoques'}
              </span>
            </div>
          </div>
        ) : (
          /* Cabeçalho Normal para TV 16:9 Horizontal */
          <div 
            id="tv-banner-header"
            className="relative z-10 px-3 sm:px-5 md:px-7 py-2 sm:py-2.5 flex flex-col shrink-0 w-full gap-1 sm:gap-1.5"
          >
            {/* Linha Superior do Cabeçalho: Logo (Esquerda) e Título da Campanha (Direita) */}
            <div className="flex items-center justify-between w-full gap-2.5 sm:gap-4">
              {/* Left: Client Logo without any artificial container */}
              <div className="flex items-center shrink-0 w-auto max-w-[195px] sm:max-w-[230px] md:max-w-[260px] lg:max-w-[285px] h-14 sm:h-18 md:h-22 lg:h-24">
                {campaign.showClientLogo !== false && (
                  isBelissima ? (
                    <img
                      id="tv-banner-client-logo"
                      crossOrigin="anonymous"
                      src="/logos/belissima-casa-di-frutas.png"
                      alt={campaign.clientName || 'Belíssima Casa di Frutas'}
                      className="w-auto h-full max-h-full object-contain drop-shadow-[0_8px_24px_rgba(0,0,0,0.85)] filter contrast-105 saturate-[1.08] select-none shrink-0 pointer-events-none"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        const target = e.currentTarget;
                        if (target.src.endsWith('.png')) {
                          target.src = '/logos/belissima-casa-di-frutas.svg';
                        }
                      }}
                    />
                  ) : campaign.clientLogoUrl ? (
                    <img
                      id="tv-banner-client-logo"
                      crossOrigin="anonymous"
                      src={campaign.clientLogoUrl}
                      alt={campaign.clientName || 'Logo Oficial'}
                      className="w-auto h-full max-h-full object-contain drop-shadow-[0_8px_24px_rgba(0,0,0,0.85)] filter contrast-105 saturate-[1.08] select-none shrink-0 pointer-events-none"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="flex items-center gap-2 px-2 py-1 rounded-lg bg-black/40 border border-white/20 backdrop-blur-sm">
                      <div className="w-1 h-5 sm:h-6 rounded-full bg-amber-400" />
                      <div className="flex flex-col text-left">
                        <span className="font-serif font-black text-white text-xs sm:text-sm lg:text-base leading-none">
                          {campaign.clientName || 'Belíssima Casa di Frutas'}
                        </span>
                        <span className="text-[7px] sm:text-[8px] font-bold text-amber-300 uppercase tracking-wider mt-0.5">
                          {campaign.segment || 'Hortifrúti Selecionado • Desde 2004'}
                        </span>
                      </div>
                    </div>
                  )
                )}
              </div>

              {/* Campaign Title */}
              <div className="flex-1 flex flex-col items-center text-center px-2 sm:px-4 justify-center min-w-0">
                <h1 
                  style={{
                    color: effectiveStyles.campaignTitleColor || '#fbbf24',
                    fontFamily: effectiveStyles.campaignTitleFont || "'Montserrat', sans-serif",
                  }}
                  className={`${
                    campaign.campaignTitle && campaign.campaignTitle.length > 35
                      ? 'text-xs sm:text-sm md:text-base lg:text-xl'
                      : campaign.campaignTitle && campaign.campaignTitle.length > 25
                      ? 'text-sm sm:text-base md:text-xl lg:text-2xl xl:text-3xl'
                      : 'text-base sm:text-xl md:text-2xl lg:text-3xl xl:text-[34px]'
                  } font-black uppercase drop-shadow-[0_4px_16px_rgba(0,0,0,0.95)] w-full leading-tight tracking-tight break-words`}
                >
                  {campaign.campaignTitle || 'FESTIVAL DE OFERTAS PLAY COMUNIQUE'}
                </h1>

                <p className="text-[9px] sm:text-[11px] md:text-xs lg:text-sm mt-0.5 text-neutral-100 flex items-center justify-center gap-1.5 font-semibold drop-shadow max-w-full leading-none">
                  <Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-400 shrink-0" />
                  <span className="truncate">{campaign.validityText || 'Ofertas válidas de 10 a 22/09/2026 ou enquanto durarem os estoques'}</span>
                </p>
              </div>

              {/* Right Symmetrical Spacer so Campaign Title is centered across the screen in Horizontal */}
              <div className="shrink-0 pointer-events-none hidden md:block w-auto max-w-[195px] sm:max-w-[230px] md:max-w-[260px] lg:max-w-[285px] h-14 sm:h-18 md:h-22 lg:h-24" />
            </div>
          </div>
        )}

        {/* CENTER CONTENT: Perfectly Proportioned - Em Vertical, imagem no topo e dados/preço abaixo (conforme solicitado) */}
        <div id="tv-banner-center-content" className={`relative z-10 flex-1 min-h-0 ${isSquare ? 'px-3 sm:px-5 py-2' : 'px-3 sm:px-6 md:px-10 py-1.5 sm:py-2 md:py-2.5'} gap-2 sm:gap-4 flex ${isVertical ? 'flex-col-reverse justify-between items-center text-center' : 'flex-row items-center justify-between'} overflow-visible`}>
          
          {/* Left Column: Product Title, Packaging, Tag, Regular Price & Supermarket Price Tag */}
          <div id="tv-anim-left-column" className={`flex flex-col ${
            isVertical 
              ? 'items-center text-center max-w-full w-full gap-2 sm:gap-2.5 py-1' 
              : isSquare
              ? 'justify-between items-start text-left w-[42%] max-w-[42%] h-full max-h-full py-1'
              : 'justify-between items-start text-left w-[48%] max-w-[48%] h-full max-h-full py-0.5'
          }`}>
            {/* Top Block (Bloco 1): Nome Comercial do Produto (exceto o selo) */}
            <motion.div 
              key={`title-block-${product.id}-${animCycle}`}
              id="tv-anim-title-block" 
              {...getBlock1Props()}
              className={`flex flex-col ${isVertical ? 'items-center text-center mt-0.5 sm:mt-1' : 'items-start text-left mt-3 sm:mt-5 md:mt-6'} w-full shrink-0 bg-transparent`}
            >
              {/* Nome Comercial do Produto com o 1º Selo Promocional ocupando o início da primeira linha à frente do texto */}
              <h2 
                style={{
                  color: effectiveStyles.productTitleColor || '#ffffff',
                  fontFamily: effectiveStyles.productTitleFont || "'Montserrat', sans-serif",
                }}
                className={`${
                  isVertical
                    ? 'text-[15px] sm:text-[18px] md:text-[21px] leading-snug text-center'
                    : isSquare
                    ? (product.title || '').length > 40
                      ? 'text-[17px] sm:text-[20px] md:text-[23px] leading-tight'
                      : (product.title || '').length > 25
                        ? 'text-[19px] sm:text-[22px] md:text-[26px] leading-tight'
                        : 'text-[22px] sm:text-[26px] md:text-[30px] leading-tight'
                    : (product.title || '').length > 40
                      ? 'text-[15px] sm:text-[18px] md:text-[22px] lg:text-[26px] xl:text-[28px] leading-[1.14]'
                      : (product.title || '').length > 25
                        ? 'text-[16px] sm:text-[19px] md:text-[23px] lg:text-[27px] xl:text-[31px] leading-[1.15]'
                        : 'text-[16px] sm:text-[20px] md:text-[24px] lg:text-[28px] xl:text-[34px] leading-[1.16]'
                } font-black tracking-tight break-words bg-transparent line-clamp-3`}
              >
                {product.badge && (
                  <motion.span 
                    key={`badge1-${product.id}-${animCycle}`}
                    id="tv-badge-pill-1"
                    {...getBadge1Props()}
                    style={{ 
                      backgroundColor: effectiveStyles.badgeBgColor || theme?.badgeBg || '#1a472a',
                      color: effectiveStyles.badgeTextColor || theme?.badgeText || '#ffffff',
                      borderColor: effectiveStyles.badgeBgColor 
                        ? `${effectiveStyles.badgeBgColor}aa` 
                        : (theme?.badgeBg ? `${theme.badgeBg}88` : '#3b7a50'),
                      whiteSpace: 'nowrap',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      boxSizing: 'border-box',
                      lineHeight: 1.15,
                      fontFamily: effectiveStyles.productTitleFont || "'Montserrat', sans-serif",
                    }}
                    className={`tv-badge-pill inline-flex items-center justify-center ${
                      product.badge.length > 35
                        ? 'px-2 py-0.5 sm:px-2.5 sm:py-1 text-[9px] sm:text-[10px] md:text-xs'
                        : product.badge.length > 25
                        ? 'px-2.5 py-0.5 sm:px-3 sm:py-1 text-[10px] sm:text-[11px] md:text-xs'
                        : 'px-2.5 py-1 sm:px-3 sm:py-1 text-[10px] sm:text-xs md:text-sm'
                    } mr-2.5 rounded-lg border font-black uppercase tracking-wider align-middle shadow-sm whitespace-nowrap shrink-0 select-none`}
                  >
                    <span className="block leading-tight whitespace-nowrap">{product.badge}</span>
                  </motion.span>
                )}
                <span id="tv-anim-title-text" className="align-middle bg-transparent">{product.title}</span>
              </h2>
            </motion.div>

            {/* Bottom Block (Bloco 3): Regular Price & Supermarket Price Box */}
            <motion.div 
              key={`price-block-${product.id}-${animCycle}`}
              id="tv-anim-price-block" 
              {...getBlock3Props()}
              className={`flex flex-col ${isVertical ? 'items-center mt-1 sm:mt-1.5' : 'items-start mb-[calc(4%+2px)] sm:mb-[calc(4%+6px)] mt-auto'} w-fit shrink-0 bg-transparent`}
            >
              {/* "De: R$ 10,99" regular price */}
              {product.originalPrice && (
                <div 
                  id="tv-anim-original-price"
                  style={{ 
                    color: effectiveStyles.priceOriginalColor || 'rgba(255, 255, 255, 0.9)',
                    fontFamily: effectiveStyles.productTitleFont || "'Montserrat', sans-serif",
                  }}
                  className="text-xs sm:text-sm md:text-base font-bold mb-1 tracking-tight bg-transparent whitespace-nowrap"
                >
                  De: R${product.originalPrice.replace('R$', '').trim()}
                </div>
              )}

              {/* Main Supermarket Orange/Yellow Price Box */}
              <div id="tv-anim-price-box-wrapper" className="inline-flex items-center w-auto min-w-max shrink-0">
                <div 
                  id="tv-anim-price-box"
                  style={{ 
                    backgroundColor: effectiveStyles.priceBoxBgColor || '#ea580c', 
                    backgroundImage: effectiveStyles.priceBoxBgColor 
                      ? `linear-gradient(180deg, ${effectiveStyles.priceBoxBgColor}dd 0%, ${effectiveStyles.priceBoxBgColor} 50%, #00000033 100%)`
                      : 'linear-gradient(180deg, #f97316 0%, #ea580c 50%, #c2410c 100%)',
                    color: effectiveStyles.priceBoxTextColor || '#ffffff',
                    fontFamily: effectiveStyles.productTitleFont || "'Montserrat', sans-serif",
                  }}
                  className="relative overflow-hidden rounded-xl md:rounded-2xl p-2.5 sm:p-3 md:p-3.5 lg:p-4 shadow-[0_16px_36px_rgba(0,0,0,0.65)] border-2 border-white/30 gap-2 sm:gap-3 flex flex-nowrap items-center w-auto min-w-max shrink-0 transition-transform hover:scale-[1.02] origin-bottom-left"
                >
                  {/* Glossy top highlight overlay for TV commercial acrylic look */}
                  <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/25 to-transparent pointer-events-none rounded-t-xl" />
                  
                  {/* Left: "POR R$" */}
                  <div 
                    style={{ fontFamily: effectiveStyles.productTitleFont || "'Montserrat', sans-serif" }}
                    className="flex flex-col justify-start self-start pt-0.5 leading-none shrink-0 select-none"
                  >
                    <span className="text-[9px] sm:text-[10px] md:text-xs font-black uppercase tracking-wider opacity-95 whitespace-nowrap">
                      POR
                    </span>
                    <span className="text-xs sm:text-sm md:text-base font-black mt-0.5 whitespace-nowrap">
                      R$
                    </span>
                  </div>

                  {/* Big Integer Number */}
                  <div 
                    style={{ fontFamily: effectiveStyles.productTitleFont || "'Montserrat', sans-serif" }}
                    className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-[76px] font-black leading-none tracking-tighter drop-shadow-sm shrink-0 whitespace-nowrap select-none"
                  >
                    {intPrice}
                  </div>

                  {/* Right: ",99" and "2L" / unit */}
                  <div 
                    id="tv-anim-price-unit-col"
                    style={{ fontFamily: effectiveStyles.productTitleFont || "'Montserrat', sans-serif" }}
                    className="flex flex-col justify-start self-start pt-0.5 leading-none pl-0.5 min-w-max w-auto shrink-0 select-none whitespace-nowrap"
                  >
                    <span className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black leading-none whitespace-nowrap">
                      ,{centsPrice}
                    </span>
                    <span className="text-[10px] sm:text-xs md:text-sm font-black uppercase tracking-wider opacity-95 mt-1 whitespace-nowrap">
                      {product.unit || '2L'}
                    </span>
                  </div>
                </div>
              </div>

              {/* 2º Selo Promocional: Logo abaixo do card do preço, alinhado com a base da imagem do produto */}
              {product.secondBadgeEnabled && product.secondBadge && (
                <div id="tv-anim-second-badge" className="w-auto min-w-full flex items-center justify-center mt-1.5 sm:mt-2 shrink-0">
                  <div 
                    id="tv-badge-pill-2"
                    style={{ 
                      backgroundColor: effectiveStyles.secondBadgeBgColor || effectiveStyles.badgeBgColor || theme?.badgeBg || '#1a472a',
                      color: effectiveStyles.secondBadgeTextColor || effectiveStyles.badgeTextColor || theme?.badgeText || '#ffffff',
                      borderColor: effectiveStyles.secondBadgeBgColor 
                        ? `${effectiveStyles.secondBadgeBgColor}aa` 
                        : (effectiveStyles.badgeBgColor ? `${effectiveStyles.badgeBgColor}aa` : (theme?.badgeBg ? `${theme.badgeBg}aa` : '#3b7a50')),
                      boxSizing: 'border-box',
                      fontFamily: effectiveStyles.productTitleFont || "'Montserrat', sans-serif",
                    }}
                    className={`tv-badge-pill w-auto min-w-full py-1 sm:py-1.5 ${
                      product.secondBadge.length > 40
                        ? 'px-3 sm:px-4 text-[9px] sm:text-[10px] md:text-xs lg:text-[12px]'
                        : product.secondBadge.length > 25
                        ? 'px-3 sm:px-4 text-[10px] sm:text-[11px] md:text-xs lg:text-[13px]'
                        : 'px-3 sm:px-4 text-[10px] sm:text-xs md:text-sm lg:text-[14px]'
                    } rounded-lg sm:rounded-xl border border-white/20 shadow-md flex items-center justify-center text-center select-none`}
                  >
                    <span 
                      style={{ lineHeight: 1.2 }}
                      className="font-black uppercase tracking-wider whitespace-nowrap block"
                    >
                      {product.secondBadge}
                    </span>
                  </div>
                </div>
              )}
            </motion.div>
          </div>

          {/* Right Column (Bloco 2): Framed Commercial Mini Banner Showcase Card - Dimensões e Proporção 4:3 Padronizadas */}
          <div id="tv-anim-right-column" className={`relative flex-1 min-w-0 flex items-center justify-center ${isVertical ? 'w-full py-1' : 'h-full max-h-full'}`}>
            <motion.div
              key={`card-${product.id}-${animCycle}`}
              id="tv-anim-card-wrapper"
              {...getBlock2Props()}
              className={`relative w-full h-full flex items-center justify-center ${isSquare ? 'p-0.5 sm:p-1' : 'p-1 sm:p-2'} overflow-visible`}
            >
                {/* Standardized Mini Banner Container - Proporção 4:3 Idêntica e Padronizada para Todos os Produtos */}
                {/* Standardized Mini Banner Container - Suporte Duplo: Modo Ambientado Full-Bleed (Print 1) ou Packshot Tradicional (Print 2) */}
                {(() => {
                  const isAmbient = product.imageDisplayMode !== 'contain';

                  const handleGenerateAiCommercialImage = async () => {
                    setIsGeneratingAiImage(true);
                    setToastMessage('Gerando fotografia comercial ambientada com IA...');
                    try {
                      const res = await fetch('/api/gemini/generate-commercial-image', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          title: product.title,
                          brand: product.brand,
                          category: product.category,
                          unit: product.unit,
                          businessSegment: campaign.segment,
                          aspectRatio: isVertical ? '9:16' : '4:3',
                        }),
                      });
                      const data = await res.json();
                      if (data && data.success && data.imageUrl) {
                        if (onUpdateProductImage) {
                          onUpdateProductImage(product.id, data.imageUrl);
                        }
                        if (onUpdateProductItem) {
                          onUpdateProductItem(currentProductIndex, {
                            imageUrl: data.imageUrl,
                            imageDisplayMode: 'ambient',
                            aiPromptUsed: data.promptUsed,
                          });
                        }
                        setToastMessage('✨ Imagem comercial ambientada gerada com sucesso!');
                        setTimeout(() => setToastMessage(null), 4000);
                      } else {
                        throw new Error(data?.error || 'Não foi possível gerar a imagem.');
                      }
                    } catch (err: any) {
                      setToastMessage(`⚠️ ${err?.message || 'Erro ao gerar imagem'}`);
                      setTimeout(() => setToastMessage(null), 4000);
                    } finally {
                      setIsGeneratingAiImage(false);
                    }
                  };

                  const handleCopyGeminiPrompt = async () => {
                    try {
                      // Geração instantânea e confiável do prompt publicitário no cliente (sem depender de servidor)
                      const prompts = buildCommercialProductPrompts({
                        title: product.title,
                        brand: product.brand,
                        category: product.category,
                        unit: product.unit,
                        businessSegment: campaign.segment,
                      });

                      const promptText = prompts.geminiWebPrompt;
                      const copied = await copyTextToClipboard(promptText);

                      if (copied) {
                        setIsCopied(true);
                        setToastMessage('📋 Prompt copiado! Cole no seu Gemini Pro (web) para criar a arte.');
                        setTimeout(() => {
                          setIsCopied(false);
                          setToastMessage(null);
                        }, 4000);
                      } else {
                        setToastMessage('⚠️ Erro ao copiar prompt.');
                        setTimeout(() => setToastMessage(null), 3000);
                      }
                    } catch (err) {
                      console.error('Erro ao gerar/copiar prompt:', err);
                      setToastMessage('⚠️ Erro ao copiar prompt.');
                      setTimeout(() => setToastMessage(null), 3000);
                    }
                  };

                  const handleCardPaste = (e: React.ClipboardEvent) => {
                    const items = e.clipboardData?.items;
                    if (!items) return;
                    for (let i = 0; i < items.length; i++) {
                      if (items[i].type.indexOf('image') !== -1) {
                        const blob = items[i].getAsFile();
                        if (blob) {
                          compressImageToDataUrl(blob, 800, 800, 0.76).then((compressed) => {
                            if (compressed && onUpdateProductImage) {
                              onUpdateProductImage(product.id, compressed);
                              if (onUpdateProductItem) {
                                onUpdateProductItem(currentProductIndex, {
                                  imageUrl: compressed,
                                  imageDisplayMode: 'ambient',
                                });
                              }
                              setToastMessage('✅ Imagem colada com sucesso da área de transferência!');
                              setTimeout(() => setToastMessage(null), 3500);
                            }
                          });
                          return;
                        }
                      }
                    }
                    const text = e.clipboardData?.getData('text');
                    if (text && (text.startsWith('http://') || text.startsWith('https://') || text.startsWith('data:image/'))) {
                      if (onUpdateProductImage) {
                        onUpdateProductImage(product.id, text.trim());
                        if (onUpdateProductItem) {
                          onUpdateProductItem(currentProductIndex, {
                            imageUrl: text.trim(),
                            imageDisplayMode: 'ambient',
                          });
                        }
                        setToastMessage('✅ Link da imagem colado com sucesso!');
                        setTimeout(() => setToastMessage(null), 3500);
                      }
                    }
                  };

                  const handleTriggerCardUpload = (e: React.MouseEvent) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = 'image/*';
                    input.onchange = (ev: Event) => {
                      const target = ev.target as HTMLInputElement;
                      const file = target.files?.[0];
                      if (file) {
                        compressImageToDataUrl(file, 800, 800, 0.76).then((compressed) => {
                          if (compressed && onUpdateProductImage) {
                            onUpdateProductImage(product.id, compressed);
                            if (onUpdateProductItem) {
                              onUpdateProductItem(currentProductIndex, {
                                imageUrl: compressed,
                                imageDisplayMode: 'ambient',
                              });
                            }
                            setToastMessage('✅ Foto carregada com sucesso!');
                            setTimeout(() => setToastMessage(null), 3500);
                          }
                        });
                      }
                    };
                    input.click();
                  };

                  return (
                    <div
                      id="tv-anim-product-card"
                      data-card-id={`mini-banner-card-${product.id}`}
                      onPaste={handleCardPaste}
                      tabIndex={0}
                      className={`group relative ${
                        isVertical
                          ? 'w-full max-w-[340px] sm:max-w-[420px] aspect-[4/3] my-auto'
                          : isSquare
                          ? 'w-full h-full max-h-full'
                          : 'h-[92%] max-h-[92%] aspect-[4/3] w-auto max-w-full shrink-0 my-auto'
                      } ${
                        isAmbient
                          ? 'bg-neutral-950 border-[4px] sm:border-[5px] shadow-[0_22px_55px_rgba(0,0,0,0.85)]'
                          : 'bg-gradient-to-b from-[#f8fafc] via-[#ffffff] to-[#eef2f6] border-[4px] sm:border-[5px] shadow-[0_22px_55px_rgba(0,0,0,0.85)]'
                      } rounded-xl sm:rounded-2xl md:rounded-3xl p-1.5 sm:p-2 flex flex-col items-center justify-between overflow-visible select-none outline-none focus:ring-2 focus:ring-amber-400`}
                      style={{
                        borderColor: effectiveStyles.cardBorderColor || '#ffffff',
                      }}
                    >
                      {/* Toast Notification */}
                      <AnimatePresence>
                        {toastMessage && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="absolute top-3 inset-x-3 z-50 bg-black/90 backdrop-blur-md text-amber-300 border border-amber-500/40 text-[10px] sm:text-xs py-1.5 px-3 rounded-xl shadow-2xl text-center font-bold flex items-center justify-center gap-1.5 pointer-events-none"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            <span>{toastMessage}</span>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* MODE 1: AMBIENT (Fotografia Comercial Ambientada - Ocupa 100% do espaço sem deixar margens no superior e inferior) */}
                      {isAmbient ? (
                        <div className="absolute inset-1 rounded-[10px] sm:rounded-[14px] md:rounded-[18px] overflow-hidden pointer-events-none">
                          <img
                            id="tv-anim-product-img"
                            crossOrigin="anonymous"
                            src={product.imageUrl}
                            alt={product.title}
                            onError={(e) => handleImageError(e, product.title, product.category)}
                            className="w-full h-full object-cover object-center transform group-hover:scale-105 transition-transform duration-700 pointer-events-none"
                            referrerPolicy="no-referrer"
                            loading="eager"
                          />

                          {/* Ambient Stage Glow & Soft Vignette */}
                          <div className="absolute inset-0 shadow-[inset_0_0_30px_rgba(0,0,0,0.3)] pointer-events-none" />
                        </div>
                      ) : (
                        /* MODE 2: CLASSIC WHITE STUDIO CUTOUT PACKSHOT */
                        <div className="absolute inset-1 rounded-[10px] sm:rounded-[14px] md:rounded-[18px] overflow-hidden flex items-center justify-center p-2 sm:p-3 md:p-4 pointer-events-none">
                          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white via-white/80 to-slate-100/60 pointer-events-none" />

                          <div className="absolute bottom-2 sm:bottom-3 w-3/5 h-3 sm:h-5 bg-black/25 rounded-full blur-md pointer-events-none" />
                          <img
                            id="tv-anim-product-img"
                            crossOrigin="anonymous"
                            src={product.imageUrl}
                            alt={product.title}
                            onError={(e) => handleImageError(e, product.title, product.category)}
                            className="relative z-10 max-h-full max-w-full object-contain object-center drop-shadow-[0_12px_20px_rgba(0,0,0,0.35)] transform group-hover:scale-105 transition-transform duration-500 pointer-events-none"
                            referrerPolicy="no-referrer"
                            loading="eager"
                          />
                        </div>
                      )}

                      {/* Edit Controls Toolbar Overlay (Apenas no Modo Painel, Oculto no TV Player Fullscreen) */}
                      {!isTvPlayerMode && (
                        <div id="tv-card-toolbar" className="absolute inset-x-0 bottom-0 p-2 z-20 bg-black/90 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-wrap items-center justify-center gap-1.5 rounded-b-xl sm:rounded-b-2xl md:rounded-b-3xl">
                          {/* 1. Botão Mestre: Gerar Cena Ambientada com IA */}
                          <button
                            type="button"
                            disabled={isGeneratingAiImage}
                            onClick={handleGenerateAiCommercialImage}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-black font-extrabold text-[11px] rounded-lg shadow-lg transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                            title="Gerar banner comercial ambientado com IA (Gemini / Imagen)"
                          >
                            {isGeneratingAiImage ? (
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Camera className="w-3.5 h-3.5" />
                            )}
                            <span>{isGeneratingAiImage ? 'Criando Foto...' : 'Foto Comercial IA'}</span>
                          </button>

                          {/* 2. Botão: Copiar Prompt Mestre para o Gemini Web */}
                          <button
                            type="button"
                            onClick={handleCopyGeminiPrompt}
                            className="flex items-center gap-1 px-2 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-amber-300 font-bold text-[10px] rounded-lg border border-neutral-700 transition-colors cursor-pointer"
                            title="Copiar prompt profissional pronto para colar no seu Gemini Pro (Web)"
                          >
                            {isCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                            <span>{isCopied ? 'Copiado!' : 'Prompt Gemini'}</span>
                          </button>

                          {/* 3. Alternar Modo: Ambientado vs Recorte */}
                          <button
                            type="button"
                            onClick={() => {
                              const nextMode = isAmbient ? 'contain' : 'ambient';
                              if (onUpdateProductItem) {
                                onUpdateProductItem(currentProductIndex, { imageDisplayMode: nextMode });
                              } else {
                                product.imageDisplayMode = nextMode;
                              }
                            }}
                            className="flex items-center gap-1 px-2 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-bold text-[10px] rounded-lg border border-neutral-700 transition-colors cursor-pointer"
                            title="Alternar entre modo Ambientado (Cinema/TV) ou Packshot Isolado (Recorte)"
                          >
                            <SlidersHorizontal className="w-3 h-3 text-neutral-400" />
                            <span>{isAmbient ? 'Ambientado' : 'Recorte'}</span>
                          </button>

                          {/* 4. Enviar Arquivo Local */}
                          <button
                            type="button"
                            onClick={handleTriggerCardUpload}
                            className="flex items-center gap-1 px-2 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-[10px] rounded-lg border border-neutral-700 transition-colors cursor-pointer"
                            title="Carregar foto ou pressione Ctrl+V no card para colar"
                          >
                            <Upload className="w-3 h-3 text-amber-400" />
                            <span>Upload / Ctrl+V</span>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </motion.div>
          </div>
        </div>

        {/* BOTTOM FOOTER: Slim Broadcast Legal Bar - Sem cortes */}
        <div 
          id="tv-banner-footer" 
          className={`relative z-10 px-3 sm:px-6 py-1 sm:py-1.5 bg-[#050505] text-neutral-300 flex ${
            (isVertical || isSquare) 
              ? 'flex-col items-center justify-center text-center gap-0.5' 
              : 'items-center justify-between text-left'
          } border-t border-neutral-800/80 shrink-0 w-full`}
        >
          <span 
            style={{ color: effectiveStyles.footerLegalColor || undefined }}
            className={`font-medium ${
              (isVertical || isSquare) 
                ? 'text-[8.5px] sm:text-[9.5px] leading-tight text-neutral-300 text-center' 
                : 'truncate max-w-[75%] text-[9px] sm:text-[10px] md:text-[11px]'
            }`}
          >
            {campaign.legalNotice || 'Imagens meramente ilustrativas; Proibida a venda de bebidas alcoólicas a menores de 18 anos!'}
          </span>
          <span 
            style={{ color: effectiveStyles.footerBrandColor || '#fbbf24' }}
            className={`font-bold shrink-0 ${
              (isVertical || isSquare) 
                ? 'text-[8px] sm:text-[9px] text-amber-400/90 tracking-wider uppercase text-center' 
                : 'text-[9px] sm:text-[10px] md:text-[11px]'
            }`}
          >
            {campaign.footerBrandText !== undefined && campaign.footerBrandText !== '' ? campaign.footerBrandText : 'Desenvolvido por: playcomunique.com.br'}
          </span>
        </div>
      </div>
  );

  // Standalone Direct TV Player View: Fullscreen 100%
  if (isTvPlayerMode) {
    return (
      <div className="relative w-full h-full p-0 m-0 overflow-hidden flex items-center justify-center bg-black">
        {bannerContent}
      </div>
    );
  }

  // Workspace Editor: Prancheta Inteligente com Auto-Scale GPU (100% estável no Samsung e no Dell)
  return (
    <div className="relative w-full h-full flex flex-col items-center justify-between p-0 sm:p-1 overflow-hidden">
      {/* Responsive Scaled Artboard Stage */}
      <div 
        ref={stageContainerRef}
        className="w-full flex-1 min-h-0 flex items-center justify-center overflow-hidden"
      >
        <div
          style={{
            width: `${targetWidth * workspaceScale}px`,
            height: `${targetHeight * workspaceScale}px`,
            position: 'relative',
            flexShrink: 0,
            overflow: 'visible',
            transition: 'width 0.1s ease-out, height 0.1s ease-out',
          }}
        >
          <div
            style={{
              width: `${targetWidth}px`,
              height: `${targetHeight}px`,
              transform: `scale(${workspaceScale})`,
              transformOrigin: 'top left',
              position: 'absolute',
              top: 0,
              left: 0,
              flexShrink: 0,
            }}
          >
            {bannerContent}
          </div>
        </div>
      </div>

      {/* Navigation Thumbnails, Arrows & Test Animation Button */}
      <div 
        style={{ width: '100%', maxWidth: `${Math.max(340, Math.min(targetWidth, targetWidth * workspaceScale))}px` }}
        className="mt-1 sm:mt-1.5 flex items-center justify-between px-1 shrink-0 gap-2"
      >
        {/* Left: Prev Button + Replay Button */}
        <div className="flex items-center gap-1.5 shrink-0">
          {campaign.products.length > 1 && (
            <button
              id="btn-prev-product"
              onClick={() => onSelectProductIndex((currentProductIndex - 1 + campaign.products.length) % campaign.products.length)}
              className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white flex items-center gap-1 text-xs font-bold transition-colors shrink-0"
              title="Produto anterior"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Anterior</span>
            </button>
          )}
          <button
            id="btn-replay-anim"
            type="button"
            onClick={() => setAnimCycle((c) => c + 1)}
            className="px-2.5 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 flex items-center gap-1.5 text-xs font-bold transition-all active:scale-95 shrink-0 cursor-pointer shadow-sm"
            title="Testar animação profissional dos 3 blocos (1: Nome Comercial, 2: Foto Packshot, 3: Preço)"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Testar Animação</span>
          </button>
        </div>

        {/* Product Bullets com Drop Down de Posição da Fila */}
        {campaign.products.length > 1 && (
          <div className="flex-1 min-w-0 flex items-center gap-1.5 overflow-x-auto py-0.5 px-1 select-none">
            {campaign.products.map((p, idx) => {
              const isSelected = idx === currentProductIndex;

              return (
                <div
                  key={p.id}
                  draggable={Boolean(onReorderProduct)}
                  onDragStart={(e) => {
                    setDraggedBulletIdx(idx);
                    e.dataTransfer.effectAllowed = 'move';
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'move';
                    if (dragOverBulletIdx !== idx) setDragOverBulletIdx(idx);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (draggedBulletIdx !== null && draggedBulletIdx !== idx && onReorderProduct) {
                      onReorderProduct(draggedBulletIdx, idx);
                    }
                    setDraggedBulletIdx(null);
                    setDragOverBulletIdx(null);
                  }}
                  onDragEnd={() => {
                    setDraggedBulletIdx(null);
                    setDragOverBulletIdx(null);
                  }}
                  className={`group relative rounded-lg text-xs font-bold flex items-center transition-all shrink-0 cursor-pointer shadow-sm border ${
                    draggedBulletIdx === idx ? 'opacity-40 scale-95 border-dashed border-amber-400' : ''
                  } ${
                    dragOverBulletIdx === idx && draggedBulletIdx !== idx ? 'ring-2 ring-amber-400 bg-amber-500/30' : ''
                  } ${
                    isSelected
                      ? 'bg-amber-400 text-black border-amber-300 shadow-md ring-1 ring-amber-400/50'
                      : 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:border-neutral-700 hover:text-white'
                  }`}
                >
                  {/* Seletor Drop Down de Posição na Fila */}
                  <div 
                    className="relative flex items-center shrink-0" 
                    onClick={(e) => e.stopPropagation()}
                    title={`Banner #${idx + 1} de ${campaign.products.length}. Clique no drop down para mover para outra posição da fila.`}
                  >
                    <select
                      value={idx}
                      onChange={(e) => {
                        const targetPos = parseInt(e.target.value, 10);
                        if (!isNaN(targetPos) && targetPos !== idx && onReorderProduct) {
                          onReorderProduct(idx, targetPos);
                        }
                      }}
                      className={`font-black text-[11px] h-6 pl-1.5 pr-4 rounded-l-md appearance-none cursor-pointer border-r focus:outline-none transition-colors ${
                        isSelected
                          ? 'bg-amber-500 text-black border-amber-600/30 hover:bg-amber-600'
                          : 'bg-neutral-800 text-amber-400 border-neutral-700 hover:bg-neutral-700'
                      }`}
                    >
                      {campaign.products.map((_, pIdx) => (
                        <option key={pIdx} value={pIdx} className="bg-neutral-900 text-white font-bold py-1">
                          #{pIdx + 1} {pIdx === 0 ? '(1º da fila)' : pIdx === campaign.products.length - 1 ? `(${pIdx + 1}º Fim)` : `(${pIdx + 1}º)`}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className={`w-2.5 h-2.5 pointer-events-none absolute right-1 top-1/2 -translate-y-1/2 ${
                      isSelected ? 'text-black/80' : 'text-amber-400/80'
                    }`} />
                  </div>

                  {/* Título do Banner (clique para selecionar) */}
                  <button
                    type="button"
                    onClick={() => onSelectProductIndex(idx)}
                    className="px-2 py-1 truncate max-w-[90px] sm:max-w-[130px] md:max-w-[170px] text-left select-none"
                    title={`Selecionar banner #${idx + 1}: ${p.title}`}
                  >
                    {p.title}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Next Button */}
        {campaign.products.length > 1 && (
          <button
            id="btn-next-product"
            onClick={() => onSelectProductIndex((currentProductIndex + 1) % campaign.products.length)}
            className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white flex items-center gap-1 text-xs font-bold transition-colors shrink-0"
            title="Próximo produto"
          >
            <span className="hidden sm:inline">Próximo</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};

export const BannerPreview = VisualizadorBannerTV;
