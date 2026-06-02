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
    'group relative inline-flex items-center gap-3 px-8 py-4 text-xs font-bold tracking-[0.15em] uppercase overflow-hidden transition-all duration-500 rounded-xl cursor-pointer';

  const styles = {
    gold:
      base +
      ' bg-accent text-white hover:bg-accent/90 hover:shadow-lg',
    outline:
      base +
      ' border border-primary/30 text-primary hover:bg-primary/5',
    ghost:
      base +
      ' border border-primary/10 text-primary hover:border-primary/30 hover:bg-primary/5',
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
    <section className="relative min-h-screen bg-background overflow-hidden flex items-center justify-center">
      {/* 3D CLOTHES PILE SCENE */}
      <div className="absolute inset-0 z-0 opacity-40 mix-blend-multiply">
        {!prefersReducedMotion && <FallingClothes3D />}
        {prefersReducedMotion && (
          <div
            className="absolute inset-0 bg-cover bg-center grayscale opacity-20"
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
          background: `
            radial-gradient(circle at 20% 30%, rgba(124,58,237,0.05) 0%, transparent 50%),
            radial-gradient(circle at 80% 70%, rgba(22,163,74,0.05) 0%, transparent 50%)
          `,
        }}
      />
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] z-10 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at center, rgba(124,58,237,0.03) 0%, transparent 60%)',
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
          <span className="inline-flex items-center gap-2 px-4 py-2 border border-primary/20 rounded-full bg-primary/5">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span className="text-[10px] uppercase tracking-[0.4em] text-primary font-bold">
              AI-Driven Resale Hub
            </span>
          </span>
        </motion.div>

        {/* Headline */}
        <h1 className="flex flex-col mb-10">
          <KineticWord
            text="THRIFT"
            className="text-5xl sm:text-7xl lg:text-9xl font-black text-foreground tracking-tighter"
          />
          <KineticWord
            text="LIST"
            className="text-5xl sm:text-7xl lg:text-9xl font-black text-accent tracking-tighter -mt-2 sm:-mt-5"
          />
        </h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1.8 }}
          className="text-sm sm:text-base text-foreground/50 max-w-lg leading-relaxed font-bold tracking-wide mb-10"
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
            Start Selling Now
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </FabricButton>

          <FabricButton href="/items/new" variant="outline">
            <Sparkles className="w-4 h-4" />
            Quick Listing
          </FabricButton>

          <FabricButton href="#features" variant="ghost">
            <Play className="w-4 h-4" />
            How It Works
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
              <Star key={i} className="w-3 h-3 text-accent fill-accent" />
            ))}
            <span className="text-[10px] uppercase tracking-widest text-foreground/40 ml-1 font-bold">
              4.9/5
            </span>
          </div>
          <div className="w-px h-4 bg-border" />
          <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-foreground/40 font-bold">
            <Users className="w-3 h-3" />
            <span>500+ Resellers</span>
          </div>
          <div className="w-px h-4 bg-border" />
          <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-foreground/40 font-bold">
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