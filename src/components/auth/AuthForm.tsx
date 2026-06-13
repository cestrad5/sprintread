"use client";

import { useState } from "react";
import { signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { auth, googleProvider } from "../../lib/firebase";
import { LogIn, UserPlus, Mail } from "lucide-react";

export function AuthForm() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      setError(err.message || "Error en autenticación");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setError("");
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      setError(err.message || "Error al iniciar con Google");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm mx-auto p-6 bg-surface rounded-3xl shadow-sm border border-border-soft">
      <h2 className="text-2xl font-bold tracking-tight text-foreground mb-6 text-center">
        {isLogin ? "Iniciar Sesión" : "Crear Cuenta"}
      </h2>

      {error && (
        <div className="p-3 mb-4 text-sm text-white bg-focus/90 rounded-lg">
          {error}
        </div>
      )}

      <form onSubmit={handleEmailAuth} className="flex flex-col gap-4 mb-6">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
            Correo Electrónico
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-3 bg-background border border-border-soft rounded-xl focus:outline-none focus:border-focus transition-colors"
            required
          />
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
            Contraseña
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 bg-background border border-border-soft rounded-xl focus:outline-none focus:border-focus transition-colors"
            required
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="mt-2 w-full py-3 bg-foreground text-surface rounded-xl font-bold hover:bg-black transition-colors disabled:opacity-50 flex justify-center items-center gap-2"
        >
          {loading ? "Procesando..." : isLogin ? <><LogIn size={18} /> Entrar</> : <><UserPlus size={18} /> Registrarse</>}
        </button>
      </form>

      <div className="relative flex items-center justify-center my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border-soft"></div>
        </div>
        <div className="relative bg-surface px-4 text-xs font-semibold uppercase tracking-wider text-gray-400">
          O continuar con
        </div>
      </div>

      <button
        type="button"
        onClick={handleGoogleAuth}
        disabled={loading}
        className="w-full py-3 bg-white border border-border-soft text-foreground rounded-xl font-bold hover:bg-gray-50 transition-colors flex justify-center items-center gap-2 shadow-sm"
      >
        <svg viewBox="0 0 24 24" className="w-5 h-5">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
        </svg>
        Google
      </button>

      <p className="mt-6 text-center text-sm text-gray-500">
        {isLogin ? "¿No tienes cuenta? " : "¿Ya tienes cuenta? "}
        <button
          onClick={() => setIsLogin(!isLogin)}
          className="font-bold text-focus hover:underline"
        >
          {isLogin ? "Regístrate" : "Inicia Sesión"}
        </button>
      </p>
    </div>
  );
}
