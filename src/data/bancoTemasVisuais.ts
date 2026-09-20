import { ThemeColors, ThemePresetId } from '../types';

export const THEME_PRESETS: Record<ThemePresetId, ThemeColors> = {
  'supermarket-red': {
    id: 'supermarket-red',
    name: 'Supermercado Impacto (Vermelho & Amarelo)',
    category: 'Varejo & Supermercados',
    primary: '#DC2626', // Red 600
    secondary: '#FACC15', // Yellow 400
    accent: '#FFFFFF',
    badgeBg: '#FEF08A',
    badgeText: '#854D0E',
    priceBg: '#FACC15',
    priceText: '#7F1D1D',
    headerBg: '#991B1B',
    headerText: '#FFFFFF',
    bgGradient: 'from-red-700 via-red-800 to-neutral-950',
    cardBg: 'bg-neutral-900/90 border-amber-500/30',
    textColor: '#FFFFFF',
  },
  'butcher-dark': {
    id: 'butcher-dark',
    name: 'Açougue & Carnes Nobres (Dark & Dourado)',
    category: 'Açougue & Churrasco',
    primary: '#7F1D1D', // Dark Red
    secondary: '#F59E0B', // Amber 500
    accent: '#FDE68A',
    badgeBg: '#F59E0B',
    badgeText: '#000000',
    priceBg: '#F59E0B',
    priceText: '#000000',
    headerBg: '#450A0A',
    headerText: '#FDE68A',
    bgGradient: 'from-neutral-950 via-stone-900 to-black',
    cardBg: 'bg-stone-900/95 border-amber-600/40',
    textColor: '#F5F5F4',
  },
  'hortifruti-green': {
    id: 'hortifruti-green',
    name: 'Hortifrúti Frescor (Verde & Laranja)',
    category: 'Hortifrúti & Orgânicos',
    primary: '#15803D', // Green 700
    secondary: '#EA580C', // Orange 600
    accent: '#FEF08A',
    badgeBg: '#BBF7D0',
    badgeText: '#14532D',
    priceBg: '#EA580C',
    priceText: '#FFFFFF',
    headerBg: '#14532D',
    headerText: '#FFFFFF',
    bgGradient: 'from-emerald-900 via-green-950 to-neutral-950',
    cardBg: 'bg-neutral-900/90 border-emerald-500/30',
    textColor: '#F0FDF4',
  },
  'pharmacy-blue': {
    id: 'pharmacy-blue',
    name: 'Farmácia & Drogaria (Azul & Ciano)',
    category: 'Farmácia & Saúde',
    primary: '#0284C7', // Sky 600
    secondary: '#06B6D4', // Cyan 500
    accent: '#FFFFFF',
    badgeBg: '#CFFAFE',
    badgeText: '#164E63',
    priceBg: '#0284C7',
    priceText: '#FFFFFF',
    headerBg: '#0C4A6E',
    headerText: '#FFFFFF',
    bgGradient: 'from-sky-950 via-slate-900 to-neutral-950',
    cardBg: 'bg-slate-900/90 border-sky-500/30',
    textColor: '#F8FAFC',
  },
  'bakery-warm': {
    id: 'bakery-warm',
    name: 'Padaria & Confeitaria (Caramelo & Vinho)',
    category: 'Padaria & Cafeteria',
    primary: '#B45309', // Amber 700
    secondary: '#F59E0B', // Amber 500
    accent: '#FFFBEB',
    badgeBg: '#FEF3C7',
    badgeText: '#78350F',
    priceBg: '#B45309',
    priceText: '#FFFFFF',
    headerBg: '#78350F',
    headerText: '#FEF3C7',
    bgGradient: 'from-amber-950 via-stone-900 to-neutral-950',
    cardBg: 'bg-stone-900/90 border-amber-500/30',
    textColor: '#FFFBEB',
  },
  'neon-party': {
    id: 'neon-party',
    name: 'Fim de Semana & Bebidas (Roxo & Neon)',
    category: 'Conveniência & Distribuidora',
    primary: '#9333EA', // Purple 600
    secondary: '#22C55E', // Green 500 Neon
    accent: '#FDE047',
    badgeBg: '#22C55E',
    badgeText: '#000000',
    priceBg: '#FDE047',
    priceText: '#000000',
    headerBg: '#581C87',
    headerText: '#FFFFFF',
    bgGradient: 'from-purple-950 via-indigo-950 to-black',
    cardBg: 'bg-neutral-900/90 border-purple-500/30',
    textColor: '#FAF5FF',
  },
  'clean-minimal': {
    id: 'clean-minimal',
    name: 'Varejo Elegante (Preto, Branco & Dourado)',
    category: 'Varejo & Cosméticos',
    primary: '#171717',
    secondary: '#EAB308',
    accent: '#FFFFFF',
    badgeBg: '#FEF08A',
    badgeText: '#713F12',
    priceBg: '#EAB308',
    priceText: '#000000',
    headerBg: '#0A0A0A',
    headerText: '#EAB308',
    bgGradient: 'from-neutral-900 via-neutral-950 to-black',
    cardBg: 'bg-neutral-900/90 border-neutral-700/50',
    textColor: '#FAFAFA',
  },
};

export const BANCO_TEMAS_VISUAIS = THEME_PRESETS;
