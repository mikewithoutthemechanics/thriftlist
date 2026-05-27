'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ReactNode, useEffect, useState } from 'react';

interface AnimatedCardProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  hover?: boolean;
  glass?: boolean;
}

export default function AnimatedCard({ children, className, delay = 0, hover = true, glass = false }: AnimatedCardProps) {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    
    const handleChange = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return (
    <motion.div
      initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={prefersReducedMotion ? { duration: 0.01 } : { duration: 0.5, delay, ease: 'easeOut' }}
      whileHover={prefersReducedMotion || !hover ? undefined : { y: -4, scale: 1.01, transition: { duration: 0.2 } }}
      className={cn(
        'rounded-2xl border border-white/10 shadow-xl',
        glass
          ? 'bg-white/5 backdrop-blur-xl backdrop-saturate-150'
          : 'bg-white/80 dark:bg-zinc-900/80',
        className
      )}
    >
      {children}
    </motion.div>
  );
}
