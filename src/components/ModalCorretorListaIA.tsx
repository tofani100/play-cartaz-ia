import React, { useState, useRef } from 'react';
import { 
  Sparkles, 
  X, 
  Check, 
  AlertCircle, 
  ArrowRight, 
  RefreshCw, 
  Image as ImageIcon,
  Layers,
  Wand2,
  Upload,
  Camera,
  Link as LinkIcon,
  Copy,
} from 'lucide-react';
import { ProductItem } from '../tiposGeradorBanner';
import { buscarMelhorImagemProduto } from '../data/bancoProdutosComerciais';
import { parseLocalRetailList } from '../utils/retailNlpParser';

interface ModalCorretorListaIAProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyProducts: (newProducts: ProductItem[], campaignTitle?: string, validityText?: string) => void;
  currentSegment: string;
}

const SAMPLE_LIST = `coca 2l 8,99
arros tio jorge 5kg 24.90
sabao em po omo lavagen perfeita 19,90
picanha friboy kg 59,90
cerveja heineke 330ml 6,49
deterjente ype neutro 2,19
feijao carioca camil 7,49
leite piracanjuba 1l 4,69`;

export const ModalCorretorListaIA: React.FC<ModalCorretorListaIAProps> = ({
  isOpen,
  onClose,
  onApplyProducts,
  currentSegment,
}) => {
  const [rawText, setRawText] = useState<string>('');
  const [segment, setSegment] = useState<string>(currentSegment || 'Supermercado e Varejo');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [parsedResult, setParsedResult] = useState<{
    campaignTitle: string;
    validityText: string;
    items: any[];
  } | null>(null);
  const [editingImageIdx, setEditingImageIdx] = useState<number | null>(null);
  const [customImageUrlInput, setCustomImageUrlInput] = useState<string>('');
  const [generatingIdx, setGeneratingIdx] = useState<number | null>(null);
  const [isGeneratingAll, setIsGeneratingAll] = useState<boolean>(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleLoadSample = () => {
    setRawText(SAMPLE_LIST);
  };

  const normalizeResult = (res: any) => {
    if (!res || !Array.isArray(res.items)) return res;
    return {
      ...res,
      items: res.items.map((item: any) => ({
        ...item,
        imageUrl: item.imageUrl || buscarMelhorImagemProduto(item.searchKey || item.title, item.category, item.unit),
      })),
    };
  };

  const handleProcessWithAi = async () => {
    if (!rawText.trim()) {
      setErrorMessage('Por favor, cole ou digite a lista de produtos.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/gemini/parse-products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawText,
          businessSegment: segment,
        }),
      });

      const data = await response.json();

      if (data && data.success && data.data && data.data.items?.length > 0) {
        setParsedResult(normalizeResult(data.data));
        return;
      }

      // Se a resposta do servidor não foi bem-sucedida, tenta o motor local
      const localResult = parseLocalRetailList(rawText, segment);
      if (localResult && localResult.items.length > 0) {
        setParsedResult(normalizeResult(localResult));
        return;
      }

      throw new Error(data?.error || 'Não foi possível processar os produtos informados.');
    } catch (err: any) {
      console.warn('Erro ao processar via servidor, acionando motor local inteligente:', err);
      try {
        const localResult = parseLocalRetailList(rawText, segment);
        if (localResult && localResult.items.length > 0) {
          setParsedResult(normalizeResult(localResult));
          return;
        }
      } catch (localErr) {
        console.error('Erro no parser local:', localErr);
      }
      setErrorMessage(err.message || 'Erro ao processar lista de produtos.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || editingImageIdx === null || !parsedResult) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        const updatedItems = [...parsedResult.items];
        updatedItems[editingImageIdx] = {
          ...updatedItems[editingImageIdx],
          imageUrl: result,
        };
        setParsedResult({ ...parsedResult, items: updatedItems });
        setEditingImageIdx(null);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleApplyCustomUrl = () => {
    if (editingImageIdx === null || !parsedResult || !customImageUrlInput.trim()) return;
    const updatedItems = [...parsedResult.items];
    updatedItems[editingImageIdx] = {
      ...updatedItems[editingImageIdx],
      imageUrl: customImageUrlInput.trim(),
    };
    setParsedResult({ ...parsedResult, items: updatedItems });
    setEditingImageIdx(null);
    setCustomImageUrlInput('');
  };

  const handleGenerateSingleItemAiImage = async (idx: number) => {
    if (!parsedResult || !parsedResult.items[idx]) return;
    const item = parsedResult.items[idx];
    setGeneratingIdx(idx);
    try {
      const res = await fetch('/api/gemini/generate-commercial-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: item.title,
          brand: item.brand,
          category: item.category,
          unit: item.unit,
          businessSegment: segment,
          aspectRatio: '4:3',
        }),
      });
      const data = await res.json();
      if (data && data.success && data.imageUrl) {
        const updatedItems = [...parsedResult.items];
        updatedItems[idx] = {
          ...updatedItems[idx],
          imageUrl: data.imageUrl,
          imageDisplayMode: 'ambient',
          aiPromptUsed: data.promptUsed,
        };
        setParsedResult({ ...parsedResult, items: updatedItems });
      }
    } catch (err) {
      console.error('Erro ao gerar imagem IA para item:', err);
    } finally {
      setGeneratingIdx(null);
    }
  };

  const handleGenerateAllAiImages = async () => {
    if (!parsedResult || !parsedResult.items) return;
    setIsGeneratingAll(true);
    try {
      for (let i = 0; i < parsedResult.items.length; i++) {
        await handleGenerateSingleItemAiImage(i);
      }
    } finally {
      setIsGeneratingAll(false);
    }
  };

  const handleCopyItemPrompt = async (item: any, idx: number) => {
    try {
      const res = await fetch('/api/gemini/build-commercial-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: item.title,
          brand: item.brand,
          category: item.category,
          unit: item.unit,
          businessSegment: segment,
        }),
      });
      const data = await res.json();
      if (data && data.success && data.geminiWebPrompt) {
        await navigator.clipboard.writeText(data.geminiWebPrompt);
        setCopiedIdx(idx);
        setTimeout(() => setCopiedIdx(null), 3000);
      }
    } catch (err) {
      console.error('Erro ao copiar prompt:', err);
    }
  };

  const handleConfirmImport = () => {
    if (!parsedResult || !parsedResult.items) return;

    const formattedProducts: ProductItem[] = parsedResult.items.map((item: any, idx: number) => {
      const imgUrl = item.imageUrl || buscarMelhorImagemProduto(item.searchKey || item.title, item.category, item.unit);

      return {
        id: `prod-ai-${Date.now()}-${idx}`,
        title: item.title,
        brand: item.brand,
        category: item.category || 'Geral',
        unit: item.unit || 'unidade',
        price: item.price || '0,00',
        originalPrice: item.originalPrice,
        discountPercentage: item.discountPercentage,
        badge: item.badge || 'OFERTA',
        imageUrl: imgUrl,
        packagingStyle: item.packagingStyle,
        imageDisplayMode: 'ambient',
        isHero: idx === 0,
      };
    });

    onApplyProducts(formattedProducts, parsedResult.campaignTitle, parsedResult.validityText);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-3xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-neutral-800 flex items-center justify-between bg-neutral-950">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center shadow-md shadow-orange-500/20">
              <Sparkles className="w-4 h-4 text-black" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                IA Corretor de Listas e Produtos
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  Gemini 3.8
                </span>
              </h3>
              <p className="text-xs text-neutral-400">
                Cole a mensagem bruta enviada pelo cliente no WhatsApp para corrigir erros e associar imagens reais.
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

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
          {!parsedResult ? (
            <>
              {/* Segment & Quick Helpers */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <label className="text-xs font-bold text-neutral-300">Segmento:</label>
                  <select
                    value={segment}
                    onChange={(e) => setSegment(e.target.value)}
                    className="bg-neutral-800 border border-neutral-700 text-xs rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="Supermercado e Varejo">Supermercado & Varejo</option>
                    <option value="Açougue e Carnes">Açougue & Carnes Nobres</option>
                    <option value="Hortifrúti e Orgânicos">Hortifrúti & Feira</option>
                    <option value="Padaria e Confeitaria">Padaria & Confeitaria</option>
                    <option value="Farmácia e Drogarias">Farmácia & Drogaria</option>
                    <option value="Distribuidora de Bebidas">Bebidas & Conveniência</option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={handleLoadSample}
                  className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 font-semibold"
                >
                  <Wand2 className="w-3.5 h-3.5" />
                  Carregar exemplo com erros comuns
                </button>
              </div>

              {/* Text Area */}
              <div>
                <textarea
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  placeholder={`Cole aqui o texto enviado pelo cliente. Exemplo:\n\ncoca 2l 8,99\narros tio jorge 5kg 24.90\nsabao omo lavagen perfeita 19,90\npicanha friboy kg 59,90`}
                  rows={8}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500 font-mono leading-relaxed resize-none"
                />
              </div>

              {errorMessage && (
                <div className="p-3 rounded-lg bg-red-950/60 border border-red-800/80 text-xs text-red-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                  <span>{errorMessage}</span>
                </div>
              )}
            </>
          ) : (
            /* Results View */
            <div className="space-y-4">
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-amber-400">Título Sugerido pela IA</span>
                  <h4 className="text-sm font-black text-white">{parsedResult.campaignTitle}</h4>
                  <p className="text-xs text-neutral-300">{parsedResult.validityText}</p>
                </div>
                <button
                  onClick={() => setParsedResult(null)}
                  className="text-xs text-neutral-400 hover:text-white flex items-center gap-1 bg-neutral-800 px-2.5 py-1 rounded-lg"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Editar lista
                </button>
              </div>

              <div className="space-y-3">
                {/* Header Bar com Botão Mestre de Geração em Lote */}
                <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-neutral-950 border border-neutral-800 rounded-xl">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-bold text-neutral-200">
                      {parsedResult.items.length} Produtos identificados e higienizados:
                    </span>
                  </div>

                  <button
                    type="button"
                    disabled={isGeneratingAll}
                    onClick={handleGenerateAllAiImages}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-black text-[11px] rounded-lg shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                    title="Gerar automaticamente fotografias comerciais ambientadas para todos os produtos"
                  >
                    {isGeneratingAll ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5 fill-black" />
                    )}
                    <span>{isGeneratingAll ? 'Gerando Imagens com IA...' : '🪄 Gerar Banners IA para Todos'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {parsedResult.items.map((item: any, idx: number) => {
                    const currentImg = item.imageUrl || buscarMelhorImagemProduto(item.searchKey || item.title, item.category, item.unit);

                    return (
                      <div
                        key={idx}
                        className="p-3 bg-neutral-950 border border-neutral-800 hover:border-neutral-700 rounded-xl flex items-start gap-3 relative group transition-colors"
                      >
                        {/* Imagem do Produto com Botão de Troca e Upload */}
                        <div className="relative shrink-0 mt-0.5">
                          <img
                            src={currentImg}
                            alt={item.title}
                            className="w-16 h-16 rounded-lg object-cover bg-neutral-900 border border-neutral-800 shadow-sm"
                            referrerPolicy="no-referrer"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setEditingImageIdx(idx);
                              setCustomImageUrlInput(currentImg.startsWith('data:') ? '' : currentImg);
                            }}
                            className="absolute inset-0 rounded-lg bg-black/75 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-[9px] font-bold text-amber-400 transition-opacity cursor-pointer"
                            title="Trocar Foto da Embalagem"
                          >
                            <Camera className="w-3.5 h-3.5 mb-0.5" />
                            Trocar
                          </button>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-amber-500 text-black">
                              {item.badge || 'OFERTA'}
                            </span>
                            <span className="text-[10px] text-neutral-400 truncate">{item.category}</span>
                          </div>
                          <h5 className="text-xs font-bold text-white truncate mt-0.5" title={item.title}>
                            {item.title}
                          </h5>
                          <div className="flex items-baseline gap-2 mt-0.5">
                            <span className="text-xs font-black text-amber-400">R$ {item.price}</span>
                            <span className="text-[10px] text-neutral-400">/{item.unit}</span>
                            {item.originalPrice && (
                              <span className="text-[10px] text-neutral-500 line-through">
                                R$ {item.originalPrice}
                              </span>
                            )}
                          </div>

                          {/* Quick AI Commercial Image Controls */}
                          <div className="mt-2 flex flex-wrap items-center gap-1.5">
                            <button
                              type="button"
                              disabled={generatingIdx === idx}
                              onClick={() => handleGenerateSingleItemAiImage(idx)}
                              className="px-2 py-1 rounded-md bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-[10px] font-bold border border-amber-500/40 flex items-center gap-1 transition-colors disabled:opacity-50 cursor-pointer"
                              title="Gerar foto comercial ambientada para este produto"
                            >
                              {generatingIdx === idx ? (
                                <RefreshCw className="w-3 h-3 animate-spin" />
                              ) : (
                                <Sparkles className="w-3 h-3 text-amber-400" />
                              )}
                              <span>{generatingIdx === idx ? 'Gerando...' : 'Gerar Imagem IA ✨'}</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleCopyItemPrompt(item, idx)}
                              className="px-2 py-1 rounded-md bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-[10px] font-semibold border border-neutral-700 flex items-center gap-1 transition-colors cursor-pointer"
                              title="Copiar prompt profissional para colar no Gemini Pro Web"
                            >
                              {copiedIdx === idx ? (
                                <Check className="w-3 h-3 text-emerald-400" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                              <span>{copiedIdx === idx ? 'Copiado!' : 'Prompt Gemini'}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Modal para Trocar Imagem de Produto Específico */}
                {editingImageIdx !== null && (
                  <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
                    <div className="bg-neutral-900 border border-neutral-700 rounded-xl max-w-md w-full p-4 shadow-2xl space-y-3">
                      <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                        <h4 className="text-xs font-extrabold text-white flex items-center gap-1.5">
                          <Sparkles className="w-4 h-4 text-amber-400" />
                          Arte Comercial do Produto #{editingImageIdx + 1}
                        </h4>
                        <button
                          onClick={() => setEditingImageIdx(null)}
                          className="text-neutral-400 hover:text-white"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <p className="text-xs text-neutral-300 font-bold truncate">
                        {parsedResult.items[editingImageIdx]?.title}
                      </p>

                      <div className="flex items-center justify-center py-2 bg-neutral-950 rounded-lg border border-neutral-800 overflow-hidden">
                        <img
                          src={parsedResult.items[editingImageIdx]?.imageUrl}
                          alt="Pré-visualização"
                          className="max-h-40 w-full object-cover rounded"
                          referrerPolicy="no-referrer"
                        />
                      </div>

                      {/* Opção 1: Gerar com IA Diretamente */}
                      <button
                        type="button"
                        disabled={generatingIdx === editingImageIdx}
                        onClick={async () => {
                          await handleGenerateSingleItemAiImage(editingImageIdx);
                        }}
                        className="w-full py-2 px-3 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95 disabled:opacity-50 cursor-pointer"
                      >
                        {generatingIdx === editingImageIdx ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Sparkles className="w-3.5 h-3.5 fill-black" />
                        )}
                        <span>
                          {generatingIdx === editingImageIdx
                            ? 'Criando Fotografia Comercial...'
                            : 'Gerar Banner Ambientado com IA ✨'}
                        </span>
                      </button>

                      {/* Opção 2: Copiar Prompt para Gemini Web */}
                      <button
                        type="button"
                        onClick={() => handleCopyItemPrompt(parsedResult.items[editingImageIdx], editingImageIdx)}
                        className="w-full py-2 px-3 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-amber-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors border border-neutral-700 cursor-pointer"
                      >
                        {copiedIdx === editingImageIdx ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                        <span>
                          {copiedIdx === editingImageIdx
                            ? 'Prompt Copiado!'
                            : 'Copiar Prompt Mestre de Marketing (Gemini Pro)'}
                        </span>
                      </button>

                      {/* Opção 1: Enviar Arquivo Real do PC ou Celular */}
                      <div>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleFileUpload}
                        />
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="w-full py-2 px-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs flex items-center justify-center gap-1.5 transition-colors"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          Enviar Foto Real da Embalagem (PNG / JPG)
                        </button>
                      </div>

                      {/* Opção 2: Colar URL Direta da Foto */}
                      <div className="space-y-1.5 pt-1">
                        <label className="text-[10px] font-bold text-neutral-400 uppercase block">
                          Ou cole o link direto da imagem na web:
                        </label>
                        <div className="flex gap-1.5">
                          <input
                            type="text"
                            placeholder="https://exemplo.com/cafe-caboclo-500g.png"
                            value={customImageUrlInput}
                            onChange={(e) => setCustomImageUrlInput(e.target.value)}
                            className="flex-1 bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                          />
                          <button
                            type="button"
                            onClick={handleApplyCustomUrl}
                            className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs font-bold text-white"
                          >
                            Salvar
                          </button>
                        </div>
                      </div>

                      <div className="flex justify-end pt-2 border-t border-neutral-800">
                        <button
                          type="button"
                          onClick={() => setEditingImageIdx(null)}
                          className="px-3 py-1.5 text-xs text-neutral-400 hover:text-white"
                        >
                          Fechar
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-neutral-800 bg-neutral-950 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-bold text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            Cancelar
          </button>

          {!parsedResult ? (
            <button
              onClick={handleProcessWithAi}
              disabled={isLoading || !rawText.trim()}
              className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 disabled:opacity-50 text-neutral-950 font-black px-5 py-2.5 rounded-xl text-xs shadow-lg shadow-amber-500/20 transition-all"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Analisando e corrigindo com Gemini...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 fill-black" />
                  <span>Interpretar Lista com IA</span>
                </>
              )}
            </button>
          ) : (
            <button
              onClick={handleConfirmImport}
              className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-black font-black px-5 py-2.5 rounded-xl text-xs shadow-lg shadow-emerald-500/20 transition-all"
            >
              <Check className="w-4 h-4" />
              <span>Aplicar {parsedResult.items.length} Produtos no Banner</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export const AiListParserModal = ModalCorretorListaIA;
