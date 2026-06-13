"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Brain, Settings } from 'lucide-react';
import { useSettingsStore } from '../../store/useSettingsStore';

export default function LessonLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { useDyslexicFont, setUseDyslexicFont } = useSettingsStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <Brain className="animate-spin text-focus" size={32} />
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-background text-foreground flex flex-col font-sans ${useDyslexicFont ? 'font-dyslexic' : ''}`}>
      {/* Distraction-Free Header */}
      <header className="border-b border-border-soft px-4 py-3 flex items-center justify-between bg-white/40 backdrop-blur-xs">
        <Link 
          href="/" 
          className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-500 hover:text-foreground transition-colors"
          onClick={(e) => {
            if (window.confirm("¿Seguro que deseas salir del ejercicio? Tu progreso actual no se guardará.")) {
              // Proceed with link
            } else {
              e.preventDefault();
            }
          }}
        >
          <ArrowLeft size={16} /> Dashboard
        </Link>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 cursor-pointer bg-white/80 px-3 py-1 rounded-full border border-border-soft shadow-xs">
            <input 
              type="checkbox" 
              id="layout-dyslexic-toggle"
              checked={useDyslexicFont}
              onChange={(e) => setUseDyslexicFont(e.target.checked)}
              className="w-3.5 h-3.5 accent-focus rounded cursor-pointer"
            />
            <label htmlFor="layout-dyslexic-toggle" className="text-[10px] font-bold text-gray-500 cursor-pointer select-none">
              OpenDyslexic
            </label>
          </div>
        </div>
      </header>

      {/* Main Exercise Viewport */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-8">
        <div className="w-full max-w-4xl">
          {children}
        </div>
      </div>
    </div>
  );
}
