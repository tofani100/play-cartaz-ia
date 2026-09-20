/**
 * Gerador de Packshots Comerciais em Alta Resolução (SVG Data URLs)
 * Reproduz com fidelidade visual a embalagem real comercial dos produtos
 * mais vendidos no varejo e supermercados brasileiros (evitando fotos genéricas de ingredientes).
 */

function svgToDataUrl(svgString: string): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svgString.trim())}`;
}

export interface PackshotTemplate {
  id: string;
  name: string;
  brand: string;
  category: string;
  keywords: string[];
  getDataUrl: () => string;
}

/**
 * Packshot oficial: Café Caboclo Tradicional a Vácuo 500g
 * Embalagem tijolo a vácuo com cores vermelha e amarela e silhueta do caboclo
 */
export function renderCafeCabocloVacuoSvg(): string {
  return svgToDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500" width="400" height="500">
  <defs>
    <!-- Sombra de estúdio 3D -->
    <radialGradient id="studioShadow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#000000" stop-opacity="0.35"/>
      <stop offset="60%" stop-color="#000000" stop-opacity="0.12"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
    </radialGradient>
    
    <!-- Gradiente do tijolo a vácuo (vermelho caboclo) -->
    <linearGradient id="brickRed" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#7a0a0a"/>
      <stop offset="15%" stop-color="#aa1414"/>
      <stop offset="50%" stop-color="#c81e1e"/>
      <stop offset="85%" stop-color="#aa1414"/>
      <stop offset="100%" stop-color="#600505"/>
    </linearGradient>

    <!-- Gradiente da faixa amarela caboclo -->
    <linearGradient id="yellowBand" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#d97706"/>
      <stop offset="20%" stop-color="#f59e0b"/>
      <stop offset="50%" stop-color="#fbbf24"/>
      <stop offset="80%" stop-color="#f59e0b"/>
      <stop offset="100%" stop-color="#b45309"/>
    </linearGradient>

    <!-- Brilho de selagem a vácuo metálica -->
    <linearGradient id="foilSheen" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.25"/>
      <stop offset="40%" stop-color="#ffffff" stop-opacity="0"/>
      <stop offset="60%" stop-color="#ffffff" stop-opacity="0.15"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0.2"/>
    </linearGradient>
  </defs>

  <!-- Sombra no solo -->
  <ellipse cx="200" cy="460" rx="140" ry="24" fill="url(#studioShadow)" />

  <!-- Corpo do Tijolo a Vácuo (Embalagem 500g) -->
  <g transform="translate(90, 60)">
    <!-- Dobra superior selada (aba sanfonada a vácuo) -->
    <polygon points="10,-20 210,-20 200,0 20,0" fill="#880e0e" stroke="#550505" stroke-width="1.5" />
    <line x1="20" y1="-10" x2="200" y2="-10" stroke="#fef08a" stroke-width="1" stroke-dasharray="3,3" opacity="0.6"/>

    <!-- Bloco principal retangular rígido -->
    <rect x="20" y="0" width="180" height="380" rx="6" fill="url(#brickRed)" stroke="#4a0505" stroke-width="1.5"/>
    <rect x="20" y="0" width="180" height="380" rx="6" fill="url(#foilSheen)" />

    <!-- Dobras laterais de vácuo (estilo tijolo prensado) -->
    <line x1="24" y1="2" x2="24" y2="378" stroke="#ffffff" stroke-width="1.5" opacity="0.3"/>
    <line x1="196" y1="2" x2="196" y2="378" stroke="#000000" stroke-width="2" opacity="0.4"/>

    <!-- Faixa Dourada/Amarela Central Caboclo -->
    <rect x="20" y="90" width="180" height="150" fill="url(#yellowBand)"/>
    <line x1="20" y1="90" x2="200" y2="90" stroke="#78350f" stroke-width="2"/>
    <line x1="20" y1="240" x2="200" y2="240" stroke="#78350f" stroke-width="2"/>

    <!-- Logo / Medalhão do Caboclo com Chapéu de Palha -->
    <circle cx="110" cy="55" r="28" fill="#fef08a" stroke="#ffffff" stroke-width="2.5" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.3))"/>
    
    <!-- Silhueta Caboclo Sertanejo -->
    <path d="M 94,52 C 94,40 126,40 126,52 C 132,52 135,56 126,58 C 122,60 118,63 116,68 L 104,68 C 102,63 98,60 94,58 C 85,56 88,52 94,52 Z" fill="#78350f"/>
    <!-- Chapéu de palha do Caboclo -->
    <ellipse cx="110" cy="46" rx="22" ry="7" fill="#fde047" stroke="#854d0e" stroke-width="1.5"/>
    <path d="M 98,46 C 98,37 122,37 122,46 Z" fill="#eab308" stroke="#854d0e" stroke-width="1"/>

    <!-- Marca "CABOCLO" em destaque -->
    <text x="110" y="132" font-family="Arial Black, Impact, sans-serif" font-weight="900" font-size="28" fill="#1c1917" text-anchor="middle" letter-spacing="1">CABOCLO</text>
    
    <!-- "TRADICIONAL" em faixa preta/vermelha -->
    <rect x="40" y="146" width="140" height="24" rx="4" fill="#991b1b"/>
    <text x="110" y="163" font-family="Arial, Helvetica, sans-serif" font-weight="900" font-size="14" fill="#ffffff" text-anchor="middle" letter-spacing="2">TRADICIONAL</text>

    <!-- Descrição Comercial do Produto -->
    <text x="110" y="190" font-family="Arial, sans-serif" font-weight="bold" font-size="10.5" fill="#451a03" text-anchor="middle">CAFÉ TORRADO E MOÍDO</text>
    
    <!-- Ícone de Xícara de Café Quente Fumegante -->
    <g transform="translate(97, 198)">
      <path d="M 2,12 C 2,24 24,24 24,12 L 26,12 C 28,12 30,14 30,16 C 30,18 28,20 25,20 L 24,20 C 22,25 4,25 2,20" fill="none" stroke="#78350f" stroke-width="2"/>
      <path d="M 7,4 C 7,8 10,8 10,11" fill="none" stroke="#78350f" stroke-width="1.5" stroke-linecap="round"/>
      <path d="M 13,3 C 13,7 16,7 16,10" fill="none" stroke="#78350f" stroke-width="1.5" stroke-linecap="round"/>
      <path d="M 19,4 C 19,8 22,8 22,11" fill="none" stroke="#78350f" stroke-width="1.5" stroke-linecap="round"/>
    </g>

    <!-- Selo de Pureza ABIC -->
    <circle cx="110" cy="272" r="16" fill="#15803d" stroke="#fef08a" stroke-width="1.5"/>
    <text x="110" y="270" font-family="Arial, sans-serif" font-weight="900" font-size="7" fill="#ffffff" text-anchor="middle">SELO DE</text>
    <text x="110" y="278" font-family="Arial, sans-serif" font-weight="900" font-size="7.5" fill="#fef08a" text-anchor="middle">PUREZA</text>

    <!-- Destaque "A VÁCUO" -->
    <rect x="45" y="304" width="130" height="28" rx="5" fill="#fef08a" stroke="#eab308" stroke-width="1.5"/>
    <text x="110" y="323" font-family="Arial Black, Impact, sans-serif" font-weight="900" font-size="15" fill="#991b1b" text-anchor="middle">A VÁCUO</text>

    <!-- Peso Líquido 500g -->
    <text x="110" y="360" font-family="Arial, Helvetica, sans-serif" font-weight="900" font-size="16" fill="#ffffff" text-anchor="middle" letter-spacing="1">500 g</text>
    <text x="110" y="373" font-family="Arial, sans-serif" font-weight="bold" font-size="9" fill="#fca5a5" text-anchor="middle">PESO LÍQUIDO</text>
  </g>
</svg>
`);
}

/**
 * Packshot oficial: Café Pilão Tradicional 500g (A Vácuo)
 */
export function renderCafePilaoVacuoSvg(): string {
  return svgToDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500" width="400" height="500">
  <defs>
    <radialGradient id="studioShadow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#000000" stop-opacity="0.35"/>
      <stop offset="60%" stop-color="#000000" stop-opacity="0.12"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="pilaoRed" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#7f1d1d"/>
      <stop offset="20%" stop-color="#b91c1c"/>
      <stop offset="50%" stop-color="#dc2626"/>
      <stop offset="80%" stop-color="#b91c1c"/>
      <stop offset="100%" stop-color="#651313"/>
    </linearGradient>
  </defs>
  <ellipse cx="200" cy="460" rx="140" ry="24" fill="url(#studioShadow)" />
  <g transform="translate(90, 60)">
    <polygon points="10,-20 210,-20 200,0 20,0" fill="#991b1b" stroke="#450a0a" stroke-width="1.5" />
    <rect x="20" y="0" width="180" height="380" rx="6" fill="url(#pilaoRed)" stroke="#450a0a" stroke-width="1.5"/>
    
    <!-- Faixa preta com vermelho Pilão -->
    <rect x="20" y="60" width="180" height="150" fill="#18181b"/>
    <text x="110" y="115" font-family="Arial Black, Impact, sans-serif" font-weight="900" font-size="34" fill="#ef4444" text-anchor="middle" letter-spacing="2">PILÃO</text>
    <text x="110" y="140" font-family="Arial Black, sans-serif" font-weight="900" font-size="14" fill="#ffffff" text-anchor="middle" letter-spacing="1">TRADICIONAL</text>
    <text x="110" y="160" font-family="Arial, sans-serif" font-weight="bold" font-size="9" fill="#f87171" text-anchor="middle">O CAFÉ FORTE DO BRASIL</text>

    <!-- Xícara de café fumegante -->
    <ellipse cx="110" cy="245" r="28" fill="#450a0a" stroke="#dc2626" stroke-width="2"/>
    <circle cx="110" cy="245" r="20" fill="#1c1917"/>

    <rect x="45" y="300" width="130" height="26" rx="4" fill="#facc15"/>
    <text x="110" y="318" font-family="Arial Black, Impact, sans-serif" font-weight="900" font-size="14" fill="#000000" text-anchor="middle">A VÁCUO</text>
    <text x="110" y="360" font-family="Arial Black, sans-serif" font-weight="900" font-size="18" fill="#ffffff" text-anchor="middle">500 g</text>
  </g>
</svg>
`);
}

/**
 * Packshot oficial: Refrigerante Coca-Cola Garrafa 2L
 */
export function renderCocaCola2LSvg(): string {
  return svgToDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500" width="400" height="500">
  <defs>
    <radialGradient id="shadow2" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#000000" stop-opacity="0.35"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="colaLiquid" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#1c1917"/>
      <stop offset="25%" stop-color="#291510"/>
      <stop offset="50%" stop-color="#451a03"/>
      <stop offset="75%" stop-color="#291510"/>
      <stop offset="100%" stop-color="#0c0a09"/>
    </linearGradient>
  </defs>
  <ellipse cx="200" cy="460" rx="100" ry="20" fill="url(#shadow2)" />
  <g transform="translate(130, 40)">
    <!-- Tampa Vermelha Coca-Cola -->
    <rect x="58" y="0" width="24" height="18" rx="2" fill="#dc2626" stroke="#991b1b" stroke-width="1"/>
    <!-- Gargalo da Garrafa PET -->
    <polygon points="62,18 78,18 84,60 56,60" fill="url(#colaLiquid)" opacity="0.9"/>
    
    <!-- Corpo da Garrafa 2L (Contorno Curvo Coca-Cola) -->
    <path d="M 56,60 C 30,90 25,120 25,180 C 25,230 35,260 30,300 C 25,340 28,380 32,410 L 108,410 C 112,380 115,340 110,300 C 105,260 115,230 115,180 C 115,120 110,90 84,60 Z" fill="url(#colaLiquid)"/>

    <!-- Reflexo de Vidro/Plástico PET -->
    <path d="M 35,90 C 32,140 32,240 38,390" stroke="#ffffff" stroke-width="4" opacity="0.3" stroke-linecap="round" fill="none"/>

    <!-- Rótulo Vermelho Coca-Cola -->
    <rect x="25" y="190" width="90" height="85" fill="#dc2626" rx="2"/>
    <text x="70" y="240" font-family="Brush Script MT, cursive, Impact, Arial" font-size="28" font-style="italic" font-weight="bold" fill="#ffffff" text-anchor="middle">Coca-Cola</text>
    <path d="M 32,252 Q 70,265 108,248" fill="none" stroke="#ffffff" stroke-width="3"/>
    <text x="70" y="268" font-family="Arial Black, sans-serif" font-size="9" fill="#fef08a" text-anchor="middle">SABOR ORIGINAL</text>

    <!-- Marcação 2L -->
    <rect x="48" y="385" width="44" height="20" rx="3" fill="#ffffff" opacity="0.9"/>
    <text x="70" y="400" font-family="Arial Black, sans-serif" font-weight="900" font-size="12" fill="#dc2626" text-anchor="middle">2 LITROS</text>
  </g>
</svg>
`);
}

/**
 * Packshot oficial: Lava Roupas OMO Lavagem Perfeita 1,6kg
 */
export function renderOmo16KgSvg(): string {
  return svgToDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500" width="400" height="500">
  <defs>
    <radialGradient id="shadowOmo" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#000000" stop-opacity="0.35"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="omoBlue" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#0369a1"/>
      <stop offset="50%" stop-color="#0284c7"/>
      <stop offset="100%" stop-color="#075985"/>
    </linearGradient>
  </defs>
  <ellipse cx="200" cy="455" rx="140" ry="24" fill="url(#shadowOmo)" />
  <g transform="translate(90, 70)">
    <rect x="15" y="0" width="190" height="370" rx="8" fill="url(#omoBlue)" stroke="#0c4a6e" stroke-width="2"/>
    <rect x="15" y="0" width="190" height="90" fill="#dc2626" rx="8"/>
    
    <!-- Splash multicolorido OMO -->
    <circle cx="110" cy="140" r="45" fill="#facc15" opacity="0.8"/>
    <circle cx="95" cy="130" r="35" fill="#38bdf8" opacity="0.9"/>
    
    <text x="110" y="160" font-family="Arial Black, Impact, sans-serif" font-weight="900" font-size="44" fill="#ffffff" text-anchor="middle" letter-spacing="2">OMO</text>
    
    <rect x="35" y="195" width="150" height="32" rx="4" fill="#ffffff"/>
    <text x="110" y="217" font-family="Arial Black, sans-serif" font-weight="900" font-size="13" fill="#dc2626" text-anchor="middle">LAVAGEM PERFEITA</text>
    
    <text x="110" y="270" font-family="Arial, sans-serif" font-weight="bold" font-size="12" fill="#ffffff" text-anchor="middle">SABÃO EM PÓ</text>
    
    <rect x="55" y="315" width="110" height="30" rx="5" fill="#facc15"/>
    <text x="110" y="336" font-family="Arial Black, sans-serif" font-weight="900" font-size="16" fill="#0f172a" text-anchor="middle">1,6 kg</text>
  </g>
</svg>
`);
}

/**
 * Packshot oficial: Arroz Tio Jorge Tipo 1 5kg
 */
export function renderArroz5KgSvg(brand: string = 'Tio Jorge'): string {
  return svgToDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500" width="400" height="500">
  <defs>
    <radialGradient id="shadowRice" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#000000" stop-opacity="0.35"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <ellipse cx="200" cy="460" rx="130" ry="24" fill="url(#shadowRice)" />
  <g transform="translate(90, 70)">
    <!-- Saco 5kg transparente com grãos visíveis -->
    <rect x="20" y="0" width="180" height="370" rx="10" fill="#f8fafc" stroke="#94a3b8" stroke-width="2"/>
    
    <!-- Janela de grãos de arroz -->
    <rect x="35" y="180" width="150" height="130" rx="6" fill="#fefce8" stroke="#cbd5e1" stroke-width="1.5"/>
    <pattern id="riceGrains" width="12" height="12" patternUnits="userSpaceOnUse">
      <ellipse cx="4" cy="4" rx="3" ry="1.5" fill="#e2e8f0" transform="rotate(30 4 4)"/>
      <ellipse cx="9" cy="9" rx="3" ry="1.5" fill="#f1f5f9" transform="rotate(-40 9 9)"/>
    </pattern>
    <rect x="35" y="180" width="150" height="130" rx="6" fill="url(#riceGrains)"/>

    <!-- Cabeçalho azul e vermelho do pacote -->
    <rect x="20" y="0" width="180" height="90" rx="10" fill="#1d4ed8"/>
    <rect x="20" y="70" width="180" height="25" fill="#dc2626"/>

    <text x="110" y="52" font-family="Arial Black, Impact, sans-serif" font-weight="900" font-size="26" fill="#ffffff" text-anchor="middle">${brand.toUpperCase()}</text>
    <text x="110" y="125" font-family="Arial Black, sans-serif" font-weight="900" font-size="18" fill="#1e3a8a" text-anchor="middle">ARROZ BRANCO</text>
    <text x="110" y="150" font-family="Arial, sans-serif" font-weight="bold" font-size="13" fill="#dc2626" text-anchor="middle">TIPO 1 - SUBLIME</text>

    <!-- Peso 5kg -->
    <rect x="60" y="325" width="100" height="30" rx="4" fill="#dc2626"/>
    <text x="110" y="346" font-family="Arial Black, sans-serif" font-weight="900" font-size="16" fill="#ffffff" text-anchor="middle">5 kg</text>
  </g>
</svg>
`);
}

/**
 * Packshot oficial: Picanha Bovina Resfriada Friboi kg
 */
export function renderPicanhaFriboiSvg(): string {
  return svgToDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500" width="400" height="500">
  <defs>
    <radialGradient id="meatShadow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#000000" stop-opacity="0.4"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="beefCut" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#881337"/>
      <stop offset="30%" stop-color="#9f1239"/>
      <stop offset="70%" stop-color="#be123c"/>
      <stop offset="100%" stop-color="#700b25"/>
    </linearGradient>
  </defs>
  <ellipse cx="200" cy="450" rx="140" ry="24" fill="url(#meatShadow)" />
  <g transform="translate(60, 110)">
    <!-- Peça de picanha embalada a vácuo com capa de gordura -->
    <path d="M 20,180 C 10,70 120,30 260,70 C 270,180 230,280 130,270 C 50,260 20,220 20,180 Z" fill="url(#beefCut)" stroke="#4c0519" stroke-width="2"/>
    
    <!-- Capa de gordura branca uniforme superior da picanha -->
    <path d="M 20,100 C 40,45 130,30 260,70 C 230,105 130,75 20,100 Z" fill="#fef08a" opacity="0.95" stroke="#ca8a04" stroke-width="1.5"/>

    <!-- Filme plástico a vácuo transparente brilhante -->
    <path d="M 15,180 C 5,60 120,20 265,65 C 275,180 235,285 130,275 C 45,265 15,220 15,180 Z" fill="none" stroke="#ffffff" stroke-width="3" opacity="0.4"/>

    <!-- Rótulo Oficial Dourado e Preto Friboi -->
    <g transform="translate(80, 130)">
      <rect x="0" y="0" width="120" height="90" rx="6" fill="#18181b" stroke="#eab308" stroke-width="2"/>
      <text x="60" y="30" font-family="Arial Black, Impact, sans-serif" font-weight="900" font-size="20" fill="#facc15" text-anchor="middle">FRIBOI</text>
      <line x1="15" y1="36" x2="105" y2="36" stroke="#ca8a04" stroke-width="1"/>
      <text x="60" y="54" font-family="Arial Black, sans-serif" font-weight="900" font-size="12" fill="#ffffff" text-anchor="middle">PICANHA</text>
      <text x="60" y="68" font-family="Arial, sans-serif" font-weight="bold" font-size="9" fill="#f87171" text-anchor="middle">BOVINA RESFRIADA</text>
      <text x="60" y="80" font-family="Arial, sans-serif" font-weight="bold" font-size="8" fill="#eab308" text-anchor="middle">A VÁCUO / kg</text>
    </g>
  </g>
</svg>
`);
}

/**
 * Renderizador de Packshot Genérico Personalizado de Alta Fidelidade
 * Cria automaticamente uma embalagem 3D limpa de acordo com a categoria e o nome do produto
 */
export function renderCustomPackshotSvg(title: string, brand?: string, category: string = 'Mercearia', unit: string = 'un'): string {
  const catLower = category.toLowerCase();
  const titleLower = title.toLowerCase();

  // 1. Se for café
  if (titleLower.includes('caboclo')) {
    return renderCafeCabocloVacuoSvg();
  }
  if (titleLower.includes('pilão') || titleLower.includes('pilao')) {
    return renderCafePilaoVacuoSvg();
  }
  if (titleLower.includes('coca')) {
    return renderCocaCola2LSvg();
  }
  if (titleLower.includes('omo')) {
    return renderOmo16KgSvg();
  }
  if (titleLower.includes('arroz')) {
    return renderArroz5KgSvg(brand || 'Tio Jorge');
  }
  if (titleLower.includes('picanha')) {
    return renderPicanhaFriboiSvg();
  }

  // 2. Se for qualquer outro café a vácuo genérico
  if (titleLower.includes('cafe') || titleLower.includes('café')) {
    return svgToDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500" width="400" height="500">
  <defs>
    <radialGradient id="sh1" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#000000" stop-opacity="0.35"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="bgCoffee" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#581c87"/>
      <stop offset="50%" stop-color="#7e22ce"/>
      <stop offset="100%" stop-color="#3b0764"/>
    </linearGradient>
  </defs>
  <ellipse cx="200" cy="460" rx="130" ry="24" fill="url(#sh1)" />
  <g transform="translate(95, 65)">
    <polygon points="10,-18 190,-18 180,0 20,0" fill="#6b21a8" stroke="#3b0764" stroke-width="1.5" />
    <rect x="20" y="0" width="170" height="370" rx="6" fill="#78350f" stroke="#451a03" stroke-width="2"/>
    <rect x="20" y="80" width="170" height="140" fill="#f59e0b"/>
    <text x="105" y="125" font-family="Arial Black, Impact, sans-serif" font-weight="900" font-size="22" fill="#1c1917" text-anchor="middle">${(brand || 'CAFÉ').toUpperCase()}</text>
    <rect x="35" y="140" width="140" height="24" rx="4" fill="#991b1b"/>
    <text x="105" y="157" font-family="Arial Black, sans-serif" font-weight="900" font-size="12" fill="#ffffff" text-anchor="middle">TRADICIONAL</text>
    <text x="105" y="185" font-family="Arial, sans-serif" font-weight="bold" font-size="10" fill="#451a03" text-anchor="middle">CAFÉ TORRADO E MOÍDO</text>
    <rect x="40" y="280" width="130" height="26" rx="4" fill="#fef08a"/>
    <text x="105" y="298" font-family="Arial Black, sans-serif" font-weight="900" font-size="13" fill="#991b1b" text-anchor="middle">A VÁCUO</text>
    <text x="105" y="345" font-family="Arial Black, sans-serif" font-weight="900" font-size="16" fill="#ffffff" text-anchor="middle">${unit}</text>
  </g>
</svg>
`);
  }

  // 3. Bebidas genéricas (Garrafa / Lata comercial)
  if (catLower.includes('bebida') || catLower.includes('cerveja') || catLower.includes('refrigerante')) {
    return svgToDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500" width="400" height="500">
  <ellipse cx="200" cy="460" rx="110" ry="22" fill="#000000" opacity="0.3" />
  <g transform="translate(125, 60)">
    <!-- Lata / Garrafa comercial elegante -->
    <rect x="25" y="30" width="100" height="360" rx="20" fill="#0284c7" stroke="#0369a1" stroke-width="2"/>
    <ellipse cx="75" cy="30" rx="50" ry="15" fill="#cbd5e1"/>
    <rect x="25" y="130" width="100" height="150" fill="#ffffff"/>
    <text x="75" y="180" font-family="Arial Black, Impact, sans-serif" font-weight="900" font-size="18" fill="#0369a1" text-anchor="middle">${(brand || title.slice(0, 10)).toUpperCase()}</text>
    <text x="75" y="210" font-family="Arial, sans-serif" font-weight="bold" font-size="11" fill="#0f172a" text-anchor="middle">${category.toUpperCase()}</text>
    <rect x="45" y="235" width="60" height="20" rx="4" fill="#facc15"/>
    <text x="75" y="250" font-family="Arial Black, sans-serif" font-weight="900" font-size="11" fill="#000000" text-anchor="middle">${unit}</text>
  </g>
</svg>
`);
  }

  // 4. Limpeza / Higiene
  if (catLower.includes('limpeza') || catLower.includes('higiene')) {
    return svgToDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500" width="400" height="500">
  <ellipse cx="200" cy="460" rx="120" ry="22" fill="#000000" opacity="0.25" />
  <g transform="translate(115, 60)">
    <rect x="20" y="40" width="130" height="350" rx="16" fill="#10b981" stroke="#047857" stroke-width="2"/>
    <rect x="65" y="10" width="40" height="30" rx="4" fill="#facc15"/>
    <rect x="20" y="130" width="130" height="140" fill="#ffffff"/>
    <text x="85" y="175" font-family="Arial Black, Impact, sans-serif" font-weight="900" font-size="18" fill="#047857" text-anchor="middle">${(brand || title.slice(0, 10)).toUpperCase()}</text>
    <text x="85" y="200" font-family="Arial, sans-serif" font-weight="bold" font-size="10" fill="#334155" text-anchor="middle">${category.toUpperCase()}</text>
    <text x="85" y="240" font-family="Arial Black, sans-serif" font-weight="900" font-size="13" fill="#047857" text-anchor="middle">${unit}</text>
  </g>
</svg>
`);
  }

  // 5. Default Supermercado
  return svgToDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500" width="400" height="500">
  <ellipse cx="200" cy="460" rx="130" ry="24" fill="#000000" opacity="0.25" />
  <g transform="translate(100, 70)">
    <rect x="20" y="0" width="160" height="360" rx="12" fill="#ea580c" stroke="#9a3412" stroke-width="2"/>
    <rect x="20" y="90" width="160" height="150" fill="#ffffff"/>
    <text x="100" y="145" font-family="Arial Black, Impact, sans-serif" font-weight="900" font-size="18" fill="#ea580c" text-anchor="middle">${(brand || title.slice(0, 10)).toUpperCase()}</text>
    <text x="100" y="175" font-family="Arial, sans-serif" font-weight="bold" font-size="11" fill="#1e293b" text-anchor="middle">${title.slice(0, 16)}</text>
    <rect x="40" y="200" width="120" height="24" rx="4" fill="#facc15"/>
    <text x="100" y="217" font-family="Arial Black, sans-serif" font-weight="900" font-size="12" fill="#000000" text-anchor="middle">${unit}</text>
  </g>
</svg>
`);
}
