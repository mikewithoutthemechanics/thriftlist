'use client';

import { motion } from 'framer-motion';

interface ShimmerTextProps {
  text: string;
  className?: string;
}

export default function ShimmerText({ text, className }: ShimmerTextProps) {
  return (
    <motion.span
      className={`relative inline-block bg-gradient-to-r from-emerald-400 via-blue-500 to-violet-500 bg-clip-text text-transparent ${className}`}
      animate={{
        backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
      }}
      transition={{
        duration: 4,
        repeat: Infinity,
        ease: 'linear',
      }}
      style={{
        backgroundSize: '200% auto',
      }}
    >
      {text}
    </motion.span>
  );
}
