"use client";

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { LessonText } from '../../lib/lessonContent';
import { useProgressStore } from '../../store/useProgressStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import { useRouter } from 'next/navigation';
import { Check, X, Play, Pause, RotateCcw, AlertTriangle, ArrowRight, EyeOff } from 'lucide-react';

interface PacingExerciseProps {
  userId: string;
  lesson: {
    id: string;
    title: string;
    description: string;
  };
  text: LessonText;
  mode?: 'practice' | 'scored';
}

interface LineData {
  words: { element: HTMLSpanElement; index: number; word: string }[];
  offsetTop: number;
  height: number;
}

export function PacingExercise({ userId, lesson, text, mode = 'scored' }: PacingExerciseProps) {
  const router = useRouter();
  const { saveSession } = useProgressStore();
  const { useDyslexicFont, wpm: savedWpm, setWpm: saveGlobalWpm } = useSettingsStore();

  const [step, setStep] = useState<'intro' | 'reading' | 'quiz' | 'results'>('intro');
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [wpm, setWpm] = useState<number>(savedWpm || 300);
  
  // Reading state
  const [activeLineIndex, setActiveLineIndex] = useState<number>(0);
  const [lines, setLines] = useState<LineData[]>([]);
  const [regressionsCount, setRegressionsCount] = useState<number>(0);
  const [emergencyUses, setEmergencyUses] = useState<number>(2);
  const [showEmergencyText, setShowEmergencyText] = useState<boolean>(false);
  
  // Timer state
  const startTimeRef = useRef<number>(0);
  const totalReadTimeRef = useRef<number>(0);
  
  // Quiz state
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [answers, setAnswers] = useState<boolean[]>([]);
  const [isAnswered, setIsAnswered] = useState<boolean>(false);
  const [correctAnswersCount, setCorrectAnswersCount] = useState<number>(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const wordsRef = useRef<(HTMLSpanElement | null)[]>([]);
  
  // Settings for specific lessons
  const isRegressionShield = lesson.id === 'M1L3';
  const isPeripheralIndentation = lesson.id === 'M2L4';

  const rawWords = useMemo(() => text.body.trim().split(/\s+/), [text.body]);

  // Group words into lines on mount and resize
  useEffect(() => {
    if (step !== 'reading') return;

    const groupWordsIntoLines = () => {
      const grouped: Record<number, LineData> = {};
      
      wordsRef.current.forEach((span, idx) => {
        if (!span) return;
        const offsetTop = span.offsetTop;
        const height = span.offsetHeight;
        
        if (!grouped[offsetTop]) {
          grouped[offsetTop] = {
            words: [],
            offsetTop,
            height
          };
        }
        
        grouped[offsetTop].words.push({
          element: span,
          index: idx,
          word: rawWords[idx]
        });
      });

      // Sort lines by offsetTop
      const sortedLines = Object.values(grouped).sort((a, b) => a.offsetTop - b.offsetTop);
      setLines(sortedLines);
    };

    // Delay slightly to allow rendering
    const timer = setTimeout(groupWordsIntoLines, 100);

    window.addEventListener('resize', groupWordsIntoLines);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', groupWordsIntoLines);
    };
  }, [step, rawWords]);

  // Pacing logic
  const sweepPercentRef = useRef<number>(0);
  const requestRef = useRef<number | undefined>(undefined);
  const lastTimeRef = useRef<number>(0);

  const animateSweep = (timestamp: number) => {
    if (!isPlaying) return;
    if (!lastTimeRef.current) lastTimeRef.current = timestamp;

    const activeLine = lines[activeLineIndex];
    if (!activeLine) return;

    // Sweep duration for current line = (wordCountInLine / WPM) * 60,000 ms
    const wordsInLine = activeLine.words.length;
    const lineDuration = (wordsInLine / wpm) * 60000;

    const elapsed = timestamp - lastTimeRef.current;
    const progress = (elapsed / lineDuration) * 100;

    const indicator = document.getElementById('pacing-indicator');
    if (indicator) {
      indicator.style.left = `${Math.min(100, progress)}%`;
    }

    if (elapsed >= lineDuration) {
      // Advance to next line
      if (activeLineIndex < lines.length - 1) {
        setActiveLineIndex(prev => prev + 1);
        lastTimeRef.current = timestamp;
        if (indicator) indicator.style.left = '0%';
      } else {
        // Finished reading
        handleFinishedReading();
        return;
      }
    }

    requestRef.current = requestAnimationFrame(animateSweep);
  };

  useEffect(() => {
    if (isPlaying && lines.length > 0) {
      lastTimeRef.current = 0;
      requestRef.current = requestAnimationFrame(animateSweep);
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isPlaying, activeLineIndex, lines, wpm]);

  // Scroll warning detector (For regression shield)
  // Uses direction-based detection to avoid false positives on initial render/autoscroll
  const lastScrollTopRef = useRef<number>(0);
  useEffect(() => {
    if (step !== 'reading' || !isRegressionShield) return;

    // Sync lastScrollTop when the container first mounts or step changes
    if (containerRef.current) {
      lastScrollTopRef.current = containerRef.current.scrollTop;
    }

    const handleScroll = () => {
      if (!containerRef.current || !isPlaying) return;
      const currentScrollTop = containerRef.current.scrollTop;
      const isScrollingUp = currentScrollTop < lastScrollTopRef.current - 5; // 5px threshold to avoid micro-jitter

      // Only count as regression if user actively scrolls UP while reading (not first line)
      if (isScrollingUp && activeLineIndex > 0) {
        setRegressionsCount(prev => prev + 1);
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate([30, 50, 30]);
        }
      }

      lastScrollTopRef.current = currentScrollTop;
    };

    const container = containerRef.current;
    container?.addEventListener('scroll', handleScroll, { passive: true });
    return () => container?.removeEventListener('scroll', handleScroll);
  }, [step, activeLineIndex, isRegressionShield, isPlaying]);

  // Autoscroll to keep active line in center
  useEffect(() => {
    if (step !== 'reading' || lines.length === 0) return;
    const activeLine = lines[activeLineIndex];
    const container = containerRef.current;
    if (activeLine && container) {
      const activeTop = activeLine.offsetTop;
      const containerHeight = container.clientHeight;
      container.scrollTo({
        top: activeTop - containerHeight / 2 + activeLine.height / 2,
        behavior: 'smooth'
      });
    }
  }, [activeLineIndex, lines, step]);

  const startReading = () => {
    setStep('reading');
    setIsPlaying(true);
    startTimeRef.current = performance.now();
  };

  const handleFinishedReading = () => {
    setIsPlaying(false);
    totalReadTimeRef.current = (performance.now() - startTimeRef.current) / 1000;
    setStep(mode === 'practice' ? 'results' : 'quiz');
  };

  const useEmergencyButton = () => {
    if (emergencyUses > 0) {
      setEmergencyUses(prev => prev - 1);
      setShowEmergencyText(true);
      setTimeout(() => setShowEmergencyText(false), 3000); // Show for 3 seconds
    }
  };

  const handleSelectOption = (index: number) => {
    if (isAnswered) return;
    setSelectedOption(index);
  };

  const submitAnswer = () => {
    if (selectedOption === null || isAnswered) return;
    
    const currentQuestion = text.questions[currentQuestionIndex];
    const isCorrect = selectedOption === currentQuestion.correct;
    
    setAnswers([...answers, isCorrect]);
    if (isCorrect) setCorrectAnswersCount(prev => prev + 1);
    setIsAnswered(true);

    setTimeout(() => {
      if (currentQuestionIndex < text.questions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
        setSelectedOption(null);
        setIsAnswered(false);
      } else {
        setStep('results');
      }
    }, 1200);
  };

  // Save session to Firestore (only in scored mode)
  useEffect(() => {
    if (step === 'results' && mode === 'scored') {
      saveGlobalWpm(wpm); // Persist speed preference

      const scorePercentage = Math.round((correctAnswersCount / text.questions.length) * 100);
      saveSession(userId, {
        lessonId: lesson.id,
        wpm: wpm,
        wpm_peak: wpm,
        comprehension: scorePercentage,
        regressions: regressionsCount,
        duration: Math.round(totalReadTimeRef.current),
        deviceType: window.innerWidth < 768 ? 'mobile' : 'desktop'
      });
    }
  }, [step]);

  const scorePercentage = Math.round((correctAnswersCount / text.questions.length) * 100);

  // Peripheral width helpers for indentation exercise (15% margins)
  const isWordOutsideGuides = (element: HTMLSpanElement | null) => {
    if (!element || !containerRef.current) return false;
    const rect = element.getBoundingClientRect();
    const parentRect = containerRef.current.getBoundingClientRect();
    const wordCenter = rect.left + rect.width / 2;
    const guideLeft = parentRect.left + parentRect.width * 0.15;
    const guideRight = parentRect.left + parentRect.width * 0.85;
    return wordCenter < guideLeft || wordCenter > guideRight;
  };

  return (
    <div className={`w-full max-w-2xl mx-auto bg-surface p-6 md:p-8 rounded-3xl border border-border-soft shadow-sm ${useDyslexicFont ? 'font-dyslexic' : ''}`}>
      
      {/* INTRO SCREEN */}
      {step === 'intro' && (
        <div className="flex flex-col items-center text-center py-6">
          <div className="w-16 h-16 bg-red-50 text-focus rounded-full flex items-center justify-center mb-6 text-xl">
            {lesson.id === 'M1L3' ? '🛡️' : isPeripheralIndentation ? '↔️' : '➡️'}
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight mb-3">
            {lesson.title}
          </h2>
          <p className="text-gray-500 mb-6 max-w-md text-sm leading-relaxed">
            {lesson.id === 'M1L2' && 'Un marcador de línea barrerá el texto horizontalmente de izquierda a derecha. Sigue el movimiento con los ojos para mantener una velocidad constante y evitar volver hacia atrás.'}
            {lesson.id === 'M1L3' && 'En esta lección, una máscara opaca tapará todo el texto que ya has leído. Estás obligado a procesar la información en una sola pasada. Evita hacer scroll hacia atrás.'}
            {isPeripheralIndentation && 'Visualiza las líneas guía de los márgenes. Tu mirada debe concentrarse en el centro de la pantalla; tu visión periférica lateral capturará los bordes grises de forma automática.'}
          </p>

          {/* Speed slider */}
          <div className="bg-background border border-border-soft p-5 rounded-2xl w-full max-w-sm mb-8">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 text-center">
              Calibrar Velocidad del Marcador
            </label>
            <input 
              type="range" 
              min="150" 
              max="600" 
              step="10"
              value={wpm} 
              onChange={(e) => setWpm(Number(e.target.value))}
              className="w-full accent-focus"
            />
            <div className="text-lg font-black text-center mt-2">{wpm} WPM</div>
          </div>

          <button
            onClick={startReading}
            className="px-8 py-3.5 bg-foreground text-surface rounded-xl font-bold text-sm shadow-md hover:bg-black transition-all active:scale-95 flex items-center gap-2"
          >
            Iniciar Lectura <ArrowRight size={16} />
          </button>

          {mode === 'practice' && (
            <p className="mt-4 text-[10px] text-gray-400 text-center max-w-xs">
              🏋️ Modo Práctica — Al terminar verás tu velocidad sin quiz de comprensión.
            </p>
          )}
        </div>
      )}

      {/* READING SCREEN */}
      {step === 'reading' && (
        <div className="flex flex-col h-[70vh] relative">
          
          {/* Header Stats */}
          <div className="flex justify-between items-center text-xs text-gray-400 font-bold mb-4 uppercase tracking-wider flex-none">
            <span>{lesson.title}</span>
            <span>{wpm} WPM</span>
          </div>

          {/* Reading container */}
          <div 
            ref={containerRef}
            className="flex-1 overflow-y-auto px-6 relative rounded-2xl border border-border-soft bg-background/50 flex flex-col pt-12 pb-32"
          >
            {/* Visual guides for Indentation */}
            {isPeripheralIndentation && (
              <>
                <div className="absolute top-0 bottom-0 left-[15%] w-px border-l border-dashed border-gray-300 pointer-events-none" />
                <div className="absolute top-0 bottom-0 right-[15%] w-px border-r border-dashed border-gray-300 pointer-events-none" />
              </>
            )}

            {/* Word wrap container */}
            <div className={`relative text-lg md:text-xl leading-relaxed tracking-normal select-none ${useDyslexicFont ? 'font-dyslexic' : 'font-sans'}`}>
              {rawWords.map((word, idx) => {
                // Determine if this word's line is before the active line
                let lineIdx = -1;
                lines.forEach((line, lIdx) => {
                  if (line.words.some(w => w.index === idx)) {
                    lineIdx = lIdx;
                  }
                });

                const isBefore = lineIdx !== -1 && lineIdx < activeLineIndex;
                const isActive = lineIdx === activeLineIndex;
                
                // Style modifiers
                let wordStyle = 'text-foreground';
                
                if (isBefore) {
                  wordStyle = isRegressionShield && !showEmergencyText 
                    ? 'opacity-0 select-none blur-xs pointer-events-none' // Solid block effect
                    : 'opacity-30';
                } else if (isActive) {
                  wordStyle = 'text-foreground font-semibold';
                }

                // Indentation styling
                if (isPeripheralIndentation && !isBefore && wordsRef.current[idx]) {
                  const isOutside = isWordOutsideGuides(wordsRef.current[idx]);
                  if (isOutside) {
                    wordStyle += ' opacity-40 text-gray-400';
                  }
                }

                return (
                  <span 
                    key={idx}
                    ref={el => { wordsRef.current[idx] = el; }}
                    className={`inline-block mr-1.5 transition-all duration-200 ${wordStyle}`}
                  >
                    {word}
                  </span>
                );
              })}

              {/* Pacing Sweeper Line */}
              {lines[activeLineIndex] && (
                <div 
                  className="absolute h-1 bg-focus rounded-full transition-all duration-75 flex items-center"
                  style={{
                    top: `${lines[activeLineIndex].offsetTop + lines[activeLineIndex].height - 2}px`,
                    left: '0px',
                    width: '100%',
                    pointerEvents: 'none'
                  }}
                >
                  <div 
                    id="pacing-indicator"
                    className="h-full bg-focus w-full origin-left rounded-full transition-all"
                    style={{
                      width: '0%',
                      boxShadow: '0 0 8px #E53E3E'
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Fixed Control Bar at Bottom */}
          <div className="flex justify-between items-center p-4 border-t border-border-soft flex-none bg-surface mt-4">
            
            {/* Speed adjuster */}
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setWpm(prev => Math.max(150, prev - 15))}
                className="px-2.5 py-1.5 bg-background border border-border-soft rounded-lg text-xs font-bold"
              >
                -15
              </button>
              <span className="text-xs font-bold text-gray-600 w-16 text-center">{wpm} WPM</span>
              <button 
                onClick={() => setWpm(prev => Math.min(800, prev + 15))}
                className="px-2.5 py-1.5 bg-background border border-border-soft rounded-lg text-xs font-bold"
              >
                +15
              </button>
            </div>

            {/* Emergency trigger for regression shield */}
            {isRegressionShield && (
              <button
                onClick={useEmergencyButton}
                disabled={emergencyUses === 0 || showEmergencyText}
                className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-30 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm active:scale-95"
              >
                <EyeOff size={14} /> Auxilio ({emergencyUses})
              </button>
            )}

            {/* Play/Pause */}
            <div className="flex gap-2">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="px-5 py-2.5 bg-foreground text-surface rounded-xl text-xs font-extrabold flex items-center gap-1.5 shadow-md active:scale-95"
              >
                {isPlaying ? <><Pause size={14} /> Pausar</> : <><Play size={14} fill="currentColor" /> Reanudar</>}
              </button>
            </div>

          </div>

          {/* Red warning overlay for scroll back regressions */}
          {isRegressionShield && regressionsCount > 0 && (
            <div className="absolute top-2 right-2 px-2.5 py-1 bg-red-500 text-white font-bold rounded-lg text-[9px] flex items-center gap-1 animate-bounce">
              <AlertTriangle size={10} /> Intentos Regresión: {regressionsCount}
            </div>
          )}
        </div>
      )}

      {/* QUIZ SCREEN */}
      {step === 'quiz' && (
        <div className="py-4">
          <div className="flex justify-between items-center text-xs text-gray-400 font-bold mb-6 uppercase tracking-wider">
            <span>Cuestionario de Comprensión</span>
            <span>Pregunta {currentQuestionIndex + 1} de {text.questions.length}</span>
          </div>

          <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden mb-8">
            <div 
              className="h-full bg-foreground transition-all duration-300" 
              style={{ width: `${((currentQuestionIndex) / text.questions.length) * 100}%` }} 
            />
          </div>

          <h3 className="text-lg md:text-xl font-extrabold tracking-tight mb-6">
            {text.questions[currentQuestionIndex].question}
          </h3>

          <div className="flex flex-col gap-3">
            {text.questions[currentQuestionIndex].options.map((option, idx) => {
              const isSelected = selectedOption === idx;
              const isCorrectAnswer = idx === text.questions[currentQuestionIndex].correct;
              
              let optionStyle = 'border-border-soft hover:bg-gray-50 bg-white';
              if (isSelected) {
                if (isAnswered) {
                  optionStyle = isCorrectAnswer 
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-800' 
                    : 'border-red-500 bg-red-50 text-red-800';
                } else {
                  optionStyle = 'border-foreground bg-gray-50 font-semibold';
                }
              } else if (isAnswered && isCorrectAnswer) {
                optionStyle = 'border-emerald-500 bg-emerald-50 text-emerald-800';
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleSelectOption(idx)}
                  disabled={isAnswered}
                  className={`w-full p-4 border rounded-2xl text-left text-sm font-medium transition-all flex items-center justify-between gap-4 active:scale-99 ${optionStyle}`}
                >
                  <span>{option}</span>
                  {isAnswered && isCorrectAnswer && <Check size={16} className="text-emerald-600 flex-none" />}
                  {isAnswered && isSelected && !isCorrectAnswer && <X size={16} className="text-red-600 flex-none" />}
                </button>
              );
            })}
          </div>

          <div className="mt-8 flex justify-end">
            <button
              onClick={submitAnswer}
              disabled={selectedOption === null || isAnswered}
              className="px-6 py-3 bg-foreground hover:bg-black text-surface text-xs font-bold rounded-xl transition-colors disabled:opacity-30"
            >
              Confirmar Respuesta
            </button>
          </div>
        </div>
      )}

      {/* RESULTS SCREEN */}
      {step === 'results' && (
        <div className="flex flex-col items-center text-center py-6">
          <div className="w-16 h-16 bg-red-50 text-focus rounded-full flex items-center justify-center mb-6 text-xl">
            {mode === 'practice' ? '🏋️' : '🏆'}
          </div>

          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight mb-2">
            {mode === 'practice' ? '¡Práctica Completada!' : '¡Ejercicio Completado!'}
          </h2>
          <p className="text-gray-500 text-sm max-w-xs mx-auto mb-8">
            {mode === 'practice' ? 'Tu velocidad de lectura en este recorrido.' : 'Aquí están tus estadísticas de rendimiento.'}
          </p>

          <div className={`grid gap-8 w-full max-w-md bg-background border border-border-soft p-6 rounded-2xl mb-8 ${mode === 'practice' ? 'grid-cols-1' : 'grid-cols-2'}`}>
            <div className="flex flex-col items-center">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Velocidad</span>
              <span className="text-4xl font-black text-foreground mt-2">{wpm}</span>
              <span className="text-xs text-gray-500 font-semibold mt-1">WPM</span>
            </div>

            {mode === 'scored' && (
              <div className="flex flex-col items-center border-l border-border-soft">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Comprensión</span>
                <span className="text-4xl font-black text-foreground mt-2">{scorePercentage}%</span>
                <span className="text-xs text-gray-500 font-semibold mt-1">
                  {correctAnswersCount} de {text.questions.length} correctas
                </span>
              </div>
            )}
          </div>

          {isRegressionShield && (
            <div className="mb-6 text-xs text-gray-500">
              🚫 Intentos de regresión bloqueados: <span className={`font-bold ${regressionsCount > 0 ? "text-focus" : "text-emerald-600"}`}>{regressionsCount}</span>
            </div>
          )}

          <div className="flex gap-3">
            {mode === 'practice' && (
              <button
                onClick={() => { setStep('intro'); setActiveLineIndex(0); setRegressionsCount(0); }}
                className="px-6 py-3.5 bg-background border border-border-soft text-foreground rounded-xl font-bold text-sm hover:bg-gray-50 transition-all active:scale-95"
              >
                Practicar de Nuevo
              </button>
            )}
            <button
              onClick={() => router.push('/')}
              className="px-8 py-3.5 bg-foreground text-surface rounded-xl font-bold text-sm shadow-md hover:bg-black transition-all active:scale-95"
            >
              Volver al Dashboard
            </button>
          </div>
        </div>
      )}


    </div>
  );
}
