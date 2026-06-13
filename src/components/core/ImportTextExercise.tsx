"use client";

import React, { useState } from 'react';
import { useProgressStore } from '../../store/useProgressStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import { useRouter } from 'next/navigation';
import { RSVPExercise } from './RSVPExercise';
import { PacingExercise } from './PacingExercise';
import { FileText, ArrowRight, Check, Sparkles, Sliders } from 'lucide-react';

interface ImportTextProps {
  userId: string;
  lesson: {
    id: string;
    title: string;
    description: string;
  };
}

export function ImportTextExercise({ userId, lesson }: ImportTextProps) {
  const router = useRouter();
  const { useDyslexicFont } = useSettingsStore();

  const [step, setStep] = useState<'input' | 'configure' | 'reading' | 'self_eval' | 'results'>('input');
  const [customText, setCustomText] = useState('');
  const [customTitle, setCustomTitle] = useState('Texto Importado');
  const [readMode, setReadMode] = useState<'rsvp' | 'pacer' | 'shield'>('rsvp');
  const [wpm, setWpm] = useState<number>(300);

  // Self evaluation score
  const [comprehensionScore, setComprehensionScore] = useState<number>(70);
  const [readingTime, setReadingTime] = useState<number>(0);
  const startTimeRef = useRef<number>(0);

  const wordCount = useMemo(() => {
    return customText.trim().split(/\s+/).filter(w => w.length > 0).length;
  }, [customText]);

  // Construct a dummy LessonText structure for custom text
  const dummyLessonText = useMemo(() => {
    return {
      id: 'custom-import',
      title: customTitle,
      body: customText,
      wordCount: wordCount,
      level: 'B2' as const,
      questions: [] // No pre-defined quiz
    };
  }, [customText, customTitle, wordCount]);

  const handleStartTraining = () => {
    if (!customText.trim() || wordCount < 30) return;
    setStep('configure');
  };

  const launchExercise = () => {
    setStep('reading');
    startTimeRef.current = performance.now();
  };

  const handleExerciseFinished = () => {
    const timeSec = (performance.now() - startTimeRef.current) / 1000;
    setReadingTime(timeSec);
    setStep('self_eval');
  };

  const submitSelfEvaluation = async () => {
    // Save custom text session to progress
    const calculatedWpm = Math.round((wordCount / readingTime) * 60) || wpm;
    
    const { saveSession } = useProgressStore.getState();
    await saveSession(userId, {
      lessonId: lesson.id,
      wpm: calculatedWpm,
      wpm_peak: calculatedWpm,
      comprehension: comprehensionScore,
      regressions: 0,
      duration: Math.round(readingTime),
      deviceType: window.innerWidth < 768 ? 'mobile' : 'desktop'
    });

    setStep('results');
  };

  return (
    <div className={`w-full max-w-2xl mx-auto bg-surface p-6 md:p-8 rounded-3xl border border-border-soft shadow-sm ${useDyslexicFont ? 'font-dyslexic' : ''}`}>
      
      {/* STEP 1: INPUT CUSTOM TEXT */}
      {step === 'input' && (
        <div className="flex flex-col py-4">
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-16 h-16 bg-red-50 text-focus rounded-full flex items-center justify-center mb-4">
              <FileText size={32} />
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight mb-2">
              {lesson.title}
            </h2>
            <p className="text-gray-500 text-sm max-w-md">
              Práctica de transferencia. Pega tu propio artículo, reporte o lectura para entrenar con material real.
            </p>
          </div>

          <div className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Título de la lectura (Opcional)</label>
              <input 
                type="text" 
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                placeholder="Ej. Reporte Trimestral"
                className="w-full px-4 py-2.5 bg-background border border-border-soft rounded-xl text-sm font-semibold text-foreground focus:outline-none focus:border-foreground"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Cuerpo del texto</label>
              <textarea 
                rows={8}
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                placeholder="Pega aquí tu artículo o lectura (mínimo 30 palabras)..."
                className="w-full px-4 py-3 bg-background border border-border-soft rounded-xl text-sm text-foreground focus:outline-none focus:border-foreground resize-none"
              />
              <div className="text-right text-[10px] text-gray-400 font-semibold mt-1">
                {wordCount} palabras
              </div>
            </div>

            <button
              onClick={handleStartTraining}
              disabled={wordCount < 30}
              className="mt-4 w-full py-3.5 bg-foreground hover:bg-black disabled:opacity-30 disabled:pointer-events-none text-surface rounded-xl font-bold text-sm shadow-md transition-all active:scale-98 flex items-center justify-center gap-2"
            >
              Configurar Entrenamiento <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: CONFIGURE MODALITY */}
      {step === 'configure' && (
        <div className="flex flex-col py-4">
          <h3 className="text-xl font-extrabold tracking-tight mb-4 text-center">Modalidad de Entrenamiento</h3>
          
          <div className="flex flex-col gap-3 mb-8">
            {/* RSVP */}
            <button
              onClick={() => setReadMode('rsvp')}
              className={`p-4 border rounded-2xl text-left transition-all active:scale-99 flex justify-between items-center gap-4 ${
                readMode === 'rsvp' ? 'border-foreground bg-gray-50' : 'border-border-soft bg-white'
              }`}
            >
              <div>
                <span className="text-xs font-black block text-foreground uppercase tracking-widest">RSVP Semántico</span>
                <p className="text-[11px] text-gray-400 mt-1 font-semibold">Muestra bloques de palabras uno a uno en el centro de enfoque.</p>
              </div>
              <div className={`w-4.5 h-4.5 rounded-full border flex items-center justify-center ${
                readMode === 'rsvp' ? 'bg-foreground border-foreground text-surface' : 'border-gray-300'
              }`}>
                {readMode === 'rsvp' && <Check size={12} />}
              </div>
            </button>

            {/* PACER */}
            <button
              onClick={() => setReadMode('pacer')}
              className={`p-4 border rounded-2xl text-left transition-all active:scale-99 flex justify-between items-center gap-4 ${
                readMode === 'pacer' ? 'border-foreground bg-gray-50' : 'border-border-soft bg-white'
              }`}
            >
              <div>
                <span className="text-xs font-black block text-foreground uppercase tracking-widest">Marcador de Línea (Pacing)</span>
                <p className="text-[11px] text-gray-400 mt-1 font-semibold">Barra horizontal animada sobre el texto completo en página.</p>
              </div>
              <div className={`w-4.5 h-4.5 rounded-full border flex items-center justify-center ${
                readMode === 'pacer' ? 'bg-foreground border-foreground text-surface' : 'border-gray-300'
              }`}>
                {readMode === 'pacer' && <Check size={12} />}
              </div>
            </button>

            {/* SHIELD */}
            <button
              onClick={() => setReadMode('shield')}
              className={`p-4 border rounded-2xl text-left transition-all active:scale-99 flex justify-between items-center gap-4 ${
                readMode === 'shield' ? 'border-foreground bg-gray-50' : 'border-border-soft bg-white'
              }`}
            >
              <div>
                <span className="text-xs font-black block text-foreground uppercase tracking-widest">Escudo Anti-Regresión</span>
                <p className="text-[11px] text-gray-400 mt-1 font-semibold">Tapa con máscara opaca el texto ya leído para forzar una sola pasada.</p>
              </div>
              <div className={`w-4.5 h-4.5 rounded-full border flex items-center justify-center ${
                readMode === 'shield' ? 'bg-foreground border-foreground text-surface' : 'border-gray-300'
              }`}>
                {readMode === 'shield' && <Check size={12} />}
              </div>
            </button>
          </div>

          {/* Speed settings */}
          <div className="bg-background border border-border-soft p-5 rounded-2xl w-full max-w-sm mx-auto mb-8">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 text-center">
              Calibrar Velocidad del Ejercicio
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

          <div className="flex gap-4">
            <button
              onClick={() => setStep('input')}
              className="flex-1 py-3.5 bg-background border border-border-soft rounded-xl text-foreground font-bold text-sm hover:bg-gray-50 active:scale-98"
            >
              Atrás
            </button>
            <button
              onClick={launchExercise}
              className="flex-1 py-3.5 bg-foreground text-surface rounded-xl font-bold text-sm hover:bg-black active:scale-98 flex items-center justify-center gap-1.5"
            >
              Comenzar Entrenamiento <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: PLAYING EXERCISE */}
      {step === 'reading' && (
        <div>
          {readMode === 'rsvp' && (
            <RSVPExercise 
              userId={userId}
              lesson={{ id: 'custom-import', title: customTitle, description: 'Lectura RSVP' }}
              text={dummyLessonText}
            />
          )}

          {readMode === 'pacer' && (
            <PacingExercise 
              userId={userId}
              lesson={{ id: 'M1L2', title: customTitle, description: 'Lectura Pacing' }} // M1L2 triggers normal pacing
              text={dummyLessonText}
            />
          )}

          {readMode === 'shield' && (
            <PacingExercise 
              userId={userId}
              lesson={{ id: 'M1L3', title: customTitle, description: 'Lectura Shield' }} // M1L3 triggers regression shield mask
              text={dummyLessonText}
            />
          )}

          {/* Fallback button in case of finish */}
          <div className="mt-8 flex justify-center border-t border-border-soft pt-6">
            <button
              onClick={handleExerciseFinished}
              className="px-8 py-3.5 bg-focus hover:bg-red-700 text-white rounded-xl font-bold text-sm shadow-md"
            >
              Completar Lectura e Ir a Evaluación
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: SELF COMPREHENSION EVALUATION */}
      {step === 'self_eval' && (
        <div className="flex flex-col py-4 max-w-md mx-auto items-center text-center">
          <div className="w-16 h-16 bg-red-50 text-focus rounded-full flex items-center justify-center mb-6">
            <Sliders size={32} />
          </div>

          <h3 className="text-xl font-extrabold tracking-tight mb-3">Autoevaluación de Comprensión</h3>
          <p className="text-xs text-gray-500 mb-8 leading-relaxed">
            Dado que se trata de un texto personalizado sin cuestionario estructurado, estima sinceramente tu nivel de comprensión y retención percibida de las ideas clave.
          </p>

          {/* Score selector */}
          <div className="bg-background border border-border-soft p-6 rounded-2xl w-full mb-8">
            <input 
              type="range" 
              min="0" 
              max="100" 
              step="5"
              value={comprehensionScore} 
              onChange={(e) => setComprehensionScore(Number(e.target.value))}
              className="w-full accent-focus"
            />
            <div className="text-4xl font-black mt-3">{comprehensionScore}%</div>
            <span className="text-[10px] text-gray-400 font-semibold block mt-1 uppercase tracking-widest">Comprensión Percibida</span>
          </div>

          <button
            onClick={submitSelfEvaluation}
            className="w-full py-3.5 bg-foreground hover:bg-black text-surface font-bold text-sm rounded-xl"
          >
            Guardar y Finalizar Sesión
          </button>
        </div>
      )}

      {/* STEP 5: RESULTS SCREEN */}
      {step === 'results' && (
        <div className="flex flex-col items-center text-center py-6">
          <div className="w-16 h-16 bg-red-50 text-focus rounded-full flex items-center justify-center mb-6 text-xl">
            🏆
          </div>

          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight mb-2">
            ¡Sesión de Texto Propio Completada!
          </h2>
          <p className="text-gray-500 text-sm max-w-xs mx-auto mb-8">
            Tu velocidad y comprensión autoevaluada han sido sincronizadas.
          </p>

          <div className="grid grid-cols-2 gap-8 w-full max-w-md bg-background border border-border-soft p-6 rounded-2xl mb-8">
            <div className="flex flex-col items-center border-r border-border-soft">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Velocidad</span>
              <span className="text-4xl font-black text-foreground mt-2">
                {Math.round((wordCount / readingTime) * 60) || wpm}
              </span>
              <span className="text-xs text-gray-500 font-semibold mt-1">WPM</span>
            </div>

            <div className="flex flex-col items-center">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Comprensión</span>
              <span className="text-4xl font-black text-foreground mt-2">{comprehensionScore}%</span>
              <span className="text-xs text-gray-500 font-semibold mt-1">Autoevaluado</span>
            </div>
          </div>

          <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl text-xs text-emerald-800 max-w-sm mb-8 text-left flex gap-3">
            <Sparkles className="text-emerald-600 flex-none mt-0.5" size={16} />
            <div>
              <span className="font-extrabold block mb-0.5">Transferencia Lograda:</span>
              Has aplicado exitosamente las habilidades de lectura rápida foveal en tus propios contenidos de trabajo o estudio. ¡Sigue así!
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

// Simple ref wrapper because import text uses ref inside
import { useRef, useMemo } from 'react';
