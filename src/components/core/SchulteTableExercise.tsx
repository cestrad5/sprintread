"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useProgressStore } from '../../store/useProgressStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import { useRouter } from 'next/navigation';
import { Check, X, Play, RotateCcw, Award, Grid3X3, ArrowRight } from 'lucide-react';

interface SchulteTableExerciseProps {
  userId: string;
  lesson: {
    id: string;
    title: string;
    description: string;
  };
}

const WARMUP_WORDS = [
  'luz', 'sol', 'mar', 'gas', 'paz', 'ver', 'dar', 'ser',
  'casa', 'vida', 'amor', 'alma', 'gato', 'perro', 'libro',
  'mente', 'saber', 'campo', 'fuego', 'cielo', 'tiempo',
  'vision', 'rapido', 'lectura', 'cerebro', 'enfoque'
];

export function SchulteTableExercise({ userId, lesson }: SchulteTableExerciseProps) {
  const router = useRouter();
  const { saveSession } = useProgressStore();
  const { useDyslexicFont } = useSettingsStore();

  const isAdvanced = lesson.id === 'M2L3';
  const gridSize = isAdvanced ? 6 : 5; // 6x6 for M2L3, 5x5 for M1L5
  const maxNumber = gridSize * gridSize;

  const [step, setStep] = useState<'intro' | 'schulte' | 'rest' | 'peripheral' | 'results'>('intro');
  const [round, setRound] = useState<number>(1);
  const [grid, setGrid] = useState<number[]>([]);
  const [nextExpected, setNextExpected] = useState<number>(1);
  const [incorrectFlashIdx, setIncorrectFlashIdx] = useState<number | null>(null);
  const [correctFlashIdx, setCorrectFlashIdx] = useState<number | null>(null);

  // Timer
  const [elapsedMs, setElapsedMs] = useState<number>(0);
  const timerRef = useRef<any>(null);
  const roundTimes = useRef<number[]>([]);

  // Peripheral flashing (for M2L3)
  const [peripheralTrial, setPeripheralTrial] = useState<number>(1);
  const [flashWord, setFlashWord] = useState<string>('');
  const [wordOffsetLeft, setWordOffsetLeft] = useState<boolean>(true); // Left or right side
  const [showFlashedWord, setShowFlashedWord] = useState<boolean>(false);
  const [verificationOptions, setVerificationOptions] = useState<string[]>([]);
  const [selectedWordOption, setSelectedWordOption] = useState<string | null>(null);
  const [peripheralScore, setPeripheralScore] = useState<number>(0);
  const [isWordAnswered, setIsWordAnswered] = useState<boolean>(false);
  const [showFlashOverlay, setShowFlashOverlay] = useState<boolean>(false);

  // Generate shuffled grid
  const generateGrid = () => {
    const numbers = Array.from({ length: maxNumber }, (_, i) => i + 1);
    // Shuffle
    for (let i = numbers.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [numbers[i], numbers[j]] = [numbers[j], numbers[i]];
    }
    setGrid(numbers);
    setNextExpected(1);
  };

  const startSchulte = () => {
    generateGrid();
    setStep('schulte');
    setElapsedMs(0);
    const startTime = performance.now();
    
    timerRef.current = setInterval(() => {
      setElapsedMs(Math.round(performance.now() - startTime));
    }, 10);
  };

  const handleCellClick = (num: number, idx: number) => {
    if (num === nextExpected) {
      setCorrectFlashIdx(idx);
      setTimeout(() => setCorrectFlashIdx(null), 250);
      
      // Haptic feedback for correct tap
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(20);
      }

      if (num === maxNumber) {
        // Round complete
        clearInterval(timerRef.current);
        const timeSec = elapsedMs / 1000;
        roundTimes.current.push(timeSec);

        if (round < 3) {
          setStep('rest');
        } else if (isAdvanced) {
          setStep('peripheral');
          setPeripheralTrial(1);
          setPeripheralScore(0);
          preparePeripheralTrial();
        } else {
          setStep('results');
        }
      } else {
        setNextExpected(prev => prev + 1);
      }
    } else {
      setIncorrectFlashIdx(idx);
      setTimeout(() => setIncorrectFlashIdx(null), 300);
      
      // Error haptic
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(60);
      }
    }
  };

  // Rest timer (Breathing exercise)
  const [restSeconds, setRestSeconds] = useState(15);
  useEffect(() => {
    if (step !== 'rest') return;

    setRestSeconds(15);
    const interval = setInterval(() => {
      setRestSeconds(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          setRound(r => r + 1);
          startSchulte();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [step]);

  // Peripheral reading trial prep
  const preparePeripheralTrial = () => {
    setIsWordAnswered(false);
    setSelectedWordOption(null);
    setShowFlashedWord(false);
    setShowFlashOverlay(true);

    const randomWord = WARMUP_WORDS[Math.floor(Math.random() * WARMUP_WORDS.length)];
    setFlashWord(randomWord);

    // Pick a foil word
    let foil = WARMUP_WORDS[Math.floor(Math.random() * WARMUP_WORDS.length)];
    while (foil === randomWord) {
      foil = WARMUP_WORDS[Math.floor(Math.random() * WARMUP_WORDS.length)];
    }

    setWordOffsetLeft(Math.random() > 0.5);
    setVerificationOptions(Math.random() > 0.5 ? [randomWord, foil] : [foil, randomWord]);
  };

  const triggerPeripheralFlash = () => {
    setShowFlashOverlay(false);
    
    // Brief delay, then flash the word for 600ms
    setTimeout(() => {
      setShowFlashedWord(true);
      setTimeout(() => {
        setShowFlashedWord(false);
      }, 600);
    }, 500);
  };

  const answerPeripheralWord = (word: string) => {
    setIsWordAnswered(true);
    setSelectedWordOption(word);
    
    const isCorrect = word === flashWord;
    if (isCorrect) setPeripheralScore(prev => prev + 1);

    setTimeout(() => {
      if (peripheralTrial < 8) {
        setPeripheralTrial(prev => prev + 1);
        preparePeripheralTrial();
      } else {
        setStep('results');
      }
    }, 1500);
  };

  const avgSchulteTime = React.useMemo(() => {
    if (roundTimes.current.length === 0) return 0;
    return roundTimes.current.reduce((a, b) => a + b, 0) / roundTimes.current.length;
  }, [step]);

  // Save session when results load
  useEffect(() => {
    if (step === 'results') {
      // Calculate visual efficiency score
      // A typical Schulte 5x5 in < 45s is good. WPM equivalent is simulated.
      const targetTime = isAdvanced ? 55 : 45;
      const scorePercentage = Math.round((targetTime / Math.max(20, avgSchulteTime)) * 100);
      
      const estimatedWpm = isAdvanced 
        ? Math.round(350 + (55 - avgSchulteTime) * 8)
        : Math.round(240 + (45 - avgSchulteTime) * 6);

      saveSession(userId, {
        lessonId: lesson.id,
        wpm: Math.max(150, Math.min(600, estimatedWpm)),
        wpm_peak: Math.max(150, Math.min(600, estimatedWpm)),
        comprehension: isAdvanced 
          ? Math.round((peripheralScore / 8) * 100) 
          : Math.min(100, scorePercentage), // Using efficiency percentage as comprehension indicator for M1L5
        regressions: 0,
        duration: Math.round(roundTimes.current.reduce((a, b) => a + b, 0)),
        deviceType: window.innerWidth < 768 ? 'mobile' : 'desktop'
      });
    }
  }, [step]);

  return (
    <div className={`w-full max-w-xl mx-auto bg-surface p-6 md:p-8 rounded-3xl border border-border-soft shadow-sm ${useDyslexicFont ? 'font-dyslexic' : ''}`}>
      
      {/* INTRO SCREEN */}
      {step === 'intro' && (
        <div className="flex flex-col items-center text-center py-6">
          <div className="w-16 h-16 bg-red-50 text-focus rounded-full flex items-center justify-center mb-6">
            <Grid3X3 size={32} />
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight mb-3">
            {lesson.title}
          </h2>
          <p className="text-gray-500 mb-6 max-w-md text-sm leading-relaxed">
            {lesson.id === 'M1L5'
              ? 'Las tablas de Schulte entrenan tu span visual y visión periférica. Mantén la mirada fija en el punto central y presiona los números del 1 al 25 en orden lo más rápido posible.'
              : 'Schulte Avanzado (Tabla 6x6 hasta 36) y entrenamiento periférico. Completa la rejilla sin mover la vista del centro. Luego realizaremos un test de reconocimiento visual periférico.'}
          </p>

          <div className="bg-background border border-border-soft p-4 rounded-2xl w-full max-w-sm mb-8 text-left text-xs leading-relaxed text-gray-500 flex flex-col gap-1.5">
            <span className="font-bold text-foreground">💡 Reglas de Oro:</span>
            <span>1. <span className="font-bold text-focus">NO MUEVAS LOS OJOS</span> del punto rojo central.</span>
            <span>2. Usa tu visión periférica lateral para buscar el siguiente número.</span>
            <span>3. Completaremos 3 rondas en total.</span>
          </div>

          <button
            onClick={startSchulte}
            className="px-8 py-3.5 bg-foreground text-surface rounded-xl font-bold text-sm shadow-md hover:bg-black transition-all active:scale-95 flex items-center gap-2"
          >
            Comenzar Ronda 1 <ArrowRight size={16} />
          </button>
        </div>
      )}

      {/* SCHULTE GRID SCREEN */}
      {step === 'schulte' && (
        <div className="flex flex-col items-center select-none">
          <div className="w-full flex justify-between items-center text-xs text-gray-400 font-bold mb-4 uppercase tracking-wider">
            <span>Ronda {round} de 3</span>
            <span className="font-mono text-base text-foreground">
              {(elapsedMs / 1000).toFixed(2)}s
            </span>
          </div>

          <div className="text-xs text-gray-500 font-semibold mb-6 flex items-center gap-2 bg-background px-3 py-1.5 rounded-full border border-border-soft">
            Buscar número: <span className="text-focus font-extrabold text-sm">{nextExpected}</span>
          </div>

          {/* Schulte Grid Container */}
          <div 
            className="grid gap-2 w-full aspect-square max-w-[360px] bg-background p-3 rounded-2xl border border-border-soft relative shadow-inner"
            style={{ gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))` }}
          >
            {grid.map((num, idx) => {
              const isCenter = gridSize === 5 ? idx === 12 : idx === 20; // Anchor index for red dot
              
              let cellStyle = 'bg-white hover:bg-gray-50 text-foreground border border-border-soft active:scale-95';
              if (idx === correctFlashIdx) {
                cellStyle = 'bg-emerald-500 text-white border-emerald-600 scale-95';
              } else if (idx === incorrectFlashIdx) {
                cellStyle = 'bg-red-500 text-white border-red-600 animate-shake scale-95';
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleCellClick(num, idx)}
                  className={`relative rounded-xl text-center font-bold text-base md:text-lg transition-all flex items-center justify-center font-mono ${cellStyle}`}
                >
                  {num}

                  {/* Fixation target on center cell */}
                  {isCenter && (
                    <div className="absolute w-2 h-2 bg-focus rounded-full shadow-xs pointer-events-none top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* REST SCREEN */}
      {step === 'rest' && (
        <div className="flex flex-col items-center text-center py-12 select-none">
          <div className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-6">
            Calibración de Enfoque y Respiración
          </div>
          
          {/* Calming expanding/contracting breathing animation */}
          <div className="relative w-40 h-40 flex items-center justify-center mb-8">
            <div className="absolute inset-0 bg-indigo-100 rounded-full animate-ping opacity-30" />
            <div className="absolute w-28 h-28 bg-indigo-50 border border-indigo-200 rounded-full animate-breath flex flex-col items-center justify-center text-indigo-800 text-xs font-bold shadow-sm">
              {restSeconds > 7 ? 'Inhala' : 'Exhala'}
            </div>
          </div>

          <h3 className="text-lg font-bold text-foreground">Siguiente ronda en {restSeconds}s</h3>
          <p className="text-xs text-gray-400 mt-2 max-w-xs leading-relaxed">
            Mantén la calma, reduce el parpadeo y relaja los músculos oculares.
          </p>
        </div>
      )}

      {/* PERIPHERAL TEST SCREEN */}
      {step === 'peripheral' && (
        <div className="flex flex-col items-center text-center py-6 select-none">
          <div className="w-full flex justify-between items-center text-xs text-gray-400 font-bold mb-8 uppercase tracking-wider">
            <span>Test Periférico (M2L3)</span>
            <span>Intento {peripheralTrial} de 8</span>
          </div>

          <div className="text-sm font-semibold mb-6">
            Mantén tu mirada fija en el punto central y confirma la palabra que aparezca
          </div>

          {/* Flash container */}
          <div className="relative w-full h-40 border border-border-soft bg-background rounded-2xl flex items-center justify-center overflow-hidden mb-8">
            {/* Center anchor point */}
            <div className="w-2.5 h-2.5 bg-focus rounded-full z-10 shadow-sm" />

            {/* Flipped word (Flashes 180px left or right) */}
            {showFlashedWord && (
              <div 
                className="absolute text-sm md:text-base font-extrabold text-foreground tracking-wide bg-white border border-border-soft px-3 py-1 rounded-lg shadow-md animate-fade-in"
                style={{
                  left: wordOffsetLeft ? 'calc(50% - 160px)' : 'auto',
                  right: !wordOffsetLeft ? 'calc(50% - 160px)' : 'auto',
                }}
              >
                {flashWord}
              </div>
            )}

            {/* Click to start flashing helper overlay */}
            {showFlashOverlay && (
              <button
                onClick={triggerPeripheralFlash}
                className="absolute inset-0 bg-white/70 backdrop-blur-xs flex items-center justify-center font-bold text-xs text-indigo-700 tracking-wider"
              >
                Toca aquí para parpadear palabra
              </button>
            )}
          </div>

          {/* Verification buttons */}
          {!showFlashOverlay && (
            <div className="w-full max-w-xs">
              <div className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-4">
                ¿Qué palabra apareció?
              </div>
              <div className="flex flex-col gap-3">
                {verificationOptions.map((opt, idx) => {
                  const isSelected = selectedWordOption === opt;
                  const isCorrect = opt === flashWord;

                  let style = 'border-border-soft hover:bg-gray-50 bg-white';
                  if (isWordAnswered) {
                    if (isCorrect) {
                      style = 'border-emerald-500 bg-emerald-50 text-emerald-800';
                    } else if (isSelected) {
                      style = 'border-red-500 bg-red-50 text-red-800';
                    }
                  }

                  return (
                    <button
                      key={idx}
                      onClick={() => answerPeripheralWord(opt)}
                      disabled={isWordAnswered}
                      className={`w-full p-4 border rounded-2xl text-center text-sm font-bold transition-all flex items-center justify-center gap-2 active:scale-98 ${style}`}
                    >
                      {opt}
                      {isWordAnswered && isCorrect && <Check size={14} className="text-emerald-600" />}
                      {isWordAnswered && isSelected && !isCorrect && <X size={14} className="text-red-600" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* RESULTS SCREEN */}
      {step === 'results' && (
        <div className="flex flex-col items-center text-center py-6">
          <div className="w-16 h-16 bg-red-50 text-focus rounded-full flex items-center justify-center mb-6 text-xl">
            🏆
          </div>

          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight mb-2">
            ¡Entrenamiento Terminado!
          </h2>
          <p className="text-gray-500 text-sm max-w-xs mx-auto mb-8">
            Aquí están tus estadísticas promedio de la sesión.
          </p>

          <div className="grid grid-cols-2 gap-8 w-full max-w-md bg-background border border-border-soft p-6 rounded-2xl mb-8">
            <div className="flex flex-col items-center border-r border-border-soft">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Tiempo Schulte Promedio</span>
              <span className="text-3xl font-black text-foreground mt-2">{avgSchulteTime.toFixed(1)}s</span>
              <span className="text-xs text-gray-500 font-semibold mt-1">por ronda</span>
            </div>

            <div className="flex flex-col items-center">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                {isAdvanced ? 'Precisión Periférica' : 'Eficiencia Visual'}
              </span>
              <span className="text-3xl font-black text-foreground mt-2">
                {isAdvanced ? `${Math.round((peripheralScore / 8) * 100)}%` : `${Math.round((45 / avgSchulteTime) * 100)}%`}
              </span>
              <span className="text-xs text-gray-500 font-semibold mt-1">
                {isAdvanced ? `${peripheralScore} de 8 aciertos` : 'del objetivo (45s)'}
              </span>
            </div>
          </div>

          <button
            onClick={() => router.push('/')}
            className="px-8 py-3.5 bg-foreground text-surface rounded-xl font-bold text-sm shadow-md hover:bg-black transition-all active:scale-95"
          >
            Volver al Dashboard
          </button>
        </div>
      )}

    </div>
  );
}
