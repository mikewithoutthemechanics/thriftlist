'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Camera, Sparkles, Share2, BarChart3, ArrowRight } from 'lucide-react';
import Link from 'next/link';

const steps = [
  {
    icon: Camera,
    number: '01',
    title: 'Snap & Upload',
    description: 'Photograph your items and drag them into ThriftList. Our AI auto-enhances and optimizes every image for maximum marketplace appeal.',
    color: 'accent',
  },
  {
    icon: Sparkles,
    number: '02',
    title: 'AI Optimizes',
    description: 'Groq-powered AI generates compelling titles, descriptions, and smart pricing based on real market data across all platforms.',
    color: 'accent',
  },
  {
    icon: Share2,
    number: '03',
    title: 'Publish Everywhere',
    description: 'One click distributes to Yaga, Facebook Marketplace, Gumtree, OLX, Junk Mail & WhatsApp Groups simultaneously.',
    color: 'accent',
  },
  {
    icon: BarChart3,
    number: '04',
    title: 'Track & Sell',
    description: 'Monitor analytics, manage inventory, auto-relist, and watch your resale business grow from one elegant dashboard.',
    color: 'accent',
  },
];

type Step = (typeof steps)[number];

function StepCard({ step, index }: { step: Step; index: number }) {
  const stepRef = useRef<HTMLDivElement>(null);
  const stepInView = useInView(stepRef, { once: true, margin: '-80px' });

  return (
    <motion.div
      ref={stepRef}
      initial={{ opacity: 0, y: 30 }}
      animate={stepInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay: index * 0.12, ease: [0.22, 1, 0.36, 1] }}
      className="group relative cursor-pointer"
    >
      <div className="h-full p-8 rounded-[22px] bg-white border border-border hover:border-accent/40 hover:shadow-lg transition-all duration-300">
        <div className="flex items-center justify-between mb-6">
          <span className="text-4xl font-black text-foreground/5 group-hover:text-accent/10 transition-colors">
            {step.number}
          </span>
          <div className="w-12 h-12 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center group-hover:bg-accent/15 group-hover:shadow-md transition-all">
            <step.icon className="w-5 h-5 text-accent" />
          </div>
        </div>

        <h3 className="text-lg font-bold text-foreground mb-3 tracking-tight">
          {step.title}
        </h3>
        <p className="text-sm text-foreground/60 leading-relaxed">
          {step.description}
        </p>
      </div>
    </motion.div>
  );
}

export default function HowItWorks() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section id="features" className="relative py-32 sm:py-44 px-6 bg-background">
      <div className="max-w-5xl mx-auto" ref={ref}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-20"
        >
          <span className="text-[11px] font-semibold uppercase tracking-[0.3em] text-primary mb-4 block">
            How It Works
          </span>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground tracking-tight leading-[1.1]">
            Four steps to{" "}
            <span className="text-accent">market dominance.</span>
          </h2>
          <p className="text-base text-foreground/60 max-w-md mx-auto mt-6 leading-relaxed">
            From wardrobe to worldwide buyers in under a minute.
          </p>
        </motion.div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {steps.map((step, i) => (
            <StepCard key={step.number} step={step} index={i} />
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="text-center mt-12"
        >
          <Link
            href="/items/new"
            className="group px-10 py-4 text-sm font-bold tracking-[0.08em] uppercase rounded-2xl inline-flex items-center gap-3 bg-accent text-white shadow-lg shadow-accent/20 hover:shadow-xl hover:shadow-accent/30 hover:-translate-y-0.5 transition-all duration-300 cursor-pointer"
          >
            Try It Now — Free
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
