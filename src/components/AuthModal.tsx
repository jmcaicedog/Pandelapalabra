import React, { useState } from 'react';
import { X, LogIn, UserPlus, Sparkles, AlertCircle } from 'lucide-react';
import { loginWithEmail, registerWithEmail, loginWithGoogle, loginAnonymously } from '../lib/firebase.ts';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);
    try {
      if (isRegister) {
        if (!name.trim()) throw new Error('Por favor ingresa tu nombre');
        await registerWithEmail(email, password, name);
      } else {
        await loginWithEmail(email, password);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Auth error:', err);
      let msg = 'Error en la autenticación.';
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found') {
        msg = 'Correo o contraseña incorrectos.';
      } else if (err.code === 'auth/email-already-in-use') {
        msg = 'Este correo electrónico ya está registrado.';
      } else if (err.code === 'auth/weak-password') {
        msg = 'La contraseña debe tener al menos 6 caracteres.';
      } else if (err.message) {
        msg = err.message;
      }
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setErrorMsg(null);
    setLoading(true);
    try {
      await loginWithGoogle();
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Google Auth Error:', err);
      setErrorMsg('No se pudo iniciar sesión con Google. Puedes usar tu correo o continuar como invitado.');
    } finally {
      setLoading(false);
    }
  };

  const handleGuest = async () => {
    setErrorMsg(null);
    setLoading(true);
    try {
      await loginAnonymously();
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Guest Auth Error:', err);
      setErrorMsg('No se pudo acceder en modo invitado.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      id="auth-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in"
    >
      <div
        id="auth-modal-container"
        className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative text-slate-100"
      >
        <button
          id="btn-close-auth-modal"
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 rounded-full hover:bg-slate-800/80 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-center mx-auto mb-3 text-amber-400">
            <Sparkles className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-serif font-bold text-amber-300">
            {isRegister ? 'Crear Cuenta Espiritual' : 'Iniciar Sesión en Lumen'}
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
            Sincroniza tus oraciones, rutinas diarias, notas espirituales y versículos en todos tus dispositivos.
          </p>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 bg-red-950/50 border border-red-800/60 rounded-xl text-xs text-red-300 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {isRegister && (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Nombre</label>
              <input
                id="input-auth-name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej. Juan de la Cruz"
                className="w-full bg-slate-800/90 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400/80 focus:ring-1 focus:ring-amber-400/80 transition-all"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Correo Electrónico</label>
            <input
              id="input-auth-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@correo.com"
              className="w-full bg-slate-800/90 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400/80 focus:ring-1 focus:ring-amber-400/80 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Contraseña</label>
            <input
              id="input-auth-password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-slate-800/90 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400/80 focus:ring-1 focus:ring-amber-400/80 transition-all"
            />
          </div>

          <button
            id="btn-auth-submit"
            type="submit"
            disabled={loading}
            className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold py-2.5 px-4 rounded-xl text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-[0.99] disabled:opacity-50"
          >
            {isRegister ? <UserPlus className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
            <span>{loading ? 'Procesando...' : isRegister ? 'Registrarme' : 'Entrar'}</span>
          </button>
        </form>

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-800"></div>
          </div>
          <div className="relative flex justify-center text-[11px] uppercase">
            <span className="bg-slate-900 px-2 text-slate-500">O también</span>
          </div>
        </div>

        <div className="space-y-2">
          <button
            id="btn-auth-google"
            type="button"
            onClick={handleGoogle}
            disabled={loading}
            className="w-full bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 py-2.5 px-4 rounded-xl text-xs font-medium flex items-center justify-center gap-2.5 transition-colors disabled:opacity-50"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#EA4335"
                d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.4 1 3.5 3.6 1.6 7.4l3.7 2.9C6.2 7.4 8.9 5 12 5z"
              />
              <path
                fill="#4285F4"
                d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z"
              />
              <path
                fill="#FBBC05"
                d="M5.3 14.8c-.2-.7-.4-1.5-.4-2.3 0-.8.2-1.6.4-2.3L1.6 7.4C.6 9.4 0 11.6 0 14s.6 4.6 1.6 6.6l3.7-2.9c-.4-.9-.6-1.9-.6-2.9z"
              />
              <path
                fill="#34A853"
                d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.1 0-5.8-2.4-6.7-5.3L1.6 16c1.9 3.8 5.8 7 10.4 7z"
              />
            </svg>
            <span>Continuar con Google</span>
          </button>

          <button
            id="btn-auth-guest"
            type="button"
            onClick={handleGuest}
            disabled={loading}
            className="w-full bg-slate-800/40 hover:bg-slate-800/80 border border-slate-800 text-slate-400 hover:text-slate-200 py-2 px-4 rounded-xl text-xs transition-colors"
          >
            Continuar como Peregrino Invitado (local y anónimo)
          </button>
        </div>

        <div className="mt-5 text-center text-xs text-slate-400">
          {isRegister ? '¿Ya tienes cuenta? ' : '¿No tienes cuenta aún? '}
          <button
            type="button"
            onClick={() => {
              setIsRegister(!isRegister);
              setErrorMsg(null);
            }}
            className="text-amber-400 hover:underline font-medium"
          >
            {isRegister ? 'Inicia sesión' : 'Regístrate aquí'}
          </button>
        </div>
      </div>
    </div>
  );
};
