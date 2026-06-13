"use client";

import React, { useState, useEffect, useRef } from 'react';
import { LessonText } from '../../lib/lessonContent';
import { useProgressStore } from '../../store/useProgressStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import { useRouter } from 'next/navigation';
import { Check, X, Award, Clock, Zap, BookOpen, AlertCircle, ArrowRight, Trophy } from 'lucide-react';

interface DiagnosticExerciseProps {
  userId: string;
  lesson: {
    id: string;
    title: string;
    description: string;
  };
  text: LessonText;
}

export function DiagnosticExercise({ userId, lesson, text }: DiagnosticExerciseProps) {
  const router = useRouter();
  const { saveSession, setBaseline, progress } = useProgressStore();
  const { useDyslexicFont } = useSettingsStore();

  const [step, setStep] = useState<'intro' | 'reading' | 'quiz' | 'results'>('intro');
  const [startTime, setStartTime] = useState<number>(0);
  const [readingTimeSeconds, setReadingTimeSeconds] = useState<number>(0);
  const [wpm, setWpm] = useState<number>(0);

  // Quiz state
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [answers, setAnswers] = useState<boolean[]>([]); // Array of correct/incorrect per question
  const [isAnswered, setIsAnswered] = useState<boolean>(false);
  const [correctAnswersCount, setCorrectAnswersCount] = useState<number>(0);

  // Scroll tracking
  const textContainerRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  // Track reading scroll progress
  const handleScroll = () => {
    if (!textContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = textContainerRef.current;
    const scrollPercent = (scrollTop / (scrollHeight - clientHeight)) * 100;
    setScrollProgress(Math.min(100, Math.max(0, scrollPercent)));
  };

  const startReading = () => {
    setStep('reading');
    setStartTime(performance.now());
  };

  const finishReading = () => {
    const endTime = performance.now();
    const timeSec = (endTime - startTime) / 1000;
    setReadingTimeSeconds(timeSec);
    
    // Calculate WPM: (wordCount / timeSec) * 60
    const calculatedWpm = Math.round((text.wordCount / timeSec) * 60);
    setWpm(calculatedWpm);
    setStep('quiz');
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

    // Wait a brief moment to show green/red feedback, then advance
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

  // Save session when landing on results screen
  useEffect(() => {
    if (step === 'results') {
      const scorePercentage = Math.round((correctAnswersCount / text.questions.length) * 100);
      
      const saveResults = async () => {
        // Save to general sessions
        await saveSession(userId, {
          lessonId: lesson.id,
          wpm: wpm,
          wpm_peak: wpm,
          comprehension: scorePercentage,
          regressions: 0, // Diagnostic doesn't measure physical regressions
          duration: Math.round(readingTimeSeconds),
          deviceType: window.innerWidth < 768 ? 'mobile' : 'desktop'
        });

        // If it's the diagnostic test (M1L1) and baseline hasn't been set yet
        if (lesson.id === 'M1L1' && progress.wpmBaseline === 0) {
          await setBaseline(userId, wpm, scorePercentage);
        }
      };

      saveResults();
    }
  }, [step, correctAnswersCount, wpm, readingTimeSeconds, lesson.id, userId, text.questions.length]);

  const comprehensionScore = Math.round((correctAnswersCount / text.questions.length) * 100);

  // Simple percentile estimator based on WPM
  const getPercentile = (w: number) => {
    if (w < 150) return 10;
    if (w < 200) return 30;
    if (w < 250) return 55;
    if (w < 300) return 75;
    if (w < 400) return 90;
    if (w < 500) return 96;
    return 99;
  };

  return (
    <div className={`w-full max-w-2xl mx-auto bg-surface p-6 md:p-8 rounded-3xl border border-border-soft shadow-sm ${useDyslexicFont ? 'font-dyslexic' : ''}`}>
      
      {/* INTRO SCREEN */}
      {step === 'intro' && (
        <div className="flex flex-col items-center text-center py-6">
          <div className="w-16 h-16 bg-red-50 text-focus rounded-full flex items-center justify-center mb-6">
            <Award size={32} />
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight mb-3">
            {lesson.title}
          </h2>
          <p className="text-gray-500 mb-6 max-w-md text-sm leading-relaxed">
            {lesson.id === 'M1L1' 
              ? 'Este test inicial mide tu velocidad de lectura actual (WPM) y tu nivel de comprensión básica. Lee a tu ritmo natural, sin prisa, ya que al final responderás un cuestionario.'
              : 'Esta es tu prueba de certificación final. Se requiere una velocidad mínima de 500 WPM y 70% de comprensión para graduarte.'}
          </p>

          <div className="bg-background border border-border-soft p-4 rounded-2xl w-full max-w-sm mb-8 text-left text-xs text-gray-500 flex items-start gap-3">
            <AlertCircle className="text-focus flex-none mt-0.5" size={16} />
            <div>
              <span className="font-bold block text-foreground mb-0.5">Indicaciones:</span>
              - Mantén el dispositivo a unos 40 cm de tus ojos.<br/>
              - Haz click en "Comenzar" para revelar el texto.<br/>
              - Lee completo y pulsa "Terminé de leer" inmediatamente al finalizar.
            </div>
          </div>

          <button
            onClick={startReading}
            className="px-8 py-3.5 bg-foreground text-surface rounded-xl font-bold text-sm shadow-md hover:bg-black transition-all active:scale-95 flex items-center gap-2"
          >
            Comenzar Prueba <ArrowRight size={16} />
          </button>
        </div>
      )}

      {/* READING SCREEN */}
      {step === 'reading' && (
        <div className="flex flex-col h-[70vh]">
          {/* Scroll progress bar */}
          <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden mb-6 flex-none">
            <div className="h-full bg-focus transition-all duration-150" style={{ width: `${scrollProgress}%` }} />
          </div>

          <div className="flex justify-between items-center text-xs text-gray-400 font-semibold mb-4 uppercase tracking-wider flex-none">
            <span>{text.title}</span>
            <span>Nivel {text.level}</span>
          </div>

          {/* Text body */}
          <div 
            ref={textContainerRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto pr-2 text-foreground text-lg md:text-xl font-sans leading-relaxed tracking-normal max-w-xl mx-auto scroll-smooth"
            style={{ fontSize: '18px', lineHeight: '1.8' }}
          >
            <div className="whitespace-pre-line pb-20 select-none">
              {text.body}
            </div>
          </div>

          {/* Floating button or bottom bar */}
          <div className="flex justify-end p-4 border-t border-border-soft flex-none bg-surface">
            <button
              onClick={finishReading}
              className="px-8 py-4 bg-focus hover:bg-red-700 text-white rounded-xl font-extrabold text-sm shadow-lg active:scale-95 transition-transform"
            >
              Terminé de leer
            </button>
          </div>
        </div>
      )}

      {/* QUIZ SCREEN */}
      {step === 'quiz' && (
        <div className="py-4">
          <div className="flex justify-between items-center text-xs text-gray-400 font-bold mb-6 uppercase tracking-wider">
            <span>Cuestionario de Comprensión</span>
            <span>Pregunta {currentQuestionIndex + 1} de {text.questions.length}</span>
          </div>

          {/* Progress bar */}
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
                // Highlight the correct answer if the user got it wrong
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
              className="px-6 py-3 bg-foreground hover:bg-black text-surface text-xs font-bold rounded-xl transition-colors disabled:opacity-30 disabled:pointer-events-none"
            >
              Confirmar Respuesta
            </button>
          </div>
        </div>
      )}

      {/* RESULTS SCREEN */}
      {step === 'results' && (
        <div className="flex flex-col items-center text-center py-6">
          <div className="w-16 h-16 bg-red-50 text-focus rounded-full flex items-center justify-center mb-6">
            <Trophy size={32} />
          </div>

          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight mb-2">
            ¡Prueba Finalizada!
          </h2>
          <p className="text-gray-500 text-sm max-w-xs mx-auto mb-8">
            Hemos analizado tus resultados de lectura y comprensión.
          </p>

          <div className="grid grid-cols-2 gap-8 w-full max-w-md bg-background border border-border-soft p-6 rounded-2xl mb-8">
            
            {/* Speed WPM */}
            <div className="flex flex-col items-center border-r border-border-soft">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
                <Zap size={10} className="text-yellow-500 fill-yellow-500" /> Velocidad
              </span>
              <span className="text-5xl font-black text-foreground mt-2">{wpm}</span>
              <span className="text-xs text-gray-500 font-semibold mt-1">WPM</span>
            </div>

            {/* Comprehension */}
            <div className="flex flex-col items-center">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
                <BookOpen size={10} className="text-focus" /> Comprensión
              </span>
              <span className="text-5xl font-black text-foreground mt-2">{comprehensionScore}%</span>
              <span className="text-xs text-gray-500 font-semibold mt-1">
                {correctAnswersCount} de {text.questions.length} correctas
              </span>
            </div>

          </div>

          <div className="bg-white border border-border-soft p-4 rounded-xl text-xs text-gray-500 mb-8 max-w-sm leading-relaxed">
            🚀 Estás en el <span className="font-bold text-foreground">percentil {getPercentile(wpm)}%</span> de velocidad de lectura. 
            {lesson.id === 'M1L1' 
              ? ' Tu velocidad base ha sido guardada en tu perfil. Comenzaremos tu entrenamiento desde este punto de calibración.'
              : comprehensionScore >= 70 && wpm >= 500
                ? ' ¡Felicidades! Cumples con los requisitos para certificarte en SprintRead.'
                : ' Te sugerimos volver a repetir la certificación para afianzar tus habilidades.'}
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
