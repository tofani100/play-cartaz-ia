import React, { useState, useRef } from 'react';
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
  Play
} from 'lucide-react';
import { ClientProfile, ThemePresetId, BannerCampaign } from '../tiposGeradorBanner';
import { BANCO_TEMAS_VISUAIS } from '../data/bancoTemasVisuais';

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
  const [activeTab, setActiveTab] = useState<'clients' | 'themes'>('clients');
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
  const [logoPreviewError, setLogoPreviewError] = useState(false);

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
    setLogoPreviewError(false);
    setIsFormOpen(true);
  };

  // File upload handler (converts image file to Base64 data URL)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione um arquivo de imagem válido (PNG, JPG, SVG ou WEBP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const result = uploadEvent.target?.result as string;
      if (result) {
        setFormLogoUrl(result);
        setLogoPreviewError(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // Submit client form
  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      alert('Por favor, informe o nome do cliente.');
      return;
    }

    const clientToSave: ClientProfile = {
      id: editingClient ? editingClient.id : `cli-${Date.now()}`,
      name: formName.trim(),
      tradeName: formTradeName.trim() || formName.trim(),
      segment: formSegment,
      logoUrl: formLogoUrl.trim(),
      themeId: formThemeId,
      defaultTickerText: formTicker.trim(),
      phoneWhatsapp: formPhone.trim(),
      storeAddress: formAddress.trim(),
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
                          onClick={() => fileInputRef.current?.click()}
                          className="w-full py-2.5 px-3 bg-neutral-800 hover:bg-neutral-700 border border-dashed border-amber-400/50 rounded-lg text-xs font-bold text-amber-300 flex items-center justify-center gap-2 transition-colors cursor-pointer"
                        >
                          <Upload className="w-4 h-4" />
                          <span>Fazer Upload do Logo (PNG / SVG do seu PC)</span>
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

                  {/* Additional info */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <div>
                      <label className="block text-xs font-bold text-neutral-400 mb-1">
                        Telefone / WhatsApp (Opcional)
                      </label>
                      <input
                        type="text"
                        value={formPhone}
                        onChange={(e) => setFormPhone(e.target.value)}
                        placeholder="(11) 99999-9999"
                        className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-400"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-neutral-400 mb-1">
                        Endereço / Loja (Opcional)
                      </label>
                      <input
                        type="text"
                        value={formAddress}
                        onChange={(e) => setFormAddress(e.target.value)}
                        placeholder="Rua / Bairro / Cidade"
                        className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-400"
                      />
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
                                    if (confirm(`Tem certeza que deseja excluir o cliente "${cli.name}"?`)) {
                                      onDeleteClient(cli.id);
                                    }
                                  }}
                                  className="p-1.5 rounded-lg bg-neutral-900 hover:bg-red-900/40 text-neutral-400 hover:text-red-400 transition-colors"
                                  title="Excluir cliente"
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
        </div>
      </div>
    </div>
  );
};
