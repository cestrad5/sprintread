"use client";

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '../../../store/useAuthStore';
import { useProgressStore } from '../../../store/useProgressStore';
import { LESSON_CATALOG } from '../../../lib/lessonCatalog';
import { getTextForLesson } from '../../../lib/lessonContent';
import { Brain, Lock } from 'lucide-react';

// Exercise Components
import { DiagnosticExercise } from '../../../components/core/DiagnosticExercise';
import { PacingExercise } from '../../../components/core/PacingExercise';
import { SubvocalizationExercise } from '../../../components/core/SubvocalizationExercise';
import { SchulteTableExercise } from '../../../components/core/SchulteTableExercise';
import { RSVPExercise } from '../../../components/core/RSVPExercise';
import { PreReadingExercise } from '../../../components/core/PreReadingExercise';
import { ActiveReadingExercise } from '../../../components/core/ActiveReadingExercise';
import { ImportTextExercise } from '../../../components/core/ImportTextExercise';
import { SpacedRepetitionExercise } from '../../../components/core/SpacedRepetitionExercise';

interface LessonClientProps {
  lessonId: string;
}

export function LessonClient({ lessonId }: LessonClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const { user, loading: authLoading, initializeAuthListener } = useAuthStore();
  const { progress, loading: progressLoading, loadProgress } = useProgressStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const unsubscribe = initializeAuthListener();
    return () => unsubscribe();
  }, [initializeAuthListener]);

  useEffect(() => {
    if (user) {
      loadProgress(user.uid);
    }
  }, [user, loadProgress]);

  // Read practice mode from query params (client-side, works with static export)
  const mode: 'practice' | 'scored' = searchParams.get('practice') === 'true' ? 'practice' : 'scored';

  // Find metadata
  const lesson = LESSON_CATALOG.find(l => l.id === lessonId);
  const text = lesson ? getTextForLesson(lessonId) : null;

  if (!mounted || authLoading || progressLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center">
        <Brain className="animate-spin text-focus mb-4" size={32} />
        <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Cargando ejercicio...</p>
      </div>
    );
  }

  // Auth Protection
  if (!user) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6">
        <Lock className="text-gray-400 mb-4" size={32} />
        <h3 className="text-lg font-bold text-foreground">Inicio de sesión requerido</h3>
        <p className="text-xs text-gray-500 max-w-xs mt-2">Debes iniciar sesión para realizar este ejercicio.</p>
        <button 
          onClick={() => router.push('/')}
          className="mt-6 px-6 py-2.5 bg-foreground text-surface text-xs font-bold rounded-xl shadow-md"
        >
          Volver al Dashboard
        </button>
      </div>
    );
  }

  // Not found
  if (!lesson || !text) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6">
        <h3 className="text-lg font-bold text-foreground">Ejercicio no encontrado</h3>
        <p className="text-xs text-gray-500 max-w-xs mt-2">El identificador de lección "{lessonId}" no existe en el catálogo.</p>
        <button 
          onClick={() => router.push('/')}
          className="mt-6 px-6 py-2.5 bg-foreground text-surface text-xs font-bold rounded-xl shadow-md"
        >
          Volver al Dashboard
        </button>
      </div>
    );
  }

  // Practice mode banner (shown above all exercises)
  const PracticeBanner = mode === 'practice' ? (
    <div className="w-full max-w-4xl mx-auto mb-4 px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 font-semibold flex items-center gap-2">
      🏋️ <span><strong>Modo Práctica Libre</strong> — Este recorrido no se guarda en tu historial de progreso. Úsalo para entrenar antes del ejercicio oficial.</span>
    </div>
  ) : null;

  // Render Exercise according to type
  switch (lessonId) {
    case 'M1L1': // Test de diagnóstico
    case 'M4L4': // Certificación final
      return <>{PracticeBanner}<DiagnosticExercise userId={user.uid} lesson={lesson} text={text} /></>;
    
    case 'M1L2': // Pacing Visual
    case 'M1L3': // Máscara de regresión
    case 'M2L4': // Indentación Periférica
    case 'M3L2': // Modo Unidireccional
      return <>{PracticeBanner}<PacingExercise userId={user.uid} lesson={lesson} text={text} mode={mode} /></>;
    
    case 'M1L4': // Concientización de subvocalización
      return <>{PracticeBanner}<SubvocalizationExercise userId={user.uid} lesson={lesson} text={text} /></>;
    
    case 'M1L5': // Schulte 5x5
    case 'M2L3': // Schulte Avanzada 6x6
      return <>{PracticeBanner}<SchulteTableExercise userId={user.uid} lesson={lesson} /></>;
    
    case 'M2L1': // Chunking RSVP
    case 'M2L2': // RSVP ORP
    case 'M3L1': // Sprints
    case 'M3L3': // Wide angle chunks
    case 'M3L4': // Subvocalization metronome
    case 'M3L5': // Pressure RSVP
      return <>{PracticeBanner}<RSVPExercise userId={user.uid} lesson={lesson} text={text} mode={mode} /></>;
    
    case 'M2L5': // Pre-lectura T.H.I.E.V.E.S.
      return <>{PracticeBanner}<PreReadingExercise userId={user.uid} lesson={lesson} text={text} /></>;
    
    case 'M4L1': // Active reading mind map
      return <>{PracticeBanner}<ActiveReadingExercise userId={user.uid} lesson={lesson} text={text} mode={mode} /></>;
    
    case 'M4L2': // Custom Text importer
      return <>{PracticeBanner}<ImportTextExercise userId={user.uid} lesson={lesson} /></>;
    
    case 'M4L3': // Spaced Repetition reviews
      return <>{PracticeBanner}<SpacedRepetitionExercise userId={user.uid} lesson={lesson} /></>;

    default:
      return (
        <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6">
          <h3 className="text-lg font-bold text-foreground">Error de enrutamiento</h3>
          <p className="text-xs text-gray-500 max-w-xs mt-2">La lección no tiene asignada una plantilla de interfaz.</p>
          <button 
            onClick={() => router.push('/')}
            className="mt-6 px-6 py-2.5 bg-foreground text-surface text-xs font-bold rounded-xl shadow-md"
          >
            Volver al Dashboard
          </button>
        </div>
      );
  }
}
