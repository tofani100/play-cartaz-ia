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
import { downloadElementAsPng, buildExportFilename } from '../utils/ajudanteExportacao';
import { toCanvas } from 'html-to-image';
import { gerarPaletaHarmonicaTabloide } from '../utils/coloristaHarmonizadorTabloide';
import { formatarTelefoneWhatsapp } from '../utils/mascaraTelefone';

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

  // Target format preset: 'whatsapp-mobile' | 'instagram-feed' | 'classic-a4'
  const targetPreset = campaign.tabloidTarget || 'whatsapp-mobile';

  // Grid Columns: 1, 2, 3 or 4
  // Padrão solicitado: instagram retrato (4:5) e Feed Quadrado (1:1) são sempre montados com 3 cols e 3 linhas!
  const defaultColsForPreset = 
    (targetPreset === 'instagram-feed' || targetPreset === 'instagram-square' || targetPreset === 'classic-a4') ? 3 : 2;
  const columns = useMemo(() => {
    if (campaign.tabloidColumns) {
      if ((targetPreset === 'instagram-feed' || targetPreset === 'instagram-square') && campaign.tabloidColumns === 2) {
        return 3;
      }
      return campaign.tabloidColumns;
    }
    return defaultColsForPreset;
  }, [campaign.tabloidColumns, targetPreset, defaultColsForPreset]);

  // Grid Rows: 2, 3, 4, 5, 6 or 0 for all (padrão: 3 linhas)
  const rows = campaign.tabloidRows !== undefined ? campaign.tabloidRows : 3;

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

  // Proporções de grade reais para dimensionamento flexível e travamento estrito de aspecto
  const effectiveRows = rows === 0 
    ? Math.max(1, Math.ceil(productsToRender.length / columns)) 
    : Math.max(1, rows);

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
  const handleSelectPreset = (preset: 'whatsapp-mobile' | 'instagram-feed' | 'instagram-square' | 'classic-a4') => {
    let newCols = 2;
    let newRows = 3;

    if (preset === 'whatsapp-mobile') {
      newCols = 2;
      newRows = 3; // 2x3 = 6 produtos, formato vertical perfeito para WhatsApp/Stories (9:16)
    } else if (preset === 'instagram-feed') {
      newCols = 3;
      newRows = 3; // 3x3 = 9 produtos, Instagram Retrato (4:5) padrão solicitado!
    } else if (preset === 'instagram-square') {
      newCols = 3;
      newRows = 3; // 3x3 = 9 produtos, Feed Quadrado (1:1) padrão solicitado!
    } else if (preset === 'classic-a4') {
      newCols = 3;
      newRows = 3; // 3x3 = 9 produtos, encarte padrão de supermercado A4
    }

    if (onUpdateCampaign) {
      onUpdateCampaign({
        tabloidTarget: preset,
        tabloidColumns: newCols,
        tabloidRows: newRows,
      });
    }
    const label = 
      preset === 'whatsapp-mobile' ? 'WhatsApp & Celular (9:16)' :
      preset === 'instagram-feed' ? 'Instagram Retrato (4:5)' :
      preset === 'instagram-square' ? 'Feed Quadrado (1:1)' :
      'Encarte A4 Clássico';
    setToastMessage(`✨ Formato ajustado para: ${label}`);
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

  // Dynamic download button label according to target preset
  const downloadButtonLabel = useMemo(() => {
    switch (targetPreset) {
      case 'instagram-feed':
        return 'Instagram 4:5';
      case 'instagram-square':
        return 'Feed 1:1';
      case 'classic-a4':
        return 'Encarte A4';
      case 'whatsapp-mobile':
      default:
        return 'WhatsApp 9:16';
    }
  }, [targetPreset]);

  // Export as PNG for WhatsApp, Instagram and Social Media
  const handleDownloadImage = async () => {
    setIsExporting(true);
    setToastMessage(`Gerando imagem em alta resolução para ${downloadButtonLabel}...`);
    try {
      const filename = buildExportFilename({
        clientName: campaign.clientName,
        campaignTitle: campaign.campaignTitle,
        format: 'tabloid',
        tabloidTarget: targetPreset,
        extension: 'png',
      });
      await downloadElementAsPng('tabloid-capture', filename);
      setToastMessage('✅ Imagem salva com sucesso! Pronta para envio ou publicação.');
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
      const rect = el.getBoundingClientRect();
      let sourceW = Math.round(rect.width || el.offsetWidth || 1120);
      let sourceH = Math.round(rect.height || el.offsetHeight || 630);
      if (targetPreset === 'instagram-feed') {
        sourceH = Math.round(sourceW * 1.25);
      } else if (targetPreset === 'instagram-square') {
        sourceH = sourceW;
      } else if (targetPreset === 'whatsapp-mobile') {
        sourceH = Math.round(sourceW * (16 / 9));
      } else if (targetPreset === 'classic-a4') {
        sourceH = Math.round(sourceW * 1.4142);
      }

      const canvas = await toCanvas(el, {
        quality: 1.0,
        pixelRatio: 2,
        canvasWidth: sourceW,
        canvasHeight: sourceH,
        width: sourceW,
        height: sourceH,
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

  // Configurações de proporção geométrica travada por plataforma para evitar qualquer corte
  const { aspectRatioStyle, targetAspectRatioClass, containerMaxWidth } = useMemo(() => {
    switch (targetPreset) {
      case 'instagram-feed':
        return {
          aspectRatioStyle: '4 / 5',
          targetAspectRatioClass: 'aspect-[4/5]',
          containerMaxWidth: 'max-w-[540px]',
        };
      case 'instagram-square':
        return {
          aspectRatioStyle: '1 / 1',
          targetAspectRatioClass: 'aspect-square',
          containerMaxWidth: 'max-w-[620px]',
        };
      case 'whatsapp-mobile':
        return {
          aspectRatioStyle: '9 / 16',
          targetAspectRatioClass: 'aspect-[9/16]',
          containerMaxWidth: 'max-w-[440px]',
        };
      case 'classic-a4':
      default:
        return {
          aspectRatioStyle: '1 / 1.4142',
          targetAspectRatioClass: 'aspect-[1/1.4142]',
          containerMaxWidth: 'max-w-[680px]',
        };
    }
  }, [targetPreset]);

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
              <span>Instagram Retrato (4:5)</span>
            </button>

            <button
              type="button"
              onClick={() => handleSelectPreset('instagram-square')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                targetPreset === 'instagram-square'
                  ? 'bg-indigo-600 text-white shadow-lg border border-indigo-400'
                  : 'bg-neutral-800 hover:bg-neutral-750 text-neutral-300 border border-neutral-700'
              }`}
            >
              <Square className="w-3.5 h-3.5 text-indigo-300" />
              <span>Feed Quadrado (1:1)</span>
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
              title="Baixar imagem em altíssima qualidade pronta para o formato selecionado"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Baixar ({downloadButtonLabel})</span>
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

      {/* TABLOID CAPTURE CONTAINER - PROPORÇÃO TRAVADA POR PLATAFORMA (ZERO CORTE NO FEED OU WHATSAPP) */}
      <div
        id="tabloid-capture"
        data-aspect-ratio={targetPreset}
        className={`w-full ${containerMaxWidth} ${targetAspectRatioClass} rounded-2xl shadow-2xl overflow-hidden flex flex-col justify-between select-none transition-all duration-300 relative`}
        style={{
          aspectRatio: aspectRatioStyle,
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
              className={`relative ${
                effectiveRows >= 4 || targetPreset === 'instagram-square'
                  ? 'px-3 pt-2 pb-1.5'
                  : 'px-3.5 sm:px-4 pt-2.5 sm:pt-3 pb-1.5 sm:pb-2'
              } text-white flex flex-col justify-between border-b-2 sm:border-b-4 overflow-hidden shrink-0`}
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
                {/* Esquerda: Logo Oficial em Escala Proporcional */}
                <div className="flex items-center justify-center sm:justify-start shrink-0 max-w-[44%] sm:max-w-[46%] py-0.5">
                  {campaign.showClientLogo !== false && (
                    (campaign.clientLogoUrl && !campaign.clientLogoUrl.startsWith('/logos/belissima')) ? (
                      <img 
                        crossOrigin="anonymous"
                        src={campaign.clientLogoUrl}
                        alt={campaign.clientName || 'Logo Oficial'}
                        className={`${
                          effectiveRows >= 4 || targetPreset === 'instagram-square'
                            ? 'max-h-14 sm:max-h-16'
                            : effectiveRows === 3
                            ? 'max-h-16 sm:max-h-20'
                            : 'max-h-20 sm:max-h-24 md:max-h-28'
                        } w-auto max-w-full object-contain drop-shadow-[0_8px_24px_rgba(0,0,0,0.85)] filter contrast-105`}
                        referrerPolicy="no-referrer"
                      />
                    ) : isBelissima ? (
                      <img 
                        crossOrigin="anonymous"
                        src="/logos/belissima-casa-di-frutas.png"
                        alt={campaign.clientName || 'Belíssima Casa di Frutas'}
                        className={`${
                          effectiveRows >= 4 || targetPreset === 'instagram-square'
                            ? 'max-h-14 sm:max-h-16'
                            : effectiveRows === 3
                            ? 'max-h-16 sm:max-h-20'
                            : 'max-h-20 sm:max-h-24 md:max-h-28'
                        } w-auto max-w-full object-contain drop-shadow-[0_8px_24px_rgba(0,0,0,0.85)] filter contrast-105`}
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
                        className={`${
                          effectiveRows >= 4 || targetPreset === 'instagram-square'
                            ? 'max-h-14 sm:max-h-16'
                            : effectiveRows === 3
                            ? 'max-h-16 sm:max-h-20'
                            : 'max-h-20 sm:max-h-24 md:max-h-28'
                        } w-auto max-w-full object-contain drop-shadow-[0_8px_24px_rgba(0,0,0,0.85)]`}
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="bg-amber-400 text-black font-black text-sm sm:text-base px-3 py-1.5 rounded-xl shadow-xl font-['Montserrat'] tracking-tight">
                        {campaign.clientName || 'SUPERMERCADO'}
                      </div>
                    )
                  )}
                </div>

                {/* Direita: Título da Campanha e WhatsApp CTA */}
                <div className="flex-1 min-w-0 max-w-full sm:max-w-[56%] flex flex-col items-center sm:items-end text-center sm:text-right justify-center gap-1 sm:gap-1.5">
                  {/* Título Superior da Campanha */}
                  <div className="w-full flex flex-col items-center sm:items-end text-center sm:text-right">
                    <h1 
                      className={`w-full ${
                        effectiveRows >= 4 || targetPreset === 'instagram-square'
                          ? 'text-xs sm:text-sm md:text-base leading-tight'
                          : effectiveRows === 3
                          ? 'text-sm sm:text-base md:text-lg leading-tight'
                          : 'text-base sm:text-lg md:text-xl lg:text-[22px] leading-[1.15]'
                      } font-black uppercase drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)] tracking-tight block break-words`}
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
                        className="text-[9px] sm:text-[10px] text-white/90 font-semibold uppercase tracking-wider mt-0.5 drop-shadow truncate max-w-full block"
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
                        effectiveRows >= 4
                          ? 'gap-1 px-2 py-0.5'
                          : effectiveRows === 3 || targetPreset === 'whatsapp-mobile'
                          ? 'gap-1.5 px-2.5 py-0.5 sm:py-1'
                          : 'gap-1.5 px-3 py-1 sm:py-1.2'
                      } rounded-full bg-emerald-600 hover:bg-emerald-500 border border-emerald-300/60 text-white shadow-lg backdrop-blur-xs transition-colors shrink-0 max-w-full`}
                      title={`Peça no WhatsApp: ${formatarTelefoneWhatsapp(campaign.phoneWhatsapp, '(41) 9 9999 - 9999')}`}
                    >
                      <MessageCircle className={`${effectiveRows >= 4 ? 'w-2.5 h-2.5' : 'w-3 h-3 sm:w-3.5 sm:h-3.5'} text-emerald-200 shrink-0`} />
                      <span className={`${
                        effectiveRows >= 4
                          ? 'text-[7.5px] sm:text-[8px]'
                          : targetPreset === 'whatsapp-mobile'
                          ? 'text-[8.5px] sm:text-[9.5px]'
                          : 'text-[9px] sm:text-[10px]'
                      } font-medium tracking-normal antialiased whitespace-nowrap drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]`}>
                        Peça no WhatsApp: {formatarTelefoneWhatsapp(campaign.phoneWhatsapp, '(41) 9 9999 - 9999')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Base do Cabeçalho: Validade Centralizada na Largura Total, Sem Caixa, em Linha Única sem Cortar */}
              <div className="relative z-10 w-full flex items-center justify-center gap-1 sm:gap-1.5 pt-0.5 sm:pt-1 border-t border-white/10 text-center px-1">
                <Calendar className={`${effectiveRows >= 4 ? 'w-2 h-2' : 'w-2.5 h-2.5'} text-amber-400 shrink-0 drop-shadow`} />
                <span 
                  className={`${
                    effectiveRows >= 4
                      ? 'text-[6.5px] sm:text-[7px]'
                      : targetPreset === 'whatsapp-mobile'
                      ? (validityDisplay.length > 55 ? 'text-[7px] sm:text-[7.5px]' : 'text-[7.5px] sm:text-[8px]')
                      : 'text-[8px] sm:text-[9px] md:text-[9.5px]'
                  } font-bold text-amber-200 uppercase whitespace-nowrap drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]`}
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
          className="p-1.5 sm:p-2 md:p-2.5 flex-1 min-h-0 relative flex flex-col overflow-hidden"
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
              className="grid w-full h-full min-h-0 [grid-auto-flow:dense]"
              style={{
                gap: effectiveRows >= 4 ? '5px' : effectiveRows === 3 ? '7px' : '9px',
                gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
                gridTemplateRows: `repeat(${effectiveRows}, minmax(0, 1fr))`,
              }}
            >
              {productsToRender.map((item, idx) => {
                const isHero = item.isHero || false;
                const itemStyles: BannerCustomStyles = {
                  ...effectiveStyles,
                  ...(item.customStyles || {}),
                };

                const isDragging = draggedCardId === item.id;
                const isDragOver = dragOverCardId === item.id && draggedCardId !== item.id;

                // Destaque DUPLO: Layout Horizontal inspirado no Banner de TV (Foto à direita, Título e Preço à esquerda)
                if (isHero && columns > 1) {
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
                        background: paletaHarmonica.cardHeroBackground,
                        border: paletaHarmonica.cardHeroBorder,
                        boxShadow: paletaHarmonica.cardHeroShadow,
                      }}
                      className={`group relative rounded-xl sm:rounded-2xl overflow-hidden transition-all flex flex-row items-stretch justify-between cursor-grab active:cursor-grabbing select-none h-full min-h-0 col-span-2 ${
                        isDragging ? 'opacity-35 scale-95 border-dashed border-amber-400' : ''
                      } ${
                        isDragOver ? 'ring-2 ring-amber-400 scale-[1.02]' : ''
                      }`}
                      title="Banner Duplo (Destaque TV). Arraste para reposicionar ou clique para editar este produto"
                    >
                      {/* Botão Duplo rápido no topo direito (Não visível no PNG de exportação) */}
                      {!isExporting && (
                        <div className="absolute top-1.5 right-1.5 z-30 flex items-center gap-1 no-export pointer-events-auto">
                          <button
                            type="button"
                            onClick={(e) => handleToggleHero(item.id, e)}
                            className="px-1.5 py-0.5 rounded text-[7.5px] sm:text-[8px] font-black uppercase flex items-center gap-0.5 shadow-md transition-all cursor-pointer bg-amber-400 hover:bg-amber-300 text-black ring-1 ring-amber-300"
                            title="Clique para voltar ao tamanho normal (1 vaga)"
                          >
                            <Star className="w-2 h-2 fill-black text-black" />
                            <span>Duplo</span>
                          </button>
                        </div>
                      )}

                      {/* Lado Esquerdo: Selos, Título Comercial e Bloco de Preços (Estilo TV Banner) */}
                      <div className="w-[46%] sm:w-[48%] flex flex-col justify-between p-2 sm:p-2.5 min-w-0 z-10 select-none">
                        {/* Topo do Lado Esquerdo: Selos e Nome do Produto */}
                        <div className="flex flex-col items-start gap-1 min-w-0">
                          {/* Selo Promocional + Pílula de Unidade */}
                          <div className="flex flex-wrap items-center gap-1 max-w-full">
                            {item.badge && (
                              <span 
                                className={`${
                                  effectiveRows >= 4 ? 'text-[7px] px-1 py-0.2' :
                                  effectiveRows === 3 ? 'text-[7.5px] sm:text-[8px] px-1.5 py-0.5' :
                                  'text-[8.5px] sm:text-[9px] px-2 py-0.5'
                                } uppercase font-black rounded-md shadow-md text-center tracking-wider truncate inline-block max-w-full`}
                                style={{
                                  backgroundColor: item.badgeBgColor || itemStyles.badgeBgColor || theme.badgeBg || '#FACC15',
                                  color: item.badgeTextColor || itemStyles.badgeTextColor || theme.badgeText || '#000000',
                                }}
                              >
                                {item.badge}
                              </span>
                            )}

                            <span 
                              style={{
                                background: paletaHarmonica.unitPillBackground,
                                color: paletaHarmonica.unitPillTextColor,
                                border: paletaHarmonica.unitPillBorder,
                              }}
                              className={`${
                                effectiveRows >= 4 ? 'text-[6px] px-1 py-0.2' :
                                effectiveRows === 3 ? 'text-[7px] px-1.5 py-0.5' :
                                'text-[8px] px-1.5 py-0.5'
                              } font-black uppercase rounded shadow-sm whitespace-nowrap inline-block`}
                            >
                              {item.unit || 'UN'}
                            </span>
                          </div>

                          {/* Título Comercial do Produto em Destaque */}
                          <h4 
                            className={`font-black ${
                              effectiveRows >= 4
                                ? 'text-[9.5px] sm:text-[10.5px] line-clamp-2 leading-tight'
                                : effectiveRows === 3
                                ? 'text-[11.5px] sm:text-[13px] md:text-[14px] line-clamp-2 leading-tight'
                                : 'text-sm sm:text-base md:text-lg line-clamp-2 leading-snug'
                            } break-words mt-0.5 text-left`}
                            style={{
                              color: paletaHarmonica.titleColor,
                              textShadow: paletaHarmonica.titleShadow,
                            }}
                            title={item.title}
                          >
                            {item.title}
                          </h4>
                        </div>

                        {/* Base do Lado Esquerdo: De R$ ... e Etiqueta de Preço de Supermercado */}
                        <div className="flex flex-col items-start w-full mt-auto pt-1 shrink-0">
                          {item.originalPrice && (
                            <div 
                              className={`${
                                effectiveRows >= 4 ? 'text-[7.5px]' :
                                effectiveRows === 3 ? 'text-[8.5px] sm:text-[9.5px]' :
                                'text-[10px] sm:text-[11px]'
                              } font-bold text-white/75 line-through tracking-tight mb-0.5 whitespace-nowrap`}
                            >
                              De: R$ {item.originalPrice.replace('R$', '').trim()}
                            </div>
                          )}

                          <div className="flex items-end justify-between gap-1 w-full min-w-0">
                            <EtiquetaPrecoPromocional
                              price={item.price}
                              originalPrice={undefined}
                              unit={item.unit}
                              themeStyle={{
                                priceBg: item.customStyles?.priceBoxBgColor || itemStyles.priceBoxBgColor || theme.priceBg || '#ea580c',
                                priceText: item.customStyles?.priceBoxTextColor || itemStyles.priceBoxTextColor || theme.priceText || '#ffffff',
                              }}
                              size={effectiveRows >= 4 ? 'compact' : effectiveRows === 3 ? 'xs' : 'sm'}
                            />

                            {item.discountPercentage && item.discountPercentage > 0 && (
                              <div className="text-right shrink-0 flex flex-col items-end justify-center min-w-0 pb-0.5 pl-0.5">
                                <span className={`font-black text-red-400 block leading-none uppercase whitespace-nowrap ${
                                  effectiveRows >= 4 ? 'text-[5.5px]' :
                                  effectiveRows === 3 ? 'text-[6.5px] sm:text-[7px]' :
                                  'text-[7.5px] sm:text-[8.5px]'
                                }`}>
                                  {effectiveRows >= 4 ? 'ECON.' : 'ECONOMIZE'}
                                </span>
                                <span className={`font-black text-amber-400 leading-none mt-0.5 whitespace-nowrap ${
                                  effectiveRows >= 4 ? 'text-[7.5px]' :
                                  effectiveRows === 3 ? 'text-[8.5px] sm:text-[9.5px]' :
                                  'text-[10px] sm:text-[11px]'
                                }`}>
                                  -{item.discountPercentage}%
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Lado Direito: Foto Comercial em Super Destaque Estilo TV 16:9 */}
                      <div className="w-[54%] sm:w-[52%] p-1 sm:p-1.5 flex items-center justify-center relative overflow-hidden select-none">
                        <div 
                          className={`relative w-full h-full rounded-xl sm:rounded-2xl overflow-hidden border-[2.5px] sm:border-[3px] shadow-[0_14px_32px_rgba(0,0,0,0.8)] flex items-center justify-center transition-transform group-hover:scale-[1.01] ${
                            item.imageDisplayMode !== 'contain'
                              ? 'bg-neutral-950'
                              : 'bg-gradient-to-b from-[#f8fafc] via-[#ffffff] to-[#eef2f6]'
                          }`}
                          style={{
                            borderColor: itemStyles.cardBorderColor || effectiveStyles.cardBorderColor || '#fbbf24',
                          }}
                        >
                          {item.imageDisplayMode !== 'contain' ? (
                            /* MODO 1: FOTOGRAFIA COMERCIAL AMBIENTADA (Full-Bleed, Preenche Todo o Card Sem Bordas Pretas) */
                            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                              <img
                                crossOrigin="anonymous"
                                src={item.imageUrl}
                                alt={item.title}
                                onError={(e) => handleImageError(e, item.title, item.category)}
                                className="w-full h-full object-cover object-center transform group-hover:scale-105 transition-transform duration-500 pointer-events-none"
                                referrerPolicy="no-referrer"
                                loading="lazy"
                              />
                              {/* Ambient Vignette & Inner Glow */}
                              <div className="absolute inset-0 shadow-[inset_0_0_20px_rgba(0,0,0,0.35)] pointer-events-none" />
                            </div>
                          ) : (
                            /* MODO 2: PACKSHOT RECORTADO STUDIO WHITE COM PEDESTAL */
                            <div className="absolute inset-0 flex items-center justify-center p-1.5 overflow-hidden pointer-events-none">
                              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white via-white/80 to-slate-100/60 pointer-events-none" />
                              <div className="absolute bottom-1 w-3/4 h-2 bg-black/30 rounded-full blur-sm pointer-events-none" />
                              <img
                                crossOrigin="anonymous"
                                src={item.imageUrl}
                                alt={item.title}
                                onError={(e) => handleImageError(e, item.title, item.category)}
                                className="relative z-10 w-auto h-auto max-h-full max-w-full object-contain drop-shadow-[0_8px_18px_rgba(0,0,0,0.45)] transform group-hover:scale-105 transition-transform duration-300 pointer-events-none"
                                referrerPolicy="no-referrer"
                                loading="lazy"
                              />
                            </div>
                          )}
                        </div>

                        {/* Dica de arrasto sutil (no-export) */}
                        {!isExporting && (
                          <div className="absolute bottom-1 right-1 z-20 no-export opacity-0 group-hover:opacity-60 transition-opacity text-[8px] font-bold text-neutral-400 flex items-center gap-0.5 pointer-events-none">
                            <GripVertical className="w-2 h-2" />
                            <span>Arraste</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                }

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
                    onDragLeave={(e) => {
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
                      background: paletaHarmonica.cardBackground,
                      border: itemStyles.cardBorderColor ? `1px solid ${itemStyles.cardBorderColor}` : paletaHarmonica.cardBorder,
                      boxShadow: paletaHarmonica.cardShadow,
                    }}
                    className={`group relative rounded-xl sm:rounded-2xl overflow-hidden transition-all flex flex-col justify-between cursor-grab active:cursor-grabbing select-none h-full min-h-0 ${
                      isDragging ? 'opacity-35 scale-95 border-dashed border-amber-400' : ''
                    } ${
                      isDragOver ? 'ring-2 ring-amber-400 scale-[1.02]' : ''
                    }`}
                    title="Arraste para mover de posição ou clique para editar este produto"
                  >
                    {/* Header Superior do Card: Badge à esquerda, Ações e Unidade à direita (sem sobreposição) */}
                    <div className="absolute top-1.5 inset-x-1.5 z-20 flex items-start justify-between gap-1 pointer-events-none">
                      {/* Left: Badge Promocional */}
                      <div className="pointer-events-auto shrink-0 max-w-[62%]">
                        {item.badge && (
                          <span 
                            className={`${
                              effectiveRows >= 4 ? 'text-[7px] px-1 py-0.2' :
                              effectiveRows === 3 ? 'text-[7.5px] sm:text-[8px] px-1.5 py-0.5' :
                              'text-[8.5px] sm:text-[9.5px] px-2 py-0.5'
                            } uppercase font-black rounded-md shadow-md text-center tracking-wider truncate block`}
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
                            className={`no-export px-1 py-0.5 rounded text-[7.5px] sm:text-[8px] font-black uppercase flex items-center gap-0.5 shadow-sm transition-all cursor-pointer ${
                              isHero
                                ? 'bg-amber-400 hover:bg-amber-300 text-black ring-1 ring-amber-300'
                                : 'bg-black/60 hover:bg-black/90 text-neutral-200 hover:text-amber-300 border border-white/25 backdrop-blur-xs'
                            }`}
                            title={isHero ? 'Clique para voltar ao tamanho normal (1 vaga)' : 'Clique para tornar DUPLO (2 vagas de destaque)'}
                          >
                            <Star className={`w-2 h-2 ${isHero ? 'fill-black text-black' : 'text-amber-400'}`} />
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
                            effectiveRows >= 4 ? 'text-[6px] px-1 py-0.2' :
                            effectiveRows === 3 ? 'text-[7px] px-1.5 py-0.5' :
                            'text-[8px] sm:text-[9px] px-1.5 py-0.5'
                          }`}
                        >
                          {item.unit || 'UN'}
                        </span>
                      </div>
                    </div>

                    {/* Product Image Frame com Pedestal Estúdio: flex-1 elástico para auto-ajuste perfeito sem estourar o card */}
                    <div className="relative flex-1 min-h-[46px] w-full pt-6 pb-1 px-1.5 flex items-center justify-center overflow-hidden">
                      {/* Halo Iluminado do Packshot */}
                      <div 
                        className="absolute inset-0 pointer-events-none rounded-t-xl"
                        style={{ background: paletaHarmonica.imagePedestalGradient }}
                      />
                      <div className="absolute bottom-1 w-3/4 h-2 bg-black/40 rounded-full blur-sm" />

                      <img
                        crossOrigin="anonymous"
                        src={item.imageUrl}
                        alt={item.title}
                        onError={(e) => handleImageError(e, item.title, item.category)}
                        className="relative z-10 w-auto h-auto max-h-full max-w-[90%] object-contain drop-shadow-[0_4px_14px_rgba(0,0,0,0.65)] transform group-hover:scale-105 transition-transform duration-200"
                        style={{
                          maxHeight: 
                            effectiveRows >= 4 || columns >= 4 ? '70px' :
                            effectiveRows === 3 || columns === 3 ? '100px' :
                            '150px',
                        }}
                        referrerPolicy="no-referrer"
                        loading="lazy"
                      />
                    </div>

                    {/* Product Title (Nitidez Máxima WCAG AAA) - shrink-0 garantido */}
                    <div className="px-1.5 sm:px-2 pt-0.5 pb-0.5 text-left shrink-0">
                      <h4 
                        className={`font-black ${
                          effectiveRows >= 4 || columns >= 4
                            ? 'text-[7px] sm:text-[7.5px] line-clamp-1 leading-tight'
                            : effectiveRows === 3 || columns === 3
                            ? 'text-[8.5px] sm:text-[9.5px] line-clamp-1 leading-tight'
                            : 'text-xs sm:text-sm line-clamp-2 leading-snug'
                        } break-words`}
                        style={{
                          color: paletaHarmonica.titleColor,
                          textShadow: paletaHarmonica.titleShadow,
                        }}
                        title={item.title}
                      >
                        {item.title}
                      </h4>
                    </div>

                    {/* Supermarket Orange Price Section (Rodapé do Card Integrado) - shrink-0 garantido */}
                    <div 
                      style={{
                        background: paletaHarmonica.priceBarBackground,
                        borderTop: paletaHarmonica.priceBarBorder,
                      }}
                      className={`${
                        effectiveRows >= 4 || columns >= 4 ? 'px-1 py-0.5' :
                        effectiveRows === 3 || columns === 3 ? 'px-1.5 py-0.5' :
                        'px-2 py-1'
                      } flex items-center justify-between gap-1 min-w-0 shrink-0`}
                    >
                      <EtiquetaPrecoPromocional
                        price={item.price}
                        originalPrice={item.originalPrice}
                        unit={item.unit}
                        themeStyle={{
                          priceBg: item.customStyles?.priceBoxBgColor || itemStyles.priceBoxBgColor || theme.priceBg || '#ea580c',
                          priceText: item.customStyles?.priceBoxTextColor || itemStyles.priceBoxTextColor || theme.priceText || '#ffffff',
                        }}
                        size={effectiveRows >= 4 || columns >= 4 ? 'compact' : effectiveRows === 3 || columns === 3 ? 'xs' : 'sm'}
                      />

                      {/* Economy Tag */}
                      {item.discountPercentage && item.discountPercentage > 0 && (
                        <div className="text-right shrink-0 flex flex-col items-end justify-center min-w-0 pl-0.5">
                          {columns < 4 && (
                            <span className={`font-black text-red-400 block leading-none uppercase whitespace-nowrap ${
                              effectiveRows >= 4 ? 'text-[5px]' :
                              effectiveRows === 3 || columns >= 3 ? 'text-[6px]' : 'text-[7.5px]'
                            }`}>
                              {columns >= 3 || effectiveRows >= 3 ? 'ECON.' : 'ECONOMIZE'}
                            </span>
                          )}
                          <span className={`font-black text-amber-400 leading-none mt-0.5 whitespace-nowrap ${
                            effectiveRows >= 4 || columns >= 4 ? 'text-[6.5px]' :
                            effectiveRows === 3 || columns === 3 ? 'text-[7.5px]' : 'text-[9.5px]'
                          }`}>
                            -{item.discountPercentage}%
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Dica de arrasto sutil no rodapé ao passar o mouse */}
                    {!isExporting && (
                      <div className="absolute bottom-1 right-1 z-10 no-export opacity-0 group-hover:opacity-60 transition-opacity text-[8px] font-bold text-neutral-400 flex items-center gap-0.5 pointer-events-none">
                        <GripVertical className="w-2 h-2" />
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
          className={`${
            effectiveRows >= 4 ? 'p-1.5' : 'p-2 sm:p-2.5'
          } text-neutral-200 text-xs shrink-0`}
          style={{ 
            fontFamily: "'Montserrat', sans-serif",
            background: paletaHarmonica.footerBackground,
            borderTop: paletaHarmonica.footerBorder,
          }}
        >
          <div className="flex flex-wrap items-center justify-between gap-1 pb-1 border-b border-white/10">
            {/* Accepted Payments */}
            <div className="flex items-center gap-1 min-w-0">
              <CreditCard className={`${effectiveRows >= 4 ? 'w-3 h-3' : 'w-3.5 h-3.5'} text-amber-400 shrink-0`} />
              <span className={`${effectiveRows >= 4 ? 'text-[7.5px]' : 'text-[9px] sm:text-[9.5px]'} font-bold text-neutral-200 truncate`}>
                Aceitamos PIX, Todos os Cartões e Vales Alimentação
              </span>
            </div>

            {/* Direct Contact - WHATSAPP INTEGRAL EM LINHA ÚNICA SEM QUEBRA */}
            <div className={`flex items-center gap-1 ${effectiveRows >= 4 ? 'text-[8px]' : 'text-[9px] sm:text-[10px]'} font-medium text-amber-400 whitespace-nowrap shrink-0 ml-auto antialiased`}>
              <Phone className={`${effectiveRows >= 4 ? 'w-3 h-3' : 'w-3.5 h-3.5'} text-amber-400 shrink-0`} />
              <span className="whitespace-nowrap tracking-normal">{campaign.phoneWhatsapp ? `WhatsApp: ${formatarTelefoneWhatsapp(campaign.phoneWhatsapp, '(41) 9 9999 - 9999')}` : 'Fale Conosco'}</span>
            </div>
          </div>

          {/* Linha 2: Endereço da Unidade (Esquerda) e Desenvolvido por playcomunique.com.br (Direita em Amarelo Ouro) */}
          <div className="pt-1 flex items-center justify-between gap-1 text-[7px] sm:text-[8px] text-neutral-300/80">
            <div className="flex items-center gap-1 min-w-0">
              <MapPin className="w-2.5 h-2.5 text-amber-500 shrink-0" />
              <span className="truncate">{campaign.storeAddress || 'Consulte a unidade mais próxima de você.'}</span>
            </div>
            <div className="text-right shrink-0 ml-auto whitespace-nowrap pl-1">
              <span 
                className={`${
                  effectiveRows >= 4 ? 'text-[6.8px]' : 'text-[7.5px] sm:text-[8.5px]'
                } font-bold tracking-tight inline-block drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]`}
                style={{ color: '#FFD700' }}
              >
                Desenvolvido por playcomunique.com.br
              </span>
            </div>
          </div>

          {/* Linha 3: Mensagem Legal / Proibido Bebidas Centralizada em Todos os Tablóides */}
          <div className="pt-0.5 text-center w-full">
            <span 
              className={`${
                effectiveRows >= 4 ? 'text-[6px]' : 'text-[6.8px] sm:text-[7.5px]'
              } text-neutral-400/90 tracking-tight text-center block leading-tight truncate`}
              title={campaign.legalNotice || 'Imagens meramente ilustrativas; Proibido a venda de bebidas alcoólicas a menores de 18 anos!'}
            >
              {campaign.legalNotice || 'Imagens meramente ilustrativas; Proibido a venda de bebidas alcoólicas a menores de 18 anos!'}
            </span>
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
