'use client';

import Link from 'next/link';
import { Shirt } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative py-16 px-6 bg-background border-t border-border">
      <div className="max-w-4xl mx-auto">
        {/* Logo Section */}
        <div className="flex flex-col items-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="flex items-center gap-3 mb-4"
          >
            <div className="w-10 h-10 border border-primary/30 flex items-center justify-center bg-primary/5 rounded-lg">
              <Shirt className="w-5 h-5 text-primary" />
            </div>
            <span className="text-xl font-bold text-foreground tracking-wide">
              Thrift List
            </span>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            viewport={{ once: true }}
            className="h-px w-12 bg-gradient-to-r from-transparent via-primary/50 to-transparent"
          />
        </div>

        {/* Navigation Links */}
        <div className="flex flex-wrap justify-center gap-8 mb-10">
          {[
            { href: '/dashboard', label: 'Dashboard' },
            { href: '/items', label: 'Inventory' },
            { href: '/settings', label: 'Configuration' },
            { href: '/analytics', label: 'Analytics' },
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-xs uppercase font-bold tracking-[0.15em] text-foreground/40 hover:text-primary transition-colors duration-300 cursor-pointer"
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Decorative divider */}
        <div className="flex items-center justify-center gap-4 mb-8">
          <div className="w-8 h-px bg-primary/20" />
          <div className="w-1 h-1 rotate-45 bg-primary/40" />
          <div className="w-8 h-px bg-primary/20" />
        </div>

        {/* Copyright */}
        <p className="text-center text-[10px] uppercase tracking-[0.2em] text-foreground/25 font-bold">
          <span className="text-primary/60">©</span> {currentYear} Thrift List. Crafted in South Africa.
        </p>
      </div>
    </footer>
  );
}