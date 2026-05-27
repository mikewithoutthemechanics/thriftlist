'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ExternalLink } from 'lucide-react';

const platforms = [
  { name: 'Yaga', desc: 'Fashion marketplace', active: true },
  { name: 'Facebook', desc: 'Marketplace & Groups', active: true },
  { name: 'Gumtree', desc: 'Classifieds', active: true },
  { name: 'OLX', desc: 'Buy & sell locally', active: true },
  { name: 'Junk Mail', desc: 'Free classifieds', active: true },
];

export default function MotionCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % platforms.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative py-28 sm:py-36 px-6 bg-[#111111]">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <span className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#c4a882] mb-4 block">
            Supported Platforms
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-light text-white tracking-tight leading-tight">
            Post to <span className="text-[#c4a882]">everywhere.</span>
          </h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {platforms.map((platform, i) => (
            <motion.div
              key={platform.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -4 }}
              className={`relative p-6 rounded-2xl border transition-all duration-500 ${
                i === activeIndex
                  ? 'bg-[#1a1a1a] border-[#c4a882]/30'
                  : 'bg-[#0c0c0c] border-white/[0.04] hover:border-white/[0.08]'
              }`}
            >
              <ExternalLink className={`w-5 h-5 mb-4 ${i === activeIndex ? 'text-[#c4a882]' : 'text-white/20'}`} />
              <h3 className="text-sm font-medium text-white mb-1 tracking-tight">{platform.name}</h3>
              <p className="text-xs text-white/30 font-light">{platform.desc}</p>
              {i === activeIndex && (
                <motion.div
                  layoutId="activeIndicator"
                  className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-[2px] bg-[#c4a882]"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
            </motion.div>
          ))}
        </div>

        {/* Dots */}
        <div className="flex justify-center gap-2 mt-8">
          {platforms.map((_, i) => (
            <button
              key={i}
              onClick={() => setActiveIndex(i)}
              className={`w-[2px] h-8 rounded-full transition-all duration-300 ${
                i === activeIndex ? 'bg-[#c4a882]' : 'bg-white/10'
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
