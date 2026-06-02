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
      className="group relative cursor-pointer"
    >
      <div className="h-full p-10 rounded-[22px] bg-white border border-border hover:border-accent/30 hover:shadow-lg transition-all duration-300">
        <div className="w-12 h-12 rounded-2xl bg-accent/5 border border-accent/10 flex items-center justify-center mb-6 group-hover:bg-accent/10 group-hover:border-accent/30 transition-all duration-300">
          <feature.icon className="w-5 h-5 text-accent/60 group-hover:text-accent transition-colors duration-300" />
        </div>
        <h3 className="text-lg font-bold text-foreground mb-3 tracking-wide">
          {feature.title}
        </h3>
        <p className="text-sm text-foreground/60 leading-relaxed">
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
    <section className="relative py-32 sm:py-44 px-6 bg-background">
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
            className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.4em] text-primary mb-6"
          >
            <Sparkles className="w-3 h-3" />
            Capabilities
          </motion.span>
          
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground tracking-tight leading-[1.1]">
            Engineered for{" "}
            <span className="text-accent">Excellence.</span>
          </h2>
          
          <motion.p
            initial={{ opacity: 0 }}
            animate={isHeaderInView ? { opacity: 1 } : {}}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="text-base text-foreground/60 max-w-md mx-auto mt-6 leading-relaxed"
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