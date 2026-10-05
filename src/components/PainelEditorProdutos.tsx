import React, { useState, useRef } from 'react';
import { 
  Plus, 
  Minus,
  Trash2, 
  Image as ImageIcon, 
  Sparkles, 
  Check, 
  Search,
  Tag,
  Star,
  Upload,
  Copy,
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
  Store,
  X
} from 'lucide-react';
import { 
  ProductItem, 
  CuratedProduct, 
  BannerCampaign, 
  ThemeColors, 
  BannerCustomStyles, 
  AnimationEffect,
  OPCOES_TAMANHO_TITULO,
  OPCOES_TAMANHO_VALIDADE
} from '../tiposGeradorBanner';
import { BANCO_PRODUTOS_COMERCIAIS } from '../data/bancoProdutosComerciais';
import { MODELOS_BANNERS_MERCADO, FONTES_COMERCIAIS_RECOMENDADAS } from '../data/modelosBannersMercado';
import { handleImageError } from '../utils/imageFallback';
import { downloadElementAsPng, gerarVideoAnimadoProdutoIndividual, buildExportFilename } from '../utils/ajudanteExportacao';
import { compressImageToDataUrl } from '../utils/imageCompressor';
import { aplicarMascaraTelefoneInput } from '../utils/mascaraTelefone';

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
  onRestoreProduct?: (product: ProductItem) => void;
  onReorderProduct?: (fromIndex: number, toIndex: number) => void;
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
  onRestoreProduct,
  onReorderProduct,
  showClientLogo = true,
  onToggleShowLogo,
  clientName,
  campaign,
  theme,
  onUpdateCampaign,
}) => {
  const [showCatalogModal, setShowCatalogModal] = useState<boolean>(false);
  const [showTrashModal, setShowTrashModal] = useState<boolean>(false);
  const [trashItems, setTrashItems] = useState<Array<{ product: ProductItem; clientName: string; deletedAt: string }>>([]);

  const loadTrash = () => {
    try {
      const raw = localStorage.getItem('playcomunique_lixeira_banners');
      if (raw) {
        setTrashItems(JSON.parse(raw));
      } else {
        setTrashItems([]);
      }
    } catch {
      setTrashItems([]);
    }
  };
  const [catalogSearch, setCatalogSearch] = useState<string>('');
  const [catalogCategory, setCatalogCategory] = useState<string>('all');
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

      // Em formato tablóide ou alterações de cabeçalho da campanha (fontes, cores, tamanhos do título e validade)
      // ou fundos e temas, atualizar também os estilos gerais da campanha
      if (
        (campaign?.format === 'tabloid' || 
         updates.campaignTitleFont !== undefined ||
         updates.campaignTitleColor !== undefined ||
         updates.campaignTitleFontSize !== undefined ||
         updates.validityTextFont !== undefined ||
         updates.validityTextColor !== undefined ||
         updates.validityTextFontSize !== undefined ||
         updates.bannerBgColor !== undefined ||
         updates.bannerBgGradient !== undefined ||
         updates.bannerBgImageUrl !== undefined ||
         updates.presetThemeId !== undefined) && 
        onUpdateCampaign &&
        campaign
      ) {
        onUpdateCampaign({
          customStyles: {
            ...(campaign.customStyles || {}),
            ...updates,
          },
        });
      }
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

  const handleStepTitleFontSize = (delta: number) => {
    const current = currentEffectiveStyles.campaignTitleFontSize;
    const currentNum = (!current || current === 'auto') ? 32 : (parseInt(current, 10) || 32);
    const nextVal = Math.min(60, Math.max(16, currentNum + delta));
    handleApplyCustomStyle({ campaignTitleFontSize: `${nextVal}px` });
  };

  const handleStepValidityFontSize = (delta: number) => {
    const current = currentEffectiveStyles.validityTextFontSize;
    const currentNum = (!current || current === 'auto') ? 14 : (parseInt(current, 10) || 14);
    const nextVal = Math.min(26, Math.max(8, currentNum + delta));
    handleApplyCustomStyle({ validityTextFontSize: `${nextVal}px` });
  };

  const handleResetProductStyles = () => {
    if (customizationScope === 'single') {
      onUpdateProduct(currentProductIndex, {
        customStyles: undefined,
        badgeBgColor: undefined,
        badgeTextColor: undefined,
        secondBadgeBgColor: undefined,
        secondBadgeTextColor: undefined,
      });
      if (campaign?.format === 'tabloid' && onUpdateCampaign) {
        onUpdateCampaign({ customStyles: undefined });
      }
    } else {
      if (onUpdateCampaign && campaign) {
        onUpdateCampaign({ customStyles: undefined });
      }
      products.forEach((p, idx) => {
        onUpdateProduct(idx, {
          customStyles: undefined,
          badgeBgColor: undefined,
          badgeTextColor: undefined,
          secondBadgeBgColor: undefined,
          secondBadgeTextColor: undefined,
        });
      });
    }
  };

  const handleDownloadIndividualBanner = async (idx: number) => {
    setDownloadingIndex(idx);
    try {
      onSelectProductIndex(idx);
      await new Promise((r) => setTimeout(r, 280));
      const targetProd = products[idx];
      const filename = buildExportFilename({
        clientName: campaign?.clientName || clientName,
        productTitle: targetProd?.title,
        campaignTitle: campaign?.campaignTitle,
        format: campaign?.format || '16:9',
        index: idx,
        extension: 'png',
      });
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
            type="button"
            onClick={() => {
              loadTrash();
              setShowTrashModal(true);
            }}
            className="px-2 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white font-bold text-xs rounded-lg flex items-center gap-1 border border-neutral-700 cursor-pointer"
            title="Lixeira de Banners - Recuperar itens excluídos"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Lixeira</span>
          </button>

          <button
            onClick={() => setShowCatalogModal(true)}
            className="px-2.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-amber-300 font-bold text-xs rounded-lg flex items-center gap-1 border border-neutral-700 cursor-pointer"
            title="Adicionar produto da biblioteca comercial com foto em alta"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Catálogo</span>
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
      <div className="space-y-1.5 max-h-60 sm:max-h-72 overflow-y-auto pr-1">
        {products.map((item, idx) => {
          const isSelected = idx === currentProductIndex;

          return (
            <div
              key={item.id}
              onClick={() => onSelectProductIndex(idx)}
              className={`p-2 rounded-xl border transition-all cursor-pointer flex items-center gap-2.5 ${
                item.hidden ? 'opacity-65 border-dashed border-neutral-800 bg-neutral-950/30' : ''
              } ${
                isSelected
                  ? 'border-amber-400 bg-neutral-800/95 ring-1 ring-amber-400/40 shadow-md'
                  : 'border-neutral-800 bg-neutral-950/60 hover:border-neutral-700'
              }`}
            >
              {/* Imagem do produto ampliada para identificação imediata */}
              <img
                src={item.imageUrl}
                alt={item.title}
                onError={(e) => handleImageError(e, item.title, item.category)}
                className="w-14 h-14 sm:w-16 sm:h-16 object-contain rounded-lg bg-neutral-950 border border-neutral-800 p-1 shrink-0 shadow-inner"
                referrerPolicy="no-referrer"
              />

              {/* Informações limpas: Identificação, Título e Botões de Ação */}
              <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-[11px] font-extrabold text-amber-400 shrink-0">
                    #{idx + 1}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onUpdateProduct(idx, { isHero: !item.isHero });
                    }}
                    className={`p-0.5 rounded transition-colors cursor-pointer shrink-0 ${
                      item.isHero ? 'text-amber-400 hover:text-amber-300' : 'text-neutral-600 hover:text-neutral-400'
                    }`}
                    title={item.isHero ? '⭐ Banner DUPLO (2 vagas no tablóide). Clique para desmarcar.' : 'Clique para tornar banner DUPLO (2 vagas de destaque)'}
                  >
                    <Star className={`w-3.5 h-3.5 ${item.isHero ? 'fill-amber-400 text-amber-400' : ''}`} />
                  </button>
                  <h4 
                    className={`text-xs sm:text-[13px] font-bold truncate ${item.hidden ? 'text-neutral-400 line-through' : 'text-white'}`}
                    title={item.title}
                  >
                    {item.title}
                  </h4>
                  {item.isHero && (
                    <span className="text-[8px] font-black uppercase px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 shrink-0">
                      Duplo
                    </span>
                  )}
                  {item.hidden && (
                    <span className="text-[8px] font-black uppercase px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 shrink-0">
                      Oculto
                    </span>
                  )}
                </div>

                {/* Botões de Ação reposicionados diretamente abaixo da descrição */}
                <div className="flex items-center gap-1 mt-1 pt-0.5">
                  {onReorderProduct && (
                    <>
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={(e) => {
                          e.stopPropagation();
                          onReorderProduct(idx, idx - 1);
                        }}
                        className="p-1 rounded-md text-neutral-400 hover:text-white hover:bg-neutral-800 disabled:opacity-20 disabled:hover:bg-transparent transition-colors cursor-pointer"
                        title="Mover banner para cima"
                      >
                        <ChevronUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={idx === products.length - 1}
                        onClick={(e) => {
                          e.stopPropagation();
                          onReorderProduct(idx, idx + 1);
                        }}
                        className="p-1 rounded-md text-neutral-400 hover:text-white hover:bg-neutral-800 disabled:opacity-20 disabled:hover:bg-transparent transition-colors cursor-pointer"
                        title="Mover banner para baixo"
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownloadIndividualBanner(idx);
                    }}
                    className="p-1 rounded-md text-neutral-400 hover:text-amber-300 hover:bg-neutral-800 transition-colors"
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
                    className="p-1 rounded-md text-neutral-400 hover:text-purple-300 hover:bg-neutral-800 transition-colors"
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
                    className="p-1 rounded-md text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition-colors"
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
                    className="p-1 rounded-md text-neutral-400 hover:text-amber-300 hover:bg-neutral-800 transition-colors"
                    title="Duplicar banner"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (products.length === 1) {
                        const confirmReset = window.confirm(
                          `⚠️ LIMPAR BANNER ÚNICO\n\n` +
                          `Este é o único banner restante na lista.\n\n` +
                          `Deseja redefini-lo para um novo banner em branco?\n\n` +
                          `O banner atual "${item.title}" será enviado com segurança para a Lixeira e você poderá recuperá-lo a qualquer momento.`
                        );
                        if (confirmReset) {
                          try {
                            const lixeiraRaw = localStorage.getItem('playcomunique_lixeira_banners');
                            const lixeira = lixeiraRaw ? JSON.parse(lixeiraRaw) : [];
                            lixeira.unshift({
                              product: item,
                              clientName: clientName || '',
                              deletedAt: new Date().toISOString(),
                            });
                            localStorage.setItem('playcomunique_lixeira_banners', JSON.stringify(lixeira.slice(0, 50)));
                          } catch (err) {}
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
                        const confirmDelete = window.confirm(
                          `⚠️ CONFIRMAÇÃO OBRIGATÓRIA DE EXCLUSÃO DE BANNER\n\n` +
                          `Banner #${idx + 1}: "${item.title}"\n\n` +
                          `Atenção: O banner será removido desta lista e enviado para a Lixeira de Banners, onde ficará salvo para restauração a qualquer momento com 1 clique.\n\n` +
                          `Deseja realmente excluir este banner?`
                        );
                        if (confirmDelete) {
                          onRemoveProduct(idx);
                        }
                      }
                    }}
                    className="p-1 rounded-md text-neutral-500 hover:text-red-400 hover:bg-neutral-800 transition-colors"
                    title="Excluir banner (com confirmação e lixeira de segurança)"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
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
                      compressImageToDataUrl(file, 800, 800, 0.88).then((compressed) => {
                        if (compressed && onUpdateCampaign) {
                          onUpdateCampaign({ clientLogoUrl: compressed, showClientLogo: true });
                        }
                      });
                    }
                  }}
                />

                <button
                  type="button"
                  onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = 'image/*';
                    input.onchange = (ev: Event) => {
                      const file = (ev.target as HTMLInputElement)?.files?.[0];
                      if (file) {
                        compressImageToDataUrl(file, 800, 800, 0.88).then((compressed) => {
                          if (compressed && onUpdateCampaign) {
                            onUpdateCampaign({ clientLogoUrl: compressed, showClientLogo: true });
                          }
                        });
                      }
                    };
                    input.click();
                  }}
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

              {/* Seletor de Tamanho da Fonte do Título Superior */}
              <div className="mt-1.5 p-1.5 bg-neutral-950/70 rounded-lg border border-neutral-800/80 flex items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <label className="block text-[9px] text-neutral-400 mb-0.5 font-medium">Tamanho da Fonte (Título):</label>
                  <select
                    value={currentEffectiveStyles.campaignTitleFontSize || 'auto'}
                    onChange={(e) => handleApplyCustomStyle({ campaignTitleFontSize: e.target.value })}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded px-1.5 py-1 text-[10px] text-white focus:outline-none focus:border-amber-500"
                  >
                    {OPCOES_TAMANHO_TITULO.map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {opt.label}
                      </option>
                    ))}
                    {currentEffectiveStyles.campaignTitleFontSize && 
                     !OPCOES_TAMANHO_TITULO.some(o => o.id === currentEffectiveStyles.campaignTitleFontSize) && (
                      <option value={currentEffectiveStyles.campaignTitleFontSize}>
                        Personalizado ({currentEffectiveStyles.campaignTitleFontSize})
                      </option>
                    )}
                  </select>
                </div>

                <div className="flex flex-col items-end shrink-0">
                  <span className="text-[8px] text-neutral-400 font-bold mb-0.5 uppercase">Ajuste Fino</span>
                  <div className="flex items-center gap-1 bg-neutral-900 rounded border border-neutral-800 p-0.5">
                    <button
                      type="button"
                      onClick={() => handleStepTitleFontSize(-2)}
                      className="w-5 h-5 flex items-center justify-center rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors cursor-pointer"
                      title="Diminuir tamanho da fonte do título (-2px)"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="text-[9px] font-mono font-bold text-amber-300 px-1 min-w-[28px] text-center">
                      {currentEffectiveStyles.campaignTitleFontSize && currentEffectiveStyles.campaignTitleFontSize !== 'auto'
                        ? currentEffectiveStyles.campaignTitleFontSize
                        : 'Auto'}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleStepTitleFontSize(2)}
                      className="w-5 h-5 flex items-center justify-center rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors cursor-pointer"
                      title="Aumentar tamanho da fonte do título (+2px)"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Texto de Validade das Ofertas + Fonte + Cor + Tamanho */}
            <div>
              <label className="block text-[10px] font-bold text-neutral-400 uppercase mb-1">
                Texto de Validade das Ofertas
              </label>
              <input
                type="text"
                value={campaign?.validityText || ''}
                onChange={(e) => onUpdateCampaign && onUpdateCampaign({ validityText: e.target.value })}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500 font-semibold"
                placeholder="Ex: Ofertas válidas até domingo..."
              />

              <div className="grid grid-cols-2 gap-2 mt-1.5">
                <div>
                  <label className="block text-[9px] text-neutral-400 mb-0.5">Fonte da Validade:</label>
                  <select
                    value={currentEffectiveStyles.validityTextFont || "'Montserrat', sans-serif"}
                    onChange={(e) => handleApplyCustomStyle({ validityTextFont: e.target.value })}
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
                  <label className="block text-[9px] text-neutral-400 mb-0.5">Cor da Validade:</label>
                  <div className="flex items-center gap-1">
                    <input
                      type="color"
                      value={currentEffectiveStyles.validityTextColor || '#f5f5f5'}
                      onChange={(e) => handleApplyCustomStyle({ validityTextColor: e.target.value })}
                      className="w-6 h-6 rounded border border-neutral-700 bg-neutral-900 cursor-pointer shrink-0"
                    />
                    <input
                      type="text"
                      value={currentEffectiveStyles.validityTextColor || '#f5f5f5'}
                      onChange={(e) => handleApplyCustomStyle({ validityTextColor: e.target.value })}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded px-1.5 py-0.5 text-[10px] text-white font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Seletor de Tamanho da Fonte da Validade */}
              <div className="mt-1.5 p-1.5 bg-neutral-950/70 rounded-lg border border-neutral-800/80 flex items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <label className="block text-[9px] text-neutral-400 mb-0.5 font-medium">Tamanho da Fonte (Validade):</label>
                  <select
                    value={currentEffectiveStyles.validityTextFontSize || 'auto'}
                    onChange={(e) => handleApplyCustomStyle({ validityTextFontSize: e.target.value })}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded px-1.5 py-1 text-[10px] text-white focus:outline-none focus:border-amber-500"
                  >
                    {OPCOES_TAMANHO_VALIDADE.map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {opt.label}
                      </option>
                    ))}
                    {currentEffectiveStyles.validityTextFontSize && 
                     !OPCOES_TAMANHO_VALIDADE.some(o => o.id === currentEffectiveStyles.validityTextFontSize) && (
                      <option value={currentEffectiveStyles.validityTextFontSize}>
                        Personalizado ({currentEffectiveStyles.validityTextFontSize})
                      </option>
                    )}
                  </select>
                </div>

                <div className="flex flex-col items-end shrink-0">
                  <span className="text-[8px] text-neutral-400 font-bold mb-0.5 uppercase">Ajuste Fino</span>
                  <div className="flex items-center gap-1 bg-neutral-900 rounded border border-neutral-800 p-0.5">
                    <button
                      type="button"
                      onClick={() => handleStepValidityFontSize(-1)}
                      className="w-5 h-5 flex items-center justify-center rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors cursor-pointer"
                      title="Diminuir tamanho da fonte de validade (-1px)"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="text-[9px] font-mono font-bold text-amber-300 px-1 min-w-[28px] text-center">
                      {currentEffectiveStyles.validityTextFontSize && currentEffectiveStyles.validityTextFontSize !== 'auto'
                        ? currentEffectiveStyles.validityTextFontSize
                        : 'Auto'}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleStepValidityFontSize(1)}
                      className="w-5 h-5 flex items-center justify-center rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors cursor-pointer"
                      title="Aumentar tamanho da fonte de validade (+1px)"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
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
                  onChange={(e) => onUpdateCampaign && onUpdateCampaign({ phoneWhatsapp: aplicarMascaraTelefoneInput(e.target.value) })}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                  placeholder="(41) 9 9999 - 9999"
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
                  2. Editando Item #{currentProductIndex + 1} de {products.length}
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
                    compressImageToDataUrl(file, 1920, 1080, 0.85).then((compressed) => {
                      if (compressed) {
                        handleApplyCustomStyle({ bannerBgImageUrl: compressed });
                      }
                    });
                  }
                }}
              />

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = 'image/*';
                    input.onchange = (ev: Event) => {
                      const file = (ev.target as HTMLInputElement)?.files?.[0];
                      if (file) {
                        compressImageToDataUrl(file, 1920, 1080, 0.85).then((compressed) => {
                          if (compressed) {
                            handleApplyCustomStyle({ bannerBgImageUrl: compressed });
                          }
                        });
                      }
                    };
                    input.click();
                  }}
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
                  onChange={(e) => {
                    const newStyle = e.target.value as AnimationEffect;
                    if (onUpdateCampaign) {
                      onUpdateCampaign({ animationStyle: newStyle });
                      setTimeout(() => {
                        window.dispatchEvent(new CustomEvent('tv-replay-animation'));
                      }, 50);
                    }
                  }}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="zoom">Zoom Suave & Pop de Preço (Ken Burns)</option>
                  <option value="slide">Deslizar Lateral dos 3 Blocos</option>
                  <option value="pulse">Pulso de Destaque Comercial</option>
                  <option value="none">Estático (Sem Animação)</option>
                </select>

                <button
                  type="button"
                  onClick={() => {
                    window.dispatchEvent(new CustomEvent('tv-replay-animation'));
                  }}
                  className="w-full mt-2 flex items-center justify-center gap-1.5 py-1.5 px-3 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 rounded-lg text-[11px] font-bold transition-all active:scale-95 cursor-pointer shadow-sm"
                  title="Testar animação dos blocos (1: Nome Comercial, 2: Foto Packshot, 3: Preço)"
                >
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  <span>Testar Animação dos 3 Blocos</span>
                </button>
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

      {/* Modal Lixeira de Banners - Proteção contra perda e restauração em 1 clique */}
      {showTrashModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-4 sm:p-5 border-b border-neutral-800 flex items-center justify-between bg-neutral-950">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
                  <RotateCcw className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Lixeira de Banners</h3>
                  <p className="text-xs text-neutral-400">
                    Recupere banners excluídos a qualquer momento com apenas 1 clique.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowTrashModal(false)}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto flex-1 space-y-3">
              {trashItems.length === 0 ? (
                <div className="text-center py-12 text-neutral-500">
                  <RotateCcw className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm font-semibold">A Lixeira de Banners está vazia.</p>
                  <p className="text-xs text-neutral-600 mt-1">
                    Nenhum banner foi removido recentemente. Quando você excluir um item, ele ficará protegido aqui.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between pb-2 border-b border-neutral-800 text-xs text-neutral-400">
                    <span>{trashItems.length} banner(s) salvos na lixeira:</span>
                    <button
                      type="button"
                      onClick={() => {
                        trashItems.forEach((t) => onRestoreProduct?.(t.product));
                        setTrashItems([]);
                        localStorage.removeItem('playcomunique_lixeira_banners');
                        setShowTrashModal(false);
                      }}
                      className="text-emerald-400 hover:text-emerald-300 font-bold hover:underline"
                    >
                      Restaurar Todos
                    </button>
                  </div>
                  {trashItems.map((item, index) => (
                    <div
                      key={index}
                      className="p-2.5 bg-neutral-950 border border-neutral-800 rounded-xl flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={item.product.imageUrl}
                          alt={item.product.title}
                          onError={(e) => handleImageError(e, item.product.title, item.product.category)}
                          className="w-12 h-12 object-contain rounded bg-neutral-900 border border-neutral-800 p-0.5 shrink-0"
                        />
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-white truncate" title={item.product.title}>
                            {item.product.title}
                          </h4>
                          <div className="flex items-center gap-2 text-[10px] text-neutral-400 mt-0.5">
                            <span className="text-amber-400 font-bold">R$ {item.product.price}</span>
                            {item.product.originalPrice && (
                              <span className="line-through text-neutral-500">R$ {item.product.originalPrice}</span>
                            )}
                            {item.clientName && (
                              <span className="bg-neutral-800 px-1.5 py-0.2 rounded text-neutral-300">
                                {item.clientName}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            if (onRestoreProduct) {
                              onRestoreProduct(item.product);
                            }
                            const updated = trashItems.filter((_, i) => i !== index);
                            setTrashItems(updated);
                            localStorage.setItem('playcomunique_lixeira_banners', JSON.stringify(updated));
                          }}
                          className="px-2.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs rounded-lg flex items-center gap-1 transition-all"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Restaurar</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const updated = trashItems.filter((_, i) => i !== index);
                            setTrashItems(updated);
                            localStorage.setItem('playcomunique_lixeira_banners', JSON.stringify(updated));
                          }}
                          className="p-1.5 text-neutral-500 hover:text-red-400 hover:bg-neutral-800 rounded-lg transition-colors"
                          title="Remover definitivamente da lixeira"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-3 bg-neutral-950 border-t border-neutral-800 flex justify-end">
              <button
                type="button"
                onClick={() => setShowTrashModal(false)}
                className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs rounded-xl transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const ProductEditorDrawer = PainelEditorProdutos;
