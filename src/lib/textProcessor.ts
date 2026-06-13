export interface WordData {
  text: string;
  before: string;
  orp: string;
  after: string;
  delayFactor: number;
}

export function calculateORP(word: string): WordData {
  const cleanWord = word.trim();
  const len = cleanWord.length;
  
  let orpIndex = 0;
  if (len > 1) {
    if (len <= 5) orpIndex = 1;
    else if (len <= 9) orpIndex = 2;
    else if (len <= 13) orpIndex = 3;
    else orpIndex = 4;
  }

  // Factor de retraso simple según signos de puntuación (ayuda a la comprensión natural)
  let delayFactor = 1.0;
  if (/[.!?]$/.test(cleanWord)) delayFactor = 2.2;
  else if (/,$/.test(cleanWord)) delayFactor = 1.6;
  else if (/[:;]$/.test(cleanWord)) delayFactor = 1.4;

  return {
    text: cleanWord,
    before: cleanWord.slice(0, orpIndex),
    orp: cleanWord[orpIndex] || '',
    after: cleanWord.slice(orpIndex + 1),
    delayFactor
  };
}

export function prepareRSVPText(text: string): WordData[] {
  // Ignora espacios en blanco múltiples y retornos de carro
  return text.trim().split(/\s+/).filter(w => w.length > 0).map(calculateORP);
}
