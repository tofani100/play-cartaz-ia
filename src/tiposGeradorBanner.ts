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
  qrCodeUrl?: string;
  phoneWhatsapp?: string;
  storeAddress?: string;
}

export interface BannerCustomStyles {
  bannerBgColor?: string;
  bannerBgGradient?: string;
  bannerBgImageUrl?: string;
  campaignTitleColor?: string;
  campaignTitleFont?: string;
  productTitleColor?: string;
  productTitleFont?: string;
  badgeBgColor?: string;
  badgeTextColor?: string;
  priceBoxBgColor?: string;
  priceBoxTextColor?: string;
  priceOriginalColor?: string;
  cardBorderColor?: string;
  presetThemeId?: string;
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
