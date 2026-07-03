const fs = require('fs');
const path = require('path');

const pinsDir = path.join(__dirname, 'assets', 'Pins');
const pinsFile = path.join(__dirname, 'constants', 'pins.ts');

const pinFiles = {
  bebidas: 'pin bebidas.svg',
  bolo: 'pin bolo.svg',
  cachorroQuente: 'Pin cachorro-quente.svg',
  hamburguer: 'pin hamburhguer.svg',
  japa: 'Pin japa.svg',
  padaria: 'pin padaria.svg',
  pastelSalgado: 'pin pastel-salgado.svg',
  pizza: 'pin pizza.svg',
  sorvete: 'pin sorvete.svg',
  outros: 'pin outros.svg',
};

let mapPinsContent = 'export const MAP_PINS = {\n';

for (const [key, filename] of Object.entries(pinFiles)) {
  const filePath = path.join(pinsDir, filename);
  if (!fs.existsSync(filePath)) {
    console.error(`Error: file not found: ${filePath}`);
    process.exit(1);
  }
  const fileBuffer = fs.readFileSync(filePath);
  const base64 = fileBuffer.toString('base64');
  mapPinsContent += `  ${key}: 'data:image/svg+xml;base64,${base64}',\n`;
}

mapPinsContent += '} as const;\n\n';

const extraFunctions = `/**
 * Normaliza uma string removendo acentos, convertendo para minúsculas e limpando espaços.
 */
const normalizeText = (text: string): string => {
  return text
    .normalize('NFD')
    .replace(/[\\u0300-\\u036f]/g, '') // Remove acentos/diacríticos
    .toLowerCase()
    .trim();
};

/**
 * Seleciona automaticamente o PIN correto com base no nicho/categoria fornecido.
 * Possui regras de negócio flexíveis e fallback para uma imagem padrão ('outros').
 * 
 * @param niche Nome da categoria, emoji ou palavra-chave identificadora do nicho.
 * @returns O recurso de imagem importado estaticamente via require() ou string base64.
 */
export function getMapPin(niche: string | null | undefined): string {
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
`;

fs.writeFileSync(pinsFile, mapPinsContent + extraFunctions);
console.log('constants/pins.ts successfully updated with base64 encoded SVGs!');
