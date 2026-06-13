"use client";

import { useEffect, useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useProgressStore } from '../store/useProgressStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { LESSON_CATALOG, MODULE_INFO } from '../lib/lessonCatalog';
import { auth } from '../lib/firebase';
import { signOut } from 'firebase/auth';
import { AuthForm } from '../components/auth/AuthForm';
import Link from 'next/link';
import { 
  LogOut, 
  Flame, 
  Zap, 
  Target, 
  Brain, 
  Lock, 
  CheckCircle2, 
  Play, 
  Sparkles, 
  Grid3X3,
  Award,
  ChevronRight
} from 'lucide-react';

export default function Home() {
  const { user, loading: authLoading, initializeAuthListener } = useAuthStore();
  const { progress, loading: progressLoading, loadProgress } = useProgressStore();
  const { useDyslexicFont, setUseDyslexicFont } = useSettingsStore();
  const [mounted, setMounted] = useState(false);
  const [activeModuleTab, setActiveModuleTab] = useState<number>(1);

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

  if (!mounted || authLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground font-sans">
        <div className="animate-pulse flex flex-col items-center">
          <Brain size={48} className="text-focus mb-4 animate-bounce" />
          <h2 className="text-xl font-bold tracking-wide">Cargando tu mente...</h2>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-4 md:p-12 bg-background font-sans">
        <div className="w-full max-w-2xl text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/60 border border-border-soft rounded-full text-xs font-semibold text-gray-600 mb-6 shadow-sm">
            <Sparkles size={14} className="text-focus animate-pulse" />
            Neuro-Entrenamiento Visual
          </div>
          <h1 className="text-5xl font-black tracking-tight text-foreground mb-4 font-sans leading-tight">
            SprintRead
          </h1>
          <p className="text-gray-500 max-w-md mx-auto text-base">
            Domina la lectura rápida con bases científicas. Entrena tu visión periférica, reduce la subvocalización y guarda tu progreso.
          </p>
        </div>
        <AuthForm />
      </main>
    );
  }

  // Helper to check if a module is unlocked
  const isModuleUnlocked = (moduleId: number) => {
    if (moduleId === 1) return true;
    return progress.gatesUnlocked.includes(moduleId) || progress.currentModule >= moduleId;
  };

  // Determine user's rank/title
  const getRank = (avgWpm: number, totalSessions: number) => {
    if (totalSessions === 0) return { title: "Explorador Visual", emoji: "👁️", color: "text-gray-500 bg-gray-100" };
    if (avgWpm < 200) return { title: "Explorador Visual", emoji: "👁️", color: "text-amber-600 bg-amber-50" };
    if (avgWpm < 260) return { title: "Lector Activo", emoji: "📖", color: "text-blue-600 bg-blue-50" };
    if (avgWpm < 320) return { title: "Navegante de Texto", emoji: "🧭", color: "text-indigo-600 bg-indigo-50" };
    if (avgWpm < 380) return { title: "Lector Veloz", emoji: "⚡", color: "text-purple-600 bg-purple-50" };
    if (avgWpm < 450) return { title: "Procesador de Ideas", emoji: "🧠", color: "text-rose-600 bg-rose-50" };
    if (avgWpm < 500) return { title: "Guepardo Cognitivo", emoji: "🐆", color: "text-orange-600 bg-orange-50" };
    return { title: "Maestro SprintRead", emoji: "🏆", color: "text-yellow-600 bg-yellow-50" };
  };

  const rank = getRank(progress.avgWpm, progress.totalSessions);
  const nextLesson = LESSON_CATALOG.find(l => l.id === progress.currentLesson) || LESSON_CATALOG[0];

  return (
    <main className={`min-h-screen bg-background text-foreground pb-20 font-sans ${useDyslexicFont ? "font-dyslexic" : ""}`}>
      {/* Top Navbar */}
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border-soft px-4 md:px-8 py-4 flex justify-between items-center max-w-6xl mx-auto">
        <Link href="/" className="text-2xl font-black tracking-tight hover:opacity-80 transition-opacity">
          SprintRead
        </Link>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 cursor-pointer bg-white px-3 py-1.5 rounded-full border border-border-soft shadow-xs">
            <input 
              type="checkbox" 
              id="dyslexic-toggle"
              checked={useDyslexicFont}
              onChange={(e) => setUseDyslexicFont(e.target.checked)}
              className="w-4 h-4 accent-focus rounded cursor-pointer"
            />
            <label htmlFor="dyslexic-toggle" className="text-xs font-semibold text-gray-600 cursor-pointer select-none">
              OpenDyslexic
            </label>
          </div>

          <button 
            onClick={() => signOut(auth)}
            className="p-2 text-gray-400 hover:text-focus transition-colors bg-white rounded-full border border-border-soft shadow-xs"
            title="Cerrar sesión"
          >
            <LogOut size={18} />
          </button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 md:px-8 mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Content (Left columns) */}
        <div className="lg:col-span-2 flex flex-col gap-8">
          
          {/* Welcome Card */}
          <div className="bg-white p-6 md:p-8 rounded-3xl border border-border-soft shadow-sm relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="z-10">
              <span className="text-xs font-bold text-focus uppercase tracking-widest bg-red-50 px-2.5 py-1 rounded-full">
                Dashboard
              </span>
              <h2 className="text-3xl font-extrabold tracking-tight mt-3 text-foreground">
                ¡Hola, {user.displayName || user.email?.split('@')[0]}!
              </h2>
              <p className="text-gray-500 mt-2 max-w-md text-sm">
                Tu entrenamiento cerebral está listo. Haz progresado con constancia hacia una lectura de alta retención.
              </p>
              
              <div className="flex flex-wrap gap-2 mt-4">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${rank.color}`}>
                  <span>{rank.emoji}</span>
                  <span>{rank.title}</span>
                </span>
                {progress.wpmBaseline > 0 && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-semibold">
                    Baseline: {progress.wpmBaseline} WPM
                  </span>
                )}
              </div>
            </div>

            {/* Next Lesson Box */}
            <div className="bg-background border border-border-soft p-5 rounded-2xl w-full md:w-72 flex flex-col justify-between shadow-inner">
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  Próxima Lección
                </span>
                <h3 className="text-lg font-bold text-foreground mt-1 truncate">
                  {nextLesson.icon} {nextLesson.title}
                </h3>
                <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                  {nextLesson.description}
                </p>
              </div>

              <Link 
                href={`/lesson/${nextLesson.id}`}
                className="mt-4 w-full py-2.5 bg-foreground hover:bg-black text-surface text-center rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm active:scale-98"
              >
                <Play size={12} fill="currentColor" /> COMENZAR ENTRENAMIENTO
              </Link>
            </div>
          </div>

          {/* Module Selector & Lesson List */}
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold tracking-tight">Ruta de Aprendizaje</h3>
              <div className="text-xs text-gray-500 font-semibold uppercase tracking-wider">
                Haz completado {progress.totalSessions} sesiones
              </div>
            </div>

            {/* Module Tabs */}
            <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-none">
              {MODULE_INFO.map((mod) => {
                const unlocked = isModuleUnlocked(mod.id);
                const isActive = activeModuleTab === mod.id;
                return (
                  <button
                    key={mod.id}
                    onClick={() => setActiveModuleTab(mod.id)}
                    className={`flex-none px-4 py-3 rounded-2xl text-left border transition-all relative ${
                      isActive 
                        ? 'bg-foreground text-surface border-foreground shadow-md' 
                        : 'bg-white text-foreground hover:bg-gray-50 border-border-soft'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase opacity-60">Mód {mod.id}</span>
                      {!unlocked && <Lock size={12} className={isActive ? "text-white" : "text-gray-400"} />}
                    </div>
                    <div className="text-sm font-extrabold tracking-tight mt-0.5 whitespace-nowrap">{mod.title}</div>
                    <div className={`text-[10px] mt-1 font-medium ${isActive ? 'text-gray-300' : 'text-gray-400'}`}>{mod.wpmRange}</div>
                  </button>
                );
              })}
            </div>

            {/* Selected Module Info Box */}
            {(() => {
              const activeMod = MODULE_INFO.find(m => m.id === activeModuleTab)!;
              const unlocked = isModuleUnlocked(activeMod.id);
              
              return (
                <div className="bg-white p-6 rounded-3xl border border-border-soft shadow-sm flex flex-col gap-6">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 pb-4 border-b border-border-soft">
                    <div>
                      <h4 className="text-lg font-extrabold tracking-tight text-foreground">
                        Módulo {activeMod.id}: {activeMod.title}
                      </h4>
                      <p className="text-xs text-gray-500 mt-1">{activeMod.subtitle} • {activeMod.weeks}</p>
                    </div>

                    {!unlocked && (
                      <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-xl flex items-start gap-2 max-w-md">
                        <Lock size={16} className="mt-0.5 flex-none text-amber-600" />
                        <div className="text-[11px] font-medium leading-relaxed">
                          <span className="font-bold">Módulo Bloqueado.</span> Para desbloquear, alcanza un promedio de <span className="font-bold">{activeMod.gateWpm} WPM</span> y <span className="font-bold">{activeMod.gateComp}% comprensión</span> en al menos 3 sesiones consecutivas.
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Lessons Grid/List */}
                  <div className="flex flex-col gap-3">
                    {LESSON_CATALOG.filter(l => l.module === activeModuleTab).map((lesson) => {
                      const sessions = progress.recentSessions.filter(s => s.lessonId === lesson.id);
                      const isCompleted = sessions.length > 0;
                      const bestSession = isCompleted ? sessions.sort((a, b) => b.wpm - a.wpm)[0] : null;
                      const isUpNext = progress.currentLesson === lesson.id;
                      const moduleUnlocked = unlocked;

                      return (
                        <div 
                          key={lesson.id}
                          className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                            isUpNext && moduleUnlocked
                              ? 'border-focus/40 bg-focus/5 shadow-xs ring-1 ring-focus/10'
                              : isCompleted 
                                ? 'border-border-soft bg-white/70 opacity-90'
                                : 'border-border-soft bg-white'
                          } ${!moduleUnlocked ? 'opacity-60 pointer-events-none' : ''}`}
                        >
                          <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-xl bg-background flex items-center justify-center text-lg flex-none border border-border-soft">
                              {lesson.icon}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h5 className="font-bold text-sm text-foreground">{lesson.title}</h5>
                                {isCompleted && (
                                  <span className="inline-flex items-center gap-0.5 text-emerald-600 text-[10px] font-bold bg-emerald-50 px-1.5 py-0.5 rounded-md">
                                    <CheckCircle2 size={10} /> Completado
                                  </span>
                                )}
                                {isUpNext && moduleUnlocked && (
                                  <span className="inline-flex items-center text-focus text-[10px] font-bold bg-red-50 px-1.5 py-0.5 rounded-md animate-pulse">
                                    Siguiente
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-gray-500 mt-0.5">{lesson.description}</p>
                              <div className="flex gap-3 mt-2 text-[10px] text-gray-400 font-semibold uppercase tracking-wider">
                                <span>⏱️ {lesson.duration} min</span>
                                <span>🧠 {lesson.technique}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-3 sm:pt-0 border-border-soft">
                            {isCompleted && bestSession && (
                              <div className="text-right sm:block flex justify-between w-full sm:w-auto items-center">
                                <span className="text-[10px] text-gray-400 block sm:inline mr-2 uppercase font-semibold">Mejor:</span>
                                <span className="text-xs font-extrabold text-foreground">{bestSession.wpm} WPM • {bestSession.comprehension}% Comp</span>
                              </div>
                            )}

                            {moduleUnlocked ? (
                              <Link 
                                href={`/lesson/${lesson.id}`}
                                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1 transition-all ${
                                  isUpNext
                                    ? 'bg-focus hover:bg-red-700 text-white shadow-md active:scale-95'
                                    : 'bg-background hover:bg-border-soft text-foreground border border-border-soft active:scale-95'
                                }`}
                              >
                                {isCompleted ? 'Re-hacer' : 'Iniciar'}
                                <ChevronRight size={14} />
                              </Link>
                            ) : (
                              <div className="p-2 text-gray-400 bg-gray-50 rounded-xl border border-border-soft">
                                <Lock size={14} />
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>

        {/* Sidebar (Right Column) */}
        <div className="flex flex-col gap-8">
          
          {/* Quick Stats Grid */}
          <div className="bg-white p-6 rounded-3xl border border-border-soft shadow-sm flex flex-col gap-6">
            <h3 className="text-lg font-extrabold tracking-tight">Tu Rendimiento</h3>
            
            <div className="grid grid-cols-2 gap-4">
              
              {/* Streak */}
              <div className="bg-background border border-border-soft p-4 rounded-2xl flex flex-col justify-between shadow-xs">
                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Racha</span>
                  <Flame className="text-orange-500 fill-orange-500" size={18} />
                </div>
                <div className="mt-4">
                  <span className="text-2xl font-black">{progress.streak}</span>
                  <span className="text-xs text-gray-500 font-medium block">días activos</span>
                </div>
              </div>

              {/* Avg WPM */}
              <div className="bg-background border border-border-soft p-4 rounded-2xl flex flex-col justify-between shadow-xs">
                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">WPM Promedio</span>
                  <Zap className="text-yellow-500 fill-yellow-500" size={18} />
                </div>
                <div className="mt-4">
                  <span className="text-2xl font-black">{progress.avgWpm || '--'}</span>
                  <span className="text-xs text-gray-500 font-medium block">últimas 5 sesiones</span>
                </div>
              </div>

              {/* Comprehension */}
              <div className="bg-background border border-border-soft p-4 rounded-2xl flex flex-col justify-between shadow-xs">
                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Comprensión</span>
                  <Target className="text-focus" size={18} />
                </div>
                <div className="mt-4">
                  <span className="text-2xl font-black">{progress.avgComprehension ? `${progress.avgComprehension}%` : '--'}</span>
                  <span className="text-xs text-gray-500 font-medium block">promedio</span>
                </div>
              </div>

              {/* Total Sessions */}
              <div className="bg-background border border-border-soft p-4 rounded-2xl flex flex-col justify-between shadow-xs">
                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Sesiones</span>
                  <Brain className="text-indigo-500" size={18} />
                </div>
                <div className="mt-4">
                  <span className="text-2xl font-black">{progress.totalSessions}</span>
                  <span className="text-xs text-gray-500 font-medium block">completadas</span>
                </div>
              </div>

            </div>

            {/* Progress to next gate */}
            {(() => {
              const activeMod = MODULE_INFO.find(m => m.id === activeModuleTab)!;
              if (activeMod.id === 1) return null; // No gate for module 1
              
              const currentWpm = progress.avgWpm;
              const currentComp = progress.avgComprehension;
              const targetWpm = activeMod.gateWpm;
              const targetComp = activeMod.gateComp;
              
              const wpmPercentage = Math.min(100, Math.round((currentWpm / targetWpm) * 100));
              const compPercentage = Math.min(100, Math.round((currentComp / targetComp) * 100));
              
              return (
                <div className="pt-4 border-t border-border-soft flex flex-col gap-3">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Requisitos para Módulo {activeMod.id}</div>
                  
                  {/* WPM progress */}
                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span>WPM ({currentWpm} / {targetWpm})</span>
                      <span className={currentWpm >= targetWpm ? "text-emerald-600 font-bold" : "text-gray-500"}>{wpmPercentage}%</span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full transition-all duration-500 ${currentWpm >= targetWpm ? "bg-emerald-500" : "bg-warning"}`} style={{ width: `${wpmPercentage}%` }} />
                    </div>
                  </div>

                  {/* Comp progress */}
                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span>Comprensión ({currentComp}% / {targetComp}%)</span>
                      <span className={currentComp >= targetComp ? "text-emerald-600 font-bold" : "text-gray-500"}>{compPercentage}%</span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full transition-all duration-500 ${currentComp >= targetComp ? "bg-emerald-500" : "bg-focus"}`} style={{ width: `${compPercentage}%` }} />
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Daily Warmup Schulte Card */}
          <div className="bg-white p-6 rounded-3xl border border-border-soft shadow-sm flex flex-col gap-4 relative overflow-hidden">
            <div className="absolute right-0 top-0 translate-x-2 -translate-y-2 opacity-5 text-black">
              <Grid3X3 size={120} />
            </div>
            
            <div>
              <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest bg-indigo-50 px-2.5 py-1 rounded-full">
                Calibración Diaria
              </span>
              <h4 className="text-lg font-bold tracking-tight mt-3 text-foreground">
                Calentamiento Periférico
              </h4>
              <p className="text-xs text-gray-500 mt-1">
                Calibra tu vista antes del entrenamiento principal con una Tabla de Schulte rápida. Mejora la amplitud de tu span visual.
              </p>
            </div>
            
            <Link 
              href="/lesson/M1L5" 
              className="w-full py-3 bg-indigo-500 hover:bg-indigo-600 text-surface text-center rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm"
            >
              <Grid3X3 size={14} /> PRACTICAR SCHULTE
            </Link>
          </div>

          {/* Dyslexia Info Widget */}
          <div className="bg-white p-6 rounded-3xl border border-border-soft shadow-sm flex flex-col gap-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">Consejo de Neuro-Lectura</h4>
            <div className="flex gap-3">
              <Award className="text-focus flex-none" size={20} />
              <p className="text-xs text-gray-600 leading-relaxed">
                <span className="font-bold">Usa la fuente OpenDyslexic</span> en la parte superior si sientes fatiga visual o si tienes TDAH o dislexia. Esta fuente añade peso a la base de las letras, previniendo que tu cerebro las rote o confunda.
              </p>
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}
