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
  loadClientCampaignFromCloud,
  saveCampaignToCloud,
  subscribeToCloudCampaign,
  loadClientsFromCloud,
  saveClientsToCloud,
  subscribeToCloudClients,
  saveProductImageToCloud,
  restoreCampaignData,
} from './services/cloudCampaignSync';
import {
  saveLocalImage,
  getLocalImage,
  saveLocalCampaign,
  getLocalCampaign,
  saveLocalClients,
  getLocalClients,
  safeSaveCampaignToLocalStorage,
  safeSaveClientsToLocalStorage,
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
  legalNotice: 'Imagens meramente ilustrativas; Proibido a venda de bebidas alcoólicas a menores de 18 anos!',
  footerBrandText: 'Desenvolvido por: playcomunique.com.br',
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
        let products: ProductItem[] = parsed.products || [];
        // Proteção contra perda acidental: se Belíssima tiver menos de 15 produtos, recupera o acervo de 22 produtos
        if ((parsed.clientName === 'Belíssima Casa di Frutas' || parsed.clientId === 'cli-belissima' || !parsed.clientId) && products.length < 15) {
          console.log('[Recuperação] Restaurando 22 produtos autênticos da Belíssima no carregamento inicial.');
          products = INITIAL_PRODUCTS;
        }

        // Garante que o telefone e endereço do cliente cadastrado estejam presentes
        let matchedClientPhone = '';
        let matchedClientAddress = '';
        try {
          const savedClientsRaw = localStorage.getItem('playcomunique_clientes');
          if (savedClientsRaw) {
            const savedClientsList = JSON.parse(savedClientsRaw);
            const cMatch = savedClientsList.find((c: any) => c.id === parsed.clientId || (c.name && parsed.clientName && c.name.toLowerCase() === parsed.clientName.toLowerCase()));
            if (cMatch) {
              matchedClientPhone = cMatch.phoneWhatsapp || '';
              matchedClientAddress = cMatch.storeAddress || '';
            }
          }
        } catch (_) {}

        const restored: BannerCampaign = {
          ...DEFAULT_CAMPAIGN,
          ...parsed,
          phoneWhatsapp: parsed.phoneWhatsapp || matchedClientPhone || '',
          storeAddress: parsed.storeAddress || matchedClientAddress || '',
          products,
          clientLogoUrl:
            parsed.clientLogoUrl ||
            (parsed.clientName === 'Belíssima Casa di Frutas' || parsed.id === 'camp-1'
              ? '/logos/belissima-casa-di-frutas.png'
              : ''),
          footerBrandText: (!parsed.footerBrandText || parsed.footerBrandText === 'ts.playcomunique.com.br' || parsed.footerBrandText === 'playcomunique.com.br')
            ? 'Desenvolvido por: playcomunique.com.br'
            : parsed.footerBrandText,
          legalNotice: (!parsed.legalNotice || parsed.legalNotice.includes('Proibida venda'))
            ? 'Imagens meramente ilustrativas; Proibido a venda de bebidas alcoólicas a menores de 18 anos!'
            : parsed.legalNotice,
        };
        if (!restored.formatsData || Object.keys(restored.formatsData).length === 0) {
          restored.formatsData = initFormatsData(restored);
        } else {
          // Garante que o formato ativo na inicialização tenha seus dados exclusivos aplicados
          const activeFmt = restored.format || '16:9';
          const fmtData = restored.formatsData[activeFmt];
          if (fmtData) {
            if (fmtData.campaignTitle !== undefined) restored.campaignTitle = fmtData.campaignTitle;
            if (fmtData.campaignSubtitle !== undefined) restored.campaignSubtitle = fmtData.campaignSubtitle;
            if (fmtData.validityText !== undefined) restored.validityText = fmtData.validityText;
            if (fmtData.legalNotice !== undefined && !fmtData.legalNotice.includes('Proibida venda')) {
              restored.legalNotice = fmtData.legalNotice;
            } else {
              restored.legalNotice = 'Imagens meramente ilustrativas; Proibido a venda de bebidas alcoólicas a menores de 18 anos!';
            }
            if (fmtData.footerBrandText !== undefined && fmtData.footerBrandText !== 'ts.playcomunique.com.br' && fmtData.footerBrandText !== 'playcomunique.com.br') {
              restored.footerBrandText = fmtData.footerBrandText;
            } else {
              restored.footerBrandText = 'Desenvolvido por: playcomunique.com.br';
            }
            if (fmtData.tickerText !== undefined) restored.tickerText = fmtData.tickerText;
            restored.phoneWhatsapp = fmtData.phoneWhatsapp || matchedClientPhone || restored.phoneWhatsapp || '';
            restored.storeAddress = fmtData.storeAddress || matchedClientAddress || restored.storeAddress || '';
            if (fmtData.themeId) restored.themeId = fmtData.themeId;
            if (fmtData.customStyles !== undefined) restored.customStyles = fmtData.customStyles;
          }
        }

        // Garante que todos os formatos tenham os contatos corretos e herdem imagens da lista mestre
        ALL_BANNER_FORMATS.forEach((fmt) => {
          if (restored.formatsData && restored.formatsData[fmt]) {
            if (!restored.formatsData[fmt]!.phoneWhatsapp && (matchedClientPhone || restored.phoneWhatsapp)) {
              restored.formatsData[fmt]!.phoneWhatsapp = matchedClientPhone || restored.phoneWhatsapp;
            }
            if (!restored.formatsData[fmt]!.storeAddress && (matchedClientAddress || restored.storeAddress)) {
              restored.formatsData[fmt]!.storeAddress = matchedClientAddress || restored.storeAddress;
            }
            if (Array.isArray(restored.formatsData[fmt]!.products)) {
              restored.formatsData[fmt]!.products = restored.products.map((mp, idx) => {
                const fp = restored.formatsData![fmt]!.products!.find((p) => p && p.id === mp.id) || restored.formatsData![fmt]!.products![idx];
                if (!fp || fp.id !== mp.id) return { ...mp };
                return {
                  ...mp,
                  ...fp,
                  imageUrl: (fp.imageUrl && !fp.imageUrl.startsWith('cloud-img:')) ? fp.imageUrl : mp.imageUrl,
                };
              });
            }
          }
        });

        return restored;
      }
    } catch (e) {
      console.error('Erro ao ler campanha do localStorage:', e);
    }
    return DEFAULT_CAMPAIGN;
  });

  // Saved clients list with local storage persistence and per-client banners
  const [clients, setClients] = useState<ClientProfile[]>(() => {
    try {
      const saved = localStorage.getItem('playcomunique_clientes');
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

  const [cloudSyncStatus, setCloudSyncStatus] = useState<'syncing' | 'saved' | 'idle'>('saved');
  const isRemoteUpdateRef = useRef<boolean>(false);
  const initialLoadDoneRef = useRef<boolean>(false);
  const lastSavedTimestampRef = useRef<string>('');
  const lastSavedIdRef = useRef<string>('');
  const lastLocalEditTimeRef = useRef<number>(0);
  const hasUnsavedChangesRef = useRef<boolean>(false);
  const tabIdRef = useRef<string>(Math.random().toString(36).substring(2, 9));
  const campaignRef = useRef<BannerCampaign>(campaign);
  const clientsRef = useRef<ClientProfile[]>(clients);

  useEffect(() => {
    campaignRef.current = campaign;
  }, [campaign]);

  useEffect(() => {
    clientsRef.current = clients;
  }, [clients]);

  // Sincronização instantânea entre abas no mesmo navegador (0ms de latência)
  useEffect(() => {
    if (typeof BroadcastChannel === 'undefined') return;
    const channel = new BroadcastChannel('playcomunique_sync_channel');

    channel.onmessage = (event) => {
      if (!event.data || event.data.senderTabId === tabIdRef.current) return;
      if (event.data.type === 'SYNC_CAMPAIGN' && event.data.campaign) {
        isRemoteUpdateRef.current = true;
        setCampaign(event.data.campaign);
        safeSaveCampaignToLocalStorage(event.data.campaign);
      }
      if (event.data.type === 'SYNC_CLIENTS' && event.data.clients) {
        setClients(event.data.clients);
        safeSaveClientsToLocalStorage(event.data.clients);
      }
    };

    return () => {
      channel.close();
    };
  }, []);

  // Proteção ao fechar/recarregar aba: se houver edição pendente no debounce, força disparo imediato
  useEffect(() => {
    const flushPendingChanges = () => {
      if (hasUnsavedChangesRef.current && initialLoadDoneRef.current) {
        hasUnsavedChangesRef.current = false;
        const currentCamp = campaignRef.current;
        const currentCli = clientsRef.current;
        saveLocalCampaign(currentCamp).catch(() => {});
        safeSaveCampaignToLocalStorage(currentCamp);
        saveCampaignToCloud(currentCamp).catch(() => {});
        saveLocalClients(currentCli).catch(() => {});
        safeSaveClientsToLocalStorage(currentCli);
        saveClientsToCloud(currentCli).catch(() => {});
      }
    };
    window.addEventListener('beforeunload', flushPendingChanges);
    window.addEventListener('pagehide', flushPendingChanges);
    return () => {
      window.removeEventListener('beforeunload', flushPendingChanges);
      window.removeEventListener('pagehide', flushPendingChanges);
    };
  }, []);

  // 1. Carregamento inicial da Nuvem (Firebase Firestore) + Restauração de Imagens
  useEffect(() => {
    let isMounted = true;

    // Restaura imediatamente eventuais ponteiros cloud-img do estado inicial local
    restoreCampaignData(campaignRef.current).then((restoredLocal) => {
      if (isMounted && !initialLoadDoneRef.current) {
        isRemoteUpdateRef.current = true;
        setCampaign(restoredLocal);
      }
    }).catch(() => {});

    (async () => {
      setCloudSyncStatus('syncing');
      const [cloudCampaign, cloudClients] = await Promise.all([
        loadCampaignFromCloud(),
        loadClientsFromCloud(),
      ]);

      if (!isMounted) return;

      let resolvedCampaign: BannerCampaign | null = null;

      if (cloudCampaign) {
        setCampaign((prev) => {
          // Se o usuário já começou a editar localmente após abrir a página, ou se o cache local deste mesmo cliente é mais novo, preserva local e sobe pra nuvem
          const localTs = (prev as any)._syncTimestamp || '';
          const remoteTs = (cloudCampaign as any)._syncTimestamp || '';
          if (
            lastLocalEditTimeRef.current > 0 ||
            (prev.clientId === cloudCampaign.clientId && localTs && remoteTs && new Date(localTs).getTime() > new Date(remoteTs).getTime())
          ) {
            resolvedCampaign = prev;
            saveCampaignToCloud(prev).catch(() => {});
            return prev;
          }

          const remoteProducts = cloudCampaign.products || [];
          const localProducts = prev.products || [];
          const finalProducts = remoteProducts.length > 0 ? remoteProducts : localProducts;

          // Busca perfil do cliente para garantir contatos completos
          let clientPhone = '';
          let clientAddress = '';
          const sourceClients = cloudClients && cloudClients.length > 0 ? cloudClients : clientsRef.current;
          const matchedClient = sourceClients.find(
            (c) =>
              c.id === (cloudCampaign.clientId || prev.clientId) ||
              c.name.toLowerCase() === (cloudCampaign.clientName || prev.clientName).toLowerCase()
          );
          if (matchedClient) {
            clientPhone = matchedClient.phoneWhatsapp || '';
            clientAddress = matchedClient.storeAddress || '';
          }

          const finalPhone = cloudCampaign.phoneWhatsapp || prev.phoneWhatsapp || clientPhone || '';
          const finalAddress = cloudCampaign.storeAddress || prev.storeAddress || clientAddress || '';

          isRemoteUpdateRef.current = true;
          if ((cloudCampaign as any)._syncTimestamp) {
            lastSavedTimestampRef.current = (cloudCampaign as any)._syncTimestamp;
          }

          let finalLogo = cloudCampaign.clientLogoUrl || prev.clientLogoUrl || '';
          if (
            prev.clientLogoUrl &&
            !prev.clientLogoUrl.startsWith('/logos/belissima') &&
            !prev.clientLogoUrl.startsWith('cloud-img:') &&
            (!cloudCampaign.clientLogoUrl || cloudCampaign.clientLogoUrl.startsWith('/logos/belissima'))
          ) {
            finalLogo = prev.clientLogoUrl;
          } else if (
            !finalLogo &&
            (cloudCampaign.clientName === 'Belíssima Casa di Frutas' || cloudCampaign.id === 'camp-1')
          ) {
            finalLogo = '/logos/belissima-casa-di-frutas.png';
          }

          const targetFormat = cloudCampaign.format || prev.format || '16:9';
          const formatsData =
            cloudCampaign.formatsData && Object.keys(cloudCampaign.formatsData).length > 0
              ? cloudCampaign.formatsData
              : prev.formatsData && Object.keys(prev.formatsData).length > 0
              ? prev.formatsData
              : initFormatsData(cloudCampaign);

          ALL_BANNER_FORMATS.forEach((fmt) => {
            if (formatsData[fmt]) {
              if (!formatsData[fmt]!.phoneWhatsapp && finalPhone) formatsData[fmt]!.phoneWhatsapp = finalPhone;
              if (!formatsData[fmt]!.storeAddress && finalAddress) formatsData[fmt]!.storeAddress = finalAddress;
              formatsData[fmt]!.products = finalProducts.map((mp, idx) => {
                if (fmt === '16:9') return { ...mp };
                const fp = formatsData[fmt]!.products?.find((p) => p && p.id === mp.id) || formatsData[fmt]!.products?.[idx];
                if (!fp || fp.id !== mp.id) return { ...mp };
                return {
                  ...mp,
                  ...fp,
                  imageUrl: fp.imageUrl && !fp.imageUrl.startsWith('cloud-img:') ? fp.imageUrl : mp.imageUrl,
                };
              });
            }
          });

          const activeFormatData = formatsData[targetFormat] || extractFormatData(cloudCampaign);

          const mergedCampaign: BannerCampaign = {
            ...prev,
            ...cloudCampaign,
            format: targetFormat,
            phoneWhatsapp: finalPhone,
            storeAddress: finalAddress,
            campaignTitle: activeFormatData.campaignTitle !== undefined ? activeFormatData.campaignTitle : cloudCampaign.campaignTitle,
            campaignSubtitle: activeFormatData.campaignSubtitle !== undefined ? activeFormatData.campaignSubtitle : cloudCampaign.campaignSubtitle,
            validityText: activeFormatData.validityText !== undefined ? activeFormatData.validityText : cloudCampaign.validityText,
            customStyles: activeFormatData.customStyles
              ? JSON.parse(JSON.stringify(activeFormatData.customStyles))
              : cloudCampaign.customStyles || prev.customStyles,
            products: finalProducts,
            clientLogoUrl: finalLogo,
            formatsData,
          };

          resolvedCampaign = mergedCampaign;
          safeSaveCampaignToLocalStorage(mergedCampaign);
          saveLocalCampaign(mergedCampaign).catch(() => {});
          return mergedCampaign;
        });
      }

      // Sincroniza a lista de clientes garantindo que o cliente ativo tenha exatamente os mesmos produtos da campanha ativa
      if (cloudClients && cloudClients.length > 0 && isMounted) {
        setClients((prev) => {
          const activeCamp = resolvedCampaign || campaignRef.current;
          const mergedCloud = cloudClients.map((cc) => {
            const lc = prev.find((p) => p.id === cc.id || p.name.toLowerCase() === cc.name.toLowerCase());
            const isActiveClient =
              activeCamp &&
              (cc.id === activeCamp.clientId || cc.name.toLowerCase() === activeCamp.clientName.toLowerCase());

            let finalLogo = cc.logoUrl || lc?.logoUrl || '';
            if (
              lc?.logoUrl &&
              !lc.logoUrl.startsWith('/logos/belissima') &&
              !lc.logoUrl.startsWith('cloud-img:') &&
              (!cc.logoUrl || cc.logoUrl.startsWith('/logos/belissima'))
            ) {
              finalLogo = lc.logoUrl;
            }

            // Se este for o cliente ativo na campanha, garante sincronia total com os produtos e formatos da campanha ativa
            const finalProducts =
              isActiveClient && activeCamp.products && activeCamp.products.length > 0
                ? activeCamp.products
                : cc.products && cc.products.length > 0
                ? cc.products
                : lc?.products || [];

            const finalFormats =
              isActiveClient && activeCamp.formatsData
                ? activeCamp.formatsData
                : cc.formatsData || lc?.formatsData;

            const finalPhone = cc.phoneWhatsapp || lc?.phoneWhatsapp || (isActiveClient ? activeCamp.phoneWhatsapp : '') || '';
            const finalAddress = cc.storeAddress || lc?.storeAddress || (isActiveClient ? activeCamp.storeAddress : '') || '';
            const finalCustomStyles = (isActiveClient ? activeCamp.customStyles : undefined) || cc.customStyles || lc?.customStyles;

            return {
              ...(lc || {}),
              ...cc,
              phoneWhatsapp: finalPhone,
              storeAddress: finalAddress,
              products: finalProducts,
              formatsData: finalFormats,
              customStyles: finalCustomStyles,
              logoUrl: finalLogo,
            };
          });

          const localOnlyClients = prev.filter(
            (lc) => !cloudClients.some((cc) => cc.id === lc.id || cc.name.toLowerCase() === lc.name.toLowerCase())
          );

          const finalClients = [...mergedCloud, ...localOnlyClients];
          safeSaveClientsToLocalStorage(finalClients);
          saveLocalClients(finalClients).catch(() => {});
          return finalClients;
        });
      }

      initialLoadDoneRef.current = true;
      setCloudSyncStatus('saved');
    })();

    // Ouve alterações em tempo real do Firestore (para múltiplos computadores, navegadores e TVs sincronizarem instantaneamente)
    const unsubscribe = subscribeToCloudCampaign((updatedCampaign) => {
      if (!isMounted || !updatedCampaign) return;
      const remoteTimestamp = (updatedCampaign as any)._syncTimestamp;
      const remoteSaveId = (updatedCampaign as any)._lastSaveId;
      const remoteSenderTabId = (updatedCampaign as any)._senderTabId;

      // 1. Ignora eco de alterações geradas nesta mesma aba/sessão
      if (remoteSaveId && remoteSaveId === lastSavedIdRef.current) return;
      if (remoteSenderTabId && remoteSenderTabId === tabIdRef.current) return;
      if (remoteTimestamp && remoteTimestamp === lastSavedTimestampRef.current) return;

      // 2. Proteção de digitação e edição local ativa (4 segundos)
      if (Date.now() - lastLocalEditTimeRef.current < 4000 || hasUnsavedChangesRef.current) {
        return;
      }

      if (remoteTimestamp) lastSavedTimestampRef.current = remoteTimestamp;
      if (remoteSaveId) lastSavedIdRef.current = remoteSaveId;
      isRemoteUpdateRef.current = true;

      setCampaign((prev) => {
        const localTs = (prev as any)._syncTimestamp || '';
        if (lastLocalEditTimeRef.current > 0 && localTs && remoteTimestamp && new Date(localTs).getTime() > new Date(remoteTimestamp).getTime()) {
          return prev;
        }

        const targetFormat = updatedCampaign.format || prev.format || '16:9';
        const formatsData =
          updatedCampaign.formatsData && Object.keys(updatedCampaign.formatsData).length > 0
            ? updatedCampaign.formatsData
            : prev.formatsData && Object.keys(prev.formatsData).length > 0
            ? prev.formatsData
            : initFormatsData(updatedCampaign);

        const activeFormatData = formatsData[targetFormat] || extractFormatData(updatedCampaign);
        const finalPhone = updatedCampaign.phoneWhatsapp || prev.phoneWhatsapp || '';
        const finalAddress = updatedCampaign.storeAddress || prev.storeAddress || '';

        const remoteProducts = updatedCampaign.products && updatedCampaign.products.length > 0 ? updatedCampaign.products : [];
        const localProducts = prev.products || [];

        // Usa a lista remota como fonte da verdade (permitindo adições, edições e exclusões entre navegadores),
        // preservando apenas imagem base64 local se o mesmo ID vier com cloud-img não resolvido
        const finalProducts =
          remoteProducts.length > 0
            ? remoteProducts.map((rp) => {
                const lp = localProducts.find((p) => p.id === rp.id);
                if (!lp) return rp;
                const bestImage =
                  rp.imageUrl && !rp.imageUrl.startsWith('cloud-img:')
                    ? rp.imageUrl
                    : lp.imageUrl && !lp.imageUrl.startsWith('cloud-img:')
                    ? lp.imageUrl
                    : rp.imageUrl || lp.imageUrl || '';
                return {
                  ...rp,
                  imageUrl: bestImage,
                };
              })
            : localProducts;

        ALL_BANNER_FORMATS.forEach((fmt) => {
          if (formatsData[fmt]) {
            if (!formatsData[fmt]!.phoneWhatsapp && finalPhone) formatsData[fmt]!.phoneWhatsapp = finalPhone;
            if (!formatsData[fmt]!.storeAddress && finalAddress) formatsData[fmt]!.storeAddress = finalAddress;
            formatsData[fmt]!.products = finalProducts.map((mp, idx) => {
              if (fmt === '16:9') return { ...mp };
              const fp = formatsData[fmt]!.products?.find((p) => p && p.id === mp.id) || formatsData[fmt]!.products?.[idx];
              if (!fp || fp.id !== mp.id) return { ...mp };
              return {
                ...mp,
                ...fp,
                imageUrl: fp.imageUrl && !fp.imageUrl.startsWith('cloud-img:') ? fp.imageUrl : mp.imageUrl,
              };
            });
          }
        });

        const nextSynced: BannerCampaign = {
          ...prev,
          ...updatedCampaign,
          format: targetFormat,
          phoneWhatsapp: finalPhone,
          storeAddress: finalAddress,
          campaignTitle: activeFormatData.campaignTitle !== undefined ? activeFormatData.campaignTitle : updatedCampaign.campaignTitle,
          campaignSubtitle: activeFormatData.campaignSubtitle !== undefined ? activeFormatData.campaignSubtitle : updatedCampaign.campaignSubtitle,
          validityText: activeFormatData.validityText !== undefined ? activeFormatData.validityText : updatedCampaign.validityText,
          customStyles: activeFormatData.customStyles
            ? JSON.parse(JSON.stringify(activeFormatData.customStyles))
            : updatedCampaign.customStyles || prev.customStyles,
          products: finalProducts,
          formatsData,
        };

        safeSaveCampaignToLocalStorage(nextSynced);
        saveLocalCampaign(nextSynced).catch(() => {});

        // Atualiza simultaneamente o cliente correspondente na lista de clientes
        setClients((prevClients) => {
          const updatedCli = prevClients.map((c) =>
            c.id === nextSynced.clientId || c.name.toLowerCase() === nextSynced.clientName.toLowerCase()
              ? {
                  ...c,
                  products: finalProducts,
                  formatsData,
                  campaignTitle: nextSynced.campaignTitle,
                  validityText: nextSynced.validityText,
                  customStyles: nextSynced.customStyles,
                }
              : c
          );
          safeSaveClientsToLocalStorage(updatedCli);
          return updatedCli;
        });

        return nextSynced;
      });
    });

    // Ouve alterações de clientes em tempo real no Firestore
    const unsubscribeClients = subscribeToCloudClients((remoteClients) => {
      if (!isMounted || !remoteClients || remoteClients.length === 0) return;
      if (Date.now() - lastLocalEditTimeRef.current < 4000 || hasUnsavedChangesRef.current) return;

      setClients((prevClients) => {
        const activeCamp = campaignRef.current;
        const merged = remoteClients.map((rc) => {
          const isCurrentActive =
            activeCamp &&
            (rc.id === activeCamp.clientId || rc.name.toLowerCase() === activeCamp.clientName.toLowerCase());
          if (isCurrentActive && activeCamp.products && activeCamp.products.length > 0) {
            return {
              ...rc,
              products: activeCamp.products,
              formatsData: activeCamp.formatsData || rc.formatsData,
            };
          }
          return rc;
        });
        safeSaveClientsToLocalStorage(merged);
        return merged;
      });
    });

    return () => {
      isMounted = false;
      unsubscribe();
      unsubscribeClients();
    };
  }, []);

  // 2. Persistência contínua e imediata na Nuvem (Firebase) + Backup Local
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

    // Indica IMEDIATAMENTE na barra superior que há salvamento em andamento
    setCloudSyncStatus('syncing');
    hasUnsavedChangesRef.current = true;

    const timer = setTimeout(() => {
      const now = new Date().toISOString();
      const saveId = Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6);
      lastSavedTimestampRef.current = now;
      lastSavedIdRef.current = saveId;

      const campaignToSave = {
        ...campaign,
        _syncTimestamp: now,
        _lastSaveId: saveId,
        _senderTabId: tabIdRef.current,
      };

      safeSaveCampaignToLocalStorage(campaignToSave);
      saveLocalCampaign(campaignToSave).catch(() => {});

      saveCampaignToCloud(campaignToSave as any)
        .then((ok) => {
          if (ok) {
            hasUnsavedChangesRef.current = false;
            setCloudSyncStatus('saved');
          } else {
            // Retry automático em caso de oscilação de rede
            setTimeout(() => {
              saveCampaignToCloud(campaignRef.current as any).then((retryOk) => {
                hasUnsavedChangesRef.current = false;
                setCloudSyncStatus(retryOk ? 'saved' : 'idle');
              });
            }, 1500);
          }
        })
        .catch(() => {
          setCloudSyncStatus('idle');
        });

      if (typeof BroadcastChannel !== 'undefined') {
        try {
          const ch = new BroadcastChannel('playcomunique_sync_channel');
          ch.postMessage({ type: 'SYNC_CAMPAIGN', campaign: campaignToSave, senderTabId: tabIdRef.current });
          ch.close();
        } catch (_) {}
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [campaign]);

  // 3. Sincronização rápida da lista de clientes no Firestore (600ms)
  useEffect(() => {
    if (isDirectTvMode || !initialLoadDoneRef.current) return;
    const timer = setTimeout(() => {
      saveClientsToCloud(clients).catch(() => {});
      if (typeof BroadcastChannel !== 'undefined') {
        try {
          const ch = new BroadcastChannel('playcomunique_sync_channel');
          ch.postMessage({ type: 'SYNC_CLIENTS', clients, senderTabId: tabIdRef.current });
          ch.close();
        } catch (_) {}
      }
    }, 600);
    return () => clearTimeout(timer);
  }, [clients]);

  // Força sincronização imediata com a Nuvem (Firestore) ao clicar no botão Nuvem Salva
  const handleForceCloudSync = async () => {
    setCloudSyncStatus('syncing');
    try {
      // Se houver alterações locais pendentes, envia primeiro para a nuvem
      if (hasUnsavedChangesRef.current) {
        await saveCampaignToCloud(campaignRef.current);
        await saveClientsToCloud(clientsRef.current);
        hasUnsavedChangesRef.current = false;
      }

      const cloudCampaign = await loadCampaignFromCloud();
      if (cloudCampaign) {
        const targetFormat = cloudCampaign.format || campaign.format || '16:9';
        const formatsData =
          cloudCampaign.formatsData && Object.keys(cloudCampaign.formatsData).length > 0
            ? cloudCampaign.formatsData
            : initFormatsData(cloudCampaign);
        const activeFormatData = formatsData[targetFormat] || extractFormatData(cloudCampaign);
        const masterProducts =
          cloudCampaign.products && cloudCampaign.products.length > 0 ? cloudCampaign.products : campaign.products;

        ALL_BANNER_FORMATS.forEach((fmt) => {
          if (formatsData[fmt]) {
            formatsData[fmt]!.products = masterProducts.map((mp, idx) => {
              if (fmt === '16:9') return { ...mp };
              const fp = formatsData[fmt]!.products?.find((p) => p && p.id === mp.id) || formatsData[fmt]!.products?.[idx];
              if (!fp || fp.id !== mp.id) return { ...mp };
              return {
                ...mp,
                ...fp,
                imageUrl: fp.imageUrl && !fp.imageUrl.startsWith('cloud-img:') ? fp.imageUrl : mp.imageUrl,
              };
            });
          }
        });

        const updated: BannerCampaign = {
          ...campaign,
          ...cloudCampaign,
          format: targetFormat,
          campaignTitle: activeFormatData.campaignTitle !== undefined ? activeFormatData.campaignTitle : cloudCampaign.campaignTitle,
          campaignSubtitle: activeFormatData.campaignSubtitle !== undefined ? activeFormatData.campaignSubtitle : cloudCampaign.campaignSubtitle,
          validityText: activeFormatData.validityText !== undefined ? activeFormatData.validityText : cloudCampaign.validityText,
          customStyles: activeFormatData.customStyles
            ? JSON.parse(JSON.stringify(activeFormatData.customStyles))
            : cloudCampaign.customStyles || campaign.customStyles,
          products: masterProducts,
          formatsData,
        };
        isRemoteUpdateRef.current = true;
        setCampaign(updated);
        safeSaveCampaignToLocalStorage(updated);
      }

      const cloudClients = await loadClientsFromCloud();
      if (cloudClients && cloudClients.length > 0) {
        setClients(cloudClients);
        safeSaveClientsToLocalStorage(cloudClients);
      }
      setCloudSyncStatus('saved');
    } catch (e) {
      console.error('Erro ao forçar sincronização da Nuvem:', e);
      setCloudSyncStatus('idle');
    }
  };


  const handleSaveClient = (newOrUpdatedClient: ClientProfile) => {
    lastLocalEditTimeRef.current = Date.now();
    // 1. Salva imediatamente o logotipo no IndexedDB e em documento dedicado do Firestore
    if (newOrUpdatedClient.logoUrl) {
      saveLocalImage(`logo_${newOrUpdatedClient.id}`, newOrUpdatedClient.logoUrl).catch(() => {});
      saveProductImageToCloud(`logo_${newOrUpdatedClient.id}`, newOrUpdatedClient.logoUrl).catch(() => {});
    }

    setClients((prev) => {
      const exists = prev.some((c) => c.id === newOrUpdatedClient.id);
      let updated: ClientProfile[];
      if (exists) {
        updated = prev.map((c) => {
          if (c.id === newOrUpdatedClient.id) {
            const clientFormats = c.formatsData ? { ...c.formatsData } : undefined;
            if (clientFormats) {
              ALL_BANNER_FORMATS.forEach((fmt) => {
                if (clientFormats[fmt]) {
                  clientFormats[fmt] = {
                    ...clientFormats[fmt]!,
                    phoneWhatsapp: newOrUpdatedClient.phoneWhatsapp || '',
                    storeAddress: newOrUpdatedClient.storeAddress || '',
                    legalNotice: newOrUpdatedClient.legalNotice || 'Imagens meramente ilustrativas; Proibido a venda de bebidas alcoólicas a menores de 18 anos!',
                    footerBrandText: newOrUpdatedClient.footerBrandText || 'Desenvolvido por: playcomunique.com.br',
                  };
                }
              });
            }
            return {
              ...c,
              ...newOrUpdatedClient,
              phoneWhatsapp: newOrUpdatedClient.phoneWhatsapp || '',
              storeAddress: newOrUpdatedClient.storeAddress || '',
              formatsData: clientFormats || newOrUpdatedClient.formatsData,
            };
          }
          return c;
        });
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
      safeSaveClientsToLocalStorage(updated);
      try {
        localStorage.setItem('playcomunique_last_local_edit_time', String(Date.now()));
      } catch (_) {}
      saveLocalClients(updated).catch(() => {});
      saveClientsToCloud(updated).catch(() => {});
      return updated;
    });

    // Se o cliente editado for o ativo no banner, sincroniza imediatamente
    if (campaign.clientName.toLowerCase() === newOrUpdatedClient.name.toLowerCase() || campaign.clientId === newOrUpdatedClient.id) {
      setCampaign((prev) => {
        const now = new Date().toISOString();
        const updatedFormats = prev.formatsData ? { ...prev.formatsData } : initFormatsData(prev);
        ALL_BANNER_FORMATS.forEach((fmt) => {
          if (updatedFormats[fmt]) {
            updatedFormats[fmt] = {
              ...updatedFormats[fmt]!,
              phoneWhatsapp: newOrUpdatedClient.phoneWhatsapp || '',
              storeAddress: newOrUpdatedClient.storeAddress || '',
              legalNotice: newOrUpdatedClient.legalNotice || 'Imagens meramente ilustrativas; Proibido a venda de bebidas alcoólicas a menores de 18 anos!',
              footerBrandText: newOrUpdatedClient.footerBrandText || 'Desenvolvido por: playcomunique.com.br',
            };
          }
        });

        const nextCamp: BannerCampaign = {
          ...prev,
          clientId: newOrUpdatedClient.id,
          clientName: newOrUpdatedClient.name,
          clientLogoUrl: newOrUpdatedClient.logoUrl,
          showClientLogo: Boolean(newOrUpdatedClient.logoUrl),
          themeId: newOrUpdatedClient.themeId,
          segment: newOrUpdatedClient.segment,
          tickerText: newOrUpdatedClient.defaultTickerText !== undefined ? newOrUpdatedClient.defaultTickerText : prev.tickerText,
          phoneWhatsapp: newOrUpdatedClient.phoneWhatsapp || '',
          storeAddress: newOrUpdatedClient.storeAddress || '',
          legalNotice: newOrUpdatedClient.legalNotice || 'Imagens meramente ilustrativas; Proibido a venda de bebidas alcoólicas a menores de 18 anos!',
          footerBrandText: newOrUpdatedClient.footerBrandText || 'Desenvolvido por: playcomunique.com.br',
          formatsData: updatedFormats,
          _syncTimestamp: now,
        };
        safeSaveCampaignToLocalStorage(nextCamp);
        try {
          localStorage.setItem('playcomunique_last_local_edit_time', String(Date.now()));
        } catch (_) {}
        saveLocalCampaign(nextCamp).catch(() => {});
        setCloudSyncStatus('syncing');
        saveCampaignToCloud(nextCamp).then((ok) => {
          if (ok) {
            lastSavedTimestampRef.current = now;
            setCloudSyncStatus('saved');
          }
        }).catch(() => {});
        return nextCamp;
      });
    }
  };

  const handleDeleteClient = (clientId: string) => {
    lastLocalEditTimeRef.current = Date.now();
    setClients((prev) => {
      const clientToTrash = prev.find((c) => c.id === clientId);
      if (clientToTrash) {
        try {
          const raw = localStorage.getItem('playcomunique_lixeira_clientes');
          const trash: any[] = raw ? JSON.parse(raw) : [];
          if (!trash.some((t: any) => t.client?.id === clientId)) {
            trash.unshift({
              client: clientToTrash,
              deletedAt: new Date().toISOString(),
            });
            localStorage.setItem('playcomunique_lixeira_clientes', JSON.stringify(trash.slice(0, 50)));
          }
        } catch (e) {}
      }

      const updated = prev.filter((c) => c.id !== clientId);
      safeSaveClientsToLocalStorage(updated);
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
    lastLocalEditTimeRef.current = Date.now();
    // 1. Salva os banners atuais no perfil do cliente anterior (local e nuvem)
    const currentCampaignSnapshot = campaignRef.current;
    saveLocalCampaign(currentCampaignSnapshot).catch(() => {});
    saveCampaignToCloud(currentCampaignSnapshot).catch(() => {});

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
      safeSaveClientsToLocalStorage(updated);
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
      let nextFormats = target.formatsData ? JSON.parse(JSON.stringify(target.formatsData)) : undefined;
      const initialTargetCampaign: BannerCampaign = {
        ...prev,
        clientId: client.id,
        clientName: client.name,
        clientLogoUrl: client.logoUrl || '',
        showClientLogo: Boolean(client.logoUrl),
        themeId: client.themeId,
        segment: client.segment,
        footerBrandText: client.footerBrandText || target.footerBrandText || 'Desenvolvido por: playcomunique.com.br',
        legalNotice: client.legalNotice || target.legalNotice || 'Imagens meramente ilustrativas; Proibido a venda de bebidas alcoólicas a menores de 18 anos!',
        tickerText: client.defaultTickerText !== undefined ? client.defaultTickerText : (target.defaultTickerText || prev.tickerText),
        phoneWhatsapp: client.phoneWhatsapp !== undefined ? client.phoneWhatsapp : (target.phoneWhatsapp || ''),
        storeAddress: client.storeAddress !== undefined ? client.storeAddress : (target.storeAddress || ''),
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

      // Propaga telefone, endereço e reconcilia produtos/imagens em todos os formatos salvos
      ALL_BANNER_FORMATS.forEach((fmt) => {
        if (nextFormats[fmt]) {
          let fmtProducts: ProductItem[] = nextFormats[fmt]!.products && nextFormats[fmt]!.products.length > 0
            ? [...nextFormats[fmt]!.products]
            : [...targetProducts];

          if (targetProducts.length > fmtProducts.length) {
            const existingIds = new Set(fmtProducts.map((p) => p.id));
            for (let i = 0; i < targetProducts.length; i++) {
              const tp = targetProducts[i];
              if (tp && !existingIds.has(tp.id)) {
                fmtProducts.push({ ...tp, customizedFields: [] });
              }
            }
          }

          fmtProducts = fmtProducts.map((fp, idx) => {
            if (!fp.imageUrl) {
              const match = targetProducts.find((tp) => tp.id === fp.id) || targetProducts[idx];
              if (match?.imageUrl) {
                return { ...fp, imageUrl: match.imageUrl };
              }
            }
            return fp;
          });

          nextFormats[fmt] = {
            ...nextFormats[fmt]!,
            products: fmtProducts,
            phoneWhatsapp: client.phoneWhatsapp || target.phoneWhatsapp || nextFormats[fmt]!.phoneWhatsapp || '',
            storeAddress: client.storeAddress || target.storeAddress || nextFormats[fmt]!.storeAddress || '',
            legalNotice: client.legalNotice || target.legalNotice || nextFormats[fmt]!.legalNotice || '',
            footerBrandText: client.footerBrandText || target.footerBrandText || nextFormats[fmt]!.footerBrandText || 'Desenvolvido por: playcomunique.com.br',
          };
        }
      });

      // Se o formato atual já tiver customizações salvas para este cliente, aplica-as
      const currentFmtData = nextFormats[prev.format];
      const activeProducts = currentFmtData?.products && currentFmtData.products.length > 0
        ? currentFmtData.products
        : targetProducts;

      const now = new Date().toISOString();
      const nextCampaign: BannerCampaign = {
        ...initialTargetCampaign,
        _syncTimestamp: now,
        campaignTitle: currentFmtData?.campaignTitle || initialTargetCampaign.campaignTitle,
        campaignSubtitle: currentFmtData?.campaignSubtitle || initialTargetCampaign.campaignSubtitle,
        validityText: currentFmtData?.validityText || initialTargetCampaign.validityText,
        legalNotice: client.legalNotice || target.legalNotice || (currentFmtData?.legalNotice || initialTargetCampaign.legalNotice),
        footerBrandText: client.footerBrandText || target.footerBrandText || (currentFmtData?.footerBrandText || initialTargetCampaign.footerBrandText),
        phoneWhatsapp: client.phoneWhatsapp || target.phoneWhatsapp || (currentFmtData?.phoneWhatsapp || initialTargetCampaign.phoneWhatsapp || ''),
        storeAddress: client.storeAddress || target.storeAddress || (currentFmtData?.storeAddress || initialTargetCampaign.storeAddress || ''),
        products: activeProducts,
        customStyles: currentFmtData?.customStyles || initialTargetCampaign.customStyles,
        formatsData: nextFormats,
      };

      safeSaveCampaignToLocalStorage(nextCampaign);
      try {
        localStorage.setItem('playcomunique_active_client_id', client.id);
        localStorage.setItem('playcomunique_last_local_edit_time', String(Date.now()));
      } catch (e) {}

      saveLocalCampaign(nextCampaign).catch(() => {});
      setCloudSyncStatus('syncing');
      saveCampaignToCloud(nextCampaign).then((ok) => {
        if (ok) {
          lastSavedTimestampRef.current = now;
          setCloudSyncStatus('saved');
        }
      }).catch(() => {});
      return nextCampaign;
    });

    // 4. Verifica no Firestore se há uma campanha dedicada mais recente para este cliente (ex: salva em outro PC)
    loadClientCampaignFromCloud(client.id).then((cloudClientCamp) => {
      if (cloudClientCamp && cloudClientCamp.products && cloudClientCamp.products.length > 0) {
        setCampaign((curr) => {
          if (curr.clientId !== client.id) return curr;
          // Se a nuvem tiver mais produtos ou um timestamp mais recente do que o que estava em clients[], aplica!
          if (cloudClientCamp.products.length > curr.products.length) {
            safeSaveCampaignToLocalStorage(cloudClientCamp);
            saveLocalCampaign(cloudClientCamp).catch(() => {});
            return cloudClientCamp;
          }
          return curr;
        });
      }
    }).catch(() => {});
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
    lastLocalEditTimeRef.current = Date.now();
    const now = new Date().toISOString();
    setCampaign((prev) => {
      if (prev.format === fmt) return prev;

      // 1. Salva o estado atual do formato que está saindo
      const currentFormat = prev.format || '16:9';
      const updatedFormats = syncCurrentFormatToFormatsData(prev.formatsData, currentFormat, prev);

      // 2. Obtém os dados do novo formato de destino
      const targetFormatData = updatedFormats[fmt] || extractFormatData(prev);

      // Obtém os produtos salvos no formato de destino. Se ainda não existirem produtos nele, herda do 16:9 Mestre
      const resolvedProducts = targetFormatData.products && targetFormatData.products.length > 0
        ? JSON.parse(JSON.stringify(targetFormatData.products))
        : (updatedFormats['16:9']?.products ? JSON.parse(JSON.stringify(updatedFormats['16:9'].products)) : prev.products);

      // Garante que todo produto herde a imagem do 16:9 Mestre se o formato tiver a imagem em branco (otimização de peso)
      resolvedProducts.forEach((p: ProductItem, idx: number) => {
        if (!p.imageUrl) {
          const fallback = updatedFormats['16:9']?.products?.[idx]?.imageUrl || prev.products?.[idx]?.imageUrl || '';
          if (fallback) p.imageUrl = fallback;
        }
      });

      const activeClient = clients.find((c) => c.id === prev.clientId || c.name.toLowerCase() === prev.clientName.toLowerCase());
      const resolvedPhone = targetFormatData.phoneWhatsapp || activeClient?.phoneWhatsapp || prev.phoneWhatsapp || '';
      const resolvedAddress = targetFormatData.storeAddress || activeClient?.storeAddress || prev.storeAddress || '';
      const resolvedLegal = targetFormatData.legalNotice || activeClient?.legalNotice || prev.legalNotice || 'Imagens meramente ilustrativas; Proibido a venda de bebidas alcoólicas a menores de 18 anos!';
      const resolvedFooterBrand = targetFormatData.footerBrandText || activeClient?.footerBrandText || prev.footerBrandText || 'Desenvolvido por: playcomunique.com.br';

      // 3. Aplica os dados do novo formato no campaign ativo
      const nextCampaign: BannerCampaign = {
        ...prev,
        format: fmt,
        _syncTimestamp: now,
        campaignTitle: targetFormatData.campaignTitle !== undefined ? targetFormatData.campaignTitle : prev.campaignTitle,
        campaignSubtitle: targetFormatData.campaignSubtitle !== undefined ? targetFormatData.campaignSubtitle : prev.campaignSubtitle,
        validityText: targetFormatData.validityText !== undefined ? targetFormatData.validityText : prev.validityText,
        legalNotice: resolvedLegal,
        footerBrandText: resolvedFooterBrand,
        tickerText: targetFormatData.tickerText !== undefined ? targetFormatData.tickerText : prev.tickerText,
        phoneWhatsapp: resolvedPhone,
        storeAddress: resolvedAddress,
        themeId: targetFormatData.themeId || prev.themeId,
        customColors: targetFormatData.customColors || prev.customColors,
        customStyles: targetFormatData.customStyles ? JSON.parse(JSON.stringify(targetFormatData.customStyles)) : prev.customStyles,
        products: resolvedProducts,
        activeProductIndex: targetFormatData.activeProductIndex !== undefined 
          ? Math.min(targetFormatData.activeProductIndex, Math.max(0, resolvedProducts.length - 1))
          : Math.min(prev.activeProductIndex, Math.max(0, resolvedProducts.length - 1)),
        showClientLogo: targetFormatData.showClientLogo !== undefined ? targetFormatData.showClientLogo : prev.showClientLogo,
        tabloidColumns: targetFormatData.tabloidColumns,
        tabloidRows: targetFormatData.tabloidRows,
        tabloidSelectedProductIds: targetFormatData.tabloidSelectedProductIds,
        tabloidTarget: targetFormatData.tabloidTarget,
        formatsData: {
          ...updatedFormats,
          [fmt]: {
            ...targetFormatData,
            phoneWhatsapp: resolvedPhone,
            storeAddress: resolvedAddress,
            legalNotice: resolvedLegal,
            footerBrandText: resolvedFooterBrand,
            products: resolvedProducts,
          },
        },
      };

      safeSaveCampaignToLocalStorage(nextCampaign);
      try {
        localStorage.setItem('playcomunique_last_local_edit_time', String(Date.now()));
      } catch (e) {}
      saveLocalCampaign(nextCampaign).catch(() => {});
      setCloudSyncStatus('syncing');
      saveCampaignToCloud(nextCampaign).then((ok) => {
        if (ok) {
          lastSavedTimestampRef.current = now;
          setCloudSyncStatus('saved');
        }
      }).catch(() => {});

      setClients((prevClients) => {
        const updatedClients = prevClients.map((c) =>
          c.name.toLowerCase() === prev.clientName.toLowerCase() || c.id === prev.clientId
            ? { ...c, formatsData: nextCampaign.formatsData }
            : c
        );
        safeSaveClientsToLocalStorage(updatedClients);
        saveLocalClients(updatedClients).catch(() => {});
        saveClientsToCloud(updatedClients).catch(() => {});
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

      safeSaveCampaignToLocalStorage(nextCampaign);
      try {
        localStorage.setItem('playcomunique_last_local_edit_time', String(Date.now()));
      } catch (e) {}
      saveLocalCampaign(nextCampaign).catch(() => {});

      setClients((prevClients) => {
        const updated = prevClients.map((c) =>
          c.name.toLowerCase() === prev.clientName.toLowerCase() || c.id === prev.clientId
            ? { ...c, products: nextProducts, formatsData: nextFormatsData }
            : c
        );
        safeSaveClientsToLocalStorage(updated);
        saveLocalClients(updated).catch(() => {});
        saveClientsToCloud(updated).catch(() => {});
        return updated;
      });

      setCloudSyncStatus('syncing');
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
      const currentFormat = prev.format || '16:9';
      const isMaster16x9 = currentFormat === '16:9';

      const nextProducts = [...prev.products];
      const existingProduct = nextProducts[idx] || ({} as ProductItem);

      const updatedProduct: ProductItem = {
        ...existingProduct,
        ...updated,
      };
      nextProducts[idx] = updatedProduct;

      // Inicializa ou clona os formatos existentes
      const updatedFormats: Record<BannerFormat, FormatCampaignData> = prev.formatsData && Object.keys(prev.formatsData).length > 0
        ? { ...(prev.formatsData as Record<BannerFormat, FormatCampaignData>) }
        : initFormatsData(prev);

      // Atualiza o formato ativo
      const currentFormatData = updatedFormats[currentFormat] || extractFormatData(prev);
      updatedFormats[currentFormat] = {
        ...currentFormatData,
        products: nextProducts,
      };

      // REGRA MESTRE 16:9:
      // Se alterado no formato TV 16:9, altera os dados em TODOS os demais formatos de banner!
      // Se alterado em OUTROS modelos de banners, a alteração fica salva apenas nele mesmo!
      if (isMaster16x9) {
        ALL_BANNER_FORMATS.forEach((fmt) => {
          if (fmt === '16:9') return;
          const fmtData = updatedFormats[fmt] || extractFormatData(prev);
          const fmtProducts = fmtData.products && fmtData.products.length > 0 
            ? [...fmtData.products] 
            : [...nextProducts];

          if (fmtProducts[idx]) {
            fmtProducts[idx] = {
              ...fmtProducts[idx],
              ...updated,
            };
          } else {
            fmtProducts[idx] = { ...updatedProduct };
          }

          updatedFormats[fmt] = {
            ...fmtData,
            products: fmtProducts,
          };
        });
      }

      const nextCampaign: BannerCampaign = {
        ...prev,
        products: nextProducts,
        formatsData: updatedFormats,
        _syncTimestamp: now,
      };

      if (updated.imageUrl && (updated.imageUrl.startsWith('data:image') || updated.imageUrl.startsWith('http'))) {
        saveLocalImage(updatedProduct.id, updated.imageUrl).catch(() => {});
        saveProductImageToCloud(updatedProduct.id, updated.imageUrl).catch(() => {});
      }

      safeSaveCampaignToLocalStorage(nextCampaign);
      try {
        localStorage.setItem('playcomunique_last_local_edit_time', String(Date.now()));
      } catch (e) {}
      saveLocalCampaign(nextCampaign).catch(() => {});

      setClients((prevClients) => {
        const updatedClients = prevClients.map((c) =>
          c.name.toLowerCase() === prev.clientName.toLowerCase() || c.id === prev.clientId
            ? { ...c, products: nextProducts, formatsData: updatedFormats }
            : c
        );
        safeSaveClientsToLocalStorage(updatedClients);
        saveLocalClients(updatedClients).catch(() => {});
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

      const updatedFormats: Record<BannerFormat, FormatCampaignData> = prev.formatsData && Object.keys(prev.formatsData).length > 0
        ? { ...(prev.formatsData as Record<BannerFormat, FormatCampaignData>) }
        : initFormatsData(prev);

      ALL_BANNER_FORMATS.forEach((fmt) => {
        const fmtData = updatedFormats[fmt] || extractFormatData(prev);
        const fmtProducts = fmtData.products ? [...fmtData.products, { ...newProduct, customizedFields: [] }] : [...nextProducts];
        updatedFormats[fmt] = {
          ...fmtData,
          products: fmtProducts,
          activeProductIndex: fmtProducts.length - 1,
        };
      });

      const nextCampaign: BannerCampaign = {
        ...prev,
        products: nextProducts,
        activeProductIndex: nextProducts.length - 1,
        formatsData: updatedFormats,
        _syncTimestamp: now,
      };

      if (newProduct.imageUrl && (newProduct.imageUrl.startsWith('data:image') || newProduct.imageUrl.startsWith('http'))) {
        saveLocalImage(newProduct.id, newProduct.imageUrl).catch(() => {});
        saveProductImageToCloud(newProduct.id, newProduct.imageUrl).catch(() => {});
      }

      safeSaveCampaignToLocalStorage(nextCampaign);
      try {
        localStorage.setItem('playcomunique_last_local_edit_time', String(Date.now()));
      } catch (e) {}
      saveLocalCampaign(nextCampaign).catch(() => {});

      setClients((prevClients) => {
        const updatedClients = prevClients.map((c) =>
          c.name.toLowerCase() === prev.clientName.toLowerCase() || c.id === prev.clientId
            ? { ...c, products: nextProducts, formatsData: updatedFormats }
            : c
        );
        safeSaveClientsToLocalStorage(updatedClients);
        saveLocalClients(updatedClients).catch(() => {});
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

      const updatedFormats: Record<BannerFormat, FormatCampaignData> = prev.formatsData && Object.keys(prev.formatsData).length > 0
        ? { ...(prev.formatsData as Record<BannerFormat, FormatCampaignData>) }
        : initFormatsData(prev);

      ALL_BANNER_FORMATS.forEach((fmt) => {
        const fmtData = updatedFormats[fmt] || extractFormatData(prev);
        if (fmtData.products && fmtData.products.length > fromIndex && fmtData.products.length > toIndex) {
          const prods = [...fmtData.products];
          const [moved] = prods.splice(fromIndex, 1);
          prods.splice(toIndex, 0, moved);
          updatedFormats[fmt] = {
            ...fmtData,
            products: prods,
            activeProductIndex: nextActiveIndex,
          };
        }
      });

      const nextCampaign: BannerCampaign = {
        ...prev,
        products: nextProducts,
        activeProductIndex: nextActiveIndex,
        formatsData: updatedFormats,
        _syncTimestamp: now,
      };

      safeSaveCampaignToLocalStorage(nextCampaign);
      try {
        localStorage.setItem('playcomunique_last_local_edit_time', String(Date.now()));
      } catch (e) {}
      saveLocalCampaign(nextCampaign).catch(() => {});

      setClients((prevClients) => {
        const updatedClients = prevClients.map((c) =>
          c.name.toLowerCase() === prev.clientName.toLowerCase() || c.id === prev.clientId
            ? { ...c, products: nextProducts, formatsData: updatedFormats }
            : c
        );
        safeSaveClientsToLocalStorage(updatedClients);
        saveLocalClients(updatedClients).catch(() => {});
        return updatedClients;
      });

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

      const updatedFormats: Record<BannerFormat, FormatCampaignData> = prev.formatsData && Object.keys(prev.formatsData).length > 0
        ? { ...(prev.formatsData as Record<BannerFormat, FormatCampaignData>) }
        : initFormatsData(prev);

      ALL_BANNER_FORMATS.forEach((fmt) => {
        const fmtData = updatedFormats[fmt] || extractFormatData(prev);
        if (fmtData.products) {
          const prods = fmtData.products.filter((_, i) => i !== idx);
          updatedFormats[fmt] = {
            ...fmtData,
            products: prods,
            activeProductIndex: Math.min(fmtData.activeProductIndex ?? 0, Math.max(0, prods.length - 1)),
          };
        }
      });

      const nextCampaign: BannerCampaign = {
        ...prev,
        products: next,
        activeProductIndex: nextIdx,
        formatsData: updatedFormats,
        _syncTimestamp: now,
      };

      safeSaveCampaignToLocalStorage(nextCampaign);
      try {
        localStorage.setItem('playcomunique_last_local_edit_time', String(Date.now()));
      } catch (e) {}
      saveLocalCampaign(nextCampaign).catch(() => {});

      setClients((prevClients) => {
        const updated = prevClients.map((c) =>
          c.name.toLowerCase() === prev.clientName.toLowerCase() || c.id === prev.clientId
            ? { ...c, products: next, formatsData: updatedFormats }
            : c
        );
        safeSaveClientsToLocalStorage(updated);
        saveLocalClients(updated).catch(() => {});
        return updated;
      });

      return nextCampaign;
    });
  };

  const handleRestoreProduct = (productToRestore: ProductItem) => {
    lastLocalEditTimeRef.current = Date.now();
    const now = new Date().toISOString();
    setCampaign((prev) => {
      const nextProducts = [...prev.products, productToRestore];

      const updatedFormats: Record<BannerFormat, FormatCampaignData> = prev.formatsData && Object.keys(prev.formatsData).length > 0
        ? { ...(prev.formatsData as Record<BannerFormat, FormatCampaignData>) }
        : initFormatsData(prev);

      ALL_BANNER_FORMATS.forEach((fmt) => {
        const fmtData = updatedFormats[fmt] || extractFormatData(prev);
        const fmtProducts = fmtData.products ? [...fmtData.products, { ...productToRestore, customizedFields: [] }] : [...nextProducts];
        updatedFormats[fmt] = {
          ...fmtData,
          products: fmtProducts,
          activeProductIndex: fmtProducts.length - 1,
        };
      });

      const nextCampaign: BannerCampaign = {
        ...prev,
        products: nextProducts,
        activeProductIndex: nextProducts.length - 1,
        formatsData: updatedFormats,
        _syncTimestamp: now,
      };

      if (productToRestore.imageUrl && (productToRestore.imageUrl.startsWith('data:image') || productToRestore.imageUrl.startsWith('http'))) {
        saveLocalImage(productToRestore.id, productToRestore.imageUrl).catch(() => {});
        saveProductImageToCloud(productToRestore.id, productToRestore.imageUrl).catch(() => {});
      }

      safeSaveCampaignToLocalStorage(nextCampaign);
      try {
        localStorage.setItem('playcomunique_last_local_edit_time', String(Date.now()));
      } catch (e) {}
      saveLocalCampaign(nextCampaign).catch(() => {});

      setClients((prevClients) => {
        const updatedClients = prevClients.map((c) =>
          c.name.toLowerCase() === prev.clientName.toLowerCase() || c.id === prev.clientId
            ? { ...c, products: nextProducts, formatsData: updatedFormats }
            : c
        );
        safeSaveClientsToLocalStorage(updatedClients);
        saveLocalClients(updatedClients).catch(() => {});
        return updatedClients;
      });

      return nextCampaign;
    });
  };

  const handleUpdateCampaign = (updated: Partial<BannerCampaign>) => {
    lastLocalEditTimeRef.current = Date.now();
    const now = new Date().toISOString();
    setCampaign((prev) => {
      const currentFormat = prev.format || '16:9';
      const isMaster16x9 = currentFormat === '16:9';
      const tempMerged = { ...prev, ...updated, _syncTimestamp: now };

      // Sincroniza as alterações no formatsData especificamente para o formato ativo
      const nextFormatsData = syncCurrentFormatToFormatsData(prev.formatsData, currentFormat, tempMerged);

      // REGRA DE OURO 16:9 MESTRE PARA TÍTULO DA CAMPANHA E VALIDADE DAS OFERTAS:
      // Se alterado no padrão TV 16:9: campaignTitle e validityText atualizam incondicionalmente todos os demais formatos (9:16, 1:1, 4:5, tabloid)!
      // Se alterado em outros formatos: a alteração fica salva apenas nele mesmo!
      if (isMaster16x9 && (updated.campaignTitle !== undefined || updated.validityText !== undefined)) {
        ALL_BANNER_FORMATS.forEach((fmt) => {
          if (fmt === '16:9') return;
          const fmtData = nextFormatsData[fmt] || extractFormatData(prev);
          nextFormatsData[fmt] = {
            ...fmtData,
            ...(updated.campaignTitle !== undefined ? { campaignTitle: updated.campaignTitle } : {}),
            ...(updated.validityText !== undefined ? { validityText: updated.validityText } : {}),
          };
        });
      }

      const next: BannerCampaign = {
        ...tempMerged,
        formatsData: nextFormatsData,
      };

      safeSaveCampaignToLocalStorage(next);
      try {
        localStorage.setItem('playcomunique_last_local_edit_time', String(Date.now()));
      } catch (e) {}
      saveLocalCampaign(next).catch(() => {});

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
        safeSaveClientsToLocalStorage(updatedClients);
        saveLocalClients(updatedClients).catch(() => {});
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
      const next: BannerCampaign = {
        ...prev,
        activeProductIndex: idx,
        formatsData: updatedFormats,
      };
      safeSaveCampaignToLocalStorage(next);
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
        clientName={campaign.clientName}
        onClientNameChange={(name) => handleUpdateCampaign({ clientName: name })}
        activeThemeId={campaign.themeId}
        showClientLogo={campaign.showClientLogo !== false}
        onToggleShowLogo={() => handleUpdateCampaign({ showClientLogo: !campaign.showClientLogo })}
        cloudSyncStatus={cloudSyncStatus}
        onForceCloudSync={handleForceCloudSync}
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
