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
  ChevronRight,
  BookOpen,
  TrendingUp,
  Dumbbell,
} from 'lucide-react';

/* ─── Module color config ───────────────────────────────────────── */
const MOD_COLORS = {
  1: { bg: 'bg-amber-50',  text: 'text-amber-700',  border: 'border-amber-200',  dot: 'bg-amber-400',  ring: 'ring-amber-400/20',  tab: 'bg-amber-500'  },
  2: { bg: 'bg-blue-50',   text: 'text-blue-700',   border: 'border-blue-200',   dot: 'bg-blue-500',   ring: 'ring-blue-500/20',   tab: 'bg-blue-500'   },
  3: { bg: 'bg-red-50',    text: 'text-red-700',    border: 'border-red-200',    dot: 'bg-red-500',    ring: 'ring-red-500/20',    tab: 'bg-red-500'    },
  4: { bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200', dot: 'bg-violet-500', ring: 'ring-violet-500/20', tab: 'bg-violet-500' },
} as const;

const MOD_STRIPE = ['', 'mod-stripe-1', 'mod-stripe-2', 'mod-stripe-3', 'mod-stripe-4'] as const;

/* ─── Rank config ───────────────────────────────────────────────── */
const getRank = (avgWpm: number, total: number) => {
  if (total === 0)   return { title: 'Explorador Visual',   emoji: '👁️',  color: 'text-gray-600 bg-gray-100 border-gray-200' };
  if (avgWpm < 200)  return { title: 'Explorador Visual',   emoji: '👁️',  color: 'text-amber-700 bg-amber-50 border-amber-200' };
  if (avgWpm < 260)  return { title: 'Lector Activo',       emoji: '📖',  color: 'text-blue-700 bg-blue-50 border-blue-200' };
  if (avgWpm < 320)  return { title: 'Navegante de Texto',  emoji: '🧭',  color: 'text-indigo-700 bg-indigo-50 border-indigo-200' };
  if (avgWpm < 380)  return { title: 'Lector Veloz',        emoji: '⚡',  color: 'text-purple-700 bg-purple-50 border-purple-200' };
  if (avgWpm < 450)  return { title: 'Procesador de Ideas', emoji: '🧠',  color: 'text-rose-700 bg-rose-50 border-rose-200' };
  if (avgWpm < 500)  return { title: 'Guepardo Cognitivo',  emoji: '🐆',  color: 'text-orange-700 bg-orange-50 border-orange-200' };
  return                    { title: 'Maestro SprintRead',  emoji: '🏆',  color: 'text-yellow-700 bg-yellow-50 border-yellow-200' };
};

/* ─── Loading skeleton ──────────────────────────────────────────── */
function LoadingScreen() {
  return (
    <div className="min-h-screen hero-bg flex flex-col items-center justify-center gap-4">
      <div className="relative">
        <div className="w-16 h-16 rounded-2xl bg-focus/10 flex items-center justify-center animate-pulse-ring">
          <Brain size={32} className="text-focus animate-float" />
        </div>
      </div>
      <p className="text-sm font-semibold text-muted tracking-widest uppercase animate-fade-in">
        Cargando tu espacio mental…
      </p>
    </div>
  );
}

/* ─── Login Page ────────────────────────────────────────────────── */
function LoginPage() {
  return (
    <main className="min-h-screen hero-bg flex flex-col items-center justify-center p-4 md:p-12 relative overflow-hidden">
      {/* Decorative circles */}
      <div className="absolute top-[-10%] right-[-5%] w-96 h-96 rounded-full bg-focus/5 blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-15%] left-[-8%] w-80 h-80 rounded-full bg-amber-400/6 blur-3xl pointer-events-none" />

      <div className="w-full max-w-md text-center mb-10 animate-fade-in-up">
        {/* Logo mark */}
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-focus text-white shadow-lg shadow-focus/30 mb-6 animate-float">
          <Zap size={28} fill="currentColor" />
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1 glass rounded-full text-xs font-semibold text-muted mb-4 border border-border-soft">
          <Sparkles size={12} className="text-focus" />
          Neuro-Entrenamiento Visual · Basado en ciencia
        </div>

        <h1 className="text-5xl md:text-6xl font-black tracking-tight text-foreground mb-3 leading-tight">
          Sprint<span className="gradient-text-speed">Read</span>
        </h1>
        <p className="text-muted text-base max-w-sm mx-auto leading-relaxed">
          Duplica tu velocidad de lectura con técnicas respaldadas por neurociencia. Entrena tu visión periférica y consolida la comprensión.
        </p>

        {/* Feature pills */}
        <div className="flex flex-wrap justify-center gap-2 mt-5 mb-8">
          {['RSVP · ORP', 'Schulte', 'Anti-Regresión', 'SM-2'].map(f => (
            <span key={f} className="px-2.5 py-1 glass rounded-full text-[11px] font-semibold text-foreground/70 border border-border-soft">
              {f}
            </span>
          ))}
        </div>
      </div>

      <div className="w-full max-w-md animate-fade-in-up delay-200">
        <AuthForm />
      </div>
    </main>
  );
}

/* ─── Stat Card ─────────────────────────────────────────────────── */
function StatCard({ label, value, sub, icon: Icon, iconColor }: {
  label: string; value: string | number; sub: string;
  icon: React.ElementType; iconColor: string;
}) {
  return (
    <div className="bg-background border border-border-soft p-4 rounded-2xl flex flex-col justify-between shadow-xs card-hover">
      <div className="flex justify-between items-start">
        <span className="text-[10px] font-bold text-muted uppercase tracking-widest leading-tight">{label}</span>
        <Icon size={18} className={iconColor} />
      </div>
      <div className="mt-3">
        <span className="text-2xl font-black text-foreground">{value}</span>
        <span className="text-xs text-muted font-medium block mt-0.5">{sub}</span>
      </div>
    </div>
  );
}

/* ─── Main Dashboard ────────────────────────────────────────────── */
export default function Home() {
  const { user, loading: authLoading, initializeAuthListener } = useAuthStore();
  const { progress, loading: progressLoading, loadProgress } = useProgressStore();
  const { useDyslexicFont, setUseDyslexicFont } = useSettingsStore();
  const [mounted, setMounted] = useState(false);
  const [activeModuleTab, setActiveModuleTab] = useState<number>(1);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    const unsubscribe = initializeAuthListener();
    return () => unsubscribe();
  }, [initializeAuthListener]);

  useEffect(() => {
    if (user) loadProgress(user.uid);
  }, [user, loadProgress]);

  if (!mounted || authLoading) return <LoadingScreen />;
  if (!user) return <LoginPage />;

  const isModuleUnlocked = (moduleId: number) => {
    if (moduleId === 1) return true;
    return progress.gatesUnlocked.includes(moduleId) || progress.currentModule >= moduleId;
  };

  const rank = getRank(progress.avgWpm, progress.totalSessions);
  const nextLesson = LESSON_CATALOG.find(l => l.id === progress.currentLesson) || LESSON_CATALOG[0];
  const activeMod = MODULE_INFO.find(m => m.id === activeModuleTab)!;
  const activeModUnlocked = isModuleUnlocked(activeMod.id);
  const mc = MOD_COLORS[activeModuleTab as keyof typeof MOD_COLORS];

  // Completion ratio for current module
  const moduleLessons = LESSON_CATALOG.filter(l => l.module === activeModuleTab);
  const completedInModule = moduleLessons.filter(l =>
    progress.recentSessions.some(s => s.lessonId === l.id)
  ).length;
  const moduleProgress = Math.round((completedInModule / moduleLessons.length) * 100);

  return (
    <main className={`min-h-screen bg-background text-foreground pb-safe font-sans ${useDyslexicFont ? 'font-dyslexic' : ''}`}>

      {/* ── Navbar ──────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 border-b border-border-soft bg-surface/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-3.5 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-focus flex items-center justify-center shadow-sm group-hover:shadow-focus/30 transition-shadow">
              <Zap size={16} fill="white" className="text-white" />
            </div>
            <span className="text-xl font-black tracking-tight">SprintRead</span>
          </Link>

          <div className="flex items-center gap-3">
            {/* Dyslexic toggle – pill style */}
            <label className="hidden sm:flex items-center gap-2 cursor-pointer select-none group">
              <div className={`relative w-9 h-5 rounded-full transition-colors duration-200 ${useDyslexicFont ? 'bg-focus' : 'bg-border'}`}>
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={useDyslexicFont}
                  onChange={e => setUseDyslexicFont(e.target.checked)}
                />
                <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${useDyslexicFont ? 'translate-x-4' : 'translate-x-0'}`} />
              </div>
              <span className="text-xs font-semibold text-muted group-hover:text-foreground transition-colors">OpenDyslexic</span>
            </label>

            {/* Avatar + logout */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-focus to-orange-400 flex items-center justify-center text-white text-xs font-black shadow-sm">
                {(user.displayName || user.email || 'U')[0].toUpperCase()}
              </div>
              <button
                onClick={() => signOut(auth)}
                className="p-2 text-muted hover:text-focus hover:bg-focus-light rounded-lg transition-colors"
                title="Cerrar sesión"
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 md:px-8 mt-6 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">

        {/* ── LEFT COLUMN ─────────────────────────────────────── */}
        <div className="flex flex-col gap-5">

          {/* Hero welcome card */}
          <div className="relative overflow-hidden rounded-3xl bg-surface border border-border-soft shadow-sm p-6 md:p-8 animate-fade-in-up">
            {/* Decorative gradient blob */}
            <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-focus/6 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-10 -left-10 w-48 h-48 rounded-full bg-amber-400/5 blur-2xl pointer-events-none" />

            <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${rank.color}`}>
                    <span>{rank.emoji}</span>
                    <span>{rank.title}</span>
                  </span>
                  {progress.wpmBaseline > 0 && (
                    <span className="px-2.5 py-1 bg-surface-2 text-muted rounded-full text-xs font-semibold border border-border-soft">
                      Baseline: {progress.wpmBaseline} WPM
                    </span>
                  )}
                </div>
                <h2 className="text-2xl md:text-3xl font-black tracking-tight text-foreground">
                  ¡Hola, {user.displayName?.split(' ')[0] || user.email?.split('@')[0]}! 👋
                </h2>
                <p className="text-muted mt-1.5 text-sm max-w-md">
                  Tu cerebro está listo para entrenar. Constancia diaria es lo que separa a los lectores promedio de los expertos.
                </p>
              </div>

              {/* Next lesson CTA */}
              <div className="w-full md:w-64 bg-background border border-border-soft rounded-2xl p-4 flex flex-col gap-3 shrink-0">
                <div>
                  <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-1">Próxima Lección</p>
                  <h3 className="text-base font-extrabold text-foreground leading-snug">
                    {nextLesson.icon} {nextLesson.title}
                  </h3>
                  <p className="text-xs text-muted mt-0.5 line-clamp-1">{nextLesson.description}</p>
                </div>
                <Link
                  href={`/lesson/${nextLesson.id}`}
                  className="w-full py-2.5 bg-focus hover:bg-red-700 text-white text-center rounded-xl font-bold text-xs transition-all active:scale-95 flex items-center justify-center gap-1.5 shadow-sm shadow-focus/20 animate-pulse-ring"
                >
                  <Play size={12} fill="currentColor" /> COMENZAR
                </Link>
              </div>
            </div>
          </div>

          {/* ── Module tabs + lessons ─────────────────────────── */}
          <div className="animate-fade-in-up delay-100">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-extrabold tracking-tight">Ruta de Aprendizaje</h3>
              <span className="text-[11px] text-muted font-semibold uppercase tracking-wider">
                {progress.totalSessions} sesiones completadas
              </span>
            </div>

            {/* Module tab row */}
            <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1 mb-4">
              {MODULE_INFO.map(mod => {
                const unlocked = isModuleUnlocked(mod.id);
                const isActive = activeModuleTab === mod.id;
                const c = MOD_COLORS[mod.id as keyof typeof MOD_COLORS];
                const lessons = LESSON_CATALOG.filter(l => l.module === mod.id);
                const done = lessons.filter(l => progress.recentSessions.some(s => s.lessonId === l.id)).length;
                const pct = Math.round((done / lessons.length) * 100);

                return (
                  <button
                    key={mod.id}
                    onClick={() => setActiveModuleTab(mod.id)}
                    className={`flex-none px-4 py-3 rounded-2xl text-left border transition-all card-hover relative overflow-hidden ${
                      isActive
                        ? 'bg-foreground text-surface border-foreground shadow-md'
                        : `bg-surface border-border-soft hover:border-current hover:${c.text}`
                    }`}
                  >
                    {/* Mini progress bar at bottom */}
                    {pct > 0 && (
                      <div className={`absolute bottom-0 left-0 h-0.5 ${isActive ? 'bg-white/40' : c.dot} transition-all`} style={{ width: `${pct}%` }} />
                    )}
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className={`text-[10px] font-bold uppercase ${isActive ? 'text-white/60' : 'text-muted'}`}>Mód {mod.id}</span>
                      {!unlocked && <Lock size={10} className={isActive ? 'text-white/50' : 'text-muted'} />}
                    </div>
                    <div className="text-sm font-extrabold tracking-tight whitespace-nowrap">{mod.title}</div>
                    <div className={`text-[10px] mt-0.5 font-medium ${isActive ? 'text-white/50' : 'text-muted'}`}>
                      {done}/{lessons.length} lecciones
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Module card */}
            <div className={`bg-surface rounded-3xl border shadow-sm overflow-hidden ${mc.border}`}>
              {/* Module header bar */}
              <div className={`px-6 py-4 border-b ${mc.bg} ${mc.border} flex flex-col sm:flex-row sm:items-center justify-between gap-3`}>
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <div className={`w-2 h-2 rounded-full ${mc.dot}`} />
                    <span className={`text-[10px] font-bold uppercase tracking-widest ${mc.text}`}>
                      Módulo {activeMod.id}
                    </span>
                  </div>
                  <h4 className="text-base font-extrabold tracking-tight text-foreground">
                    {activeMod.title}
                    <span className="ml-2 text-xs font-normal text-muted">· {activeMod.subtitle}</span>
                  </h4>
                </div>

                {/* Module progress ring */}
                <div className="flex items-center gap-3">
                  <div className="relative w-10 h-10">
                    <svg className="w-10 h-10 -rotate-90" viewBox="0 0 36 36">
                      <circle cx="18" cy="18" r="15" fill="none" stroke="currentColor" strokeWidth="3" className="text-border-soft" />
                      <circle
                        cx="18" cy="18" r="15" fill="none" strokeWidth="3"
                        strokeDasharray={`${moduleProgress * 0.94} 94`}
                        strokeLinecap="round"
                        className={mc.text}
                        style={{ stroke: 'currentColor' }}
                      />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-[9px] font-black text-foreground">{moduleProgress}%</span>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-foreground">{completedInModule}/{moduleLessons.length}</p>
                    <p className="text-[10px] text-muted">completadas</p>
                  </div>
                </div>
              </div>

              {/* Lock notice */}
              {!activeModUnlocked && (
                <div className="mx-4 mt-4 px-4 py-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-2.5">
                  <Lock size={15} className="mt-0.5 shrink-0 text-amber-600" />
                  <p className="text-[11px] text-amber-800 font-medium leading-relaxed">
                    <span className="font-bold">Módulo bloqueado.</span> Alcanza{' '}
                    <span className="font-bold">{activeMod.gateWpm} WPM</span> y{' '}
                    <span className="font-bold">{activeMod.gateComp}% comprensión</span> para desbloquearlo.
                  </p>
                </div>
              )}

              {/* Lessons list */}
              <div className="p-4 flex flex-col gap-2.5">
                {moduleLessons.map((lesson, idx) => {
                  const sessions = progress.recentSessions.filter(s => s.lessonId === lesson.id);
                  const isCompleted = sessions.length > 0;
                  const bestSession = isCompleted ? [...sessions].sort((a, b) => b.wpm - a.wpm)[0] : null;
                  const isUpNext = progress.currentLesson === lesson.id;

                  return (
                    <div
                      key={lesson.id}
                      className={`relative rounded-2xl border transition-all ${MOD_STRIPE[activeModuleTab]} ${
                        isUpNext && activeModUnlocked
                          ? 'border-focus/30 bg-focus/[0.03] ring-1 ring-focus/10'
                          : isCompleted
                          ? 'border-border-soft bg-surface/60'
                          : 'border-border-soft bg-surface'
                      } ${!activeModUnlocked ? 'opacity-50 pointer-events-none' : 'card-hover'}`}
                      style={{ animationDelay: `${idx * 40}ms` }}
                    >
                      <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        {/* Lesson info */}
                        <div className="flex items-start gap-3.5">
                          {/* Icon + completed check */}
                          <div className={`relative w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0 border ${
                            isCompleted ? 'bg-emerald-50 border-emerald-200' : 'bg-background border-border-soft'
                          }`}>
                            {lesson.icon}
                            {isCompleted && (
                              <div className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center">
                                <CheckCircle2 size={10} className="text-white" strokeWidth={3} />
                              </div>
                            )}
                          </div>

                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
                              <h5 className="font-bold text-sm text-foreground">{lesson.title}</h5>
                              {isUpNext && activeModUnlocked && (
                                <span className="inline-flex items-center text-focus text-[9px] font-extrabold bg-focus/10 px-1.5 py-0.5 rounded-md uppercase tracking-wide animate-pulse">
                                  ● Siguiente
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-muted leading-snug line-clamp-1">{lesson.description}</p>
                            <div className="flex gap-3 mt-1.5 text-[10px] text-muted font-semibold">
                              <span>⏱ {lesson.duration} min</span>
                              <span>·</span>
                              <span className={`${mc.text} font-semibold`}>{lesson.technique}</span>
                            </div>
                          </div>
                        </div>

                        {/* Right: best score + actions */}
                        <div className="flex items-center justify-between sm:justify-end gap-3 sm:shrink-0">
                          {isCompleted && bestSession && (
                            <div className="text-right">
                              <p className="text-[10px] text-muted uppercase font-semibold">Mejor resultado</p>
                              <p className="text-xs font-extrabold text-foreground">
                                {bestSession.wpm} <span className="text-muted font-medium">WPM</span>
                                {'  ·  '}
                                <span className="text-emerald-600">{bestSession.comprehension}%</span>
                              </p>
                            </div>
                          )}

                          {activeModUnlocked && (
                            <div className="flex items-center gap-1.5">
                              {/* Practice btn */}
                              <Link
                                href={`/lesson/${lesson.id}?practice=true`}
                                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold border border-border-soft bg-background hover:bg-amber-50 hover:border-amber-200 hover:text-amber-700 text-muted transition-all active:scale-95"
                                title="Práctica libre (sin guardar)"
                              >
                                <Dumbbell size={11} />
                                <span className="hidden sm:inline">Practicar</span>
                              </Link>
                              {/* Official btn */}
                              <Link
                                href={`/lesson/${lesson.id}`}
                                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all active:scale-95 ${
                                  isUpNext
                                    ? 'bg-focus text-white shadow-sm shadow-focus/20 hover:bg-red-700'
                                    : 'bg-background border border-border-soft text-foreground hover:bg-surface-2'
                                }`}
                              >
                                {isCompleted ? 'Re-hacer' : 'Iniciar'}
                                <ChevronRight size={13} />
                              </Link>
                            </div>
                          )}

                          {!activeModUnlocked && (
                            <div className="p-2 text-muted bg-surface-2 rounded-xl border border-border-soft">
                              <Lock size={13} />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

        </div>

        {/* ── RIGHT SIDEBAR ────────────────────────────────────── */}
        <div className="flex flex-col gap-5">

          {/* Stats grid */}
          <div className="bg-surface rounded-3xl border border-border-soft shadow-sm p-5 flex flex-col gap-4 animate-fade-in-up delay-150">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold tracking-tight">Tu Rendimiento</h3>
              <TrendingUp size={16} className="text-muted" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <StatCard label="Racha"        value={progress.streak}                                    sub="días activos"      icon={Flame}  iconColor="text-orange-500 fill-orange-400" />
              <StatCard label="WPM Promedio" value={progress.avgWpm || '—'}                            sub="últimas 5 sesiones" icon={Zap}    iconColor="text-yellow-500 fill-yellow-400" />
              <StatCard label="Comprensión"  value={progress.avgComprehension ? `${progress.avgComprehension}%` : '—'} sub="promedio" icon={Target} iconColor="text-focus" />
              <StatCard label="Sesiones"     value={progress.totalSessions}                             sub="completadas"       icon={Brain}  iconColor="text-indigo-500" />
            </div>

            {/* Gate progress for active module (if not module 1) */}
            {activeMod.id > 1 && (
              <div className="pt-3 border-t border-border-soft flex flex-col gap-2.5">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted">
                  Progreso hacia Módulo {activeMod.id}
                </p>
                {[
                  { label: 'WPM', current: progress.avgWpm,         target: activeMod.gateWpm,  color: mc.dot },
                  { label: 'Comprensión', current: progress.avgComprehension, target: activeMod.gateComp, color: 'bg-emerald-500' },
                ].map(({ label, current, target, color }) => {
                  const pct = Math.min(100, Math.round((current / target) * 100));
                  const done = current >= target;
                  return (
                    <div key={label}>
                      <div className="flex justify-between text-xs font-semibold mb-1">
                        <span className="text-muted">{label}</span>
                        <span className={done ? 'text-emerald-600 font-bold' : 'text-muted'}>
                          {current}{label === 'Comprensión' ? '%' : ''} / {target}{label === 'Comprensión' ? '%' : ''}
                          {done && ' ✓'}
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-surface-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-700 progress-bar-fill ${done ? 'bg-emerald-500' : color}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Recent sessions */}
          {progress.recentSessions.length > 0 && (
            <div className="bg-surface rounded-3xl border border-border-soft shadow-sm p-5 flex flex-col gap-3 animate-fade-in-up delay-200">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-extrabold tracking-tight">Sesiones Recientes</h3>
                <BookOpen size={15} className="text-muted" />
              </div>
              <div className="flex flex-col gap-2">
                {progress.recentSessions.slice(0, 4).map((s, i) => {
                  const lesson = LESSON_CATALOG.find(l => l.id === s.lessonId);
                  const modColor = MOD_COLORS[(lesson?.module ?? 1) as keyof typeof MOD_COLORS];
                  return (
                    <div key={i} className={`flex items-center justify-between p-3 rounded-xl bg-background border border-border-soft ${MOD_STRIPE[lesson?.module ?? 1]}`}>
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-base shrink-0">{lesson?.icon ?? '📖'}</span>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-foreground truncate">{lesson?.title ?? s.lessonId}</p>
                          <p className={`text-[10px] font-semibold ${modColor.text}`}>Módulo {lesson?.module}</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0 ml-2">
                        <p className="text-xs font-extrabold text-foreground">{s.wpm} WPM</p>
                        <p className="text-[10px] text-emerald-600 font-semibold">{s.comprehension}%</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Daily warmup */}
          <div className="relative overflow-hidden bg-surface rounded-3xl border border-border-soft shadow-sm p-5 flex flex-col gap-3 animate-fade-in-up delay-300">
            <div className="absolute -right-4 -top-4 opacity-[0.04] text-foreground pointer-events-none">
              <Grid3X3 size={100} />
            </div>
            <div>
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-indigo-600 uppercase tracking-widest bg-indigo-50 px-2 py-1 rounded-full border border-indigo-200">
                <Sparkles size={10} />
                Calibración Diaria
              </span>
              <h4 className="text-sm font-extrabold tracking-tight mt-2 text-foreground">Calentamiento Periférico</h4>
              <p className="text-xs text-muted mt-1 leading-relaxed">
                Tabla de Schulte rápida antes del entrenamiento principal. Amplía tu span visual en minutos.
              </p>
            </div>
            <Link
              href="/lesson/M1L5?practice=true"
              className="w-full py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white text-center rounded-xl font-bold text-xs transition-all active:scale-95 flex items-center justify-center gap-1.5 shadow-sm"
            >
              <Grid3X3 size={13} /> PRACTICAR SCHULTE
            </Link>
          </div>

          {/* OpenDyslexic tip */}
          <div className="bg-surface rounded-3xl border border-border-soft shadow-sm p-5 flex flex-col gap-2 animate-fade-in-up delay-400">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted">Consejo de Accesibilidad</h4>
            <div className="flex gap-3">
              <Award className="text-focus shrink-0 mt-0.5" size={18} />
              <p className="text-xs text-muted leading-relaxed">
                <span className="font-bold text-foreground">OpenDyslexic</span> añade peso visual a la base de las letras, reduciendo el esfuerzo cognitivo si tienes dislexia o TDAH. Actívalo desde la barra superior.
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* ── Mobile bottom padding ─────────────────────────────── */}
      <div className="h-8" />
    </main>
  );
}
