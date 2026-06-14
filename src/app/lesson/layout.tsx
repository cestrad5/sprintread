"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowLeft, Zap } from 'lucide-react';
import { useSettingsStore } from '../../store/useSettingsStore';
import { LESSON_CATALOG } from '../../lib/lessonCatalog';

export default function LessonLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { useDyslexicFont, setUseDyslexicFont } = useSettingsStore();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Derive lesson info from URL
  const lessonId = pathname?.split('/lesson/')[1]?.split('?')[0];
  const lesson = LESSON_CATALOG.find(l => l.id === lessonId);
  const modTotal = lesson ? LESSON_CATALOG.filter(l => l.module === lesson.module).length : 0;
  const modDone = lesson ? lesson.order - 1 : 0;
  const modPct = modTotal > 0 ? Math.round((modDone / modTotal) * 100) : 0;

  if (!mounted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-3 text-muted animate-pulse">
          <Zap size={20} className="text-focus" />
          <span className="text-sm font-semibold">Preparando ejercicio…</span>
        </div>
      </div>
    );
  }

  const MODULE_COLORS: Record<number, string> = {
    1: 'bg-amber-400',
    2: 'bg-blue-500',
    3: 'bg-red-500',
    4: 'bg-violet-500',
  };
  const progressColor = lesson ? (MODULE_COLORS[lesson.module] ?? 'bg-focus') : 'bg-focus';

  return (
    <div className={`min-h-screen bg-background text-foreground flex flex-col ${useDyslexicFont ? 'font-dyslexic' : 'font-sans'}`}>

      {/* ── Distraction-minimised header ───────────────────── */}
      <header className="border-b border-border-soft bg-surface/80 backdrop-blur-md shrink-0">
        {/* Module progress bar */}
        {lesson && (
          <div className="h-0.5 w-full bg-border-soft">
            <div
              className={`h-full ${progressColor} transition-all duration-500`}
              style={{ width: `${modPct}%` }}
            />
          </div>
        )}

        <div className="px-4 py-3 flex items-center justify-between max-w-5xl mx-auto">

          {/* Back link — with exit confirm */}
          {showExitConfirm ? (
            <div className="flex items-center gap-2 animate-scale-in">
              <span className="text-xs text-muted font-medium">¿Salir del ejercicio?</span>
              <Link
                href="/"
                className="px-2.5 py-1 bg-focus text-white rounded-lg text-xs font-bold hover:bg-red-700 transition-colors"
              >
                Sí, salir
              </Link>
              <button
                onClick={() => setShowExitConfirm(false)}
                className="px-2.5 py-1 bg-surface-2 text-foreground rounded-lg text-xs font-bold border border-border-soft hover:bg-border-soft transition-colors"
              >
                Cancelar
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowExitConfirm(true)}
              className="flex items-center gap-1.5 text-xs font-bold text-muted hover:text-foreground transition-colors group"
            >
              <ArrowLeft size={15} className="group-hover:-translate-x-0.5 transition-transform" />
              Dashboard
            </button>
          )}

          {/* Lesson title (center) */}
          {lesson && !showExitConfirm && (
            <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2">
              <span className="text-base">{lesson.icon}</span>
              <span className="text-xs font-extrabold text-foreground hidden sm:inline">{lesson.title}</span>
              <span className="text-[10px] text-muted hidden sm:inline">· Lección {lesson.order}/{modTotal}</span>
            </div>
          )}

          {/* OpenDyslexic toggle — iOS pill style */}
          <label className="flex items-center gap-2 cursor-pointer select-none group">
            <span className="text-[10px] font-bold text-muted group-hover:text-foreground transition-colors uppercase tracking-wide hidden sm:inline">
              Dyslexic
            </span>
            <div className={`relative w-8 h-[18px] rounded-full transition-colors duration-200 ${useDyslexicFont ? 'bg-focus' : 'bg-border-soft'}`}>
              <input
                type="checkbox"
                className="sr-only"
                checked={useDyslexicFont}
                onChange={e => setUseDyslexicFont(e.target.checked)}
              />
              <span className={`absolute top-0.5 left-0.5 w-3.5 h-3.5 rounded-full bg-white shadow transition-transform duration-200 ${useDyslexicFont ? 'translate-x-[14px]' : 'translate-x-0'}`} />
            </div>
          </label>
        </div>
      </header>

      {/* ── Exercise viewport ──────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 min-h-0">
        <div className="w-full max-w-4xl animate-fade-in">
          {children}
        </div>
      </div>
    </div>
  );
}
