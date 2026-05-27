'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { motion, useInView } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

export default function CTASection() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-120px' });

  return (
    <section ref={ref} className="relative py-32 sm:py-44 px-6 bg-[#0c0c0a]">
      {/* Art Deco frame */}
      <div className="absolute top-8 left-8 right-8 bottom-8 border border-[#d4af37]/10 rounded-sm pointer-events-none" />
      
      <div className="max-w-3xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          className="mb-12"
        >
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-light text-white tracking-tight leading-[1.1] font-serif mb-8">
            Begin Your{" "}
            <span className="gradient-text">Journey.</span>
          </h2>
          <p className="text-base text-white/50 max-w-md mx-auto leading-relaxed">
            Join discerning resellers who reclaim their time while amplifying 
            their market reach across South Africa.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col sm:flex-row gap-5 justify-center items-center"
        >
          <Link
            href="/dashboard"
            className="metallic-btn group px-10 py-4 text-sm tracking-[0.08em] rounded-sm inline-flex items-center gap-3"
          >
            Enter Dashboard
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
          </Link>
          <Link
            href="/login"
            className="px-10 py-4 border border-white/20 text-white/60 text-sm tracking-[0.08em] rounded-sm hover:border-[#d4af37]/50 hover:text-white hover:bg-white/[0.02] transition-all duration-300"
          >
            Resume Session
          </Link>
        </motion.div>
 
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 0.6, duration: 0.8 }}
          className="flex items-center justify-center gap-6 mt-10"
        >
          <span className="luxury-divider w-16" />
          <span className="text-[10px] uppercase tracking-widest text-white/30 font-mono">
            Complimentary Access
          </span>
          <span className="luxury-divider w-16" />
        </motion.div>
      </div>
    </section>
  );
}