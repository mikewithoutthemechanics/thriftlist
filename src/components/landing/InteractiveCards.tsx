'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Camera, Tag, Shirt } from 'lucide-react';

const cards = [
  {
    icon: Camera,
    title: 'Photo Upload',
    description: 'Drag & drop photos. Auto-optimized for each platform.',
  },
  {
    icon: Tag,
    title: 'Smart Pricing',
    description: 'Set your price once. We handle currency per marketplace.',
  },
  {
    icon: Shirt,
    title: 'Size & Condition',
    description: 'Standardized options. No more manual re-entry.',
  },
];

function Card({ card, index }: { card: typeof cards[0]; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay: index * 0.12, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="h-full p-8 rounded-[22px] bg-[#111111]/80 border border-white/[0.04] hover:bg-[#151515]/90 hover:border-white/[0.08] hover:shadow-xl hover:shadow-black/30 hover:-translate-y-1 transition-all duration-500 backdrop-blur-sm">
        <div className="w-10 h-10 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center mb-6 group-hover:shadow-md group-hover:shadow-accent/10 transition-all">
          <card.icon className="w-4 h-4 text-accent" />
        </div>
        <h3 className="text-base font-bold text-white mb-3 tracking-tight">{card.title}</h3>
        <p className="text-sm text-white/40 leading-relaxed">{card.description}</p>
      </div>
    </motion.div>
  );
}

export default function InteractiveCards() {
  const headerRef = useRef<HTMLDivElement>(null);
  const isHeaderInView = useInView(headerRef, { once: true, margin: '-100px' });

  return (
    <section className="relative py-28 sm:py-36 px-6 bg-[#0c0c0c]">
      <div className="max-w-5xl mx-auto">
        <motion.div
          ref={headerRef}
          initial={{ opacity: 0, y: 40 }}
          animate={isHeaderInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="mb-16"
        >
          <span className="text-[11px] font-semibold uppercase tracking-[0.3em] text-accent mb-4 block">
            Experience
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight leading-tight max-w-lg">
            Thoughtfully designed{" "}
            <span className="text-accent">for you.</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {cards.map((card, i) => (
            <Card key={card.title} card={card} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
