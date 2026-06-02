'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { motion, useInView } from 'framer-motion';
import { ArrowRight, Sparkles, Shield, Clock } from 'lucide-react';

export default function CTASection() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-120px' });

  return (
    <section ref={ref} className="relative py-32 sm:py-44 px-6 bg-[#0c0c0a]">
      {/* Art Deco frame */}
      <div className="absolute top-8 left-8 right-8 bottom-8 border border-accent/10 rounded-3xl pointer-events-none" />

      <div className="max-w-3xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          className="mb-12"
        >
          <div className="flex items-center justify-center gap-3 mb-8 flex-wrap">
            <span className="inline-flex items-center gap-2 px-4 py-2 border border-accent/30 rounded-full">
              <Sparkles className="w-3 h-3 text-accent" />
              <span className="text-[10px] uppercase tracking-[0.3em] text-accent font-mono">
                No Credit Card Required
              </span>
            </span>
            <span className="inline-flex items-center gap-2 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-full">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
              </span>
              <span className="text-[10px] uppercase tracking-[0.2em] text-red-400 font-mono">
                127 spots left this month
              </span>
            </span>
          </div>

          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-light text-white tracking-tight leading-[1.1] font-serif mb-8">
            Start Selling{" "}
            <span className="gradient-text">Smarter Today.</span>
          </h2>
          <p className="text-base text-white/50 max-w-md mx-auto leading-relaxed">
            Join 500+ resellers who save hours every day. Get your first listing live
            across 6 platforms in under 60 seconds.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center"
        >
          <Link
            href="/dashboard"
            className="metallic-btn group px-10 py-4 text-sm tracking-[0.08em] rounded-2xl inline-flex items-center gap-3 shadow-lg shadow-accent/10 hover:shadow-xl hover:shadow-accent/20 hover:-translate-y-0.5 transition-all"
          >
            Start Free Now
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
          </Link>
          <Link
            href="/items/new"
            className="group px-10 py-4 border border-white/20 text-white/60 text-sm tracking-[0.08em] rounded-2xl hover:border-accent/50 hover:text-white hover:bg-white/[0.02] transition-all duration-300 inline-flex items-center gap-3 hover:-translate-y-0.5 shadow-lg hover:shadow-xl shadow-black/10"
          >
            <Sparkles className="w-4 h-4" />
            Create First Listing
          </Link>
        </motion.div>

        {/* Trust signals */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 0.6, duration: 0.8 }}
          className="flex items-center justify-center gap-6 mt-10 flex-wrap"
        >
          <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-white/30">
            <Shield className="w-3 h-3 text-emerald-400" />
            <span>Secure & Encrypted</span>
          </div>
          <div className="w-px h-4 bg-white/10 hidden sm:block" />
          <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-white/30">
            <Clock className="w-3 h-3 text-accent" />
            <span>Setup in 2 Minutes</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 0.8, duration: 0.8 }}
          className="flex items-center justify-center gap-6 mt-6"
        >
          <span className="luxury-divider w-16" />
          <span className="text-[10px] uppercase tracking-widest text-white/30 font-mono">
            Free Forever Plan Available
          </span>
          <span className="luxury-divider w-16" />
        </motion.div>
      </div>
    </section>
  );
}