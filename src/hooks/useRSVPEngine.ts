import { useEffect, useRef, useState, useCallback } from 'react';
import { WordData } from '../lib/textProcessor';

interface RSVPEngineProps {
  words: WordData[];
  wpm: number;
  beforeRef: React.RefObject<HTMLSpanElement | null>;
  orpRef: React.RefObject<HTMLSpanElement | null>;
  afterRef: React.RefObject<HTMLSpanElement | null>;
  onComplete?: () => void;
  onProgress?: (progress: number) => void;
}

export function useRSVPEngine({
  words,
  wpm,
  beforeRef,
  orpRef,
  afterRef,
  onComplete,
  onProgress
}: RSVPEngineProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const indexRef = useRef(0);
  const isPlayingRef = useRef(false);
  const requestRef = useRef<number>(undefined);
  const lastTimeRef = useRef<number>(0);
  
  // Actualiza la palabra directamente en el DOM para evitar re-renders de React
  const updateDOM = useCallback((word: WordData) => {
    if (beforeRef.current) beforeRef.current.textContent = word.before;
    if (orpRef.current) orpRef.current.textContent = word.orp;
    if (afterRef.current) afterRef.current.textContent = word.after;
  }, [beforeRef, orpRef, afterRef]);

  const animate = useCallback((timestamp: number) => {
    if (!isPlayingRef.current) return;

    if (!lastTimeRef.current) lastTimeRef.current = timestamp;
    
    const currentIndex = indexRef.current;
    if (currentIndex >= words.length) {
      setIsPlaying(false);
      isPlayingRef.current = false;
      onComplete?.();
      return;
    }

    const currentWord = words[currentIndex];
    const baseMsPerWord = 60000 / wpm;
    const wordDuration = baseMsPerWord * currentWord.delayFactor;

    if (timestamp - lastTimeRef.current >= wordDuration) {
      updateDOM(currentWord);
      indexRef.current += 1;
      lastTimeRef.current = timestamp;
      
      // Update progress occasionally (e.g. every 10 words) to avoid jank
      if (indexRef.current % 10 === 0 && onProgress) {
        onProgress((indexRef.current / words.length) * 100);
      }
    }

    requestRef.current = requestAnimationFrame(animate);
  }, [words, wpm, updateDOM, onComplete, onProgress]);

  const play = useCallback(() => {
    if (indexRef.current >= words.length) {
      indexRef.current = 0;
    }
    setIsPlaying(true);
    isPlayingRef.current = true;
    lastTimeRef.current = 0;
    requestRef.current = requestAnimationFrame(animate);
  }, [words.length, animate]);

  const pause = useCallback(() => {
    setIsPlaying(false);
    isPlayingRef.current = false;
    if (requestRef.current) cancelAnimationFrame(requestRef.current);
  }, []);

  const reset = useCallback(() => {
    pause();
    indexRef.current = 0;
    if (words.length > 0) {
      updateDOM(words[0]);
    }
    if (onProgress) onProgress(0);
  }, [words, pause, updateDOM, onProgress]);

  // Sincronizar el estado inicial al montar o cambiar de texto
  useEffect(() => {
    if (words.length > 0 && indexRef.current === 0) {
      updateDOM(words[0]);
    }
  }, [words, updateDOM]);

  return {
    isPlaying,
    play,
    pause,
    reset,
    getCurrentIndex: () => indexRef.current
  };
}
