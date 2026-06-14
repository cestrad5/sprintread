"use client";

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { LessonText } from '../../lib/lessonContent';
import { useProgressStore } from '../../store/useProgressStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import { useRouter } from 'next/navigation';
import { Plus, Trash, ArrowRight, Brain, Lightbulb, HelpCircle, Check, X, Play, Pause } from 'lucide-react';

interface ActiveReadingProps {
  userId: string;
  lesson: {
    id: string;
    title: string;
    description: string;
  };
  text: LessonText;
  mode?: 'practice' | 'scored';
}

interface NoteItem {
  id: string;
  text: string;
  category: 'idea' | 'fact' | 'question';
}

const CATEGORY_STYLES = {
  idea: { label: 'Idea Principal', bg: 'bg-emerald-50 border-emerald-200 text-emerald-800', badge: 'bg-emerald-500 text-white', icon: <Brain size={12} /> },
  fact: { label: 'Dato Clave', bg: 'bg-orange-50 border-orange-200 text-orange-800', badge: 'bg-orange-500 text-white', icon: <Lightbulb size={12} /> },
  question: { label: 'Pregunta Propia', bg: 'bg-blue-50 border-blue-200 text-blue-800', badge: 'bg-blue-500 text-white', icon: <HelpCircle size={12} /> },
};

export function ActiveReadingExercise({ userId, lesson, text, mode = 'scored' }: ActiveReadingProps) {
  const router = useRouter();
  const { saveSession } = useProgressStore();
  const { useDyslexicFont, wpm: savedWpm } = useSettingsStore();

  const [step, setStep] = useState<'intro' | 'reading' | 'mindmap' | 'quiz' | 'results'>('intro');
  const [wpm, setWpm] = useState<number>(savedWpm || 300);
  const [isPlaying, setIsPlaying] = useState(false);

  // Reading state
  const [startTime, setStartTime] = useState(0);
  const [readingTime, setReadingTime] = useState(0);

  // Active notes state
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [noteInput, setNoteInput] = useState('');
  const [noteCategory, setNoteCategory] = useState<'idea' | 'fact' | 'question'>('idea');
  const [showNotesPanel, setShowNotesPanel] = useState(true);

  // Pacing lines
  const [activeLine, setActiveLine] = useState(0);
  const [rawLines, setRawLines] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  // Quiz state
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [answers, setAnswers] = useState<boolean[]>([]);
  const [isAnswered, setIsAnswered] = useState<boolean>(false);
  const [correctAnswersCount, setCorrectAnswersCount] = useState<number>(0);

  // Split text into lines for reading
  useEffect(() => {
    if (text.body) {
      // split by sentences or paragraph segments roughly
      setRawLines(text.body.split('\n').filter(l => l.trim().length > 0));
    }
  }, [text.body]);

  // Auto scroll lines
  useEffect(() => {
    if (isPlaying && step === 'reading' && rawLines.length > 0) {
      const lineWords = rawLines[activeLine]?.split(/\s+/).length || 5;
      const duration = (lineWords / wpm) * 60000;

      const timer = setTimeout(() => {
        if (activeLine < rawLines.length - 1) {
          setActiveLine(prev => prev + 1);
        } else {
          setIsPlaying(false);
          setReadingTime((performance.now() - startTime) / 1000);
          setStep(mode === 'practice' ? 'results' : 'mindmap');
        }
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [isPlaying, activeLine, rawLines, wpm, step]);

  const startReading = () => {
    setStep('reading');
    setIsPlaying(true);
    setStartTime(performance.now());
  };

  const addNote = () => {
    if (!noteInput.trim() || notes.length >= 5) return;
    const newNote: NoteItem = {
      id: Date.now().toString(),
      text: noteInput.trim(),
      category: noteCategory
    };
    setNotes([...notes, newNote]);
    setNoteInput('');
  };

  const removeNote = (id: string) => {
    setNotes(notes.filter(n => n.id !== id));
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

  // Save session to Firestore (only in scored mode)
  useEffect(() => {
    if (step === 'results' && mode === 'scored') {
      const calculatedWpm = Math.round((text.wordCount / readingTime) * 60);
      const score = Math.round((correctAnswersCount / text.questions.length) * 100);
      saveSession(userId, {
        lessonId: lesson.id,
        wpm: calculatedWpm,
        wpm_peak: calculatedWpm,
        comprehension: score,
        regressions: 0,
        duration: Math.round(readingTime),
        deviceType: window.innerWidth < 768 ? 'mobile' : 'desktop'
      });
    }
  }, [step]);

  const scorePercentage = Math.round((correctAnswersCount / text.questions.length) * 100);

  return (
    <div className={`w-full max-w-4xl mx-auto bg-surface p-6 md:p-8 rounded-3xl border border-border-soft shadow-sm ${useDyslexicFont ? 'font-dyslexic' : ''}`}>
      
      {/* INTRO SCREEN */}
      {step === 'intro' && (
        <div className="flex flex-col items-center text-center py-6 max-w-xl mx-auto">
          <div className="w-16 h-16 bg-red-50 text-focus rounded-full flex items-center justify-center mb-6">
            <Brain size={32} />
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight mb-3">
            {lesson.title}
          </h2>
          <p className="text-gray-500 mb-6 text-sm leading-relaxed">
            La elaboración y conexión activa de conceptos previene la lectura pasiva e incrementa la memoria duradera hasta en un 60%. Durante la lectura guiada, podrás registrar hasta 5 anotaciones clave de diferentes categorías para estructurar un mapa mental al finalizar.
          </p>

          <div className="bg-background border border-border-soft p-5 rounded-2xl w-full mb-8 text-left text-xs flex flex-col gap-2">
            <span className="font-bold text-foreground block mb-0.5">Indicaciones:</span>
            <span>1. El texto avanzará de forma asistida por una línea de lectura activa.</span>
            <span>2. Utiliza el panel derecho para tomar notas cortas sobre: Ideas Principales, Datos Clave o Preguntas.</span>
            <span>3. Las notas construirán dinámicamente un mapa mental minimalista.</span>
          </div>

          {/* Speed slider */}
          <div className="bg-background border border-border-soft p-4 rounded-2xl w-full max-w-xs mb-8">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 text-center">
              Ajustar Velocidad de Pacing
            </label>
            <input 
              type="range" 
              min="150" 
              max="500" 
              step="10"
              value={wpm} 
              onChange={(e) => setWpm(Number(e.target.value))}
              className="w-full accent-focus"
            />
            <div className="text-lg font-black text-center mt-1">{wpm} WPM</div>
          </div>

          <button
            onClick={startReading}
            className="px-8 py-3.5 bg-foreground text-surface rounded-xl font-bold text-sm shadow-md hover:bg-black transition-all active:scale-95 flex items-center gap-2"
          >
            Iniciar Lectura Activa <ArrowRight size={16} />
          </button>
        </div>
      )}

      {/* READING VIEW WITH NOTES SIDEBAR */}
      {step === 'reading' && (
        <div className="flex flex-col lg:flex-row gap-6 h-[72vh]">
          
          {/* Text Area */}
          <div className="flex-1 flex flex-col h-full border border-border-soft rounded-2xl bg-background/30 p-6 relative overflow-hidden">
            <div className="flex justify-between items-center text-xs text-gray-400 font-bold uppercase tracking-wider mb-4">
              <span>Lectura Asistida</span>
              <span>{wpm} WPM</span>
            </div>

            <div 
              ref={containerRef}
              className="flex-1 overflow-y-auto pr-2 flex flex-col gap-6"
            >
              {rawLines.map((line, idx) => {
                const isActive = idx === activeLine;
                const isPast = idx < activeLine;
                
                return (
                  <p 
                    key={idx}
                    className={`text-lg md:text-xl transition-all duration-300 leading-relaxed ${useDyslexicFont ? 'font-dyslexic' : 'font-sans'} ${
                      isActive 
                        ? 'text-foreground font-semibold scale-100' 
                        : isPast 
                          ? 'opacity-20' 
                          : 'opacity-40'
                    }`}
                  >
                    {line}
                  </p>
                );
              })}
            </div>

            {/* Float Controls */}
            <div className="flex justify-between items-center mt-4 border-t border-border-soft pt-4">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="px-4 py-2 bg-foreground text-surface rounded-xl text-xs font-bold flex items-center gap-1.5"
              >
                {isPlaying ? <><Pause size={12} /> Pausar</> : <><Play size={12} fill="currentColor" /> Reanudar</>}
              </button>
              <button
                onClick={() => {
                  setIsPlaying(false);
                  setReadingTime((performance.now() - startTime) / 1000);
                  setStep(mode === 'practice' ? 'results' : 'mindmap');
                }}
                className="px-4 py-2 bg-focus text-white rounded-xl text-xs font-bold"
              >
                Omitir a Mapa Mental
              </button>
            </div>
          </div>

          {/* Notes Sidebar */}
          {showNotesPanel && (
            <div className="w-full lg:w-80 flex flex-col h-full bg-white border border-border-soft rounded-2xl p-4 shadow-sm">
              <h3 className="text-sm font-extrabold uppercase tracking-widest text-gray-400 mb-3 flex items-center gap-1.5">
                <Brain size={14} className="text-focus" /> Anotaciones ({notes.length}/5)
              </h3>

              {/* Notes List */}
              <div className="flex-1 overflow-y-auto flex flex-col gap-2 mb-4">
                {notes.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center text-xs text-gray-400 p-4 border border-dashed border-gray-200 rounded-xl">
                    No hay anotaciones aún.<br/>Usa la sección inferior para añadir ideas del texto.
                  </div>
                ) : (
                  notes.map((note) => {
                    const style = CATEGORY_STYLES[note.category];
                    return (
                      <div 
                        key={note.id} 
                        className={`p-3 border rounded-xl text-xs flex justify-between gap-3 items-start ${style.bg}`}
                      >
                        <div className="flex flex-col gap-1.5">
                          <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase w-max ${style.badge}`}>
                            {style.icon} {style.label}
                          </span>
                          <p className="font-medium">{note.text}</p>
                        </div>
                        <button 
                          onClick={() => removeNote(note.id)}
                          className="text-gray-400 hover:text-red-500 p-0.5 rounded"
                        >
                          <Trash size={12} />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Note Creator */}
              {notes.length < 5 ? (
                <div className="flex flex-col gap-2 border-t border-border-soft pt-3">
                  {/* Category toggle */}
                  <div className="grid grid-cols-3 gap-1">
                    {(['idea', 'fact', 'question'] as const).map((cat) => {
                      const active = noteCategory === cat;
                      const style = CATEGORY_STYLES[cat];
                      return (
                        <button
                          key={cat}
                          onClick={() => setNoteCategory(cat)}
                          className={`py-1 rounded-lg text-[9px] font-bold border text-center transition-all ${
                            active 
                              ? 'bg-foreground border-foreground text-surface font-extrabold' 
                              : 'bg-background text-gray-500 border-border-soft'
                          }`}
                        >
                          {style.label.split(' ')[0]}
                        </button>
                      );
                    })}
                  </div>
                  {/* Note input */}
                  <div className="flex gap-2">
                    <input 
                      type="text"
                      placeholder="Nota corta..."
                      value={noteInput}
                      onChange={(e) => setNoteInput(e.target.value.slice(0, 80))}
                      className="flex-1 px-3 py-2 bg-background border border-border-soft rounded-lg text-xs"
                      onKeyDown={(e) => { if (e.key === 'Enter') addNote(); }}
                    />
                    <button 
                      onClick={addNote}
                      className="p-2 bg-foreground text-surface rounded-lg hover:bg-black active:scale-95"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-[10px] text-center text-amber-600 bg-amber-50 p-2 rounded-lg font-semibold border border-amber-200">
                  Límite de 5 notas alcanzado. Elimina alguna para añadir más.
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* MIND MAP VIEW */}
      {step === 'mindmap' && (
        <div className="py-4 flex flex-col items-center">
          <h3 className="text-xl font-extrabold tracking-tight mb-2 text-center">Tu Mapa Mental Estructural</h3>
          <p className="text-xs text-gray-500 text-center mb-8 max-w-sm mx-auto">
            Hemos construido una síntesis cognitiva basada en las notas del texto que registraste.
          </p>

          {/* Interactive CSS Mind Map Container */}
          <div className="relative w-full min-h-[400px] border border-border-soft bg-background rounded-3xl p-6 flex items-center justify-center overflow-x-auto shadow-inner">
            
            {notes.length === 0 ? (
              <div className="text-center text-xs text-gray-400">
                ⚠️ No tomaste ninguna nota durante la lectura. No se pudo generar un mapa mental.<br/>
                Puedes continuar al quiz o repetir el ejercicio.
              </div>
            ) : (
              <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-16 relative">
                {/* Central Concept Node */}
                <div className="w-40 h-40 bg-foreground text-surface rounded-full flex flex-col justify-center items-center text-center p-4 shadow-lg border-4 border-white z-10">
                  <Brain size={28} className="text-focus mb-1 animate-pulse" />
                  <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400">Tema Principal</span>
                  <h4 className="text-xs font-black line-clamp-3 leading-tight mt-1">{text.title}</h4>
                </div>

                {/* Branches container */}
                <div className="flex flex-col gap-4 max-w-md w-full relative">
                  {notes.map((note) => {
                    const style = CATEGORY_STYLES[note.category];
                    return (
                      <div 
                        key={note.id}
                        className={`p-4 border rounded-2xl flex items-center gap-3 shadow-sm ${style.bg} border-2 animate-fade-in`}
                      >
                        <div className={`p-2 rounded-xl flex-none ${style.badge}`}>
                          {style.icon}
                        </div>
                        <div>
                          <span className="text-[9px] font-bold uppercase tracking-widest opacity-60 block">
                            {style.label}
                          </span>
                          <p className="text-xs font-semibold leading-normal mt-0.5">{note.text}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => setStep('quiz')}
            className="mt-8 px-8 py-3.5 bg-foreground text-surface rounded-xl font-bold text-sm shadow-md hover:bg-black transition-all active:scale-95 flex items-center gap-2"
          >
            Avanzar al Cuestionario <ArrowRight size={16} />
          </button>
        </div>
      )}

      {/* COMPREHENSION QUIZ SCREEN */}
      {step === 'quiz' && (
        <div className="py-4 max-w-xl mx-auto">
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
            {mode === 'practice' ? '🏋️' : '🏆'}
          </div>

          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight mb-2">
            {mode === 'practice' ? '¡Práctica Completada!' : '¡Ejercicio Completado!'}
          </h2>
          <p className="text-gray-500 text-sm max-w-xs mx-auto mb-8">
            {mode === 'practice' ? 'Tu velocidad de lectura en este recorrido.' : 'Aquí están tus estadísticas de rendimiento.'}
          </p>

          <div className={`grid gap-8 w-full max-w-md bg-background border border-border-soft p-6 rounded-2xl mb-8 ${mode === 'practice' ? 'grid-cols-1' : 'grid-cols-2'}`}>
            <div className="flex flex-col items-center">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Velocidad</span>
              <span className="text-4xl font-black text-foreground mt-2">
                {Math.round((text.wordCount / readingTime) * 60)}
              </span>
              <span className="text-xs text-gray-500 font-semibold mt-1">WPM</span>
            </div>

            {mode === 'scored' && (
              <div className="flex flex-col items-center border-l border-border-soft">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Comprensión</span>
                <span className="text-4xl font-black text-foreground mt-2">{scorePercentage}%</span>
                <span className="text-xs text-gray-500 font-semibold mt-1">
                  {correctAnswersCount} de {text.questions.length} correctas
                </span>
              </div>
            )}
          </div>

          {mode === 'scored' && (
            <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl text-xs text-emerald-800 max-w-sm mb-8 text-left">
              🗺️ <span className="font-extrabold">Mapa Mental de {notes.length} conceptos generado.</span><br/>
              Estructurar la información de forma no lineal fuerza al cerebro a reconsolidar conceptos clave en lugar de simplemente re-leerlos.
            </div>
          )}

          <div className="flex gap-3">
            {mode === 'practice' && (
              <button
                onClick={() => { setStep('intro'); setNotes([]); setActiveLine(0); }}
                className="px-6 py-3.5 bg-background border border-border-soft text-foreground rounded-xl font-bold text-sm hover:bg-gray-50 transition-all active:scale-95"
              >
                Practicar de Nuevo
              </button>
            )}
            <button
              onClick={() => router.push('/')}
              className="px-8 py-3.5 bg-foreground text-surface rounded-xl font-bold text-sm shadow-md hover:bg-black transition-all active:scale-95"
            >
              Volver al Dashboard
            </button>
          </div>
        </div>
      )}


    </div>
  );
}
