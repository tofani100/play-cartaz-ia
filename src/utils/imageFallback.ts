/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Retorna uma fotografia comercial ambientada de alta fidelidade como fallback
 * caso uma URL externa venha a quebrar (evitando telas pretas ou ícones quebrados).
 */
export function getProductFallbackImage(title?: string, category?: string): string {
  const t = `${title || ''} ${category || ''}`
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

  if (t.includes('cafe') || t.includes('cappuccino') || t.includes('matinal')) {
    return 'https://images.unsplash.com/photo-1509785307050-d4066910ec1e?w=1200&auto=format&fit=crop&q=85';
  }
  if (t.includes('cerveja') || t.includes('heineken') || t.includes('chopp') || t.includes('bebida') || t.includes('refrigerante') || t.includes('coca')) {
    return 'https://images.unsplash.com/photo-1608270586620-248524c67de9?w=1200&auto=format&fit=crop&q=85';
  }
  if (t.includes('carne') || t.includes('picanha') || t.includes('churrasco') || t.includes('bovino') || t.includes('lingui')) {
    return 'https://images.unsplash.com/photo-1558030006-450675393462?w=1200&auto=format&fit=crop&q=85';
  }
  if (t.includes('leite') || t.includes('queijo') || t.includes('latic') || t.includes('iogurte') || t.includes('manteiga')) {
    return 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=1200&auto=format&fit=crop&q=85';
  }
  if (t.includes('limpeza') || t.includes('ype') || t.includes('detergente') || t.includes('sabao') || t.includes('amaciante') || t.includes('desinfetante')) {
    return 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=1200&auto=format&fit=crop&q=85';
  }
  if (t.includes('feijao') || t.includes('arroz') || t.includes('grao') || t.includes('mercearia') || t.includes('oleo') || t.includes('acucar')) {
    return 'https://images.unsplash.com/photo-1551462147-ff29053bfc14?w=1200&auto=format&fit=crop&q=85';
  }
  if (t.includes('fruta') || t.includes('maca') || t.includes('banana') || t.includes('laranja') || t.includes('horti') || t.includes('legume')) {
    return 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=1200&auto=format&fit=crop&q=85';
  }

  return 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=1200&auto=format&fit=crop&q=85';
}

export function handleImageError(e: React.SyntheticEvent<HTMLImageElement, Event>, title?: string, category?: string) {
  const target = e.currentTarget;
  const fallback = getProductFallbackImage(title, category);
  if (target.src !== fallback) {
    target.src = fallback;
  }
}
