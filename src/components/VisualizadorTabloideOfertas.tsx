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
  Grid
} from 'lucide-react';
import { BannerCampaign, ThemeColors, ProductItem } from '../tiposGeradorBanner';
import { EtiquetaPrecoPromocional } from './EtiquetaPrecoPromocional';
import { handleImageError } from '../utils/imageFallback';
import { downloadElementAsPng } from '../utils/ajudanteExportacao';
import { toCanvas } from 'html-to-image';

interface VisualizadorTabloideOfertasProps {
  campaign: BannerCampaign;
  theme: ThemeColors;
  onUpdateCampaign?: (updated: Partial<BannerCampaign>) => void;
  onSelectProductIndex?: (index: number) => void;
}

export const VisualizadorTabloideOfertas: React.FC<VisualizadorTabloideOfertasProps> = ({ 
  campaign, 
  theme,
  onUpdateCampaign,
  onSelectProductIndex,
}) => {
  // Grid Columns: 1, 2, 3 or 4 (default: 2 for mobile/whatsapp screens)
  const columns = campaign.tabloidColumns || 2;
  // Grid Rows: 2, 3, 4, 5, 6 or 0 for all (default: 3 rows = 6 items)
  const rows = campaign.tabloidRows !== undefined ? campaign.tabloidRows : 3;
  // Target format preset: 'whatsapp-mobile' | 'instagram-feed' | 'classic-a4'
  const targetPreset = campaign.tabloidTarget || 'whatsapp-mobile';

  // Product Selection State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const isBelissima = 
    campaign.clientName.toLowerCase().includes('belíssima') || 
    campaign.clientName.toLowerCase().includes('belissima') ||
    (campaign.clientLogoUrl && campaign.clientLogoUrl.includes('belissima'));

  // Calculate slots available
  const totalSlots = rows === 0 ? campaign.products.length : columns * rows;

  // Selected products for the tabloid
  const activeSelectedIds = useMemo(() => {
    if (campaign.tabloidSelectedProductIds && campaign.tabloidSelectedProductIds.length > 0) {
      return campaign.tabloidSelectedProductIds;
    }
    // Default: first N products
    return campaign.products.slice(0, totalSlots).map(p => p.id);
  }, [campaign.tabloidSelectedProductIds, campaign.products, totalSlots]);

  // Filtered products list to render in the grid
  const productsToRender: ProductItem[] = useMemo(() => {
    if (activeSelectedIds.length > 0) {
      const selected = campaign.products.filter(p => activeSelectedIds.includes(p.id));
      if (selected.length > 0) {
        return rows === 0 ? selected : selected.slice(0, totalSlots);
      }
    }
    return rows === 0 ? campaign.products : campaign.products.slice(0, totalSlots);
  }, [campaign.products, activeSelectedIds, totalSlots, rows]);

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

  // Auto-fill exactly the number of slots
  const handleFillSlots = () => {
    const fillIds = campaign.products.slice(0, totalSlots).map(p => p.id);
    if (onUpdateCampaign) {
      onUpdateCampaign({ tabloidSelectedProductIds: fillIds });
    }
    setToastMessage(`✅ ${fillIds.length} produtos preenchidos automaticamente para as ${totalSlots} vagas.`);
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

    setToastMessage('Copiando imagem para WhatsApp Web...');
    try {
      const canvas = await toCanvas(el, {
        quality: 1.0,
        pixelRatio: 2,
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
        className={`w-full ${containerMaxWidth} bg-neutral-950 border-2 border-amber-500/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col justify-between select-none transition-all duration-300`}
        style={{
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.9), 0 0 30px rgba(245, 158, 11, 0.15)',
        }}
      >
        {/* ============================================================ */}
        {/* CABEÇALHO OFICIAL DO TABLÓIDE: VISÍVEL, IMPONENTE E INTEGRAL */}
        {/* ============================================================ */}
        <div 
          id="tabloid-header"
          className="relative p-3.5 sm:p-4 text-white flex flex-col justify-center border-b-4 border-amber-400 overflow-hidden"
          style={{ 
            background: campaign.customStyles?.bannerBgGradient || `linear-gradient(135deg, ${theme.primary} 0%, #06331e 60%, #031a0f 100%)`,
            fontFamily: campaign.customStyles?.campaignTitleFont || "'Montserrat', sans-serif"
          }}
        >
          {/* Subtle geometric pattern watermark */}
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
          <div className="absolute top-0 right-0 w-80 h-80 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />

          {/* Top Row: Client Logo & Campaign Master Title + Validity */}
          <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between w-full gap-2.5 sm:gap-3.5">
            {/* Store Brand / Official Logo */}
            <div className="flex items-center justify-center shrink-0">
              {campaign.showClientLogo !== false && (
                isBelissima ? (
                  <img 
                    crossOrigin="anonymous"
                    src="/logos/belissima-casa-di-frutas.png"
                    alt={campaign.clientName || 'Belíssima Casa di Frutas'}
                    className="max-h-13 sm:max-h-14 md:max-h-15 w-auto object-contain drop-shadow-[0_4px_14px_rgba(0,0,0,0.8)]"
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
                    className="max-h-13 sm:max-h-14 md:max-h-15 w-auto object-contain drop-shadow-[0_4px_14px_rgba(0,0,0,0.8)]"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="bg-amber-400 text-black font-black text-lg sm:text-xl px-4 py-2 rounded-xl shadow-lg font-['Montserrat'] tracking-tight">
                    {campaign.clientName || 'SUPERMERCADO'}
                  </div>
                )
              )}
            </div>

            {/* Campaign Headline & Validity Section */}
            {(() => {
              const defaultVal1 = 'Ofertas válidas de 10 a 22/09/2026 ou enquanto durarem os estoques';
              const defaultVal2 = 'Ofertas válidas até domingo ou enquanto durarem os estoques';
              
              // Determina o texto de validade com prioridade inteligente
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

              // Verifica se o subtítulo é um slogan real ou se duplica a validade
              const isSubtitleValid = 
                campaign.campaignSubtitle &&
                campaign.campaignSubtitle.trim().toLowerCase() !== validityDisplay.trim().toLowerCase() &&
                !campaign.campaignSubtitle.toLowerCase().includes('válid');

              // Escala de fonte inteligente para garantir exibição 100% integral sem corte (evita estourar o container em desktop)
              const validityFontSize = 
                validityDisplay.length > 52
                  ? 'text-[6.8px] sm:text-[7.2px]'
                  : validityDisplay.length > 38
                  ? 'text-[7.2px] sm:text-[7.8px]'
                  : 'text-[7.8px] sm:text-[8.5px]';

              return (
                <div className="flex-1 min-w-0 w-full flex flex-col items-center sm:items-end text-center sm:text-right justify-start">
                  {/* Título Superior da Campanha (Cabeçalho) - Totalmente Visível Sem Cortar ou Sobrepor */}
                  <h1 
                    className="w-full text-base sm:text-lg md:text-xl lg:text-[22px] font-black uppercase text-amber-300 drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] tracking-tight leading-tight block break-words"
                    style={{
                      fontFamily: campaign.customStyles?.campaignTitleFont || "'Montserrat', sans-serif",
                      height: 'auto',
                      minHeight: 'fit-content'
                    }}
                  >
                    {campaign.campaignTitle || 'FESTIVAL DE OFERTAS'}
                  </h1>

                  {/* Subtítulo / Slogan (apenas se for slogan real) */}
                  {isSubtitleValid && (
                    <span 
                      className="text-[10px] sm:text-[11px] text-white/80 font-medium uppercase tracking-wider mt-0.5 drop-shadow truncate max-w-full block"
                      style={{ fontFamily: "'Montserrat', sans-serif" }}
                    >
                      {campaign.campaignSubtitle}
                    </span>
                  )}

                  {/* Texto de Validade das Ofertas - Linha Única Integral Sem Cortes em Linha Própria Separada */}
                  <div className="mt-1.5 w-full flex items-center justify-center sm:justify-end clear-both">
                    <div 
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-black/60 border border-white/20 ${validityFontSize} text-amber-200/95 font-semibold whitespace-nowrap max-w-full shadow-sm`}
                      style={{ fontFamily: "'Montserrat', sans-serif" }}
                    >
                      <Calendar className="w-2.5 h-2.5 text-amber-400/90 shrink-0" />
                      <span className="uppercase whitespace-nowrap tracking-tight">{validityDisplay}</span>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Sub Row: WhatsApp Direct Order Banner (sem frases redundantes) */}
          <div className="relative z-10 mt-2.5 w-full flex items-center justify-center sm:justify-start pt-2 border-t border-white/15">
            {/* WhatsApp CTA Call */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-700/90 border border-emerald-400/50 text-white text-xs font-bold shadow-sm">
              <MessageCircle className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
              <span>Peça no WhatsApp: {campaign.phoneWhatsapp || '(11) 98765-4321'}</span>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* CORPO DO TABLÓIDE: GRADE DE OFERTAS MULTI-COLUNA E MULTI-LINHA */}
        {/* ============================================================ */}
        <div className="p-3 sm:p-4 bg-gradient-to-b from-[#0a0a0a] via-[#111111] to-[#0a0a0a] flex-1">
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
              className={`grid gap-2.5 sm:gap-3.5 ${
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

                return (
                  <div
                    key={item.id || idx}
                    onClick={() => {
                      if (onSelectProductIndex) {
                        const originalIdx = campaign.products.findIndex(p => p.id === item.id);
                        if (originalIdx !== -1) onSelectProductIndex(originalIdx);
                      }
                    }}
                    className={`group relative rounded-xl overflow-hidden border transition-all flex flex-col justify-between cursor-pointer select-none ${
                      isHero && columns > 1
                        ? 'col-span-2 bg-gradient-to-br from-neutral-900 via-neutral-850 to-neutral-950 border-amber-400 shadow-xl'
                        : 'bg-neutral-900/95 border-neutral-800 hover:border-amber-500/60 shadow-md hover:shadow-xl'
                    }`}
                  >
                    {/* Badge Promotional Stamp Top Left */}
                    {item.badge && (
                      <div className="absolute top-2 left-2 z-10">
                        <span 
                          className="text-[9px] sm:text-[10px] uppercase font-black px-2 py-0.5 rounded-md shadow-md text-center tracking-wider whitespace-nowrap block"
                          style={{
                            backgroundColor: item.badgeBgColor || theme.badgeBg || '#FACC15',
                            color: item.badgeTextColor || theme.badgeText || '#000000',
                          }}
                        >
                          {item.badge}
                        </span>
                      </div>
                    )}

                    {/* Unit Pill Top Right - Totalmente Visível Sem Cortar */}
                    <div className="absolute top-2 right-2 z-10">
                      <span className={`font-black uppercase rounded bg-black/85 text-amber-300 border border-white/15 shadow-sm whitespace-nowrap inline-block ${
                        columns === 1 
                          ? 'text-[10px] px-2 py-0.5' 
                          : columns === 2 
                          ? 'text-[9px] px-1.5 py-0.5' 
                          : columns === 3 
                          ? 'text-[7.5px] px-1 py-0.5' 
                          : 'text-[6.5px] px-1 py-0.2'
                      }`}>
                        {item.unit || 'UN'}
                      </span>
                    </div>

                    {/* Product Image Frame */}
                    <div className={`relative pt-7 pb-2 px-2 flex items-center justify-center ${
                      columns === 1 
                        ? 'min-h-[180px] sm:min-h-[220px]' 
                        : columns === 2 
                        ? 'min-h-[140px] sm:min-h-[170px]' 
                        : columns === 3
                        ? 'min-h-[110px] sm:min-h-[130px]'
                        : 'min-h-[95px] sm:min-h-[115px]'
                    }`}>
                      <div className="absolute bottom-2 w-3/4 h-4 bg-black/60 rounded-full blur-md" />
                      <img
                        crossOrigin="anonymous"
                        src={item.imageUrl}
                        alt={item.title}
                        onError={(e) => handleImageError(e, item.title, item.category)}
                        className={`relative z-10 w-auto object-contain drop-shadow-[0_8px_16px_rgba(0,0,0,0.6)] transform group-hover:scale-105 transition-transform duration-300 ${
                          columns === 1 
                            ? 'max-h-40 sm:max-h-48' 
                            : columns === 2 
                            ? 'max-h-28 sm:max-h-36' 
                            : columns === 3
                            ? 'max-h-22 sm:max-h-26'
                            : 'max-h-18 sm:max-h-22'
                        }`}
                        referrerPolicy="no-referrer"
                        loading="lazy"
                      />
                    </div>

                    {/* Product Title (Exibe o Nome Comercial por Inteiro em até 3 Linhas, sem a marca em amarelo) */}
                    <div className="px-2.5 pt-1 pb-1.5 text-left flex-1 flex flex-col justify-start">
                      <h4 
                        className={`font-black text-white line-clamp-3 leading-snug break-words ${
                          columns === 1 
                            ? 'text-sm sm:text-base' 
                            : columns === 2 
                            ? 'text-xs sm:text-sm' 
                            : columns === 3 
                            ? 'text-[10px] sm:text-[11px]' 
                            : 'text-[9px] sm:text-[10px]'
                        }`}
                        title={item.title}
                      >
                        {item.title}
                      </h4>
                    </div>

                    {/* Supermarket Orange Price Section */}
                    <div className={`${columns >= 3 ? 'px-1.5 pb-2 pt-1' : 'px-2.5 pb-2.5 pt-1'} bg-black/60 border-t border-neutral-800 flex items-center justify-between gap-1 min-w-0`}>
                      <EtiquetaPrecoPromocional
                        price={item.price}
                        originalPrice={item.originalPrice}
                        unit={item.unit}
                        themeStyle={{
                          priceBg: item.customStyles?.priceBoxBgColor || theme.priceBg || '#ea580c',
                          priceText: item.customStyles?.priceBoxTextColor || theme.priceText || '#ffffff',
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
          className="p-3 sm:p-4 bg-black border-t-2 border-amber-500/40 text-neutral-300 text-xs"
          style={{ fontFamily: "'Montserrat', sans-serif" }}
        >
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-neutral-800">
            {/* Accepted Payments */}
            <div className="flex items-center gap-1.5 min-w-0">
              <CreditCard className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="text-[10px] sm:text-[11px] font-bold text-neutral-200 truncate">
                Aceitamos PIX, Todos os Cartões e Vales Alimentação
              </span>
            </div>

            {/* Direct Contact - WHATSAPP INTEGRAL EM LINHA ÚNICA SEM QUEBRA */}
            <div className="flex items-center gap-1 text-[10.5px] sm:text-[11.5px] font-black text-amber-400 whitespace-nowrap shrink-0 ml-auto">
              <Phone className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="whitespace-nowrap tracking-tight">{campaign.phoneWhatsapp ? `WhatsApp: ${campaign.phoneWhatsapp}` : 'Fale Conosco'}</span>
            </div>
          </div>

          {/* Address & Legal text */}
          <div className="pt-2 flex flex-wrap items-center justify-between gap-2 text-[8.5px] sm:text-[9.5px] text-neutral-400">
            <div className="flex items-center gap-1 min-w-0">
              <MapPin className="w-3 h-3 text-amber-500 shrink-0" />
              <span className="truncate">{campaign.storeAddress || 'Consulte a unidade mais próxima de você.'}</span>
            </div>
            <div className="text-right text-neutral-500 shrink-0 ml-auto">
              <span>{campaign.legalNotice || 'Imagens meramente ilustrativas. Ofertas válidas enquanto durarem os estoques.'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* MODAL INTERATIVO: ESCOLHER QUAIS IMAGENS / PRODUTOS EXIBIR   */}
      {/* ============================================================ */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-3xl max-h-[85vh] bg-neutral-900 border-2 border-amber-400/50 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 bg-neutral-950 border-b border-neutral-800 flex items-center justify-between">
              <div>
                <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                  <SlidersHorizontal className="w-5 h-5 text-amber-400" />
                  <span>Escolher Imagens e Produtos do Tablóide</span>
                </h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Selecione exatamente quais produtos serão exibidos na lâmina ({activeSelectedIds.length} selecionados para {totalSlots} vagas).
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
                  className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-black font-extrabold rounded-lg cursor-pointer transition-colors"
                >
                  Preencher Vagas ({totalSlots})
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

              <span className="text-neutral-400 font-bold">
                Total disponível: {campaign.products.length} banners
              </span>
            </div>

            {/* Products Grid to Check/Uncheck */}
            <div className="p-4 overflow-y-auto flex-1 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 bg-neutral-900">
              {campaign.products.map((prod, idx) => {
                const isSelected = activeSelectedIds.includes(prod.id);

                return (
                  <div
                    key={prod.id}
                    onClick={() => handleToggleProductSelection(prod.id)}
                    className={`relative p-2.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-amber-500/10 border-amber-400 ring-2 ring-amber-400/30 shadow-md'
                        : 'bg-neutral-950 border-neutral-800 opacity-60 hover:opacity-100'
                    }`}
                  >
                    {/* Checkbox indicator */}
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-black text-neutral-400">#{idx + 1}</span>
                      {isSelected ? (
                        <CheckSquare className="w-5 h-5 text-amber-400" />
                      ) : (
                        <Square className="w-5 h-5 text-neutral-600" />
                      )}
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

                    {/* Title & Price */}
                    <div>
                      <h5 className="text-[11px] font-bold text-white line-clamp-1 leading-tight">
                        {prod.title}
                      </h5>
                      <span className="text-xs font-black text-amber-400 mt-1 block">
                        R$ {prod.price} <span className="text-[9px] text-neutral-400 font-normal">/{prod.unit}</span>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-neutral-950 border-t border-neutral-800 flex items-center justify-between">
              <span className="text-xs text-neutral-400">
                {activeSelectedIds.length} produto{activeSelectedIds.length !== 1 ? 's' : ''} ativo{activeSelectedIds.length !== 1 ? 's' : ''} no tablóide
              </span>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs shadow-lg transition-transform active:scale-95 cursor-pointer"
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
