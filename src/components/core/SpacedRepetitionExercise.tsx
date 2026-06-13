"use client";

import React, { useState, useEffect } from 'react';
import { useProgressStore } from '../../store/useProgressStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import { useRouter } from 'next/navigation';
import { db } from '../../lib/firebase';
import { collection, doc, setDoc, getDocs, Timestamp, query, where } from 'firebase/firestore';
import { RefreshCw, Check, BookOpen, AlertCircle, ArrowRight, Brain, Sparkles } from 'lucide-react';

interface SpacedRepetitionProps {
  userId: string;
  lesson: {
    id: string;
    title: string;
    description: string;
  };
}

interface SpacedConcept {
  id: string;
  text: string;
  definition: string;
  sourceLesson: string;
  nextReview: any; // Timestamp
  interval: number; // in days
  easeFactor: number; // SM-2 EF
  repetitions: number;
  lastScore: number;
}

// Initial seed concepts based on Modules 1 & 2 content
const SEED_CONCEPTS: Omit<SpacedConcept, 'nextReview'>[] = [
  {
    id: 'concept-sacadas',
    text: 'Sacadas Oculares',
    definition: 'Pequeños saltos balísticos que realizan los ojos al leer. Ocurren entre 3 y 4 veces por segundo.',
    sourceLesson: 'M1L1',
    interval: 1,
    easeFactor: 2.5,
    repetitions: 0,
    lastScore: 0
  },
  {
    id: 'concept-subvocalizacion',
    text: 'Subvocalización Selectiva',
    definition: 'Técnica de silenciar la voz interna para palabras funcionales (de, que, para) y activarla solo para términos densos.',
    sourceLesson: 'M1L4',
    interval: 1,
    easeFactor: 2.5,
    repetitions: 0,
    lastScore: 0
  },
  {
    id: 'concept-span-foveal',
    text: 'Span Foveal',
    definition: 'El área de enfoque nítido del ojo (fóvea), que abarca aproximadamente de 7 a 9 caracteres o 2 palabras.',
    sourceLesson: 'M1L5',
    interval: 1,
    easeFactor: 2.5,
    repetitions: 0,
    lastScore: 0
  },
  {
    id: 'concept-pacing',
    text: 'Pacing Visual',
    definition: 'Uso de un marcador físico o digital (guía) para eliminar las regresiones innecesarias de la mirada.',
    sourceLesson: 'M1L2',
    interval: 1,
    easeFactor: 2.5,
    repetitions: 0,
    lastScore: 0
  },
  {
    id: 'concept-mielinizacion',
    text: 'Mielinización Visual',
    definition: 'Recubrimiento graso que acelera las señales neuronales del procesamiento visual, fortalecido con la práctica constante.',
    sourceLesson: 'M1L3',
    interval: 1,
    easeFactor: 2.5,
    repetitions: 0,
    lastScore: 0
  }
];

export function SpacedRepetitionExercise({ userId, lesson }: SpacedRepetitionProps) {
  const router = useRouter();
  const { useDyslexicFont } = useSettingsStore();

  const [step, setStep] = useState<'intro' | 'review' | 'finished'>('intro');
  const [concepts, setConcepts] = useState<SpacedConcept[]>([]);
  const [loading, setLoading] = useState(true);

  // Review state
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [reviewedConcepts, setReviewedConcepts] = useState<SpacedConcept[]>([]);

  // Load concepts from Firestore
  useEffect(() => {
    const fetchConcepts = async () => {
      setLoading(true);
      try {
        const colRef = collection(db, 'users', userId, 'spaced_review');
        const snap = await getDocs(colRef);
        
        let loaded: SpacedConcept[] = [];
        snap.forEach((doc) => {
          loaded.push({ id: doc.id, ...doc.data() } as SpacedConcept);
        });

        // Filter for due concepts (nextReview <= now)
        const now = Date.now();
        let due = loaded.filter(c => {
          const reviewMs = c.nextReview instanceof Timestamp 
            ? c.nextReview.toMillis() 
            : new Date(c.nextReview?.seconds * 1000 || 0).getTime();
          return reviewMs <= now;
        });

        // If no concepts are due or saved, seed initial concepts
        if (loaded.length === 0) {
          const seedWithTimestamps = SEED_CONCEPTS.map(c => ({
            ...c,
            nextReview: Timestamp.now()
          }));
          
          // Save seeds asynchronously to Firestore
          for (const s of seedWithTimestamps) {
            const docRef = doc(db, 'users', userId, 'spaced_review', s.id);
            await setDoc(docRef, s);
          }
          
          setConcepts(seedWithTimestamps);
        } else {
          // If they have concepts but none due, show all for review/practice anyway
          setConcepts(due.length > 0 ? due : loaded);
        }
      } catch (e) {
        console.error('Failed to fetch review concepts', e);
        // Fallback to offline local seed
        setConcepts(SEED_CONCEPTS.map(c => ({ ...c, nextReview: Timestamp.now() })));
      } finally {
        setLoading(false);
      }
    };

    fetchConcepts();
  }, [userId]);

  const handleStartReview = () => {
    if (concepts.length === 0) return;
    setStep('review');
    setCurrentIndex(0);
    setShowAnswer(false);
    setReviewedConcepts([]);
  };

  // SM-2 Review engine
  const handleScore = async (score: 0 | 3 | 5) => {
    const current = concepts[currentIndex];
    
    // Math logic of SM-2
    let nextInterval = 1;
    let nextRepetitions = current.repetitions;
    let nextEaseFactor = current.easeFactor;

    if (score >= 3) {
      if (current.repetitions === 0) {
        nextInterval = 1;
      } else if (current.repetitions === 1) {
        nextInterval = 3;
      } else {
        nextInterval = Math.round(current.interval * current.easeFactor);
      }
      nextRepetitions += 1;
    } else {
      nextInterval = 1;
      nextRepetitions = 0;
    }

    // Update Ease Factor: EF' = EF + (0.1 - (5 - score) * (0.08 + (5 - score) * 0.02))
    nextEaseFactor = current.easeFactor + (0.1 - (5 - score) * (0.08 + (5 - score) * 0.02));
    nextEaseFactor = Math.max(1.3, nextEaseFactor);

    const updatedConcept: SpacedConcept = {
      ...current,
      interval: nextInterval,
      repetitions: nextRepetitions,
      easeFactor: Number(nextEaseFactor.toFixed(2)),
      lastScore: score,
      nextReview: Timestamp.fromMillis(Date.now() + nextInterval * 24 * 60 * 60 * 1000)
    };

    // Save back to Firestore
    try {
      const docRef = doc(db, 'users', userId, 'spaced_review', current.id);
      await setDoc(docRef, updatedConcept);
    } catch (e) {
      console.error('Failed to sync concept', e);
    }

    setReviewedConcepts(prev => [...prev, updatedConcept]);

    // Go to next
    if (currentIndex < concepts.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setShowAnswer(false);
    } else {
      // Completed the session
      const { saveSession } = useProgressStore.getState();
      await saveSession(userId, {
        lessonId: lesson.id,
        wpm: 0, // 0 for reviews
        wpm_peak: 0,
        comprehension: Math.round((reviewedConcepts.filter(c => c.lastScore >= 3).length / concepts.length) * 100),
        regressions: 0,
        duration: 180, // simulated review duration (3 min)
        deviceType: window.innerWidth < 768 ? 'mobile' : 'desktop'
      });
      setStep('finished');
    }
  };

  return (
    <div className={`w-full max-w-xl mx-auto bg-surface p-6 md:p-8 rounded-3xl border border-border-soft shadow-sm ${useDyslexicFont ? 'font-dyslexic' : ''}`}>
      
      {/* INTRO SCREEN */}
      {step === 'intro' && (
        <div className="flex flex-col items-center text-center py-6">
          <div className="w-16 h-16 bg-red-50 text-focus rounded-full flex items-center justify-center mb-6">
            <RefreshCw size={32} className="animate-spin-slow text-focus" />
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight mb-3">
            {lesson.title}
          </h2>
          <p className="text-gray-500 mb-6 max-w-sm text-sm leading-relaxed">
            Consolida tu memoria a largo plazo utilizando repetición espaciada. El algoritmo de Anki (SM-2) calculará cuándo debes volver a repasar cada concepto para evitar el olvido con el mínimo esfuerzo.
          </p>

          {loading ? (
            <div className="text-xs text-gray-400 font-semibold mb-8 animate-pulse">
              Cargando cola de repaso...
            </div>
          ) : (
            <div className="bg-background border border-border-soft p-5 rounded-2xl w-full max-w-sm mb-8 text-left">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Resumen de Hoy</span>
              <div className="text-sm font-extrabold text-foreground flex justify-between">
                <span>Conceptos listos para repasar:</span>
                <span className="text-focus">{concepts.length}</span>
              </div>
            </div>
          )}

          <button
            onClick={handleStartReview}
            disabled={loading || concepts.length === 0}
            className="px-8 py-3.5 bg-foreground text-surface rounded-xl font-bold text-sm shadow-md hover:bg-black transition-all active:scale-95 flex items-center gap-2 disabled:opacity-30"
          >
            Iniciar Repaso <ArrowRight size={16} />
          </button>
        </div>
      )}

      {/* ACTIVE REVIEW SCREEN */}
      {step === 'review' && concepts[currentIndex] && (
        <div className="flex flex-col select-none py-2">
          {/* Header Progress */}
          <div className="flex justify-between items-center text-xs text-gray-400 font-bold uppercase tracking-wider mb-6">
            <span>Repetición Espaciada (SM-2)</span>
            <span>Concepto {currentIndex + 1} de {concepts.length}</span>
          </div>

          {/* Flashcard container */}
          <div className="min-h-[200px] border border-border-soft rounded-2xl p-6 bg-background/50 flex flex-col justify-center items-center text-center relative mb-8 shadow-inner transition-all duration-300">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest absolute top-4">
              Concepto Clave
            </span>

            <h3 className="text-2xl font-black text-foreground tracking-tight max-w-xs leading-tight">
              {concepts[currentIndex].text}
            </h3>

            {showAnswer ? (
              <p className="text-sm text-gray-600 font-semibold leading-relaxed max-w-sm mt-4 p-4 bg-white border border-border-soft rounded-2xl animate-fade-in shadow-xs">
                {concepts[currentIndex].definition}
              </p>
            ) : (
              <button
                onClick={() => setShowAnswer(true)}
                className="mt-6 px-6 py-2.5 bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold rounded-xl shadow-xs hover:bg-indigo-100 transition-colors"
              >
                Revelar Definición
              </button>
            )}
          </div>

          {/* Rating Scale Buttons */}
          {showAnswer && (
            <div className="flex flex-col gap-3">
              <span className="text-xs text-gray-400 font-bold uppercase tracking-wider text-center mb-1">
                ¿Qué tan bien lo recordabas?
              </span>
              
              <div className="grid grid-cols-3 gap-2.5">
                <button
                  onClick={() => handleScore(0)}
                  className="p-3 bg-red-50 border border-red-200 hover:bg-red-100 text-red-800 rounded-xl text-center active:scale-95 transition-transform flex flex-col items-center gap-0.5"
                >
                  <span className="font-extrabold text-xs">No</span>
                  <span className="text-[9px] font-semibold opacity-80">(Repasar hoy)</span>
                </button>

                <button
                  onClick={() => handleScore(3)}
                  className="p-3 bg-amber-50 border border-amber-200 hover:bg-amber-100 text-amber-800 rounded-xl text-center active:scale-95 transition-transform flex flex-col items-center gap-0.5"
                >
                  <span className="font-extrabold text-xs">Dudoso</span>
                  <span className="text-[9px] font-semibold opacity-80">(En 3 días)</span>
                </button>

                <button
                  onClick={() => handleScore(5)}
                  className="p-3 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 text-emerald-800 rounded-xl text-center active:scale-95 transition-transform flex flex-col items-center gap-0.5"
                >
                  <span className="font-extrabold text-xs">Lo sé</span>
                  <span className="text-[9px] font-semibold opacity-80">(En {Math.round(concepts[currentIndex].interval * concepts[currentIndex].easeFactor) || 5} días)</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* FINISHED SCREEN */}
      {step === 'finished' && (
        <div className="flex flex-col items-center text-center py-6">
          <div className="w-16 h-16 bg-red-50 text-focus rounded-full flex items-center justify-center mb-6 text-xl">
            🏆
          </div>

          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight mb-2">
            ¡Repaso Diario Finalizado!
          </h2>
          <p className="text-gray-500 text-sm max-w-xs mx-auto mb-8">
            Has completado tu cola de repetición espaciada de hoy.
          </p>

          <div className="bg-emerald-50 border border-emerald-100 rounded-2xl text-xs text-emerald-800 max-w-sm p-5 mb-8 text-left flex gap-3 shadow-xs">
            <Sparkles className="text-emerald-600 flex-none mt-0.5" size={16} />
            <div>
              <span className="font-extrabold block mb-1">¡Curva del Olvido Mitigada!</span>
              Tus conceptos de lectura y velocidad visual han sido replanificados. La retención a largo plazo se mantiene optimizada para las próximas semanas.
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
