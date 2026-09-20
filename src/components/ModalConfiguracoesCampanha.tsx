import React, { useState, useEffect } from 'react';
import { X, Sliders, Sparkles, Check } from 'lucide-react';
import { BannerCampaign, AnimationEffect } from '../tiposGeradorBanner';

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
      });
    }
  }, [isOpen, campaign]);

  if (!isOpen) return null;

  const handleSave = () => {
    onUpdateCampaign(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-neutral-800 flex items-center justify-between bg-neutral-950">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-neutral-800 text-amber-400 flex items-center justify-center">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white">Configurações da Campanha & TV</h3>
              <p className="text-xs text-neutral-400">
                Ajuste títulos, textos legais, tempo de rotação e animações da tela.
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

        {/* Body Fields */}
        <div className="p-4 sm:p-6 space-y-4 max-h-[70vh] overflow-y-auto">
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
                <span className="text-[10px] text-neutral-500 mt-1 block">
                  Aviso legal exibido no canto inferior esquerdo da tela da TV.
                </span>
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
                <span className="text-[10px] text-neutral-500 mt-1 block">
                  Link ou assinatura exibido no canto inferior direito da tela.
                </span>
              </div>
            </div>
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

        {/* Footer */}
        <div className="p-4 border-t border-neutral-800 bg-neutral-950 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-bold rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-black text-xs font-black rounded-lg transition-colors flex items-center gap-1.5"
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
