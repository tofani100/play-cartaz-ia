export type BannerFormat = '16:9' | '9:16' | '1:1' | '4:5' | 'tabloid';

export type AnimationEffect = 'pulse' | 'zoom' | 'slide' | 'shine' | 'none';

export type ThemePresetId = 
  | 'supermarket-red'
  | 'butcher-dark'
  | 'hortifruti-green'
  | 'pharmacy-blue'
  | 'bakery-warm'
  | 'neon-party'
  | 'clean-minimal';

export interface ThemeColors {
  id: ThemePresetId;
  name: string;
  category: string;
  primary: string; // Ex: #E50914 (Red)
  secondary: string; // Ex: #FFD200 (Yellow)
  accent: string; // Ex: #FFFFFF
  badgeBg: string;
  badgeText: string;
  priceBg: string;
  priceText: string;
  headerBg: string;
  headerText: string;
  bgGradient: string;
  cardBg: string;
  textColor: string;
}

export interface ProductItem {
  id: string;
  title: string;
  brand?: string;
  category: string;
  unit: string; // "kg", "2L", "500g", "unidade", "lata 350ml", etc.
  price: string; // "24,90"
  originalPrice?: string; // "29,90"
  discountPercentage?: number; // 20
  badge?: string; // "SUPER OFERTA", "IMPERDÍVEL", "LEVE 3 PAGUE 2", etc.
  badgeBgColor?: string; // Cor de fundo exclusiva do 1º selo promocional
  badgeTextColor?: string; // Cor de texto do 1º selo promocional
  secondBadgeEnabled?: boolean; // Flag para ativar o 2º selo promocional (informações extras)
  secondBadge?: string; // Texto do 2º selo promocional
  secondBadgeBgColor?: string; // Cor de fundo do 2º selo promocional
  secondBadgeTextColor?: string; // Cor de texto do 2º selo promocional
  imageUrl: string;
  searchKey?: string;
  packagingStyle?: string;
  isHero?: boolean; // Highlighted item on tabloid
  imageDisplayMode?: 'ambient' | 'contain'; // 'ambient' for cinematic commercial full-bleed, 'contain' for classic cutout packshot
  aiPromptUsed?: string;
  hidden?: boolean; // Oculto da rotação na playlist da TV sem deletar
  customStyles?: BannerCustomStyles; // Estilo customizado exclusivo para este banner individual
}

export interface BannerCampaign {
  id: string;
  clientId?: string;
  clientName: string;
  clientLogoUrl?: string;
  showClientLogo?: boolean;
  segment: string;
  campaignTitle: string;
  campaignSubtitle?: string;
  validityText: string;
  legalNotice: string;
  footerBrandText?: string; // Link/assinatura no canto direito do rodapé (ex: ts.playcomunique.com.br)
  tickerText: string; // Marquee footer for TV
  format: BannerFormat;
  themeId: ThemePresetId;
  customColors?: Partial<ThemeColors>;
  customStyles?: BannerCustomStyles;
  products: ProductItem[];
  activeProductIndex: number;
  animationStyle: AnimationEffect;
  slideDuration: number; // in seconds (e.g. 6)
  showClock: boolean;
  showMarqueeTicker: boolean;
  showQrCode: boolean;
  phoneWhatsapp?: string;
  storeAddress?: string;
  tabloidColumns?: number; // 1, 2, 3, 4 colunas (padrão: 2 para celular/whatsapp)
  tabloidRows?: number; // 2, 3, 4, 5, 6 ou 0 para todas as linhas
  tabloidSelectedProductIds?: string[]; // IDs dos produtos escolhidos para exibição no tablóide
  tabloidTarget?: 'whatsapp-mobile' | 'instagram-feed' | 'instagram-square' | 'classic-a4'; // Destino / preset do tablóide
  formatsData?: Partial<Record<BannerFormat, FormatCampaignData>>; // Dados e ajustes exclusivos salvos por formato
  _syncTimestamp?: string;
}

export interface BannerCustomStyles {
  bannerBgColor?: string;
  bannerBgGradient?: string;
  bannerBgImageUrl?: string;
  campaignTitleColor?: string;
  campaignTitleFont?: string;
  campaignTitleFontSize?: string;
  validityTextColor?: string;
  validityTextFont?: string;
  validityTextFontSize?: string;
  campaignSubtitleColor?: string;
  productTitleColor?: string;
  productTitleFont?: string;
  badgeBgColor?: string;
  badgeTextColor?: string;
  secondBadgeBgColor?: string;
  secondBadgeTextColor?: string;
  priceBoxBgColor?: string;
  priceBoxTextColor?: string;
  priceOriginalColor?: string;
  cardBorderColor?: string;
  footerLegalColor?: string;
  footerBrandColor?: string;
  presetThemeId?: string;
}

export const OPCOES_TAMANHO_TITULO = [
  { id: 'auto', label: 'Auto (Adaptativo)' },
  { id: '20px', label: 'Pequeno (20px)' },
  { id: '24px', label: 'Médio-Pequeno (24px)' },
  { id: '28px', label: 'Médio (28px)' },
  { id: '32px', label: 'Grande (32px - Padrão)' },
  { id: '36px', label: 'Muito Grande (36px)' },
  { id: '40px', label: 'Extra Grande (40px)' },
  { id: '46px', label: 'Gigante (46px)' },
  { id: '52px', label: 'Impacto Máximo (52px)' },
] as const;

export const OPCOES_TAMANHO_VALIDADE = [
  { id: 'auto', label: 'Auto (Adaptativo)' },
  { id: '10px', label: 'Pequeno (10px)' },
  { id: '12px', label: 'Médio (12px)' },
  { id: '14px', label: 'Grande (14px - Padrão)' },
  { id: '16px', label: 'Muito Grande (16px)' },
  { id: '18px', label: 'Destaque (18px)' },
  { id: '20px', label: 'Impacto Máximo (20px)' },
] as const;

export function getScaledCampaignTitleFontSize(sizeStr?: string, format: BannerFormat = '16:9'): string | undefined {
  if (!sizeStr || sizeStr === 'auto') return undefined;
  const num = parseFloat(sizeStr);
  if (isNaN(num)) return sizeStr;
  if (format === '16:9') return `${num}px`;
  if (format === '1:1') return `${Math.round(num * 0.75)}px`;
  if (format === '4:5') return `${Math.round(num * 0.65)}px`;
  if (format === '9:16') return `${Math.round(num * 0.55)}px`;
  if (format === 'tabloid') return `${Math.round(num * 0.7)}px`;
  return `${num}px`;
}

export function getScaledValidityFontSize(sizeStr?: string, format: BannerFormat = '16:9'): string | undefined {
  if (!sizeStr || sizeStr === 'auto') return undefined;
  const num = parseFloat(sizeStr);
  if (isNaN(num)) return sizeStr;
  if (format === '16:9') return `${num}px`;
  if (format === '1:1') return `${Math.max(8, Math.round(num * 0.75))}px`;
  if (format === '4:5') return `${Math.max(7.5, Math.round(num * 0.68))}px`;
  if (format === '9:16') return `${Math.max(7, Math.round(num * 0.58))}px`;
  if (format === 'tabloid') return `${Math.max(7, Math.round(num * 0.65))}px`;
  return `${num}px`;
}

export interface ClientProfile {
  id: string;
  name: string;
  tradeName?: string;
  segment: string;
  logoUrl?: string;
  themeId: ThemePresetId;
  defaultTickerText?: string;
  phoneWhatsapp?: string;
  storeAddress?: string;
  createdAt?: string;
  products?: ProductItem[]; // Banners e ofertas salvos exclusivamente para este cliente
  customStyles?: BannerCustomStyles;
  campaignTitle?: string;
  campaignSubtitle?: string;
  validityText?: string;
  formatsData?: Partial<Record<BannerFormat, FormatCampaignData>>;
}

export interface FormatCampaignData {
  campaignTitle?: string;
  campaignSubtitle?: string;
  validityText?: string;
  legalNotice?: string;
  footerBrandText?: string;
  tickerText?: string;
  phoneWhatsapp?: string;
  storeAddress?: string;
  themeId?: ThemePresetId;
  customColors?: Partial<ThemeColors>;
  customStyles?: BannerCustomStyles;
  products?: ProductItem[];
  activeProductIndex?: number;
  showClientLogo?: boolean;
  tabloidColumns?: number;
  tabloidRows?: number;
  tabloidSelectedProductIds?: string[];
  tabloidTarget?: 'whatsapp-mobile' | 'instagram-feed' | 'instagram-square' | 'classic-a4';
}

export const ALL_BANNER_FORMATS: BannerFormat[] = ['16:9', '9:16', '4:5', '1:1', 'tabloid'];

export function extractFormatData(c: BannerCampaign): FormatCampaignData {
  const data: FormatCampaignData = {
    campaignTitle: c.campaignTitle || '',
    campaignSubtitle: c.campaignSubtitle || '',
    validityText: c.validityText || '',
    legalNotice: c.legalNotice || '',
    footerBrandText: c.footerBrandText || '',
    tickerText: c.tickerText || '',
    phoneWhatsapp: c.phoneWhatsapp || '',
    storeAddress: c.storeAddress || '',
    themeId: c.themeId,
    activeProductIndex: c.activeProductIndex ?? 0,
    showClientLogo: c.showClientLogo !== false,
  };
  if (c.customColors) data.customColors = { ...c.customColors };
  if (c.customStyles) data.customStyles = JSON.parse(JSON.stringify(c.customStyles));
  if (c.products && c.products.length > 0) data.products = JSON.parse(JSON.stringify(c.products));
  if (c.tabloidColumns !== undefined && c.tabloidColumns !== null) data.tabloidColumns = c.tabloidColumns;
  if (c.tabloidRows !== undefined && c.tabloidRows !== null) data.tabloidRows = c.tabloidRows;
  if (c.tabloidSelectedProductIds && c.tabloidSelectedProductIds.length > 0) {
    data.tabloidSelectedProductIds = [...c.tabloidSelectedProductIds];
  }
  if (c.tabloidTarget) data.tabloidTarget = c.tabloidTarget;
  return data;
}

export function initFormatsData(c: BannerCampaign): Record<BannerFormat, FormatCampaignData> {
  const base = extractFormatData(c);
  return {
    '16:9': JSON.parse(JSON.stringify(base)),
    '9:16': JSON.parse(JSON.stringify(base)),
    '4:5': JSON.parse(JSON.stringify(base)),
    '1:1': JSON.parse(JSON.stringify(base)),
    'tabloid': JSON.parse(JSON.stringify(base)),
  };
}

export function syncCurrentFormatToFormatsData(
  formatsData: Partial<Record<BannerFormat, FormatCampaignData>> | undefined,
  currentFormat: BannerFormat,
  campaign: BannerCampaign
): Record<BannerFormat, FormatCampaignData> {
  const existing = formatsData && Object.keys(formatsData).length > 0
    ? { ...formatsData }
    : initFormatsData(campaign);
  return {
    ...existing,
    [currentFormat]: extractFormatData(campaign),
  } as Record<BannerFormat, FormatCampaignData>;
}

export interface CuratedProduct {
  id: string;
  title: string;
  brand: string;
  category: string;
  defaultUnit: string;
  suggestedPrice: string;
  suggestedOriginalPrice: string;
  badge: string;
  imageUrl: string;
  keywords: string[];
}
