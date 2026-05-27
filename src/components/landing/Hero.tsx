'use client';

import React, { useRef, useEffect, useState, useMemo } from 'react';
import { motion, useScroll, useTransform, useSpring, useInView } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Play, Sparkles, Layers, Zap, BarChart3 } from 'lucide-react';

export default function Hero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    
    const handleChange = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);
  
  const { scrollY, scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start'],
  });

   const smoothScrollY = useSpring(scrollY, { stiffness: 100, damping: 30 });
    
   const y1 = useTransform(smoothScrollY, [0, 500], prefersReducedMotion ? [0, 0] : [0, 150]);
   const scale = useTransform(smoothScrollY, [0, 400], prefersReducedMotion ? [1, 1] : [1, 1.3]);
   const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
   const rotation = useTransform(scrollYProgress, [0, 1], prefersReducedMotion ? [0, 0] : [0, 15]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 20;
      const y = (e.clientY / window.innerHeight - 0.5) * 20;
      setMousePosition({ x, y });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div ref={containerRef} className="relative min-h-[250vh] bg-black overflow-hidden">
      {/* Fixed Hero Container */}
      <div className="fixed inset-0 will-change-transform">
        
        {/* Cinematic Background Layers */}
        <motion.div 
          className="absolute inset-0"
          style={{ 
            y: y1,
            rotate: rotation,
            scale 
          }}
        >
{/* Video/Image Layer */}
              <div className="absolute inset-0">
                <Image
                  src="https://images.unsplash.com/photo-1558618666-fcd25c85f82e?q=80&w=2070&auto=format&fit=crop"
                  alt="Professional fashion photography of luxury clothing items arranged for resale"
                  fill
                  sizes="100vw"
                  className={`w-full h-full object-cover transition-opacity duration-1500 ${videoLoaded ? 'opacity-60' : 'opacity-0'}`}
                  onLoad={() => setVideoLoaded(true)}
                />
               
               {/* Multiple gradient overlays for depth */}
               <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
               <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black/80" />
               <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-black/60" />
             </div>

          {/* Animated Light Rays */}
          <motion.div 
            className="absolute inset-0 opacity-20"
            style={{
              background: `conic-gradient(from ${mousePosition.x + 45}deg at 50% 50%, transparent 0deg, rgba(212,175,55,0.3) 10deg, transparent 20deg)`,
              filter: 'blur(60px)',
            }}
            animate={{
              background: [
                `conic-gradient(from 45deg at 50% 50%, transparent 0deg, rgba(212,175,55,0.3) 10deg, transparent 20deg)`,
                `conic-gradient(from 135deg at 50% 50%, transparent 0deg, rgba(212,175,55,0.3) 10deg, transparent 20deg)`,
                `conic-gradient(from 225deg at 50% 50%, transparent 0deg, rgba(212,175,55,0.3) 10deg, transparent 20deg)`,
                `conic-gradient(from 315deg at 50% 50%, transparent 0deg, rgba(212,175,55,0.3) 10deg, transparent 20deg)`,
                `conic-gradient(from 405deg at 50% 50%, transparent 0deg, rgba(212,175,55,0.3) 10deg, transparent 20deg)`,
              ]
            }}
            transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
          />

          {/* Fog/Mist Layer */}
          <motion.div 
            className="absolute inset-0"
            style={{
              background: `url("data:image/svg+xml,%3Csvg viewBox='0 0 800 800' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='f'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.015' numOctaves='3' seed='5'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23f)'/%3E%3C/svg%3E")`,
              opacity: 0.08,
            }}
          />
        </motion.div>

        {/* Floating Particles */}
        {!prefersReducedMotion && useMemo(() => {
          // Generate all random values once to avoid impure function calls during render
          const randomValues = [];
          for (let i = 0; i < 20; i++) {
            randomValues.push({
              left: Math.random() * 100,
              top: Math.random() * 100,
              duration: 3 + Math.random() * 4,
              delay: Math.random() * 2,
            });
          }
          return randomValues;
        }, []).map((randomValues, i) => {
          const { left, top, duration, delay } = randomValues;
          
          return (
            <motion.div
              key={i}
              className="absolute w-[1px] h-[1px] rounded-full"
              style={{
                left: `${left}%`,
                top: `${top}%`,
                background: i % 2 === 0 ? '#d4af37' : '#ffffff',
              }}
              animate={{
                y: [0, -100, 0],
                opacity: [0, 1, 0],
                scale: [1, 2, 1],
              }}
              transition={{
                duration: duration,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: delay,
              }}
            />
          );
        })}

        {/* MAIN CONTENT */}
        <motion.div 
          style={{ opacity }}
          className="relative z-10 h-screen flex flex-col items-center justify-center px-6"
        >
          {/* Tagline */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="text-center mb-6"
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 border border-[#d4af37]/30 rounded-full">
              <Sparkles className="w-3 h-3 text-[#d4af37]" />
              <span className="text-[10px] uppercase tracking-[0.3em] text-[#d4af37] font-mono">
                Automating Resale Excellence
              </span>
            </span>
          </motion.div>

          {/* Main Title Lines */}
          <div className="text-center max-w-5xl">
            <motion.div 
              initial={{ clipPath: 'inset(0 100% 0 0)' }}
              animate={{ clipPath: 'inset(0 0% 0 0)' }}
              transition={{ duration: 1.5, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden"
            >
              <h1 className="text-[13vw] leading-[0.85] font-black text-white font-serif tracking-tighter mix-blend-overlay">
                SELL
              </h1>
            </motion.div>
            
            <motion.div 
              initial={{ clipPath: 'inset(0 100% 0 0)' }}
              animate={{ clipPath: 'inset(0 0% 0 0)' }}
              transition={{ duration: 1.5, delay: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden"
            >
              <h1 className="text-[13vw] leading-[0.85] font-black font-serif tracking-tighter mix-blend-overlay">
                <span className="bg-gradient-to-r from-[#d4af37] via-[#e6c388] to-[#d4af37] bg-clip-text text-transparent">
                  SMARTER
                </span>
              </h1>
            </motion.div>

            <motion.div 
              initial={{ clipPath: 'inset(0 100% 0 0)' }}
              animate={{ clipPath: 'inset(0 0% 0 0)' }}
              transition={{ duration: 1.5, delay: 0.9, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden"
            >
              <h1 className="text-[8vw] leading-[0.85] font-light text-white/60 font-serif tracking-tight">
                not harder.
              </h1>
            </motion.div>
          </div>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.4 }}
            className="text-white/50 text-sm sm:text-base mt-8 max-w-md text-center font-light leading-relaxed"
          >
            Transform your wardrobe into profit with intelligent listing automation reaching South Africa's premier marketplaces in seconds.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.7 }}
            className="flex flex-col sm:flex-row gap-4 mt-12"
          >
            <Link
              href="/dashboard"
              className="group relative px-10 py-5 bg-[#d4af37] text-black font-semibold tracking-[0.1em] text-sm overflow-hidden"
            >
              <span className="relative z-10 flex items-center gap-3">
                ENTER PLATFORM
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </span>
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-[#e6c388] to-[#d4af37]"
                initial={{ x: '-100%' }}
                whileHover={{ x: 0 }}
                transition={{ duration: 0.3 }}
              />
            </Link>
            
            <button className="group px-10 py-5 border border-white/20 text-white font-light tracking-[0.1em] text-sm hover:border-white/40 hover:bg-white/5 transition-all duration-500 flex items-center gap-3">
              <Play className="w-4 h-4" />
              VIEW DEMO
            </button>
          </motion.div>

          {/* Stats Row */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 2 }}
            className="absolute bottom-24 left-1/2 -translate-x-1/2 flex gap-12"
          >
            {[
              { value: '6', label: 'Platforms' },
              { value: '10s', label: 'Per Listing' },
              { value: '∞', label: 'Reach' },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <motion.div 
                  className="text-2xl font-light text-[#d4af37] font-serif"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 2, delay: i * 0.3, repeat: Infinity }}
                >
                  {stat.value}
                </motion.div>
                <div className="text-[10px] uppercase tracking-widest text-white/30 mt-1">{stat.label}</div>
              </div>
            ))}
          </motion.div>

          {/* Scroll Indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2.5 }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3"
          >
            <span className="text-[9px] uppercase tracking-widest text-white/20">Explore</span>
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-[1px] h-12 bg-gradient-to-b from-white/30 to-transparent"
            />
          </motion.div>
        </motion.div>
      </div>

      {/* Scroll Sections */}
      <FeatureSection 
        title="ONE UPLOAD"
        subtitle="Limitless Distribution"
        description="Capture once. Our intelligent system Optimizes imagery and seamlessly distributes across Yaga, Facebook Marketplace, Gumtree, OLX, Junk Mail, and WhatsApp Groups simultaneously."
        align="left"
        index={0}
      />
      
      <FeatureSection 
        title="INTELLIGENT AUTOMATION"
        subtitle="Precision Engineering"
        description="Playwright-powered browser automation completes every form field with surgical accuracy. Watch as your listings appear across platforms in real-time while you focus on sourcing."
        align="right"
        index={1}
      />
      
      <FeatureSection 
        title="ANALYTICS DASHBOARD"
        subtitle="Complete Intelligence"
        description="Monitor inventory valuation, posting success rates, revenue projections, and cross-platform performance metrics. Data-driven decisions for the modern reseller."
        align="center"
        index={2}
      />

      {/* Final CTA */}
      <section className="relative h-[80vh] flex items-center justify-center bg-black">
        <div className="text-center px-6">
          <motion.h2 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-5xl sm:text-7xl font-light text-white font-serif mb-6"
          >
            Begin Your{" "}
            <span className="bg-gradient-to-r from-[#d4af37] via-[#e6c388] to-[#d4af37] bg-clip-text text-transparent">
              Journey
            </span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-white/50 mb-10 max-w-md mx-auto"
          >
            Join the new generation ofelite resellers who have reclaimed their time.
          </motion.p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-3 px-12 py-5 bg-[#d4af37] text-black text-sm font-semibold tracking-[0.1em] hover:bg-[#e6c388] transition-colors"
          >
            ENTER PLATFORM
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative py-16 border-t border-white/10 bg-black">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-8 h-8 border border-[#d4af37]/30 flex items-center justify-center">
              <span className="text-[#d4af37] text-xs">TL</span>
            </div>
          </div>
          <p className="text-white/25 text-[10px] uppercase tracking-[0.2em]">
            © 2026 Thrift List. Crafted in South Africa.
          </p>
        </div>
      </footer>
    </div>
  );
}

function FeatureSection({ 
  title, 
  subtitle, 
  description, 
  align,
  index 
}: { 
  title: string; 
  subtitle: string; 
  description: string;
  align: 'left' | 'right' | 'center';
  index: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-20%' });

  const icons = [Layers, Zap, BarChart3];

  return (
    <section className="relative min-h-screen flex items-center bg-gradient-to-b from-black to-[#0a0a0a]">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-[0.02]" 
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
          backgroundSize: '40px 40px',
        }}
      />

      <motion.div 
        ref={ref}
        initial={{ opacity: 0, x: align === 'left' ? -50 : align === 'right' ? 50 : 0 }}
        animate={isInView ? { opacity: 1, x: 0 } : {}}
        transition={{ duration: 1, delay: 0.2 }}
        className={`max-w-4xl mx-auto px-6 w-full ${align === 'left' ? 'ml-auto' : align === 'right' ? 'mr-auto text-right' : 'text-center'}`}
      >
        {/* Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={isInView ? { scale: 1 } : {}}
          transition={{ delay: 0.4, type: 'spring' }}
          className="w-20 h-20 rounded-full border border-[#d4af37]/30 flex items-center justify-center mb-8 mx-auto"
        >
          {React.createElement(icons[index], { className: 'w-8 h-8 text-[#d4af37]' })}
        </motion.div>

        {/* Number */}
        <motion.span
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 0.3 }}
          className="text-[10px] uppercase tracking-[0.4em] text-[#d4af37] block mb-4 font-mono"
        >
          0{index + 1}
        </motion.span>

        {/* Titles */}
        <h2 className="text-5xl sm:text-7xl font-black text-white font-serif mb-2 tracking-tight">
          {title}
        </h2>
        <p className="text-xl text-[#d4af37] font-light tracking-wider mb-6">
          {subtitle}
        </p>

        {/* Description */}
        <p className="text-white/50 text-base max-w-md mx-auto leading-relaxed">
          {description}
        </p>

        {/* Decor lines */}
        <motion.div 
          initial={{ scaleX: 0 }}
          animate={isInView ? { scaleX: 1 } : {}}
          transition={{ delay: 0.6, duration: 0.8 }}
          className="w-24 h-px bg-gradient-to-r from-[#d4af37] via-[#d4af37]/50 to-transparent mt-10 mx-auto"
        />
      </motion.div>
    </section>
  );
}