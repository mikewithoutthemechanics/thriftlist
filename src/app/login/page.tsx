'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Mail, Lock, Loader2 } from 'lucide-react';
import { createClientBrowser } from '@/lib/supabase';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const supabase = createClientBrowser();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
      }
      router.push('/dashboard');
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setMode(m => (m === 'login' ? 'register' : 'login'));
    setError('');
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
          <div className="w-10 h-px bg-[#d4af37]/40 mb-6" />
          <p className="text-white/70 text-lg font-light leading-relaxed italic max-w-md font-serif">
            &ldquo;Exceptional tool for serious resellers. I've multiplied my turnover 
            while investing only minutes per listing.&rdquo;
          </p>
          <p className="text-[#d4af37] text-xs uppercase tracking-[0.2em] mt-6 font-mono">
            — Verified Seller, Johannesburg
          </p>
        </div>

        {/* Art Deco corner decorations */}
        <div className="absolute top-8 left-8 w-20 h-20 border-l border-t border-[#d4af37]/20" />
        <div className="absolute bottom-8 right-8 w-20 h-20 border-r border-b border-[#d4af37]/20" />
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
              <div className="w-12 h-[1px] bg-[#d4af37]" />
              <span className="text-[10px] font-medium uppercase tracking-[0.35em] text-[#d4af37] font-mono">
                Thrift List
              </span>
              <div className="flex-1 h-[1px] bg-gradient-to-r from-[#d4af37]/30 to-transparent" />
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
                {mode === 'login' ? 'Welcome Back' : 'Begin Journey'}
              </h1>
              <p className="text-white/50 text-sm mb-12 font-light leading-relaxed">
                {mode === 'login'
                  ? 'Resume managing your distinguished inventory.'
                  : 'Join the community of elite resellers.'}
              </p>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-8 p-4 rounded-sm bg-red-950/20 border border-red-900/30 text-red-300 text-sm font-light"
                >
                  {error}
                </motion.div>
              )}

              <form onSubmit={handleSubmit} className="space-y-8">
                <div>
                  <label className="block text-[10px] font-medium uppercase tracking-widest text-white/40 mb-3 font-mono">
                    Electronic Mail
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 text-[#d4af37]/30" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="w-full pl-8 pr-0 py-4 bg-transparent border-b border-white/10 text-white placeholder-white/20 focus:border-[#d4a882] focus:outline-none transition-colors duration-500 text-base font-light"
                      placeholder="curator@example.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-medium uppercase tracking-widest text-white/40 mb-3 font-mono">
                    Access Key
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 text-[#d4af37]/30" />
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="w-full pl-8 pr-0 py-4 bg-transparent border-b border-white/10 text-white placeholder-white/20 focus:border-[#d4a882] focus:outline-none transition-colors duration-500 text-base font-light"
                      placeholder="Minimum six characters"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="metallic-btn w-full py-5 text-sm tracking-[0.1em] rounded-sm flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      {mode === 'login' ? 'Authenticate' : 'Establish Account'}
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          </AnimatePresence>

          <div className="mt-12 pt-10 border-t border-white/[0.06]">
            <p className="text-white/30 text-center font-light text-sm">
              {mode === 'login' ? "Don't possess an identity?" : 'Previously registered?'}{' '}
              <button
                onClick={toggleMode}
                className="text-[#d4af37] hover:text-white transition-colors duration-300"
              >
                {mode === 'login' ? 'Register' : 'Authenticate'}
              </button>
            </p>
          </div>

          <p className="text-white/20 text-[10px] text-center mt-10 font-mono uppercase tracking-wider">
            By proceeding, you accept ourTerms of Engagement
          </p>
        </div>
      </div>
    </div>
  );
}