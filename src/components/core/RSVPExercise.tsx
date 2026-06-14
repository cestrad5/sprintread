"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { LessonText } from '../../lib/lessonContent';
import { useProgressStore } from '../../store/useProgressStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import { useRouter } from 'next/navigation';
import { prepareRSVPText, prepareRSVPChunks, WordData } from '../../lib/textProcessor';
import { useRSVPEngine } from '../../hooks/useRSVPEngine';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Volume2, 
  VolumeX, 
  Zap, 
  Check, 
  X, 
  Award, 
  ArrowRight, 
  Clock, 
  Sparkles,
  AlertCircle
} from 'lucide-react';

interface RSVPExerciseProps {
  userId: string;
  lesson: {
    id: string;
    title: string;
    description: string;
  };
  text: LessonText;
  mode?: 'practice' | 'scored';
}

export function RSVPExercise({ userId, lesson, text, mode = 'scored' }: RSVPExerciseProps) {
  const router = useRouter();
  const { saveSession } = useProgressStore();
  const { useDyslexicFont, wpm: globalWpm, setWpm: saveGlobalWpm } = useSettingsStore();

  const [step, setStep] = useState<'intro' | 'reading' | 'micro_quiz' | 'quiz' | 'results'>('intro');
  const [baseWpm, setBaseWpm] = useState<number>(globalWpm || 300);
  const [currentWpm, setCurrentWpm] = useState<number>(globalWpm || 300);

  // General RSVP State
  const [progress, setProgress] = useState(0);

  // RSVP Mode specifics
  const isChunking = lesson.id === 'M2L1';
  const isRSVPOrp = lesson.id === 'M2L2';
  const isSprint = lesson.id === 'M3L1';
  const isWideAngle = lesson.id === 'M3L3';
  const isSubvocalization = lesson.id === 'M3L4';
  const isPressure = lesson.id === 'M3L5';

  const chunkSize = isChunking ? 3 : isWideAngle ? 4 : 1;

  // Process text into words/chunks
  const words = useMemo(() => {
    if (chunkSize > 1) {
      return prepareRSVPChunks(text.body, chunkSize);
    } else {
      return prepareRSVPText(text.body);
    }
  }, [text.body, chunkSize]);

  // DOM Refs for direct rendering
  const beforeRef = useRef<HTMLSpanElement>(null);
  const orpRef = useRef<HTMLSpanElement>(null);
  const afterRef = useRef<HTMLSpanElement>(null);

  // Micro Quiz state (M3L1 Sprint Intervals)
  const [microQuizActive, setMicroQuizActive] = useState(false);
  const [microQuestions, setMicroQuestions] = useState<any[]>([]);
  const [currentMicroIdx, setCurrentMicroIdx] = useState(0);
  const [microSelectedOption, setMicroSelectedOption] = useState<number | null>(null);
  const [microCorrectCount, setMicroCorrectCount] = useState(0);
  const [microAnswered, setMicroAnswered] = useState(false);
  const [microTimer, setMicroTimer] = useState(5);
  const microTimerIntervalRef = useRef<any>(null);

  // Sprint intervals state
  const [sprintCycle, setSprintCycle] = useState(1); // 1 to 4
  const [sprintMode, setSprintMode] = useState<'sprint' | 'recovery'>('sprint');
  const [cycleTimeLeft, setCycleTimeLeft] = useState(60); // 60s for sprint, 90s for recovery
  const sprintTimerIntervalRef = useRef<any>(null);

  // Subvocalization metronome state
  const [audioEnabled, setAudioEnabled] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const metronomeIntervalRef = useRef<any>(null);
  const [metronomePulse, setMetronomePulse] = useState(false);

  // Time Pressure state (M3L5)
  const [pressureTimeLeft, setPressureTimeLeft] = useState(90);
  const pressureIntervalRef = useRef<any>(null);

  // General Quiz State
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [answers, setAnswers] = useState<boolean[]>([]);
  const [isAnswered, setIsAnswered] = useState<boolean>(false);
  const [correctAnswersCount, setCorrectAnswersCount] = useState<number>(0);

  // Peak WPM tracking
  const [peakWpm, setPeakWpm] = useState(baseWpm);

  // Web Audio Metronome click
  const playClick = useCallback(() => {
    if (!audioEnabled) return;
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.04);
    } catch (e) {
      console.error('Audio click failed', e);
    }
  }, [audioEnabled]);

  // RSVP Completed
  const handleFinishedReading = useCallback(() => {
    pause();
    if (isSprint && sprintCycle < 4) {
      // Launch micro-quiz
      setupMicroQuiz();
    } else if (mode === 'practice') {
      setStep('results');
    } else {
      setStep('quiz');
    }
  }, [isSprint, sprintCycle, mode]);

  // Setup RSVP Engine
  const { isPlaying, play, pause, reset, getCurrentIndex } = useRSVPEngine({
    words,
    wpm: currentWpm,
    beforeRef,
    orpRef,
    afterRef,
    onProgress: setProgress,
    onComplete: handleFinishedReading
  });

  // Metronome effect
  useEffect(() => {
    if (isPlaying && isSubvocalization) {
      metronomeIntervalRef.current = setInterval(() => {
        setMetronomePulse(prev => !prev);
        playClick();
      }, 500); // 120 BPM = 2 clicks per second = 500ms intervals
    } else {
      if (metronomeIntervalRef.current) clearInterval(metronomeIntervalRef.current);
    }

    return () => {
      if (metronomeIntervalRef.current) clearInterval(metronomeIntervalRef.current);
    };
  }, [isPlaying, isSubvocalization, playClick]);

  // M3L1: Setup micro quiz questions
  const setupMicroQuiz = () => {
    // Select 2 random questions from our pool
    const pool = [...text.questions];
    const shuffled = pool.sort(() => 0.5 - Math.random());
    setMicroQuestions(shuffled.slice(0, 2));
    setCurrentMicroIdx(0);
    setMicroSelectedOption(null);
    setMicroAnswered(false);
    setMicroTimer(5);
    setStep('micro_quiz');
    pause();

    // Start 5-second countdown
    if (microTimerIntervalRef.current) clearInterval(microTimerIntervalRef.current);
    microTimerIntervalRef.current = setInterval(() => {
      setMicroTimer(prev => {
        if (prev <= 1) {
          // Auto-submit incorrect
          handleMicroAnswerSubmit(null);
          return 5;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleMicroAnswerSubmit = (optionIdx: number | null) => {
    if (microAnswered) return;
    if (microTimerIntervalRef.current) clearInterval(microTimerIntervalRef.current);

    setMicroSelectedOption(optionIdx);
    setMicroAnswered(true);

    const correct = microQuestions[currentMicroIdx].correct;
    const isCorrect = optionIdx === correct;
    if (isCorrect) setMicroCorrectCount(prev => prev + 1);

    setTimeout(() => {
      if (currentMicroIdx < 1) {
        // Show second question
        setCurrentMicroIdx(1);
        setMicroSelectedOption(null);
        setMicroAnswered(false);
        setMicroTimer(5);
        
        microTimerIntervalRef.current = setInterval(() => {
          setMicroTimer(prev => {
            if (prev <= 1) {
              handleMicroAnswerSubmit(null);
              return 5;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        // Complete micro-quiz, advance sprint cycle
        if (sprintMode === 'sprint') {
          setSprintMode('recovery');
          setCycleTimeLeft(90);
        } else {
          setSprintMode('sprint');
          setSprintCycle(prev => prev + 1);
          setCycleTimeLeft(60);
        }
        setStep('reading');
        setTimeout(() => play(), 500); // Resume
      }
    }, 1200);
  };

  // M3L1: Sprint Interval Timers
  useEffect(() => {
    if (isPlaying && isSprint) {
      // Adjust WPM dynamically based on mode
      const targetWpm = sprintMode === 'sprint' 
        ? Math.round(baseWpm * 1.4) 
        : Math.round(baseWpm * 0.9);
      setCurrentWpm(targetWpm);
      if (targetWpm > peakWpm) setPeakWpm(targetWpm);

      sprintTimerIntervalRef.current = setInterval(() => {
        setCycleTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(sprintTimerIntervalRef.current);
            setupMicroQuiz();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (sprintTimerIntervalRef.current) clearInterval(sprintTimerIntervalRef.current);
    }

    return () => {
      if (sprintTimerIntervalRef.current) clearInterval(sprintTimerIntervalRef.current);
    };
  }, [isPlaying, isSprint, sprintMode, baseWpm]);

  // M3L5: Time Pressure Timer
  useEffect(() => {
    if (isPlaying && isPressure) {
      // Force WPM to complete within 70 seconds of the 90 seconds limit
      // WPM = (wordCount / 70) * 60
      const calculatedWpm = Math.round((text.wordCount / 70) * 60);
      setCurrentWpm(calculatedWpm);
      setPeakWpm(calculatedWpm);

      pressureIntervalRef.current = setInterval(() => {
        setPressureTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(pressureIntervalRef.current);
            pause();
            setStep('quiz');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (pressureIntervalRef.current) clearInterval(pressureIntervalRef.current);
    }

    return () => {
      if (pressureIntervalRef.current) clearInterval(pressureIntervalRef.current);
    };
  }, [isPlaying, isPressure, text.wordCount]);

  const startReading = () => {
    setStep('reading');
    setTimeout(() => {
      play();
    }, 100);
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
      saveGlobalWpm(baseWpm);

      const scorePercentage = Math.round((correctAnswersCount / text.questions.length) * 100);
      
      // Calculate final logged WPM
      let finalWpm = baseWpm;
      if (isSprint) {
        finalWpm = Math.round((baseWpm * 4 * 1.4 + baseWpm * 4 * 0.9) / 8); // Average speed
      } else if (isPressure) {
        finalWpm = currentWpm;
      }

      saveSession(userId, {
        lessonId: lesson.id,
        wpm: finalWpm,
        wpm_peak: peakWpm,
        comprehension: scorePercentage,
        regressions: 0,
        duration: isSprint ? 600 : isPressure ? (90 - pressureTimeLeft) : Math.round((words.length / baseWpm) * 60),
        deviceType: window.innerWidth < 768 ? 'mobile' : 'desktop'
      });
    }
  }, [step]);

  const scorePercentage = Math.round((correctAnswersCount / text.questions.length) * 100);

  return (
    <div className={`w-full max-w-2xl mx-auto bg-surface p-6 md:p-8 rounded-3xl border border-border-soft shadow-sm ${useDyslexicFont ? 'font-dyslexic' : ''}`}>
      
      {/* INTRO SCREEN */}
      {step === 'intro' && (
        <div className="flex flex-col items-center text-center py-6">
          <div className="w-16 h-16 bg-red-50 text-focus rounded-full flex items-center justify-center mb-6 text-xl">
            {isChunking && '📦'}
            {isRSVPOrp && '⚡'}
            {isSprint && '🏃'}
            {isWideAngle && '🔭'}
            {isSubvocalization && '🤫'}
            {isPressure && '⏱️'}
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight mb-3">
            {lesson.title}
          </h2>
          <p className="text-gray-500 mb-6 max-w-md text-sm leading-relaxed">
            {isChunking && 'El texto se agrupará en bloques semánticos de 3 palabras. Esto te enseña a procesar conjuntos de significados a la vez en lugar de palabras individuales.'}
            {isRSVPOrp && 'Lector RSVP ultra-veloz. El punto de reconocimiento óptimo (ORP) de cada palabra se alineará en el mismo pixel rojo. Mantén la mirada fija en el centro.'}
            {isSprint && 'Entrenamiento de sobre-velocidad por intervalos: alternaremos 60 segundos de lectura súper rápida (WPM +40%) con 90 segundos de recuperación (WPM -10%). Tras cada sprint responderás 2 preguntas rápidas.'}
            {isWideAngle && 'Entrenamiento de ángulo foveal amplio. RSVP presentará bloques semánticos grandes de 4 palabras para expandir tu span visual horizontal.'}
            {isSubvocalization && 'Supresión activa de voz interna. Un metrónomo visual a 120 BPM te ayudará a desvincular el ritmo de lectura de tu habla. Opcionalmente puedes activar sonido de click.'}
            {isPressure && 'Simulacro temporal estricto. Dispones de 90 segundos máximo para leer y completar el cuestionario. El marcador RSVP irá a una velocidad pre-calculada para terminar a tiempo.'}
          </p>

          {/* Speed slider */}
          {!isPressure && (
            <div className="bg-background border border-border-soft p-5 rounded-2xl w-full max-w-sm mb-8">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 text-center">
                Calibrar Velocidad Base
              </label>
              <input 
                type="range" 
                min="150" 
                max="600" 
                step="10"
                value={baseWpm} 
                onChange={(e) => {
                  setBaseWpm(Number(e.target.value));
                  setCurrentWpm(Number(e.target.value));
                }}
                className="w-full accent-focus"
              />
              <div className="text-lg font-black text-center mt-2">{baseWpm} WPM</div>
              {isSprint && (
                <div className="text-[10px] text-gray-400 font-semibold text-center mt-1">
                  Sprints a: {Math.round(baseWpm * 1.4)} WPM | Recuperación a: {Math.round(baseWpm * 0.9)} WPM
                </div>
              )}
            </div>
          )}

          {isPressure && (
            <div className="bg-background border border-border-soft p-4 rounded-2xl w-full max-w-sm mb-8 text-center text-xs text-gray-500 flex items-start gap-3">
              <AlertCircle className="text-focus flex-none mt-0.5" size={16} />
              <div className="text-left">
                <span className="font-bold block text-foreground mb-0.5">Condiciones del Simulacro:</span>
                - Duración total: 90 segundos.<br/>
                - RSVP irá a {Math.round((text.wordCount / 70) * 60)} WPM para terminar en 70 segundos.<br/>
                - Responderás 5 preguntas con 8 segundos máximo para cada una.
              </div>
            </div>
          )}

          {isSubvocalization && (
            <div className="flex items-center gap-2 cursor-pointer bg-background px-4 py-2 rounded-full border border-border-soft shadow-xs mb-8">
              <input 
                type="checkbox" 
                id="audio-metronome-toggle"
                checked={audioEnabled}
                onChange={(e) => setAudioEnabled(e.target.checked)}
                className="w-4 h-4 accent-focus rounded cursor-pointer"
              />
              <label htmlFor="audio-metronome-toggle" className="text-xs font-semibold text-gray-600 cursor-pointer select-none">
                🔊 Activar Metrónomo de Audio (Clicks)
              </label>
            </div>
          )}

          <button
            onClick={startReading}
            className="px-8 py-3.5 bg-foreground text-surface rounded-xl font-bold text-sm shadow-md hover:bg-black transition-all active:scale-95 flex items-center gap-2"
          >
            Comenzar Entrenamiento <ArrowRight size={16} />
          </button>

          {mode === 'practice' && (
            <p className="mt-4 text-[10px] text-gray-400 text-center max-w-xs">
              🏋️ Modo Práctica — Al terminar verás tu velocidad sin quiz de comprensión.
            </p>
          )}
        </div>
      )}

      {/* RSVP READING VIEWPORT */}
      {step === 'reading' && (
        <div className="flex flex-col items-center">
          
          {/* Header Stats */}
          <div className="w-full flex justify-between text-xs text-gray-400 font-bold uppercase tracking-wider mb-6">
            {isSprint ? (
              <span className="flex items-center gap-1.5 text-orange-500">
                <Zap size={14} className="animate-bounce" /> 
                Intervalo {sprintCycle}/4 ({sprintMode === 'sprint' ? 'SPRINT' : 'RECUPERACIÓN'} - {cycleTimeLeft}s)
              </span>
            ) : isPressure ? (
              <span className="flex items-center gap-1.5 text-focus font-mono">
                <Clock size={14} /> Tiempo Restante: {pressureTimeLeft}s
              </span>
            ) : (
              <span>{lesson.title}</span>
            )}
            <span>Velocidad: {currentWpm} WPM</span>
          </div>

          {/* RSVP Focus Box */}
          <div className="relative flex items-center justify-center w-full h-32 md:h-40 border-y-2 border-border-soft my-4 overflow-hidden bg-background rounded-2xl shadow-inner">
            
            {/* Visual alignment anchors */}
            <div className="absolute top-0 w-[2px] h-3 bg-focus/30 left-[35%] -translate-x-1/2 rounded-full" />
            <div className="absolute bottom-0 w-[2px] h-3 bg-focus/30 left-[35%] -translate-x-1/2 rounded-full" />
            
            {/* Text rendering frame */}
            <div className="flex text-2xl md:text-4xl text-foreground w-full px-4 items-center">
              <span 
                ref={beforeRef} 
                className="w-[35%] text-right whitespace-pre select-none tracking-wide" 
              />
              <span 
                ref={orpRef} 
                className="text-focus font-bold select-none" 
              />
              <span 
                ref={afterRef} 
                className="w-[65%] text-left whitespace-pre select-none tracking-wide" 
              />
            </div>

            {/* Pulsing metronome visual for subvocalization */}
            {isSubvocalization && (
              <div 
                className={`absolute bottom-3 right-3 w-4 h-4 rounded-full border border-indigo-200 transition-all duration-75 ${
                  metronomePulse ? 'bg-indigo-500 scale-125 shadow-[0_0_8px_rgba(99,102,241,0.5)]' : 'bg-transparent scale-100'
                }`}
              />
            )}
          </div>

          {/* Progress bar */}
          <div className="w-full h-1.5 bg-border-soft rounded-full overflow-hidden mb-8 mt-4">
            <div 
              className={`h-full transition-all duration-300 ease-out ${
                isSprint && sprintMode === 'sprint' ? 'bg-orange-500' : 'bg-foreground'
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Controls */}
          <div className="flex items-center gap-6 w-full justify-center">
            {/* Manual WPM adjuster (disabled during Pressure or Sprint runs) */}
            {!isPressure && !isSprint && (
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => {
                    setBaseWpm(p => Math.max(150, p - 20));
                    setCurrentWpm(p => Math.max(150, p - 20));
                  }}
                  className="p-2 border border-border-soft rounded-lg text-xs bg-white"
                >
                  -20
                </button>
                <button 
                  onClick={() => {
                    setBaseWpm(p => Math.min(800, p + 20));
                    setCurrentWpm(p => Math.min(800, p + 20));
                  }}
                  className="p-2 border border-border-soft rounded-lg text-xs bg-white"
                >
                  +20
                </button>
              </div>
            )}

            <button
              onClick={isPlaying ? pause : play}
              className="px-8 py-3 bg-foreground hover:bg-black text-surface text-xs font-bold rounded-xl active:scale-95 shadow-md flex items-center gap-2"
            >
              {isPlaying ? <Pause size={14} /> : <Play size={14} fill="currentColor" />}
              {isPlaying ? 'PAUSAR' : 'REANUDAR'}
            </button>

            <button
              onClick={reset}
              className="p-3 border border-border-soft rounded-xl bg-white hover:bg-gray-50 active:scale-90"
              title="Reiniciar"
            >
              <RotateCcw size={14} />
            </button>

            {isSubvocalization && (
              <button
                onClick={() => setAudioEnabled(!audioEnabled)}
                className={`p-3 border rounded-xl active:scale-90 ${audioEnabled ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white'}`}
                title="Metrónomo de audio"
              >
                {audioEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
              </button>
            )}
          </div>
        </div>
      )}

      {/* MICRO QUIZ SCREEN (Sprint Intervals) */}
      {step === 'micro_quiz' && microQuestions[currentMicroIdx] && (
        <div className="py-4 select-none">
          <div className="flex justify-between items-center text-xs text-orange-500 font-bold mb-6 uppercase tracking-wider">
            <span>Interval Quiz rápido</span>
            <span className="flex items-center gap-1 font-mono text-sm bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-lg">
              ⏱️ {microTimer}s
            </span>
          </div>

          <h3 className="text-lg font-extrabold mb-6">
            {microQuestions[currentMicroIdx].question}
          </h3>

          <div className="flex flex-col gap-2.5">
            {microQuestions[currentMicroIdx].options.map((option: string, idx: number) => {
              const isSelected = microSelectedOption === idx;
              const isCorrectAnswer = idx === microQuestions[currentMicroIdx].correct;
              
              let style = 'border-border-soft hover:bg-gray-50 bg-white';
              if (microAnswered) {
                if (isCorrectAnswer) {
                  style = 'border-emerald-500 bg-emerald-50 text-emerald-800';
                } else if (isSelected) {
                  style = 'border-red-500 bg-red-50 text-red-800';
                }
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleMicroAnswerSubmit(idx)}
                  disabled={microAnswered}
                  className={`w-full p-4 border rounded-2xl text-left text-sm font-medium transition-all flex items-center justify-between gap-4 active:scale-99 ${style}`}
                >
                  <span>{option}</span>
                  {microAnswered && isCorrectAnswer && <Check size={16} className="text-emerald-600 flex-none" />}
                  {microAnswered && isSelected && !isCorrectAnswer && <X size={16} className="text-red-600 flex-none" />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* COMPREHENSION QUIZ SCREEN */}
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
              if (isAnswered) {
                if (isCorrectAnswer) {
                  optionStyle = 'border-emerald-500 bg-emerald-50 text-emerald-800';
                } else if (isSelected) {
                  optionStyle = 'border-red-500 bg-red-50 text-red-800';
                }
              } else if (isSelected) {
                optionStyle = 'border-foreground bg-gray-50 font-semibold';
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
              <span className="text-4xl font-black text-foreground mt-2">
                {isSprint ? Math.round((baseWpm * 4 * 1.4 + baseWpm * 4 * 0.9) / 8) : baseWpm}
              </span>
              <span className="text-xs text-gray-500 font-semibold mt-1">WPM {isSprint ? '(Promedio)' : ''}</span>
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

          {isSprint && (
            <div className="p-4 bg-orange-50 border border-orange-100 rounded-2xl text-xs text-orange-800 max-w-sm mb-8">
              🚀 Peak Speed: <span className="font-extrabold">{peakWpm} WPM</span> en intervalos de sprint.<br/>
              {mode === 'scored' && <>Aciertos en Sprints: <span className="font-extrabold">{microCorrectCount} de 6 preguntas rápidas</span>.</>}
            </div>
          )}

          {isSubvocalization && (
            <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl text-xs text-indigo-800 max-w-sm mb-8">
              🤫 Lograste desacoplar tu voz interna leyendo a <span className="font-bold">{baseWpm} WPM</span>. A esta velocidad, el procesamiento es visual.
            </div>
          )}

          <div className="flex gap-3">
            {mode === 'practice' && (
              <button
                onClick={() => { setStep('intro'); reset(); }}
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
