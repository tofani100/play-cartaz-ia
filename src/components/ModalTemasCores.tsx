import React from 'react';
import { X, Check, Palette } from 'lucide-react';
import { ThemePresetId } from '../tiposGeradorBanner';
import { BANCO_TEMAS_VISUAIS } from '../data/bancoTemasVisuais';

interface ModalTemasCoresProps {
  isOpen: boolean;
  onClose: () => void;
  activeThemeId: ThemePresetId;
  onSelectTheme: (id: ThemePresetId) => void;
}

export const ModalTemasCores: React.FC<ModalTemasCoresProps> = ({
  isOpen,
  onClose,
  activeThemeId,
  onSelectTheme,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-neutral-800 flex items-center justify-between bg-neutral-950">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Palette className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white">Paleta de Cores e Estilo Visual</h3>
              <p className="text-xs text-neutral-400">
                Selecione o tema comercial perfeito para o nicho de negócio do seu cliente.
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

        {/* Theme Grid */}
        <div className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[70vh] overflow-y-auto">
          {Object.values(BANCO_TEMAS_VISUAIS).map((t) => {
            const isSelected = t.id === activeThemeId;

            return (
              <button
                key={t.id}
                onClick={() => {
                  onSelectTheme(t.id);
                  onClose();
                }}
                className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                  isSelected
                    ? 'border-amber-400 bg-neutral-800 ring-2 ring-amber-400/20'
                    : 'border-neutral-800 bg-neutral-950 hover:border-neutral-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-white">{t.name}</span>
                    {isSelected && <Check className="w-4 h-4 text-amber-400" />}
                  </div>
                  <span className="text-[10px] text-neutral-400 block mt-0.5">{t.category}</span>
                </div>

                {/* Color swatches */}
                <div className="flex items-center gap-2 mt-3 pt-2 border-t border-neutral-800">
                  <div 
                    className="w-5 h-5 rounded-full border border-white/20 shadow-sm"
                    style={{ backgroundColor: t.primary }}
                    title="Cor Primária"
                  />
                  <div 
                    className="w-5 h-5 rounded-full border border-white/20 shadow-sm"
                    style={{ backgroundColor: t.secondary }}
                    title="Cor Secundária / Preço"
                  />
                  <div 
                    className="w-5 h-5 rounded-full border border-white/20 shadow-sm"
                    style={{ backgroundColor: t.badgeBg }}
                    title="Selo / Destaque"
                  />
                  <span className="text-[10px] text-neutral-500 font-mono ml-auto">
                    {t.primary}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export const ThemeModal = ModalTemasCores;
