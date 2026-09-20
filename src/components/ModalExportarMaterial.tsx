import React, { useState } from 'react';
import { 
  Download, 
  X, 
  Film, 
  Image as ImageIcon, 
  Printer, 
  Tv, 
  Check, 
  Copy, 
  Sparkles,
  ExternalLink,
  Loader2,
  FolderDown,
  Play
} from 'lucide-react';
import { BannerCampaign, ThemeColors } from '../tiposGeradorBanner';
import { downloadElementAsPng, gerarVideoAnimadoBanner, VideoExportResult } from '../utils/ajudanteExportacao';
import { BANCO_TEMAS_VISUAIS } from '../data/bancoTemasVisuais';
import { APP_VERSION } from '../versao';

interface ModalExportarMaterialProps {
  isOpen: boolean;
  onClose: () => void;
  campaign: BannerCampaign;
  theme?: ThemeColors;
  onOpenTvPlayer: () => void;
  onSelectProductIndex?: (index: number) => void;
}

export const ModalExportarMaterial: React.FC<ModalExportarMaterialProps> = ({
  isOpen,
  onClose,
  campaign,
  theme,
  onOpenTvPlayer,
  onSelectProductIndex,
}) => {
  const [isExportingImage, setIsExportingImage] = useState<boolean>(false);
  const [isExportingVideo, setIsExportingVideo] = useState<boolean>(false);
  const [videoProgress, setVideoProgress] = useState<number>(0);
  const [isExportingAllBanners, setIsExportingAllBanners] = useState<boolean>(false);
  const [exportAllProgress, setExportAllProgress] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [generatedVideo, setGeneratedVideo] = useState<VideoExportResult | null>(null);
  const [videoError, setVideoError] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://tv.playcomunique.com.br';
  const playerUrl = `${currentOrigin}?mode=tv`;

  const activeTheme = theme || BANCO_TEMAS_VISUAIS[campaign.themeId] || BANCO_TEMAS_VISUAIS['supermarket-red'];

  const handleCopyLink = () => {
    navigator.clipboard.writeText(playerUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleOpenPlayerNewTab = () => {
    window.open(playerUrl, '_blank');
  };

  const handleDownloadPng = async () => {
    setIsExportingImage(true);
    try {
      const targetId = campaign.format === 'tabloid' ? 'tabloid-capture' : 'tv-banner-capture';
      await downloadElementAsPng(targetId, `playcomunique-${campaign.format}-${Date.now()}.png`);
    } catch (e) {
      console.error(e);
    } finally {
      setIsExportingImage(false);
    }
  };

  const handleDownloadAllIndividualBanners = async () => {
    if (!campaign.products || campaign.products.length === 0) return;
    setIsExportingAllBanners(true);
    const originalIndex = campaign.activeProductIndex || 0;
    try {
      // Non-hidden products
      const productsToExport = campaign.products
        .map((p, idx) => (!p.hidden ? idx : -1))
        .filter((idx) => idx !== -1);
      const targetIndices = productsToExport.length > 0 ? productsToExport : [0];

      for (let i = 0; i < targetIndices.length; i++) {
        const idx = targetIndices[i];
        setExportAllProgress(`${i + 1}/${targetIndices.length}`);
        if (onSelectProductIndex) {
          onSelectProductIndex(idx);
          await new Promise((r) => setTimeout(r, 350));
        }
        const item = campaign.products[idx];
        const cleanTitle = (item?.title || `produto-${idx + 1}`)
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]/g, '-')
          .slice(0, 30);
        const filename = `banner-${cleanTitle}-${idx + 1}.png`;
        await downloadElementAsPng('tv-banner-capture', filename);
        await new Promise((r) => setTimeout(r, 250));
      }
    } catch (err) {
      console.error('Erro ao exportar lote de banners individuais:', err);
    } finally {
      if (onSelectProductIndex) {
        onSelectProductIndex(originalIndex);
      }
      setIsExportingAllBanners(false);
      setExportAllProgress('');
    }
  };

  const handlePrintPdf = () => {
    window.print();
  };

  const handleRecordVideo = async () => {
    setIsExportingVideo(true);
    setVideoProgress(5);
    setVideoError(null);

    try {
      const result = await gerarVideoAnimadoBanner(
        campaign,
        activeTheme,
        5.0,
        (progress) => setVideoProgress(progress),
        onSelectProductIndex
      );

      setGeneratedVideo(result);
    } catch (err: any) {
      console.error('Erro ao gerar vídeo:', err);
      setVideoError('Não foi possível gravar o vídeo no navegador atual. Tente salvar em imagem PNG ou abrir o Modo Player.');
    } finally {
      setIsExportingVideo(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-neutral-800 flex items-center justify-between bg-neutral-950">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center text-black font-black">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-white">
                  Exportar Material & Sugestão de Formatos
                </h3>
                <span className="px-2 py-0.5 rounded-md bg-gradient-to-r from-amber-400 to-amber-300 text-neutral-950 font-black text-[11px] shadow-sm">
                  {APP_VERSION}
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                Escolha o formato ideal para TV Indoor física, redes sociais ou impressão.
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

        {/* Options List */}
        <div className="p-4 sm:p-6 space-y-4 overflow-y-auto max-h-[75vh]">
          {/* Format 1: HTML5 TV Player (The user's TV Indoor priority) */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/40 via-neutral-900 to-neutral-900 border-2 border-emerald-500/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 shrink-0">
                <Tv className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-sm font-bold text-white">Player Web TV Indoor (HTML5)</h4>
                  <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded bg-emerald-500 text-black">
                    Melhor para TV
                  </span>
                </div>
                <p className="text-xs text-neutral-300 mt-1 leading-relaxed">
                  <strong>Por que é o melhor?</strong> Pesa menos de 100KB, roda em 4K nativo e 60 FPS liso sem travar TV Box ou mini PCs. Atualiza os preços na tela instantaneamente via nuvem.
                </p>
                <div className="mt-2 flex items-center gap-2 text-xs font-mono text-emerald-300 bg-neutral-950 px-2.5 py-1 rounded border border-neutral-800 break-all">
                  <span>{playerUrl}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2 shrink-0 w-full sm:w-auto">
              <button
                onClick={() => {
                  onClose();
                  onOpenTvPlayer();
                }}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs rounded-lg transition-all shadow text-center flex items-center justify-center gap-1.5"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Abrir Modo Player</span>
              </button>
              <button
                onClick={handleOpenPlayerNewTab}
                className="px-4 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-bold text-xs rounded-lg flex items-center justify-center gap-1.5 transition-all"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Abrir Nova Aba</span>
              </button>
              <button
                onClick={handleCopyLink}
                className="px-4 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-bold text-xs rounded-lg flex items-center justify-center gap-1.5 transition-all"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'Copiado!' : 'Copiar URL'}</span>
              </button>
            </div>
          </div>

          {/* Format 2: High Resolution PNG Image */}
          <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 shrink-0">
                <ImageIcon className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Banners em Imagem HD (PNG / Alta Definição)</h4>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Baixe o banner exibido na tela ou salve todos os banners individuais de cada produto para postar no WhatsApp e Instagram.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 shrink-0 w-full sm:w-auto">
              <button
                onClick={handleDownloadPng}
                disabled={isExportingImage}
                className="px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                title="Baixar banner do produto atualmente selecionado"
              >
                {isExportingImage ? <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" /> : <Download className="w-3.5 h-3.5" />}
                <span>{isExportingImage ? 'Baixando...' : 'Baixar Banner Atual'}</span>
              </button>

              {campaign.products && campaign.products.length > 1 && (
                <button
                  onClick={handleDownloadAllIndividualBanners}
                  disabled={isExportingAllBanners}
                  className="px-3 py-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black text-xs rounded-lg flex items-center justify-center gap-1.5 transition-all shadow cursor-pointer disabled:opacity-50"
                  title="Baixar todos os banners individuais de cada produto de uma vez"
                >
                  {isExportingAllBanners ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-black" />
                      <span>Salvando {exportAllProgress}</span>
                    </>
                  ) : (
                    <>
                      <FolderDown className="w-3.5 h-3.5 text-black" />
                      <span>Baixar Todos Individuais</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Format 3: Animated Video (WebM / MP4) */}
          <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 flex flex-col gap-3">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 shrink-0">
                  <Film className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-white">Vídeo HD Oficial para TV & Redes (MP4)</h4>
                    <span className="text-[10px] uppercase font-bold px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300">
                      Full HD 1080p • 15s Comercial TV • Fiel 100%
                    </span>
                  </div>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    Gera arquivo de vídeo MP4 com duração completa de 15 segundos (padrão de TV Indoor e pen drive), 100% idêntico ao banner da sua tela, com logo oficial e transição de ofertas.
                  </p>
                </div>
              </div>

              <button
                onClick={handleRecordVideo}
                disabled={isExportingVideo}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 transition-all shrink-0 shadow cursor-pointer disabled:opacity-50"
              >
                {isExportingVideo ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Gerando {videoProgress}%</span>
                  </>
                ) : (
                  <>
                    <Film className="w-3.5 h-3.5" />
                    <span>Gerar Vídeo MP4</span>
                  </>
                )}
              </button>
            </div>

            {/* Notification and Details when Video is Generated */}
            {generatedVideo && (
              <div className="mt-1 p-3.5 rounded-xl bg-purple-950/40 border border-purple-500/40 text-xs text-neutral-200 animate-fade-in space-y-2.5">
                <div className="flex items-center justify-between text-purple-300 font-bold">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>Vídeo MP4 gerado com sucesso!</span>
                  </div>
                  <span className="font-mono text-[11px] text-purple-200 bg-neutral-950 px-2 py-0.5 rounded border border-purple-500/30">
                    {(generatedVideo.sizeBytes / (1024 * 1024)).toFixed(2)} MB
                  </span>
                </div>

                {/* Inline Video Player Preview */}
                <div className="w-full rounded-xl overflow-hidden border border-purple-500/40 bg-black shadow-lg">
                  <video
                    src={generatedVideo.blobUrl}
                    controls
                    autoPlay
                    loop
                    className="w-full max-h-[220px] object-contain bg-black"
                  />
                </div>
                
                <div className="p-2.5 rounded-lg bg-neutral-900/90 border border-neutral-800 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-neutral-300 font-medium">
                    <FolderDown className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>O arquivo de vídeo foi baixado na pasta <strong>Downloads</strong> do seu computador/dispositivo.</span>
                  </div>
                  <div className="font-mono text-[11px] text-purple-200 break-all bg-neutral-950 px-2 py-1 rounded">
                    📁 Arquivo: {generatedVideo.filename}
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <a
                    href={generatedVideo.blobUrl}
                    download={generatedVideo.filename}
                    className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg flex items-center gap-1.5 transition-colors shadow"
                  >
                    <Download className="w-3 h-3" />
                    <span>Baixar Novamente (MP4)</span>
                  </a>
                </div>
              </div>
            )}

            {videoError && (
              <div className="p-3 rounded-lg bg-red-950/40 border border-red-500/30 text-xs text-red-300">
                {videoError}
              </div>
            )}
          </div>

          {/* Format 4: Print Tabloid / Save as PDF */}
          {campaign.format === 'tabloid' && (
            <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 flex items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 shrink-0">
                  <Printer className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Imprimir / Salvar Tablóide em PDF</h4>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    Gera a lâmina no formato A4 em alta qualidade para impressão em gráfica ou encarte digital.
                  </p>
                </div>
              </div>

              <button
                onClick={handlePrintPdf}
                className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 transition-all shrink-0"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimir / PDF</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-800 bg-neutral-950 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-bold rounded-lg transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

export const ExportModal = ModalExportarMaterial;

