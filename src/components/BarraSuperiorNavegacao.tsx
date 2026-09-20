import React from 'react';
import { 
  Tv, 
  Smartphone, 
  Square, 
  Newspaper, 
  Sparkles, 
  Play, 
  Download, 
  Palette, 
  Sliders,
  Store,
  Image as ImageIcon
} from 'lucide-react';
import { BannerFormat, ThemePresetId } from '../tiposGeradorBanner';
import { APP_VERSION } from '../versao';

interface BarraSuperiorProps {
  format: BannerFormat;
  onFormatChange: (fmt: BannerFormat) => void;
  onOpenAiParser: () => void;
  onOpenTvPlayer: () => void;
  onOpenExportModal: () => void;
  onOpenThemeModal: () => void;
  onOpenSettingsModal: () => void;
  clientName: string;
  onClientNameChange: (name: string) => void;
  activeThemeId: ThemePresetId;
  showClientLogo?: boolean;
  onToggleShowLogo?: () => void;
  cloudSyncStatus?: 'syncing' | 'saved' | 'idle';
}

export const BarraSuperiorNavegacao: React.FC<BarraSuperiorProps> = ({
  format,
  onFormatChange,
  onOpenAiParser,
  onOpenTvPlayer,
  onOpenExportModal,
  onOpenThemeModal,
  onOpenSettingsModal,
  clientName,
  onClientNameChange,
  showClientLogo = true,
  onToggleShowLogo,
  cloudSyncStatus = 'saved',
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-neutral-800 bg-neutral-900/90 backdrop-blur-md px-3 sm:px-4 py-1.5 sm:py-2 shrink-0">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2 sm:gap-2.5">
        {/* Brand & Client Name */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-amber-500 to-red-600 flex items-center justify-center shadow-lg shadow-red-500/20">
              <Tv className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base tracking-tight text-white font-['Montserrat']">
                  PLAY <span className="text-amber-400">COMUNIQUE</span>
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  TV & Ads
                </span>
              </div>
              <p className="text-[11px] text-neutral-400">playcomunique.com.br</p>
            </div>
          </div>

          {/* Client Input */}
          <div className="hidden sm:flex items-center gap-1.5 pl-3 border-l border-neutral-800">
            <Store className="w-4 h-4 text-neutral-400" />
            <input
              id="input-client-name"
              type="text"
              value={clientName}
              onChange={(e) => onClientNameChange(e.target.value)}
              placeholder="Nome do Cliente (ex: Supermercado Boa Praça)"
              className="bg-neutral-800/80 border border-neutral-700/80 rounded-md px-2.5 py-1 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500 w-48 sm:w-56"
              title="Nome do Cliente para a campanha"
            />
          </div>
        </div>

        {/* Format Selector Pills */}
        <div className="flex items-center bg-neutral-950 p-1 rounded-lg border border-neutral-800 text-xs font-medium">
          <button
            id="btn-format-16-9"
            onClick={() => onFormatChange('16:9')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md transition-all ${
              format === '16:9'
                ? 'bg-amber-500 text-black font-bold shadow'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
            }`}
            title="TV Indoor Horizontal (1920x1080 - 16:9)"
          >
            <Tv className="w-3.5 h-3.5" />
            <span className="hidden md:inline">TV 16:9</span>
            <span className="md:hidden">16:9</span>
          </button>

          <button
            id="btn-format-9-16"
            onClick={() => onFormatChange('9:16')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md transition-all ${
              format === '9:16'
                ? 'bg-amber-500 text-black font-bold shadow'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
            }`}
            title="Totem Vertical / Stories / Reels / TikTok (1080x1920 - 9:16)"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Vertical 9:16</span>
            <span className="md:hidden">9:16</span>
          </button>

          <button
            id="btn-format-1-1"
            onClick={() => onFormatChange('1:1')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md transition-all ${
              format === '1:1'
                ? 'bg-amber-500 text-black font-bold shadow'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
            }`}
            title="Feed Instagram / Facebook / WhatsApp (1:1 Quadrado)"
          >
            <Square className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Feed 1:1</span>
            <span className="md:hidden">1:1</span>
          </button>

          <button
            id="btn-format-tabloid"
            onClick={() => onFormatChange('tabloid')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md transition-all ${
              format === 'tabloid'
                ? 'bg-amber-500 text-black font-bold shadow'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
            }`}
            title="Jornal de Ofertas / Encarte de Supermercado (Grid Multi-ofertas)"
          >
            <Newspaper className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Tablóide de Ofertas</span>
            <span className="md:hidden">Tablóide</span>
          </button>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* AI Parser Button */}
          <button
            id="btn-open-ai-parser"
            onClick={onOpenAiParser}
            className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-neutral-950 font-bold px-3 py-1.5 rounded-lg text-xs shadow-md shadow-amber-500/20 transition-transform active:scale-95"
            title="Interpretar lista de produtos do WhatsApp com IA e corrigir erros"
          >
            <Sparkles className="w-3.5 h-3.5 fill-black" />
            <span className="font-extrabold">IA Corretor de Lista</span>
          </button>

          {/* Client & Colors Manager */}
          <button
            id="btn-open-clients"
            onClick={onOpenThemeModal}
            className="p-1.5 sm:px-2.5 sm:py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg text-xs flex items-center gap-1.5 border border-neutral-700 transition-colors"
            title="Gerenciar Clientes, Logos e Cores da TV"
          >
            <Store className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Clientes</span>
          </button>

          {/* Quick Toggle Logo On/Off */}
          {onToggleShowLogo && (
            <button
              id="btn-toggle-logo-top"
              type="button"
              onClick={onToggleShowLogo}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 border transition-all cursor-pointer ${
                showClientLogo !== false
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                  : 'bg-neutral-800/80 text-neutral-400 border-neutral-700 hover:text-white'
              }`}
              title="Ativar ou ocultar logotipo gráfico no banner"
            >
              <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden md:inline">Logo:</span>
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-black uppercase ${
                showClientLogo !== false ? 'bg-amber-400 text-neutral-950' : 'bg-neutral-700 text-neutral-300'
              }`}>
                {showClientLogo !== false ? 'Com Logo' : 'Sem Logo'}
              </span>
            </button>
          )}

          {/* Settings / Configs */}
          <button
            id="btn-open-settings"
            onClick={onOpenSettingsModal}
            className="p-1.5 sm:px-2.5 sm:py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg text-xs flex items-center gap-1.5 border border-neutral-700 transition-colors"
            title="Configurações da Campanha"
          >
            <Sliders className="w-3.5 h-3.5 text-neutral-400" />
            <span className="hidden sm:inline">Ajustes</span>
          </button>

          {/* TV Player Mode */}
          <button
            id="btn-open-tv-player"
            onClick={onOpenTvPlayer}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1.5 rounded-lg text-xs shadow-md shadow-emerald-600/20 transition-transform active:scale-95"
            title="Abrir Modo TV Indoor (tv.playcomunique.com.br/player) com rotação automática"
          >
            <Play className="w-3.5 h-3.5 fill-white" />
            <span className="hidden sm:inline">Modo TV Indoor</span>
            <span className="sm:hidden">Player</span>
          </button>

          {/* Export Button */}
          <button
            id="btn-open-export"
            onClick={onOpenExportModal}
            className="flex items-center gap-1.5 bg-neutral-100 hover:bg-white text-black font-bold px-3 py-1.5 rounded-lg text-xs shadow transition-transform active:scale-95"
            title="Baixar vídeo animado (WebM/MP4) ou imagem HD"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exportar</span>
          </button>

          {/* Cloud Sync Status Indicator */}
          <div
            id="badge-cloud-sync"
            className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors select-none ${
              cloudSyncStatus === 'syncing'
                ? 'bg-amber-500/15 text-amber-300 border-amber-500/30 animate-pulse'
                : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
            }`}
            title="Sincronização em Nuvem ativa (Firebase Firestore - cartaz-ia-playcomunique)"
          >
            <span className={`w-1.5 h-1.5 rounded-full ${cloudSyncStatus === 'syncing' ? 'bg-amber-400 animate-ping' : 'bg-emerald-400'}`} />
            <span>{cloudSyncStatus === 'syncing' ? 'Salvando na Nuvem...' : 'Nuvem Conectada ☁️'}</span>
          </div>

          {/* Badge de Versão Amarelo Ouro solicitado pelo usuário */}
          <div
            id="badge-versao-sistema"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 text-neutral-950 font-black text-xs shadow-md border border-amber-300/70 select-none cursor-default shrink-0"
            title={`Versão ativa do Play Comunique: ${APP_VERSION}`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-neutral-950/80 animate-pulse" />
            <span>{APP_VERSION}</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export const Header = BarraSuperiorNavegacao;
