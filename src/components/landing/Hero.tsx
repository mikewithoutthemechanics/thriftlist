'use client';

import { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, Sparkles, Play, Star, Users, TrendingUp } from 'lucide-react';
import FallingClothes3D from './FallingClothes3D';

/* Kinetic letter component */
function KineticLetter({ char, index }: { char: string; index: number }) {
  return (
    <motion.span
      initial={{ opacity: 0, y: 80, rotateX: -90 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      transition={{
        duration: 0.7,
        delay: 0.8 + index * 0.06,
        ease: [0.22, 1, 0.36, 1],
      }}
      className="inline-block"
      style={{ transformOrigin: 'center bottom', perspective: '800px' }}
    >
      {char === ' ' ? '\u00A0' : char}
    </motion.span>
  );
}

/* Animated word with per-letter reveal */
function KineticWord({ text, className }: { text: string; className?: string }) {
  return (
    <span className={
      className + " inline-flex flex-wrap justify-center"
    }>
      {text.split('').map((char, i) => (
        <KineticLetter key={i} char={char} index={i} />
      ))}
    </span>
  );
}

/* Fabric-style CTA button with ripple micro-interaction */
function FabricButton({
  href,
  children,
  variant = 'gold',
}: {
  href: string;
  children: React.ReactNode;
  variant?: 'gold' | 'outline' | 'ghost';
}) {
  const base =
    'group relative inline-flex items-center gap-3 px-8 py-4 text-xs font-semibold tracking-[0.15em] uppercase overflow-hidden transition-all duration-500';

  const styles = {
    gold:
      base +
      ' bg-[accent] text-[#0c0c0c] hover:shadow-[0_0_30px_rgba(196,168,130,0.4)]',
    outline:
      base +
      ' border border-white/20 text-white/80 hover:border-[accent]/50 hover:text-white hover:bg-white/[0.03]',
    ghost:
      base +
      ' border border-[accent]/30 text-[accent] hover:border-[accent]/60 hover:bg-[accent]/5',
  };

  return (
    <Link href={href} className={styles[variant]}>
      <span
        className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-500"
        style={{
          backgroundImage:
            'repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(255,255,255,0.1) 2px, rgba(255,255,255,0.1) 4px)',
        }}
      />
      <span className="absolute inset-0 border border-dashed border-white/0 group-hover:border-white/20 transition-all duration-500" />
      <span className="relative z-10 flex items-center gap-3">{children}</span>
    </Link>
  );
}

export default function Hero() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  return (
    <section className="relative min-h-screen bg-[#050505] overflow-hidden flex items-center justify-center">
      {/* 3D CLOTHES PILE SCENE */}
      <div className="absolute inset-0 z-0">
        {!prefersReducedMotion && <FallingClothes3D />}
        {prefersReducedMotion && (
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage:
                'url(https://images.unsplash.com/photo-1558618666-fcd25c85f82e?q=80&w=2070&auto=format&fit=crop)',
            }}
          />
        )}
      </div>

      {/* CINEMATIC OVERLAYS */}
      <div
        className="absolute inset-0 z-10 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 70% 60% at 50% 40%, transparent 30%, rgba(5,5,5,0.8) 70%, #050505 95%)',
          animation: 'vignette-pulse 8s ease-in-out infinite',
        }}
      />
      <div className="absolute inset-x-0 top-0 h-[40%] bg-gradient-to-b from-[#050505] to-transparent z-10 pointer-events-none" />
      <div className="absolute inset-x-0 bottom-0 h-[30%] bg-gradient-to-t from-[#050505] to-transparent z-10 pointer-events-none" />
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] z-10 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at center, rgba(196,168,130,0.08) 0%, transparent 60%)',
          filter: 'blur(80px)',
        }}
      />

      {/* MAIN CONTENT */}
      <div className="relative z-20 flex flex-col items-center justify-center px-6 text-center max-w-6xl mx-auto">
        {/* Tagline badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="mb-8"
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 border border-[accent]/30 rounded-full bg-black/30 backdrop-blur-sm">
            <Sparkles className="w-3 h-3 text-[accent]" />
            <span className="text-[10px] uppercase tracking-[0.3em] text-[accent] font-mono">
              South Africa&apos;s Smartest Resale Platform
            </span>
          </span>
        </motion.div>

        {/* KINETIC TYPOGRAPHY */}
        <div className="mb-4" style={{ perspective: '1000px' }}>
          <h1 className="text-[18vw] sm:text-[16vw] md:text-[14vw] leading-[0.85] font-black text-white tracking-tighter mix-blend-overlay opacity-90 select-none">
            <KineticWord text="THRIFT" />
          </h1>
        </div>

        <div className="mb-6 -mt-[2vw]" style={{ perspective: '1000px' }}>
          <h1
            className="text-[14vw] sm:text-[12vw] md:text-[10vw] leading-[0.9] font-black tracking-tighter select-none"
            style={{
              background:
                'linear-gradient(135deg, accent 0%, #e6d5b8 25%, accent 50%, #d4b896 75%, accent 100%)',
              backgroundSize: '200% auto',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              animation: 'gold-shimmer 4s linear infinite',
            }}
          >
            <KineticWord text="LIST" />
          </h1>
        </div>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1.8 }}
          className="text-sm sm:text-base text-white/50 max-w-lg leading-relaxed font-light tracking-wide mb-10"
        >
          Transform your wardrobe into profit. AI-powered listing automation
          that posts to 6 marketplaces in seconds — while you focus on sourcing.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 2.1 }}
          className="flex flex-col sm:flex-row gap-3 mb-10"
        >
          <FabricButton href="/dashboard" variant="gold">
            Start Selling Free
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </FabricButton>

          <FabricButton href="/items/new" variant="outline">
            <Sparkles className="w-4 h-4" />
            Create Listing
          </FabricButton>

          <FabricButton href="#features" variant="ghost">
            <Play className="w-4 h-4" />
            See How It Works
          </FabricButton>
        </motion.div>

        {/* TRUST BADGES */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 2.5 }}
          className="flex items-center gap-5 flex-wrap justify-center"
        >
          <div className="flex items-center gap-1.5">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-3 h-3 text-[accent] fill-[accent]" />
            ))}
            <span className="text-[10px] uppercase tracking-widest text-white/40 ml-1">
              4.9/5
            </span>
          </div>
          <div className="w-px h-4 bg-white/10" />
          <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-white/40">
            <Users className="w-3 h-3" />
            <span>500+ Resellers</span>
          </div>
          <div className="w-px h-4 bg-white/10" />
          <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-white/40">
            <TrendingUp className="w-3 h-3" />
            <span>50K+ Items</span>
          </div>
        </motion.div>
      </div>

      {/* BOTTOM SCROLL INDICATOR */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 3 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-3"
      >
        <span className="text-[9px] uppercase tracking-widest text-white/20 font-mono">
          Scroll
        </span>
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-[1px] h-10 bg-gradient-to-b from-white/30 to-transparent"
        />
      </motion.div>
    </section>
  );
}