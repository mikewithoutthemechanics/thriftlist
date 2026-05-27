'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, Package, PlusCircle, Settings, Shirt, Sparkles, Send, LogOut, Menu, X, User, FileText, BarChart3, Sun, Moon } from 'lucide-react';
import { useAuth } from './AuthProvider';
import { useTheme } from '@/contexts/ThemeContext';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/items', label: 'My Items', icon: Package },
  { href: '/items/new', label: 'Add Item', icon: PlusCircle },
  { href: '/postings', label: 'Postings', icon: Send },
  { href: '/templates', label: 'Templates', icon: FileText },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const content = (
    <>
      {/* Logo Section */}
      <div data-tour="sidebar" className="p-6 flex items-center gap-3">
        <div className="w-10 h-10 border border-[#d4af37]/30 flex items-center justify-center">
          <Shirt className="w-5 h-5 text-[#d4af37]" />
        </div>
        <Link href="/dashboard" className="block">
          <h1 className="text-lg font-light text-white tracking-wide font-serif">Thrift List</h1>
          <p className="text-[10px] text-white/40 uppercase tracking-widest font-mono">Reselling Suite</p>
        </Link>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item, idx) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <motion.div 
              key={item.href} 
              initial={{ opacity: 0, x: -20 }} 
              animate={{ opacity: 1, x: 0 }} 
              transition={{ delay: 0.1 * idx, duration: 0.5 }}
            >
              <Link
                href={item.href}
                data-tour={item.href === '/items' ? 'items-link' : item.href === '/dashboard' ? 'dashboard-link' : item.href === '/analytics' ? 'analytics-link' : item.href === '/settings' ? 'settings-link' : undefined}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-sm text-sm transition-all duration-500 relative ${
                  isActive
                    ? 'text-[#d4af37]'
                    : 'text-white/50 hover:text-white hover:bg-white/[0.02]'
                }`}
              >
                {isActive && (
                  <motion.div 
                    layoutId="activeNav" 
                    className="absolute inset-0 bg-[#d4af37]/5 border-l-2 border-[#d4af37]/30" 
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }} 
                  />
                )}
                <Icon className="w-4 h-4 relative z-10" />
                <span className="relative z-10 font-light">{item.label}</span>
                {isActive && (
                  <motion.div 
                    className="absolute right-3 w-1 h-1 bg-[#d4af37]" 
                    layoutId="activeDot" 
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }} 
                  />
                )}
              </Link>
            </motion.div>
          );
        })}
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-[#d4af37]/10 space-y-4">
        {user && (
          <div className="flex items-center gap-3 px-3 py-3 border border-[#d4af37]/10 rounded-sm bg-[#d4af37]/[0.02]">
            <div className="w-8 h-8 border border-[#d4af37]/20 flex items-center justify-center">
              <User className="w-4 h-4 text-[#d4af37]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-white/60 truncate font-light">{user.email}</p>
            </div>
            <button 
              onClick={toggleTheme} 
              className="p-1.5 text-white/30 hover:text-white transition-colors" 
              title="Toggle appearance"
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            </button>
            <button 
              onClick={signOut} 
              className="p-1.5 text-white/30 hover:text-red-400 transition-colors" 
              title="Terminate session"
              aria-label="Sign out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
        
        {/* Status Badge */}
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          transition={{ delay: 0.8 }}
          className="rounded-sm p-4 border border-[#d4af37]/10"
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="w-1.5 h-1.5 rounded-full bg-[#d4af37] animate-pulse" />
            <p className="text-[10px] uppercase tracking-widest text-[#d4af37]/70 font-mono">Operational</p>
          </div>
          <p className="text-[10px] text-white/40 font-light leading-relaxed">
            Multi-channel publishing active across Yaga, Facebook Marketplace, Gumtree, OLX, Junk Mail &amp; WhatsApp Groups.
          </p>
        </motion.div>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile hamburger */}
      <button 
        onClick={() => setMobileOpen(!mobileOpen)} 
        className="fixed top-4 left-4 z-[60] md:hidden p-2 rounded-sm bg-[#0a0a0a] border border-[#d4af37]/20 text-white"
        aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
        aria-expanded={mobileOpen}
      >
        {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Desktop sidebar */}
      <motion.aside 
        initial={{ x: -100, opacity: 0 }} 
        animate={{ x: 0, opacity: 1 }} 
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }} 
        className="hidden md:flex fixed left-0 top-0 h-full w-64 bg-[#080806] border-r border-[#d4af37]/10 flex-col z-50"
      >
        {content}
      </motion.aside>

      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[55] md:hidden" 
              onClick={() => setMobileOpen(false)} 
            />
            <motion.aside 
              initial={{ x: -300 }} 
              animate={{ x: 0 }} 
              exit={{ x: -300 }} 
              transition={{ type: 'spring', stiffness: 300, damping: 30 }} 
              className="fixed left-0 top-0 h-full w-64 bg-[#080806] border-r border-[#d4af37]/10 flex-col z-[60] md:hidden flex"
            >
              {content}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}