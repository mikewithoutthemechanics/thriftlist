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
    <section className="relative py-28 sm:py-36 px-6 bg-background">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <span className="text-[11px] font-bold uppercase tracking-[0.3em] text-primary mb-4 block">
            Supported Platforms
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground tracking-tight leading-tight">
            Post to <span className="text-accent">everywhere.</span>
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
              className={`relative p-6 rounded-[22px] border transition-all duration-500 cursor-pointer ${
                i === activeIndex
                  ? 'bg-white border-accent/30 shadow-lg'
                  : 'bg-muted/30 border-border hover:border-accent/10 hover:shadow-md'
              }`}
            >
              <ExternalLink className={`w-5 h-5 mb-4 ${i === activeIndex ? 'text-accent' : 'text-foreground/20'}`} />
              <h3 className="text-sm font-bold text-foreground mb-1 tracking-tight">{platform.name}</h3>
              <p className="text-xs text-foreground/40">{platform.desc}</p>
              {i === activeIndex && (
                <motion.div
                  layoutId="activeIndicator"
                  className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-[3px] bg-accent rounded-full"
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
              className={`w-[2px] h-8 rounded-full transition-all duration-300 cursor-pointer ${
                i === activeIndex ? 'bg-accent' : 'bg-foreground/10'
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
