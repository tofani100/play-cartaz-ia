import React, { useState, useRef } from 'react';
import { 
  Plus, 
  Trash2, 
  Image as ImageIcon, 
  Sparkles, 
  Check, 
  Search,
  Tag,
  Star,
  Upload,
  RefreshCw,
  Copy,
  SlidersHorizontal,
  Eye,
  EyeOff,
  Download,
  Film,
  Loader2,
  Palette,
  ChevronDown,
  ChevronUp,
  Type,
  Tv,
  Clock,
  MessageSquare,
  MapPin,
  Calendar,
  Layers,
  RotateCcw,
  Sliders,
  Store
} from 'lucide-react';
import { ProductItem, CuratedProduct, BannerCampaign, ThemeColors, BannerCustomStyles, AnimationEffect } from '../tiposGeradorBanner';
import { BANCO_PRODUTOS_COMERCIAIS } from '../data/bancoProdutosComerciais';
import { MODELOS_BANNERS_MERCADO, FONTES_COMERCIAIS_RECOMENDADAS } from '../data/modelosBannersMercado';
import { handleImageError } from '../utils/imageFallback';
import { downloadElementAsPng, gerarVideoAnimadoProdutoIndividual } from '../utils/ajudanteExportacao';
import { buildCommercialProductPrompts, copyTextToClipboard } from '../utils/commercialPromptEngine';

const PALETA_CORES_RAPIDAS = [
  { nome: 'Laranja', bg: '#ea580c', text: '#ffffff' },
  { nome: 'Verde', bg: '#15803d', text: '#ffffff' },
  { nome: 'Vermelho', bg: '#dc2626', text: '#ffffff' },
  { nome: 'Azul', bg: '#0284c7', text: '#ffffff' },
  { nome: 'Amarelo', bg: '#eab308', text: '#18181b' },
  { nome: 'Preto', bg: '#18181b', text: '#fde047' },
  { nome: 'Roxo', bg: '#7e22ce', text: '#ffffff' },
  { nome: 'Rosa', bg: '#e11d48', text: '#ffffff' },
];

interface PainelEditorProdutosProps {
  products: ProductItem[];
  currentProductIndex: number;
  onSelectProductIndex: (idx: number) => void;
  onUpdateProduct: (idx: number, updated: Partial<ProductItem>) => void;
  onAddProduct: (product: ProductItem) => void;
  onRemoveProduct: (idx: number) => void;
  showClientLogo?: boolean;
  onToggleShowLogo?: () => void;
  clientName?: string;
  campaign?: BannerCampaign;
  theme?: ThemeColors;
  onUpdateCampaign?: (updated: Partial<BannerCampaign>) => void;
}

export const PainelEditorProdutos: React.FC<PainelEditorProdutosProps> = ({
  products,
  currentProductIndex,
  onSelectProductIndex,
  onUpdateProduct,
  onAddProduct,
  onRemoveProduct,
  showClientLogo = true,
  onToggleShowLogo,
  clientName,
  campaign,
  theme,
  onUpdateCampaign,
}) => {
  const [showCatalogModal, setShowCatalogModal] = useState<boolean>(false);
  const [catalogSearch, setCatalogSearch] = useState<string>('');
  const [catalogCategory, setCatalogCategory] = useState<string>('all');
  const [isSearchingRealImage, setIsSearchingRealImage] = useState<boolean>(false);
  const [isGeneratingAiImage, setIsGeneratingAiImage] = useState<boolean>(false);
  const [isPromptCopied, setIsPromptCopied] = useState<boolean>(false);
  const [downloadingIndex, setDownloadingIndex] = useState<number | null>(null);
  const [recordingVideoIndex, setRecordingVideoIndex] = useState<number | null>(null);
  const [recordingVideoProgress, setRecordingVideoProgress] = useState<number>(0);

  // Escopo de alteração: 'single' (apenas neste banner) ou 'all' (em todos os banners)
  const [customizationScope, setCustomizationScope] = useState<'single' | 'all'>('single');

  // Estado das seções colapsáveis / expansíveis (todas abertas por padrão para rolagem contínua fluida de cima para baixo)
  const [openSections, setOpenSections] = useState<{ [key: string]: boolean }>({
    campanha: true,
    produto: true,
    estilos: true,
    reproducao: true,
  });

  const toggleSection = (sec: string) => {
    setOpenSections((prev) => ({ ...prev, [sec]: !prev[sec] }));
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const productBgInputRef = useRef<HTMLInputElement>(null);
  const clientLogoInputRef = useRef<HTMLInputElement>(null);

  const activeProduct = products[currentProductIndex] || products[0];

  // Fusão de estilos computada em tempo real
  const currentEffectiveStyles: BannerCustomStyles = {
    ...(campaign?.customStyles || {}),
    ...(activeProduct?.customStyles || {}),
    ...(activeProduct?.badgeBgColor ? { badgeBgColor: activeProduct.badgeBgColor } : {}),
    ...(activeProduct?.badgeTextColor ? { badgeTextColor: activeProduct.badgeTextColor } : {}),
    ...(activeProduct?.secondBadgeBgColor ? { secondBadgeBgColor: activeProduct.secondBadgeBgColor } : {}),
    ...(activeProduct?.secondBadgeTextColor ? { secondBadgeTextColor: activeProduct.secondBadgeTextColor } : {}),
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleApplyCustomStyle = (updates: Partial<BannerCustomStyles>) => {
    if (customizationScope === 'single') {
      const existingStyles = activeProduct?.customStyles || {};
      const nextStyles = {
        ...existingStyles,
        ...updates,
      };
      onUpdateProduct(currentProductIndex, {
        customStyles: nextStyles,
        ...(updates.badgeBgColor ? { badgeBgColor: updates.badgeBgColor } : {}),
        ...(updates.badgeTextColor ? { badgeTextColor: updates.badgeTextColor } : {}),
        ...(updates.secondBadgeBgColor ? { secondBadgeBgColor: updates.secondBadgeBgColor } : {}),
        ...(updates.secondBadgeTextColor ? { secondBadgeTextColor: updates.secondBadgeTextColor } : {}),
      });
    } else {
      if (onUpdateCampaign && campaign) {
        const existingStyles = campaign.customStyles || {};
        onUpdateCampaign({
          customStyles: {
            ...existingStyles,
            ...updates,
          },
        });
      }
      // Sincroniza em todos os produtos para que estilos individuais prévios não bloqueiem alterações globais
      products.forEach((p, idx) => {
        onUpdateProduct(idx, {
          customStyles: {
            ...(p.customStyles || {}),
            ...updates,
          },
          ...(updates.badgeBgColor ? { badgeBgColor: updates.badgeBgColor } : {}),
          ...(updates.badgeTextColor ? { badgeTextColor: updates.badgeTextColor } : {}),
          ...(updates.secondBadgeBgColor ? { secondBadgeBgColor: updates.secondBadgeBgColor } : {}),
          ...(updates.secondBadgeTextColor ? { secondBadgeTextColor: updates.secondBadgeTextColor } : {}),
        });
      });
    }
  };

  const handleResetProductStyles = () => {
    onUpdateProduct(currentProductIndex, {
      customStyles: undefined,
      badgeBgColor: undefined,
      badgeTextColor: undefined,
      secondBadgeBgColor: undefined,
      secondBadgeTextColor: undefined,
    });
  };

  const handleDownloadIndividualBanner = async (idx: number) => {
    setDownloadingIndex(idx);
    try {
      onSelectProductIndex(idx);
      await new Promise((r) => setTimeout(r, 280));
      const targetProd = products[idx];
      const cleanTitle = (targetProd?.title || `produto-${idx + 1}`)
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]/g, '-')
        .slice(0, 35);
      const filename = `banner-${cleanTitle}-${Date.now()}.png`;
      await downloadElementAsPng('tv-banner-capture', filename);
    } catch (err) {
      console.error('Erro ao baixar banner individual do produto:', err);
    } finally {
      setDownloadingIndex(null);
    }
  };

  const handleDownloadIndividualVideo = async (idx: number) => {
    if (recordingVideoIndex !== null) return;
    setRecordingVideoIndex(idx);
    setRecordingVideoProgress(5);
    try {
      const activeCampaign: BannerCampaign = campaign || ({
        id: 'campanha-atual',
        campaignTitle: clientName || 'Ofertas da Semana',
        format: '16:9',
        products,
        activeProductIndex: idx,
        clientName: clientName || 'Belíssima Casa di Frutas',
        showClientLogo: showClientLogo !== false,
      } as BannerCampaign);

      const activeTheme: ThemeColors = theme || ({
        id: 'verde-hortifruti' as any,
        name: 'Verde Hortifrúti',
        category: 'Hortifrúti',
        primary: '#10b981',
        secondary: '#f59e0b',
        accent: '#ffffff',
        headerBg: '#06331e',
        headerText: '#ffffff',
        priceBg: '#ea580c',
        priceText: '#ffffff',
        badgeBg: '#10b981',
        badgeText: '#ffffff',
        bgGradient: 'from-[#06331e] to-[#042214]',
        cardBg: '#ffffff',
        textColor: '#ffffff',
      } as ThemeColors);

      await gerarVideoAnimadoProdutoIndividual(
        activeCampaign,
        activeTheme,
        idx,
        6.0,
        (progress) => setRecordingVideoProgress(progress),
        onSelectProductIndex
      );
    } catch (err) {
      console.error('Erro ao baixar banner animado MP4:', err);
      alert('Não foi possível gravar o vídeo deste banner. Tente baixar o banner em imagem PNG.');
    } finally {
      setRecordingVideoIndex(null);
      setRecordingVideoProgress(0);
    }
  };

  const handleSearchRealImage = async () => {
    if (!activeProduct || isSearchingRealImage) return;
    setIsSearchingRealImage(true);
    try {
      const res = await fetch('/api/products/search-real-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `${activeProduct.title} ${activeProduct.brand || ''}`.trim(),
          brand: activeProduct.brand,
          category: activeProduct.category,
        }),
      });
      const data = await res.json();
      if (data && data.success && data.imageUrl) {
        onUpdateProduct(currentProductIndex, { imageUrl: data.imageUrl });
      }
    } catch (err) {
      console.warn('Erro ao buscar foto real:', err);
    } finally {
      setIsSearchingRealImage(false);
    }
  };

  const handleGenerateAiCommercialImage = async () => {
    if (!activeProduct || isGeneratingAiImage) return;
    setIsGeneratingAiImage(true);
    try {
      const res = await fetch('/api/gemini/generate-commercial-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: activeProduct.title,
          brand: activeProduct.brand,
          category: activeProduct.category,
          unit: activeProduct.unit,
          aspectRatio: '4:3',
        }),
      });
      const data = await res.json();
      if (data && data.success && data.imageUrl) {
        onUpdateProduct(currentProductIndex, {
          imageUrl: data.imageUrl,
          imageDisplayMode: 'ambient',
          aiPromptUsed: data.promptUsed,
        });
      }
    } catch (err) {
      console.error('Erro ao gerar banner comercial com IA:', err);
    } finally {
      setIsGeneratingAiImage(false);
    }
  };

  const handleCopyGeminiPrompt = async () => {
    if (!activeProduct) return;
    try {
      const prompts = buildCommercialProductPrompts({
        title: activeProduct.title,
        brand: activeProduct.brand,
        category: activeProduct.category,
        unit: activeProduct.unit,
        businessSegment: campaign?.segment,
      });
      const ok = await copyTextToClipboard(prompts.geminiWebPrompt);
      if (ok) {
        setIsPromptCopied(true);
        setTimeout(() => setIsPromptCopied(false), 3000);
      }
    } catch (err) {
      console.error('Erro ao copiar prompt:', err);
    }
  };

  const filteredCatalog = BANCO_PRODUTOS_COMERCIAIS.filter((item) => {
    const matchesSearch = item.title.toLowerCase().includes(catalogSearch.toLowerCase()) ||
      item.brand.toLowerCase().includes(catalogSearch.toLowerCase()) ||
      item.keywords.some((k) => k.includes(catalogSearch.toLowerCase()));

    const matchesCategory = catalogCategory === 'all' || item.category === catalogCategory;
    return matchesSearch && matchesCategory;
  });

  const handleAddFromCurated = (curated: CuratedProduct) => {
    const newItem: ProductItem = {
      id: `prod-curated-${Date.now()}`,
      title: curated.title,
      brand: curated.brand,
      category: curated.category,
      unit: curated.defaultUnit,
      price: curated.suggestedPrice,
      originalPrice: curated.suggestedOriginalPrice,
      discountPercentage: 20,
      badge: curated.badge,
      imageUrl: curated.imageUrl,
    };
    onAddProduct(newItem);
    setShowCatalogModal(false);
  };

  const handleAddNewBlank = () => {
    const newItem: ProductItem = {
      id: `prod-manual-${Date.now()}`,
      title: 'Novo Produto em Oferta',
      brand: 'Marca',
      category: 'Geral',
      unit: 'unidade',
      price: '9,90',
      originalPrice: '12,90',
      discountPercentage: 23,
      badge: 'OFERTA DO DIA',
      imageUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&auto=format&fit=crop&q=80',
    };
    onAddProduct(newItem);
  };

  return (
    <div className="w-full bg-neutral-900 border-t sm:border-t-0 sm:border-l border-neutral-800 p-3 sm:p-4 flex flex-col gap-3.5">
      {/* Mini Barra de Acesso Rápido às Seções (Alinhada da Lógica de Cima para Baixo) */}
      <div className="sticky -top-4 z-20 bg-neutral-900/95 backdrop-blur-md pb-2 pt-1 border-b border-neutral-800/80 -mx-3 sm:-mx-4 px-3 sm:px-4 flex items-center gap-1.5 overflow-x-auto select-none">
        <button
          type="button"
          onClick={() => scrollToSection('painel-secao-campanha')}
          className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 hover:text-amber-300 text-neutral-200 text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shrink-0 border border-neutral-700/80 transition-all"
        >
          <Layers className="w-3 h-3 text-amber-400" />
          <span>Topo & Identidade</span>
        </button>

        <button
          type="button"
          onClick={() => scrollToSection('painel-secao-produto')}
          className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 hover:text-amber-300 text-neutral-200 text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shrink-0 border border-neutral-700/80 transition-all"
        >
          <Tag className="w-3 h-3 text-amber-400" />
          <span>Item #{currentProductIndex + 1}</span>
        </button>

        <button
          type="button"
          onClick={() => scrollToSection('painel-secao-modelos')}
          className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 hover:text-amber-300 text-neutral-200 text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shrink-0 border border-neutral-700/80 transition-all"
        >
          <Palette className="w-3 h-3 text-amber-400" />
          <span>Modelos & Fundo</span>
        </button>

        <button
          type="button"
          onClick={() => scrollToSection('painel-secao-tv')}
          className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 hover:text-amber-300 text-neutral-200 text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shrink-0 border border-neutral-700/80 transition-all"
        >
          <Tv className="w-3 h-3 text-amber-400" />
          <span>TV Indoor</span>
        </button>
      </div>

      {/* Top action row: Lista de Banners */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-extrabold text-white flex items-center gap-1.5">
            <Tag className="w-4 h-4 text-amber-400" />
            <span>Lista de Banners ({products.length})</span>
          </h3>
          <p className="text-[11px] text-neutral-400">
            {clientName ? `Banners salvos em: ${clientName}` : 'Gerencie os itens do banner e tablóide.'}
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setShowCatalogModal(true)}
            className="px-2.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-amber-300 font-bold text-xs rounded-lg flex items-center gap-1 border border-neutral-700 cursor-pointer"
            title="Adicionar produto da biblioteca comercial com foto em alta"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Catálogo Brasil</span>
          </button>

          <button
            onClick={handleAddNewBlank}
            className="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-black text-xs rounded-lg flex items-center gap-1 shadow cursor-pointer"
            title="Adicionar item em branco"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Novo</span>
          </button>
        </div>
      </div>

      {/* Product List Cards */}
      <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
        {products.map((item, idx) => {
          const isSelected = idx === currentProductIndex;

          return (
            <div
              key={item.id}
              onClick={() => onSelectProductIndex(idx)}
              className={`p-2 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2.5 ${
                item.hidden ? 'opacity-65 border-dashed border-neutral-800 bg-neutral-950/30' : ''
              } ${
                isSelected
                  ? 'border-amber-400 bg-neutral-800/95 ring-1 ring-amber-400/40 shadow-md'
                  : 'border-neutral-800 bg-neutral-950/60 hover:border-neutral-700'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  onError={(e) => handleImageError(e, item.title, item.category)}
                  className="w-9 h-9 object-contain rounded-lg bg-neutral-900 border border-neutral-800 p-0.5 shrink-0"
                  referrerPolicy="no-referrer"
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span 
                      style={{
                        backgroundColor: item.badgeBgColor || (item.customStyles?.badgeBgColor) || theme?.badgeBg || '#1a472a',
                        color: item.badgeTextColor || (item.customStyles?.badgeTextColor) || theme?.badgeText || '#ffffff',
                      }}
                      className="text-[8px] font-black uppercase px-1.5 py-0.2 rounded border border-white/20 shrink-0"
                    >
                      {item.badge || 'OFERTA'}
                    </span>
                    {item.secondBadgeEnabled && item.secondBadge && (
                      <span className="text-[8px] font-bold uppercase px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shrink-0">
                        2º Selo
                      </span>
                    )}
                    {item.hidden && (
                      <span className="text-[8px] font-black uppercase px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 shrink-0">
                        Oculto
                      </span>
                    )}
                  </div>
                  <h4 className={`text-xs font-bold truncate ${item.hidden ? 'text-neutral-400 line-through' : 'text-white'}`}>
                    {item.title}
                  </h4>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <div className="text-right leading-tight pr-1">
                  <div className="text-xs font-black text-amber-400">R$ {item.price}</div>
                  <div className="text-[9px] text-neutral-400">/{item.unit}</div>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownloadIndividualBanner(idx);
                  }}
                  className="p-1 rounded-lg text-neutral-400 hover:text-amber-300 hover:bg-neutral-800 transition-colors"
                  title={`Baixar banner de "${item.title}" (PNG)`}
                >
                  {downloadingIndex === idx ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
                  ) : (
                    <Download className="w-3.5 h-3.5" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownloadIndividualVideo(idx);
                  }}
                  className="p-1 rounded-lg text-neutral-400 hover:text-purple-300 hover:bg-neutral-800 transition-colors"
                  title={`Baixar banner em vídeo (MP4) de "${item.title}"`}
                >
                  {recordingVideoIndex === idx ? (
                    <div className="flex items-center gap-0.5">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-400" />
                      {recordingVideoProgress > 0 && (
                        <span className="text-[8px] text-purple-400 font-bold">{recordingVideoProgress}%</span>
                      )}
                    </div>
                  ) : (
                    <Film className="w-3.5 h-3.5 text-neutral-400 hover:text-purple-300" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onUpdateProduct(idx, { hidden: !item.hidden });
                  }}
                  className="p-1 rounded-lg text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition-colors"
                  title={item.hidden ? 'Item OCULTO na TV. Clique para exibir.' : 'Item VISÍVEL na TV. Clique para ocultar.'}
                >
                  {item.hidden ? <EyeOff className="w-3.5 h-3.5 text-amber-400" /> : <Eye className="w-3.5 h-3.5" />}
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    const duplicated: ProductItem = {
                      ...item,
                      id: `prod-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                      title: `${item.title} (Cópia)`,
                    };
                    onAddProduct(duplicated);
                  }}
                  className="p-1 rounded-lg text-neutral-400 hover:text-amber-300 hover:bg-neutral-800 transition-colors"
                  title="Duplicar banner"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (products.length === 1) {
                      if (confirm('Deseja limpar este banner e iniciar um novo em branco para este cliente?')) {
                        onUpdateProduct(idx, {
                          title: 'Novo Produto em Oferta',
                          price: '0,00',
                          originalPrice: '',
                          badge: 'SUPER OFERTA',
                          category: 'Geral',
                          unit: 'un',
                          imageUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=1200&auto=format&fit=crop&q=85',
                          imageDisplayMode: 'ambient',
                        });
                      }
                    } else {
                      if (confirm(`Tem certeza que deseja excluir o banner "${item.title}"?`)) {
                        onRemoveProduct(idx);
                      }
                    }
                  }}
                  className="p-1 rounded-lg text-neutral-500 hover:text-red-400 hover:bg-neutral-800 transition-colors"
                  title="Excluir banner"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* SEÇÃO 1 (NOVO TOPO!): 📝 TEXTOS & IDENTIDADE DA CAMPANHA (TOPO DO BANNER) */}
      {/* ========================================================================= */}
      <div id="painel-secao-campanha" className="p-3.5 bg-neutral-950 rounded-2xl border border-neutral-800 space-y-3.5 shadow-sm">
        <div 
          onClick={() => toggleSection('campanha')}
          className="flex items-center justify-between border-b border-neutral-800 pb-2.5 cursor-pointer group select-none"
        >
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Layers className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="text-xs font-black text-white group-hover:text-amber-300">
                1. Textos & Identidade (Topo do Banner)
              </span>
              <span className="text-[10px] text-neutral-400 block">
                Título superior, validade, logotipo da empresa e rodapé fixo
              </span>
            </div>
          </div>

          <div className="text-neutral-400 group-hover:text-white">
            {openSections.campanha ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </div>

        {openSections.campanha && (
          <div className="space-y-3">
            {/* 1. Logotipo & Nome do Cliente */}
            <div className="p-2.5 bg-neutral-900/80 rounded-xl border border-neutral-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase text-amber-300 flex items-center gap-1">
                  <ImageIcon className="w-3 h-3 text-amber-400" />
                  <span>Logotipo da Empresa / Loja</span>
                </span>

                {onToggleShowLogo && (
                  <label className="flex items-center gap-1.5 text-[11px] text-neutral-300 cursor-pointer font-bold">
                    <input
                      type="checkbox"
                      checked={showClientLogo !== false}
                      onChange={onToggleShowLogo}
                      className="rounded bg-neutral-800 border-neutral-700 text-amber-500 focus:ring-0 cursor-pointer"
                    />
                    <span>Exibir no Banner</span>
                  </label>
                )}
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={campaign?.clientLogoUrl?.startsWith('data:') ? 'Arquivo de logo carregado' : (campaign?.clientLogoUrl || '')}
                  onChange={(e) => onUpdateCampaign && onUpdateCampaign({ clientLogoUrl: e.target.value, showClientLogo: true })}
                  placeholder="/logos/empresa.png ou link..."
                  className="flex-1 bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500 font-mono truncate"
                />

                <input
                  ref={clientLogoInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (ev) => {
                        if (ev.target?.result && onUpdateCampaign) {
                          onUpdateCampaign({ clientLogoUrl: ev.target.result as string, showClientLogo: true });
                        }
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />

                <button
                  type="button"
                  onClick={() => clientLogoInputRef.current?.click()}
                  className="px-2.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-amber-400 font-bold text-xs rounded-lg border border-neutral-700 flex items-center gap-1 cursor-pointer shrink-0"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload Logo</span>
                </button>
              </div>
            </div>

            {/* 2. Título Superior da Campanha + Fonte + Cor */}
            <div>
              <label className="block text-[10px] font-bold text-neutral-400 uppercase mb-1">
                Título Superior da Campanha (Cabeçalho)
              </label>
              <input
                type="text"
                value={campaign?.campaignTitle || ''}
                onChange={(e) => onUpdateCampaign && onUpdateCampaign({ campaignTitle: e.target.value })}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500 font-black uppercase"
                placeholder="Ex: FESTIVAL DE OFERTAS BELÍSSIMA !"
              />

              <div className="grid grid-cols-2 gap-2 mt-1.5">
                <div>
                  <label className="block text-[9px] text-neutral-400 mb-0.5">Fonte do Título Superior:</label>
                  <select
                    value={currentEffectiveStyles.campaignTitleFont || "'Montserrat', sans-serif"}
                    onChange={(e) => handleApplyCustomStyle({ campaignTitleFont: e.target.value })}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded px-2 py-1 text-[10px] text-white"
                  >
                    {FONTES_COMERCIAIS_RECOMENDADAS.map((f) => (
                      <option key={f.id} value={f.fontFamily}>
                        {f.nome.split(' (')[0]}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[9px] text-neutral-400 mb-0.5">Cor do Título Superior:</label>
                  <div className="flex items-center gap-1">
                    <input
                      type="color"
                      value={currentEffectiveStyles.campaignTitleColor || '#fbbf24'}
                      onChange={(e) => handleApplyCustomStyle({ campaignTitleColor: e.target.value })}
                      className="w-6 h-6 rounded border border-neutral-700 bg-neutral-900 cursor-pointer shrink-0"
                    />
                    <input
                      type="text"
                      value={currentEffectiveStyles.campaignTitleColor || '#fbbf24'}
                      onChange={(e) => handleApplyCustomStyle({ campaignTitleColor: e.target.value })}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded px-1.5 py-0.5 text-[10px] text-white font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Subtítulo e Validade */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-bold text-neutral-400 uppercase mb-1">
                  Subtítulo / Slogan
                </label>
                <input
                  type="text"
                  value={campaign?.campaignSubtitle || ''}
                  onChange={(e) => onUpdateCampaign && onUpdateCampaign({ campaignSubtitle: e.target.value })}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                  placeholder="Ex: Preços baixos de verdade..."
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-neutral-400 uppercase mb-1">
                  Texto de Validade das Ofertas
                </label>
                <input
                  type="text"
                  value={campaign?.validityText || ''}
                  onChange={(e) => onUpdateCampaign && onUpdateCampaign({ validityText: e.target.value })}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                  placeholder="Ex: Ofertas válidas até domingo..."
                />
              </div>
            </div>

            {/* 4. Rodapé Fixo da TV (Sub-Footer): Texto Legal e Site/Assinatura */}
            <div className="p-2.5 bg-neutral-900/80 rounded-xl border border-neutral-800 space-y-2">
              <span className="text-[10px] font-black uppercase text-amber-300 block">
                Rodapé Fixo da TV (Sub-Footer)
              </span>

              <div className="space-y-1.5">
                <div>
                  <label className="block text-[9px] text-neutral-400 mb-0.5">
                    Texto Legal (Canto Esquerdo):
                  </label>
                  <input
                    type="text"
                    value={campaign?.legalNotice || ''}
                    onChange={(e) => onUpdateCampaign && onUpdateCampaign({ legalNotice: e.target.value })}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                    placeholder="Imagens meramente ilustrativas..."
                  />
                </div>

                <div>
                  <label className="block text-[9px] text-neutral-400 mb-0.5">
                    Site / Assinatura (Canto Direito):
                  </label>
                  <input
                    type="text"
                    value={campaign?.footerBrandText !== undefined ? campaign.footerBrandText : 'ts.playcomunique.com.br'}
                    onChange={(e) => onUpdateCampaign && onUpdateCampaign({ footerBrandText: e.target.value })}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                    placeholder="ts.playcomunique.com.br"
                  />
                </div>
              </div>
            </div>

            {/* 5. Contatos da Loja */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-bold text-neutral-400 uppercase mb-1">
                  WhatsApp Pedidos
                </label>
                <input
                  type="text"
                  value={campaign?.phoneWhatsapp || ''}
                  onChange={(e) => onUpdateCampaign && onUpdateCampaign({ phoneWhatsapp: e.target.value })}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                  placeholder="(11) 99999-1234"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-neutral-400 uppercase mb-1">
                  Endereço Loja
                </label>
                <input
                  type="text"
                  value={campaign?.storeAddress || ''}
                  onChange={(e) => onUpdateCampaign && onUpdateCampaign({ storeAddress: e.target.value })}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                  placeholder="Rua das Frutas, 2004"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* SEÇÃO 2: EDITANDO ITEM #X (PRODUTO, PREÇOS, SELOS COM CORES E PACKSHOT) */}
      {/* ========================================================================= */}
      {activeProduct && (
        <div id="painel-secao-produto" className="p-3.5 bg-neutral-950 rounded-2xl border border-neutral-800 space-y-3.5 shadow-sm">
          {/* Header da Seção do Produto */}
          <div 
            onClick={() => toggleSection('produto')}
            className="flex items-center justify-between border-b border-neutral-800 pb-2.5 cursor-pointer group select-none"
          >
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-black text-xs">
                #{currentProductIndex + 1}
              </div>
              <div>
                <span className="text-xs font-black text-white group-hover:text-amber-300">
                  2. Editando Item #{currentProductIndex + 1}
                </span>
                <span className="text-[10px] text-neutral-400 block truncate max-w-[210px]">
                  {activeProduct.title}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <label 
                onClick={(e) => e.stopPropagation()} 
                className="flex items-center gap-1 text-[11px] text-amber-400 cursor-pointer font-bold"
              >
                <input
                  type="checkbox"
                  checked={activeProduct.isHero || false}
                  onChange={(e) => onUpdateProduct(currentProductIndex, { isHero: e.target.checked })}
                  className="rounded bg-neutral-800 border-neutral-700 text-amber-500 focus:ring-0"
                />
                <Star className="w-3 h-3 fill-amber-400" />
                <span className="hidden sm:inline">Super Destaque</span>
              </label>

              <div className="text-neutral-400 group-hover:text-white">
                {openSections.produto ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            </div>
          </div>

          {openSections.produto && (
            <div className="space-y-3">
              {/* 1. Nome Comercial do Produto + Fonte e Cor do Nome */}
              <div>
                <label className="block text-[10px] font-bold text-neutral-400 uppercase mb-1">
                  Nome Comercial do Produto
                </label>
                <input
                  type="text"
                  value={activeProduct.title}
                  onChange={(e) => onUpdateProduct(currentProductIndex, { title: e.target.value })}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500 font-bold"
                  placeholder="Ex: 2 (duas) garrafas de Água de coco de 1 litro"
                />

                {/* Fonte e Cor do Nome do Produto */}
                <div className="grid grid-cols-2 gap-2 mt-1.5">
                  <div>
                    <label className="block text-[9px] text-neutral-400 mb-0.5">Fonte do Produto:</label>
                    <select
                      value={currentEffectiveStyles.productTitleFont || "'Montserrat', sans-serif"}
                      onChange={(e) => handleApplyCustomStyle({ productTitleFont: e.target.value })}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded px-2 py-1 text-[10px] text-white"
                    >
                      {FONTES_COMERCIAIS_RECOMENDADAS.map((f) => (
                        <option key={f.id} value={f.fontFamily}>
                          {f.nome.split(' (')[0]}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[9px] text-neutral-400 mb-0.5">Cor do Nome:</label>
                    <div className="flex items-center gap-1">
                      <input
                        type="color"
                        value={currentEffectiveStyles.productTitleColor || '#ffffff'}
                        onChange={(e) => handleApplyCustomStyle({ productTitleColor: e.target.value })}
                        className="w-6 h-6 rounded border border-neutral-700 bg-neutral-900 cursor-pointer shrink-0"
                      />
                      <input
                        type="text"
                        value={currentEffectiveStyles.productTitleColor || '#ffffff'}
                        onChange={(e) => handleApplyCustomStyle({ productTitleColor: e.target.value })}
                        className="w-full bg-neutral-900 border border-neutral-800 rounded px-1.5 py-0.5 text-[10px] text-white font-mono"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. Preços e Unidade + Cores dos Preços */}
              <div className="p-2.5 bg-neutral-900/70 rounded-xl border border-neutral-800/80 space-y-2">
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[9px] font-bold text-neutral-400 uppercase">Preço Por (R$)</label>
                    <input
                      type="text"
                      value={activeProduct.price}
                      onChange={(e) => onUpdateProduct(currentProductIndex, { price: e.target.value })}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-2 py-1.5 text-xs font-black text-amber-400 focus:outline-none focus:border-amber-500 mt-0.5"
                      placeholder="24,90"
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold text-neutral-400 uppercase">Preço De (R$)</label>
                    <input
                      type="text"
                      value={activeProduct.originalPrice || ''}
                      onChange={(e) => onUpdateProduct(currentProductIndex, { originalPrice: e.target.value })}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-2 py-1.5 text-xs text-neutral-400 line-through focus:outline-none focus:border-amber-500 mt-0.5"
                      placeholder="29,90"
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold text-neutral-400 uppercase">Unidade</label>
                    <input
                      type="text"
                      value={activeProduct.unit}
                      onChange={(e) => onUpdateProduct(currentProductIndex, { unit: e.target.value })}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500 mt-0.5"
                      placeholder="kg, 2L, un"
                    />
                  </div>
                </div>

                {/* Cores da Caixa de Preço */}
                <div className="grid grid-cols-3 gap-2 pt-1 border-t border-neutral-800">
                  <div>
                    <label className="block text-[8px] text-neutral-400 uppercase mb-0.5 truncate" title="Cor de fundo da caixa 'POR R$'">
                      Fundo Preço:
                    </label>
                    <div className="flex items-center gap-1">
                      <input
                        type="color"
                        value={currentEffectiveStyles.priceBoxBgColor || '#ea580c'}
                        onChange={(e) => handleApplyCustomStyle({ priceBoxBgColor: e.target.value })}
                        className="w-5 h-5 rounded border border-neutral-700 bg-neutral-900 cursor-pointer shrink-0"
                      />
                      <input
                        type="text"
                        value={currentEffectiveStyles.priceBoxBgColor || '#ea580c'}
                        onChange={(e) => handleApplyCustomStyle({ priceBoxBgColor: e.target.value })}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded px-1 py-0.5 text-[9px] text-white font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[8px] text-neutral-400 uppercase mb-0.5 truncate" title="Cor do texto da caixa 'POR R$'">
                      Texto Preço:
                    </label>
                    <div className="flex items-center gap-1">
                      <input
                        type="color"
                        value={currentEffectiveStyles.priceBoxTextColor || '#ffffff'}
                        onChange={(e) => handleApplyCustomStyle({ priceBoxTextColor: e.target.value })}
                        className="w-5 h-5 rounded border border-neutral-700 bg-neutral-900 cursor-pointer shrink-0"
                      />
                      <input
                        type="text"
                        value={currentEffectiveStyles.priceBoxTextColor || '#ffffff'}
                        onChange={(e) => handleApplyCustomStyle({ priceBoxTextColor: e.target.value })}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded px-1 py-0.5 text-[9px] text-white font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[8px] text-neutral-400 uppercase mb-0.5 truncate" title="Cor do preço 'De: R$'">
                      Preço "De:":
                    </label>
                    <div className="flex items-center gap-1">
                      <input
                        type="color"
                        value={currentEffectiveStyles.priceOriginalColor || '#ffffff'}
                        onChange={(e) => handleApplyCustomStyle({ priceOriginalColor: e.target.value })}
                        className="w-5 h-5 rounded border border-neutral-700 bg-neutral-900 cursor-pointer shrink-0"
                      />
                      <input
                        type="text"
                        value={currentEffectiveStyles.priceOriginalColor || '#ffffff'}
                        onChange={(e) => handleApplyCustomStyle({ priceOriginalColor: e.target.value })}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded px-1 py-0.5 text-[9px] text-white font-mono"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. 1º SELO PROMOCIONAL (TOPO) - COM CONTROLE TOTAL DE COR */}
              <div className="p-3 bg-neutral-900/80 rounded-xl border border-neutral-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-300">
                      1º Selo Promocional (Topo)
                    </span>
                  </div>

                  {/* Preview do 1º Selo em Tempo Real */}
                  <span 
                    style={{
                      backgroundColor: currentEffectiveStyles.badgeBgColor || theme?.badgeBg || '#1a472a',
                      color: currentEffectiveStyles.badgeTextColor || theme?.badgeText || '#ffffff',
                    }}
                    className="text-[9px] font-black uppercase px-2 py-0.5 rounded border border-white/20 shadow-sm"
                  >
                    {activeProduct.badge || 'PRÉVIA'}
                  </span>
                </div>

                {/* Texto do 1º Selo */}
                <div>
                  <label className="block text-[9px] text-neutral-400 uppercase mb-1">
                    Texto do 1º Selo (Fica antes do nome do produto)
                  </label>
                  <input
                    type="text"
                    value={activeProduct.badge || ''}
                    onChange={(e) => onUpdateProduct(currentProductIndex, { badge: e.target.value })}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500 font-bold"
                    placeholder="Ex: OU 1 POR R$17,90 !, OFERTA DO DIA, SÓ HOJE..."
                  />
                </div>

                {/* Cores do 1º Selo: Fundo e Texto */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <label className="block text-[9px] font-bold text-neutral-300 mb-1">
                      Cor de Fundo do 1º Selo:
                    </label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="color"
                        value={currentEffectiveStyles.badgeBgColor || theme?.badgeBg || '#1a472a'}
                        onChange={(e) => handleApplyCustomStyle({ badgeBgColor: e.target.value })}
                        className="w-7 h-7 rounded border border-neutral-700 bg-neutral-900 cursor-pointer shrink-0"
                      />
                      <input
                        type="text"
                        value={currentEffectiveStyles.badgeBgColor || theme?.badgeBg || '#1a472a'}
                        onChange={(e) => handleApplyCustomStyle({ badgeBgColor: e.target.value })}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded px-2 py-1 text-[10px] text-white font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold text-neutral-300 mb-1">
                      Cor do Texto do 1º Selo:
                    </label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="color"
                        value={currentEffectiveStyles.badgeTextColor || theme?.badgeText || '#ffffff'}
                        onChange={(e) => handleApplyCustomStyle({ badgeTextColor: e.target.value })}
                        className="w-7 h-7 rounded border border-neutral-700 bg-neutral-900 cursor-pointer shrink-0"
                      />
                      <input
                        type="text"
                        value={currentEffectiveStyles.badgeTextColor || theme?.badgeText || '#ffffff'}
                        onChange={(e) => handleApplyCustomStyle({ badgeTextColor: e.target.value })}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded px-2 py-1 text-[10px] text-white font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Cores Comerciais Rápidas para o 1º Selo */}
                <div>
                  <span className="text-[8px] uppercase tracking-wider text-neutral-400 block mb-1">
                    Cores rápidas de 1 clique para o 1º Selo:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {PALETA_CORES_RAPIDAS.map((cor) => (
                      <button
                        key={cor.nome}
                        type="button"
                        onClick={() => handleApplyCustomStyle({ badgeBgColor: cor.bg, badgeTextColor: cor.text })}
                        style={{ backgroundColor: cor.bg, color: cor.text }}
                        className="px-2 py-0.5 rounded text-[9px] font-black border border-white/20 shadow-sm hover:scale-105 transition-transform cursor-pointer"
                        title={`Aplicar ${cor.nome}`}
                      >
                        {cor.nome}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* 4. 2º SELO PROMOCIONAL (BASE / ABAIXO DO PREÇO) */}
              <div className="p-3 bg-neutral-900/80 rounded-xl border border-neutral-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={!!activeProduct.secondBadgeEnabled}
                      onChange={(e) => {
                        const isChecked = e.target.checked;
                        onUpdateProduct(currentProductIndex, {
                          secondBadgeEnabled: isChecked,
                          secondBadge: isChecked ? (activeProduct.secondBadge || 'PROMOÇÃO ESPECIAL') : activeProduct.secondBadge,
                        });
                      }}
                      className="w-4 h-4 rounded bg-neutral-950 border-neutral-700 text-amber-500 focus:ring-amber-500/20 cursor-pointer"
                    />
                    <span className="text-[11px] font-bold text-neutral-200 hover:text-amber-400 transition-colors">
                      Ativar 2º Selo Promocional
                    </span>
                  </label>

                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                    activeProduct.secondBadgeEnabled 
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' 
                      : 'bg-neutral-800 text-neutral-500'
                  }`}>
                    {activeProduct.secondBadgeEnabled ? 'Ativo no banner' : 'Desativado'}
                  </span>
                </div>

                {activeProduct.secondBadgeEnabled && (
                  <div className="space-y-2 pt-1 border-t border-neutral-800/80">
                    <div className="flex items-center justify-between">
                      <label className="block text-[9px] text-neutral-400 uppercase">
                        Texto do 2º Selo (Abaixo do Preço)
                      </label>
                      <span 
                        style={{
                          backgroundColor: currentEffectiveStyles.secondBadgeBgColor || currentEffectiveStyles.badgeBgColor || '#dc2626',
                          color: currentEffectiveStyles.secondBadgeTextColor || currentEffectiveStyles.badgeTextColor || '#ffffff',
                        }}
                        className="text-[8px] font-black uppercase px-2 py-0.5 rounded border border-white/20"
                      >
                        {activeProduct.secondBadge || 'PRÉVIA 2º SELO'}
                      </span>
                    </div>

                    <input
                      type="text"
                      value={activeProduct.secondBadge || ''}
                      onChange={(e) => onUpdateProduct(currentProductIndex, { secondBadge: e.target.value })}
                      className="w-full bg-neutral-950 border border-amber-500/40 focus:border-amber-400 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none font-bold"
                      placeholder="Ex: OU 1 GARRAFA POR APENAS 17,99 !"
                    />

                    {/* Cores do 2º Selo */}
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <div>
                        <label className="block text-[9px] font-bold text-neutral-300 mb-1">
                          Cor de Fundo do 2º Selo:
                        </label>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="color"
                            value={currentEffectiveStyles.secondBadgeBgColor || currentEffectiveStyles.badgeBgColor || '#dc2626'}
                            onChange={(e) => handleApplyCustomStyle({ secondBadgeBgColor: e.target.value })}
                            className="w-7 h-7 rounded border border-neutral-700 bg-neutral-900 cursor-pointer shrink-0"
                          />
                          <input
                            type="text"
                            value={currentEffectiveStyles.secondBadgeBgColor || currentEffectiveStyles.badgeBgColor || '#dc2626'}
                            onChange={(e) => handleApplyCustomStyle({ secondBadgeBgColor: e.target.value })}
                            className="w-full bg-neutral-950 border border-neutral-800 rounded px-2 py-1 text-[10px] text-white font-mono"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[9px] font-bold text-neutral-300 mb-1">
                          Cor do Texto do 2º Selo:
                        </label>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="color"
                            value={currentEffectiveStyles.secondBadgeTextColor || currentEffectiveStyles.badgeTextColor || '#ffffff'}
                            onChange={(e) => handleApplyCustomStyle({ secondBadgeTextColor: e.target.value })}
                            className="w-7 h-7 rounded border border-neutral-700 bg-neutral-900 cursor-pointer shrink-0"
                          />
                          <input
                            type="text"
                            value={currentEffectiveStyles.secondBadgeTextColor || currentEffectiveStyles.badgeTextColor || '#ffffff'}
                            onChange={(e) => handleApplyCustomStyle({ secondBadgeTextColor: e.target.value })}
                            className="w-full bg-neutral-950 border border-neutral-800 rounded px-2 py-1 text-[10px] text-white font-mono"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Paleta rápida para o 2º Selo */}
                    <div className="flex flex-wrap gap-1 pt-0.5">
                      {PALETA_CORES_RAPIDAS.map((cor) => (
                        <button
                          key={cor.nome}
                          type="button"
                          onClick={() => handleApplyCustomStyle({ secondBadgeBgColor: cor.bg, secondBadgeTextColor: cor.text })}
                          style={{ backgroundColor: cor.bg, color: cor.text }}
                          className="px-2 py-0.5 rounded text-[8px] font-black border border-white/20 shadow-sm cursor-pointer"
                        >
                          {cor.nome}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* 5. Categoria */}
              <div>
                <label className="block text-[10px] font-bold text-neutral-400 uppercase mb-1">
                  Categoria do Produto
                </label>
                <input
                  type="text"
                  value={activeProduct.category}
                  onChange={(e) => onUpdateProduct(currentProductIndex, { category: e.target.value })}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                  placeholder="Bebidas, Hortifrúti, Carnes, Limpeza..."
                />
              </div>

              {/* 6. Imagem / Packshot & Ferramentas IA */}
              <div className="p-3 bg-neutral-900/80 rounded-xl border border-neutral-800 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-[10px] font-bold text-neutral-300 uppercase">
                    Foto da Embalagem / Packshot
                  </label>
                  <span className="text-[9px] text-amber-400">Upload ou IA</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={activeProduct.imageUrl}
                    onChange={(e) => onUpdateProduct(currentProductIndex, { imageUrl: e.target.value })}
                    className="flex-1 bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500 font-mono truncate"
                    placeholder="Link da imagem..."
                  />

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (event) => {
                          if (event.target?.result) {
                            onUpdateProduct(currentProductIndex, { imageUrl: event.target.result as string });
                          }
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />

                  <button
                    type="button"
                    disabled={isSearchingRealImage}
                    onClick={handleSearchRealImage}
                    className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold disabled:opacity-50 cursor-pointer"
                    title="Buscar foto real da embalagem oficial no Google / Varejo"
                  >
                    {isSearchingRealImage ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-bold cursor-pointer"
                    title="Carregar foto real do seu dispositivo"
                  >
                    <Upload className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowCatalogModal(true)}
                    className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-amber-400 border border-neutral-700 cursor-pointer"
                    title="Catálogo Comercial Brasil"
                  >
                    <ImageIcon className="w-4 h-4" />
                  </button>
                </div>

                {/* Toolbar IA e Prompts */}
                <div className="grid grid-cols-2 gap-1.5 pt-1">
                  <button
                    type="button"
                    disabled={isGeneratingAiImage}
                    onClick={handleGenerateAiCommercialImage}
                    className="py-1.5 px-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-extrabold text-[10px] rounded-lg shadow flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                    title="Gerar banner comercial ambientado com IA"
                  >
                    {isGeneratingAiImage ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3 fill-black" />}
                    <span>{isGeneratingAiImage ? 'Gerando...' : 'Arte IA ✨'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCopyGeminiPrompt}
                    className="py-1.5 px-2 bg-neutral-800 hover:bg-neutral-700 text-amber-300 font-bold text-[10px] rounded-lg border border-neutral-700 flex items-center justify-center gap-1 cursor-pointer"
                    title="Copiar prompt profissional pronto para o Gemini"
                  >
                    {isPromptCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{isPromptCopied ? 'Copiado!' : 'Prompt Gemini'}</span>
                  </button>
                </div>

                {/* Estilo do Card: Ambientado vs Recortado & Borda */}
                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-neutral-800 items-center">
                  <button
                    type="button"
                    onClick={() => {
                      const nextMode = activeProduct.imageDisplayMode === 'contain' ? 'ambient' : 'contain';
                      onUpdateProduct(currentProductIndex, { imageDisplayMode: nextMode });
                    }}
                    className="text-[10px] font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer bg-neutral-950 p-1.5 rounded-lg border border-neutral-800"
                  >
                    <SlidersHorizontal className="w-3 h-3 text-neutral-400 shrink-0" />
                    <span className="truncate">
                      {activeProduct.imageDisplayMode === 'contain' ? 'Recortado (Estúdio)' : 'Ambientado (TV) ✨'}
                    </span>
                  </button>

                  <div className="flex items-center gap-1 bg-neutral-950 p-1 rounded-lg border border-neutral-800">
                    <span className="text-[9px] text-neutral-400 shrink-0">Borda Card:</span>
                    <input
                      type="color"
                      value={currentEffectiveStyles.cardBorderColor || '#ffffff'}
                      onChange={(e) => handleApplyCustomStyle({ cardBorderColor: e.target.value })}
                      className="w-5 h-5 rounded border border-neutral-700 bg-neutral-900 cursor-pointer shrink-0"
                    />
                    <input
                      type="text"
                      value={currentEffectiveStyles.cardBorderColor || '#ffffff'}
                      onChange={(e) => handleApplyCustomStyle({ cardBorderColor: e.target.value })}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded px-1 py-0.5 text-[9px] text-white font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Botões de Ação do Item (PNG, MP4, Ocultar) */}
              <div className="pt-2 border-t border-neutral-800 flex items-center justify-between gap-1.5">
                <button
                  type="button"
                  disabled={downloadingIndex === currentProductIndex}
                  onClick={() => handleDownloadIndividualBanner(currentProductIndex)}
                  className="flex-1 py-1.5 px-2 bg-neutral-800 hover:bg-neutral-700 text-amber-400 font-extrabold text-[10px] rounded-lg border border-neutral-700 flex items-center justify-center gap-1 transition-all cursor-pointer"
                >
                  {downloadingIndex === currentProductIndex ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
                  <span>{downloadingIndex === currentProductIndex ? 'Baixando...' : 'Baixar PNG'}</span>
                </button>

                <button
                  type="button"
                  disabled={recordingVideoIndex === currentProductIndex}
                  onClick={() => handleDownloadIndividualVideo(currentProductIndex)}
                  className="flex-1 py-1.5 px-2 bg-gradient-to-r from-purple-900/40 to-indigo-900/40 hover:from-purple-900/60 text-purple-300 font-extrabold text-[10px] rounded-lg border border-purple-500/40 flex items-center justify-center gap-1 transition-all cursor-pointer"
                >
                  {recordingVideoIndex === currentProductIndex ? <Loader2 className="w-3 h-3 animate-spin" /> : <Film className="w-3 h-3" />}
                  <span>{recordingVideoIndex === currentProductIndex ? `${recordingVideoProgress}%` : 'Baixar MP4'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => onUpdateProduct(currentProductIndex, { hidden: !activeProduct.hidden })}
                  className={`py-1.5 px-2 rounded-lg border font-bold text-[10px] flex items-center gap-1 cursor-pointer transition-colors ${
                    activeProduct.hidden
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-neutral-800 text-neutral-300 border-neutral-700'
                  }`}
                  title="Ocultar da rotação da TV"
                >
                  {activeProduct.hidden ? <Eye className="w-3 h-3 text-amber-400" /> : <EyeOff className="w-3 h-3 text-neutral-400" />}
                  <span className="hidden sm:inline">{activeProduct.hidden ? 'Reativar' : 'Ocultar'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SEÇÃO 3: MODELOS DE MERCADO & ESTILOS VISUAIS DO BANNER */}
      {/* ========================================================================= */}
      <div id="painel-secao-modelos" className="p-3.5 bg-neutral-950 rounded-2xl border border-neutral-800 space-y-3.5 shadow-sm">
        <div 
          onClick={() => toggleSection('estilos')}
          className="flex items-center justify-between border-b border-neutral-800 pb-2.5 cursor-pointer group select-none"
        >
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Palette className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="text-xs font-black text-white group-hover:text-amber-300">
                3. Modelos de Mercado & Fundo do Banner
              </span>
              <span className="text-[10px] text-neutral-400 block">
                10 layouts profissionais, gradientes e imagem de fundo
              </span>
            </div>
          </div>

          <div className="text-neutral-400 group-hover:text-white">
            {openSections.estilos ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </div>

        {openSections.estilos && (
          <div className="space-y-3">
            {/* Seletor de Escopo: Apenas neste banner vs Todos os banners */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[10px] font-bold text-neutral-400 uppercase">
                  Onde aplicar as cores e estilos:
                </label>
                {customizationScope === 'single' && activeProduct?.customStyles && (
                  <button
                    type="button"
                    onClick={handleResetProductStyles}
                    className="text-[9px] text-amber-400 hover:underline flex items-center gap-0.5 cursor-pointer"
                  >
                    <RotateCcw className="w-2.5 h-2.5" />
                    <span>Restaurar Padrão</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-1.5 p-1 bg-neutral-900 rounded-xl border border-neutral-800">
                <button
                  type="button"
                  onClick={() => setCustomizationScope('single')}
                  className={`py-1.5 px-2 rounded-lg text-[10px] font-black transition-all flex items-center justify-center text-center cursor-pointer ${
                    customizationScope === 'single'
                      ? 'bg-amber-400 text-black shadow-md'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  <span>Apenas neste item (#{currentProductIndex + 1})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCustomizationScope('all')}
                  className={`py-1.5 px-2 rounded-lg text-[10px] font-black transition-all flex items-center justify-center text-center cursor-pointer ${
                    customizationScope === 'all'
                      ? 'bg-amber-400 text-black shadow-md'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  <span>Todos os banners</span>
                </button>
              </div>
            </div>

            {/* 10 Modelos Prontos do Mercado Brasileiro */}
            <div>
              <label className="block text-[10px] font-bold text-neutral-400 uppercase mb-1 flex items-center justify-between">
                <span>10 Modelos Comerciais Prontos:</span>
                <span className="text-[9px] text-amber-400">Clique para aplicar</span>
              </label>

              <div className="grid grid-cols-2 gap-1.5 max-h-52 overflow-y-auto pr-1">
                {MODELOS_BANNERS_MERCADO.map((mod) => {
                  const isSelected = currentEffectiveStyles.presetThemeId === mod.id;
                  return (
                    <button
                      key={mod.id}
                      type="button"
                      onClick={() => handleApplyCustomStyle(mod.styles)}
                      className={`p-2 rounded-xl border text-left flex items-center gap-2 transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-neutral-800 border-amber-400 ring-1 ring-amber-400/50 shadow'
                          : 'bg-neutral-900 hover:bg-neutral-800/80 border-neutral-800'
                      }`}
                    >
                      <div 
                        style={{ background: mod.previewBg }}
                        className="w-7 h-7 rounded-lg shrink-0 border border-white/20 shadow-sm relative overflow-hidden"
                      >
                        <div 
                          style={{ backgroundColor: mod.styles.priceBoxBgColor }}
                          className="absolute bottom-0 right-0 w-3 h-3 text-[7px] font-black text-white flex items-center justify-center"
                        >
                          $
                        </div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-[10px] font-bold text-white truncate leading-tight">
                          {mod.nome}
                        </div>
                        <div className="text-[8px] text-amber-400 truncate">
                          {mod.segmento.split('/')[0]}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Fundo do Banner (Cor Base ou Imagem Personalizada) */}
            <div className="p-2.5 bg-neutral-900/90 rounded-xl border border-neutral-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-neutral-300 uppercase">Fundo do Banner:</span>
                {currentEffectiveStyles.bannerBgImageUrl && (
                  <button
                    type="button"
                    onClick={() => handleApplyCustomStyle({ bannerBgImageUrl: undefined })}
                    className="text-[9px] text-red-400 hover:text-red-300 flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-2.5 h-2.5" />
                    <span>Remover Imagem de Fundo</span>
                  </button>
                )}
              </div>

              <input
                ref={productBgInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                      if (ev.target?.result) {
                        handleApplyCustomStyle({ bannerBgImageUrl: ev.target.result as string });
                      }
                    };
                    reader.readAsDataURL(file);
                  }
                }}
              />

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => productBgInputRef.current?.click()}
                  className="flex-1 py-1.5 px-2 bg-neutral-800 hover:bg-neutral-700 text-amber-300 font-bold text-[10px] rounded-lg border border-neutral-700 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Upload className="w-3 h-3 text-amber-400" />
                  <span>{currentEffectiveStyles.bannerBgImageUrl ? 'Trocar Imagem de Fundo' : 'Upload Imagem de Fundo'}</span>
                </button>

                <div className="flex items-center gap-1 shrink-0">
                  <input
                    type="color"
                    value={currentEffectiveStyles.bannerBgColor || '#06331e'}
                    onChange={(e) => handleApplyCustomStyle({ bannerBgColor: e.target.value, bannerBgGradient: undefined })}
                    className="w-7 h-7 rounded border border-neutral-700 bg-neutral-900 cursor-pointer"
                    title="Cor de Fundo Base"
                  />
                  <input
                    type="text"
                    value={currentEffectiveStyles.bannerBgColor || '#06331e'}
                    onChange={(e) => handleApplyCustomStyle({ bannerBgColor: e.target.value, bannerBgGradient: undefined })}
                    className="w-16 bg-neutral-950 border border-neutral-800 rounded px-1 py-0.5 text-[9px] text-white font-mono"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* SEÇÃO 4: REPRODUÇÃO TV INDOOR & ROTAÇÃO AUTOMÁTICA */}
      {/* ========================================================================= */}
      <div id="painel-secao-tv" className="p-3.5 bg-neutral-950 rounded-2xl border border-neutral-800 space-y-3.5 shadow-sm">
        <div 
          onClick={() => toggleSection('reproducao')}
          className="flex items-center justify-between border-b border-neutral-800 pb-2.5 cursor-pointer group select-none"
        >
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Tv className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="text-xs font-black text-white group-hover:text-emerald-300">
                4. Reprodução TV Indoor & Rotação
              </span>
              <span className="text-[10px] text-neutral-400 block">
                Tempo por oferta, efeitos de transição e letreiro
              </span>
            </div>
          </div>

          <div className="text-neutral-400 group-hover:text-white">
            {openSections.reproducao ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </div>

        {openSections.reproducao && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-bold text-neutral-400 uppercase mb-1">
                  Tempo na TV
                </label>
                <select
                  value={campaign?.slideDuration || 6}
                  onChange={(e) => onUpdateCampaign && onUpdateCampaign({ slideDuration: Number(e.target.value) })}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  <option value={4}>4 Segundos</option>
                  <option value={6}>6 Segundos (Padrão)</option>
                  <option value={8}>8 Segundos</option>
                  <option value={10}>10 Segundos</option>
                  <option value={15}>15 Segundos</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-neutral-400 uppercase mb-1">
                  Efeito de Animação
                </label>
                <select
                  value={campaign?.animationStyle || 'zoom'}
                  onChange={(e) => onUpdateCampaign && onUpdateCampaign({ animationStyle: e.target.value as AnimationEffect })}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="zoom">Zoom Suave (Ken Burns)</option>
                  <option value="pulse">Pulso de Destaque</option>
                  <option value="slide">Deslizar Lateral</option>
                  <option value="none">Estático</option>
                </select>
              </div>
            </div>

            {/* Letreiro Marquee de Rodapé */}
            <div>
              <label className="block text-[10px] font-bold text-neutral-400 uppercase mb-1">
                Letreiro de Rodapé (Marquee TV)
              </label>
              <input
                type="text"
                value={campaign?.tickerText || ''}
                onChange={(e) => onUpdateCampaign && onUpdateCampaign({ tickerText: e.target.value })}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                placeholder="Avisos, promoções relâmpago, formas de pagamento..."
              />
            </div>

            {/* Checkboxes de exibição */}
            <div className="flex items-center gap-4 pt-1">
              <label className="flex items-center gap-1.5 text-[11px] text-neutral-300 cursor-pointer font-bold">
                <input
                  type="checkbox"
                  checked={campaign?.showClock || false}
                  onChange={(e) => onUpdateCampaign && onUpdateCampaign({ showClock: e.target.checked })}
                  className="rounded bg-neutral-800 border-neutral-700 text-amber-500 focus:ring-0 cursor-pointer"
                />
                <span>Relógio na TV</span>
              </label>

              <label className="flex items-center gap-1.5 text-[11px] text-neutral-300 cursor-pointer font-bold">
                <input
                  type="checkbox"
                  checked={campaign?.showMarqueeTicker !== false}
                  onChange={(e) => onUpdateCampaign && onUpdateCampaign({ showMarqueeTicker: e.target.checked })}
                  className="rounded bg-neutral-800 border-neutral-700 text-amber-500 focus:ring-0 cursor-pointer"
                />
                <span>Letreiro Marquee</span>
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Catálogo Comercial Brasil Modal */}
      {showCatalogModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-950">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <h4 className="text-sm font-extrabold text-white">
                  Biblioteca de Produtos Comerciais do Brasil
                </h4>
              </div>
              <button
                onClick={() => setShowCatalogModal(false)}
                className="p-1 text-neutral-400 hover:text-white cursor-pointer"
              >
                <Plus className="w-5 h-5 rotate-45" />
              </button>
            </div>

            <div className="p-3 bg-neutral-950 border-b border-neutral-800 flex flex-wrap gap-2">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-4 h-4 text-neutral-500 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  value={catalogSearch}
                  onChange={(e) => setCatalogSearch(e.target.value)}
                  placeholder="Buscar produto (ex: Coca-Cola, OMO, Picanha, Arroz, Heineken)..."
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <select
                value={catalogCategory}
                onChange={(e) => setCatalogCategory(e.target.value)}
                className="bg-neutral-900 border border-neutral-800 text-xs rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-amber-500"
              >
                <option value="all">Todas as Categorias</option>
                <option value="Bebidas">Bebidas</option>
                <option value="Carnes & Aves">Carnes & Açougue</option>
                <option value="Mercearia">Mercearia</option>
                <option value="Limpeza">Limpeza</option>
                <option value="Hortifrúti">Hortifrúti</option>
                <option value="Laticínios & Frios">Laticínios & Frios</option>
                <option value="Higiene & Beleza">Higiene & Beleza</option>
              </select>
            </div>

            <div className="p-4 grid grid-cols-2 sm:grid-cols-3 gap-3 overflow-y-auto flex-1">
              {filteredCatalog.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleAddFromCurated(item)}
                  className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 hover:border-amber-500/60 cursor-pointer transition-all flex flex-col justify-between group"
                >
                  <div className="relative w-full h-24 flex items-center justify-center">
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="max-h-20 w-auto object-contain transition-transform group-hover:scale-110"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-amber-400 block">{item.brand}</span>
                    <h5 className="text-xs font-bold text-white line-clamp-2 leading-tight mt-0.5">
                      {item.title}
                    </h5>
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-neutral-800">
                      <span className="text-xs font-black text-amber-400">R$ {item.suggestedPrice}</span>
                      <span className="text-[10px] text-neutral-400 font-bold">/{item.defaultUnit}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const ProductEditorDrawer = PainelEditorProdutos;
