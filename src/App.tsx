/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  BannerCampaign, 
  BannerFormat, 
  ProductItem, 
  ThemePresetId,
  FormatCampaignData,
  ALL_BANNER_FORMATS,
  extractFormatData,
  initFormatsData,
  syncCurrentFormatToFormatsData
} from './tiposGeradorBanner';
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
  saveProductImageToCloud,
} from './services/cloudCampaignSync';
import {
  saveLocalImage,
  getLocalImage,
  saveLocalCampaign,
  getLocalCampaign,
  saveLocalClients,
  getLocalClients,
} from './services/localImageDb';

const BELISSIMA_CLIENT = CLIENTES_PREDEFINIDOS.find((c) => c.id === 'cli-belissima') || CLIENTES_PREDEFINIDOS[0];
const INITIAL_PRODUCTS: ProductItem[] = BELISSIMA_CLIENT?.products || [];

const DEFAULT_CAMPAIGN_RAW: BannerCampaign = {
  id: 'camp-1',
  clientId: 'cli-belissima',
  clientName: 'Belíssima Casa di Frutas',
  clientLogoUrl: '/logos/belissima-casa-di-frutas.png',
  showClientLogo: true,
  segment: 'Hortifrúti & Frutas Selecionadas',
  campaignTitle: 'FESTIVAL DE OFERTAS BELÍSSIMA CASA DI FRUTAS',
  campaignSubtitle: 'Ofertas válidas de 10 a 22/09/2026 ou enquanto durarem os estoques',
  validityText: 'Ofertas válidas de 10 a 22/09/2026 ou enquanto durarem os estoques',
  legalNotice: 'Imagens meramente ilustrativas. Proibida venda de bebidas a menores de 18 anos.',
  footerBrandText: 'ts.playcomunique.com.br',
  tickerText: '★★ OFERTAS IMBATÍVEIS EM TODAS AS LOJAS. ★ QUALIDADE BELÍSSIMA CASA DI FRUTAS ★ COMPRE PELO WHATSAPP ★ ACEITAMOS TODOS OS CARTÕES E PIX ★',
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
  customStyles: {
    campaignTitleFont: "'Montserrat', sans-serif",
    productTitleFont: "'Montserrat', sans-serif",
  },
};

const DEFAULT_CAMPAIGN: BannerCampaign = {
  ...DEFAULT_CAMPAIGN_RAW,
  formatsData: initFormatsData(DEFAULT_CAMPAIGN_RAW),
};

export default function App() {
  const [campaign, setCampaign] = useState<BannerCampaign>(() => {
    try {
      const saved = localStorage.getItem('playcomunique_campanha');
      if (saved) {
        const parsed = JSON.parse(saved);
        let products = parsed.products || [];
        // Proteção contra perda acidental: se Belíssima tiver menos de 15 produtos, recupera o acervo de 22 produtos
        if ((parsed.clientName === 'Belíssima Casa di Frutas' || parsed.clientId === 'cli-belissima' || !parsed.clientId) && products.length < 15) {
          console.log('[Recuperação] Restaurando 22 produtos autênticos da Belíssima no carregamento inicial.');
          products = INITIAL_PRODUCTS;
        }

        const restored: BannerCampaign = {
          ...DEFAULT_CAMPAIGN,
          ...parsed,
          products,
          clientLogoUrl:
            parsed.clientLogoUrl ||
            (parsed.clientName === 'Belíssima Casa di Frutas' || parsed.id === 'camp-1'
              ? '/logos/belissima-casa-di-frutas.png'
              : ''),
        };
        if (!restored.formatsData || Object.keys(restored.formatsData).length === 0) {
          restored.formatsData = initFormatsData(restored);
        }
        return restored;
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
  const lastLocalEditTimeRef = useRef<number>(0);

  // 1. Carregamento inicial da Nuvem (Firebase Firestore) com proteção total contra perda de dados no F5
  useEffect(() => {
    let isMounted = true;
    (async () => {
      setCloudSyncStatus('syncing');
      const cloudCampaign = await loadCampaignFromCloud();
      if (cloudCampaign && isMounted) {
        setCampaign((prev) => {
          const localProducts = prev.products || [];
          const remoteProducts = cloudCampaign.products || [];

          // PROTEÇÃO CONTRA PERDA: Se a nuvem tem mais produtos que o local (ex: acervo completo de 22 itens),
          // prioriza sempre a integridade da nuvem para não truncar dados.
          let finalProducts = remoteProducts;
          if (localProducts.length > remoteProducts.length) {
            finalProducts = localProducts;
          } else if (remoteProducts.length === 0) {
            finalProducts = localProducts.length > 0 ? localProducts : INITIAL_PRODUCTS;
          }

          isRemoteUpdateRef.current = true;
          if ((cloudCampaign as any)._syncTimestamp) {
            lastSavedTimestampRef.current = (cloudCampaign as any)._syncTimestamp;
          }

          // Prioriza logo customizado já presente localmente se a nuvem estiver sem ou com o default
          let finalLogo = cloudCampaign.clientLogoUrl || prev.clientLogoUrl || '';
          if (
            prev.clientLogoUrl &&
            !prev.clientLogoUrl.startsWith('/logos/belissima') &&
            (!cloudCampaign.clientLogoUrl || cloudCampaign.clientLogoUrl.startsWith('/logos/belissima'))
          ) {
            finalLogo = prev.clientLogoUrl;
          } else if (
            !finalLogo &&
            (cloudCampaign.clientName === 'Belíssima Casa di Frutas' || cloudCampaign.id === 'camp-1')
          ) {
            finalLogo = '/logos/belissima-casa-di-frutas.png';
          }

          const mergedCampaign: BannerCampaign = {
            ...prev,
            ...cloudCampaign,
            products: finalProducts,
            clientLogoUrl: finalLogo,
          };
          if (!mergedCampaign.formatsData || Object.keys(mergedCampaign.formatsData).length === 0) {
            mergedCampaign.formatsData = initFormatsData(mergedCampaign);
          }
          return mergedCampaign;
        });
      }
      initialLoadDoneRef.current = true;
      setCloudSyncStatus('saved');
    })();

    // Carrega clientes da nuvem com merge seguro de produtos e logos
    loadClientsFromCloud().then((cloudClients) => {
      if (cloudClients && cloudClients.length > 0 && isMounted) {
        setClients((prev) => {
          const mergedCloud = cloudClients.map((cc) => {
            const lc = prev.find((p) => p.id === cc.id || p.name.toLowerCase() === cc.name.toLowerCase());
            if (!lc) return cc;

            // Preserva logo local customizado se a nuvem tiver logo padrão ou vazio
            let finalLogo = cc.logoUrl || lc.logoUrl || '';
            if (
              lc.logoUrl &&
              !lc.logoUrl.startsWith('/logos/belissima') &&
              (!cc.logoUrl || cc.logoUrl.startsWith('/logos/belissima'))
            ) {
              finalLogo = lc.logoUrl;
            }

            // Preserva produtos locais se tiver mais
            let finalProducts = cc.products || [];
            if (lc.products && lc.products.length > finalProducts.length) {
              finalProducts = lc.products;
            }

            return {
              ...cc,
              ...lc,
              products: finalProducts,
              logoUrl: finalLogo,
            };
          });

          // Preserva clientes criados localmente que ainda não subiram para a nuvem
          const localOnlyClients = prev.filter(
            (lc) => !cloudClients.some((cc) => cc.id === lc.id || cc.name.toLowerCase() === lc.name.toLowerCase())
          );

          const finalClients = [...mergedCloud, ...localOnlyClients];

          try {
            localStorage.setItem('playcomunique_clientes', JSON.stringify(finalClients));
          } catch (e) {}
          saveLocalClients(finalClients).catch(() => {});
          return finalClients;
        });
      }
    });

    // 2. Restaura logotipos e clientes do IndexedDB local (redundância instantânea)
    getLocalClients().then((cachedClients) => {
      if (cachedClients && cachedClients.length > 0 && isMounted) {
        setClients((prev) => {
          return prev.map((c) => {
            const cached = cachedClients.find((ic) => ic.id === c.id || ic.name.toLowerCase() === c.name.toLowerCase());
            if (cached && cached.logoUrl && (!c.logoUrl || c.logoUrl.startsWith('/logos/belissima'))) {
              return { ...c, logoUrl: cached.logoUrl };
            }
            return c;
          });
        });
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

      // PROTEÇÃO CRÍTICA: Se o usuário fez uma alteração local recente (< 7s),
      // não deixa um snapshot antigo sobrescrever o trabalho em andamento
      if (Date.now() - lastLocalEditTimeRef.current < 7000) {
        return;
      }

      if (remoteTimestamp) {
        lastSavedTimestampRef.current = remoteTimestamp;
      }
      isRemoteUpdateRef.current = true;
      setCampaign((prev) => {
        // Preserva imagens locais válidas de upload caso o snapshot ainda não as tenha propagado
        const mergedProducts = (updatedCampaign.products || []).map((remP) => {
          const locP = prev.products.find((lp) => lp.id === remP.id);
          if (locP?.imageUrl && locP.imageUrl.startsWith('data:image') && (!remP.imageUrl || remP.imageUrl.startsWith('cloud-img:'))) {
            return { ...remP, imageUrl: locP.imageUrl };
          }
          return remP;
        });

        const nextSynced: BannerCampaign = {
          ...prev,
          ...updatedCampaign,
          products: mergedProducts,
        };
        if (!nextSynced.formatsData || Object.keys(nextSynced.formatsData).length === 0) {
          nextSynced.formatsData = initFormatsData(nextSynced);
        }
        return nextSynced;
      });
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
      saveCampaignToCloud({
        ...campaign,
        _syncTimestamp: now,
      } as any).then((success) => {
        if (success) {
          lastSavedTimestampRef.current = now;
          setCloudSyncStatus('saved');
        } else {
          setCloudSyncStatus('idle');
        }
      });
      try {
        localStorage.setItem('playcomunique_campanha', JSON.stringify(campaign));
      } catch (e) {
        console.warn('Aviso: localStorage cheio, backup mantido no IndexedDB e Firestore:', e);
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
          if ((c.name === 'Belíssima Casa di Frutas' || c.id === 'cli-belissima') && (!clientProducts || clientProducts.length < 15)) {
            clientProducts = predefined?.products || INITIAL_PRODUCTS;
          } else if (!clientProducts || clientProducts.length === 0) {
            clientProducts = predefined?.products || [];
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

  // 3. Sincronização periódica suave da lista de clientes no Firestore
  useEffect(() => {
    if (isDirectTvMode || !initialLoadDoneRef.current) return;
    const timer = setTimeout(() => {
      saveClientsToCloud(clients).catch(() => {});
    }, 2500);
    return () => clearTimeout(timer);
  }, [clients]);

  const handleSaveClient = (newOrUpdatedClient: ClientProfile) => {
    // 1. Salva imediatamente o logotipo no IndexedDB e em documento dedicado do Firestore
    if (newOrUpdatedClient.logoUrl) {
      saveLocalImage(`logo_${newOrUpdatedClient.id}`, newOrUpdatedClient.logoUrl).catch(() => {});
      saveProductImageToCloud(`logo_${newOrUpdatedClient.id}`, newOrUpdatedClient.logoUrl).catch(() => {});
    }

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
      } catch (e) {
        console.warn('Aviso: localStorage cheio, backup mantido no IndexedDB e Nuvem:', e);
      }
      saveLocalClients(updated).catch(() => {});
      saveClientsToCloud(updated).catch(() => {});
      return updated;
    });

    // Se o cliente editado for o ativo no banner, sincroniza imediatamente
    if (campaign.clientName.toLowerCase() === newOrUpdatedClient.name.toLowerCase() || campaign.clientId === newOrUpdatedClient.id) {
      setCampaign((prev) => {
        const nextCamp: BannerCampaign = {
          ...prev,
          clientId: newOrUpdatedClient.id,
          clientName: newOrUpdatedClient.name,
          clientLogoUrl: newOrUpdatedClient.logoUrl,
          showClientLogo: Boolean(newOrUpdatedClient.logoUrl),
          themeId: newOrUpdatedClient.themeId,
          segment: newOrUpdatedClient.segment,
          tickerText: newOrUpdatedClient.defaultTickerText || prev.tickerText,
          phoneWhatsapp: newOrUpdatedClient.phoneWhatsapp || prev.phoneWhatsapp,
          storeAddress: newOrUpdatedClient.storeAddress || prev.storeAddress,
        };
        try {
          localStorage.setItem('playcomunique_campanha', JSON.stringify(nextCamp));
        } catch (_) {}
        saveLocalCampaign(nextCamp).catch(() => {});
        saveCampaignToCloud(nextCamp).catch(() => {});
        return nextCamp;
      });
    }
  };

  const handleDeleteClient = (clientId: string) => {
    setClients((prev) => {
      const updated = prev.filter((c) => c.id !== clientId);
      try {
        localStorage.setItem('playcomunique_clientes', JSON.stringify(updated));
      } catch (e) {}
      saveLocalClients(updated).catch(() => {});
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
            formatsData: campaign.formatsData,
          };
        }
        return c;
      });
      try {
        localStorage.setItem('playcomunique_clientes', JSON.stringify(updated));
      } catch (e) {}
      saveLocalClients(updated).catch(() => {});
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
      let nextFormats = target.formatsData;
      const initialTargetCampaign: BannerCampaign = {
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

      if (!nextFormats || Object.keys(nextFormats).length === 0) {
        nextFormats = initFormatsData(initialTargetCampaign);
      }

      // Se o formato atual já tiver customizações salvas para este cliente, aplica-as
      const currentFmtData = nextFormats[prev.format];
      const activeProducts = currentFmtData?.products && currentFmtData.products.length > 0
        ? currentFmtData.products
        : targetProducts;

      const nextCampaign: BannerCampaign = {
        ...initialTargetCampaign,
        campaignTitle: currentFmtData?.campaignTitle || initialTargetCampaign.campaignTitle,
        campaignSubtitle: currentFmtData?.campaignSubtitle || initialTargetCampaign.campaignSubtitle,
        validityText: currentFmtData?.validityText || initialTargetCampaign.validityText,
        products: activeProducts,
        customStyles: currentFmtData?.customStyles || initialTargetCampaign.customStyles,
        formatsData: nextFormats,
      };

      try {
        localStorage.setItem('playcomunique_campanha', JSON.stringify(nextCampaign));
        localStorage.setItem('playcomunique_active_client_id', client.id);
      } catch (e) {}

      saveLocalCampaign(nextCampaign).catch(() => {});
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
    setCampaign((prev) => {
      if (prev.format === fmt) return prev;

      // 1. Salva o estado atual do formato que está saindo
      const currentFormat = prev.format || '16:9';
      const updatedFormats = syncCurrentFormatToFormatsData(prev.formatsData, currentFormat, prev);

      // 2. Obtém os dados do novo formato de destino
      const targetFormatData = updatedFormats[fmt] || extractFormatData(prev);

      // 3. Aplica os dados do novo formato no campaign ativo
      const nextCampaign: BannerCampaign = {
        ...prev,
        format: fmt,
        campaignTitle: targetFormatData.campaignTitle !== undefined ? targetFormatData.campaignTitle : prev.campaignTitle,
        campaignSubtitle: targetFormatData.campaignSubtitle !== undefined ? targetFormatData.campaignSubtitle : prev.campaignSubtitle,
        validityText: targetFormatData.validityText !== undefined ? targetFormatData.validityText : prev.validityText,
        legalNotice: targetFormatData.legalNotice !== undefined ? targetFormatData.legalNotice : prev.legalNotice,
        footerBrandText: targetFormatData.footerBrandText !== undefined ? targetFormatData.footerBrandText : prev.footerBrandText,
        tickerText: targetFormatData.tickerText !== undefined ? targetFormatData.tickerText : prev.tickerText,
        phoneWhatsapp: targetFormatData.phoneWhatsapp !== undefined ? targetFormatData.phoneWhatsapp : prev.phoneWhatsapp,
        storeAddress: targetFormatData.storeAddress !== undefined ? targetFormatData.storeAddress : prev.storeAddress,
        themeId: targetFormatData.themeId || prev.themeId,
        customColors: targetFormatData.customColors || prev.customColors,
        customStyles: targetFormatData.customStyles ? JSON.parse(JSON.stringify(targetFormatData.customStyles)) : prev.customStyles,
        products: targetFormatData.products && targetFormatData.products.length > 0 
          ? JSON.parse(JSON.stringify(targetFormatData.products)) 
          : prev.products,
        activeProductIndex: targetFormatData.activeProductIndex !== undefined 
          ? Math.min(targetFormatData.activeProductIndex, Math.max(0, (targetFormatData.products?.length || prev.products.length) - 1))
          : prev.activeProductIndex,
        showClientLogo: targetFormatData.showClientLogo !== undefined ? targetFormatData.showClientLogo : prev.showClientLogo,
        tabloidColumns: targetFormatData.tabloidColumns,
        tabloidRows: targetFormatData.tabloidRows,
        tabloidSelectedProductIds: targetFormatData.tabloidSelectedProductIds,
        tabloidTarget: targetFormatData.tabloidTarget,
        formatsData: updatedFormats,
      };

      try {
        localStorage.setItem('playcomunique_campanha', JSON.stringify(nextCampaign));
      } catch (e) {}

      setClients((prevClients) => {
        const updatedClients = prevClients.map((c) =>
          c.name.toLowerCase() === prev.clientName.toLowerCase() || c.id === prev.clientId
            ? { ...c, formatsData: updatedFormats }
            : c
        );
        try {
          localStorage.setItem('playcomunique_clientes', JSON.stringify(updatedClients));
        } catch (e) {}
        return updatedClients;
      });

      return nextCampaign;
    });
  };

  const handleApplyAiProducts = (
    newProducts: ProductItem[],
    campaignTitle?: string,
    validityText?: string,
    mode: 'append' | 'replace' = 'append'
  ) => {
    lastLocalEditTimeRef.current = Date.now();
    const now = new Date().toISOString();

    setCampaign((prev) => {
      // PROTEÇÃO MÁXIMA CONTRA PERDA DE BANNERS:
      // Se mode === 'replace', salva todos os produtos anteriores na lixeira para recuperação
      if (mode === 'replace' && prev.products && prev.products.length > 0) {
        try {
          const lixeiraRaw = localStorage.getItem('playcomunique_lixeira_banners');
          const lixeira = lixeiraRaw ? JSON.parse(lixeiraRaw) : [];
          prev.products.forEach((p) => {
            lixeira.unshift({
              product: p,
              clientName: prev.clientName,
              deletedAt: now,
            });
          });
          localStorage.setItem('playcomunique_lixeira_banners', JSON.stringify(lixeira.slice(0, 50)));
        } catch (e) {
          console.warn('Erro ao salvar backup na lixeira:', e);
        }
      }

      // Por padrão, sempre ADICIONA (append) aos banners existentes para NUNCA perder os já prontos!
      const nextProducts = mode === 'replace'
        ? newProducts
        : [...(prev.products || []), ...newProducts];

      const targetIndex = mode === 'replace' ? 0 : Math.max(0, (prev.products?.length || 0));

      const tempCampaign: BannerCampaign = {
        ...prev,
        products: nextProducts,
        activeProductIndex: targetIndex,
        campaignTitle: campaignTitle || prev.campaignTitle,
        validityText: validityText || prev.validityText,
        _syncTimestamp: now,
      } as any;

      // Quando gerado/substituído novo catálogo, replica para todos os formatos como baseline
      // Se for append, adiciona a todos os formatos mantendo eventuais estilos específicos
      let nextFormatsData: Record<BannerFormat, FormatCampaignData>;
      if (mode === 'replace') {
        nextFormatsData = initFormatsData(tempCampaign);
      } else {
        const existing = prev.formatsData && Object.keys(prev.formatsData).length > 0
          ? { ...prev.formatsData }
          : initFormatsData(prev);
        ALL_BANNER_FORMATS.forEach((f) => {
          const fData = existing[f] || extractFormatData(prev);
          existing[f] = {
            ...fData,
            products: [...(fData.products || []), ...newProducts],
            campaignTitle: campaignTitle || fData.campaignTitle,
            validityText: validityText || fData.validityText,
          };
        });
        nextFormatsData = existing as Record<BannerFormat, FormatCampaignData>;
      }

      const nextCampaign: BannerCampaign = {
        ...tempCampaign,
        formatsData: nextFormatsData,
      };

      try {
        localStorage.setItem('playcomunique_campanha', JSON.stringify(nextCampaign));
      } catch (e) {
        console.warn('Erro ao salvar campanha localmente:', e);
      }

      setClients((prevClients) => {
        const updated = prevClients.map((c) =>
          c.name.toLowerCase() === prev.clientName.toLowerCase() || c.id === prev.clientId
            ? { ...c, products: nextProducts, formatsData: nextFormatsData }
            : c
        );
        try {
          localStorage.setItem('playcomunique_clientes', JSON.stringify(updated));
        } catch (e) {}
        saveClientsToCloud(updated).catch(() => {});
        return updated;
      });

      saveCampaignToCloud(nextCampaign).then((ok) => {
        if (ok) {
          lastSavedTimestampRef.current = now;
          setCloudSyncStatus('saved');
        }
      }).catch(() => {});

      return nextCampaign;
    });
  };

  const handleUpdateProduct = (idx: number, updated: Partial<ProductItem>) => {
    lastLocalEditTimeRef.current = Date.now();
    const now = new Date().toISOString();
    setCampaign((prev) => {
      const nextProducts = [...prev.products];
      nextProducts[idx] = { ...nextProducts[idx], ...updated };
      const currentFormat = prev.format || '16:9';

      const tempCampaign: BannerCampaign = {
        ...prev,
        products: nextProducts,
        _syncTimestamp: now,
      } as any;

      const nextFormatsData = syncCurrentFormatToFormatsData(prev.formatsData, currentFormat, tempCampaign);

      const nextCampaign: BannerCampaign = {
        ...tempCampaign,
        formatsData: nextFormatsData,
      };

      try {
        localStorage.setItem('playcomunique_campanha', JSON.stringify(nextCampaign));
      } catch (e) {}

      setClients((prevClients) => {
        const updatedClients = prevClients.map((c) =>
          c.name.toLowerCase() === prev.clientName.toLowerCase() || c.id === prev.clientId
            ? { ...c, products: nextProducts, formatsData: nextFormatsData }
            : c
        );
        try {
          localStorage.setItem('playcomunique_clientes', JSON.stringify(updatedClients));
        } catch (e) {}
        return updatedClients;
      });

      return nextCampaign;
    });
  };

  const handleAddProduct = (newProduct: ProductItem) => {
    lastLocalEditTimeRef.current = Date.now();
    const now = new Date().toISOString();
    setCampaign((prev) => {
      const nextProducts = [...prev.products, newProduct];
      const currentFormat = prev.format || '16:9';

      const tempCampaign: BannerCampaign = {
        ...prev,
        products: nextProducts,
        activeProductIndex: nextProducts.length - 1,
        _syncTimestamp: now,
      } as any;

      const nextFormatsData = syncCurrentFormatToFormatsData(prev.formatsData, currentFormat, tempCampaign);

      const nextCampaign: BannerCampaign = {
        ...tempCampaign,
        formatsData: nextFormatsData,
      };

      try {
        localStorage.setItem('playcomunique_campanha', JSON.stringify(nextCampaign));
      } catch (e) {}

      setClients((prevClients) => {
        const updatedClients = prevClients.map((c) =>
          c.name.toLowerCase() === prev.clientName.toLowerCase() || c.id === prev.clientId
            ? { ...c, products: nextProducts, formatsData: nextFormatsData }
            : c
        );
        try {
          localStorage.setItem('playcomunique_clientes', JSON.stringify(updatedClients));
        } catch (e) {}
        return updatedClients;
      });

      return nextCampaign;
    });
  };

  const handleReorderProduct = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0) return;
    lastLocalEditTimeRef.current = Date.now();
    const now = new Date().toISOString();
    setCampaign((prev) => {
      if (fromIndex >= prev.products.length || toIndex >= prev.products.length) return prev;
      const nextProducts = [...prev.products];
      const [movedItem] = nextProducts.splice(fromIndex, 1);
      nextProducts.splice(toIndex, 0, movedItem);

      let nextActiveIndex = prev.activeProductIndex;
      if (prev.activeProductIndex === fromIndex) {
        nextActiveIndex = toIndex;
      } else if (fromIndex < prev.activeProductIndex && toIndex >= prev.activeProductIndex) {
        nextActiveIndex--;
      } else if (fromIndex > prev.activeProductIndex && toIndex <= prev.activeProductIndex) {
        nextActiveIndex++;
      }

      const currentFormat = prev.format || '16:9';
      const tempCampaign: BannerCampaign = {
        ...prev,
        products: nextProducts,
        activeProductIndex: nextActiveIndex,
        _syncTimestamp: now,
      } as any;

      const nextFormatsData = syncCurrentFormatToFormatsData(prev.formatsData, currentFormat, tempCampaign);

      const nextCampaign: BannerCampaign = {
        ...tempCampaign,
        formatsData: nextFormatsData,
      };

      try {
        localStorage.setItem('playcomunique_campanha', JSON.stringify(nextCampaign));
      } catch (e) {}

      setClients((prevClients) => {
        const updatedClients = prevClients.map((c) =>
          c.name.toLowerCase() === prev.clientName.toLowerCase() || c.id === prev.clientId
            ? { ...c, products: nextProducts, formatsData: nextFormatsData }
            : c
        );
        try {
          localStorage.setItem('playcomunique_clientes', JSON.stringify(updatedClients));
        } catch (e) {}
        saveClientsToCloud(updatedClients).catch(() => {});
        return updatedClients;
      });

      saveCampaignToCloud(nextCampaign).then((ok) => {
        if (ok) {
          lastSavedTimestampRef.current = now;
          setCloudSyncStatus('saved');
        }
      }).catch(() => {});

      return nextCampaign;
    });
  };

  const handleRemoveProduct = (idx: number) => {
    lastLocalEditTimeRef.current = Date.now();
    const now = new Date().toISOString();
    setCampaign((prev) => {
      const removedProduct = prev.products[idx];
      if (removedProduct) {
        try {
          const lixeiraRaw = localStorage.getItem('playcomunique_lixeira_banners');
          const lixeira = lixeiraRaw ? JSON.parse(lixeiraRaw) : [];
          lixeira.unshift({
            product: removedProduct,
            clientName: prev.clientName,
            deletedAt: now,
          });
          localStorage.setItem('playcomunique_lixeira_banners', JSON.stringify(lixeira.slice(0, 50)));
        } catch (e) {
          console.warn('Erro ao salvar produto excluído na lixeira:', e);
        }
      }

      const next = prev.products.filter((_, i) => i !== idx);
      const nextIdx = Math.min(prev.activeProductIndex, Math.max(0, next.length - 1));
      const currentFormat = prev.format || '16:9';

      const tempCampaign: BannerCampaign = {
        ...prev,
        products: next,
        activeProductIndex: nextIdx,
        _syncTimestamp: now,
      } as any;

      const nextFormatsData = syncCurrentFormatToFormatsData(prev.formatsData, currentFormat, tempCampaign);

      const nextCampaign: BannerCampaign = {
        ...tempCampaign,
        formatsData: nextFormatsData,
      };

      try {
        localStorage.setItem('playcomunique_campanha', JSON.stringify(nextCampaign));
      } catch (e) {}

      setClients((prevClients) => {
        const updated = prevClients.map((c) =>
          c.name.toLowerCase() === prev.clientName.toLowerCase() || c.id === prev.clientId
            ? { ...c, products: next, formatsData: nextFormatsData }
            : c
        );
        try {
          localStorage.setItem('playcomunique_clientes', JSON.stringify(updated));
        } catch (e) {}
        saveClientsToCloud(updated).catch(() => {});
        return updated;
      });

      saveCampaignToCloud(nextCampaign).catch(() => {});
      return nextCampaign;
    });
  };

  const handleRestoreProduct = (productToRestore: ProductItem) => {
    lastLocalEditTimeRef.current = Date.now();
    const now = new Date().toISOString();
    setCampaign((prev) => {
      const nextProducts = [...prev.products, productToRestore];
      const currentFormat = prev.format || '16:9';

      const tempCampaign: BannerCampaign = {
        ...prev,
        products: nextProducts,
        activeProductIndex: nextProducts.length - 1,
        _syncTimestamp: now,
      } as any;

      const nextFormatsData = syncCurrentFormatToFormatsData(prev.formatsData, currentFormat, tempCampaign);

      const nextCampaign: BannerCampaign = {
        ...tempCampaign,
        formatsData: nextFormatsData,
      };

      try {
        localStorage.setItem('playcomunique_campanha', JSON.stringify(nextCampaign));
      } catch (e) {}

      setClients((prevClients) => {
        const updatedClients = prevClients.map((c) =>
          c.name.toLowerCase() === prev.clientName.toLowerCase() || c.id === prev.clientId
            ? { ...c, products: nextProducts, formatsData: nextFormatsData }
            : c
        );
        try {
          localStorage.setItem('playcomunique_clientes', JSON.stringify(updatedClients));
        } catch (e) {}
        saveClientsToCloud(updatedClients).catch(() => {});
        return updatedClients;
      });

      saveCampaignToCloud(nextCampaign).then((ok) => {
        if (ok) {
          lastSavedTimestampRef.current = now;
          setCloudSyncStatus('saved');
        }
      }).catch(() => {});

      return nextCampaign;
    });
  };

  const handleUpdateCampaign = (updated: Partial<BannerCampaign>) => {
    setCampaign((prev) => {
      const currentFormat = prev.format || '16:9';
      const tempMerged = { ...prev, ...updated };

      // Sincroniza as alterações no formatsData especificamente para o formato ativo
      const nextFormatsData = syncCurrentFormatToFormatsData(prev.formatsData, currentFormat, tempMerged);

      const next: BannerCampaign = {
        ...tempMerged,
        formatsData: nextFormatsData,
      };

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
                formatsData: nextFormatsData,
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

  const handleSelectProductIndex = (idx: number) => {
    setCampaign((prev) => {
      const currentFormat = prev.format || '16:9';
      const updatedFormats = prev.formatsData ? { ...prev.formatsData } : initFormatsData(prev);
      if (updatedFormats[currentFormat]) {
        updatedFormats[currentFormat] = {
          ...updatedFormats[currentFormat]!,
          activeProductIndex: idx,
        };
      }
      return {
        ...prev,
        activeProductIndex: idx,
        formatsData: updatedFormats,
      };
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
        {/* Visual Stage (Center / Main Left) - Auto-Scale Canvas responsivo sem scroll */}
        <div className={`flex-1 min-h-0 h-full flex flex-col items-center ${campaign.format === 'tabloid' ? 'justify-start overflow-y-auto p-2 sm:p-4' : 'justify-center overflow-hidden p-1 sm:p-2'} bg-neutral-950/60`}>


          {/* Conditional Preview: Tabloid or Banner */}
          {campaign.format === 'tabloid' ? (
            <VisualizadorTabloideOfertas 
              campaign={campaign} 
              theme={activeTheme} 
              currentProductIndex={campaign.activeProductIndex}
              onUpdateCampaign={handleUpdateCampaign}
              onSelectProductIndex={handleSelectProductIndex}
              onUpdateProduct={handleUpdateProduct}
              onReorderProduct={handleReorderProduct}
            />
          ) : (
            <VisualizadorBannerTV
              campaign={campaign}
              theme={activeTheme}
              currentProductIndex={campaign.activeProductIndex}
              onSelectProductIndex={handleSelectProductIndex}
              onReorderProduct={handleReorderProduct}
              onUpdateProductImage={(productId, newImageUrl) => {
                const targetIdx = campaign.products.findIndex((p) => p.id === productId);
                const idxToUpdate = targetIdx !== -1 ? targetIdx : campaign.activeProductIndex;
                handleUpdateProduct(idxToUpdate, { imageUrl: newImageUrl, imageDisplayMode: 'ambient' });
              }}
              onUpdateProductItem={(idx, updated) => handleUpdateProduct(idx, updated)}
            />
          )}
        </div>

        {/* Product & Campaign Management Sidebar */}
        <aside className="w-full lg:w-[350px] xl:w-[380px] 2xl:w-[420px] bg-neutral-900 border-t lg:border-t-0 lg:border-l border-neutral-800 flex flex-col shrink-0 lg:overflow-y-auto lg:h-full">
          <PainelEditorProdutos
            products={campaign.products}
            currentProductIndex={campaign.activeProductIndex}
            onSelectProductIndex={handleSelectProductIndex}
            onUpdateProduct={handleUpdateProduct}
            onAddProduct={handleAddProduct}
            onRemoveProduct={handleRemoveProduct}
            onRestoreProduct={handleRestoreProduct}
            onReorderProduct={handleReorderProduct}
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
        existingProductsCount={campaign.products?.length || 0}
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
        onSelectProductIndex={handleSelectProductIndex}
      />

      <ModalGestaoClientes
        isOpen={isThemeModalOpen}
        onClose={() => setIsThemeModalOpen(false)}
        clients={clients}
        activeClientName={campaign.clientName}
        activeThemeId={campaign.themeId}
        showClientLogo={campaign.showClientLogo !== false}
        onSelectClient={handleSelectClient}
        onSelectThemeOnly={(themeId) => handleUpdateCampaign({ themeId })}
        onSaveClient={handleSaveClient}
        onDeleteClient={handleDeleteClient}
        onToggleShowLogo={(show) => handleUpdateCampaign({ showClientLogo: show })}
        onOpenTvPlayer={() => setIsTvPlayerOpen(true)}
      />
    </div>
  );
}
