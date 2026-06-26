/**
 * Estrutura de mapeamento estático para Pins de nichos/categorias no mapa.
 * 
 * No React Native, caminhos de imagens locais usando require() não aceitam strings dinâmicas.
 * Portanto, este objeto mapeia estaticamente cada arquivo SVG local na pasta 'assets/Pins/'.
 */
export const MAP_PINS = {
  bebidas: require('../assets/Pins/pin bebidas.svg'),
  bolo: require('../assets/Pins/pin bolo.svg'),
  cachorroQuente: require('../assets/Pins/Pin cachorro-quente.svg'),
  hamburguer: require('../assets/Pins/pin hamburhguer.svg'),
  japa: require('../assets/Pins/Pin japa.svg'),
  padaria: require('../assets/Pins/pin padaria.svg'),
  pastelSalgado: require('../assets/Pins/pin pastel-salgado.svg'),
  pizza: require('../assets/Pins/pin pizza.svg'),
  sorvete: require('../assets/Pins/pin sorvete.svg'),
  outros: require('../assets/Pins/pin outros.svg'),
} as const;

/**
 * Normaliza uma string removendo acentos, convertendo para minúsculas e limpando espaços.
 */
const normalizeText = (text: string): string => {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos/diacríticos
    .toLowerCase()
    .trim();
};

/**
 * Seleciona automaticamente o PIN correto com base no nicho/categoria fornecido.
 * Possui regras de negócio flexíveis e fallback para uma imagem padrão ('outros').
 * 
 * @param niche Nome da categoria, emoji ou palavra-chave identificadora do nicho.
 * @returns O recurso de imagem importado estaticamente via require().
 */
export function getMapPin(niche: string | null | undefined): any {
  if (!niche) {
    return MAP_PINS.outros;
  }

  const normalized = normalizeText(niche);

  // Regras de mapeamento flexíveis baseadas em palavras-chave e emojis
  if (
    normalized.includes('bebida') ||
    normalized.includes('suco') ||
    normalized.includes('refrigerante') ||
    normalized.includes('cerveja') ||
    normalized.includes('drink') ||
    normalized.includes('adega') ||
    normalized.includes('🥤')
  ) {
    return MAP_PINS.bebidas;
  }

  if (
    normalized.includes('doce') ||
    normalized.includes('bolo') ||
    normalized.includes('confeitaria') ||
    normalized.includes('sobremesa') ||
    normalized.includes('chocolate') ||
    normalized.includes('doceria') ||
    normalized.includes('🍰') ||
    normalized.includes('🍫') ||
    normalized.includes('🍩')
  ) {
    return MAP_PINS.bolo;
  }

  if (
    normalized.includes('cachorro-quente') ||
    normalized.includes('cachorro quente') ||
    normalized.includes('hotdog') ||
    normalized.includes('hot dog') ||
    normalized.includes('dog') ||
    normalized.includes('🌭')
  ) {
    return MAP_PINS.cachorroQuente;
  }

  if (
    normalized.includes('hamburguer') ||
    normalized.includes('burguer') ||
    normalized.includes('burger') ||
    normalized.includes('hamburhguer') ||
    normalized.includes('🍔')
  ) {
    return MAP_PINS.hamburguer;
  }

  if (
    normalized.includes('japa') ||
    normalized.includes('japonesa') ||
    normalized.includes('sushi') ||
    normalized.includes('temaki') ||
    normalized.includes('sashimi') ||
    normalized.includes('yakisoba') ||
    normalized.includes('oriental') ||
    normalized.includes('🍣')
  ) {
    return MAP_PINS.japa;
  }

  if (
    normalized.includes('padaria') ||
    normalized.includes('pao') ||
    normalized.includes('paes') ||
    normalized.includes('pão') ||
    normalized.includes('cafe') ||
    normalized.includes('café') ||
    normalized.includes('panificadora') ||
    normalized.includes('🍞') ||
    normalized.includes('☕')
  ) {
    return MAP_PINS.padaria;
  }

  if (
    normalized.includes('pastel-salgado') ||
    normalized.includes('pastel salgado') ||
    normalized.includes('salgado') ||
    normalized.includes('salgados') ||
    normalized.includes('coxinha') ||
    normalized.includes('pastel') ||
    normalized.includes('pasteis') ||
    normalized.includes('empada') ||
    normalized.includes('fritura') ||
    normalized.includes('🥟')
  ) {
    return MAP_PINS.pastelSalgado;
  }

  if (
    normalized.includes('pizza') ||
    normalized.includes('pizzaria') ||
    normalized.includes('🍕')
  ) {
    return MAP_PINS.pizza;
  }

  if (
    normalized.includes('sorvete') ||
    normalized.includes('gelado') ||
    normalized.includes('acai') ||
    normalized.includes('açaí') ||
    normalized.includes('ice cream') ||
    normalized.includes('🍦') ||
    normalized.includes('🍨')
  ) {
    return MAP_PINS.sorvete;
  }

  // Fallback padrão se não encontrar nenhuma correspondência
  return MAP_PINS.outros;
}
