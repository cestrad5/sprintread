"use client";

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { LessonText } from '../../lib/lessonContent';
import { useProgressStore } from '../../store/useProgressStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import { useRouter } from 'next/navigation';
import { Clock, Eye, Sparkles, Check, X, ArrowRight, Award } from 'lucide-react';

interface PreReadingProps {
  userId: string;
  lesson: {
    id: string;
    title: string;
    description: string;
  };
  text: LessonText;
}

const PREDICTION_OPTIONS = [
  'La plasticidad cerebral en el aprendizaje',
  'Estudios científicos sobre sacadas y movimientos oculares',
  'El impacto de la subvocalización en la velocidad de lectura',
  'La nutrición y su influencia en la memoria visual',
  'El desarrollo evolutivo de la visión binocular',
  'La diferencia de WPM entre géneros literarios'
];

export function PreReadingExercise({ userId, lesson, text }: PreReadingProps) {
  const router = useRouter();
  const { saveSession } = useProgressStore();
  const { useDyslexicFont } = useSettingsStore();

  const [step, setStep] = useState<'intro' | 'scan' | 'predict' | 'reading' | 'quiz' | 'results'>('intro');
  
  // Scan state
  const [scanSeconds, setScanSeconds] = useState(45);
  const scanIntervalRef = useRef<any>(null);

  // Prediction state
  const [selectedPredictions, setSelectedPredictions] = useState<string[]>([]);
  const [correctPredictions, setCorrectPredictions] = useState<string[]>([]);

  // Reading state
  const [startTime, setStartTime] = useState(0);
  const [readingTime, setReadingTime] = useState(0);

  // Quiz state
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [answers, setAnswers] = useState<boolean[]>([]);
  const [isAnswered, setIsAnswered] = useState<boolean>(false);
  const [correctAnswersCount, setCorrectAnswersCount] = useState<number>(0);

  // Split text into paragraphs for the scanning highlight
  const paragraphs = useMemo(() => {
    return text.body.split('\n\n').filter(p => p.trim().length > 0);
  }, [text.body]);

  // Start 45s scanning
  const startScanning = () => {
    setStep('scan');
    setScanSeconds(45);
    scanIntervalRef.current = setInterval(() => {
      setScanSeconds(prev => {
        if (prev <= 1) {
          clearInterval(scanIntervalRef.current);
          setStep('predict');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    return () => {
      if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
    };
  }, []);

  const handleTogglePrediction = (opt: string) => {
    setSelectedPredictions(prev => 
      prev.includes(opt) ? prev.filter(p => p !== opt) : [...prev, opt]
    );
  };

  const submitPredictions = () => {
    if (selectedPredictions.length === 0) return;

    // Check which predictions are actually relevant to the text
    // (Basic text matching keyword analysis)
    const matches = selectedPredictions.filter(p => {
      const keywords = p.toLowerCase().split(/\s+/).filter(k => k.length > 4);
      return keywords.some(kw => text.body.toLowerCase().includes(kw));
    });
    setCorrectPredictions(matches);

    setStep('reading');
    setStartTime(performance.now());
  };

  const finishReading = () => {
    setReadingTime((performance.now() - startTime) / 1000);
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

  // Save progress
  useEffect(() => {
    if (step === 'results') {
      const calculatedWpm = Math.round((text.wordCount / readingTime) * 60);
      const quizScore = Math.round((correctAnswersCount / text.questions.length) * 100);
      
      saveSession(userId, {
        lessonId: lesson.id,
        wpm: calculatedWpm,
        wpm_peak: calculatedWpm,
        comprehension: quizScore,
        regressions: 0,
        duration: Math.round(readingTime + 45), // reading + scan time
        deviceType: window.innerWidth < 768 ? 'mobile' : 'desktop'
      });
    }
  }, [step]);

  const scorePercentage = Math.round((correctAnswersCount / text.questions.length) * 100);

  return (
    <div className={`w-full max-w-2xl mx-auto bg-surface p-6 md:p-8 rounded-3xl border border-border-soft shadow-sm ${useDyslexicFont ? 'font-dyslexic' : ''}`}>
      
      {/* INTRO */}
      {step === 'intro' && (
        <div className="flex flex-col items-center text-center py-6">
          <div className="w-16 h-16 bg-red-50 text-focus rounded-full flex items-center justify-center mb-6">
            <Sparkles size={32} />
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight mb-3">
            {lesson.title}
          </h2>
          <p className="text-gray-500 mb-6 max-w-md text-sm leading-relaxed">
            La técnica T.H.I.E.V.E.S. consiste en escanear títulos, encabezados y la primera frase de cada párrafo antes de leer. Esto activa tu esquema cognitivo y mejora la comprensión en hasta 40%.
          </p>

          <div className="bg-background border border-border-soft p-4 rounded-2xl w-full max-w-sm mb-8 text-left text-xs leading-relaxed text-gray-500 flex flex-col gap-2">
            <span className="font-bold text-foreground">¿Cómo funciona la práctica?</span>
            <span>1. Escaneo rápido de 45s: el texto estará oculto excepto los encabezados y primeras oraciones.</span>
            <span>2. Predicciones: elegirás qué temas crees que abordará el texto.</span>
            <span>3. Lectura completa y quiz final.</span>
          </div>

          <button
            onClick={startScanning}
            className="px-8 py-3.5 bg-foreground text-surface rounded-xl font-bold text-sm shadow-md hover:bg-black transition-all active:scale-95 flex items-center gap-2"
          >
            Comenzar Escaneo (45s) <ArrowRight size={16} />
          </button>
        </div>
      )}

      {/* SCANNING PHASE */}
      {step === 'scan' && (
        <div className="flex flex-col h-[70vh]">
          <div className="flex justify-between items-center text-xs text-gray-400 font-bold mb-4 uppercase tracking-wider flex-none">
            <span className="flex items-center gap-1 text-focus">
              <Clock size={12} className="animate-spin" /> Escaneando: {scanSeconds}s restantes
            </span>
            <span>Fase T.H.I.E.V.E.S.</span>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-6 border border-border-soft rounded-2xl bg-background/50 select-none">
            <h1 className="text-2xl font-black mb-6">{text.title}</h1>
            
            <div className="flex flex-col gap-6 text-base font-sans">
              {paragraphs.map((p, idx) => {
                // Get the first sentence of the paragraph
                const sentences = p.split(/[.!?]/);
                const firstSentence = sentences[0] ? sentences[0] + '.' : '';
                const restOfParagraph = p.slice(firstSentence.length);

                return (
                  <p key={idx} className="leading-relaxed">
                    <span className="font-extrabold text-foreground border-l-2 border-focus pl-2 inline-block">
                      {firstSentence}
                    </span>
                    <span className="opacity-0 select-none pointer-events-none blur-md">
                      {restOfParagraph}
                    </span>
                  </p>
                );
              })}
            </div>
          </div>

          <button
            onClick={() => {
              if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
              setStep('predict');
            }}
            className="mt-6 py-3.5 bg-foreground hover:bg-black text-surface font-bold text-xs rounded-xl shadow-md active:scale-95"
          >
            Saltar Escaneo e Ir a Predicciones
          </button>
        </div>
      )}

      {/* PREDICTIONS */}
      {step === 'predict' && (
        <div className="py-4">
          <h3 className="text-xl font-extrabold tracking-tight mb-3 text-center">Tus Predicciones Cognitivas</h3>
          <p className="text-xs text-gray-500 text-center mb-6 max-w-sm mx-auto">
            Basándote en las pistas estructurales que acabas de escanear, ¿qué temas crees que se tratan en este artículo?
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
            {PREDICTION_OPTIONS.map((opt, idx) => {
              const isSelected = selectedPredictions.includes(opt);
              return (
                <button
                  key={idx}
                  onClick={() => handleTogglePrediction(opt)}
                  className={`p-4 border rounded-2xl text-left text-xs font-semibold transition-all active:scale-98 flex items-center justify-between gap-3 ${
                    isSelected ? 'border-foreground bg-gray-50 text-foreground font-bold' : 'border-border-soft bg-white text-gray-500'
                  }`}
                >
                  <span>{opt}</span>
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center flex-none ${
                    isSelected ? 'bg-foreground border-foreground text-surface' : 'border-gray-300 bg-white'
                  }`}>
                    {isSelected && <Check size={10} />}
                  </div>
                </button>
              );
            })}
          </div>

          <button
            onClick={submitPredictions}
            disabled={selectedPredictions.length === 0}
            className="w-full py-3.5 bg-focus hover:bg-red-700 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 disabled:opacity-30"
          >
            Revelar Texto Completo y Leer <ArrowRight size={16} />
          </button>
        </div>
      )}

      {/* READING PHASE */}
      {step === 'reading' && (
        <div className="flex flex-col h-[70vh]">
          <div className="flex justify-between items-center text-xs text-gray-400 font-bold mb-4 uppercase tracking-wider flex-none">
            <span>Lectura Completa del Texto</span>
            <span>Nivel {text.level}</span>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 text-foreground text-lg md:text-xl font-sans leading-relaxed tracking-normal max-w-xl mx-auto scroll-smooth">
            <div className="whitespace-pre-line pb-20 select-none">
              {text.body}
            </div>
          </div>

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

      {/* QUIZ */}
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
            🏆
          </div>

          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight mb-2">
            ¡Ejercicio Completado!
          </h2>
          <p className="text-gray-500 text-sm max-w-xs mx-auto mb-8">
            Aquí están tus estadísticas de rendimiento.
          </p>

          <div className="grid grid-cols-2 gap-8 w-full max-w-md bg-background border border-border-soft p-6 rounded-2xl mb-8">
            <div className="flex flex-col items-center border-r border-border-soft">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Velocidad</span>
              <span className="text-4xl font-black text-foreground mt-2">
                {Math.round((text.wordCount / readingTime) * 60)}
              </span>
              <span className="text-xs text-gray-500 font-semibold mt-1">WPM</span>
            </div>

            <div className="flex flex-col items-center">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Comprensión</span>
              <span className="text-4xl font-black text-foreground mt-2">{scorePercentage}%</span>
              <span className="text-xs text-gray-500 font-semibold mt-1">
                {correctAnswersCount} de {text.questions.length} correctas
              </span>
            </div>
          </div>

          <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl text-xs text-emerald-800 max-w-sm mb-8 text-left">
            🎯 <span className="font-extrabold">Predicciones correctas: {correctPredictions.length} de {selectedPredictions.length}</span><br/>
            Escanear el texto estructuralmente preparó a tu lóbulo frontal para clasificar los datos de forma inmediata durante la lectura.
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
