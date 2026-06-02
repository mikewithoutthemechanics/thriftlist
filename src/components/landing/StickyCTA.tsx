'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, X, Zap } from 'lucide-react';
import Link from 'next/link';

export default function StickyCTA() {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const heroHeight = window.innerHeight;
      // Show after scrolling past hero
      setVisible(scrollY > heroHeight * 0.8 && !dismissed);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [dismissed]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:w-auto z-50 bg-[#0c0c0c]/90 backdrop-blur-2xl border border-accent/20 rounded-2xl shadow-2xl shadow-black/40"
        >
          <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-4">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center flex-shrink-0 shadow-sm shadow-accent/10">
                <Zap className="w-4 h-4 text-accent" />
              </div>
              <div className="min-w-0">
                <p className="text-sm text-white font-medium truncate">Ready to scale your resale business?</p>
                <p className="text-xs text-white/40 hidden sm:block">Join 500+ resellers saving hours every day.</p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-accent text-[#0c0c0c] rounded-xl text-xs font-bold tracking-wider hover:bg-accent transition-all hover:shadow-lg hover:shadow-accent/20 hover:-translate-y-0.5"
              >
                Get Started Free
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <button
                onClick={() => setDismissed(true)}
                className="p-2 text-white/30 hover:text-white/60 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
