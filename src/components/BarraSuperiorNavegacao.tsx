import React, { useState, useRef, useEffect } from 'react';
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
  Image as ImageIcon,
  ChevronDown,
  Plus,
  Check,
  Instagram
} from 'lucide-react';
import { BannerFormat, ThemePresetId, ClientProfile } from '../tiposGeradorBanner';
import { APP_VERSION } from '../versao';
import { isDevEnvironment, firebaseConfig } from '../services/firebaseConfig';

interface BarraSuperiorProps {
  format: BannerFormat;
  onFormatChange: (fmt: BannerFormat) => void;
  onOpenAiParser: () => void;
  onOpenTvPlayer: () => void;
  onOpenExportModal: () => void;
  onOpenThemeModal: () => void;
  onOpenSettingsModal?: () => void;
  clientName: string;
  onClientNameChange: (name: string) => void;
  activeThemeId: ThemePresetId;
  showClientLogo?: boolean;
  onToggleShowLogo?: () => void;
  cloudSyncStatus?: 'syncing' | 'saved' | 'idle';
  clients?: ClientProfile[];
  onSelectClient?: (client: ClientProfile) => void;
  activeProductCount?: number;
}

export const BarraSuperiorNavegacao: React.FC<BarraSuperiorProps> = ({
  format,
  onFormatChange,
  onOpenAiParser,
  onOpenTvPlayer,
  onOpenExportModal,
  onOpenThemeModal,
  clientName,
  onClientNameChange,
  showClientLogo = true,
  onToggleShowLogo,
  cloudSyncStatus = 'saved',
  clients = [],
  onSelectClient,
  activeProductCount = 0,
}) => {
  const [isClientDropdownOpen, setIsClientDropdownOpen] = useState(false);
  const [isFormatDropdownOpen, setIsFormatDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const formatDropdownRef = useRef<HTMLDivElement>(null);

  const FORMAT_OPTIONS: { id: BannerFormat; label: string; sublabel: string; icon: React.ReactNode }[] = [
    {
      id: '16:9',
      label: 'TV 16:9',
      sublabel: 'Horizontal (1920x1080)',
      icon: <Tv className="w-3.5 h-3.5" />,
    },
    {
      id: '9:16',
      label: 'Vertical 9:16',
      sublabel: 'WhatsApp Status / Stories (1080x1920)',
      icon: <Smartphone className="w-3.5 h-3.5" />,
    },
    {
      id: '4:5',
      label: 'Instagram Feed (4:5)',
      sublabel: 'Retrato / Carrossel (1080x1350)',
      icon: <Instagram className="w-3.5 h-3.5" />,
    },
    {
      id: '1:1',
      label: 'Feed 1:1',
      sublabel: 'Quadrado Instagram & Face (1080x1080)',
      icon: <Square className="w-3.5 h-3.5" />,
    },
    {
      id: 'tabloid',
      label: 'Tablóide de Ofertas',
      sublabel: 'Encarte / Multi-ofertas',
      icon: <Newspaper className="w-3.5 h-3.5" />,
    },
  ];

  const currentFormat = FORMAT_OPTIONS.find((f) => f.id === format) || FORMAT_OPTIONS[0];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsClientDropdownOpen(false);
      }
      if (formatDropdownRef.current && !formatDropdownRef.current.contains(e.target as Node)) {
        setIsFormatDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-neutral-800 bg-neutral-900/90 backdrop-blur-md px-2 sm:px-4 py-1.5 shrink-0">
      <div className="w-full flex items-center justify-between gap-1.5 sm:gap-2.5">
        {/* Left Side: Client Selector & Collapsible Format Selector */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {/* Client Quick Switcher & Active Banners Badge */}
          <div ref={dropdownRef} className="relative flex items-center">
            <button
              id="btn-client-quick-switch"
              type="button"
              onClick={() => setIsClientDropdownOpen(!isClientDropdownOpen)}
              className="flex items-center gap-2 bg-neutral-800/90 hover:bg-neutral-800 border border-neutral-700/80 hover:border-amber-500/50 rounded-lg px-2.5 py-1.5 text-xs text-white transition-all cursor-pointer shadow-sm group"
              title="Clique para alternar entre clientes ou ver os banners salvos de cada um"
            >
              <Store className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <div className="flex items-center gap-1.5 max-w-[130px] sm:max-w-[180px] md:max-w-[220px]">
                <span className="font-bold truncate text-white">{clientName}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 font-extrabold border border-amber-500/30 shrink-0">
                  {activeProductCount} {activeProductCount === 1 ? 'banner' : 'banners'}
                </span>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 text-neutral-400 transition-transform ${isClientDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Quick Switcher Dropdown */}
            {isClientDropdownOpen && (
              <div className="absolute top-full left-0 mt-1.5 w-72 bg-neutral-900 border border-neutral-700 rounded-xl shadow-2xl p-1.5 z-50 animate-fade-in">
                <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-neutral-400 border-b border-neutral-800 flex items-center justify-between">
                  <span>Alternar Cliente</span>
                  <span>Banners Salvos</span>
                </div>
                <div className="max-h-56 overflow-y-auto py-1 space-y-0.5">
                  {clients.map((cli) => {
                    const isCurrent = cli.name.toLowerCase() === clientName.toLowerCase();
                    const prodCount = cli.products?.length ?? (isCurrent ? activeProductCount : 0);
                    return (
                      <button
                        key={cli.id}
                        type="button"
                        onClick={() => {
                          if (onSelectClient) onSelectClient(cli);
                          setIsClientDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left text-xs transition-colors ${
                          isCurrent
                            ? 'bg-amber-500/20 text-amber-300 font-black border border-amber-500/30'
                            : 'text-neutral-200 hover:bg-neutral-800'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {cli.logoUrl ? (
                            <img src={cli.logoUrl} alt="" className="w-5 h-5 object-contain rounded bg-neutral-950 p-0.5 shrink-0" />
                          ) : (
                            <div className="w-5 h-5 rounded bg-neutral-800 text-[9px] font-black flex items-center justify-center text-amber-400 shrink-0">
                              {cli.name.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                          <span className="truncate">{cli.name}</span>
                        </div>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-300 font-bold shrink-0">
                          {prodCount} {prodCount === 1 ? 'banner' : 'banners'}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <div className="pt-1 border-t border-neutral-800">
                  <button
                    type="button"
                    onClick={() => {
                      setIsClientDropdownOpen(false);
                      onOpenThemeModal();
                    }}
                    className="w-full text-center py-1.5 px-2 bg-neutral-800 hover:bg-neutral-700 text-amber-400 font-bold text-xs rounded-lg flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Gerenciar / Cadastrar Clientes</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Item 2: Collapsible Format Selector (Default: TV 16:9) */}
          <div ref={formatDropdownRef} className="relative flex items-center">
            <button
              id="btn-format-collapsible-menu"
              type="button"
              onClick={() => setIsFormatDropdownOpen(!isFormatDropdownOpen)}
              className="flex items-center gap-1.5 bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 hover:border-amber-500/50 rounded-lg px-2.5 py-1.5 text-xs transition-all cursor-pointer shadow-sm group"
              title="Escolha o formato do banner (Padrão: TV 16:9)"
            >
              <span className="text-amber-400">{currentFormat.icon}</span>
              <span className="font-bold text-amber-400">{currentFormat.label}</span>
              <ChevronDown className={`w-3.5 h-3.5 text-neutral-400 transition-transform ${isFormatDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isFormatDropdownOpen && (
              <div className="absolute top-full left-0 mt-1.5 w-60 bg-neutral-900 border border-neutral-700 rounded-xl shadow-2xl p-1.5 z-50 animate-fade-in">
                <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-neutral-400 border-b border-neutral-800">
                  Formato do Banner
                </div>
                <div className="py-1 space-y-0.5">
                  {FORMAT_OPTIONS.map((opt) => {
                    const isSelected = opt.id === format;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        id={`btn-format-${opt.id}`}
                        onClick={() => {
                          onFormatChange(opt.id);
                          setIsFormatDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left text-xs transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30'
                            : 'text-neutral-200 hover:bg-neutral-800'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className={isSelected ? 'text-amber-400' : 'text-neutral-400'}>{opt.icon}</span>
                          <div>
                            <div className="font-bold">{opt.label}</div>
                            <div className="text-[10px] text-neutral-400">{opt.sublabel}</div>
                          </div>
                        </div>
                        {isSelected && <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
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

          {/* Botão Animar - Dispara e exibe a animação do banner */}
          <button
            id="btn-top-animar"
            type="button"
            onClick={() => {
              window.dispatchEvent(new CustomEvent('tv-replay-animation'));
            }}
            className="px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/40 transition-all cursor-pointer active:scale-95 shadow-sm"
            title="Visualizar a animação profissional dos blocos no banner"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Animar</span>
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
            title={`Sincronização em Nuvem ativa (Firebase Firestore - ${firebaseConfig.projectId})`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${cloudSyncStatus === 'syncing' ? 'bg-amber-400 animate-ping' : 'bg-emerald-400'}`} />
            <span>{cloudSyncStatus === 'syncing' ? 'Salvando na Nuvem...' : 'Nuvem Conectada ☁️'}</span>
          </div>

          {/* Badge de Ambiente DEV */}
          {isDevEnvironment() && (
            <div
              id="badge-ambiente-dev"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-orange-600 text-white font-black text-xs shadow-md border border-orange-400 select-none cursor-default shrink-0 animate-pulse"
              title={`Ambiente de Desenvolvimento Isolado (${firebaseConfig.projectId})`}
            >
              <span>🧪 DEV</span>
            </div>
          )}

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
