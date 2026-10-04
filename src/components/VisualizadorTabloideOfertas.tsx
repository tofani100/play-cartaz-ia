import React, { useState, useMemo } from 'react';
import { 
  Calendar, 
  Phone, 
  MapPin, 
  CreditCard, 
  Sparkles, 
  Smartphone, 
  Instagram, 
  FileText, 
  Check, 
  CheckSquare, 
  Square, 
  Download, 
  Copy, 
  Printer, 
  X, 
  SlidersHorizontal, 
  CheckCircle2,
  MessageCircle,
  Eye,
  Grid,
  Star,
  ChevronLeft,
  ChevronRight,
  GripVertical
} from 'lucide-react';
import { BannerCampaign, ThemeColors, ProductItem, BannerCustomStyles } from '../tiposGeradorBanner';
import { EtiquetaPrecoPromocional } from './EtiquetaPrecoPromocional';
import { handleImageError } from '../utils/imageFallback';
import { downloadElementAsPng } from '../utils/ajudanteExportacao';
import { toCanvas } from 'html-to-image';
import { gerarPaletaHarmonicaTabloide } from '../utils/coloristaHarmonizadorTabloide';

interface VisualizadorTabloideOfertasProps {
  campaign: BannerCampaign;
  theme: ThemeColors;
  currentProductIndex?: number;
  onUpdateCampaign?: (updated: Partial<BannerCampaign>) => void;
  onSelectProductIndex?: (index: number) => void;
  onUpdateProduct?: (index: number, updated: Partial<ProductItem>) => void;
  onReorderProduct?: (fromIndex: number, toIndex: number) => void;
}

export const VisualizadorTabloideOfertas: React.FC<VisualizadorTabloideOfertasProps> = ({ 
  campaign, 
  theme,
  currentProductIndex,
  onUpdateCampaign,
  onSelectProductIndex,
  onUpdateProduct,
  onReorderProduct,
}) => {
  const targetProdIdx = currentProductIndex ?? campaign.activeProductIndex ?? 0;
  const activeProduct = campaign.products[targetProdIdx] || campaign.products[0];

  // Fusão de estilos dinâmica: prioriza estilos do produto selecionado sobre os globais da campanha
  const effectiveStyles: BannerCustomStyles = {
    ...(campaign.customStyles || {}),
    ...(activeProduct?.customStyles || {}),
  };

  // Motor Colorista Sênior: Harmonização tonal dinâmica a partir da cor do fundo do banner
  const baseBannerColor = effectiveStyles.bannerBgColor || theme.primary || '#7f1d1d';
  const paletaHarmonica = useMemo(() => {
    return gerarPaletaHarmonicaTabloide(baseBannerColor);
  }, [baseBannerColor]);

  // Grid Columns: 1, 2, 3 or 4 (default: 2 for mobile/whatsapp screens)
  const columns = campaign.tabloidColumns || 2;
  // Grid Rows: 2, 3, 4, 5, 6 or 0 for all (default: 3 rows = 6 items)
  const rows = campaign.tabloidRows !== undefined ? campaign.tabloidRows : 3;
  // Target format preset: 'whatsapp-mobile' | 'instagram-feed' | 'classic-a4'
  const targetPreset = campaign.tabloidTarget || 'whatsapp-mobile';

  // Product Selection & Drag State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [draggedCardId, setDraggedCardId] = useState<string | null>(null);
  const [dragOverCardId, setDragOverCardId] = useState<string | null>(null);

  const isBelissima = 
    campaign.clientName.toLowerCase().includes('belíssima') || 
    campaign.clientName.toLowerCase().includes('belissima') ||
    (campaign.clientLogoUrl && campaign.clientLogoUrl.includes('belissima'));

  // Calculate slots available in the chosen grid
  const totalSlots = rows === 0 ? campaign.products.length : columns * rows;

  // Candidatos de produtos para o tablóide respeitando a ordem de campaign.products
  const candidateProducts: ProductItem[] = useMemo(() => {
    if (campaign.tabloidSelectedProductIds && campaign.tabloidSelectedProductIds.length > 0) {
      const idSet = new Set(campaign.tabloidSelectedProductIds);
      return campaign.products.filter(p => idSet.has(p.id));
    }
    return campaign.products;
  }, [campaign.products, campaign.tabloidSelectedProductIds]);

  // Lista de produtos renderizados respeitando o limite de vagas
  // Se qualquer banner for duplo, ele consome 2 vagas (quando colunas > 1).
  // "Caso não caiba na quantidade selecionada, que elimine o ultimo da lista"
  const productsToRender: ProductItem[] = useMemo(() => {
    if (rows === 0) return candidateProducts;

    const maxCapacity = columns * rows;
    const result: ProductItem[] = [];
    let currentUsedSlots = 0;

    for (const item of candidateProducts) {
      const cost = (item.isHero && columns > 1) ? 2 : 1;
      if (currentUsedSlots + cost <= maxCapacity) {
        result.push(item);
        currentUsedSlots += cost;
      }
      if (currentUsedSlots >= maxCapacity) {
        break;
      }
    }

    return result;
  }, [candidateProducts, columns, rows]);

  // Total de vagas efetivamente ocupadas na grade
  const slotsUsed = useMemo(() => {
    return productsToRender.reduce((sum, item) => sum + ((item.isHero && columns > 1) ? 2 : 1), 0);
  }, [productsToRender, columns]);

  // Selected products for the tabloid modal
  const activeSelectedIds = useMemo(() => {
    if (campaign.tabloidSelectedProductIds && campaign.tabloidSelectedProductIds.length > 0) {
      return campaign.tabloidSelectedProductIds;
    }
    return productsToRender.map(p => p.id);
  }, [campaign.tabloidSelectedProductIds, productsToRender]);

  // Toggle duplo / super destaque (isHero) em qualquer banner
  const handleToggleHero = (productId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const prodIdx = campaign.products.findIndex(p => p.id === productId);
    if (prodIdx === -1) return;
    const currentHero = Boolean(campaign.products[prodIdx].isHero);
    const nextHero = !currentHero;

    if (onUpdateProduct) {
      onUpdateProduct(prodIdx, { isHero: nextHero });
    } else if (onUpdateCampaign) {
      const updatedProducts = [...campaign.products];
      updatedProducts[prodIdx] = { ...updatedProducts[prodIdx], isHero: nextHero };
      onUpdateCampaign({ products: updatedProducts });
    }

    setToastMessage(
      nextHero
        ? `⭐ Banner #${prodIdx + 1} marcado como DUPLO (ocupa 2 vagas de destaque)!`
        : `✓ Banner #${prodIdx + 1} definido como NORMAL (1 vaga).`
    );
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Reordenar banners (drag and drop ou setas)
  const handleReorder = (fromId: string, toId: string) => {
    if (!fromId || !toId || fromId === toId) return;
    const fromIdx = campaign.products.findIndex(p => p.id === fromId);
    const toIdx = campaign.products.findIndex(p => p.id === toId);
    if (fromIdx === -1 || toIdx === -1) return;

    if (onReorderProduct) {
      onReorderProduct(fromIdx, toIdx);
    } else if (onUpdateCampaign) {
      const updatedProducts = [...campaign.products];
      const [moved] = updatedProducts.splice(fromIdx, 1);
      updatedProducts.splice(toIdx, 0, moved);
      onUpdateCampaign({ products: updatedProducts });
    }

    if (campaign.tabloidSelectedProductIds && campaign.tabloidSelectedProductIds.length > 0 && onUpdateCampaign) {
      const currentList = [...campaign.tabloidSelectedProductIds];
      const fPos = currentList.indexOf(fromId);
      const tPos = currentList.indexOf(toId);
      if (fPos !== -1 && tPos !== -1) {
        const [m] = currentList.splice(fPos, 1);
        currentList.splice(tPos, 0, m);
        onUpdateCampaign({ tabloidSelectedProductIds: currentList });
      }
    }

    setToastMessage('↔️ Posição dos banners reorganizada com sucesso!');
    setTimeout(() => setToastMessage(null), 2000);
  };

  const handleShiftPosition = (productId: string, direction: 'prev' | 'next', e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const currentIdx = campaign.products.findIndex(p => p.id === productId);
    if (currentIdx === -1) return;
    const targetIdx = direction === 'prev' ? currentIdx - 1 : currentIdx + 1;
    if (targetIdx < 0 || targetIdx >= campaign.products.length) return;
    handleReorder(productId, campaign.products[targetIdx].id);
  };

  // Update Grid Columns
  const handleSetColumns = (newCols: number) => {
    if (onUpdateCampaign) {
      onUpdateCampaign({ tabloidColumns: newCols });
    } else {
      campaign.tabloidColumns = newCols;
    }
  };

  // Update Grid Rows
  const handleSetRows = (newRows: number) => {
    if (onUpdateCampaign) {
      onUpdateCampaign({ tabloidRows: newRows });
    } else {
      campaign.tabloidRows = newRows;
    }
  };

  // Preset Selection Handler
  const handleSelectPreset = (preset: 'whatsapp-mobile' | 'instagram-feed' | 'classic-a4') => {
    let newCols = 2;
    let newRows = 3;

    if (preset === 'whatsapp-mobile') {
      newCols = 2;
      newRows = 3; // 2x3 = 6 products, perfect for smartphone screens & WhatsApp
    } else if (preset === 'instagram-feed') {
      newCols = 2;
      newRows = 2; // 2x2 = 4 products or 2x3 = 6 products, perfect for square / 4:5 post
    } else if (preset === 'classic-a4') {
      newCols = 3;
      newRows = 3; // 3x3 = 9 products, standard supermarket paper leaflet
    }

    if (onUpdateCampaign) {
      onUpdateCampaign({
        tabloidTarget: preset,
        tabloidColumns: newCols,
        tabloidRows: newRows,
      });
    }
    setToastMessage(`✨ Formato ajustado para: ${preset === 'whatsapp-mobile' ? 'WhatsApp & Celular (9:16)' : preset === 'instagram-feed' ? 'Instagram & Facebook (Feed)' : 'Encarte A4 Clássico'}`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Toggle single product selection
  const handleToggleProductSelection = (productId: string) => {
    let updated: string[];
    if (activeSelectedIds.includes(productId)) {
      updated = activeSelectedIds.filter(id => id !== productId);
    } else {
      updated = [...activeSelectedIds, productId];
    }
    if (onUpdateCampaign) {
      onUpdateCampaign({ tabloidSelectedProductIds: updated });
    }
  };

  // Select all products
  const handleSelectAll = () => {
    const allIds = campaign.products.map(p => p.id);
    if (onUpdateCampaign) {
      onUpdateCampaign({ tabloidSelectedProductIds: allIds });
    }
  };

  // Auto-fill exactly the number of slots, accounting for duplo items
  const handleFillSlots = () => {
    const maxCapacity = rows === 0 ? campaign.products.length : columns * rows;
    const fillIds: string[] = [];
    let used = 0;

    for (const prod of campaign.products) {
      const cost = (prod.isHero && columns > 1) ? 2 : 1;
      if (used + cost <= maxCapacity) {
        fillIds.push(prod.id);
        used += cost;
      }
      if (used >= maxCapacity) break;
    }

    if (onUpdateCampaign) {
      onUpdateCampaign({ tabloidSelectedProductIds: fillIds });
    }
    setToastMessage(`✅ ${fillIds.length} produtos preenchidos automaticamente ocupando as ${used} vagas da grade.`);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Clear selection
  const handleClearSelection = () => {
    if (onUpdateCampaign) {
      onUpdateCampaign({ tabloidSelectedProductIds: [] });
    }
  };

  // Export as PNG for WhatsApp and Social Media
  const handleDownloadImage = async () => {
    setIsExporting(true);
    setToastMessage('Gerando imagem em alta resolução para WhatsApp...');
    try {
      const filename = `tabloide-whatsapp-${(campaign.clientName || 'ofertas').toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.png`;
      await downloadElementAsPng('tabloid-capture', filename);
      setToastMessage('✅ Imagem salva com sucesso! Pronta para enviar aos clientes.');
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err) {
      console.error('Erro ao baixar tabloide:', err);
      setToastMessage('⚠️ Erro ao gerar imagem.');
      setTimeout(() => setToastMessage(null), 3000);
    } finally {
      setIsExporting(false);
    }
  };

  // Copy Image directly to Clipboard for WhatsApp Web
  const handleCopyImageToClipboard = async () => {
    const el = document.getElementById('tabloid-capture');
    if (!el) return;

    setIsExporting(true);
    setToastMessage('Copiando imagem para WhatsApp Web...');
    try {
      const canvas = await toCanvas(el, {
        quality: 1.0,
        pixelRatio: 2,
        filter: (node) => {
          if (node instanceof HTMLElement && (
            node.classList.contains('group-hover:opacity-100') ||
            node.classList.contains('no-export') ||
            node.dataset.exportHide === 'true' ||
            node.id === 'tv-card-toolbar'
          )) {
            return false;
          }
          return true;
        },
      });

      canvas.toBlob(async (blob) => {
        if (blob && navigator.clipboard && window.ClipboardItem) {
          await navigator.clipboard.write([
            new window.ClipboardItem({ 'image/png': blob })
          ]);
          setToastMessage('📋 Imagem copiada! Pressione Ctrl+V na conversa do WhatsApp para enviar.');
          setTimeout(() => setToastMessage(null), 4500);
        } else {
          throw new Error('ClipboardItem não suportado');
        }
      });
    } catch (err) {
      console.warn('Erro ao copiar imagem:', err);
      // Fallback: download
      handleDownloadImage();
    } finally {
      setIsExporting(false);
    }
  };

  // Print / PDF
  const handlePrint = () => {
    window.print();
  };

  // Responsive container width according to target preset
  const containerMaxWidth = 
    targetPreset === 'whatsapp-mobile'
      ? 'max-w-[560px]'
      : targetPreset === 'instagram-feed'
      ? 'max-w-[660px]'
      : 'max-w-[880px]';

  return (
    <div className="w-full flex flex-col items-center p-2 sm:p-4 select-none pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-16 z-50 bg-black/95 backdrop-blur-md border border-amber-400 text-amber-300 px-5 py-2.5 rounded-full shadow-2xl font-bold text-xs sm:text-sm flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* TOP CONFIGURATION TOOLBAR: Colunas, Linhas, Escolha de Imagens e Exportação Celular/WhatsApp */}
      <div className="w-full max-w-[880px] mb-4 bg-neutral-900 border border-neutral-800 rounded-2xl p-3 sm:p-4 shadow-xl flex flex-col gap-3">
        {/* Row 1: Target Destination Presets (Celular, Redes Sociais, Impressão) */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pb-3 border-b border-neutral-800">
          <div className="flex items-center gap-2 text-xs font-black text-neutral-300 uppercase tracking-wider">
            <Smartphone className="w-4 h-4 text-amber-400" />
            <span>Destino do Tablóide:</span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => handleSelectPreset('whatsapp-mobile')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                targetPreset === 'whatsapp-mobile'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/50 border border-emerald-400'
                  : 'bg-neutral-800 hover:bg-neutral-750 text-neutral-300 border border-neutral-700'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5 text-emerald-300" />
              <span>WhatsApp & Celular (9:16)</span>
            </button>

            <button
              type="button"
              onClick={() => handleSelectPreset('instagram-feed')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                targetPreset === 'instagram-feed'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg border border-pink-400'
                  : 'bg-neutral-800 hover:bg-neutral-750 text-neutral-300 border border-neutral-700'
              }`}
            >
              <Instagram className="w-3.5 h-3.5 text-pink-300" />
              <span>Instagram & Face (Feed)</span>
            </button>

            <button
              type="button"
              onClick={() => handleSelectPreset('classic-a4')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                targetPreset === 'classic-a4'
                  ? 'bg-amber-500 text-black shadow-lg font-black border border-amber-300'
                  : 'bg-neutral-800 hover:bg-neutral-750 text-neutral-300 border border-neutral-700'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-amber-300" />
              <span>Encarte A4 Clássico</span>
            </button>
          </div>
        </div>

        {/* Row 2: Grid Controls (Colunas, Linhas, Botão Escolher Imagens e Baixar) */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Colunas */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-neutral-400 font-bold uppercase tracking-wider">Colunas:</span>
            <div className="flex items-center gap-1 bg-neutral-950 p-1 rounded-xl border border-neutral-800">
              {[1, 2, 3, 4].map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => handleSetColumns(c)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                    columns === c
                      ? 'bg-amber-500 text-black shadow-md'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  {c} Col{c > 1 ? 's' : ''}
                </button>
              ))}
            </div>
          </div>

          {/* Linhas */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-neutral-400 font-bold uppercase tracking-wider">Linhas:</span>
            <div className="flex items-center gap-1 bg-neutral-950 p-1 rounded-xl border border-neutral-800">
              {[2, 3, 4, 5, 6, 0].map(r => (
                <button
                  key={r}
                  type="button"
                  onClick={() => handleSetRows(r)}
                  className={`px-2 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                    rows === r
                      ? 'bg-amber-500 text-black shadow-md'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  {r === 0 ? 'Todas' : `${r}L`}
                </button>
              ))}
            </div>
          </div>

          {/* Botão Principal: Escolher Imagens / Produtos */}
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-black font-black text-xs shadow-md transition-all active:scale-95 cursor-pointer"
            title="Escolha exatamente quais produtos e fotos serão exibidos no tablóide"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-black" />
            <span>Escolher Imagens ({productsToRender.length}/{campaign.products.length})</span>
          </button>

          {/* Quick Actions: Baixar WhatsApp / Copiar */}
          <div className="flex items-center gap-1.5 ml-auto">
            <button
              type="button"
              disabled={isExporting}
              onClick={handleDownloadImage}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-md transition-all cursor-pointer active:scale-95 disabled:opacity-50"
              title="Baixar imagem em altíssima qualidade pronta para o WhatsApp e Redes Sociais"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Baixar (WhatsApp)</span>
            </button>

            <button
              type="button"
              onClick={handleCopyImageToClipboard}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-amber-300 font-bold text-xs border border-neutral-700 transition-colors cursor-pointer"
              title="Copiar imagem e colar diretamente no WhatsApp Web (Ctrl+V)"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copiar</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-bold text-xs border border-neutral-700 transition-colors cursor-pointer"
              title="Imprimir ou Salvar PDF"
            >
              <Printer className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* TABLOID CAPTURE CONTAINER - ADAPTADO PARA CELULAR, INSTAGRAM, FACEBOOK E WHATSAPP */}
      <div
        id="tabloid-capture"
        className={`w-full ${containerMaxWidth} rounded-2xl shadow-2xl overflow-hidden flex flex-col justify-between select-none transition-all duration-300 relative`}
        style={{
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.9), 0 0 30px rgba(245, 158, 11, 0.15)',
          borderColor: effectiveStyles.cardBorderColor || (paletaHarmonica.isLightBase ? '#ca8a04' : 'rgba(245, 158, 11, 0.4)'),
          borderWidth: '2px',
          borderStyle: 'solid',
          backgroundColor: paletaHarmonica.baseHex,
        }}
      >
        {/* ============================================================ */}
        {/* CABEÇALHO OFICIAL DO TABLÓIDE: VISÍVEL, IMPONENTE E INTEGRAL */}
        {/* ============================================================ */}
        {(() => {
          const defaultVal1 = 'Ofertas válidas de 10 a 22/09/2026 ou enquanto durarem os estoques';
          const defaultVal2 = 'Ofertas válidas até domingo ou enquanto durarem os estoques';
          
          let validityDisplay = campaign.validityText;
          if (
            (!validityDisplay || validityDisplay === defaultVal1 || validityDisplay === defaultVal2) &&
            campaign.campaignSubtitle &&
            campaign.campaignSubtitle.toLowerCase().includes('válid')
          ) {
            validityDisplay = campaign.campaignSubtitle;
          }
          if (!validityDisplay) {
            validityDisplay = defaultVal2;
          }

          const isSubtitleValid = 
            campaign.campaignSubtitle &&
            campaign.campaignSubtitle.trim().toLowerCase() !== validityDisplay.trim().toLowerCase() &&
            !campaign.campaignSubtitle.toLowerCase().includes('válid');

          return (
            <div 
              id="tabloid-header"
              className="relative px-3.5 sm:px-5 pt-3 sm:pt-3.5 pb-2 sm:pb-2.5 text-white flex flex-col justify-between border-b-4 overflow-hidden"
              style={{ 
                borderBottomColor: effectiveStyles.cardBorderColor || '#f59e0b',
                fontFamily: effectiveStyles.campaignTitleFont || "'Montserrat', sans-serif"
              }}
            >
              {/* Background Layer: Custom Image, Gradient or Base Color */}
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
                      : `linear-gradient(135deg, ${theme.primary} 0%, #06331e 60%, #031a0f 100%)`)
                  }}
                  className="absolute inset-0" 
                />
              )}

              {/* Ondas Finas e Elegantes no Fundo (Linhas Douradas Sinuosas de Alta Sofisticação) */}
              <svg 
                className="absolute inset-0 w-full h-full pointer-events-none opacity-45 overflow-hidden" 
                preserveAspectRatio="none" 
                viewBox="0 0 1000 240"
              >
                <defs>
                  <linearGradient id="tabloidGoldWave1" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.1" />
                    <stop offset="35%" stopColor="#fde047" stopOpacity="0.8" />
                    <stop offset="70%" stopColor="#d97706" stopOpacity="0.65" />
                    <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.15" />
                  </linearGradient>
                  <linearGradient id="tabloidGoldWave2" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#fde047" stopOpacity="0.08" />
                    <stop offset="50%" stopColor="#ffffff" stopOpacity="0.7" />
                    <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.18" />
                  </linearGradient>
                  <linearGradient id="tabloidGoldWave3" x1="0%" y1="100%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.12" />
                    <stop offset="45%" stopColor="#fef08a" stopOpacity="0.75" />
                    <stop offset="85%" stopColor="#b45309" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.05" />
                  </linearGradient>
                </defs>

                {/* Conjunto de ondas sinuosas finas e paralelas que cruzam o cabeçalho */}
                <path d="M -60,35 Q 220,185 500,65 T 1060,105" fill="none" stroke="url(#tabloidGoldWave1)" strokeWidth="1.6" />
                <path d="M -60,60 Q 240,210 520,90 T 1060,130" fill="none" stroke="url(#tabloidGoldWave2)" strokeWidth="1.0" />
                <path d="M -60,105 Q 200,245 560,115 T 1060,170" fill="none" stroke="url(#tabloidGoldWave1)" strokeWidth="1.4" />
                
                <path d="M -60,165 Q 320,35 680,175 T 1060,85" fill="none" stroke="url(#tabloidGoldWave3)" strokeWidth="1.2" />
                <path d="M -60,190 Q 340,60 700,200 T 1060,110" fill="none" stroke="url(#tabloidGoldWave2)" strokeWidth="1.0" />
                <path d="M -60,225 Q 380,95 740,230 T 1060,145" fill="none" stroke="url(#tabloidGoldWave1)" strokeWidth="1.8" />
              </svg>

              {/* Sutil iluminação ambiente */}
              <div className="absolute top-0 right-0 w-96 h-96 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute top-1/2 left-10 -translate-y-1/2 w-72 h-72 bg-white/5 rounded-full blur-2xl pointer-events-none" />

              {/* Linha Superior do Cabeçalho: Logo à Esquerda e Título + WhatsApp à Direita (sutilmente elevados alguns mm) */}
              <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between w-full gap-2 sm:gap-4 pb-1 sm:pb-1.5">
                {/* Esquerda: Logo Oficial em Escala Maior e Imponente */}
                <div className="flex items-center justify-center sm:justify-start shrink-0 max-w-[44%] sm:max-w-[46%] py-0.5">
                  {campaign.showClientLogo !== false && (
                    (campaign.clientLogoUrl && !campaign.clientLogoUrl.startsWith('/logos/belissima')) ? (
                      <img 
                        crossOrigin="anonymous"
                        src={campaign.clientLogoUrl}
                        alt={campaign.clientName || 'Logo Oficial'}
                        className="max-h-24 sm:max-h-28 md:max-h-32 lg:max-h-36 w-auto max-w-full object-contain drop-shadow-[0_8px_24px_rgba(0,0,0,0.85)] filter contrast-105"
                        referrerPolicy="no-referrer"
                      />
                    ) : isBelissima ? (
                      <img 
                        crossOrigin="anonymous"
                        src="/logos/belissima-casa-di-frutas.png"
                        alt={campaign.clientName || 'Belíssima Casa di Frutas'}
                        className="max-h-24 sm:max-h-28 md:max-h-32 lg:max-h-36 w-auto max-w-full object-contain drop-shadow-[0_8px_24px_rgba(0,0,0,0.85)] filter contrast-105"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          const target = e.currentTarget;
                          if (target.src.endsWith('.png')) target.src = '/logos/belissima-casa-di-frutas.svg';
                        }}
                      />
                    ) : campaign.clientLogoUrl ? (
                      <img 
                        crossOrigin="anonymous"
                        src={campaign.clientLogoUrl}
                        alt={campaign.clientName || 'Logo'}
                        className="max-h-24 sm:max-h-28 md:max-h-32 lg:max-h-36 w-auto max-w-full object-contain drop-shadow-[0_8px_24px_rgba(0,0,0,0.85)]"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="bg-amber-400 text-black font-black text-xl sm:text-2xl px-5 py-3 rounded-2xl shadow-xl font-['Montserrat'] tracking-tight">
                        {campaign.clientName || 'SUPERMERCADO'}
                      </div>
                    )
                  )}
                </div>

                {/* Direita: Título da Campanha e WhatsApp CTA */}
                <div className="flex-1 min-w-0 max-w-full sm:max-w-[56%] flex flex-col items-center sm:items-end text-center sm:text-right justify-center gap-1.5 sm:gap-2">
                  {/* Título Superior da Campanha */}
                  <div className="w-full flex flex-col items-center sm:items-end text-center sm:text-right">
                    <h1 
                      className="w-full text-base sm:text-lg md:text-xl lg:text-[22px] font-black uppercase drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)] tracking-tight leading-[1.15] block break-words"
                      style={{
                        fontFamily: effectiveStyles.campaignTitleFont || "'Montserrat', sans-serif",
                        color: effectiveStyles.campaignTitleColor || '#fde047',
                      }}
                    >
                      {campaign.campaignTitle || 'FESTIVAL DE OFERTAS'}
                    </h1>

                    {/* Subtítulo / Slogan (se houver) */}
                    {isSubtitleValid && (
                      <span 
                        className="text-[10px] sm:text-[11px] text-white/90 font-semibold uppercase tracking-wider mt-0.5 drop-shadow truncate max-w-full block"
                        style={{ fontFamily: "'Montserrat', sans-serif" }}
                      >
                        {campaign.campaignSubtitle}
                      </span>
                    )}
                  </div>

                  {/* WhatsApp CTA: Sempre em Linha Única sem Cortar */}
                  <div className="w-full flex items-center justify-center sm:justify-end">
                    <div 
                      className={`inline-flex items-center ${
                        targetPreset === 'whatsapp-mobile' ? 'gap-1.5 px-2.5 py-1' : 'gap-1.5 px-3 py-1 sm:py-1.2'
                      } rounded-full bg-emerald-600 hover:bg-emerald-500 border border-emerald-300/60 text-white shadow-lg backdrop-blur-xs transition-colors shrink-0 max-w-full`}
                      title={`Peça no WhatsApp: ${campaign.phoneWhatsapp || '(11) 98765-4321'}`}
                    >
                      <MessageCircle className={`${targetPreset === 'whatsapp-mobile' ? 'w-3 h-3 sm:w-3.5 sm:h-3.5' : 'w-3 h-3 sm:w-3.5 sm:h-3.5'} text-emerald-200 shrink-0`} />
                      <span className={`${
                        targetPreset === 'whatsapp-mobile'
                          ? ((campaign.phoneWhatsapp && campaign.phoneWhatsapp.length > 18) ? 'text-[8.5px]' : 'text-[9.5px] sm:text-[10px]')
                          : 'text-[10.5px] sm:text-[11.5px]'
                      } font-medium tracking-normal antialiased whitespace-nowrap drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]`}>
                        Peça no WhatsApp: {campaign.phoneWhatsapp || '(11) 98765-4321'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Base do Cabeçalho: Validade Centralizada na Largura Total, Sem Caixa, em Linha Única sem Cortar */}
              <div className="relative z-10 w-full flex items-center justify-center gap-1 sm:gap-1.5 pt-1 border-t border-white/10 text-center px-1">
                <Calendar className={`${targetPreset === 'whatsapp-mobile' ? 'w-2.5 h-2.5' : 'w-3 h-3'} text-amber-400 shrink-0 drop-shadow`} />
                <span 
                  className={`${
                    targetPreset === 'whatsapp-mobile'
                      ? (validityDisplay.length > 55 ? 'text-[7px] sm:text-[7.5px]' : 'text-[7.5px] sm:text-[8px]')
                      : 'text-[8.5px] sm:text-[9.5px] md:text-[10px]'
                  } font-bold text-amber-200 ${targetPreset === 'whatsapp-mobile' ? 'tracking-normal' : 'tracking-wide'} uppercase whitespace-nowrap drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]`}
                  style={{ fontFamily: "'Montserrat', sans-serif" }}
                  title={validityDisplay}
                >
                  {validityDisplay}
                </span>
              </div>
            </div>
          );
        })()}

        {/* ============================================================ */}
        {/* CORPO DO TABLÓIDE: GRADE DE OFERTAS MULTI-COLUNA E MULTI-LINHA */}
        {/* ============================================================ */}
        <div 
          className="p-3 sm:p-4 flex-1 relative"
          style={{
            background: paletaHarmonica.canvasBackground,
          }}
        >
          {productsToRender.length === 0 ? (
            <div className="text-center py-16 text-neutral-400 flex flex-col items-center justify-center">
              <Sparkles className="w-10 h-10 text-amber-400 mb-3 animate-bounce" />
              <p className="text-base font-bold text-white">Nenhum produto selecionado para o tablóide.</p>
              <button
                type="button"
                onClick={handleFillSlots}
                className="mt-4 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs rounded-xl shadow-lg cursor-pointer"
              >
                Preencher Automaticamente ({totalSlots} Vagas)
              </button>
            </div>
          ) : (
            <div 
              className={`grid gap-2.5 sm:gap-3.5 [grid-auto-flow:dense] ${
                columns === 1
                  ? 'grid-cols-1'
                  : columns === 2
                  ? 'grid-cols-2'
                  : columns === 3
                  ? 'grid-cols-2 sm:grid-cols-3'
                  : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4'
              }`}
            >
              {productsToRender.map((item, idx) => {
                const isHero = item.isHero || false;
                const itemStyles: BannerCustomStyles = {
                  ...effectiveStyles,
                  ...(item.customStyles || {}),
                };

                const isDragging = draggedCardId === item.id;
                const isDragOver = dragOverCardId === item.id && draggedCardId !== item.id;

                return (
                  <div
                    key={item.id || idx}
                    draggable
                    onDragStart={(e) => {
                      setDraggedCardId(item.id);
                      e.dataTransfer.effectAllowed = 'move';
                      e.dataTransfer.setData('text/plain', item.id);
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = 'move';
                      if (dragOverCardId !== item.id) {
                        setDragOverCardId(item.id);
                      }
                    }}
                    onDragLeave={() => {
                      if (dragOverCardId === item.id) {
                        setDragOverCardId(null);
                      }
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (draggedCardId && draggedCardId !== item.id) {
                        handleReorder(draggedCardId, item.id);
                      }
                      setDraggedCardId(null);
                      setDragOverCardId(null);
                    }}
                    onDragEnd={() => {
                      setDraggedCardId(null);
                      setDragOverCardId(null);
                    }}
                    onClick={() => {
                      if (onSelectProductIndex) {
                        const originalIdx = campaign.products.findIndex(p => p.id === item.id);
                        if (originalIdx !== -1) onSelectProductIndex(originalIdx);
                      }
                    }}
                    style={{
                      background: isHero && columns > 1 ? paletaHarmonica.cardHeroBackground : paletaHarmonica.cardBackground,
                      border: isHero && columns > 1 
                        ? paletaHarmonica.cardHeroBorder 
                        : (itemStyles.cardBorderColor ? `1px solid ${itemStyles.cardBorderColor}` : paletaHarmonica.cardBorder),
                      boxShadow: isHero && columns > 1 ? paletaHarmonica.cardHeroShadow : paletaHarmonica.cardShadow,
                    }}
                    className={`group relative rounded-2xl overflow-hidden transition-all flex flex-col justify-between cursor-grab active:cursor-grabbing select-none ${
                      isHero && columns > 1 ? 'col-span-2' : ''
                    } ${
                      isDragging ? 'opacity-35 scale-95 border-dashed border-amber-400' : ''
                    } ${
                      isDragOver ? 'ring-2 ring-amber-400 scale-[1.02]' : ''
                    }`}
                    title="Arraste para mover de posição ou clique para editar este produto"
                  >
                    {/* Header Superior do Card: Badge à esquerda, Ações e Unidade à direita (sem sobreposição) */}
                    <div className="absolute top-2 inset-x-2 z-20 flex items-start justify-between gap-1 pointer-events-none">
                      {/* Left: Badge Promocional */}
                      <div className="pointer-events-auto shrink-0 max-w-[62%]">
                        {item.badge && (
                          <span 
                            className="text-[9px] sm:text-[10px] uppercase font-black px-2 py-0.5 rounded-md shadow-md text-center tracking-wider truncate block"
                            style={{
                              backgroundColor: item.badgeBgColor || itemStyles.badgeBgColor || theme.badgeBg || '#FACC15',
                              color: item.badgeTextColor || itemStyles.badgeTextColor || theme.badgeText || '#000000',
                            }}
                          >
                            {item.badge}
                          </span>
                        )}
                      </div>

                      {/* Right: Botão Duplo + Pílula de Unidade */}
                      <div className="flex items-center gap-1 pointer-events-auto ml-auto shrink-0">
                        {/* Botão Duplo rápido (Não visível no PNG de exportação) */}
                        {!isExporting && (
                          <button
                            type="button"
                            onClick={(e) => handleToggleHero(item.id, e)}
                            className={`no-export px-1.5 py-0.5 rounded-md text-[8.5px] font-black uppercase flex items-center gap-0.5 shadow-sm transition-all cursor-pointer ${
                              isHero
                                ? 'bg-amber-400 hover:bg-amber-300 text-black ring-1 ring-amber-300'
                                : 'bg-black/60 hover:bg-black/90 text-neutral-200 hover:text-amber-300 border border-white/25 backdrop-blur-xs'
                            }`}
                            title={isHero ? 'Clique para voltar ao tamanho normal (1 vaga)' : 'Clique para tornar DUPLO (2 vagas de destaque)'}
                          >
                            <Star className={`w-2.5 h-2.5 ${isHero ? 'fill-black text-black' : 'text-amber-400'}`} />
                            <span className="hidden sm:inline">{isHero ? 'Duplo' : '1x'}</span>
                          </button>
                        )}

                        {/* Unit Pill com harmonização cromática */}
                        <span 
                          style={{
                            background: paletaHarmonica.unitPillBackground,
                            color: paletaHarmonica.unitPillTextColor,
                            border: paletaHarmonica.unitPillBorder,
                          }}
                          className={`font-black uppercase rounded shadow-sm whitespace-nowrap inline-block ${
                            columns === 1 
                              ? 'text-[10px] px-2 py-0.5' 
                              : columns === 2 
                              ? 'text-[9px] px-1.5 py-0.5' 
                              : columns === 3 
                              ? 'text-[7.5px] px-1 py-0.5' 
                              : 'text-[6.5px] px-1 py-0.2'
                          }`}
                        >
                          {item.unit || 'UN'}
                        </span>
                      </div>
                    </div>

                    {/* Product Image Frame com Pedestal Estúdio */}
                    <div className={`relative pt-7 pb-2 px-2 flex items-center justify-center overflow-hidden ${
                      columns === 1 
                        ? 'min-h-[180px] sm:min-h-[220px]' 
                        : columns === 2 
                        ? 'min-h-[140px] sm:min-h-[170px]' 
                        : columns === 3
                        ? 'min-h-[110px] sm:min-h-[130px]'
                        : 'min-h-[95px] sm:min-h-[115px]'
                    }`}>
                      {/* Halo Iluminado do Packshot (adeus ao preto opaco) */}
                      <div 
                        className="absolute inset-0 pointer-events-none rounded-t-xl"
                        style={{ background: paletaHarmonica.imagePedestalGradient }}
                      />
                      <div className="absolute bottom-2 w-3/4 h-3 bg-black/40 rounded-full blur-md" />

                      <img
                        crossOrigin="anonymous"
                        src={item.imageUrl}
                        alt={item.title}
                        onError={(e) => handleImageError(e, item.title, item.category)}
                        className={`relative z-10 w-auto object-contain drop-shadow-[0_8px_18px_rgba(0,0,0,0.65)] transform group-hover:scale-105 transition-transform duration-300 ${
                          columns === 1 
                            ? 'max-h-40 sm:max-h-48' 
                            : columns === 2 
                            ? (isHero ? 'max-h-36 sm:max-h-44' : 'max-h-28 sm:max-h-36') 
                            : columns === 3
                            ? (isHero ? 'max-h-28 sm:max-h-34' : 'max-h-22 sm:max-h-26')
                            : 'max-h-18 sm:max-h-22'
                        }`}
                        referrerPolicy="no-referrer"
                        loading="lazy"
                      />
                    </div>

                    {/* Product Title (Nitidez Máxima WCAG AAA) */}
                    <div className="px-2.5 pt-1 pb-1.5 text-left flex-1 flex flex-col justify-start">
                      <h4 
                        className={`font-black line-clamp-3 leading-snug break-words ${
                          columns === 1 
                            ? 'text-sm sm:text-base' 
                            : columns === 2 
                            ? 'text-xs sm:text-sm' 
                            : columns === 3 
                            ? 'text-[10px] sm:text-[11px]' 
                            : 'text-[9px] sm:text-[10px]'
                        }`}
                        style={{
                          color: paletaHarmonica.titleColor,
                          textShadow: paletaHarmonica.titleShadow,
                        }}
                        title={item.title}
                      >
                        {item.title}
                      </h4>
                    </div>

                    {/* Supermarket Orange Price Section (Rodapé do Card Integrado) */}
                    <div 
                      style={{
                        background: paletaHarmonica.priceBarBackground,
                        borderTop: paletaHarmonica.priceBarBorder,
                      }}
                      className={`${columns >= 3 ? 'px-1.5 pb-2 pt-1' : 'px-2.5 pb-2.5 pt-1'} flex items-center justify-between gap-1 min-w-0`}
                    >
                      <EtiquetaPrecoPromocional
                        price={item.price}
                        originalPrice={item.originalPrice}
                        unit={item.unit}
                        themeStyle={{
                          priceBg: item.customStyles?.priceBoxBgColor || itemStyles.priceBoxBgColor || theme.priceBg || '#ea580c',
                          priceText: item.customStyles?.priceBoxTextColor || itemStyles.priceBoxTextColor || theme.priceText || '#ffffff',
                        }}
                        size={columns === 1 ? 'md' : columns === 2 ? 'sm' : columns === 3 ? 'xs' : 'compact'}
                      />

                      {/* Economy Tag */}
                      {item.discountPercentage && item.discountPercentage > 0 && (
                        <div className="text-right shrink-0 flex flex-col items-end justify-center min-w-0 pl-1">
                          <span className={`font-black text-red-400 block leading-none uppercase whitespace-nowrap ${
                            columns >= 3 ? 'text-[7px]' : 'text-[8px] sm:text-[9px]'
                          }`}>
                            {columns >= 3 ? 'ECON.' : 'ECONOMIZE'}
                          </span>
                          <span className={`font-black text-amber-400 leading-none mt-0.5 whitespace-nowrap ${
                            columns >= 4 ? 'text-[8.5px]' : columns === 3 ? 'text-[9.5px]' : 'text-[10px] sm:text-xs'
                          }`}>
                            -{item.discountPercentage}%
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Dica de arrasto sutil no rodapé ao passar o mouse */}
                    {!isExporting && (
                      <div className="absolute bottom-1 right-1 z-10 no-export opacity-0 group-hover:opacity-60 transition-opacity text-[8px] font-bold text-neutral-400 flex items-center gap-0.5 pointer-events-none">
                        <GripVertical className="w-2.5 h-2.5" />
                        <span>Arraste</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ============================================================ */}
        {/* RODAPÉ DO TABLÓIDE: PAGAMENTOS, WHATSAPP, LOCALIZAÇÃO E LEGAL */}
        {/* ============================================================ */}
        <div 
          id="tabloid-footer" 
          className="p-3 sm:p-4 text-neutral-200 text-xs"
          style={{ 
            fontFamily: "'Montserrat', sans-serif",
            background: paletaHarmonica.footerBackground,
            borderTop: paletaHarmonica.footerBorder,
          }}
        >
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-white/10">
            {/* Accepted Payments */}
            <div className="flex items-center gap-1.5 min-w-0">
              <CreditCard className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="text-[10px] sm:text-[11px] font-bold text-neutral-200 truncate">
                Aceitamos PIX, Todos os Cartões e Vales Alimentação
              </span>
            </div>

            {/* Direct Contact - WHATSAPP INTEGRAL EM LINHA ÚNICA SEM QUEBRA */}
            <div className="flex items-center gap-1 text-[10.5px] sm:text-[11.5px] font-medium text-amber-400 whitespace-nowrap shrink-0 ml-auto antialiased">
              <Phone className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="whitespace-nowrap tracking-normal">{campaign.phoneWhatsapp ? `WhatsApp: ${campaign.phoneWhatsapp}` : 'Fale Conosco'}</span>
            </div>
          </div>

          {/* Address & Legal text */}
          <div className="pt-2 flex flex-wrap items-center justify-between gap-2 text-[8.5px] sm:text-[9.5px] text-neutral-300/80">
            <div className="flex items-center gap-1 min-w-0">
              <MapPin className="w-3 h-3 text-amber-500 shrink-0" />
              <span className="truncate">{campaign.storeAddress || 'Consulte a unidade mais próxima de você.'}</span>
            </div>
            <div className="text-right text-neutral-400 shrink-0 ml-auto">
              <span>{campaign.legalNotice || 'Imagens meramente ilustrativas. Ofertas válidas enquanto durarem os estoques.'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* MODAL INTERATIVO: ESCOLHER QUAIS IMAGENS / PRODUTOS EXIBIR   */}
      {/* ============================================================ */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-4xl max-h-[88vh] bg-neutral-900 border-2 border-amber-400/50 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 bg-neutral-950 border-b border-neutral-800 flex items-center justify-between">
              <div>
                <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                  <SlidersHorizontal className="w-5 h-5 text-amber-400" />
                  <span>Escolher Imagens e Produtos do Tablóide</span>
                </h3>
                <p className="text-xs text-neutral-400 mt-1 flex flex-wrap items-center gap-2">
                  <span>Grade Selecionada: <strong className="text-amber-400">{columns} cols × {rows === 0 ? 'Todas' : `${rows} linhas`} ({totalSlots} vagas)</strong></span>
                  <span>•</span>
                  <span>Vagas Ocupadas: <strong className="text-white">{slotsUsed} de ${totalSlots} vagas</strong> por <strong className="text-amber-400">{productsToRender.length} banner(s)</strong></span>
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Filter & Mass Action Buttons */}
            <div className="px-4 py-2.5 bg-neutral-850 border-b border-neutral-800 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleFillSlots}
                  className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-black font-extrabold rounded-lg cursor-pointer transition-colors shadow-sm"
                  title="Preencher exatamente as vagas disponíveis na grade com os primeiros banners da lista"
                >
                  Preencher Grade ({totalSlots} Vagas)
                </button>
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="px-3 py-1 bg-neutral-800 hover:bg-neutral-700 text-white font-bold rounded-lg cursor-pointer transition-colors"
                >
                  Marcar Todos
                </button>
                <button
                  type="button"
                  onClick={handleClearSelection}
                  className="px-3 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white rounded-lg cursor-pointer transition-colors"
                >
                  Limpar
                </button>
              </div>

              <div className="flex items-center gap-3 text-xs">
                <span className="text-neutral-400 font-bold">
                  Total de banners: {campaign.products.length}
                </span>
                <span className="text-amber-300/80 text-[11px] hidden sm:inline">
                  💡 Arraste os cards para mudar a ordem ou clique em ⭐ para tornar Duplo
                </span>
              </div>
            </div>

            {/* Products Grid to Check/Uncheck, Reorder, and Toggle Duplo */}
            <div className="p-4 overflow-y-auto flex-1 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 bg-neutral-900">
              {campaign.products.map((prod, idx) => {
                const isSelected = activeSelectedIds.includes(prod.id);
                const isRendered = productsToRender.some(p => p.id === prod.id);
                const isDuplo = Boolean(prod.isHero);

                const isDragging = draggedCardId === prod.id;
                const isDragOver = dragOverCardId === prod.id && draggedCardId !== prod.id;

                return (
                  <div
                    key={prod.id}
                    draggable
                    onDragStart={(e) => {
                      setDraggedCardId(prod.id);
                      e.dataTransfer.effectAllowed = 'move';
                      e.dataTransfer.setData('text/plain', prod.id);
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = 'move';
                      if (dragOverCardId !== prod.id) {
                        setDragOverCardId(prod.id);
                      }
                    }}
                    onDragLeave={() => {
                      if (dragOverCardId === prod.id) {
                        setDragOverCardId(null);
                      }
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (draggedCardId && draggedCardId !== prod.id) {
                        handleReorder(draggedCardId, prod.id);
                      }
                      setDraggedCardId(null);
                      setDragOverCardId(null);
                    }}
                    onDragEnd={() => {
                      setDraggedCardId(null);
                      setDragOverCardId(null);
                    }}
                    onClick={() => handleToggleProductSelection(prod.id)}
                    className={`relative p-2.5 rounded-xl border transition-all cursor-grab active:cursor-grabbing flex flex-col justify-between select-none ${
                      isRendered
                        ? 'bg-amber-500/10 border-amber-400 ring-2 ring-amber-400/30 shadow-md'
                        : isSelected
                        ? 'bg-red-500/10 border-red-500/50 opacity-70'
                        : 'bg-neutral-950 border-neutral-800 opacity-50 hover:opacity-90'
                    } ${
                      isDragging ? 'opacity-30 scale-95 border-dashed border-amber-400' : ''
                    } ${
                      isDragOver ? 'ring-2 ring-amber-400 bg-amber-500/20 scale-[1.02]' : ''
                    }`}
                  >
                    {/* Top Row: Reorder buttons, Index, and Checkbox */}
                    <div className="flex items-center justify-between mb-1.5 gap-1">
                      <div className="flex items-center gap-1">
                        <span className="text-[11px] font-black text-amber-400">#{idx + 1}</span>
                        {/* Quick Reorder shift buttons */}
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={(e) => handleShiftPosition(prod.id, 'prev', e)}
                          className="p-0.5 rounded text-neutral-400 hover:text-white hover:bg-neutral-800 disabled:opacity-20 cursor-pointer"
                          title="Mover banner antes"
                        >
                          <ChevronLeft className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={idx === campaign.products.length - 1}
                          onClick={(e) => handleShiftPosition(prod.id, 'next', e)}
                          className="p-0.5 rounded text-neutral-400 hover:text-white hover:bg-neutral-800 disabled:opacity-20 cursor-pointer"
                          title="Mover banner depois"
                        >
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Checkbox indicator */}
                      <div>
                        {isSelected ? (
                          <CheckSquare className="w-5 h-5 text-amber-400" />
                        ) : (
                          <Square className="w-5 h-5 text-neutral-600" />
                        )}
                      </div>
                    </div>

                    {/* Botão de Destaque Duplo (2 Vagas) */}
                    <div className="flex items-center justify-between gap-1 mb-2">
                      <button
                        type="button"
                        onClick={(e) => handleToggleHero(prod.id, e)}
                        className={`w-full py-1 px-2 rounded-lg text-[10px] font-black uppercase flex items-center justify-center gap-1 transition-all cursor-pointer ${
                          isDuplo
                            ? 'bg-amber-400 text-black hover:bg-amber-300 ring-1 ring-amber-300 shadow-md'
                            : 'bg-neutral-800 hover:bg-neutral-750 text-neutral-300 hover:text-white border border-neutral-700'
                        }`}
                        title={isDuplo ? 'Banner DUPLO (ocupa 2 vagas). Clique para voltar para 1 vaga.' : 'Tornar este banner DUPLO (2 vagas de destaque no tablóide)'}
                      >
                        <Star className={`w-3 h-3 ${isDuplo ? 'fill-black text-black' : 'text-amber-400'}`} />
                        <span>{isDuplo ? '⭐ Duplo (2 Vagas)' : '1 Vaga (Normal)'}</span>
                      </button>
                    </div>

                    {/* Image Thumbnail */}
                    <div className="h-20 w-full flex items-center justify-center mb-2">
                      <img
                        crossOrigin="anonymous"
                        src={prod.imageUrl}
                        alt={prod.title}
                        onError={(e) => handleImageError(e, prod.title, prod.category)}
                        className="max-h-full max-w-full object-contain drop-shadow"
                      />
                    </div>

                    {/* Title & Price & Status */}
                    <div>
                      <h5 className="text-[11px] font-bold text-white line-clamp-1 leading-tight">
                        {prod.title}
                      </h5>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs font-black text-amber-400">
                          R$ {prod.price} <span className="text-[9px] text-neutral-400 font-normal">/{prod.unit}</span>
                        </span>

                        {/* Status badge */}
                        {isRendered ? (
                          <span className="text-[8.5px] font-black uppercase text-emerald-400 bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-800">
                            Exibindo
                          </span>
                        ) : isSelected ? (
                          <span className="text-[8px] font-black uppercase text-red-400 bg-red-950/80 px-1 py-0.5 rounded border border-red-800" title="Eliminado por exceder a capacidade da grade">
                            Cortado
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Modal Footer */}
            <div className="p-3.5 bg-neutral-950 border-t border-neutral-800 flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-col text-xs text-neutral-400">
                <span>
                  <strong className="text-emerald-400">{productsToRender.length} banner(s)</strong> exibidos preenchendo <strong className="text-amber-400">{slotsUsed} de {totalSlots} vagas</strong>.
                </span>
                {activeSelectedIds.length > productsToRender.length && (
                  <span className="text-[11px] text-amber-400/90 font-medium">
                    ⚠️ {activeSelectedIds.length - productsToRender.length} banner(s) excedente(s) foram cortados automaticamente do final da lista.
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs shadow-lg transition-transform active:scale-95 cursor-pointer ml-auto"
              >
                Concluir e Exibir Tablóide
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const TabloidPreview = VisualizadorTabloideOfertas;
