"use client";

import React, { useMemo, useRef, useState } from 'react';
import { prepareRSVPText } from '../../lib/textProcessor';
import { useRSVPEngine } from '../../hooks/useRSVPEngine';
import { Play, Pause, RotateCcw } from 'lucide-react';

interface RSVPDisplayProps {
  rawText: string;
  wpm: number;
  useDyslexicFont?: boolean;
  onFinished?: (finalIndex: number) => void;
}

export const RSVPDisplay: React.FC<RSVPDisplayProps> = ({ 
  rawText, 
  wpm, 
  useDyslexicFont = false,
  onFinished 
}) => {
  const words = useMemo(() => prepareRSVPText(rawText), [rawText]);
  const [progress, setProgress] = useState(0);
  
  // Refs del DOM para actualizaciones ultrarrápidas
  const beforeRef = useRef<HTMLSpanElement>(null);
  const orpRef = useRef<HTMLSpanElement>(null);
  const afterRef = useRef<HTMLSpanElement>(null);

  const { isPlaying, play, pause, reset, getCurrentIndex } = useRSVPEngine({
    words,
    wpm,
    beforeRef,
    orpRef,
    afterRef,
    onProgress: setProgress,
    onComplete: () => {
      setProgress(100);
      if (onFinished) onFinished(getCurrentIndex());
    }
  });

  return (
    <div className={`flex flex-col items-center justify-center w-full max-w-lg mx-auto p-6 md:p-8 bg-surface rounded-3xl shadow-sm border border-border-soft ${useDyslexicFont ? "font-dyslexic" : "font-sans"}`}>
      
      {/* Top Header stats */}
      <div className="w-full flex justify-between text-xs text-gray-500 font-sans uppercase tracking-wider mb-4 font-semibold">
        <span>Velocidad: {wpm} WPM</span>
        <span>Progreso: {Math.round(progress)}%</span>
      </div>

      {/* Marco de Enfoque Minimalista */}
      <div className="relative flex items-center justify-center w-full h-32 md:h-40 border-y-2 border-border-soft my-4 overflow-hidden bg-background rounded-lg shadow-inner">
        
        {/* Guías visuales de alineación central */}
        <div className="absolute top-0 w-[2px] h-3 bg-focus/40 left-[35%] -translate-x-1/2 rounded-full" />
        <div className="absolute bottom-0 w-[2px] h-3 bg-focus/40 left-[35%] -translate-x-1/2 rounded-full" />
        
        {/* Contenedor del texto RSVP */}
        <div className="flex text-3xl md:text-5xl text-foreground w-full px-4 items-center">
          {/* Lado Izquierdo (Alineado a la derecha, finaliza en el 35%) */}
          <span 
            ref={beforeRef} 
            className="w-[35%] text-right whitespace-pre select-none tracking-wide" 
          />
          {/* ORP (Letra clave roja en punto fijo) */}
          <span 
            ref={orpRef} 
            className="text-focus font-bold select-none" 
          />
          {/* Lado Derecho (Alineado a la izquierda) */}
          <span 
            ref={afterRef} 
            className="w-[65%] text-left whitespace-pre select-none tracking-wide" 
          />
        </div>
      </div>

      {/* ProgressBar */}
      <div className="w-full h-1.5 bg-border-soft rounded-full overflow-hidden mb-8 mt-2">
        <div 
          className="h-full bg-foreground transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Controles Táctiles Integrados */}
      <div className="flex items-center gap-6 w-full justify-center">
        <button
          onClick={reset}
          aria-label="Reiniciar lectura"
          className="p-4 bg-background text-foreground rounded-full active:scale-90 transition-transform shadow-sm border border-border-soft hover:bg-gray-100"
        >
          <RotateCcw size={24} />
        </button>

        <button
          onClick={isPlaying ? pause : play}
          aria-label={isPlaying ? 'Pausar lectura' : 'Iniciar lectura'}
          className="px-10 py-4 bg-foreground text-surface rounded-full font-bold active:scale-95 transition-transform shadow-lg hover:bg-black text-sm flex items-center gap-3 w-48 justify-center"
        >
          {isPlaying ? (
            <>
              <Pause size={20} /> PAUSAR
            </>
          ) : (
            <>
              <Play size={20} /> INICIAR
            </>
          )}
        </button>
      </div>
    </div>
  );
};
