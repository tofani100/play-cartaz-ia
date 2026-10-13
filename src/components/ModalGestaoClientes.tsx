import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Check, 
  Building2, 
  Palette, 
  Plus, 
  Trash2, 
  Edit3, 
  Upload, 
  Image as ImageIcon, 
  Search, 
  Store, 
  Phone, 
  Sparkles, 
  ArrowRight, 
  Play, 
  Loader2, 
  FileText,
  RotateCcw,
  AlertTriangle,
  ShieldAlert,
  Clock
} from 'lucide-react';
import { ClientProfile, ThemePresetId, BannerCampaign } from '../tiposGeradorBanner';
import { BANCO_TEMAS_VISUAIS } from '../data/bancoTemasVisuais';
import { compressImageToDataUrl } from '../utils/imageCompressor';
import { aplicarMascaraTelefoneInput } from '../utils/mascaraTelefone';

export interface ClientTrashItem {
  client: ClientProfile;
  deletedAt: string;
}

const CLIENTS_TRASH_STORAGE_KEY = 'playcomunique_lixeira_clientes';
const TRASH_RETENTION_DAYS = 15;
const TRASH_RETENTION_MS = TRASH_RETENTION_DAYS * 24 * 60 * 60 * 1000;

function getClientRemainingDays(deletedAtStr: string): number {
  const deletedTime = new Date(deletedAtStr).getTime();
  const elapsed = Date.now() - deletedTime;
  const remainingMs = TRASH_RETENTION_MS - elapsed;
  if (remainingMs <= 0) return 0;
  return Math.ceil(remainingMs / (24 * 60 * 60 * 1000));
}

interface ModalGestaoClientesProps {
  isOpen: boolean;
  onClose: () => void;
  clients: ClientProfile[];
  activeClientName: string;
  activeThemeId: ThemePresetId;
  showClientLogo?: boolean;
  onSelectClient: (client: ClientProfile) => void;
  onSelectThemeOnly: (themeId: ThemePresetId) => void;
  onSaveClient: (client: ClientProfile) => void;
  onDeleteClient: (clientId: string) => void;
  onToggleShowLogo: (show: boolean) => void;
  onOpenTvPlayer?: () => void;
}

export const ModalGestaoClientes: React.FC<ModalGestaoClientesProps> = ({
  isOpen,
  onClose,
  clients,
  activeClientName,
  activeThemeId,
  showClientLogo = true,
  onSelectClient,
  onSelectThemeOnly,
  onSaveClient,
  onDeleteClient,
  onToggleShowLogo,
  onOpenTvPlayer,
}) => {
  const [activeTab, setActiveTab] = useState<'clients' | 'themes' | 'trash'>('clients');
  const [trashClients, setTrashClients] = useState<ClientTrashItem[]>([]);
  const [clientToDelete, setClientToDelete] = useState<ClientProfile | null>(null);
  const [deleteConfirmInput, setDeleteConfirmInput] = useState('');

  const loadTrashClients = () => {
    try {
      const raw = localStorage.getItem(CLIENTS_TRASH_STORAGE_KEY);
      if (!raw) {
        setTrashClients([]);
        return;
      }
      const parsed: ClientTrashItem[] = JSON.parse(raw);
      const valid = parsed.filter((item) => getClientRemainingDays(item.deletedAt) > 0);
      setTrashClients(valid);
      if (valid.length !== parsed.length) {
        localStorage.setItem(CLIENTS_TRASH_STORAGE_KEY, JSON.stringify(valid));
      }
    } catch {
      setTrashClients([]);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadTrashClients();
    }
  }, [isOpen]);

  const [searchQuery, setSearchQuery] = useState('');
  const [editingClient, setEditingClient] = useState<ClientProfile | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Form states for creating/editing a client
  const [formName, setFormName] = useState('');
  const [formTradeName, setFormTradeName] = useState('');
  const [formSegment, setFormSegment] = useState('Varejo & Supermercados');
  const [formLogoUrl, setFormLogoUrl] = useState('');
  const [formThemeId, setFormThemeId] = useState<ThemePresetId>('supermarket-red');
  const [formTicker, setFormTicker] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formLegalNotice, setFormLegalNotice] = useState('Imagens meramente ilustrativas; Proibido a venda de bebidas alcoólicas a menores de 18 anos!');
  const [formFooterBrandText, setFormFooterBrandText] = useState('Desenvolvido por: playcomunique.com.br');
  const [logoPreviewError, setLogoPreviewError] = useState(false);
  const [isCompressingLogo, setIsCompressingLogo] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Open form for a new client
  const handleOpenNewClient = () => {
    setEditingClient(null);
    setFormName('');
    setFormTradeName('');
    setFormSegment('Hortifrúti & Frutas');
    setFormLogoUrl('');
    setFormThemeId('hortifruti-green');
    setFormTicker('');
    setFormPhone('');
    setFormAddress('');
    setFormLegalNotice('Imagens meramente ilustrativas; Proibido a venda de bebidas alcoólicas a menores de 18 anos!');
    setFormFooterBrandText('Desenvolvido por: playcomunique.com.br');
    setLogoPreviewError(false);
    setIsFormOpen(true);
  };

  // Open form to edit an existing client
  const handleOpenEditClient = (client: ClientProfile) => {
    setEditingClient(client);
    setFormName(client.name);
    setFormTradeName(client.tradeName || client.name);
    setFormSegment(client.segment);
    setFormLogoUrl(client.logoUrl || '');
    setFormThemeId(client.themeId);
    setFormTicker(client.defaultTickerText || '');
    setFormPhone(client.phoneWhatsapp || '');
    setFormAddress(client.storeAddress || '');
    setFormLegalNotice(client.legalNotice || 'Imagens meramente ilustrativas; Proibido a venda de bebidas alcoólicas a menores de 18 anos!');
    setFormFooterBrandText(client.footerBrandText || 'Desenvolvido por: playcomunique.com.br');
    setLogoPreviewError(false);
    setIsFormOpen(true);
  };

  // File upload handler com compressão imediata para WebP/PNG (~25KB)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione um arquivo de imagem válido (PNG, JPG, SVG ou WEBP).');
      return;
    }

    try {
      setIsCompressingLogo(true);
      // Comprime mantendo transparência, resolução de 600px e tamanho levíssimo (~20KB-35KB)
      // para não estourar a cota de 5MB do LocalStorage nem o limite de 1MB do Firestore.
      const optimized = await compressImageToDataUrl(file, 600, 600, 0.88);
      if (optimized) {
        setFormLogoUrl(optimized);
        setLogoPreviewError(false);
      }
    } catch (err) {
      console.warn('Erro ao otimizar logo, aplicando leitura direta:', err);
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const result = uploadEvent.target?.result as string;
        if (result) {
          setFormLogoUrl(result);
          setLogoPreviewError(false);
        }
      };
      reader.readAsDataURL(file);
    } finally {
      setIsCompressingLogo(false);
      // Reseta o input para permitir selecionar o mesmo arquivo novamente se desejar
      if (e.target) {
        e.target.value = '';
      }
    }
  };

  // Submit client form
  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      alert('Por favor, informe o nome do cliente.');
      return;
    }

    let finalLogo = formLogoUrl.trim();
    if (finalLogo && finalLogo.startsWith('data:image') && finalLogo.length > 40000) {
      try {
        finalLogo = await compressImageToDataUrl(finalLogo, 600, 600, 0.88);
      } catch (_) {}
    }

    const clientToSave: ClientProfile = {
      id: editingClient ? editingClient.id : `cli-${Date.now()}`,
      name: formName.trim(),
      tradeName: formTradeName.trim() || formName.trim(),
      segment: formSegment,
      logoUrl: finalLogo,
      themeId: formThemeId,
      defaultTickerText: formTicker.trim(),
      phoneWhatsapp: formPhone.trim(),
      storeAddress: formAddress.trim(),
      legalNotice: formLegalNotice.trim() || 'Imagens meramente ilustrativas; Proibido a venda de bebidas alcoólicas a menores de 18 anos!',
      footerBrandText: formFooterBrandText.trim() || 'Desenvolvido por: playcomunique.com.br',
      products: editingClient?.products || [],
    };

    onSaveClient(clientToSave);
    setIsFormOpen(false);
    setEditingClient(null);
  };

  // Filter clients
  const filteredClients = clients.filter((c) => {
    const q = searchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.segment.toLowerCase().includes(q) ||
      (c.tradeName && c.tradeName.toLowerCase().includes(q))
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-3xl max-h-[92vh] bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-neutral-800 flex items-center justify-between bg-neutral-950">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 text-neutral-950 flex items-center justify-center shadow-md">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-white">Gestão de Clientes & Identidade Visual</h3>
                <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Logos & Cores
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                Cadastre seus clientes, faça upload do logotipo e defina as cores da TV Indoor.
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

        {/* Navigation Tabs + Logo Banner Toggle */}
        <div className="px-4 sm:px-6 py-2.5 bg-neutral-950/70 border-b border-neutral-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setActiveTab('clients');
                setIsFormOpen(false);
              }}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                activeTab === 'clients'
                  ? 'bg-amber-500 text-neutral-950 shadow'
                  : 'bg-neutral-800 text-neutral-300 hover:text-white'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Clientes Cadastrados ({clients.length})</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('themes');
                setIsFormOpen(false);
              }}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                activeTab === 'themes'
                  ? 'bg-amber-500 text-neutral-950 shadow'
                  : 'bg-neutral-800 text-neutral-300 hover:text-white'
              }`}
            >
              <Palette className="w-3.5 h-3.5" />
              <span>Paletas de Cores</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('trash');
                setIsFormOpen(false);
              }}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                activeTab === 'trash'
                  ? 'bg-amber-500 text-neutral-950 shadow'
                  : 'bg-neutral-800 text-neutral-300 hover:text-white'
              }`}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Lixeira ({trashClients.length})</span>
            </button>
          </div>

          {/* Toggle to display client logo on banner */}
          <div className="flex items-center gap-2 bg-neutral-900 px-3 py-1 rounded-lg border border-neutral-800">
            <span className="text-xs font-medium text-neutral-300">Exibir Logo no Banner:</span>
            <button
              type="button"
              onClick={() => onToggleShowLogo(!showClientLogo)}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                showClientLogo ? 'bg-emerald-500' : 'bg-neutral-700'
              }`}
            >
              <span
                className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                  showClientLogo ? 'translate-x-4' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
          {/* TAB 1: CLIENTS MANAGEMENT */}
          {activeTab === 'clients' && (
            <div>
              {/* If Form is open (New / Edit) */}
              {isFormOpen ? (
                <form onSubmit={handleSaveForm} className="space-y-4 bg-neutral-950 p-4 sm:p-5 rounded-xl border border-neutral-800">
                  <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                    <h4 className="text-sm font-black text-white flex items-center gap-2">
                      <Store className="w-4 h-4 text-amber-400" />
                      {editingClient ? 'Editar Cliente' : 'Cadastrar Novo Cliente'}
                    </h4>
                    <button
                      type="button"
                      onClick={() => setIsFormOpen(false)}
                      className="text-xs text-neutral-400 hover:text-white"
                    >
                      Cancelar
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Client Name */}
                    <div>
                      <label className="block text-xs font-bold text-neutral-300 mb-1">
                        Nome do Cliente / Empresa *
                      </label>
                      <input
                        type="text"
                        value={formName}
                        onChange={(e) => setFormName(e.target.value)}
                        placeholder="Ex: Belíssima Casa di Frutas"
                        className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-400"
                        required
                      />
                    </div>

                    {/* Segment */}
                    <div>
                      <label className="block text-xs font-bold text-neutral-300 mb-1">
                        Segmento Comercial
                      </label>
                      <select
                        value={formSegment}
                        onChange={(e) => setFormSegment(e.target.value)}
                        className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-400"
                      >
                        <option value="Hortifrúti & Frutas">Hortifrúti & Frutas Selecionadas</option>
                        <option value="Varejo & Supermercados">Varejo & Supermercados</option>
                        <option value="Açougue & Carnes Nobres">Açougue & Churrasco</option>
                        <option value="Farmácia & Drogaria">Farmácia & Saúde</option>
                        <option value="Padaria & Cafeteria">Padaria & Confeitaria</option>
                        <option value="Bebidas & Adega">Bebidas & Distribuidora</option>
                        <option value="Pet Shop & Veterinária">Pet Shop & Agropecuária</option>
                      </select>
                    </div>
                  </div>

                  {/* Contatos Oficiais do Cliente (WhatsApp e Endereço) */}
                  <div className="p-3.5 bg-neutral-900 rounded-xl border border-neutral-800 space-y-2">
                    <label className="block text-xs font-bold text-amber-300 flex items-center gap-1.5">
                      <Store className="w-3.5 h-3.5" />
                      Contatos Oficiais da Loja (Usados nos Banners e WhatsApp)
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-neutral-300 mb-1 flex items-center gap-1">
                          <Phone className="w-3 h-3 text-emerald-400" />
                          Telefone / WhatsApp Oficial
                        </label>
                        <input
                          type="text"
                          value={formPhone}
                          onChange={(e) => setFormPhone(aplicarMascaraTelefoneInput(e.target.value))}
                          placeholder="Ex: (11) 99999-1234"
                          className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-neutral-300 mb-1 flex items-center gap-1">
                          <Building2 className="w-3 h-3 text-amber-400" />
                          Endereço Físico da Loja
                        </label>
                        <input
                          type="text"
                          value={formAddress}
                          onChange={(e) => setFormAddress(e.target.value)}
                          placeholder="Ex: Rua das Frutas, 2004 - Centro Comercial"
                          className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Logo Upload Section */}
                  <div className="p-3.5 bg-neutral-900 rounded-xl border border-neutral-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-amber-300 flex items-center gap-1.5">
                        <ImageIcon className="w-3.5 h-3.5" />
                        Logotipo da Empresa (PNG com fundo transparente, SVG ou JPG)
                      </label>
                      {formLogoUrl && (
                        <button
                          type="button"
                          onClick={() => setFormLogoUrl('')}
                          className="text-[11px] text-red-400 hover:text-red-300 flex items-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" />
                          Remover Logo
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
                      {/* Upload Button */}
                      <div className="sm:col-span-2 space-y-2">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/png,image/jpeg,image/svg+xml,image/webp"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                        <button
                          type="button"
                          disabled={isCompressingLogo}
                          onClick={() => fileInputRef.current?.click()}
                          className={`w-full py-2.5 px-3 bg-neutral-800 hover:bg-neutral-700 border border-dashed border-amber-400/50 rounded-lg text-xs font-bold text-amber-300 flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                            isCompressingLogo ? 'opacity-70 cursor-wait' : ''
                          }`}
                        >
                          {isCompressingLogo ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                              <span>Otimizando e salvando logotipo...</span>
                            </>
                          ) : (
                            <>
                              <Upload className="w-4 h-4" />
                              <span>Fazer Upload do Logo (PNG / SVG do seu PC)</span>
                            </>
                          )}
                        </button>

                        <div className="text-[11px] text-neutral-400 flex items-center gap-2">
                          <span>ou cole o link da imagem:</span>
                          <input
                            type="text"
                            value={formLogoUrl.startsWith('data:') ? '' : formLogoUrl}
                            onChange={(e) => {
                              setFormLogoUrl(e.target.value);
                              setLogoPreviewError(false);
                            }}
                            placeholder="https://.../logo.png"
                            className="flex-1 bg-neutral-950 border border-neutral-700 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-amber-400"
                          />
                        </div>
                      </div>

                      {/* Logo Preview Box */}
                      <div className="flex flex-col items-center justify-center p-2 rounded-lg bg-neutral-950 border border-neutral-800 min-h-[90px]">
                        <span className="text-[10px] text-neutral-400 mb-1">Prévia do Logo:</span>
                        {formLogoUrl && !logoPreviewError ? (
                          <div className="relative p-1 bg-emerald-950/40 rounded border border-emerald-500/20 max-h-16 flex items-center justify-center">
                            <img
                              src={formLogoUrl}
                              alt="Prévia do Logo"
                              className="max-h-12 max-w-full object-contain drop-shadow"
                              onError={() => setLogoPreviewError(true)}
                            />
                          </div>
                        ) : (
                          <div className="text-[10px] text-neutral-400 italic text-center">
                            Nenhum logo carregado. O banner exibirá o nome em texto.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Rodapé Fixo da TV (Sub-Footer) */}
                  <div className="p-3.5 bg-neutral-900 rounded-xl border border-neutral-800 space-y-2">
                    <label className="block text-xs font-bold text-amber-300 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5" />
                      Rodapé Fixo da TV (Sub-Footer)
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-neutral-300 mb-1">
                          Texto Legal (Canto Esquerdo):
                        </label>
                        <input
                          type="text"
                          value={formLegalNotice}
                          onChange={(e) => setFormLegalNotice(e.target.value)}
                          placeholder="Imagens meramente ilustrativas; Proibido a venda de bebidas alcoólicas a menores de 18 anos!"
                          className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-neutral-300 mb-1">
                          Site / Assinatura (Canto Direito):
                        </label>
                        <input
                          type="text"
                          value={formFooterBrandText}
                          onChange={(e) => setFormFooterBrandText(e.target.value)}
                          placeholder="Desenvolvido por: playcomunique.com.br"
                          className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400 font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Theme Palette Selection */}
                  <div>
                    <label className="block text-xs font-bold text-neutral-300 mb-2">
                      Paleta de Cores Padrão deste Cliente
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {Object.values(BANCO_TEMAS_VISUAIS).map((thm) => {
                        const isSelected = formThemeId === thm.id;
                        return (
                          <button
                            type="button"
                            key={thm.id}
                            onClick={() => setFormThemeId(thm.id)}
                            className={`p-2.5 rounded-lg border text-left flex flex-col justify-between transition-all ${
                              isSelected
                                ? 'border-amber-400 bg-neutral-800 ring-2 ring-amber-400/30'
                                : 'border-neutral-800 bg-neutral-900 hover:border-neutral-700'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-bold text-white truncate">{thm.name}</span>
                              {isSelected && <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                            </div>
                            <div className="flex items-center gap-1.5 mt-2">
                              <div className="w-3.5 h-3.5 rounded-full border border-white/20" style={{ backgroundColor: thm.primary }} />
                              <div className="w-3.5 h-3.5 rounded-full border border-white/20" style={{ backgroundColor: thm.secondary }} />
                              <div className="w-3.5 h-3.5 rounded-full border border-white/20" style={{ backgroundColor: thm.badgeBg }} />
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-800">
                    <button
                      type="button"
                      onClick={() => setIsFormOpen(false)}
                      className="px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs font-bold text-neutral-300 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-xs font-black text-neutral-950 shadow-md transition-transform active:scale-95"
                    >
                      {editingClient ? 'Salvar Alterações' : 'Cadastrar Cliente'}
                    </button>
                  </div>
                </form>
              ) : (
                /* List of Clients */
                <div className="space-y-4">
                  {/* Search and New Client Button */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Buscar cliente por nome ou segmento..."
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={handleOpenNewClient}
                      className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-neutral-950 font-black text-xs shadow-md transition-transform active:scale-95 shrink-0"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Cadastrar Novo Cliente</span>
                    </button>
                  </div>

                  {/* Clients Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {filteredClients.map((cli) => {
                      const isActive = cli.name.toLowerCase() === activeClientName.toLowerCase();
                      const clientTheme = BANCO_TEMAS_VISUAIS[cli.themeId] || BANCO_TEMAS_VISUAIS['supermarket-red'];

                      return (
                        <div
                          key={cli.id}
                          className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
                            isActive
                              ? 'border-amber-400 bg-neutral-950 ring-2 ring-amber-400/20 shadow-lg'
                              : 'border-neutral-800 bg-neutral-950/60 hover:border-neutral-700'
                          }`}
                        >
                          {/* Top Card Info */}
                          <div className="flex items-start gap-3">
                            {/* Logo Thumbnail or Avatar */}
                            <div className="w-14 h-14 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center overflow-hidden shrink-0 p-1">
                              {cli.logoUrl ? (
                                <img
                                  src={cli.logoUrl}
                                  alt={cli.name}
                                  className="max-h-full max-w-full object-contain drop-shadow"
                                  onError={(e) => {
                                    // Fallback if image fails
                                    (e.target as HTMLImageElement).style.display = 'none';
                                  }}
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-neutral-800 text-amber-400 font-black text-sm">
                                  {cli.name.substring(0, 2).toUpperCase()}
                                </div>
                              )}
                            </div>

                            {/* Name, Segment & Theme Swatches */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-1">
                                <h4 className="text-sm font-black text-white truncate" title={cli.name}>
                                  {cli.name}
                                </h4>
                                {isActive && (
                                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-[10px] border border-emerald-500/30 shrink-0">
                                    No Banner
                                  </span>
                                )}
                              </div>

                              <span className="text-[11px] text-neutral-400 block mt-0.5">
                                {cli.segment}
                              </span>

                              {/* Banners Salvos deste Cliente */}
                              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-300 font-extrabold border border-amber-500/30 flex items-center gap-1">
                                  <span>🛒</span>
                                  <span>{cli.products?.length || 0} {cli.products?.length === 1 ? 'banner salvo' : 'banners salvos'}</span>
                                </span>
                              </div>

                              {/* Colors associated with this client */}
                              <div className="flex items-center gap-1.5 mt-2">
                                <span className="text-[10px] text-neutral-400">Tema:</span>
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: clientTheme.primary }} />
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: clientTheme.secondary }} />
                                <span className="text-[10px] text-neutral-400 font-medium">
                                  {clientTheme.name}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Card Actions */}
                          <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-neutral-800/80">
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleOpenEditClient(cli)}
                                className="p-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white transition-colors text-xs flex items-center gap-1"
                                title="Editar cliente e logo"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Editar</span>
                              </button>

                              {clients.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setClientToDelete(cli);
                                    setDeleteConfirmInput('');
                                  }}
                                  className="p-1.5 rounded-lg bg-neutral-900 hover:bg-red-900/40 text-neutral-400 hover:text-red-400 transition-colors"
                                  title="Excluir cliente com segurança (Lixeira de 15 dias)"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>

                            {/* Apply and View Buttons */}
                            <div className="flex items-center gap-2">
                              {onOpenTvPlayer && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    onSelectClient(cli);
                                    onClose();
                                    onOpenTvPlayer();
                                  }}
                                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow transition-all active:scale-95"
                                  title="Aplicar este cliente e abrir o banner pronto em tela cheia na TV"
                                >
                                  <Play className="w-3 h-3 fill-white" />
                                  <span>Ver na TV</span>
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => {
                                  onSelectClient(cli);
                                  onClose();
                                }}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                  isActive
                                    ? 'bg-neutral-800 text-emerald-400 border border-emerald-500/30'
                                    : 'bg-amber-500 hover:bg-amber-400 text-neutral-950 shadow active:scale-95'
                                }`}
                              >
                                {isActive ? (
                                  <>
                                    <Check className="w-3.5 h-3.5" />
                                    <span>Ativo no Banner</span>
                                  </>
                                ) : (
                                  <>
                                    <span>Aplicar ao Banner</span>
                                    <ArrowRight className="w-3.5 h-3.5" />
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: PALETAS DE CORES ISOLADAS */}
          {activeTab === 'themes' && (
            <div>
              <p className="text-xs text-neutral-400 mb-3">
                Se desejar apenas alterar a paleta de cores do banner atual sem trocar de cliente, selecione abaixo:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto">
                {Object.values(BANCO_TEMAS_VISUAIS).map((t) => {
                  const isSelected = t.id === activeThemeId;

                  return (
                    <button
                      key={t.id}
                      onClick={() => {
                        onSelectThemeOnly(t.id);
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
                        <span className="text-[10px] text-neutral-400 font-mono ml-auto">
                          {t.primary}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: LIXEIRA TEMPORÁRIA DE CLIENTES (15 DIAS) */}
          {activeTab === 'trash' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3.5 bg-neutral-950/80 border border-neutral-800 rounded-xl">
                <div>
                  <h4 className="text-sm font-extrabold text-white flex items-center gap-2">
                    <RotateCcw className="w-4 h-4 text-amber-400" />
                    <span>Lixeira de Clientes (Retenção de 15 Dias)</span>
                  </h4>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    Clientes excluídos ficam protegidos aqui por 15 dias com todos os seus banners salvos intactos.
                  </p>
                </div>

                {trashClients.length > 0 && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        trashClients.forEach((t) => onSaveClient(t.client));
                        setTrashClients([]);
                        localStorage.removeItem(CLIENTS_TRASH_STORAGE_KEY);
                      }}
                      className="px-3 py-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Restaurar Todos</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm('Tem certeza que deseja esvaziar a lixeira de clientes? Todos os itens serão apagados definitivamente.')) {
                          setTrashClients([]);
                          localStorage.removeItem(CLIENTS_TRASH_STORAGE_KEY);
                        }
                      }}
                      className="px-2.5 py-1.5 bg-neutral-900 hover:bg-red-900/30 text-neutral-400 hover:text-red-400 border border-neutral-800 rounded-lg text-xs font-bold transition-all"
                    >
                      Esvaziar Lixeira
                    </button>
                  </div>
                )}
              </div>

              {trashClients.length === 0 ? (
                <div className="text-center py-16 px-4 bg-neutral-950/40 rounded-2xl border border-neutral-800/60">
                  <RotateCcw className="w-12 h-12 text-neutral-600 mx-auto mb-3 opacity-40" />
                  <h5 className="text-sm font-bold text-white">A Lixeira de Clientes está vazia</h5>
                  <p className="text-xs text-neutral-400 mt-1 max-w-md mx-auto">
                    Nenhum cliente foi excluído recentemente. Quando um cliente for removido, ele ficará protegido aqui por até 15 dias para recuperação em 1 clique.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 max-h-[60vh] overflow-y-auto pr-1">
                  {trashClients.map((item, idx) => {
                    const remainingDays = getClientRemainingDays(item.deletedAt);
                    const formattedDate = new Date(item.deletedAt).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    });

                    return (
                      <div
                        key={item.client.id || idx}
                        className="p-4 rounded-xl border border-neutral-800 bg-neutral-950 flex flex-col justify-between gap-3 group hover:border-neutral-700 transition-all"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-12 h-12 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center overflow-hidden shrink-0">
                            {item.client.logoUrl ? (
                              <img
                                src={item.client.logoUrl}
                                alt={item.client.name}
                                className="w-full h-full object-contain p-1"
                              />
                            ) : (
                              <Store className="w-6 h-6 text-neutral-500" />
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <h5 className="text-sm font-black text-white truncate" title={item.client.name}>
                              {item.client.name}
                            </h5>
                            <span className="text-[11px] text-neutral-400 block truncate">
                              {item.client.tradeName || item.client.segment}
                            </span>
                            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                              <span className="px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[10px] font-bold">
                                {item.client.products?.length || 0} banner(s) salvos
                              </span>
                              <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                <span>Restam {remainingDays} dia(s)</span>
                              </span>
                            </div>
                            <span className="text-[10px] text-neutral-500 block mt-1">
                              Excluído em: {formattedDate}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-900">
                          <button
                            type="button"
                            onClick={() => {
                              onSaveClient(item.client);
                              const updated = trashClients.filter((_, i) => i !== idx);
                              setTrashClients(updated);
                              localStorage.setItem(CLIENTS_TRASH_STORAGE_KEY, JSON.stringify(updated));
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-black text-xs rounded-lg transition-all shadow"
                            title="Restaurar este cliente e todos os seus banners de volta para a lista ativa"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Restaurar Cliente</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`Excluir definitivamente o cliente "${item.client.name}" da lixeira? Esta ação não pode ser desfeita.`)) {
                                const updated = trashClients.filter((_, i) => i !== idx);
                                setTrashClients(updated);
                                localStorage.setItem(CLIENTS_TRASH_STORAGE_KEY, JSON.stringify(updated));
                              }
                            }}
                            className="p-1.5 bg-neutral-900 hover:bg-red-900/40 text-neutral-400 hover:text-red-400 rounded-lg transition-colors border border-neutral-800"
                            title="Excluir permanentemente da lixeira"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal de Confirmação Rigorosa para Excluir Cliente */}
      {clientToDelete && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-md bg-neutral-900 border border-red-500/40 rounded-2xl shadow-2xl p-5 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/20 text-red-400 border border-red-500/30 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h4 className="text-base font-black text-white">
                  Confirmar Exclusão do Cliente
                </h4>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Ação com retenção de segurança na lixeira de 15 dias.
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-neutral-950 border border-neutral-800 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-neutral-400">Cliente a excluir:</span>
                <span className="font-extrabold text-white truncate max-w-[200px]">{clientToDelete.name}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-neutral-400">Banners salvos:</span>
                <span className="font-bold text-amber-400">{clientToDelete.products?.length || 0} banner(s)</span>
              </div>
              <p className="text-[11px] text-emerald-300/90 pt-1 border-t border-neutral-900 leading-relaxed flex items-center gap-1.5">
                <RotateCcw className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                <span>Este cliente e seus banners irão para a <strong>Lixeira Temporária</strong> e ficarão protegidos por <strong>15 dias</strong> para restauração em 1 clique.</span>
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-300 mb-1.5">
                Para confirmar a exclusão, digite exatamente o nome do cliente:
              </label>
              <div className="mb-2">
                <code className="text-xs font-mono font-bold px-2 py-1 bg-neutral-950 border border-neutral-800 rounded text-amber-400 select-all inline-block">
                  {clientToDelete.name}
                </code>
              </div>
              <input
                type="text"
                value={deleteConfirmInput}
                onChange={(e) => setDeleteConfirmInput(e.target.value)}
                placeholder={`Digite "${clientToDelete.name}" aqui...`}
                className="w-full bg-neutral-950 border border-neutral-800 focus:border-red-500 rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-600 outline-none font-semibold transition-all"
                autoFocus
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setClientToDelete(null);
                  setDeleteConfirmInput('');
                }}
                className="px-3.5 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                Cancelar
              </button>

              <button
                type="button"
                disabled={deleteConfirmInput.trim().toLowerCase() !== clientToDelete.name.trim().toLowerCase()}
                onClick={() => {
                  // Move para a lixeira de clientes
                  const newTrashItem: ClientTrashItem = {
                    client: clientToDelete,
                    deletedAt: new Date().toISOString(),
                  };
                  const updatedTrash = [newTrashItem, ...trashClients.filter((t) => t.client.id !== clientToDelete.id)];
                  setTrashClients(updatedTrash);
                  try {
                    localStorage.setItem(CLIENTS_TRASH_STORAGE_KEY, JSON.stringify(updatedTrash));
                  } catch (e) {}

                  // Executa exclusão da lista ativa
                  onDeleteClient(clientToDelete.id);
                  setClientToDelete(null);
                  setDeleteConfirmInput('');
                }}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
                  deleteConfirmInput.trim().toLowerCase() === clientToDelete.name.trim().toLowerCase()
                    ? 'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/30 cursor-pointer active:scale-95'
                    : 'bg-neutral-800 text-neutral-500 cursor-not-allowed opacity-60'
                }`}
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Mover para Lixeira (15 Dias)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
