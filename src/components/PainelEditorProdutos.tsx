import React, { useState, useRef } from 'react';
import { 
  Plus, 
  Trash2, 
  GripVertical, 
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
  Loader2
} from 'lucide-react';
import { ProductItem, CuratedProduct } from '../tiposGeradorBanner';
import { BANCO_PRODUTOS_COMERCIAIS } from '../data/bancoProdutosComerciais';
import { handleImageError } from '../utils/imageFallback';
import { downloadElementAsPng } from '../utils/ajudanteExportacao';

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
}) => {
  const [showCatalogModal, setShowCatalogModal] = useState<boolean>(false);
  const [catalogSearch, setCatalogSearch] = useState<string>('');
  const [catalogCategory, setCatalogCategory] = useState<string>('all');
  const [isSearchingRealImage, setIsSearchingRealImage] = useState<boolean>(false);
  const [isGeneratingAiImage, setIsGeneratingAiImage] = useState<boolean>(false);
  const [isPromptCopied, setIsPromptCopied] = useState<boolean>(false);
  const [downloadingIndex, setDownloadingIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDownloadIndividualBanner = async (idx: number) => {
    setDownloadingIndex(idx);
    try {
      // 1. Alterna o banner principal para este produto específico
      onSelectProductIndex(idx);
      // 2. Aguarda transição do DOM e renderização dos elementos visuais
      await new Promise((r) => setTimeout(r, 280));
      // 3. Executa o download em alta resolução via html-to-image
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
      const res = await fetch('/api/gemini/build-commercial-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: activeProduct.title,
          brand: activeProduct.brand,
          category: activeProduct.category,
          unit: activeProduct.unit,
        }),
      });
      const data = await res.json();
      if (data && data.success && data.geminiWebPrompt) {
        await navigator.clipboard.writeText(data.geminiWebPrompt);
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

  const activeProduct = products[currentProductIndex] || products[0];

  return (
    <div className="w-full bg-neutral-900 border-t sm:border-t-0 sm:border-l border-neutral-800 p-4 flex flex-col gap-4">
      {/* Client Identity & Logo Quick Toggle */}
      {onToggleShowLogo && (
        <div className="bg-neutral-800/80 border border-neutral-700/80 rounded-xl p-2.5 flex items-center justify-between gap-2 shadow-sm">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center shrink-0">
              <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-white truncate">
                {clientName || 'Belíssima Casa di Frutas'}
              </div>
              <div className="text-[10px] text-neutral-400">
                Logotipo no Banner:{' '}
                <span className={showClientLogo !== false ? 'text-amber-400 font-bold' : 'text-neutral-400'}>
                  {showClientLogo !== false ? 'Ativado (Visível)' : 'Desativado (Oculto)'}
                </span>
              </div>
            </div>
          </div>

          <button
            id="btn-sidebar-toggle-logo"
            type="button"
            onClick={onToggleShowLogo}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
              showClientLogo !== false
                ? 'bg-amber-400 hover:bg-amber-300 text-neutral-950 shadow'
                : 'bg-neutral-700 hover:bg-neutral-600 text-neutral-200'
            }`}
            title="Alternar presença do logotipo no banner"
          >
            {showClientLogo !== false ? 'Ocultar Logo' : 'Exibir Logo'}
          </button>
        </div>
      )}

      {/* Top action row */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-extrabold text-white flex items-center gap-1.5">
            <Tag className="w-4 h-4 text-amber-400" />
            <span>Lista de Ofertas ({products.length})</span>
          </h3>
          <p className="text-[11px] text-neutral-400">Gerencie os itens do banner e tablóide.</p>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setShowCatalogModal(true)}
            className="px-2.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-amber-300 font-bold text-xs rounded-lg flex items-center gap-1 border border-neutral-700"
            title="Adicionar produto da biblioteca comercial com foto em alta"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Catálogo Brasil</span>
          </button>

          <button
            onClick={handleAddNewBlank}
            className="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-black text-xs rounded-lg flex items-center gap-1 shadow"
            title="Adicionar item em branco"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Novo</span>
          </button>
        </div>
      </div>

      {/* Product List Cards */}
      <div className="space-y-2 max-h-64 sm:max-h-72 overflow-y-auto pr-1">
        {products.map((item, idx) => {
          const isSelected = idx === currentProductIndex;

          return (
            <div
              key={item.id}
              onClick={() => onSelectProductIndex(idx)}
              className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                item.hidden ? 'opacity-65 border-dashed border-neutral-800 bg-neutral-950/30' : ''
              } ${
                isSelected
                  ? 'border-amber-400 bg-neutral-800/90 ring-1 ring-amber-400/30'
                  : 'border-neutral-800 bg-neutral-950/60 hover:border-neutral-700'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  onError={(e) => handleImageError(e, item.title, item.category)}
                  className="w-10 h-10 object-contain rounded-lg bg-neutral-900 border border-neutral-800 p-0.5 shrink-0"
                  referrerPolicy="no-referrer"
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-300">
                      {item.badge || 'OFERTA'}
                    </span>
                    {item.hidden && (
                      <span className="text-[8px] font-black uppercase px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        Oculto na TV
                      </span>
                    )}
                    <span className="text-[10px] text-neutral-400 truncate">{item.category}</span>
                  </div>
                  <h4 className={`text-xs font-bold truncate ${item.hidden ? 'text-neutral-400 line-through' : 'text-white'}`}>
                    {item.title}
                  </h4>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <div className="text-right leading-tight pr-1">
                  <div className="text-xs font-black text-amber-400">R$ {item.price}</div>
                  <div className="text-[9px] text-neutral-400">/{item.unit}</div>
                </div>

                {/* Botão: Baixar Banner Individual Só Deste Produto */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownloadIndividualBanner(idx);
                  }}
                  className="p-1.5 rounded-lg text-neutral-400 hover:text-amber-300 hover:bg-neutral-800 transition-colors"
                  title={`Baixar banner individual de "${item.title}" (PNG)`}
                >
                  {downloadingIndex === idx ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
                  ) : (
                    <Download className="w-3.5 h-3.5" />
                  )}
                </button>

                {/* Botão: Ocultar / Exibir na Playlist da TV */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onUpdateProduct(idx, { hidden: !item.hidden });
                  }}
                  className={`p-1.5 rounded-lg transition-colors ${
                    item.hidden
                      ? 'text-amber-400 hover:text-amber-300 bg-amber-500/10 border border-amber-500/30'
                      : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800'
                  }`}
                  title={
                    item.hidden
                      ? 'Item OCULTO na TV. Clique para reativar na playlist.'
                      : 'Item VISÍVEL na TV. Clique para ocultar da rotação sem deletar.'
                  }
                >
                  {item.hidden ? (
                    <EyeOff className="w-3.5 h-3.5" />
                  ) : (
                    <Eye className="w-3.5 h-3.5" />
                  )}
                </button>

                {/* Botão: Deletar */}
                {products.length > 1 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveProduct(idx);
                    }}
                    className="p-1.5 rounded-lg text-neutral-500 hover:text-red-400 hover:bg-neutral-800 transition-colors"
                    title="Remover produto da lista"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Currently Selected Product Editor */}
      {activeProduct && (
        <div className="p-3.5 bg-neutral-950 rounded-xl border border-neutral-800 space-y-3">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
            <span className="text-xs font-black text-white flex items-center gap-1.5">
              <span>Editando Item #{currentProductIndex + 1}</span>
            </span>
            <label className="flex items-center gap-1.5 text-[11px] text-amber-400 cursor-pointer font-bold">
              <input
                type="checkbox"
                checked={activeProduct.isHero || false}
                onChange={(e) => onUpdateProduct(currentProductIndex, { isHero: e.target.checked })}
                className="rounded bg-neutral-800 border-neutral-700 text-amber-500 focus:ring-0"
              />
              <Star className="w-3 h-3 fill-amber-400" />
              <span>Super Destaque</span>
            </label>
          </div>

          {/* Title */}
          <div>
            <label className="block text-[10px] font-bold text-neutral-400 uppercase">Nome Comercial do Produto</label>
            <input
              type="text"
              value={activeProduct.title}
              onChange={(e) => onUpdateProduct(currentProductIndex, { title: e.target.value })}
              className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500 mt-1"
            />
          </div>

          {/* Price, Original Price and Unit */}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-[10px] font-bold text-neutral-400 uppercase">Preço Por (R$)</label>
              <input
                type="text"
                value={activeProduct.price}
                onChange={(e) => onUpdateProduct(currentProductIndex, { price: e.target.value })}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs font-bold text-amber-400 focus:outline-none focus:border-amber-500 mt-1"
                placeholder="24,90"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-neutral-400 uppercase">Preço De (R$)</label>
              <input
                type="text"
                value={activeProduct.originalPrice || ''}
                onChange={(e) => onUpdateProduct(currentProductIndex, { originalPrice: e.target.value })}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs text-neutral-400 line-through focus:outline-none focus:border-amber-500 mt-1"
                placeholder="29,90"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-neutral-400 uppercase">Unidade</label>
              <input
                type="text"
                value={activeProduct.unit}
                onChange={(e) => onUpdateProduct(currentProductIndex, { unit: e.target.value })}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500 mt-1"
                placeholder="kg, 2L, cada"
              />
            </div>
          </div>

          {/* Badge & Category */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] font-bold text-neutral-400 uppercase">Selo Promocional</label>
              <input
                type="text"
                value={activeProduct.badge || ''}
                onChange={(e) => onUpdateProduct(currentProductIndex, { badge: e.target.value })}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500 mt-1"
                placeholder="SUPER OFERTA, SÓ HOJE"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-neutral-400 uppercase">Categoria</label>
              <input
                type="text"
                value={activeProduct.category}
                onChange={(e) => onUpdateProduct(currentProductIndex, { category: e.target.value })}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500 mt-1"
                placeholder="Bebidas, Carnes, Limpeza"
              />
            </div>
          </div>

          {/* Image URL / Custom packshot */}
          <div>
            <div className="flex items-center justify-between">
              <label className="block text-[10px] font-bold text-neutral-400 uppercase">Foto da Embalagem / Packshot</label>
              <span className="text-[9px] text-amber-400">Suporta upload de foto real</span>
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <input
                type="text"
                value={activeProduct.imageUrl}
                onChange={(e) => onUpdateProduct(currentProductIndex, { imageUrl: e.target.value })}
                className="flex-1 bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500 font-mono truncate"
                placeholder="Link da imagem ou envie foto..."
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
                className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-500 font-bold disabled:opacity-50"
                title="Buscar foto real da embalagem oficial no Google / Varejo"
              >
                {isSearchingRealImage ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black border border-amber-400 font-bold"
                title="Carregar foto real da embalagem do seu celular/computador"
              >
                <Upload className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setShowCatalogModal(true)}
                className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-amber-400 border border-neutral-700"
                title="Escolher do Catálogo Comercial"
              >
                <ImageIcon className="w-4 h-4" />
              </button>
            </div>

            {/* AI Image Generation & Marketing Prompt Toolbar */}
            <div className="mt-2.5 pt-2 border-t border-neutral-800 space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                <button
                  type="button"
                  disabled={isGeneratingAiImage}
                  onClick={handleGenerateAiCommercialImage}
                  className="w-full py-1.5 px-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-extrabold text-[11px] rounded-lg shadow flex items-center justify-center gap-1.5 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                  title="Gerar banner comercial ambientado com IA (Gemini / Imagen)"
                >
                  {isGeneratingAiImage ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5 fill-black" />
                  )}
                  <span>{isGeneratingAiImage ? 'Gerando Cena...' : 'Gerar Arte IA ✨'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyGeminiPrompt}
                  className="w-full py-1.5 px-2 bg-neutral-800 hover:bg-neutral-700 text-amber-300 font-bold text-[11px] rounded-lg border border-neutral-700 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  title="Copiar prompt profissional pronto para colar no Gemini Pro Web"
                >
                  {isPromptCopied ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  <span>{isPromptCopied ? 'Prompt Copiado!' : 'Prompt Gemini Pro'}</span>
                </button>
              </div>

              {/* Display Mode Toggle */}
              <div className="flex items-center justify-between bg-neutral-900 px-2.5 py-1.5 rounded-lg border border-neutral-800">
                <span className="text-[10px] text-neutral-400 font-bold">Estilo do Card:</span>
                <button
                  type="button"
                  onClick={() => {
                    const nextMode = activeProduct.imageDisplayMode === 'contain' ? 'ambient' : 'contain';
                    onUpdateProduct(currentProductIndex, { imageDisplayMode: nextMode });
                  }}
                  className="text-[10px] font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer"
                >
                  <SlidersHorizontal className="w-3 h-3 text-neutral-400" />
                  <span>
                    {activeProduct.imageDisplayMode === 'contain'
                      ? 'Packshot Recortado (Branco)'
                      : 'Ambientado (Full-Bleed TV) ✨'}
                  </span>
                </button>
              </div>
            </div>

            {/* Individual Product Action Toolbar (Download Banner & TV Visibility) */}
            <div className="mt-3 pt-3 border-t border-neutral-800 flex flex-col gap-2">
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-neutral-400 flex items-center justify-between">
                <span>Ações Individuais deste Item:</span>
                {activeProduct.hidden && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/25 text-amber-300 font-bold border border-amber-500/40">
                    Oculto na TV
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {/* Baixar Banner Individual Só Deste Produto */}
                <button
                  type="button"
                  disabled={downloadingIndex === currentProductIndex}
                  onClick={() => handleDownloadIndividualBanner(currentProductIndex)}
                  className="w-full py-2 px-3 bg-neutral-800 hover:bg-neutral-700 text-amber-400 hover:text-amber-300 font-extrabold text-xs rounded-xl border border-neutral-700 hover:border-amber-500/50 flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                  title="Baixar imagem deste banner individual em alta resolução (PNG)"
                >
                  {downloadingIndex === currentProductIndex ? (
                    <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                  ) : (
                    <Download className="w-4 h-4 text-amber-400" />
                  )}
                  <span>
                    {downloadingIndex === currentProductIndex
                      ? 'Gerando PNG...'
                      : 'Baixar Banner Deste Item (PNG)'}
                  </span>
                </button>

                {/* Ocultar / Exibir na Playlist da TV */}
                <button
                  type="button"
                  onClick={() => onUpdateProduct(currentProductIndex, { hidden: !activeProduct.hidden })}
                  className={`w-full py-2 px-3 font-extrabold text-xs rounded-xl border flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95 cursor-pointer ${
                    activeProduct.hidden
                      ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border-amber-500/50'
                      : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border-neutral-700'
                  }`}
                  title={
                    activeProduct.hidden
                      ? 'Reativar produto na rotação da TV'
                      : 'Ocultar da TV sem deletar da lista de ofertas'
                  }
                >
                  {activeProduct.hidden ? (
                    <>
                      <Eye className="w-4 h-4 text-amber-400" />
                      <span>Reativar na TV (Está Oculto)</span>
                    </>
                  ) : (
                    <>
                      <EyeOff className="w-4 h-4 text-neutral-400" />
                      <span>Ocultar da Playlist da TV</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Catalog Modal */}
      {showCatalogModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            {/* Header */}
            <div className="p-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-950">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <h4 className="text-sm font-extrabold text-white">
                  Biblioteca de Produtos Comerciais do Brasil
                </h4>
              </div>
              <button
                onClick={() => setShowCatalogModal(false)}
                className="p-1 text-neutral-400 hover:text-white"
              >
                <Plus className="w-5 h-5 rotate-45" />
              </button>
            </div>

            {/* Search & Categories */}
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

            {/* Grid */}
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
