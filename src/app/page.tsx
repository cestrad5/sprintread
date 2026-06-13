"use client";

import { useState, useEffect } from 'react';
import { RSVPDisplay } from '../components/core/RSVPDisplay';
import { AuthForm } from '../components/auth/AuthForm';
import { useAuthStore } from '../store/useAuthStore';
import { auth } from '../lib/firebase';
import { signOut } from 'firebase/auth';
import { LogOut } from 'lucide-react';

const sampleText = `La visión periférica es fundamental para la lectura veloz. Al enfocar la mirada en el centro de la pantalla, el cerebro puede captar y procesar la información de los bordes sin necesidad de realizar movimientos sacádicos. Esta técnica, combinada con la reducción de la subvocalización, permite alcanzar velocidades de comprensión superiores a las mil palabras por minuto. El entrenamiento requiere consistencia, pero los resultados transforman permanentemente la forma en que el cerebro asimila el conocimiento.`;

export default function Home() {
  const [wpm, setWpm] = useState(300);
  const [useDyslexicFont, setUseDyslexicFont] = useState(false);
  const { user, loading, initializeAuthListener } = useAuthStore();

  useEffect(() => {
    const unsubscribe = initializeAuthListener();
    return () => unsubscribe();
  }, [initializeAuthListener]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Cargando...</div>;
  }

  if (!user) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-4 md:p-12 bg-background">
        <div className="w-full max-w-2xl text-center mb-8">
          <h1 className="text-4xl font-bold tracking-tight text-foreground mb-4 font-sans">
            SprintRead
          </h1>
          <p className="text-gray-500 max-w-md mx-auto">
            Inicia sesión para comenzar tu neuro-entrenamiento visual y guardar tu progreso.
          </p>
        </div>
        <AuthForm />
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 md:p-12">
      <div className="w-full max-w-2xl text-center mb-8 relative">
        <button 
          onClick={() => signOut(auth)}
          className="absolute right-0 top-0 p-2 text-gray-400 hover:text-foreground transition-colors"
          title="Cerrar sesión"
        >
          <LogOut size={20} />
        </button>

        <h1 className="text-4xl font-bold tracking-tight text-foreground mb-4">
          SprintRead
        </h1>
        <p className="text-gray-500 mb-8 max-w-md mx-auto">
          Bienvenido, {user.displayName || user.email}. Plataforma de neuro-entrenamiento visual.
        </p>

        {/* Global Controls */}
        <div className="flex flex-wrap justify-center gap-6 mb-8 bg-white p-4 rounded-2xl shadow-sm border border-border-soft">
          <div className="flex flex-col items-start">
            <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
              Velocidad (WPM)
            </label>
            <input 
              type="range" 
              min="150" 
              max="1000" 
              step="50"
              value={wpm} 
              onChange={(e) => setWpm(Number(e.target.value))}
              className="w-48 accent-focus"
            />
            <span className="text-sm font-medium mt-1">{wpm} Palabras / Min</span>
          </div>

          <div className="flex flex-col items-start justify-center">
            <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
              Accesibilidad
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input 
                type="checkbox" 
                checked={useDyslexicFont}
                onChange={(e) => setUseDyslexicFont(e.target.checked)}
                className="w-5 h-5 accent-focus rounded"
              />
              <span className="text-sm font-medium">Fuente OpenDyslexic</span>
            </label>
          </div>
        </div>
      </div>

      <RSVPDisplay 
        rawText={sampleText} 
        wpm={wpm} 
        useDyslexicFont={useDyslexicFont}
      />
      
      <div className="mt-12 text-sm text-gray-400 max-w-lg text-center">
        Modo Focus Activado: Interfaz libre de distracciones. Mantén el dispositivo a 40cm de los ojos.
      </div>
    </main>
  );
}
