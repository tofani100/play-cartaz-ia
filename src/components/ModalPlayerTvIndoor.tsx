import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  X, 
  Maximize2, 
  Minimize2, 
  Play, 
  Pause, 
  Radio,
  Tv
} from 'lucide-react';
import { BannerCampaign, ThemeColors } from '../tiposGeradorBanner';
import { VisualizadorBannerTV } from './VisualizadorBannerTV';
import { APP_VERSION } from '../versao';

interface ModalPlayerTvIndoorProps {
  isOpen: boolean;
  onClose: () => void;
  campaign: BannerCampaign;
  theme: ThemeColors;
}

export const ModalPlayerTvIndoor: React.FC<ModalPlayerTvIndoorProps> = ({
  isOpen,
  onClose,
  campaign,
  theme,
}) => {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [showControls, setShowControls] = useState<boolean>(false);

  const hideControlsTimer = useRef<NodeJS.Timeout | null>(null);

  // Reference logical resolution for pixel-perfect broadcast signage
  const targetWidth = campaign.format === '9:16' ? 1080 : campaign.format === '1:1' ? 1080 : campaign.format === '4:5' ? 1080 : 1920;
  const targetHeight = campaign.format === '9:16' ? 1920 : campaign.format === '1:1' ? 1080 : campaign.format === '4:5' ? 1350 : 1080;

  // Safe area multiplier state (default: 'safe' = 0.96 for anti-overscan protection on TVs)
  const [safeAreaMode, setSafeAreaMode] = useState<'safe' | 'full' | 'legacy'>(() => {
    try {
      const p = new URLSearchParams(window.location.search);
      const safeParam = p.get('safe');
      if (safeParam === '1' || safeParam === 'full') return 'full';
      if (safeParam === 'legacy' || safeParam === '0.92') return 'legacy';
      const stored = localStorage.getItem('playcomunique_tv_safe_mode');
      if (stored === 'full' || stored === 'legacy' || stored === 'safe') return stored;
    } catch {}
    return 'safe';
  });

  const cycleSafeAreaMode = () => {
    setSafeAreaMode((prev) => {
      const next = prev === 'safe' ? 'full' : prev === 'full' ? 'legacy' : 'safe';
      try {
        localStorage.setItem('playcomunique_tv_safe_mode', next);
      } catch {}
      return next;
    });
  };

  const [scale, setScale] = useState<number>(1);

  // Dynamic GPU Scale Engine: calculates optimal scale factor for any screen (720p, 1080p, 4K, Android TV)
  useEffect(() => {
    const computeScale = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const baseScale = Math.min(vw / targetWidth, vh / targetHeight);
      const factor = safeAreaMode === 'full' ? 1.0 : safeAreaMode === 'legacy' ? 0.92 : 0.96;
      setScale(baseScale * factor);
    };

    computeScale();
    window.addEventListener('resize', computeScale);
    return () => window.removeEventListener('resize', computeScale);
  }, [targetWidth, targetHeight, safeAreaMode]);

  // Screen WakeLock to prevent TV screen from going to sleep
  useEffect(() => {
    let wakeLock: any = null;
    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          wakeLock = await (navigator as any).wakeLock.request('screen');
        }
      } catch {}
    };
    requestWakeLock();
    return () => {
      if (wakeLock) {
        wakeLock.release().catch(() => {});
      }
    };
  }, []);

  // Auto-hide controls and cursor after 2.5s of inactivity
  const showControlsTemporarily = () => {
    setShowControls(true);
    if (hideControlsTimer.current) clearTimeout(hideControlsTimer.current);
    hideControlsTimer.current = setTimeout(() => {
      setShowControls(false);
    }, 2500);
  };

  useEffect(() => {
    if (!isOpen) return;

    // Show controls initially for 2.5 seconds, then fade out
    showControlsTemporarily();

    // 1. Try auto-entering fullscreen (works in TV browsers, kiosk WebViews and Android TV)
    try {
      if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {
          // Standard desktop browsers require a user gesture first
        });
      }
    } catch {
      // Ignore security restriction in desktop browsers
    }

    // 2. Automatically enter fullscreen on the VERY FIRST click/touch anywhere
    const handleFirstInteraction = () => {
      if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
      }
    };
    window.addEventListener('click', handleFirstInteraction, { once: true });
    window.addEventListener('touchstart', handleFirstInteraction, { once: true });

    const handleUserActivity = () => {
      showControlsTemporarily();
    };

    window.addEventListener('mousemove', handleUserActivity);
    window.addEventListener('mousedown', handleUserActivity);
    window.addEventListener('touchstart', handleUserActivity);

    // Prevent body scrolling
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('click', handleFirstInteraction);
      window.removeEventListener('touchstart', handleFirstInteraction);
      window.removeEventListener('mousemove', handleUserActivity);
      window.removeEventListener('mousedown', handleUserActivity);
      window.removeEventListener('touchstart', handleUserActivity);
      if (hideControlsTimer.current) clearTimeout(hideControlsTimer.current);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  // Filter out products that have hidden === true so they are skipped in TV rotation
  const effectivePlayable = useMemo(() => {
    if (!campaign.products || campaign.products.length === 0) return [0];
    const indices = campaign.products
      .map((p, idx) => (!p.hidden ? idx : -1))
      .filter((idx) => idx !== -1);
    return indices.length > 0 ? indices : [0];
  }, [campaign.products]);

  // Serialized key to avoid unnecessary timer resets
  const effectivePlayableKey = useMemo(() => effectivePlayable.join(','), [effectivePlayable]);

  const effectivePlayableRef = useRef<number[]>(effectivePlayable);
  useEffect(() => {
    effectivePlayableRef.current = effectivePlayable;
  }, [effectivePlayable]);

  // If current product becomes hidden or is not in playable list, safely switch to the first visible product
  useEffect(() => {
    if (!effectivePlayable.includes(currentIndex)) {
      setCurrentIndex(effectivePlayable[0]);
      setProgress(0);
    }
  }, [effectivePlayableKey, currentIndex]);

  // Auto-play timer (cycles strictly through visible/unhidden products)
  useEffect(() => {
    if (!isOpen || !isPlaying) {
      setProgress(0);
      return;
    }

    const playable = effectivePlayableRef.current;
    if (!playable || playable.length <= 1) {
      setProgress(0);
      return;
    }

    const duration = (campaign.slideDuration || 6) * 1000;
    const intervalTime = 100;
    const startTime = Date.now();

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, (elapsed / duration) * 100);
      setProgress(pct);

      if (elapsed >= duration) {
        setProgress(0);
        setCurrentIndex((prev) => {
          const list = effectivePlayableRef.current;
          if (!list || list.length === 0) return 0;
          const currentPos = list.indexOf(prev);
          const nextPos = (currentPos + 1) % list.length;
          return list[nextPos];
        });
      }
    }, intervalTime);

    return () => clearInterval(interval);
  }, [isOpen, isPlaying, campaign.slideDuration, currentIndex, effectivePlayableKey]);

  // Fullscreen state listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      showControlsTemporarily();
      if (e.key === 'Escape') {
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(() => {});
        } else {
          onClose();
        }
      }
      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        setIsPlaying((p) => !p);
      }
      if (e.key === 'ArrowRight') {
        setCurrentIndex((prev) => {
          const list = effectivePlayableRef.current;
          if (!list || list.length === 0) return 0;
          const currentPos = list.indexOf(prev);
          const nextPos = (currentPos + 1) % list.length;
          return list[nextPos];
        });
        setProgress(0);
      }
      if (e.key === 'ArrowLeft') {
        setCurrentIndex((prev) => {
          const list = effectivePlayableRef.current;
          if (!list || list.length === 0) return 0;
          const currentPos = list.indexOf(prev);
          const prevPos = (currentPos - 1 + list.length) % list.length;
          return list[prevPos];
        });
        setProgress(0);
      }
      if (e.key === 'f' || e.key === 'F') {
        toggleFullscreen();
      }
      if (e.key === 's' || e.key === 'S' || e.key === 'o' || e.key === 'O') {
        cycleSafeAreaMode();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, effectivePlayable, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      onDoubleClick={toggleFullscreen}
      className={`fixed inset-0 w-screen h-[100dvh] z-50 bg-black flex flex-col items-center justify-center select-none overflow-hidden transition-all duration-300 ${
        showControls ? 'cursor-default' : 'cursor-none'
      }`}
    >
      {/* Top Floating TV Signage Status Bar (Auto-Hides after 2.5s) */}
      <div 
        className={`absolute top-0 left-0 right-0 z-50 p-2 sm:p-4 bg-gradient-to-b from-black/90 via-black/60 to-transparent flex items-center justify-between text-xs text-white transition-all duration-500 ${
          showControls ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'
        }`}
      >
        <div className="flex items-center gap-1.5 sm:gap-2 bg-black/60 backdrop-blur-md px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl border border-white/10">
          <div className="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-emerald-500 animate-ping" />
          <Radio className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-emerald-400" />
          <span className="font-bold tracking-wider text-neutral-200 text-[11px] sm:text-xs truncate max-w-[140px] sm:max-w-none">
            {campaign.clientName || 'TV INDOOR PLAY COMUNIQUE'}
          </span>
          <span className="px-1.5 sm:px-2 py-0.5 rounded bg-emerald-500/20 text-[9px] sm:text-[10px] uppercase font-bold text-emerald-300 border border-emerald-500/30 hidden xs:inline">
            Ao Vivo na TV
          </span>
          <span 
            id="player-tv-version-badge"
            className="px-1.5 py-0.5 rounded bg-amber-500/25 text-[9px] sm:text-[10px] font-mono font-black text-amber-300 border border-amber-500/40"
            title="Versão do Sistema Play Comunique"
          >
            {APP_VERSION}
          </span>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2.5 bg-black/60 backdrop-blur-md p-1 sm:p-1.5 rounded-xl border border-white/10">
          {/* TV Safe Area Anti-Overscan Button */}
          <button
            onClick={cycleSafeAreaMode}
            className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-bold text-[11px] sm:text-xs transition-colors shadow border border-white/10"
            title="Alternar Margem Anti-Corte da TV (Tecla S): 96% Seguro, 100% Borda Total ou 92% TV Antiga"
          >
            <Tv className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-amber-400" />
            <span className="hidden xs:inline">
              {safeAreaMode === 'safe'
                ? 'Margem: 96% (Anti-Corte TV)'
                : safeAreaMode === 'full'
                ? 'Margem: 100% (Borda Total)'
                : 'Margem: 92% (TV Antiga)'}
            </span>
          </button>

          <button
            onClick={() => setIsPlaying((p) => !p)}
            className="p-1.5 sm:p-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white transition-colors"
            title={isPlaying ? 'Pausar (Espaço)' : 'Play (Espaço)'}
          >
            {isPlaying ? <Pause className="w-3.5 sm:w-4 h-3.5 sm:h-4" /> : <Play className="w-3.5 sm:w-4 h-3.5 sm:h-4 fill-white" />}
          </button>

          <button
            onClick={toggleFullscreen}
            className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-[11px] sm:text-xs transition-colors shadow"
            title="Tela Cheia Total (F11 ou Tecla F) - Oculta Windows e Navegador"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 sm:w-4 h-3.5 sm:h-4" /> : <Maximize2 className="w-3.5 sm:w-4 h-3.5 sm:h-4" />}
            <span className="hidden sm:inline">{isFullscreen ? 'Sair Tela Cheia' : 'Tela Cheia Total (F11)'}</span>
          </button>

          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold transition-colors"
            title="Sair do Modo TV (Esc)"
          >
            <X className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
          </button>
        </div>
      </div>

      {/* Main TV Screen Canvas: GPU Dynamic Scale Engine & Anti-Overscan Safe Area */}
      <div className="w-full h-full flex items-center justify-center p-0 m-0 overflow-hidden bg-black">
        <div
          id="tv-indoor-scaled-artboard"
          style={{
            width: `${targetWidth}px`,
            height: `${targetHeight}px`,
            transform: `scale(${scale})`,
            transformOrigin: 'center center',
            flexShrink: 0,
            willChange: 'transform',
          }}
          className="relative overflow-hidden flex items-center justify-center shadow-2xl"
        >
          <VisualizadorBannerTV
            campaign={campaign}
            theme={theme}
            currentProductIndex={currentIndex}
            onSelectProductIndex={(idx) => {
              setCurrentIndex(idx);
              setProgress(0);
            }}
            isTvPlayerMode={true}
          />
        </div>
      </div>

      {/* Slide Progress Bar (Bottom) - Discreto */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/40 z-40 pointer-events-none">
        <div 
          className="h-full bg-amber-400/80 transition-all duration-100 ease-linear shadow-[0_0_8px_rgba(251,191,36,0.6)]"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};

export const TvPlayerModal = ModalPlayerTvIndoor;

