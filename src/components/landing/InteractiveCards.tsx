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
      className="cursor-pointer"
    >
      <div className="h-full p-8 rounded-[22px] bg-white border border-border hover:border-accent/30 hover:shadow-lg transition-all duration-300">
        <div className="w-10 h-10 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center mb-6 transition-all">
          <card.icon className="w-4 h-4 text-accent" />
        </div>
        <h3 className="text-base font-bold text-foreground mb-3 tracking-tight">{card.title}</h3>
        <p className="text-sm text-foreground/40 leading-relaxed">{card.description}</p>
      </div>
    </motion.div>
  );
}

export default function InteractiveCards() {
  const headerRef = useRef<HTMLDivElement>(null);
  const isHeaderInView = useInView(headerRef, { once: true, margin: '-100px' });

  return (
    <section className="relative py-28 sm:py-36 px-6 bg-background">
      <div className="max-w-5xl mx-auto">
        <motion.div
          ref={headerRef}
          initial={{ opacity: 0, y: 40 }}
          animate={isHeaderInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="mb-16"
        >
          <span className="text-[11px] font-bold uppercase tracking-[0.3em] text-primary mb-4 block">
            Experience
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground tracking-tight leading-tight max-w-lg">
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
