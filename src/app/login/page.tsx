'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Mail, Lock, Loader2, AlertCircle } from 'lucide-react';
import { createClientBrowser } from '@/lib/supabase';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionExpired = searchParams.get('reason') === 'session_expired';
  const [mode, setMode] = useState<'login' | 'register' | 'reset'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const supabase = createClientBrowser();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push('/dashboard');
        router.refresh();
      } else if (mode === 'register') {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        router.push('/dashboard');
        router.refresh();
      } else if (mode === 'reset') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/login` });
        if (error) throw error;
        setResetSent(true);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setMode(m => {
      if (m === 'login') return 'register';
      if (m === 'register') return 'login';
      return 'login';
    });
    setError('');
    setResetSent(false);
  };

  return (
    <div className="min-h-screen flex bg-[#0a0a0a]">
      {/* Left Panel - Cinematic Visual */}
      <div className="hidden lg:block lg:w-[55%] relative bg-[#0a0a0a] overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=1200&auto=format&fit=crop"
          alt="Luxury vintage boutique"
          fill
          className="object-cover opacity-40 grayscale-[20%]"
          priority
        />
        {/* Warm overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a] via-[#0a0a0a]/60 to-[#0a0a0a]/90" />
        
        {/* Film grain texture */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          }}
        />

        {/* Testimonial */}
        <div className="absolute bottom-16 left-16 right-16">
          <div className="w-10 h-px bg-accent/40 mb-6" />
          <p className="text-white/70 text-lg font-light leading-relaxed italic max-w-md font-serif">
            &ldquo;Exceptional tool for serious resellers. I've multiplied my turnover 
            while investing only minutes per listing.&rdquo;
          </p>
          <p className="text-accent text-xs uppercase tracking-[0.2em] mt-6 font-mono">
            — Verified Seller, Johannesburg
          </p>
        </div>

        {/* Art Deco corner decorations */}
        <div className="absolute top-8 left-8 w-20 h-20 border-l border-t border-accent/20" />
        <div className="absolute bottom-8 right-8 w-20 h-20 border-r border-b border-accent/20" />
      </div>

      {/* Right Panel - Form */}
      <div className="w-full lg:w-[45%] flex items-center justify-center bg-[#0a0a0a] px-8 sm:px-16 lg:px-20">
        <div className="w-full max-w-sm">
          {/* Brand Mark */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="mb-16"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-[1px] bg-accent" />
              <span className="text-[10px] font-medium uppercase tracking-[0.35em] text-accent font-mono">
                Thrift List
              </span>
              <div className="flex-1 h-[1px] bg-gradient-to-r from-accent/30 to-transparent" />
            </div>
          </motion.div>

          <AnimatePresence mode="wait">
            <motion.div
              key={mode}
              initial={{ opacity: 0, x: mode === 'login' ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: mode === 'login' ? 20 : -20 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              <h1 className="text-4xl font-light text-white mb-3 tracking-tight font-serif">
                {mode === 'login' ? 'Welcome Back' : mode === 'register' ? 'Begin Journey' : 'Reset Access'}
              </h1>
              <p className="text-white/50 text-sm mb-12 font-light leading-relaxed">
                {mode === 'login'
                  ? 'Resume managing your distinguished inventory.'
                  : mode === 'register'
                  ? 'Join the community of elite resellers.'
                  : 'Enter your email to receive a reset link.'}
              </p>

              {sessionExpired && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-8 p-4 rounded-xl bg-amber-950/20 border border-amber-500/20 text-amber-300 text-sm font-light flex items-center gap-3"
                >
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  Your session expired due to inactivity. Please sign in again.
                </motion.div>
              )}

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-8 p-4 rounded-xl bg-red-950/20 border border-red-500/20 text-red-300 text-sm font-light"
                >
                  {error}
                </motion.div>
              )}

              <form onSubmit={handleSubmit} className="space-y-8">
                <div>
                  <label className="block text-[10px] font-medium uppercase tracking-widest text-white/40 mb-3 font-mono">
                    Electronic Mail
                  </label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-accent/40 group-focus-within:text-accent transition-colors duration-300" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="w-full pl-11 pr-4 py-4 bg-white/[0.03] border border-white/10 rounded-2xl text-white placeholder-white/20 focus:border-[accent]/50 focus:bg-white/[0.05] focus:outline-none transition-all duration-300 text-base font-light shadow-inner shadow-black/20"
                      placeholder="curator@example.com"
                    />
                  </div>
                </div>

                {mode !== 'reset' && (
                  <div>
                    <label className="block text-[10px] font-medium uppercase tracking-widest text-white/40 mb-3 font-mono">
                      Access Key
                    </label>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-accent/40 group-focus-within:text-accent transition-colors duration-300" />
                      <input
                        type="password"
                        required
                        minLength={6}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        className="w-full pl-11 pr-4 py-4 bg-white/[0.03] border border-white/10 rounded-2xl text-white placeholder-white/20 focus:border-[accent]/50 focus:bg-white/[0.05] focus:outline-none transition-all duration-300 text-base font-light shadow-inner shadow-black/20"
                        placeholder="Minimum six characters"
                      />
                    </div>
                  </div>
                )}

                {resetSent && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/20 text-emerald-300 text-sm font-light"
                  >
                    Reset link sent. Check your email.
                  </motion.div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="metallic-btn w-full py-5 text-sm tracking-[0.1em] rounded-2xl flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-accent/10 hover:shadow-xl hover:shadow-accent/20 transition-shadow duration-300"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      {mode === 'login' ? 'Authenticate' : mode === 'register' ? 'Establish Account' : 'Send Reset Link'}
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          </AnimatePresence>

          <div className="mt-12 pt-10 border-t border-white/[0.06] space-y-3">
            {mode === 'login' && (
              <p className="text-white/30 text-center font-light text-sm">
                <button
                  onClick={() => { setMode('reset'); setError(''); setResetSent(false); }}
                  className="text-accent hover:text-white transition-colors duration-300"
                >
                  Forgot your access key?
                </button>
              </p>
            )}
            {mode === 'reset' && (
              <p className="text-white/30 text-center font-light text-sm">
                Remember your credentials?{' '}
                <button
                  onClick={() => { setMode('login'); setError(''); setResetSent(false); }}
                  className="text-accent hover:text-white transition-colors duration-300"
                >
                  Authenticate
                </button>
              </p>
            )}
            {mode !== 'reset' && (
              <p className="text-white/30 text-center font-light text-sm">
                {mode === 'login' ? "Don't possess an identity?" : 'Previously registered?'}{' '}
                <button
                  onClick={toggleMode}
                  className="text-accent hover:text-white transition-colors duration-300"
                >
                  {mode === 'login' ? 'Register' : 'Authenticate'}
                </button>
              </p>
            )}
          </div>

          <p className="text-white/20 text-[10px] text-center mt-10 font-mono uppercase tracking-wider">
            By proceeding, you accept ourTerms of Engagement
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}