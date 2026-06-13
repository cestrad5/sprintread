"use client";

import React, { useState, useEffect, useRef } from 'react';
import { LessonText, TEXTS } from '../../lib/lessonContent';
import { useProgressStore } from '../../store/useProgressStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import { useRouter } from 'next/navigation';
import { Check, X, ArrowRight, VolumeX, AlertCircle, Eye, EyeOff } from 'lucide-react';

interface SubvocalizationExerciseProps {
  userId: string;
  lesson: {
    id: string;
    title: string;
    description: string;
  };
  text: LessonText; // Phase 1 text
}

const SPANISH_STOPWORDS = new Set([
  'el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas',
  'de', 'del', 'a', 'al', 'en', 'con', 'por', 'para',
  'y', 'o', 'que', 'se', 'su', 'sus', 'lo', 'le', 'les',
  'me', 'te', 'nos', 'os', 'mi', 'tu', 'es', 'son',
  'como', 'esta', 'este', 'estas', 'estos', 'ese', 'esa',
  'sin', 'sobre', 'bajo', 'entre', 'desde', 'hasta', 'ya',
  'o', 'pero', 'mas', 'ni', 'sino'
]);

export function SubvocalizationExercise({ userId, lesson, text }: SubvocalizationExerciseProps) {
  const router = useRouter();
  const { saveSession } = useProgressStore();
  const { useDyslexicFont } = useSettingsStore();

  const [step, setStep] = useState<'intro' | 'phase1' | 'phase1_results' | 'phase2_intro' | 'phase2' | 'quiz' | 'results'>('intro');
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  // Phase 1: Conciencia
  const [p1Words, setP1Words] = useState<string[]>([]);
  const [subvocalizedIndices, setSubvocalizedIndices] = useState<Set<number>>(new Set());
  const [p1StartTime, setP1StartTime] = useState<number>(0);
  const [p1Duration, setP1Duration] = useState<number>(0);
  const [activeWordIndex, setActiveWordIndex] = useState<number>(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Phase 2: Entrenamiento
  const p2Text = TEXTS.find(t => t.id === 'pacing-01') || TEXTS[0]; // Second text for training
  const [p2Words, setP2Words] = useState<string[]>([]);
  const [p2StartTime, setP2StartTime] = useState<number>(0);
  const [p2Duration, setP2Duration] = useState<number>(0);

  // Quiz state
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [answers, setAnswers] = useState<boolean[]>([]);
  const [isAnswered, setIsAnswered] = useState<boolean>(false);
  const [correctAnswersCount, setCorrectAnswersCount] = useState<number>(0);

  // Prepare words
  useEffect(() => {
    if (text) {
      setP1Words(text.body.trim().split(/\s+/));
    }
    if (p2Text) {
      setP2Words(p2Text.body.trim().split(/\s+/));
    }
  }, [text, p2Text]);

  // Autoscroll for Phase 1 as the reader moves down (estimated index)
  useEffect(() => {
    if (step === 'phase1' && scrollContainerRef.current) {
      const activeElement = document.getElementById(`p1-word-${activeWordIndex}`);
      if (activeElement) {
        scrollContainerRef.current.scrollTo({
          top: activeElement.offsetTop - 120,
          behavior: 'smooth'
        });
      }
    }
  }, [activeWordIndex, step]);

  const startPhase1 = () => {
    setStep('phase1');
    setP1StartTime(performance.now());
    setActiveWordIndex(0);
    setSubvocalizedIndices(new Set());
  };

  const registerSubvocalization = () => {
    setSubvocalizedIndices(prev => {
      const newSet = new Set(prev);
      newSet.add(activeWordIndex);
      return newSet;
    });

    // Advance active word index slightly to keep up with user pace
    setActiveWordIndex(prev => Math.min(p1Words.length - 1, prev + 2));
  };

  const finishPhase1 = () => {
    setP1Duration((performance.now() - p1StartTime) / 1000);
    setStep('phase1_results');
  };

  const startPhase2 = () => {
    setStep('phase2');
    setP2StartTime(performance.now());
  };

  const finishPhase2 = () => {
    setP2Duration((performance.now() - p2StartTime) / 1000);
    setStep('quiz');
  };

  // Helper to check if a word is functional/stopword
  const isFunctional = (word: string) => {
    const cleanWord = word.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "");
    return SPANISH_STOPWORDS.has(cleanWord);
  };

  // Stats calculation
  const stats = React.useMemo(() => {
    if (p1Words.length === 0) return { total: 0, functional: 0, content: 0, savedPercentage: 0 };
    
    let totalSubvocalized = subvocalizedIndices.size;
    let functionalSubvocalized = 0;
    let contentSubvocalized = 0;
    let totalFunctionalWords = 0;

    p1Words.forEach((word, idx) => {
      const isFunc = isFunctional(word);
      if (isFunc) totalFunctionalWords++;
      if (subvocalizedIndices.has(idx)) {
        if (isFunc) functionalSubvocalized++;
        else contentSubvocalized++;
      }
    });

    // Subvocalized percent
    const subvocalizedPercentOfFunctional = totalFunctionalWords > 0 
      ? Math.round((functionalSubvocalized / totalFunctionalWords) * 100) 
      : 0;

    return {
      total: totalSubvocalized,
      functional: functionalSubvocalized,
      content: contentSubvocalized,
      totalFunctional: totalFunctionalWords,
      savedPercentage: 100 - subvocalizedPercentOfFunctional
    };
  }, [subvocalizedIndices, p1Words]);

  const handleSelectOption = (index: number) => {
    if (isAnswered) return;
    setSelectedOption(index);
  };

  const submitAnswer = () => {
    if (selectedOption === null || isAnswered) return;
    
    const currentQuestion = p2Text.questions[currentQuestionIndex];
    const isCorrect = selectedOption === currentQuestion.correct;
    
    setAnswers([...answers, isCorrect]);
    if (isCorrect) setCorrectAnswersCount(prev => prev + 1);
    setIsAnswered(true);

    setTimeout(() => {
      if (currentQuestionIndex < p2Text.questions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
        setSelectedOption(null);
        setIsAnswered(false);
      } else {
        setStep('results');
      }
    }, 1200);
  };

  // Save session when results load
  useEffect(() => {
    if (step === 'results') {
      const totalWords = p2Words.length;
      const readingTime = p2Duration;
      const wpm = Math.round((totalWords / readingTime) * 60);
      const scorePercentage = Math.round((correctAnswersCount / p2Text.questions.length) * 100);

      saveSession(userId, {
        lessonId: lesson.id,
        wpm: wpm,
        wpm_peak: wpm,
        comprehension: scorePercentage,
        regressions: stats.total, // Log detected subvocalizations as regression metric
        duration: Math.round(p1Duration + p2Duration),
        deviceType: window.innerWidth < 768 ? 'mobile' : 'desktop'
      });
    }
  }, [step]);

  const p2Wpm = p2Duration > 0 ? Math.round((p2Words.length / p2Duration) * 60) : 0;
  const scorePercentage = Math.round((correctAnswersCount / p2Text.questions.length) * 100);

  return (
    <div className={`w-full max-w-2xl mx-auto bg-surface p-6 md:p-8 rounded-3xl border border-border-soft shadow-sm ${useDyslexicFont ? 'font-dyslexic' : ''}`}>
      
      {/* INTRO */}
      {step === 'intro' && (
        <div className="flex flex-col items-center text-center py-6">
          <div className="w-16 h-16 bg-red-50 text-focus rounded-full flex items-center justify-center mb-6">
            <VolumeX size={32} />
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight mb-3">
            {lesson.title}
          </h2>
          <p className="text-gray-500 mb-6 max-w-md text-sm leading-relaxed">
            La subvocalización (la voz interna) limita tu velocidad de lectura al ritmo del habla (~150 WPM). En esta lección aprenderemos a reducirla en palabras comunes para procesar el texto visualmente.
          </p>

          <div className="bg-background border border-border-soft p-4 rounded-2xl w-full max-w-sm mb-8 text-left text-xs text-gray-500 flex flex-col gap-2">
            <span className="font-bold text-foreground">El entrenamiento consta de 2 fases:</span>
            <span><span className="font-bold text-focus">Fase 1: Conciencia.</span> Leerás y presionarás el botón naranja cada vez que detectes tu voz interna diciendo una palabra.</span>
            <span><span className="font-bold text-focus">Fase 2: Supresión.</span> Leerás un texto donde las palabras funcionales están atenuadas para entrenarte a "saltarlas" visualmente.</span>
          </div>

          <button
            onClick={startPhase1}
            className="px-8 py-3.5 bg-foreground text-surface rounded-xl font-bold text-sm shadow-md hover:bg-black transition-all active:scale-95 flex items-center gap-2"
          >
            Comenzar Fase 1 <ArrowRight size={16} />
          </button>
        </div>
      )}

      {/* PHASE 1: CONCIENCIA */}
      {step === 'phase1' && (
        <div className="flex flex-col h-[70vh] relative">
          <div className="flex justify-between items-center text-xs text-gray-400 font-bold mb-4 uppercase tracking-wider flex-none">
            <span>Fase 1: Conciencia de la Voz Interna</span>
            <span>Toca el botón al escuchar tu voz interna</span>
          </div>

          <div 
            ref={scrollContainerRef}
            className="flex-1 overflow-y-auto px-6 py-6 rounded-2xl border border-border-soft bg-background/50 text-lg md:text-xl font-sans leading-relaxed select-none"
          >
            <div>
              {p1Words.map((word, idx) => {
                const isActive = idx === activeWordIndex;
                const isSubvocalized = subvocalizedIndices.has(idx);
                
                return (
                  <span
                    key={idx}
                    id={`p1-word-${idx}`}
                    onClick={() => setActiveWordIndex(idx)}
                    className={`inline-block mr-1.5 cursor-pointer rounded px-0.5 transition-all ${
                      isActive 
                        ? 'bg-amber-100 font-bold border-b-2 border-amber-500 text-foreground'
                        : isSubvocalized
                          ? 'text-orange-600 bg-orange-50 font-medium'
                          : 'text-foreground/80'
                    }`}
                  >
                    {word}
                  </span>
                );
              })}
            </div>
          </div>

          {/* Subvocalization trigger area */}
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between mt-6 p-4 border-t border-border-soft flex-none bg-surface">
            <div className="text-xs text-gray-400 font-semibold">
              Palabras marcadas: {subvocalizedIndices.size}
            </div>

            <div className="flex gap-3 w-full sm:w-auto">
              <button
                onClick={registerSubvocalization}
                className="flex-1 sm:flex-none px-8 py-4 bg-orange-500 hover:bg-orange-600 active:scale-95 text-white font-extrabold text-sm rounded-xl shadow-lg transition-transform flex items-center justify-center gap-2"
              >
                🔊 Voz Interna Activa
              </button>

              <button
                onClick={finishPhase1}
                className="px-6 py-4 bg-foreground hover:bg-black text-surface font-bold text-xs rounded-xl shadow-md active:scale-95"
              >
                Terminar Fase 1
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PHASE 1 RESULTS */}
      {step === 'phase1_results' && (
        <div className="py-4">
          <h3 className="text-xl font-bold tracking-tight mb-4 text-center">Resultados de tu Diagnóstico</h3>
          <p className="text-xs text-gray-500 text-center mb-6 max-w-md mx-auto">
            Hemos analizado las palabras que subvocalizaste. La voz interna debe reservarse para términos complejos, no para artículos o preposiciones.
          </p>

          <div className="grid grid-cols-3 gap-4 bg-background border border-border-soft p-4 rounded-xl mb-6 text-center">
            <div>
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Subvocalizadas</span>
              <span className="text-2xl font-black text-orange-500 mt-1 block">{stats.total}</span>
            </div>
            <div>
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Funcionales (Stopwords)</span>
              <span className="text-2xl font-black text-foreground mt-1 block">{stats.functional}</span>
            </div>
            <div>
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Contenido Complejo</span>
              <span className="text-2xl font-black text-foreground mt-1 block">{stats.content}</span>
            </div>
          </div>

          {/* Stopword suppression advice */}
          <div className="p-4 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl mb-6 text-xs flex gap-3">
            <AlertCircle className="text-amber-600 flex-none" size={20} />
            <div>
              <span className="font-bold block mb-1">El veredicto científico:</span>
              Subvocalizaste <span className="font-bold">{stats.functional} palabras funcionales</span> (como "de", "que", "para"). Al leer, tu cerebro capta estas palabras automáticamente de forma visual. Pronunciarlas en tu mente solo reduce tu velocidad sin añadir valor.
            </div>
          </div>

          {/* Visual Heatmap */}
          <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Tu Mapa de Subvocalización</h4>
          <div className="max-h-48 overflow-y-auto p-4 border border-border-soft rounded-xl bg-gray-50 text-sm leading-relaxed mb-8">
            {p1Words.slice(0, 80).map((word, idx) => {
              const isSub = subvocalizedIndices.has(idx);
              const isFunc = isFunctional(word);
              
              let style = 'text-gray-600';
              if (isSub) {
                style = isFunc 
                  ? 'bg-red-100 text-red-800 font-bold px-1 rounded' 
                  : 'bg-orange-100 text-orange-800 font-bold px-1 rounded';
              }
              return (
                <span key={idx} className={`inline-block mr-1 ${style}`}>
                  {word}
                </span>
              );
            })}
            <span>...</span>
          </div>

          <button
            onClick={() => setStep('phase2_intro')}
            className="w-full py-3.5 bg-foreground hover:bg-black text-surface font-bold text-sm rounded-xl flex items-center justify-center gap-2 active:scale-98"
          >
            Avanzar a Fase 2 (Entrenamiento) <ArrowRight size={16} />
          </button>
        </div>
      )}

      {/* PHASE 2 INTRO */}
      {step === 'phase2_intro' && (
        <div className="flex flex-col items-center text-center py-6">
          <div className="w-16 h-16 bg-red-50 text-focus rounded-full flex items-center justify-center mb-6">
            <VolumeX size={32} />
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight mb-3">
            Fase 2: Supresión de Voz Interna
          </h2>
          <p className="text-gray-500 mb-6 max-w-md text-sm leading-relaxed">
            Ahora leerás un texto de entrenamiento. En este texto, las palabras funcionales están atenuadas visualmente (menor opacidad y tamaño).
          </p>

          <div className="bg-background border border-border-soft p-5 rounded-2xl w-full max-w-sm mb-8 text-left text-xs">
            <span className="font-bold text-foreground block mb-2">Instrucción de lectura:</span>
            1. Pasa tus ojos a velocidad constante por el texto.<br/>
            2. Deja que tu mente procese las palabras tenues sin "decirlas" en tu voz interna.<br/>
            3. Al final responderás un quiz sobre el contenido.
          </div>

          <button
            onClick={startPhase2}
            className="px-8 py-3.5 bg-focus hover:bg-red-700 text-white rounded-xl font-bold text-sm shadow-md transition-all active:scale-95 flex items-center gap-2"
          >
            Comenzar Entrenamiento <ArrowRight size={16} />
          </button>
        </div>
      )}

      {/* PHASE 2: ENTRENAMIENTO */}
      {step === 'phase2' && (
        <div className="flex flex-col h-[70vh]">
          <div className="flex justify-between items-center text-xs text-gray-400 font-bold mb-4 uppercase tracking-wider flex-none">
            <span>Fase 2: Supresión Activa</span>
            <span>Entrenamiento visual</span>
          </div>

          <div 
            className="flex-1 overflow-y-auto px-6 py-6 rounded-2xl border border-border-soft bg-background/50 text-lg md:text-xl font-sans leading-relaxed select-none"
          >
            <div>
              {p2Words.map((word, idx) => {
                const isFunc = isFunctional(word);
                const wordStyle = isFunc 
                  ? 'opacity-30 text-[0.88em] font-light tracking-wide' 
                  : 'text-foreground font-semibold';
                
                return (
                  <span
                    key={idx}
                    className={`inline-block mr-1.5 transition-all ${wordStyle}`}
                  >
                    {word}
                  </span>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end p-4 border-t border-border-soft flex-none bg-surface mt-4">
            <button
              onClick={finishPhase2}
              className="px-8 py-3.5 bg-foreground hover:bg-black text-surface font-extrabold text-xs rounded-xl shadow-md active:scale-95"
            >
              Terminé de Leer
            </button>
          </div>
        </div>
      )}

      {/* QUIZ */}
      {step === 'quiz' && (
        <div className="py-4">
          <div className="flex justify-between items-center text-xs text-gray-400 font-bold mb-6 uppercase tracking-wider">
            <span>Cuestionario de Comprensión (Texto de Entrenamiento)</span>
            <span>Pregunta {currentQuestionIndex + 1} de {p2Text.questions.length}</span>
          </div>

          <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden mb-8">
            <div 
              className="h-full bg-foreground transition-all duration-300" 
              style={{ width: `${((currentQuestionIndex) / p2Text.questions.length) * 100}%` }} 
            />
          </div>

          <h3 className="text-lg md:text-xl font-extrabold tracking-tight mb-6">
            {p2Text.questions[currentQuestionIndex].question}
          </h3>

          <div className="flex flex-col gap-3">
            {p2Text.questions[currentQuestionIndex].options.map((option, idx) => {
              const isSelected = selectedOption === idx;
              const isCorrectAnswer = idx === p2Text.questions[currentQuestionIndex].correct;
              
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

      {/* RESULTS */}
      {step === 'results' && (
        <div className="flex flex-col items-center text-center py-6">
          <div className="w-16 h-16 bg-red-50 text-focus rounded-full flex items-center justify-center mb-6 text-xl">
            🏆
          </div>

          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight mb-2">
            ¡Ejercicio Completado!
          </h2>
          <p className="text-gray-500 text-sm max-w-xs mx-auto mb-8">
            Aquí están tus estadísticas de rendimiento en la Fase 2.
          </p>

          <div className="grid grid-cols-2 gap-8 w-full max-w-md bg-background border border-border-soft p-6 rounded-2xl mb-8">
            <div className="flex flex-col items-center border-r border-border-soft">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Velocidad</span>
              <span className="text-4xl font-black text-foreground mt-2">{p2Wpm}</span>
              <span className="text-xs text-gray-500 font-semibold mt-1">WPM</span>
            </div>

            <div className="flex flex-col items-center">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Comprensión</span>
              <span className="text-4xl font-black text-foreground mt-2">{scorePercentage}%</span>
              <span className="text-xs text-gray-500 font-semibold mt-1">
                {correctAnswersCount} de {p2Text.questions.length} correctas
              </span>
            </div>
          </div>

          <div className="mb-8 text-xs text-gray-500 max-w-sm leading-relaxed">
            🧠 Lograste entrenar tu vista para <span className="font-bold text-emerald-600">reducir la subvocalización</span> en palabras vacías. La velocidad de lectura alcanzada fue de <span className="font-bold">{p2Wpm} WPM</span>.
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
