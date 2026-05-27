'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Upload, Globe, BarChart3, Zap, Shield, Clock, Layers, Sparkles } from 'lucide-react';

const features = [
  {
    icon: Upload,
    title: 'Single Upload',
    description: 'Photograph once. Our system intelligently optimizes and distributes across all platforms automatically.',
  },
  {
    icon: Globe,
    title: 'Multi-Channel Reach',
    description: 'Yaga, Facebook Marketplace, Gumtree, OLX, Junk Mail & WhatsApp Groups — simultaneous presence, maximum exposure.',
  },
  {
    icon: Zap,
    title: 'Intelligent Automation',
    description: 'Playwright-driven precision. Forms completed accurately, listings published reliably while you focus on sourcing.',
  },
  {
    icon: Layers,
    title: 'Template Library',
    description: 'Curated templates for consistent branding. Customize once, apply infinitely across your entire inventory.',
  },
  {
    icon: BarChart3,
    title: 'Analytics Dashboard',
    description: 'Real-time insights into inventory valuation, posting performance, and sales trajectory metrics.',
  },
  {
    icon: Shield,
    title: 'Vault-Level Security',
    description: 'Enterprise-grade encryption via Supabase. Your credentials remain exclusively yours, always.',
  },
];

function FeatureCard({ feature, index }: { feature: typeof features[0]; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.8, delay: index * 0.12, ease: [0.22, 1, 0.36, 1] }}
      className="group relative"
    >
      <div className="absolute top-0 left-0 w-8 h-8 border-l border-t border-[#d4af37]/20 group-hover:border-[#d4af37]/60 transition-colors duration-500" />
      <div className="absolute bottom-0 right-0 w-8 h-8 border-r border-b border-[#d4af37]/20 group-hover:border-[#d4af37]/60 transition-colors duration-500" />
      
      <div className="h-full p-10 ml-4 mr-4 mt-4 mb-4 rounded-xl bg-[#0f0e0c]/80 border border-[#2d251e] group-hover:border-[#d4af37]/30 transition-all duration-500 backdrop-blur-sm">
        <div className="w-12 h-12 rounded-lg bg-[#d4af37]/5 border border-[#d4af37]/10 flex items-center justify-center mb-6 group-hover:bg-[#d4af37]/10 group-hover:border-[#d4af37]/30 transition-all duration-500">
          <feature.icon className="w-5 h-5 text-[#d4af37]/60 group-hover:text-[#d4af37] transition-colors duration-500" />
        </div>
        <h3 className="text-lg font-light text-white mb-3 tracking-wide font-serif">
          {feature.title}
        </h3>
        <p className="text-sm text-white/50 leading-relaxed font-light">
          {feature.description}
        </p>
      </div>
    </motion.div>
  );
}

export default function Features() {
  const headerRef = useRef<HTMLDivElement>(null);
  const isHeaderInView = useInView(headerRef, { once: true, margin: '-120px' });

  return (
    <section className="relative py-32 sm:py-44 px-6 bg-[#0a0a0a] art-deco-pattern">
      {/* Horizontal decorative lines */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#d4af37]/10 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#d4af37]/10 to-transparent" />
      
      <div className="max-w-5xl mx-auto">
        <motion.div
          ref={headerRef}
          initial={{ opacity: 0, y: 50 }}
          animate={isHeaderInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          className="mb-20 text-center"
        >
          <motion.span 
            initial={{ opacity: 0 }}
            animate={isHeaderInView ? { opacity: 1 } : {}}
            transition={{ delay: 0.3 }}
            className="inline-flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.4em] text-[#d4af37] mb-6 font-mono"
          >
            <Sparkles className="w-3 h-3" />
            Capabilities
          </motion.span>
          
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-light text-white tracking-tight leading-[1.1] font-serif">
            Engineered for{" "}
            <span className="gradient-text">Excellence.</span>
          </h2>
          
          <motion.p
            initial={{ opacity: 0 }}
            animate={isHeaderInView ? { opacity: 1 } : {}}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="text-base text-white/50 max-w-md mx-auto mt-6 leading-relaxed"
          >
            Every feature thoughtfully crafted to amplify your reselling business.
          </motion.p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <FeatureCard key={feature.title} feature={feature} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}