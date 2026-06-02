'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { XCircle, CheckCircle, Clock, AlertTriangle, Zap } from 'lucide-react';

const painPoints = [
  { icon: Clock, text: 'Spending 3+ hours daily copying listings across platforms' },
  { icon: AlertTriangle, text: 'Inconsistent descriptions hurting your brand trust' },
  { icon: XCircle, text: 'Missing platforms = missing buyers and lost revenue' },
];

const solutions = [
  { icon: Zap, text: 'One photograph auto-distributes to 6 marketplaces in 10 seconds' },
  { icon: CheckCircle, text: 'AI-generated descriptions that convert 40% faster' },
  { icon: CheckCircle, text: 'Simultaneous presence everywhere your buyers shop' },
];

export default function ProblemSolution() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section ref={ref} className="relative py-32 sm:py-44 px-6 bg-[#050505] overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at center, rgba(34,197,94,0.03) 0%, transparent 70%)', filter: 'blur(60px)' }}
      />

      <div className="max-w-5xl mx-auto relative">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-20"
        >
          <span className="text-[11px] font-semibold uppercase tracking-[0.3em] text-accent mb-4 block">
            The Problem
          </span>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white tracking-tight leading-[1.1] font-serif">
            Reselling should not be a full-time job.
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-20">
          {/* Pain Points */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="p-8 rounded-[22px] bg-[#111111]/80 border border-white/[0.04] shadow-xl shadow-black/20 backdrop-blur-sm"
          >
            <h3 className="text-lg font-medium text-white/40 mb-6 uppercase tracking-wider text-xs">
              Without ThriftList
            </h3>
            <div className="space-y-5">
              {painPoints.map((point, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={isInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.5, delay: 0.3 + i * 0.1 }}
                  className="flex items-start gap-4"
                >
                  <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <point.icon className="w-4 h-4 text-red-400" />
                  </div>
                  <p className="text-sm text-white/50 leading-relaxed">{point.text}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Solutions */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="p-8 rounded-[22px] bg-[#111111]/80 border border-accent/10 relative shadow-xl shadow-black/20 backdrop-blur-sm"
          >
            <div className="absolute -top-px left-8 right-8 h-px bg-gradient-to-r from-transparent via-accent/40 to-transparent" />
            <h3 className="text-lg font-medium text-accent mb-6 uppercase tracking-wider text-xs">
              With ThriftList
            </h3>
            <div className="space-y-5">
              {solutions.map((sol, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 20 }}
                  animate={isInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.5, delay: 0.5 + i * 0.1 }}
                  className="flex items-start gap-4"
                >
                  <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <sol.icon className="w-4 h-4 text-emerald-400" />
                  </div>
                  <p className="text-sm text-white/70 leading-relaxed">{sol.text}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Center transition arrow */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={isInView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="flex justify-center"
        >
          <div className="w-12 h-12 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center">
            <Zap className="w-5 h-5 text-accent" />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
