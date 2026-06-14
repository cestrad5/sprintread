"use client";

import { useState } from "react";
import { signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { auth, googleProvider } from "../../lib/firebase";
import { LogIn, UserPlus, Mail, Eye, EyeOff, AlertCircle } from "lucide-react";

export function AuthForm() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
      // Friendlier error messages
      const code = err.code ?? "";
      if (code === "auth/user-not-found" || code === "auth/wrong-password" || code === "auth/invalid-credential") {
        setError("Correo o contraseña incorrectos.");
      } else if (code === "auth/email-already-in-use") {
        setError("Este correo ya tiene una cuenta. Intenta iniciar sesión.");
      } else if (code === "auth/weak-password") {
        setError("La contraseña debe tener al menos 6 caracteres.");
      } else {
        setError(err.message || "Error en autenticación");
      }
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
    <div className="w-full max-w-sm mx-auto glass rounded-3xl border border-border-soft p-7 shadow-lg shadow-black/5 animate-scale-in">
      {/* Tab switcher */}
      <div className="flex gap-1 p-1 bg-background rounded-xl mb-6">
        {["Iniciar Sesión", "Crear Cuenta"].map((label, i) => {
          const active = isLogin === (i === 0);
          return (
            <button
              key={label}
              onClick={() => { setIsLogin(i === 0); setError(""); }}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                active
                  ? "bg-surface shadow-sm text-foreground"
                  : "text-muted hover:text-foreground"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Error banner */}
      {error && (
        <div className="flex items-start gap-2 p-3 mb-4 text-xs text-red-800 bg-red-50 border border-red-200 rounded-xl animate-fade-in">
          <AlertCircle size={14} className="mt-0.5 shrink-0 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleEmailAuth} className="flex flex-col gap-4 mb-5">
        {/* Email */}
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-widest text-muted mb-1.5">
            Correo electrónico
          </label>
          <div className="relative">
            <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="hola@ejemplo.com"
              className="w-full pl-9 pr-4 py-2.5 bg-background border border-border-soft rounded-xl text-sm focus:outline-none focus:border-focus focus:ring-2 focus:ring-focus/10 transition-all placeholder:text-muted/50"
              required
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-widest text-muted mb-1.5">
            Contraseña
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-4 pr-10 py-2.5 bg-background border border-border-soft rounded-xl text-sm focus:outline-none focus:border-focus focus:ring-2 focus:ring-focus/10 transition-all placeholder:text-muted/50"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground transition-colors"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-1 w-full py-3 bg-foreground text-surface rounded-xl font-bold text-sm hover:bg-focus transition-colors disabled:opacity-50 flex justify-center items-center gap-2 active:scale-95 shadow-sm"
        >
          {loading
            ? <span className="inline-block w-4 h-4 border-2 border-surface/30 border-t-surface rounded-full animate-spin" />
            : isLogin
            ? <><LogIn size={16} /> Entrar</>
            : <><UserPlus size={16} /> Crear cuenta</>
          }
        </button>
      </form>

      {/* Divider */}
      <div className="relative flex items-center my-4">
        <div className="flex-1 h-px bg-border-soft" />
        <span className="px-3 text-[10px] font-bold uppercase tracking-widest text-muted">O continúa con</span>
        <div className="flex-1 h-px bg-border-soft" />
      </div>

      {/* Google */}
      <button
        type="button"
        onClick={handleGoogleAuth}
        disabled={loading}
        className="w-full py-2.5 bg-surface border border-border-soft text-foreground rounded-xl font-bold text-sm hover:bg-background transition-colors flex justify-center items-center gap-2.5 shadow-xs active:scale-95 disabled:opacity-50"
      >
        <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
        </svg>
        Continuar con Google
      </button>
    </div>
  );
}
