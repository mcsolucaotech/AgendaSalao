import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { LogIn, Mail, Lock, Sparkles } from 'lucide-react';
import { motion as Motion } from 'framer-motion';
import AppLogo from './AppLogo';
import { normalizeEmail } from '../lib/validation';
import ThemeSwitcher from './ThemeSwitcher';

const LOCKOUT_STORAGE_KEY = 'agenda_salao_lockout_until';
const MAX_LOCAL_ATTEMPTS = 5;
const LOCKOUT_MS = 30_000;
const MIN_FAILURE_DELAY_MS = 700;

const Login = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [attempts, setAttempts] = useState(0);
  const [blockedUntil, setBlockedUntil] = useState(() => {
    const storedValue = sessionStorage.getItem(LOCKOUT_STORAGE_KEY);
    if (!storedValue) return null;
    const parsed = Number.parseInt(storedValue, 10);
    if (!Number.isFinite(parsed) || parsed <= Date.now()) {
      sessionStorage.removeItem(LOCKOUT_STORAGE_KEY);
      return null;
    }
    return new Date(parsed);
  });

  const isBlocked = blockedUntil && new Date() < blockedUntil;

  const handleLogin = async (e) => {
    e.preventDefault();
    if (isBlocked) return;

    setLoading(true);
    setError(null);
    const startedAt = Date.now();

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: normalizeEmail(email),
        password,
      });

      if (authError) {
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        if (newAttempts >= MAX_LOCAL_ATTEMPTS) {
          const until = new Date(Date.now() + LOCKOUT_MS);
          setBlockedUntil(until);
          sessionStorage.setItem(LOCKOUT_STORAGE_KEY, String(until.getTime()));
          setAttempts(0);
          setError('Muitas tentativas. Aguarde 30 segundos.');
        } else {
          setError('Não foi possível autenticar. Verifique os dados e tente novamente.');
        }
        const elapsed = Date.now() - startedAt;
        if (elapsed < MIN_FAILURE_DELAY_MS) {
          await new Promise((resolve) => setTimeout(resolve, MIN_FAILURE_DELAY_MS - elapsed));
        }
      } else {
        setAttempts(0);
        setBlockedUntil(null);
        sessionStorage.removeItem(LOCKOUT_STORAGE_KEY);
      }
    } catch {
      setError('Falha de conexão com o servidor. Verifique sua internet e tente novamente.');
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#FBFBFF] flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-lavender-100 via-white to-white">
      <div className="w-full max-w-sm sm:max-w-md flex justify-end mb-3">
        <ThemeSwitcher />
      </div>
      <Motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm sm:max-w-md"
      >
        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl p-6 sm:p-8 md:p-10 border border-lavender-100 premium-shadow">
          {/* Brand */}
          <div className="flex flex-col items-center mb-8 sm:mb-10">
            <Motion.div
              whileHover={{ rotate: 15 }}
              className="p-3 sm:p-4 md:p-5 bg-lavender-600 rounded-2xl sm:rounded-3xl shadow-xl shadow-lavender-200 mb-4 sm:mb-6"
            >
              <Sparkles className="w-8 sm:w-10 h-8 sm:h-10 text-white" />
            </Motion.div>
            <h1 className="mb-2">
              <AppLogo className="text-2xl sm:text-3xl md:text-4xl" />
            </h1>
            <p className="text-gray-400 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] sm:tracking-[0.3em]">Premium Management</p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4 sm:space-y-6">
            <div className="space-y-2">
              <label className="text-[9px] sm:text-[10px] font-black text-gray-400 ml-1 uppercase tracking-widest">
                Acesso Restrito
              </label>

              {/* Email */}
              <div className="relative group">
                <Mail className="absolute left-4 sm:left-5 top-1/2 -translate-y-1/2 w-4 sm:w-5 h-4 sm:h-5 text-gray-300 group-focus-within:text-lavender-500 transition-colors" />
                <input
                  type="email"
                  required
                  autoComplete="username"
                  maxLength={120}
                  placeholder="Seu e-mail profissional"
                  className="w-full pl-12 sm:pl-14 pr-4 sm:pr-5 py-3 sm:py-4 md:py-5 bg-gray-50 border-transparent rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-lavender-500 outline-none transition-all font-bold text-sm"
                  value={email}
                  onChange={(e) => setEmail(normalizeEmail(e.target.value))}
                />
              </div>

              {/* Senha */}
              <div className="relative group">
                <Lock className="absolute left-4 sm:left-5 top-1/2 -translate-y-1/2 w-4 sm:w-5 h-4 sm:h-5 text-gray-300 group-focus-within:text-lavender-500 transition-colors" />
                <input
                  type="password"
                  required
                  autoComplete="current-password"
                  maxLength={120}
                  placeholder="Sua senha secreta"
                  className="w-full pl-12 sm:pl-14 pr-4 sm:pr-5 py-3 sm:py-4 md:py-5 bg-gray-50 border-transparent rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-lavender-500 outline-none transition-all font-bold text-sm"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            {/* Erro */}
            {error && (
              <Motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-3 sm:p-4 bg-red-50 text-red-600 text-[11px] sm:text-xs font-bold rounded-xl sm:rounded-2xl border border-red-100 flex items-center gap-3"
              >
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse flex-shrink-0" />
                {error}
              </Motion.div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || isBlocked}
              className={`
                w-full py-3 sm:py-4 md:py-5 bg-gray-900 text-white rounded-xl sm:rounded-2xl font-black text-sm sm:text-base shadow-2xl shadow-gray-200
                flex items-center justify-center gap-2 hover:bg-lavender-600 transition-all active:scale-95
                ${loading || isBlocked ? 'opacity-70 cursor-not-allowed' : ''}
              `}
            >
              {loading ? (
                <div className="w-5 h-5 border-4 border-white/30 border-t-white rounded-full animate-spin" />
              ) : isBlocked ? (
                'Aguarde 30 segundos...'
              ) : (
                <>
                  <LogIn className="w-4 sm:w-5 h-4 sm:h-5" />
                  Entrar no Sistema
                </>
              )}
            </button>
          </form>

          <div className="mt-6 sm:mt-10 text-center text-gray-300 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.15em] sm:tracking-[0.2em] flex items-center justify-center gap-2">
            <div className="flex-grow h-[1px] bg-gray-100" />
            <span className="flex-shrink-0">Exclusivo Gold Team</span>
            <div className="flex-grow h-[1px] bg-gray-100" />
          </div>
        </div>
      </Motion.div>
    </div>
  );
};

export default Login;
