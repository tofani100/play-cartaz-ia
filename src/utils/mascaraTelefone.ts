/**
 * Utilitário de máscara e formatação de telefone/WhatsApp
 * Padrão solicitado: (DDD) 9 XXXX - XXXX (ex: (41) 9 9999 - 9999)
 */

export function formatarTelefoneWhatsapp(telefone?: string, fallback = '(11) 9 9999 - 1234'): string {
  if (!telefone || !telefone.trim()) {
    return fallback;
  }

  // Extrair apenas os números
  let digitos = telefone.replace(/\D/g, '');

  // Se vier com o código internacional do Brasil (55) com 12 ou 13 dígitos
  if ((digitos.length === 12 || digitos.length === 13) && digitos.startsWith('55')) {
    digitos = digitos.slice(2);
  }

  // Celular brasileiro com 11 dígitos: DDD (2) + 9 (1) + 4 + 4
  // Ex: 41996778354 -> (41) 9 9677 - 8354
  if (digitos.length === 11) {
    const ddd = digitos.slice(0, 2);
    const nono = digitos.slice(2, 3);
    const parte1 = digitos.slice(3, 7);
    const parte2 = digitos.slice(7, 11);
    return `(${ddd}) ${nono} ${parte1} - ${parte2}`;
  }

  // Telefone fixo ou celular com 10 dígitos: DDD (2) + 4 + 4
  // Ex: 4133445566 -> (41) 3344 - 5566
  if (digitos.length === 10) {
    const ddd = digitos.slice(0, 2);
    const parte1 = digitos.slice(2, 6);
    const parte2 = digitos.slice(6, 10);
    return `(${ddd}) ${parte1} - ${parte2}`;
  }

  // Celular sem DDD com 9 dígitos
  if (digitos.length === 9) {
    const nono = digitos.slice(0, 1);
    const parte1 = digitos.slice(1, 5);
    const parte2 = digitos.slice(5, 9);
    return `${nono} ${parte1} - ${parte2}`;
  }

  // Fixo sem DDD com 8 dígitos
  if (digitos.length === 8) {
    const parte1 = digitos.slice(0, 4);
    const parte2 = digitos.slice(4, 8);
    return `${parte1} - ${parte2}`;
  }

  // Caso não se encaixe nos padrões acima, retorna o valor original limpo
  return telefone.trim();
}

/**
 * Aplica máscara progressiva para inputs de texto enquanto o usuário digita
 */
export function aplicarMascaraTelefoneInput(valor: string): string {
  let digitos = valor.replace(/\D/g, '').slice(0, 11);

  if (digitos.length === 0) return '';
  if (digitos.length <= 2) return `(${digitos}`;
  if (digitos.length <= 3) return `(${digitos.slice(0, 2)}) ${digitos.slice(2)}`;
  if (digitos.length <= 7) return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 3)} ${digitos.slice(3)}`;
  return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 3)} ${digitos.slice(3, 7)} - ${digitos.slice(7, 11)}`;
}
