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

export function prepareRSVPChunks(text: string, chunkSize: number): WordData[] {
  const words = text.trim().split(/\s+/).filter(w => w.length > 0);
  if (words.length === 0) return [];
  
  const chunks: string[][] = [];
  let currentChunk: string[] = [];

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    currentChunk.push(word);

    // Si la palabra termina en puntuación o el bloque alcanza el tamaño límite, lo guardamos
    const hasPunctuation = /[.!?,,;:]$/.test(word);
    if (currentChunk.length === chunkSize || hasPunctuation || i === words.length - 1) {
      chunks.push(currentChunk);
      currentChunk = [];
    }
  }

  return chunks.map(chunk => {
    // Elegimos la palabra central del bloque para calcular el ORP
    const orpWordIndex = Math.min(Math.floor(chunk.length / 2), chunk.length - 1);
    
    const beforeWords = chunk.slice(0, orpWordIndex).join(' ');
    const orpWord = chunk[orpWordIndex];
    const afterWords = chunk.slice(orpWordIndex + 1).join(' ');

    const orpWordData = calculateORP(orpWord);

    // Combinamos las palabras anteriores y posteriores alrededor del ORP de la palabra seleccionada
    const beforeText = beforeWords ? beforeWords + ' ' + orpWordData.before : orpWordData.before;
    const afterText = afterWords ? orpWordData.after + ' ' + afterWords : orpWordData.after;

    // Determinamos el factor de retraso basado en los signos de puntuación del bloque
    let delayFactor = 1.0;
    chunk.forEach(w => {
      if (/[.!?]$/.test(w)) delayFactor = Math.max(delayFactor, 2.2);
      else if (/,$/.test(w)) delayFactor = Math.max(delayFactor, 1.6);
      else if (/[:;]$/.test(w)) delayFactor = Math.max(delayFactor, 1.4);
    });

    return {
      text: chunk.join(' '),
      before: beforeText,
      orp: orpWordData.orp,
      after: afterText,
      delayFactor
    };
  });
}
