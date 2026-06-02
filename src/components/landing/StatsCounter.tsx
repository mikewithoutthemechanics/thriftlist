'use client';

import { useRef, useEffect, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { Layers, Zap, Globe, Shield } from 'lucide-react';

function AnimatedCounter({ target, suffix = '', prefix = '' }: { target: number; suffix?: string; prefix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;
    let start = 0;
    const duration = 2000;
    const increment = target / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [isInView, target]);

  return (
    <span ref={ref} className="tabular-nums">
      {prefix}{count.toLocaleString()}{suffix}
    </span>
  );
}

const stats = [
  {
    icon: Layers,
    value: 6,
    suffix: '',
    label: 'Platforms',
    description: 'One upload reaches them all',
  },
  {
    icon: Zap,
    value: 10,
    suffix: 's',
    label: 'Per Listing',
    description: 'From photo to published',
  },
  {
    icon: Globe,
    value: 500,
    suffix: '+',
    label: 'Active Resellers',
    description: 'Growing across South Africa',
  },
  {
    icon: Shield,
    value: 50,
    suffix: 'K+',
    label: 'Items Listed',
    description: 'And counting every day',
  },
];

export default function StatsCounter() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section className="relative py-24 sm:py-32 px-6 bg-background">
      <div className="max-w-5xl mx-auto" ref={ref}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              className="text-center p-8 rounded-[22px] bg-white border border-border hover:border-accent/20 hover:shadow-lg transition-all duration-300 group cursor-pointer"
            >
              <div className="w-10 h-10 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center mx-auto mb-4 group-hover:bg-accent/15 transition-all">
                <stat.icon className="w-4 h-4 text-accent" />
              </div>
              <div className="text-3xl font-bold text-foreground mb-1">
                <AnimatedCounter target={stat.value} suffix={stat.suffix} />
              </div>
              <div className="text-xs font-bold text-accent uppercase tracking-wider mb-1">{stat.label}</div>
              <div className="text-[10px] text-foreground/40">{stat.description}</div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
