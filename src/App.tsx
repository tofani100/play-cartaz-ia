/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { BannerCampaign, BannerFormat, ProductItem, ThemePresetId } from './tiposGeradorBanner';
import { BANCO_TEMAS_VISUAIS } from './data/bancoTemasVisuais';
import { BANCO_PRODUTOS_COMERCIAIS } from './data/bancoProdutosComerciais';
import { BarraSuperiorNavegacao } from './components/BarraSuperiorNavegacao';
import { VisualizadorBannerTV } from './components/VisualizadorBannerTV';
import { VisualizadorTabloideOfertas } from './components/VisualizadorTabloideOfertas';
import { PainelEditorProdutos } from './components/PainelEditorProdutos';
import { ModalCorretorListaIA } from './components/ModalCorretorListaIA';
import { ModalPlayerTvIndoor } from './components/ModalPlayerTvIndoor';
import { ModalExportarMaterial } from './components/ModalExportarMaterial';
import { ModalGestaoClientes } from './components/ModalGestaoClientes';
import { ModalConfiguracoesCampanha } from './components/ModalConfiguracoesCampanha';
import { CLIENTES_PREDEFINIDOS } from './data/bancoClientes';
import { ClientProfile } from './tiposGeradorBanner';
import { Sparkles, Tv, Smartphone, Square, Newspaper, Layers, Play, Download, Eye, Store, Image as ImageIcon } from 'lucide-react';
import {
  loadCampaignFromCloud,
  saveCampaignToCloud,
  subscribeToCloudCampaign,
  loadClientsFromCloud,
  saveClientsToCloud,
} from './services/cloudCampaignSync';

const INITIAL_PRODUCTS: ProductItem[] = [
  {
    id: 'prod-cafe-caboclo-500g',
    title: 'Café Torrado e Moído Caboclo Tradicional a Vácuo 500g',
    brand: 'Caboclo',
    category: 'Mercearia',
    unit: '500g',
    price: '32,99',
    originalPrice: '38,90',
    discountPercentage: 15,
    badge: 'SUPER OFERTA',
    imageUrl: 'https://images.unsplash.com/photo-1509785307050-d4066910ec1e?w=1200&auto=format&fit=crop&q=85',
    imageDisplayMode: 'ambient',
    isHero: true,
  },
  {
    id: 'prod-coca-2l',
    title: 'Refrigerante Coca-Cola Garrafa 2L',
    brand: 'Coca-Cola',
    category: 'Bebidas',
    unit: '2L',
    price: '8,99',
    originalPrice: '10,99',
    discountPercentage: 19,
    badge: 'OFERTA DO DIA',
    imageUrl: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=1200&auto=format&fit=crop&q=85',
    imageDisplayMode: 'ambient',
    isHero: false,
  },
  {
    id: 'prod-heineken-330ml',
    title: 'Cerveja Heineken Puro Malte Garrafa Long Neck 330ml',
    brand: 'Heineken',
    category: 'Bebidas',
    unit: '330ml',
    price: '6,49',
    originalPrice: '7,99',
    discountPercentage: 19,
    badge: 'GELADA',
    imageUrl: 'https://images.unsplash.com/photo-1608270586620-248524c67de9?w=1200&auto=format&fit=crop&q=85',
    imageDisplayMode: 'ambient',
  },
  {
    id: 'prod-ype-neutro-500ml',
    title: 'Detergente Líquido Lava-Louças Ypê Neutro 500ml',
    brand: 'Ypê',
    category: 'Limpeza',
    unit: '500ml',
    price: '2,19',
    originalPrice: '2,89',
    discountPercentage: 24,
    badge: 'ECONOMIA',
    imageUrl: 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=1200&auto=format&fit=crop&q=85',
    imageDisplayMode: 'ambient',
  },
  {
    id: 'prod-leite-piracanjuba-1l',
    title: 'Leite Integral Piracanjuba UHT Tetra Pak 1L',
    brand: 'Piracanjuba',
    category: 'Laticínios',
    unit: '1L',
    price: '4,69',
    originalPrice: '5,99',
    discountPercentage: 22,
    badge: 'PREÇO BAIXO',
    imageUrl: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=1200&auto=format&fit=crop&q=85',
    imageDisplayMode: 'ambient',
  },
  {
    id: 'prod-feijao-camil-1kg',
    title: 'Feijão Carioca Tipo 1 Camil Pacote 1kg',
    brand: 'Camil',
    category: 'Mercearia',
    unit: '1kg',
    price: '7,49',
    originalPrice: '9,20',
    discountPercentage: 18,
    badge: 'DA TERRA',
    imageUrl: 'https://images.unsplash.com/photo-1551462147-ff29053bfc14?w=1200&auto=format&fit=crop&q=85',
    imageDisplayMode: 'ambient',
  },
];

const DEFAULT_CAMPAIGN: BannerCampaign = {
  id: 'camp-1',
  clientName: 'Belíssima Casa di Frutas',
  clientLogoUrl: '/logos/belissima-casa-di-frutas.png',
  showClientLogo: true,
  segment: 'Hortifrúti & Frutas Selecionadas',
  campaignTitle: 'FESTIVAL DE OFERTAS PLAY COMUNIQUE',
  campaignSubtitle: 'Ofertas válidas de 10 a 22/09/2026 ou enquanto durarem os estoques',
  validityText: 'Ofertas válidas de 10 a 22/09/2026 ou enquanto durarem os estoques',
  legalNotice: 'Imagens meramente ilustrativas. Produto estoqu de bebidas a menores de 18 anos.',
  footerBrandText: 'ts.playcomunique.com.br',
  tickerText: '★★ OFERTAS IMBATÍVEIS EM TODAS AS LOJAS. ★ NOSSO APLICATIVO É GAM DEMAIS! ★★ OFERTAS VÁLIDAS PARA TODAS AS FILIAIS DA BELÍSSIMA CASA DI FRUTAS ★ COMPRE PELO WHATSAPP ★ ACEITAMOS TODOS OS CARTÕES E PIX ★',
  format: '16:9',
  themeId: 'hortifruti-green',
  products: INITIAL_PRODUCTS,
  activeProductIndex: 0,
  animationStyle: 'zoom',
  slideDuration: 6,
  showClock: false,
  showMarqueeTicker: true,
  showQrCode: false,
  phoneWhatsapp: '(11) 99999-1234',
  storeAddress: 'Rua das Frutas, 2004 - Centro Comercial',
};

export default function App() {
  const [campaign, setCampaign] = useState<BannerCampaign>(() => {
    try {
      const saved = localStorage.getItem('playcomunique_campanha');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...DEFAULT_CAMPAIGN,
          ...parsed,
          clientLogoUrl:
            parsed.clientName === 'Belíssima Casa di Frutas' || parsed.id === 'camp-1'
              ? (parsed.clientLogoUrl || '/logos/belissima-casa-di-frutas.png')
              : parsed.clientLogoUrl,
        };
      }
    } catch (e) {
      console.error('Erro ao ler campanha do localStorage:', e);
    }
    return DEFAULT_CAMPAIGN;
  });

  const [cloudSyncStatus, setCloudSyncStatus] = useState<'syncing' | 'saved' | 'idle'>('saved');
  const isRemoteUpdateRef = useRef<boolean>(false);
  const initialLoadDoneRef = useRef<boolean>(false);
  const lastSavedTimestampRef = useRef<string>('');

  // 1. Carregamento inicial da Nuvem (Firebase Firestore)
  useEffect(() => {
    let isMounted = true;
    (async () => {
      setCloudSyncStatus('syncing');
      const cloudCampaign = await loadCampaignFromCloud();
      if (cloudCampaign && isMounted) {
        isRemoteUpdateRef.current = true;
        if ((cloudCampaign as any)._syncTimestamp) {
          lastSavedTimestampRef.current = (cloudCampaign as any)._syncTimestamp;
        }
        setCampaign((prev) => ({
          ...prev,
          ...cloudCampaign,
          clientLogoUrl:
            cloudCampaign.clientName === 'Belíssima Casa di Frutas' || cloudCampaign.id === 'camp-1'
              ? (cloudCampaign.clientLogoUrl || '/logos/belissima-casa-di-frutas.png')
              : cloudCampaign.clientLogoUrl,
        }));
      }
      initialLoadDoneRef.current = true;
      setCloudSyncStatus('saved');
    })();

    // Carrega clientes da nuvem
    loadClientsFromCloud().then((cloudClients) => {
      if (cloudClients && cloudClients.length > 0 && isMounted) {
        setClients(cloudClients);
      }
    });

    // Ouve alterações em tempo real do Firestore (para múltiplos computadores e TVs sincronizarem sem loop)
    const unsubscribe = subscribeToCloudCampaign((updatedCampaign) => {
      if (!isMounted || !updatedCampaign) return;
      const remoteTimestamp = (updatedCampaign as any)._syncTimestamp;
      if (remoteTimestamp && remoteTimestamp === lastSavedTimestampRef.current) {
        // Ignora eco de alterações geradas localmente
        return;
      }
      if (remoteTimestamp) {
        lastSavedTimestampRef.current = remoteTimestamp;
      }
      isRemoteUpdateRef.current = true;
      setCampaign((prev) => ({
        ...prev,
        ...updatedCampaign,
      }));
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  // 2. Persistência contínua na Nuvem (Firebase) + Backup Local
  useEffect(() => {
    // TV Player / Kiosk é um consumidor de transmissão: nunca deve recomprimir imagens ou gravar na nuvem
    if (isDirectTvMode) return;
    // Não salva antes de completar o carregamento inicial
    if (!initialLoadDoneRef.current) return;
    // Se a alteração veio da própria nuvem, não devolve para o Firestore (evita loop)
    if (isRemoteUpdateRef.current) {
      isRemoteUpdateRef.current = false;
      return;
    }

    setCloudSyncStatus('syncing');
    const timer = setTimeout(() => {
      const now = new Date().toISOString();
      lastSavedTimestampRef.current = now;
      saveCampaignToCloud({
        ...campaign,
        _syncTimestamp: now,
      } as any).then((success) => {
        if (success) {
          setCloudSyncStatus('saved');
        }
      });
      try {
        localStorage.setItem('playcomunique_campanha', JSON.stringify(campaign));
      } catch (e) {
        // Safe catch se ultrapassar limite de 5MB do navegador
      }
    }, 1200);

    return () => clearTimeout(timer);
  }, [campaign]);

  // Saved clients list with local storage persistence and per-client banners
  const [clients, setClients] = useState<ClientProfile[]>(() => {
    try {
      const saved = localStorage.getItem('playcomunique_clientes');
      const savedCampaignRaw = localStorage.getItem('playcomunique_campanha');
      const savedCampaign = savedCampaignRaw ? JSON.parse(savedCampaignRaw) : null;

      if (saved) {
        const parsed: ClientProfile[] = JSON.parse(saved);
        return parsed.map((c) => {
          const predefined = CLIENTES_PREDEFINIDOS.find((p) => p.id === c.id || p.name.toLowerCase() === c.name.toLowerCase());
          
          let clientProducts = c.products;
          if (!clientProducts || clientProducts.length === 0) {
            if ((c.name === 'Belíssima Casa di Frutas' || c.id === 'cli-belissima') && savedCampaign?.products?.length > 0) {
              clientProducts = savedCampaign.products;
            } else {
              clientProducts = predefined?.products || [];
            }
          }

          return {
            ...predefined,
            ...c,
            logoUrl:
              c.id === 'cli-belissima' || c.name === 'Belíssima Casa di Frutas'
                ? (c.logoUrl || '/logos/belissima-casa-di-frutas.png')
                : c.logoUrl,
            products: clientProducts,
          };
        });
      }
    } catch {
      // Fallback
    }
    return CLIENTES_PREDEFINIDOS;
  });

  const handleSaveClient = (newOrUpdatedClient: ClientProfile) => {
    setClients((prev) => {
      const exists = prev.some((c) => c.id === newOrUpdatedClient.id);
      let updated: ClientProfile[];
      if (exists) {
        updated = prev.map((c) => (c.id === newOrUpdatedClient.id ? { ...c, ...newOrUpdatedClient } : c));
      } else {
        const withProducts: ClientProfile = {
          ...newOrUpdatedClient,
          products: newOrUpdatedClient.products && newOrUpdatedClient.products.length > 0
            ? newOrUpdatedClient.products
            : [
                {
                  id: `prod-${Date.now()}-1`,
                  title: `Produto em Destaque - ${newOrUpdatedClient.name}`,
                  category: newOrUpdatedClient.segment.split('&')[0].trim() || 'Geral',
                  unit: 'un',
                  price: '19,90',
                  originalPrice: '25,90',
                  badge: 'SUPER OFERTA',
                  imageUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=1200&auto=format&fit=crop&q=85',
                  imageDisplayMode: 'ambient',
                  isHero: true,
                }
              ]
        };
        updated = [withProducts, ...prev];
      }
      try {
        localStorage.setItem('playcomunique_clientes', JSON.stringify(updated));
      } catch (e) {}
      saveClientsToCloud(updated).catch(() => {});
      return updated;
    });

    // If edited client is currently active on banner, sync it
    if (campaign.clientName.toLowerCase() === newOrUpdatedClient.name.toLowerCase() || campaign.clientId === newOrUpdatedClient.id) {
      setCampaign((prev) => ({
        ...prev,
        clientId: newOrUpdatedClient.id,
        clientName: newOrUpdatedClient.name,
        clientLogoUrl: newOrUpdatedClient.logoUrl,
        themeId: newOrUpdatedClient.themeId,
        segment: newOrUpdatedClient.segment,
        tickerText: newOrUpdatedClient.defaultTickerText || prev.tickerText,
        phoneWhatsapp: newOrUpdatedClient.phoneWhatsapp || prev.phoneWhatsapp,
        storeAddress: newOrUpdatedClient.storeAddress || prev.storeAddress,
      }));
    }
  };

  const handleDeleteClient = (clientId: string) => {
    setClients((prev) => {
      const updated = prev.filter((c) => c.id !== clientId);
      try {
        localStorage.setItem('playcomunique_clientes', JSON.stringify(updated));
      } catch (e) {}
      saveClientsToCloud(updated).catch(() => {});

      // Se o cliente deletado era o ativo, muda para o primeiro da lista
      if (updated.length > 0 && (campaign.clientId === clientId || campaign.clientName.toLowerCase() === clientId)) {
        setTimeout(() => handleSelectClient(updated[0]), 50);
      }
      return updated;
    });
  };

  const handleSelectClient = (client: ClientProfile) => {
    // 1. Salva os banners atuais no perfil do cliente anterior
    setClients((prevClients) => {
      const updated = prevClients.map((c) => {
        if (c.name.toLowerCase() === campaign.clientName.toLowerCase() || c.id === campaign.clientId) {
          return {
            ...c,
            products: campaign.products,
            customStyles: campaign.customStyles,
            campaignTitle: campaign.campaignTitle,
            campaignSubtitle: campaign.campaignSubtitle,
            validityText: campaign.validityText,
          };
        }
        return c;
      });
      try {
        localStorage.setItem('playcomunique_clientes', JSON.stringify(updated));
      } catch (e) {}
      saveClientsToCloud(updated).catch(() => {});
      return updated;
    });

    // 2. Busca os banners salvos do novo cliente selecionado
    const target = clients.find((c) => c.id === client.id) || client;
    let targetProducts = target.products;
    if (!targetProducts || targetProducts.length === 0) {
      const predefined = CLIENTES_PREDEFINIDOS.find((p) => p.id === client.id || p.name.toLowerCase() === client.name.toLowerCase());
      targetProducts = predefined?.products && predefined.products.length > 0 
        ? predefined.products 
        : [
            {
              id: `prod-${Date.now()}-1`,
              title: `Produto em Destaque - ${client.name}`,
              category: client.segment.split('&')[0].trim() || 'Geral',
              unit: 'un',
              price: '19,90',
              originalPrice: '25,90',
              badge: 'SUPER OFERTA',
              imageUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=1200&auto=format&fit=crop&q=85',
              imageDisplayMode: 'ambient',
              isHero: true,
            }
          ];
    }

    // 3. Atualiza a campanha com os dados e banners exclusivos deste cliente
    setCampaign((prev) => {
      const nextCampaign: BannerCampaign = {
        ...prev,
        clientId: client.id,
        clientName: client.name,
        clientLogoUrl: client.logoUrl || '',
        showClientLogo: Boolean(client.logoUrl),
        themeId: client.themeId,
        segment: client.segment,
        tickerText: client.defaultTickerText || prev.tickerText,
        phoneWhatsapp: client.phoneWhatsapp || prev.phoneWhatsapp,
        storeAddress: client.storeAddress || prev.storeAddress,
        products: targetProducts,
        activeProductIndex: 0,
        customStyles: target.customStyles || undefined,
        campaignTitle: target.campaignTitle || `FESTIVAL DE OFERTAS ${client.name.toUpperCase()}`,
        campaignSubtitle: target.campaignSubtitle || prev.campaignSubtitle,
        validityText: target.validityText || prev.validityText,
      };

      try {
        localStorage.setItem('playcomunique_campanha', JSON.stringify(nextCampaign));
        localStorage.setItem('playcomunique_active_client_id', client.id);
      } catch (e) {}

      saveCampaignToCloud(nextCampaign).catch(() => {});
      return nextCampaign;
    });
  };

  // Check if running in direct standalone TV Kiosk mode (?mode=tv or ?player=1 or ?kiosk=1)
  const [isDirectTvMode, setIsDirectTvMode] = useState<boolean>(() => {
    try {
      if (typeof window === 'undefined') return false;
      const params = new URLSearchParams(window.location.search);
      return params.get('mode') === 'tv' || params.get('player') === '1' || params.get('kiosk') === '1';
    } catch {
      return false;
    }
  });

  // Modal states
  const [isAiModalOpen, setIsAiModalOpen] = useState<boolean>(false);
  const [isTvPlayerOpen, setIsTvPlayerOpen] = useState<boolean>(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [isThemeModalOpen, setIsThemeModalOpen] = useState<boolean>(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);

  // Auto open TV player if opened with ?mode=tv or ?player=1
  React.useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get('mode') === 'tv' || params.get('player') === '1' || params.get('kiosk') === '1') {
        setIsDirectTvMode(true);
      }
    } catch (e) {
      // Ignore URLSearchParams error in restricted contexts
    }
  }, []);

  const activeTheme = BANCO_TEMAS_VISUAIS[campaign.themeId] || BANCO_TEMAS_VISUAIS['supermarket-red'];

  const handleFormatChange = (fmt: BannerFormat) => {
    setCampaign((prev) => ({ ...prev, format: fmt }));
  };

  const handleApplyAiProducts = (
    newProducts: ProductItem[],
    campaignTitle?: string,
    validityText?: string
  ) => {
    setCampaign((prev) => {
      const nextProducts = newProducts;
      setClients((prevClients) => {
        const updated = prevClients.map((c) =>
          c.name.toLowerCase() === prev.clientName.toLowerCase() || c.id === prev.clientId
            ? { ...c, products: nextProducts }
            : c
        );
        try {
          localStorage.setItem('playcomunique_clientes', JSON.stringify(updated));
        } catch (e) {}
        saveClientsToCloud(updated).catch(() => {});
        return updated;
      });

      return {
        ...prev,
        products: nextProducts,
        activeProductIndex: 0,
        campaignTitle: campaignTitle || prev.campaignTitle,
        validityText: validityText || prev.validityText,
      };
    });
  };

  const handleUpdateProduct = (idx: number, updated: Partial<ProductItem>) => {
    setCampaign((prev) => {
      const nextProducts = [...prev.products];
      nextProducts[idx] = { ...nextProducts[idx], ...updated };

      setClients((prevClients) => {
        const updated = prevClients.map((c) =>
          c.name.toLowerCase() === prev.clientName.toLowerCase() || c.id === prev.clientId
            ? { ...c, products: nextProducts }
            : c
        );
        try {
          localStorage.setItem('playcomunique_clientes', JSON.stringify(updated));
        } catch (e) {}
        return updated;
      });

      return { ...prev, products: nextProducts };
    });
  };

  const handleAddProduct = (newProduct: ProductItem) => {
    setCampaign((prev) => {
      const nextProducts = [newProduct, ...prev.products];

      setClients((prevClients) => {
        const updated = prevClients.map((c) =>
          c.name.toLowerCase() === prev.clientName.toLowerCase() || c.id === prev.clientId
            ? { ...c, products: nextProducts }
            : c
        );
        try {
          localStorage.setItem('playcomunique_clientes', JSON.stringify(updated));
        } catch (e) {}
        return updated;
      });

      return {
        ...prev,
        products: nextProducts,
        activeProductIndex: 0,
      };
    });
  };

  const handleRemoveProduct = (idx: number) => {
    setCampaign((prev) => {
      const next = prev.products.filter((_, i) => i !== idx);
      const nextIdx = Math.min(prev.activeProductIndex, Math.max(0, next.length - 1));

      setClients((prevClients) => {
        const updated = prevClients.map((c) =>
          c.name.toLowerCase() === prev.clientName.toLowerCase() || c.id === prev.clientId
            ? { ...c, products: next }
            : c
        );
        try {
          localStorage.setItem('playcomunique_clientes', JSON.stringify(updated));
        } catch (e) {}
        return updated;
      });

      return { ...prev, products: next, activeProductIndex: nextIdx };
    });
  };

  const handleUpdateCampaign = (updated: Partial<BannerCampaign>) => {
    setCampaign((prev) => {
      const next = { ...prev, ...updated };

      setClients((prevClients) => {
        const updatedClients = prevClients.map((c) =>
          c.name.toLowerCase() === prev.clientName.toLowerCase() || c.id === prev.clientId
            ? {
                ...c,
                products: next.products,
                customStyles: next.customStyles,
                campaignTitle: next.campaignTitle,
                campaignSubtitle: next.campaignSubtitle,
                validityText: next.validityText,
                themeId: next.themeId || c.themeId,
              }
            : c
        );
        try {
          localStorage.setItem('playcomunique_clientes', JSON.stringify(updatedClients));
        } catch (e) {}
        return updatedClients;
      });

      return next;
    });
  };

  // Standalone Direct TV Player View (Pure Digital Signage for Stick TV & Fully Kiosk)
  if (isDirectTvMode) {
    return (
      <div className="w-screen h-screen overflow-hidden bg-black select-none">
        <ModalPlayerTvIndoor
          isOpen={true}
          onClose={() => {
            setIsDirectTvMode(false);
            try {
              const url = new URL(window.location.href);
              url.searchParams.delete('mode');
              url.searchParams.delete('player');
              url.searchParams.delete('kiosk');
              window.history.replaceState({}, '', url.pathname);
            } catch {}
          }}
          campaign={campaign}
          theme={activeTheme}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen lg:h-screen lg:max-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-['Plus_Jakarta_Sans',_sans-serif] overflow-x-hidden lg:overflow-hidden">
      {/* Top Header */}
      <BarraSuperiorNavegacao
        format={campaign.format}
        onFormatChange={handleFormatChange}
        onOpenAiParser={() => setIsAiModalOpen(true)}
        onOpenTvPlayer={() => setIsTvPlayerOpen(true)}
        onOpenExportModal={() => setIsExportModalOpen(true)}
        onOpenThemeModal={() => setIsThemeModalOpen(true)}
        onOpenSettingsModal={() => setIsSettingsModalOpen(true)}
        clientName={campaign.clientName}
        onClientNameChange={(name) => handleUpdateCampaign({ clientName: name })}
        activeThemeId={campaign.themeId}
        showClientLogo={campaign.showClientLogo !== false}
        onToggleShowLogo={() => handleUpdateCampaign({ showClientLogo: !campaign.showClientLogo })}
        cloudSyncStatus={cloudSyncStatus}
        clients={clients}
        onSelectClient={handleSelectClient}
        activeProductCount={campaign.products.length}
      />

      {/* Main Workspace Layout */}
      <main className="flex-1 min-h-0 flex flex-col lg:flex-row overflow-y-auto lg:overflow-hidden">
        {/* Visual Stage (Center / Main Left) - Sem espaço vago e sem scroll */}
        <div className={`flex-1 min-h-0 flex flex-col items-center justify-start p-1 sm:p-2 pt-1 lg:pt-1.5 ${campaign.format === 'tabloid' ? 'overflow-y-auto' : 'lg:overflow-hidden'} bg-neutral-950/60`}>


          {/* Conditional Preview: Tabloid or Banner */}
          {campaign.format === 'tabloid' ? (
            <VisualizadorTabloideOfertas campaign={campaign} theme={activeTheme} />
          ) : (
            <VisualizadorBannerTV
              campaign={campaign}
              theme={activeTheme}
              currentProductIndex={campaign.activeProductIndex}
              onSelectProductIndex={(idx) => setCampaign((p) => ({ ...p, activeProductIndex: idx }))}
              onUpdateProductImage={(productId, newImageUrl) => {
                handleUpdateProduct(campaign.activeProductIndex, { imageUrl: newImageUrl, imageDisplayMode: 'ambient' });
              }}
              onUpdateProductItem={(idx, updated) => handleUpdateProduct(idx, updated)}
            />
          )}
        </div>

        {/* Product & Campaign Management Sidebar */}
        <aside className="w-full lg:w-96 xl:w-[420px] bg-neutral-900 border-t lg:border-t-0 lg:border-l border-neutral-800 flex flex-col shrink-0 lg:overflow-y-auto lg:h-full">
          <PainelEditorProdutos
            products={campaign.products}
            currentProductIndex={campaign.activeProductIndex}
            onSelectProductIndex={(idx) => setCampaign((p) => ({ ...p, activeProductIndex: idx }))}
            onUpdateProduct={handleUpdateProduct}
            onAddProduct={handleAddProduct}
            onRemoveProduct={handleRemoveProduct}
            showClientLogo={campaign.showClientLogo !== false}
            onToggleShowLogo={() => handleUpdateCampaign({ showClientLogo: !campaign.showClientLogo })}
            clientName={campaign.clientName}
            campaign={campaign}
            theme={activeTheme}
            onUpdateCampaign={handleUpdateCampaign}
          />
        </aside>
      </main>

      {/* Modals */}
      <ModalCorretorListaIA
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        onApplyProducts={handleApplyAiProducts}
        currentSegment={campaign.segment}
      />

      <ModalPlayerTvIndoor
        isOpen={isTvPlayerOpen}
        onClose={() => setIsTvPlayerOpen(false)}
        campaign={campaign}
        theme={activeTheme}
      />

      <ModalExportarMaterial
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        campaign={campaign}
        theme={activeTheme}
        onOpenTvPlayer={() => setIsTvPlayerOpen(true)}
        onSelectProductIndex={(idx) => setCampaign((p) => ({ ...p, activeProductIndex: idx }))}
      />

      <ModalGestaoClientes
        isOpen={isThemeModalOpen}
        onClose={() => setIsThemeModalOpen(false)}
        clients={clients}
        activeClientName={campaign.clientName}
        activeThemeId={campaign.themeId}
        showClientLogo={campaign.showClientLogo !== false}
        onSelectClient={handleSelectClient}
        onSelectThemeOnly={(themeId) => setCampaign((p) => ({ ...p, themeId }))}
        onSaveClient={handleSaveClient}
        onDeleteClient={handleDeleteClient}
        onToggleShowLogo={(show) => handleUpdateCampaign({ showClientLogo: show })}
        onOpenTvPlayer={() => setIsTvPlayerOpen(true)}
      />

      <ModalConfiguracoesCampanha
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        campaign={campaign}
        onUpdateCampaign={handleUpdateCampaign}
      />
    </div>
  );
}
