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
  Wand2
} from 'lucide-react';
import { BannerCampaign, ProductItem, ThemeColors, BannerCustomStyles } from '../tiposGeradorBanner';
import { LogoBelissimaEmblem } from './LogoBelissimaEmblem';
import { handleImageError } from '../utils/imageFallback';

interface VisualizadorBannerTVProps {
  campaign: BannerCampaign;
  theme: ThemeColors;
  currentProductIndex: number;
  onSelectProductIndex: (index: number) => void;
  isTvPlayerMode?: boolean;
  onUpdateProductImage?: (productId: string, newImageUrl: string) => void;
  onUpdateProductItem?: (index: number, updated: Partial<ProductItem>) => void;
}

export const VisualizadorBannerTV: React.FC<VisualizadorBannerTVProps> = ({
  campaign,
  theme,
  currentProductIndex,
  onSelectProductIndex,
  isTvPlayerMode = false,
  onUpdateProductImage,
  onUpdateProductItem,
}) => {
  const [isSearchingRealImage, setIsSearchingRealImage] = useState(false);
  const [isGeneratingAiImage, setIsGeneratingAiImage] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const cardFileInputRef = useRef<HTMLInputElement>(null);

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
  };

  const isVertical = campaign.format === '9:16' || campaign.format === '4:5';

  const getAspectClass = () => {
    if (isTvPlayerMode) return '';
    switch (campaign.format) {
      case '9:16':
        return 'aspect-[9/16] max-w-[440px]';
      case '1:1':
        return 'aspect-square max-w-[680px]';
      case '4:5':
        return 'aspect-[4/5] max-w-[540px]';
      case '16:9':
      default:
        return 'aspect-[16/9] max-w-[1120px]';
    }
  };

  // Contenção estrita para o banner
  const getBannerContainerStyle = (): React.CSSProperties => {
    if (isTvPlayerMode) {
      return {
        width: '100%',
        height: '100%',
      };
    }

    // No modo de edição / workspace:
    // Garante que o card suba até o topo eliminando espaço vago e caiba 100% na tela sem barra de rolagem (scroll)
    const hasNav = campaign.products.length > 1;
    const reserveHeight = hasNav ? '155px' : '110px';

    switch (campaign.format) {
      case '9:16':
        return {
          aspectRatio: '9 / 16',
          maxHeight: `calc(100vh - ${reserveHeight})`,
          width: `min(100%, 440px, calc((100vh - ${reserveHeight}) * 9 / 16))`,
        };
      case '1:1':
        return {
          aspectRatio: '1 / 1',
          maxHeight: `calc(100vh - ${reserveHeight})`,
          width: `min(100%, 680px, calc(100vh - ${reserveHeight}))`,
        };
      case '4:5':
        return {
          aspectRatio: '4 / 5',
          maxHeight: `calc(100vh - ${reserveHeight})`,
          width: `min(100%, 540px, calc((100vh - ${reserveHeight}) * 4 / 5))`,
        };
      case '16:9':
      default:
        return {
          aspectRatio: '16 / 9',
          maxHeight: `calc(100vh - ${reserveHeight})`,
          width: `min(100%, 1120px, calc((100vh - ${reserveHeight}) * 16 / 9))`,
        };
    }
  };

  const getAnimationProps = () => {
    if (isTvPlayerMode) {
      // Hardware-accelerated lightweight crossfade for TV Sticks
      return {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        transition: { duration: 0.3, ease: 'easeOut' as const },
      };
    }
    if (campaign.animationStyle === 'zoom') {
      return {
        initial: { scale: 0.92, opacity: 0 },
        animate: { scale: 1, opacity: 1 },
        exit: { opacity: 0 },
        transition: { duration: 0.4, ease: 'easeOut' as const },
      };
    }
    if (campaign.animationStyle === 'slide') {
      return {
        initial: { x: 60, opacity: 0 },
        animate: { x: 0, opacity: 1 },
        exit: { opacity: 0 },
        transition: { duration: 0.4, ease: 'easeOut' as const },
      };
    }
    return {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
      transition: { duration: 0.35 },
    };
  };

  // Price splitting for the supermarket price tag
  const priceClean = (product.price || '8,99').replace('R$', '').trim();
  const priceParts = priceClean.split(/[,.]/);
  const intPrice = priceParts[0] || '8';
  const centsPrice = priceParts[1] ? priceParts[1].padEnd(2, '0').slice(0, 2) : '99';

  const isBelissima = 
    campaign.clientName.toLowerCase().includes('belíssima') || 
    campaign.clientName.toLowerCase().includes('belissima') ||
    (campaign.clientLogoUrl && campaign.clientLogoUrl.includes('belissima'));

  return (
    <div className={`relative w-full ${isTvPlayerMode ? 'h-full w-full p-0 m-0 overflow-hidden flex items-center justify-center bg-black' : 'h-full w-full flex flex-col items-center justify-start p-1 sm:p-1.5 pt-0'}`}>
      {/* Main Banner Frame with ID for image capture */}
      <div
        id="tv-banner-capture"
        style={getBannerContainerStyle()}
        className={`relative overflow-hidden ${isTvPlayerMode ? 'rounded-none border-none shadow-none shrink-0' : 'rounded-2xl shadow-2xl border border-emerald-500/20 w-full h-full'} transition-all select-none ${getAspectClass()} bg-[#073620] flex flex-col justify-between`}
      >
        {/* GPU Isolated Background Layer: Rendered once, zero redraw overhead on frame updates */}
        <div 
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
        <div className={`relative z-10 pl-3 sm:pl-6 md:pl-8 lg:pl-10 pr-3 sm:pr-6 md:pr-8 lg:pr-10 py-2 sm:py-2.5 lg:py-2 flex ${isVertical ? 'flex-col items-center gap-2 text-center' : 'items-center justify-between'} shrink-0`}>
          {/* Left: Client Logo without any artificial container - strictly uses the official brand asset */}
          <div className={`flex items-center shrink-0 ${
            isVertical
              ? 'w-auto max-w-[220px] h-12 sm:h-16'
              : 'w-auto max-w-[180px] sm:max-w-[210px] lg:max-w-[240px] h-12 sm:h-16 lg:h-20'
          }`}>
            {campaign.showClientLogo !== false && (
              isBelissima ? (
                <img
                  crossOrigin="anonymous"
                  src="/logos/belissima-casa-di-frutas.png"
                  alt={campaign.clientName || 'Belíssima Casa di Frutas'}
                  className="w-auto h-full max-h-full object-contain drop-shadow-[0_8px_20px_rgba(0,0,0,0.65)] select-none shrink-0 pointer-events-none"
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
                  crossOrigin="anonymous"
                  src={campaign.clientLogoUrl}
                  alt={campaign.clientName || 'Logo Oficial'}
                  className="w-auto h-full max-h-full object-contain drop-shadow-[0_8px_20px_rgba(0,0,0,0.65)] select-none shrink-0 pointer-events-none"
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

          {/* Top Center: Campaign Title & Validity - NUNCA corta com reticências (...) */}
          {!isVertical && (
            <div className="flex-1 flex flex-col items-center justify-center text-center px-2 sm:px-4 min-w-0">
              <h1 
                style={{
                  color: effectiveStyles.campaignTitleColor || '#fbbf24',
                  fontFamily: effectiveStyles.campaignTitleFont || undefined,
                }}
                className={`${
                  campaign.campaignTitle && campaign.campaignTitle.length > 35
                    ? 'text-xs sm:text-sm md:text-base lg:text-xl'
                    : campaign.campaignTitle && campaign.campaignTitle.length > 25
                    ? 'text-sm sm:text-base md:text-xl lg:text-2xl xl:text-3xl'
                    : 'text-base sm:text-xl md:text-2xl lg:text-3xl xl:text-[34px]'
                } font-black uppercase drop-shadow-[0_4px_14px_rgba(0,0,0,0.9)] w-full text-center leading-tight tracking-tight break-words`}
              >
                {campaign.campaignTitle || 'FESTIVAL DE OFERTAS PLAY COMUNIQUE'}
              </h1>
              <p className="text-[9px] sm:text-[11px] md:text-xs lg:text-sm mt-0.5 text-neutral-100 flex items-center justify-center gap-1.5 font-semibold drop-shadow max-w-full leading-none">
                <Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-400 shrink-0" />
                <span className="truncate">{campaign.validityText || 'Ofertas válidas de 10 a 22/09/2026 ou enquanto durarem os estoques'}</span>
              </p>
            </div>
          )}

          {/* Right Symmetrical Spacer so Campaign Title is centered across the screen */}
          {!isVertical && (
            <div className="shrink-0 pointer-events-none hidden md:block w-auto max-w-[180px] sm:max-w-[210px] lg:max-w-[240px] h-12 sm:h-16 lg:h-20" />
          )}
        </div>

        {/* CENTER CONTENT: Perfectly Proportioned - Nunca cortado pelo cabeçalho ou rodapé */}
        <div id="tv-banner-center-content" className={`relative z-10 flex-1 min-h-0 px-3 sm:px-6 md:px-10 py-1.5 sm:py-2 md:py-2.5 gap-2 sm:gap-6 flex ${isVertical ? 'flex-col justify-between items-center text-center' : 'flex-row items-center justify-between'} overflow-visible`}>
          
          {/* Left Column: Product Title, Packaging, Tag, Regular Price & Supermarket Price Tag */}
          <div id="tv-anim-left-column" className={`flex flex-col justify-between min-w-0 ${
            isVertical 
              ? 'items-center text-center max-w-full' 
              : 'items-start text-left w-[48%] max-w-[48%] h-full max-h-full py-0.5'
          }`}>
            {/* Top Block: Title & Promotional Badge - Um na frente do outro com diagramação perfeita e fundo 100% transparente */}
            <div id="tv-anim-title-block" className="flex flex-col items-start w-full shrink-0 bg-transparent">
              {/* Product Title with Promotional Tag inline in front of the text */}
              <h2 
                style={{
                  color: effectiveStyles.productTitleColor || '#ffffff',
                  fontFamily: effectiveStyles.productTitleFont || undefined,
                }}
                className={`${
                  isVertical
                    ? 'text-[15px] sm:text-[18px] md:text-[21px] leading-snug'
                    : (product.title || '').length > 40
                      ? 'text-[15px] sm:text-[18px] md:text-[22px] lg:text-[26px] xl:text-[28px] leading-[1.14]'
                      : (product.title || '').length > 25
                        ? 'text-[16px] sm:text-[19px] md:text-[23px] lg:text-[27px] xl:text-[31px] leading-[1.15]'
                        : 'text-[16px] sm:text-[20px] md:text-[24px] lg:text-[28px] xl:text-[34px] leading-[1.16]'
                } font-black tracking-tight font-sans break-words bg-transparent`}
              >
                <span 
                  style={{ 
                    backgroundColor: effectiveStyles.badgeBgColor || '#1a472a',
                    color: effectiveStyles.badgeTextColor || '#d4f7dc',
                    borderColor: effectiveStyles.badgeBgColor ? `${effectiveStyles.badgeBgColor}88` : '#3b7a50',
                  }}
                  className="inline-flex items-center px-2.5 py-1 sm:px-3 sm:py-1 text-[10px] sm:text-xs md:text-sm mr-2.5 rounded-lg border font-black uppercase tracking-wider align-middle shadow-sm"
                >
                  {product.badge || 'SUPER OFERTA'}
                </span>
                <span className="align-middle bg-transparent">{product.title}</span>
              </h2>
            </div>

            {/* Bottom Block: Regular Price & Supermarket Price Box */}
            <div id="tv-anim-price-block" className="flex flex-col items-start w-fit pb-1.5 sm:pb-2.5 shrink-0 bg-transparent">
              {/* "De: R$ 10,99" regular price */}
              {product.originalPrice && (
                <div 
                  style={{ color: effectiveStyles.priceOriginalColor || 'rgba(255, 255, 255, 0.9)' }}
                  className="text-xs sm:text-sm md:text-base font-bold mb-1 tracking-tight bg-transparent"
                >
                  De: R${product.originalPrice.replace('R$', '').trim()}
                </div>
              )}

              {/* Main Supermarket Orange Price Box */}
              <div className="inline-flex items-center">
                <div 
                  style={{ 
                    backgroundColor: effectiveStyles.priceBoxBgColor || '#ea580c', 
                    backgroundImage: effectiveStyles.priceBoxBgColor 
                      ? `linear-gradient(180deg, ${effectiveStyles.priceBoxBgColor}dd 0%, ${effectiveStyles.priceBoxBgColor} 50%, #00000033 100%)`
                      : 'linear-gradient(180deg, #f97316 0%, #ea580c 50%, #c2410c 100%)',
                    color: effectiveStyles.priceBoxTextColor || '#ffffff',
                  }}
                  className="relative overflow-hidden rounded-xl md:rounded-2xl p-2.5 sm:p-3 md:p-3.5 lg:p-4 shadow-[0_16px_36px_rgba(0,0,0,0.65)] border-2 border-white/30 gap-2 sm:gap-3 flex items-center transition-transform hover:scale-[1.02] origin-bottom-left"
                >
                  {/* Glossy top highlight overlay for TV commercial acrylic look */}
                  <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/25 to-transparent pointer-events-none rounded-t-xl" />
                  
                  {/* Left: "POR R$" */}
                  <div className="flex flex-col justify-start self-start pt-0.5 leading-none">
                    <span className="text-[9px] sm:text-[10px] md:text-xs font-black uppercase tracking-wider opacity-95">
                      POR
                    </span>
                    <span className="text-xs sm:text-sm md:text-base font-black mt-0.5">
                      R$
                    </span>
                  </div>

                  {/* Big Integer Number */}
                  <div className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-[76px] font-black leading-none tracking-tighter drop-shadow-sm font-sans">
                    {intPrice}
                  </div>

                  {/* Right: ",99" and "2L" / unit */}
                  <div className="flex flex-col justify-start self-start pt-0.5 leading-none pl-0.5">
                    <span className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black leading-none">
                      ,{centsPrice}
                    </span>
                    <span className="text-[10px] sm:text-xs md:text-sm font-black uppercase tracking-wider opacity-95 mt-1">
                      {product.unit || '2L'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Framed Commercial Mini Banner Showcase Card - Dimensões e Proporção 4:3 Padronizadas */}
          <div className={`relative flex-1 min-w-0 flex items-center justify-center ${isVertical ? 'w-full py-1' : 'h-full max-h-full'}`}>
            <AnimatePresence mode={isTvPlayerMode ? 'sync' : 'wait'}>
              <motion.div
                key={product.id}
                id="tv-anim-card-wrapper"
                {...getAnimationProps()}
                className="relative w-full h-full flex items-center justify-center p-1 sm:p-2 overflow-visible"
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
                      const res = await fetch('/api/gemini/build-commercial-prompt', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          title: product.title,
                          brand: product.brand,
                          category: product.category,
                          unit: product.unit,
                          businessSegment: campaign.segment,
                        }),
                      });
                      const data = await res.json();
                      if (data && data.success && data.geminiWebPrompt) {
                        await navigator.clipboard.writeText(data.geminiWebPrompt);
                        setIsCopied(true);
                        setToastMessage('📋 Prompt copiado! Cole no seu Gemini Pro (web) para criar a arte.');
                        setTimeout(() => {
                          setIsCopied(false);
                          setToastMessage(null);
                        }, 4000);
                      }
                    } catch (err) {
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
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            if (event.target?.result && onUpdateProductImage) {
                              onUpdateProductImage(product.id, event.target.result as string);
                              if (onUpdateProductItem) {
                                onUpdateProductItem(currentProductIndex, {
                                  imageUrl: event.target.result as string,
                                  imageDisplayMode: 'ambient',
                                });
                              }
                              setToastMessage('✅ Imagem colada com sucesso da área de transferência!');
                              setTimeout(() => setToastMessage(null), 3500);
                            }
                          };
                          reader.readAsDataURL(blob);
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

                  return (
                    <div
                      id="tv-anim-product-card"
                      data-card-id={`mini-banner-card-${product.id}`}
                      onPaste={handleCardPaste}
                      tabIndex={0}
                      className={`group relative ${
                        isVertical
                          ? 'w-full max-w-[340px] sm:max-w-[420px] aspect-[4/3] my-auto'
                          : 'h-[92%] max-h-[92%] aspect-[4/3] w-auto max-w-[48vw] shrink-0 my-auto'
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

                      {/* MODE 1: AMBIENT FULL-BLEED (Fotografia Comercial Ambientada Limpa de Alta Definição) */}
                      {isAmbient ? (
                        <div className="absolute inset-1 rounded-[10px] sm:rounded-[14px] md:rounded-[18px] overflow-hidden pointer-events-none">
                          {/* Ambient Photography Background Layer - Full Bleed */}
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
                          <input
                            ref={cardFileInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onload = (event) => {
                                  if (event.target?.result && onUpdateProductImage) {
                                    onUpdateProductImage(product.id, event.target.result as string);
                                    if (onUpdateProductItem) {
                                      onUpdateProductItem(currentProductIndex, {
                                        imageUrl: event.target.result as string,
                                        imageDisplayMode: 'ambient',
                                      });
                                    }
                                  }
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />

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
                            onClick={() => cardFileInputRef.current?.click()}
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
            </AnimatePresence>
          </div>
        </div>

        {/* BOTTOM FOOTER: Slim Broadcast Legal Bar - Fundo Preto Limpo sem Letreiro */}
        <div className="relative z-10 px-3 sm:px-6 py-1 sm:py-1.5 text-[9px] sm:text-[10px] md:text-[11px] bg-[#050505] text-neutral-300 flex items-center justify-between border-t border-neutral-800/80 shrink-0 w-full">
          <span className="truncate max-w-[75%] font-medium">
            {campaign.legalNotice || 'Imagens meramente ilustrativas; Proibida a venda de bebidas alcoólicas a menores de 18 anos!'}
          </span>
          <span className="font-bold text-amber-400 shrink-0">
            {campaign.footerBrandText !== undefined && campaign.footerBrandText !== '' ? campaign.footerBrandText : 'Desenvolvido por: playcomunique.com.br'}
          </span>
        </div>
      </div>

      {/* Navigation Thumbnails and Arrows (When not in fullscreen TV player) */}
      {!isTvPlayerMode && campaign.products.length > 1 && (
        <div 
          style={{ width: `min(100%, 1120px, calc((100vh - 155px) * 16 / 9))` }}
          className="mt-1 sm:mt-1.5 flex items-center justify-between px-1 shrink-0"
        >
          {/* Prev Button */}
          <button
            id="btn-prev-product"
            onClick={() => onSelectProductIndex((currentProductIndex - 1 + campaign.products.length) % campaign.products.length)}
            className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white flex items-center gap-1 text-xs font-bold transition-colors shrink-0"
            title="Produto anterior"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Anterior</span>
          </button>

          {/* Product Bullets */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 max-w-[70%] px-1">
            {campaign.products.map((p, idx) => (
              <button
                key={p.id}
                onClick={() => onSelectProductIndex(idx)}
                className={`relative px-2.5 py-1 rounded-md text-xs font-bold flex items-center gap-1 transition-all shrink-0 ${
                  idx === currentProductIndex
                    ? 'bg-amber-500 text-black shadow-md scale-105'
                    : 'bg-neutral-800 text-neutral-400 hover:text-white'
                }`}
                title={p.title}
              >
                <span>#{idx + 1}</span>
                <span className="truncate max-w-[80px] sm:max-w-[120px]">{p.title}</span>
              </button>
            ))}
          </div>

          {/* Next Button */}
          <button
            id="btn-next-product"
            onClick={() => onSelectProductIndex((currentProductIndex + 1) % campaign.products.length)}
            className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white flex items-center gap-1 text-xs font-bold transition-colors shrink-0"
            title="Próximo produto"
          >
            <span className="hidden sm:inline">Próximo</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};

export const BannerPreview = VisualizadorBannerTV;
