'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Star, Quote, TrendingUp, Package, Clock } from 'lucide-react';

const testimonials = [
  {
    name: 'Thandi M.',
    role: 'Full-time Reseller, Cape Town',
    quote: 'I went from spending 3 hours per day listing items to under 20 minutes. ThriftList pays for itself in the first week.',
    rating: 5,
    metric: '3x faster',
  },
  {
    name: 'Jordan K.',
    role: 'Vintage Collector, Johannesburg',
    quote: 'The AI-generated descriptions are better than what I was writing manually. My items sell 40% faster now.',
    rating: 5,
    metric: '40% faster sales',
  },
  {
    name: 'Sipho N.',
    role: 'Thrift Shop Owner, Durban',
    quote: 'Being on 6 platforms simultaneously changed everything. We hit our monthly revenue target in 10 days.',
    rating: 5,
    metric: '3x revenue',
  },
];

const metrics = [
  { icon: Package, value: '50,000+', label: 'Items Listed' },
  { icon: Clock, value: '10 sec', label: 'Per Listing' },
  { icon: TrendingUp, value: '87%', label: 'Sell-Through Rate' },
];

export default function SocialProof() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section className="relative py-32 sm:py-44 px-6 bg-[#080806]">
      {/* Decorative top line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[accent]/10 to-transparent" />

      <div className="max-w-5xl mx-auto" ref={ref}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-16"
        >
          <span className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[accent] mb-4 block">
            Social Proof
          </span>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-light text-white tracking-tight leading-[1.1] font-serif">
            Trusted by{" "}
            <span className="gradient-text">serious resellers.</span>
          </h2>
        </motion.div>

        {/* Metrics Row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="grid grid-cols-3 gap-4 mb-16"
        >
          {metrics.map((metric, i) => (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={isInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.5, delay: 0.3 + i * 0.1 }}
              className="text-center p-6 rounded-[22px] bg-[#111111]/80 border border-white/[0.04] hover:border-[accent]/15 hover:shadow-lg hover:shadow-black/30 hover:-translate-y-1 transition-all duration-500 backdrop-blur-sm"
            >
              <metric.icon className="w-5 h-5 text-[accent] mx-auto mb-3" />
              <div className="text-2xl font-bold text-white font-serif">{metric.value}</div>
              <div className="text-[10px] font-semibold uppercase tracking-widest text-white/40 mt-1">{metric.label}</div>
            </motion.div>
          ))}
        </motion.div>

        {/* Testimonials */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7, delay: 0.4 + i * 0.12, ease: [0.22, 1, 0.36, 1] }}
              className="group relative"
            >
              <div className="h-full p-8 rounded-[22px] bg-[#111111]/80 border border-white/[0.04] hover:border-[accent]/20 hover:shadow-xl hover:shadow-black/30 hover:-translate-y-1 transition-all duration-500 backdrop-blur-sm">
                {/* Quote icon */}
                <Quote className="w-6 h-6 text-[accent]/20 mb-4" />

                {/* Quote text */}
                <p className="text-sm text-white/60 leading-relaxed mb-6">
                  &ldquo;{t.quote}&rdquo;
                </p>

                {/* Rating */}
                <div className="flex gap-0.5 mb-4">
                  {[...Array(t.rating)].map((_, j) => (
                    <Star key={j} className="w-3 h-3 text-[accent] fill-[accent]" />
                  ))}
                </div>

                {/* Author */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-white">{t.name}</p>
                    <p className="text-xs text-white/40">{t.role}</p>
                  </div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400 bg-emerald-400/10 px-3 py-1 rounded-full shadow-sm shadow-emerald-400/10">
                    {t.metric}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
