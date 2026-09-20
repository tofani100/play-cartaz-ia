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
  Sparkles,
  RefreshCw,
  ShieldCheck,
  Copy,
  Check,
  SlidersHorizontal,
  Wand2
} from 'lucide-react';
import { BannerCampaign, ProductItem, ThemeColors } from '../tiposGeradorBanner';
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
    if (!isTvPlayerMode) return {};

    if (campaign.format === '9:16') {
      return {
        aspectRatio: '9 / 16',
        height: '100%',
        maxHeight: '100dvh',
        width: 'auto',
        margin: 'auto',
      };
    }

    // No modo TV para 16:9 (horizontal padrão), preenche 100% da tela física sem criar faixas pretas
    return {
      width: '100%',
      height: '100%',
    };
  };

  const getAnimationProps = () => {
    if (campaign.animationStyle === 'zoom') {
      return {
        initial: { scale: 0.92, opacity: 0 },
        animate: { scale: 1, opacity: 1 },
        transition: { duration: 0.45, ease: 'easeOut' as const },
      };
    }
    if (campaign.animationStyle === 'slide') {
      return {
        initial: { x: 60, opacity: 0 },
        animate: { x: 0, opacity: 1 },
        transition: { duration: 0.45, ease: 'easeOut' as const },
      };
    }
    return {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      transition: { duration: 0.4 },
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
    <div className={`relative w-full ${isTvPlayerMode ? 'h-full w-full p-0 m-0 overflow-hidden flex items-center justify-center bg-black' : 'flex flex-col items-center justify-center p-2 sm:p-4'}`}>
      {/* Main Banner Frame with ID for image capture */}
      <div
        id="tv-banner-capture"
        style={getBannerContainerStyle()}
        className={`relative overflow-hidden ${isTvPlayerMode ? 'rounded-none border-none shadow-none w-full h-full' : 'rounded-2xl shadow-2xl border border-emerald-500/20 w-full'} transition-all select-none ${getAspectClass()} bg-[#073620] flex flex-col justify-between`}
      >
        {/* Deep Green Texture Background matching Model Banner (Image 1) */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#06331e] via-[#083c24] to-[#042214] pointer-events-none" />

        {/* Subtle Watermark Geometric/Botanical Texture Pattern */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.06] pointer-events-none" xmlns="http://www.w3.org/2000/svg">
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

        {/* Lighting vignette and glow */}
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-96 h-96 bg-black/40 rounded-full blur-2xl pointer-events-none" />

        {/* TOP HEADER: Perfectly Proportioned Across All Screen Sizes */}
        <div className={`relative z-10 px-3 sm:px-6 md:px-10 lg:px-12 ${isTvPlayerMode ? 'py-1.5 sm:py-2 md:py-2.5' : 'py-2 sm:py-2.5 lg:py-1.5'} flex ${isVertical ? 'flex-col items-center gap-2 text-center' : 'items-center justify-between'} gap-2 sm:gap-4 shrink-0`}>
          {/* Left: Client Logo without any artificial container - strictly uses the official brand asset */}
          <div className={`flex items-center gap-2 shrink-0 ${isTvPlayerMode ? 'pr-3 sm:pr-6 md:pr-8' : 'pr-3 sm:pr-6 md:pr-12'}`}>
            {campaign.showClientLogo !== false && (
              isBelissima ? (
                <img
                  src="/logos/belissima-casa-di-frutas.png"
                  alt={campaign.clientName || 'Belíssima Casa di Frutas'}
                  className={`${isTvPlayerMode ? 'h-10 sm:h-14 md:h-18 lg:h-22 xl:h-24 max-h-[10vh]' : isVertical ? 'h-10 sm:h-14' : 'h-8 sm:h-11 md:h-16 lg:h-20'} scale-[2] origin-top-left w-auto object-contain drop-shadow-[0_8px_20px_rgba(0,0,0,0.65)] select-none shrink-0 pointer-events-none transition-transform duration-200`}
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
                  src={campaign.clientLogoUrl}
                  alt={campaign.clientName || 'Logo Oficial'}
                  className={`${isTvPlayerMode ? 'h-10 sm:h-14 md:h-18 lg:h-22 xl:h-24 max-h-[10vh]' : isVertical ? 'h-10 sm:h-14' : 'h-8 sm:h-11 md:h-16 lg:h-20'} scale-[2] origin-top-left w-auto object-contain drop-shadow-[0_8px_20px_rgba(0,0,0,0.65)] select-none shrink-0 transition-transform duration-200`}
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

          {/* Top Center: Campaign Title & Validity - Cabe confortavelmente sem reticências e sem invadir o miolo */}
          {!isVertical && (
            <div className="flex-1 flex flex-col items-center justify-center text-center px-2 sm:px-4 min-w-0 relative">
              <h1 className={`${isTvPlayerMode ? 'text-lg sm:text-2xl md:text-3xl lg:text-4xl xl:text-[38px] 2xl:text-[42px]' : 'text-[14px] sm:text-[18px] md:text-[22px] lg:text-[28px] xl:text-[34px]'} font-black uppercase tracking-normal text-amber-400 drop-shadow-[0_2px_10px_rgba(0,0,0,0.85)] w-full text-center leading-tight whitespace-nowrap overflow-hidden text-ellipsis`}>
                {campaign.campaignTitle || 'FESTIVAL DE OFERTAS PLAY COMUNIQUE'}
              </h1>
              <p className={`${isTvPlayerMode ? 'text-[10px] sm:text-xs md:text-sm lg:text-base mt-1 sm:mt-1.5' : 'text-[8px] sm:text-[10px] md:text-xs mt-1'} text-neutral-200 flex items-center justify-center gap-1.5 font-medium drop-shadow-sm max-w-full leading-none`}>
                <Calendar className={`${isTvPlayerMode ? 'w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4' : 'w-2.5 h-2.5 sm:w-3 sm:h-3'} text-amber-400 shrink-0`} />
                <span className="truncate">{campaign.validityText || 'Ofertas válidas de 10 a 22/09/2026 ou enquanto durarem os estoques'}</span>
              </p>
            </div>
          )}
        </div>

        {/* CENTER CONTENT: Perfectly Proportioned - Nunca cortado pelo cabeçalho ou rodapé */}
        <div className={`relative z-10 flex-1 min-h-0 ${isTvPlayerMode ? 'px-4 sm:px-8 md:px-12 py-1.5 sm:py-2 md:py-3 gap-4 sm:gap-6 md:gap-8' : 'px-3 sm:px-6 md:px-10 py-1 sm:py-2 gap-2 sm:gap-6'} flex ${isVertical ? 'flex-col justify-between items-center text-center' : 'flex-row items-center justify-between'} overflow-hidden`}>
          
          {/* Left Column: Product Title, Packaging, Tag, Regular Price & Supermarket Price Tag */}
          <div className={`flex flex-col justify-center min-w-0 ${isVertical ? 'items-center text-center max-w-full' : isTvPlayerMode ? 'items-start text-left max-w-[50%] shrink-0' : 'items-start text-left max-w-[48%] sm:max-w-[46%]'}`}>
            
            {/* Product Title */}
            <h2 className={`${isTvPlayerMode ? 'text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-[44px]' : isVertical ? 'text-[13px] sm:text-[16px] md:text-[19px]' : 'text-[13px] sm:text-[16px] md:text-[19px] lg:text-[24px] xl:text-[28px]'} font-black text-white leading-[1.12] tracking-tight drop-shadow-[0_3px_12px_rgba(0,0,0,0.85)] font-sans break-words`}>
              {product.title}
            </h2>

            {/* Packaging / Commercial Unit Subtitle */}
            <p className={`${isTvPlayerMode ? 'text-xs sm:text-sm md:text-base lg:text-lg font-semibold mt-0.5 sm:mt-1' : 'text-[10px] sm:text-xs md:text-sm mt-0.5'} text-neutral-200 font-medium drop-shadow-sm opacity-95`}>
              Embalagem comercial {product.unit || '2L'}
            </p>

            {/* Soft Green "OFERTA DO DIA" Badge */}
            <div className={`${isTvPlayerMode ? 'mt-1.5 sm:mt-2' : 'mt-1 sm:mt-1.5'}`}>
              <span className={`inline-flex items-center ${isTvPlayerMode ? 'px-2.5 py-0.5 sm:px-3.5 sm:py-1 rounded-md sm:rounded-lg text-[10px] sm:text-xs md:text-sm' : 'px-2 py-0.5 sm:px-3 sm:py-1 rounded-md text-[9px] sm:text-xs'} bg-[#3e684d] text-[#cbf4d8] border border-[#528d69]/40 font-extrabold uppercase tracking-wider shadow-sm`}>
                {product.badge || 'OFERTA DO DIA'}
              </span>
            </div>

            {/* "De: R$ 10,99" regular price */}
            {product.originalPrice && (
              <div className={`text-white/85 ${isTvPlayerMode ? 'text-xs sm:text-sm md:text-base font-bold mt-0.5 sm:mt-1' : 'text-[10px] sm:text-xs md:text-sm font-semibold mt-0.5'} tracking-tight drop-shadow`}>
                De: R${product.originalPrice.replace('R$', '').trim()}
              </div>
            )}

            {/* Main Supermarket Orange Price Box */}
            <div className={`${isTvPlayerMode ? 'mt-1.5 sm:mt-2.5 md:mt-3' : 'mt-1 sm:mt-2'} inline-flex items-center`}>
              <div className={`bg-[#ea580c] bg-gradient-to-b from-[#f97316] via-[#ea580c] to-[#c2410c] text-white ${isTvPlayerMode ? 'rounded-xl sm:rounded-2xl p-2 sm:p-3 md:p-3.5 lg:p-4 shadow-[0_16px_40px_rgba(0,0,0,0.65)] border-2 border-white/30 gap-1.5 sm:gap-2.5 md:gap-3' : 'rounded-lg sm:rounded-xl md:rounded-2xl p-1.5 sm:p-2.5 md:p-3 shadow-[0_14px_30px_rgba(0,0,0,0.6)] border-2 border-white/20 gap-1 sm:gap-2'} flex items-center transition-transform hover:scale-[1.02]`}>
                
                {/* Left: "POR R$" */}
                <div className="flex flex-col justify-start self-start pt-0.5 leading-none">
                  <span className={`${isTvPlayerMode ? 'text-[8px] sm:text-[9px] md:text-[10px] lg:text-xs font-black' : 'text-[7px] sm:text-[9px] md:text-[11px] font-black'} uppercase tracking-wider text-white/90`}>
                    POR
                  </span>
                  <span className={`${isTvPlayerMode ? 'text-[10px] sm:text-xs md:text-sm lg:text-base font-black mt-0.5' : 'text-[9px] sm:text-xs md:text-sm font-black mt-0.5'}`}>
                    R$
                  </span>
                </div>

                {/* Big Integer Number */}
                <div className={`${isTvPlayerMode ? 'text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-[90px]' : 'text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl'} font-black leading-none tracking-tighter drop-shadow-sm font-sans`}>
                  {intPrice}
                </div>

                {/* Right: ",99" and "2L" / unit */}
                <div className="flex flex-col justify-start self-start pt-0.5 leading-none pl-0.5">
                  <span className={`${isTvPlayerMode ? 'text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black' : 'text-lg sm:text-xl md:text-2xl lg:text-3xl font-black'} leading-none`}>
                    ,{centsPrice}
                  </span>
                  <span className={`${isTvPlayerMode ? 'text-[9px] sm:text-[10px] md:text-xs lg:text-sm font-black mt-0.5 sm:mt-1' : 'text-[8px] sm:text-[10px] md:text-xs font-black mt-0.5'} uppercase tracking-wider text-white/95`}>
                    {product.unit || '2L'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Framed Commercial Mini Banner Showcase Card - Dimensões e Proporção 4:3 Padronizadas */}
          <div className={`relative flex-1 min-w-0 flex items-center justify-center ${isVertical ? 'w-full py-1' : 'h-full max-h-full'}`}>
            <AnimatePresence mode="wait">
              <motion.div
                key={product.id}
                {...getAnimationProps()}
                className="relative w-full h-full flex items-center justify-center p-1"
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
                      id={`mini-banner-card-${product.id}`}
                      onPaste={handleCardPaste}
                      tabIndex={0}
                      className={`group relative ${
                        isVertical
                          ? 'w-full max-w-[364px] sm:max-w-[442px] aspect-[4/3]'
                          : isTvPlayerMode
                          ? 'h-[86%] max-h-[86%] aspect-[4/3] w-auto max-w-[48vw] shrink-0'
                          : 'w-full max-w-[235px] sm:max-w-[312px] md:max-w-[442px] lg:max-w-[600px] xl:max-w-[728px] aspect-[4/3] max-h-[68vh] sm:max-h-[74vh] shrink-0'
                      } ${
                        isAmbient
                          ? 'bg-neutral-950 border-2 border-white/90 shadow-[0_25px_60px_rgba(0,0,0,0.9)] ring-1 ring-white/20'
                          : 'bg-gradient-to-b from-[#f8fafc] via-[#ffffff] to-[#eef2f6] border-2 border-white/80 shadow-[0_22px_50px_rgba(0,0,0,0.8)]'
                      } ${
                        isTvPlayerMode
                          ? 'rounded-2xl md:rounded-3xl p-1.5 sm:p-2 md:p-3'
                          : 'rounded-xl sm:rounded-2xl md:rounded-3xl p-1.5 sm:p-2'
                      } flex flex-col items-center justify-between overflow-hidden select-none outline-none focus:ring-2 focus:ring-amber-400`}
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
                            <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0 animate-pulse" />
                            <span>{toastMessage}</span>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* MODE 1: AMBIENT FULL-BLEED (Estilo Fotografia Comercial de TV - Print 1) */}
                      {isAmbient ? (
                        <>
                          {/* Ambient Photography Background Layer - Full Bleed */}
                          <img
                            src={product.imageUrl}
                            alt={product.title}
                            onError={(e) => handleImageError(e, product.title, product.category)}
                            className="absolute inset-0 w-full h-full object-cover object-center transform group-hover:scale-105 transition-transform duration-700 pointer-events-none"
                            referrerPolicy="no-referrer"
                            loading="eager"
                          />

                          {/* Cinematic Dark Vignette & Readability Gradients */}
                          <div className="absolute inset-0 bg-gradient-to-b from-black/75 via-transparent to-black/85 pointer-events-none" />

                          {/* Ambient Stage Glow */}
                          <div className="absolute inset-0 shadow-[inset_0_0_50px_rgba(0,0,0,0.6)] pointer-events-none" />

                          {/* Top Header Floating Strip */}
                          <div className="relative z-10 w-full flex items-center justify-between px-2 sm:px-3 pt-1 pb-1">
                            <div className="flex items-center gap-1.5 bg-black/70 backdrop-blur-md text-amber-300 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full shadow-md border border-white/20">
                              <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-400 shrink-0 animate-pulse" />
                              <span className="text-[7px] sm:text-[9px] md:text-[10px] font-black uppercase tracking-wider">
                                ARTE AMBIENTADA IA
                              </span>
                            </div>

                            <div className="hidden sm:flex items-center gap-1 text-[8px] md:text-[10px] font-bold text-white uppercase bg-black/70 backdrop-blur-md px-2 py-0.5 rounded-md border border-white/20 shadow-md">
                              <ShieldCheck className="w-3 h-3 text-emerald-400" />
                              <span>{product.brand || product.category || 'Varejo Oficial'}</span>
                            </div>
                          </div>

                          {/* Middle Space: Clean Commercial Visual Staging (No text overlay inside the photo) */}
                          <div className="relative z-10 w-full flex-1" />

                          {/* Bottom Floating Specifications Ribbon */}
                          <div className="relative z-10 w-full bg-black/85 backdrop-blur-md text-white px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl flex items-center justify-between border border-white/25 shadow-xl mt-0.5">
                            <div className="flex items-center gap-1.5 truncate">
                              <CheckCircle2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-400 shrink-0" />
                              <span className="text-[8px] sm:text-[9px] md:text-[10px] font-extrabold truncate text-white drop-shadow-sm">
                                {product.title}
                              </span>
                            </div>
                            <span className="text-[7px] sm:text-[8px] md:text-[9px] font-black uppercase tracking-wider text-amber-300 shrink-0 ml-1 bg-amber-400/20 px-1.5 py-0.5 rounded border border-amber-400/35">
                              {product.unit || 'Oferta'}
                            </span>
                          </div>
                        </>
                      ) : (
                        /* MODE 2: CLASSIC WHITE STUDIO CUTOUT PACKSHOT */
                        <>
                          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white via-white/80 to-slate-100/60 pointer-events-none" />

                          <div className="relative z-10 w-full flex items-center justify-between px-2 sm:px-3 pt-1 pb-1">
                            <div className="flex items-center gap-1.5 bg-neutral-900/90 text-amber-300 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full shadow-sm border border-neutral-700/80">
                              <Camera className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-400 shrink-0" />
                              <span className="text-[7px] sm:text-[9px] md:text-[10px] font-black uppercase tracking-wider">
                                PACKSHOT ISOLADO
                              </span>
                            </div>

                            <div className="hidden sm:flex items-center gap-1 text-[8px] md:text-[10px] font-bold text-neutral-600 uppercase bg-neutral-100/80 px-2 py-0.5 rounded-md border border-neutral-200/80">
                              <ShieldCheck className="w-3 h-3 text-emerald-600" />
                              <span>{product.brand || product.category || 'Varejo Oficial'}</span>
                            </div>
                          </div>

                          <div className="relative z-10 w-full flex-1 flex items-center justify-center p-2 sm:p-3 md:p-4 overflow-hidden">
                            <div className="absolute bottom-2 sm:bottom-3 w-3/5 h-3 sm:h-5 bg-black/25 rounded-full blur-md pointer-events-none" />
                            <img
                              src={product.imageUrl}
                              alt={product.title}
                              onError={(e) => handleImageError(e, product.title, product.category)}
                              className="relative z-10 max-h-full max-w-full object-contain object-center drop-shadow-[0_12px_20px_rgba(0,0,0,0.35)] transform group-hover:scale-105 transition-transform duration-500 pointer-events-none"
                              referrerPolicy="no-referrer"
                              loading="eager"
                            />
                          </div>

                          <div className="relative z-10 w-full bg-neutral-950/90 backdrop-blur-sm text-white px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl flex items-center justify-between border border-neutral-800 shadow-sm mt-0.5">
                            <div className="flex items-center gap-1.5 truncate">
                              <CheckCircle2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-400 shrink-0" />
                              <span className="text-[8px] sm:text-[9px] md:text-[10px] font-bold truncate text-neutral-200">
                                {product.title}
                              </span>
                            </div>
                            <span className="text-[7px] sm:text-[8px] md:text-[9px] font-black uppercase tracking-wider text-amber-400 shrink-0 ml-1 bg-amber-400/15 px-1.5 py-0.5 rounded border border-amber-400/30">
                              {product.unit || 'Embalagem Original'}
                            </span>
                          </div>
                        </>
                      )}

                      {/* Top-Right Circular Discount Starburst / Stamp Badge */}
                      {product.discountPercentage && product.discountPercentage > 0 && (
                        <motion.div
                          animate={{ rotate: [0, 4, -4, 0] }}
                          transition={{ repeat: Infinity, duration: 4 }}
                          className={`absolute ${
                            isTvPlayerMode
                              ? 'w-11 h-11 sm:w-14 sm:h-14 md:w-16 md:h-16 lg:w-20 lg:h-20 -top-2 -right-2 sm:-top-3 sm:-right-3 md:-top-3.5 md:-right-3.5 border-2 sm:border-3'
                              : 'w-8 h-8 sm:w-11 sm:h-11 md:w-14 md:h-14 lg:w-16 lg:h-16 -top-2 -right-2 sm:-top-3 sm:-right-3 md:-top-3.5 md:-right-3.5 border-2 sm:border-[3px]'
                          } scale-110 origin-center z-30 rounded-full bg-gradient-to-tr from-[#ea580c] to-[#f97316] text-white border-white shadow-[0_10px_24px_rgba(0,0,0,0.6)] flex flex-col items-center justify-center text-center leading-none`}
                        >
                          <span
                            className={`${
                              isTvPlayerMode
                                ? 'text-[7px] sm:text-[8px] md:text-[9px] lg:text-[10px] font-black'
                                : 'text-[6px] sm:text-[8px] md:text-[9px] font-black'
                            } uppercase tracking-wider text-white/95`}
                          >
                            OFERTAÇO
                          </span>
                          <span
                            className={`${
                              isTvPlayerMode
                                ? 'text-xs sm:text-sm md:text-base lg:text-lg font-black mt-0.5'
                                : 'text-[10px] sm:text-xs md:text-sm font-black mt-0.5'
                            } text-white`}
                          >
                            -{product.discountPercentage}%
                          </span>
                        </motion.div>
                      )}

                      {/* Edit Controls Toolbar Overlay (Apenas no Modo Painel, Oculto no TV Player Fullscreen) */}
                      {!isTvPlayerMode && (
                        <div className="absolute inset-x-0 bottom-0 p-2 z-20 bg-black/90 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-wrap items-center justify-center gap-1.5">
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
                              <Sparkles className="w-3.5 h-3.5 fill-black" />
                            )}
                            <span>{isGeneratingAiImage ? 'Criando Cena...' : 'Gerar Arte IA ✨'}</span>
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

        {/* BOTTOM FOOTER: Two-tier Ticker & Legal Bar matching Image 1 */}
        <div className="relative z-10 bg-black/95 border-t border-neutral-800 overflow-hidden shrink-0 w-full">
          {/* Ticker Tier */}
          {campaign.showMarqueeTicker && (
            <div className={`${isTvPlayerMode ? 'py-1 sm:py-1.5 md:py-2 px-3 sm:px-6 gap-2 sm:gap-3' : 'py-1 sm:py-1.5 md:py-2 px-3 sm:px-6 gap-2 sm:gap-3'} flex items-center`}>
              {/* Red OFERTAS Button */}
              <div className={`flex items-center ${isTvPlayerMode ? 'gap-1 sm:gap-1.5 text-[10px] sm:text-xs md:text-sm px-2.5 sm:px-3.5 py-0.5 sm:py-1 rounded-md' : 'gap-1 sm:gap-1.5 text-[10px] sm:text-xs px-2 sm:px-3 py-0.5 sm:py-1 rounded-md'} font-black bg-[#d90429] text-white shadow-md shrink-0`}>
                <Volume2 className={`${isTvPlayerMode ? 'w-3.5 h-3.5 sm:w-4 sm:h-4' : 'w-3 h-3 sm:w-3.5 sm:h-3.5'} animate-pulse`} />
                <span>OFERTAS</span>
              </div>

              {/* Marquee Text with Yellow Stars */}
              <div className="overflow-hidden whitespace-nowrap flex-1">
                <div className={`animate-marquee ${isTvPlayerMode ? 'text-[11px] sm:text-xs md:text-sm lg:text-base' : 'text-[10px] sm:text-xs md:text-sm'} font-black text-neutral-100 uppercase tracking-wide`}>
                  {campaign.tickerText || '★★ OFERTAS IMBATÍVEIS EM TODAS AS LOJAS. ★ NOSSO APLICATIVO É BOM DEMAIS! ★★ OFERTAS VÁLIDAS PARA TODAS AS FILIAIS DA BELÍSSIMA CASA DI FRUTAS ★ COMPRE PELO WHATSAPP ★ ACEITAMOS TODOS OS CARTÕES E PIX ★'}
                </div>
              </div>
            </div>
          )}

          {/* Sub-Footer Legal Notice & Signature Link */}
          <div className={`${isTvPlayerMode ? 'px-3 sm:px-6 py-0.5 sm:py-1 text-[8px] sm:text-[9px] md:text-[10px]' : 'px-3 sm:px-6 py-0.5 sm:py-1 text-[8px] sm:text-[9px] md:text-[10px]'} bg-black text-neutral-400 flex items-center justify-between border-t border-neutral-900`}>
            <span className="truncate max-w-[80%]">
              {campaign.legalNotice || 'Imagens meramente ilustrativas. Proibida a venda de bebidas alcoólicas a menores de 18 anos.'}
            </span>
            <span className="font-bold text-neutral-300 shrink-0">
              {campaign.footerBrandText !== undefined && campaign.footerBrandText !== '' ? campaign.footerBrandText : 'Desenvolvido por: playcomunique.com.br'}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Thumbnails and Arrows (When not in fullscreen TV player) */}
      {!isTvPlayerMode && campaign.products.length > 1 && (
        <div className="w-full max-w-[1120px] mt-3 flex items-center justify-between px-2">
          {/* Prev Button */}
          <button
            id="btn-prev-product"
            onClick={() => onSelectProductIndex((currentProductIndex - 1 + campaign.products.length) % campaign.products.length)}
            className="p-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white flex items-center gap-1 text-xs font-bold transition-colors"
            title="Produto anterior"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Anterior</span>
          </button>

          {/* Product Bullets */}
          <div className="flex items-center gap-2 overflow-x-auto py-1 max-w-[70%] px-2">
            {campaign.products.map((p, idx) => (
              <button
                key={p.id}
                onClick={() => onSelectProductIndex(idx)}
                className={`relative px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-1.5 transition-all shrink-0 ${
                  idx === currentProductIndex
                    ? 'bg-amber-500 text-black shadow-md scale-105'
                    : 'bg-neutral-800 text-neutral-400 hover:text-white'
                }`}
                title={p.title}
              >
                <span>#{idx + 1}</span>
                <span className="truncate max-w-[90px] sm:max-w-[130px]">{p.title}</span>
              </button>
            ))}
          </div>

          {/* Next Button */}
          <button
            id="btn-next-product"
            onClick={() => onSelectProductIndex((currentProductIndex + 1) % campaign.products.length)}
            className="p-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white flex items-center gap-1 text-xs font-bold transition-colors"
            title="Próximo produto"
          >
            <span className="hidden sm:inline">Próximo</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export const BannerPreview = VisualizadorBannerTV;
