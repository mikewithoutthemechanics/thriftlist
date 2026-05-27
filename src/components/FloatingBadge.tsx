'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface FloatingBadgeProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

export default function FloatingBadge({ children, className, delay = 0 }: FloatingBadgeProps) {
  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, delay }}
      whileHover={{ scale: 1.05 }}
      className={className}
    >
      {children}
    </motion.span>
  );
}
