import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Sliders, 
  Sparkles, 
  Check, 
  Palette, 
  Type, 
  Image as ImageIcon, 
  Tv, 
  Upload, 
  Trash2,
  Layers,
  Tag
} from 'lucide-react';
import { BannerCampaign, AnimationEffect, BannerCustomStyles } from '../tiposGeradorBanner';
import { MODELOS_BANNERS_MERCADO, FONTES_COMERCIAIS_RECOMENDADAS } from '../data/modelosBannersMercado';

interface ModalConfiguracoesCampanhaProps {
  isOpen: boolean;
  onClose: () => void;
  campaign: BannerCampaign;
  onUpdateCampaign: (updated: Partial<BannerCampaign>) => void;
}

export const ModalConfiguracoesCampanha: React.FC<ModalConfiguracoesCampanhaProps> = ({
  isOpen,
  onClose,
  campaign,
  onUpdateCampaign,
}) => {
  const [activeTab, setActiveTab] = useState<'estilos' | 'geral' | 'reproducao'>('estilos');
  const bgFileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    clientName: campaign.clientName,
    clientLogoUrl: campaign.clientLogoUrl || '',
    showClientLogo: campaign.showClientLogo !== false,
    campaignTitle: campaign.campaignTitle,
    campaignSubtitle: campaign.campaignSubtitle || '',
    validityText: campaign.validityText,
    tickerText: campaign.tickerText,
    legalNotice: campaign.legalNotice || '',
    footerBrandText: campaign.footerBrandText !== undefined ? campaign.footerBrandText : 'ts.playcomunique.com.br',
    animationStyle: campaign.animationStyle,
    slideDuration: campaign.slideDuration || 6,
    showClock: campaign.showClock,
    showMarqueeTicker: campaign.showMarqueeTicker,
    phoneWhatsapp: campaign.phoneWhatsapp || '',
    storeAddress: campaign.storeAddress || '',
    customStyles: campaign.customStyles || {} as BannerCustomStyles,
  });

  useEffect(() => {
    if (isOpen) {
      setFormData({
        clientName: campaign.clientName,
        clientLogoUrl: campaign.clientLogoUrl || '',
        showClientLogo: campaign.showClientLogo !== false,
        campaignTitle: campaign.campaignTitle,
        campaignSubtitle: campaign.campaignSubtitle || '',
        validityText: campaign.validityText,
        tickerText: campaign.tickerText,
        legalNotice: campaign.legalNotice || '',
        footerBrandText: campaign.footerBrandText !== undefined ? campaign.footerBrandText : 'ts.playcomunique.com.br',
        animationStyle: campaign.animationStyle,
        slideDuration: campaign.slideDuration || 6,
        showClock: campaign.showClock,
        showMarqueeTicker: campaign.showMarqueeTicker,
        phoneWhatsapp: campaign.phoneWhatsapp || '',
        storeAddress: campaign.storeAddress || '',
        customStyles: campaign.customStyles || {},
      });
    }
  }, [isOpen, campaign]);

  if (!isOpen) return null;

  const handleApplyPreset = (preset: typeof MODELOS_BANNERS_MERCADO[0]) => {
    setFormData((prev) => ({
      ...prev,
      customStyles: {
        ...prev.customStyles,
        ...preset.styles,
      },
    }));
  };

  const updateStyleField = (field: keyof BannerCustomStyles, value: any) => {
    setFormData((prev) => ({
      ...prev,
      customStyles: {
        ...prev.customStyles,
        [field]: value,
      },
    }));
  };

  const handleSave = () => {
    onUpdateCampaign(formData);
    onClose();
  };

  const styles = formData.customStyles || {};

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-neutral-800 flex items-center justify-between bg-neutral-950">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center shadow-inner">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <span>Personalização & Configurações da Campanha</span>
              </h3>
              <p className="text-xs text-neutral-400">
                Ajuste estilos visuais, modelos pré-definidos do mercado, fontes e rodapé para todos os banners.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-neutral-800 bg-neutral-950/60 px-4 pt-2 gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('estilos')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'estilos'
                ? 'border-amber-400 text-amber-400 bg-neutral-900 shadow-sm'
                : 'border-transparent text-neutral-400 hover:text-white hover:bg-neutral-900/50'
            }`}
          >
            <Palette className="w-4 h-4" />
            <span>10 Modelos & Estilos Visuais</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('geral')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'geral'
                ? 'border-amber-400 text-amber-400 bg-neutral-900 shadow-sm'
                : 'border-transparent text-neutral-400 hover:text-white hover:bg-neutral-900/50'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Textos & Identidade</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('reproducao')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'reproducao'
                ? 'border-amber-400 text-amber-400 bg-neutral-900 shadow-sm'
                : 'border-transparent text-neutral-400 hover:text-white hover:bg-neutral-900/50'
            }`}
          >
            <Tv className="w-4 h-4" />
            <span>Reprodução TV Indoor</span>
          </button>
        </div>

        {/* Body Fields */}
        <div className="p-4 sm:p-6 space-y-5 flex-1 overflow-y-auto">
          {/* TAB 1: ESTILOS VISUAIS & 10 MODELOS DE MERCADO */}
          {activeTab === 'estilos' && (
            <div className="space-y-6">
              {/* 1. 10 Modelos Pré-definidos */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>10 Modelos Pré-definidos Mais Usados no Mercado</span>
                  </label>
                  <span className="text-[10px] text-neutral-400">1-clique para aplicar visual completo</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {MODELOS_BANNERS_MERCADO.map((mod) => {
                    const isSelected = styles.presetThemeId === mod.id;
                    return (
                      <button
                        key={mod.id}
                        type="button"
                        onClick={() => handleApplyPreset(mod)}
                        className={`text-left p-3 rounded-xl border transition-all flex items-start gap-3 cursor-pointer group ${
                          isSelected
                            ? 'bg-neutral-800/90 border-amber-400 ring-2 ring-amber-400/40 shadow-lg'
                            : 'bg-neutral-950 hover:bg-neutral-800/60 border-neutral-800 hover:border-neutral-700'
                        }`}
                      >
                        {/* Swatch Preview */}
                        <div
                          style={{ background: mod.previewBg }}
                          className="w-12 h-12 rounded-lg shrink-0 border border-white/20 shadow-md relative overflow-hidden flex items-center justify-center"
                        >
                          <div
                            style={{ backgroundColor: mod.styles.priceBoxBgColor }}
                            className="absolute bottom-1 right-1 w-4 h-4 rounded text-[8px] font-black text-white flex items-center justify-center shadow"
                          >
                            $
                          </div>
                        </div>

                        {/* Info */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-1">
                            <h4 className="text-xs font-black text-white truncate group-hover:text-amber-300">
                              {mod.nome}
                            </h4>
                            {isSelected && (
                              <span className="px-1.5 py-0.5 rounded bg-amber-400 text-black font-black text-[9px] shrink-0">
                                Ativo
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-amber-400/90 font-semibold block truncate">
                            {mod.segmento}
                          </span>
                          <p className="text-[10px] text-neutral-400 leading-tight mt-1 line-clamp-2">
                            {mod.descricao}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Personalização do Fundo do Banner */}
              <div className="p-3.5 bg-neutral-950 rounded-xl border border-neutral-800 space-y-3">
                <label className="block text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-amber-400" />
                  <span>Fundo do Banner (Cor ou Imagem Personalizada)</span>
                </label>

                {/* Subir Imagem de Fundo de Sugestão */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-bold text-neutral-300">
                    <span>Imagem de Fundo Personalizada</span>
                    {styles.bannerBgImageUrl && (
                      <button
                        type="button"
                        onClick={() => updateStyleField('bannerBgImageUrl', undefined)}
                        className="text-[10px] text-red-400 hover:text-red-300 flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Remover Imagem de Fundo</span>
                      </button>
                    )}
                  </div>

                  <input
                    ref={bgFileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (ev) => {
                          if (ev.target?.result) {
                            updateStyleField('bannerBgImageUrl', ev.target.result as string);
                          }
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={styles.bannerBgImageUrl ? 'Imagem personalizada carregada' : ''}
                      readOnly
                      placeholder="Nenhuma imagem de fundo carregada (usa degradê/cor)"
                      className="flex-1 bg-neutral-900 border border-neutral-800 rounded-lg p-2 text-xs text-neutral-300"
                    />
                    <button
                      type="button"
                      onClick={() => bgFileInputRef.current?.click()}
                      className="px-3 py-2 bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload Fundo</span>
                    </button>
                  </div>
                </div>

                {/* Ou Cor de Fundo / Gradiente */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-bold text-neutral-400 mb-1">
                      Cor Base de Fundo
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={styles.bannerBgColor || '#06331e'}
                        onChange={(e) => updateStyleField('bannerBgColor', e.target.value)}
                        className="w-9 h-9 rounded-lg bg-neutral-900 border border-neutral-800 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={styles.bannerBgColor || '#06331e'}
                        onChange={(e) => updateStyleField('bannerBgColor', e.target.value)}
                        className="flex-1 bg-neutral-900 border border-neutral-800 rounded-lg p-2 text-xs text-white font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-neutral-400 mb-1">
                      Borda do Card do Produto
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={styles.cardBorderColor || '#ffffff'}
                        onChange={(e) => updateStyleField('cardBorderColor', e.target.value)}
                        className="w-9 h-9 rounded-lg bg-neutral-900 border border-neutral-800 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={styles.cardBorderColor || '#ffffff'}
                        onChange={(e) => updateStyleField('cardBorderColor', e.target.value)}
                        className="flex-1 bg-neutral-900 border border-neutral-800 rounded-lg p-2 text-xs text-white font-mono"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. Tipografia & Cores de Títulos */}
              <div className="p-3.5 bg-neutral-950 rounded-xl border border-neutral-800 space-y-3">
                <label className="block text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <Type className="w-4 h-4 text-amber-400" />
                  <span>Tipografia & Cores dos Textos</span>
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Fonte do Título da Campanha */}
                  <div>
                    <label className="block text-[11px] font-bold text-neutral-300 mb-1">
                      Fonte do Título Superior
                    </label>
                    <select
                      value={styles.campaignTitleFont || "'Montserrat', sans-serif"}
                      onChange={(e) => updateStyleField('campaignTitleFont', e.target.value)}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-2 text-xs text-white"
                    >
                      {FONTES_COMERCIAIS_RECOMENDADAS.map((f) => (
                        <option key={f.id} value={f.fontFamily}>
                          {f.nome}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Cor do Título da Campanha */}
                  <div>
                    <label className="block text-[11px] font-bold text-neutral-300 mb-1">
                      Cor do Título Superior
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={styles.campaignTitleColor || '#fbbf24'}
                        onChange={(e) => updateStyleField('campaignTitleColor', e.target.value)}
                        className="w-9 h-9 rounded-lg bg-neutral-900 border border-neutral-800 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={styles.campaignTitleColor || '#fbbf24'}
                        onChange={(e) => updateStyleField('campaignTitleColor', e.target.value)}
                        className="flex-1 bg-neutral-900 border border-neutral-800 rounded-lg p-2 text-xs text-white font-mono"
                      />
                    </div>
                  </div>

                  {/* Fonte do Nome do Produto */}
                  <div>
                    <label className="block text-[11px] font-bold text-neutral-300 mb-1">
                      Fonte do Nome do Produto
                    </label>
                    <select
                      value={styles.productTitleFont || "'Montserrat', sans-serif"}
                      onChange={(e) => updateStyleField('productTitleFont', e.target.value)}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-2 text-xs text-white"
                    >
                      {FONTES_COMERCIAIS_RECOMENDADAS.map((f) => (
                        <option key={f.id} value={f.fontFamily}>
                          {f.nome}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Cor do Nome do Produto */}
                  <div>
                    <label className="block text-[11px] font-bold text-neutral-300 mb-1">
                      Cor do Nome do Produto
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={styles.productTitleColor || '#ffffff'}
                        onChange={(e) => updateStyleField('productTitleColor', e.target.value)}
                        className="w-9 h-9 rounded-lg bg-neutral-900 border border-neutral-800 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={styles.productTitleColor || '#ffffff'}
                        onChange={(e) => updateStyleField('productTitleColor', e.target.value)}
                        className="flex-1 bg-neutral-900 border border-neutral-800 rounded-lg p-2 text-xs text-white font-mono"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 4. Caixa de Preço & Selos Promocionais */}
              <div className="p-3.5 bg-neutral-950 rounded-xl border border-neutral-800 space-y-3">
                <label className="block text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <Tag className="w-4 h-4 text-amber-400" />
                  <span>Caixa de Preço & Selos Promocionais</span>
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-neutral-300 mb-1">
                      Cor da Caixa do Preço ("POR R$")
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={styles.priceBoxBgColor || '#ea580c'}
                        onChange={(e) => updateStyleField('priceBoxBgColor', e.target.value)}
                        className="w-9 h-9 rounded-lg bg-neutral-900 border border-neutral-800 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={styles.priceBoxBgColor || '#ea580c'}
                        onChange={(e) => updateStyleField('priceBoxBgColor', e.target.value)}
                        className="flex-1 bg-neutral-900 border border-neutral-800 rounded-lg p-2 text-xs text-white font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-neutral-300 mb-1">
                      Cor do Texto do Preço ("POR R$")
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={styles.priceBoxTextColor || '#ffffff'}
                        onChange={(e) => updateStyleField('priceBoxTextColor', e.target.value)}
                        className="w-9 h-9 rounded-lg bg-neutral-900 border border-neutral-800 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={styles.priceBoxTextColor || '#ffffff'}
                        onChange={(e) => updateStyleField('priceBoxTextColor', e.target.value)}
                        className="flex-1 bg-neutral-900 border border-neutral-800 rounded-lg p-2 text-xs text-white font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-neutral-300 mb-1">
                      Cor de Fundo do Selo ("SUPER OFERTA")
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={styles.badgeBgColor || '#1a472a'}
                        onChange={(e) => updateStyleField('badgeBgColor', e.target.value)}
                        className="w-9 h-9 rounded-lg bg-neutral-900 border border-neutral-800 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={styles.badgeBgColor || '#1a472a'}
                        onChange={(e) => updateStyleField('badgeBgColor', e.target.value)}
                        className="flex-1 bg-neutral-900 border border-neutral-800 rounded-lg p-2 text-xs text-white font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-neutral-300 mb-1">
                      Cor do Texto do Selo ("SUPER OFERTA")
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={styles.badgeTextColor || '#d4f7dc'}
                        onChange={(e) => updateStyleField('badgeTextColor', e.target.value)}
                        className="w-9 h-9 rounded-lg bg-neutral-900 border border-neutral-800 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={styles.badgeTextColor || '#d4f7dc'}
                        onChange={(e) => updateStyleField('badgeTextColor', e.target.value)}
                        className="flex-1 bg-neutral-900 border border-neutral-800 rounded-lg p-2 text-xs text-white font-mono"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: TEXTOS & IDENTIDADE DO CLIENTE */}
          {activeTab === 'geral' && (
            <div className="space-y-4">
              {/* Client Name & Logo */}
              <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-amber-300">
                    Identidade do Cliente / Empresa
                  </label>
                  <label className="flex items-center gap-2 text-xs text-neutral-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.showClientLogo}
                      onChange={(e) => setFormData({ ...formData, showClientLogo: e.target.checked })}
                      className="rounded bg-neutral-800 border-neutral-700 text-amber-500 focus:ring-0"
                    />
                    <span className="text-[11px]">Exibir Logo no Banner</span>
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-neutral-400 mb-1">Nome do Cliente</label>
                    <input
                      type="text"
                      value={formData.clientName}
                      onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-amber-500"
                      placeholder="Ex: Belíssima Casa di Frutas"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-neutral-400 mb-1">
                      Link ou Arquivo do Logo (PNG/SVG)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={formData.clientLogoUrl.startsWith('data:') ? 'Logo carregado (Arquivo local)' : formData.clientLogoUrl}
                        onChange={(e) => setFormData({ ...formData, clientLogoUrl: e.target.value })}
                        className="flex-1 bg-neutral-900 border border-neutral-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-amber-500"
                        placeholder="/logos/logo.svg ou https://..."
                      />
                      <label className="px-2.5 py-2 bg-neutral-800 hover:bg-neutral-700 text-amber-400 text-xs font-bold rounded-lg border border-neutral-700 cursor-pointer shrink-0">
                        <span>Upload</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (ev) => {
                                if (ev.target?.result) {
                                  setFormData({ ...formData, clientLogoUrl: ev.target.result as string, showClientLogo: true });
                                }
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Campaign Title */}
              <div>
                <label className="block text-xs font-bold text-neutral-300 mb-1">Título da Campanha</label>
                <input
                  type="text"
                  value={formData.campaignTitle}
                  onChange={(e) => setFormData({ ...formData, campaignTitle: e.target.value })}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                  placeholder="Ex: Festival de Ofertas Imperdíveis"
                />
              </div>

              {/* Subtitle */}
              <div>
                <label className="block text-xs font-bold text-neutral-300 mb-1">Subtítulo / Slogan</label>
                <input
                  type="text"
                  value={formData.campaignSubtitle}
                  onChange={(e) => setFormData({ ...formData, campaignSubtitle: e.target.value })}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                  placeholder="Ex: Preços baixos de verdade para você economizar"
                />
              </div>

              {/* Validity text */}
              <div>
                <label className="block text-xs font-bold text-neutral-300 mb-1">Texto de Validade</label>
                <input
                  type="text"
                  value={formData.validityText}
                  onChange={(e) => setFormData({ ...formData, validityText: e.target.value })}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                  placeholder="Ex: Ofertas válidas de 18 a 22/09/2026 ou enquanto durarem os estoques"
                />
              </div>

              {/* Store contacts */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-300 mb-1">WhatsApp de Pedidos</label>
                  <input
                    type="text"
                    value={formData.phoneWhatsapp}
                    onChange={(e) => setFormData({ ...formData, phoneWhatsapp: e.target.value })}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                    placeholder="(31) 99999-9999"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-300 mb-1">Endereço da Loja</label>
                  <input
                    type="text"
                    value={formData.storeAddress}
                    onChange={(e) => setFormData({ ...formData, storeAddress: e.target.value })}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                    placeholder="Av. Principal, 1000 - Centro"
                  />
                </div>
              </div>

              {/* Sub-Footer: Texto Legal e Assinatura/Site */}
              <div className="p-3.5 bg-neutral-950 rounded-xl border border-neutral-800 space-y-3">
                <div className="flex items-center gap-2">
                  <label className="block text-xs font-bold text-amber-300">
                    Campos de Rodapé da TV (Sub-Footer)
                  </label>
                  <span className="text-[10px] text-neutral-400 bg-neutral-900 px-2 py-0.5 rounded border border-neutral-800 font-medium">
                    Fixos na base da tela
                  </span>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold text-neutral-300 mb-1">
                      Texto Legal do Rodapé (Canto Esquerdo)
                    </label>
                    <input
                      type="text"
                      value={formData.legalNotice}
                      onChange={(e) => setFormData({ ...formData, legalNotice: e.target.value })}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                      placeholder="Ex: Imagens meramente ilustrativas. Produto estoqu de bebidas a menores de 18 anos."
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-neutral-300 mb-1">
                      Site / Assinatura do Rodapé (Canto Direito)
                    </label>
                    <input
                      type="text"
                      value={formData.footerBrandText}
                      onChange={(e) => setFormData({ ...formData, footerBrandText: e.target.value })}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                      placeholder="Ex: ts.playcomunique.com.br"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: REPRODUÇÃO & TV INDOOR */}
          {activeTab === 'reproducao' && (
            <div className="space-y-4">
              {/* Animation & Slide speed */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-300 mb-1">Efeito de Animação</label>
                  <select
                    value={formData.animationStyle}
                    onChange={(e) => setFormData({ ...formData, animationStyle: e.target.value as AnimationEffect })}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="zoom">Zoom Suave (Ken Burns)</option>
                    <option value="pulse">Pulso de Destaque</option>
                    <option value="slide">Deslizar Lateral</option>
                    <option value="none">Estático (Sem transição)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-300 mb-1">Tempo por Oferta na TV</label>
                  <select
                    value={formData.slideDuration}
                    onChange={(e) => setFormData({ ...formData, slideDuration: Number(e.target.value) })}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value={4}>4 Segundos</option>
                    <option value={6}>6 Segundos (Padrão)</option>
                    <option value={8}>8 Segundos</option>
                    <option value={10}>10 Segundos</option>
                    <option value={15}>15 Segundos</option>
                  </select>
                </div>
              </div>

              {/* Ticker marquee */}
              <div>
                <label className="block text-xs font-bold text-neutral-300 mb-1">
                  Letreiro de Rodapé (Ticker TV Indoor)
                </label>
                <input
                  type="text"
                  value={formData.tickerText}
                  onChange={(e) => setFormData({ ...formData, tickerText: e.target.value })}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                  placeholder="Avisos, promoções relâmpago, clube de descontos"
                />
              </div>

              {/* Checkboxes */}
              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 text-xs text-neutral-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.showClock}
                    onChange={(e) => setFormData({ ...formData, showClock: e.target.checked })}
                    className="rounded bg-neutral-800 border-neutral-700 text-amber-500 focus:ring-0"
                  />
                  <span>Mostrar Relógio na TV</span>
                </label>

                <label className="flex items-center gap-2 text-xs text-neutral-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.showMarqueeTicker}
                    onChange={(e) => setFormData({ ...formData, showMarqueeTicker: e.target.checked })}
                    className="rounded bg-neutral-800 border-neutral-700 text-amber-500 focus:ring-0"
                  />
                  <span>Mostrar Letreiro de Rodapé</span>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-800 bg-neutral-950 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-black text-xs font-black rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-lg"
          >
            <Check className="w-4 h-4" />
            <span>Salvar Alterações</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export const SettingsModal = ModalConfiguracoesCampanha;
