'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight, ArrowLeft, Navigation, Shirt, BarChart3, Settings, Plus, Sparkles } from 'lucide-react';

interface TourStep {
  target: string;
  title: string;
  description: string;
  position: 'top' | 'bottom' | 'left' | 'right';
}

const tourSteps: TourStep[] = [
  {
    target: '[data-tour="sidebar"]',
    title: 'Navigation',
    description: 'Access your items, analytics, postings, templates, and settings from the sidebar.',
    position: 'right',
  },
  {
    target: '[data-tour="items-link"]',
    title: 'Your Items',
    description: 'Manage all your clothing listings. Create, edit, duplicate, and track posting status.',
    position: 'right',
  },
  {
    target: '[data-tour="dashboard-link"]',
    title: 'Dashboard',
    description: 'Get an overview of your sales, revenue, and posting activity at a glance.',
    position: 'right',
  },
  {
    target: '[data-tour="analytics-link"]',
    title: 'Analytics',
    description: 'Deep dive into your performance metrics and revenue trends over time.',
    position: 'right',
  },
  {
    target: '[data-tour="new-item"]',
    title: 'Create New Item',
    description: 'Add a new listing with photos, AI-generated descriptions, smart pricing, and platform selection.',
    position: 'bottom',
  },
  {
    target: '[data-tour="ai-buttons"]',
    title: 'AI Features',
    description: 'Use AI to generate titles, descriptions, calculate smart prices, and even scan photos for auto-fill.',
    position: 'bottom',
  },
  {
    target: '[data-tour="platform-select"]',
    title: 'Platform Selection',
    description: 'Choose which marketplaces to post to. We support Facebook, Yaga, Gumtree, OLX, and more.',
    position: 'top',
  },
  {
    target: '[data-tour="settings-link"]',
    title: 'Settings & Integrations',
    description: 'Configure API keys, connect Facebook, set auto-relist rules, and choose your browser automation.',
    position: 'right',
  },
];

export default function DashboardTour() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    const tourCompleted = localStorage.getItem('dashboard_tour_completed');
    const setupDone = localStorage.getItem('setup_wizard_completed');
    if (setupDone && !tourCompleted) {
      // Wait for layout to settle
      const timer = setTimeout(() => setIsOpen(true), 500);
      return () => clearTimeout(timer);
    }
  }, []);

  const getTargetElement = useCallback(() => {
    const step = tourSteps[currentStep];
    return document.querySelector(step.target) as HTMLElement | null;
  }, [currentStep]);

  useEffect(() => {
    if (!isOpen) return;

    const updateTarget = () => {
      const el = getTargetElement();
      if (el) {
        setTargetRect(el.getBoundingClientRect());
      }
    };

    updateTarget();
    window.addEventListener('resize', updateTarget);
    window.addEventListener('scroll', updateTarget, true);

    return () => {
      window.removeEventListener('resize', updateTarget);
      window.removeEventListener('scroll', updateTarget, true);
    };
  }, [isOpen, currentStep, getTargetElement]);

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeTour();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  const completeTour = () => {
    localStorage.setItem('dashboard_tour_completed', 'true');
    setIsOpen(false);
  };

  const skipTour = () => {
    localStorage.setItem('dashboard_tour_completed', 'true');
    setIsOpen(false);
  };

  const resetTour = () => {
    localStorage.removeItem('dashboard_tour_completed');
    setCurrentStep(0);
    setIsOpen(true);
  };

  if (!isOpen || !targetRect) return null;

  const step = tourSteps[currentStep];
  const padding = 8;

  // Calculate tooltip position
  const getTooltipStyle = () => {
    const rect = targetRect!;
    const tooltipWidth = 320;
    const tooltipHeight = 140;

    switch (step.position) {
      case 'right':
        return {
          left: rect.right + padding + 16,
          top: Math.max(16, Math.min(rect.top, window.innerHeight - tooltipHeight - 16)),
        };
      case 'left':
        return {
          left: Math.max(16, rect.left - tooltipWidth - padding - 16),
          top: Math.max(16, Math.min(rect.top, window.innerHeight - tooltipHeight - 16)),
        };
      case 'bottom':
        return {
          left: Math.max(16, Math.min(rect.left, window.innerWidth - tooltipWidth - 16)),
          top: rect.bottom + padding + 16,
        };
      case 'top':
        return {
          left: Math.max(16, Math.min(rect.left, window.innerWidth - tooltipWidth - 16)),
          top: Math.max(16, rect.top - tooltipHeight - padding - 16),
        };
    }
  };

  const tooltipStyle = getTooltipStyle();

  return (
    <div className="fixed inset-0 z-[60] pointer-events-none">
      {/* Backdrop with cutout */}
      <svg className="absolute inset-0 w-full h-full pointer-events-auto">
        <defs>
          <mask id="tour-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            <rect
              x={targetRect.left - padding}
              y={targetRect.top - padding}
              width={targetRect.width + padding * 2}
              height={targetRect.height + padding * 2}
              rx="12"
              fill="black"
            />
          </mask>
        </defs>
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(0,0,0,0.7)"
          mask="url(#tour-mask)"
          onClick={skipTour}
          className="cursor-pointer"
        />
      </svg>

      {/* Highlight border around target */}
      <motion.div
        className="absolute pointer-events-none border-2 border-[#c4a882] rounded-xl"
        style={{
          left: targetRect.left - padding,
          top: targetRect.top - padding,
          width: targetRect.width + padding * 2,
          height: targetRect.height + padding * 2,
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      />

      {/* Tooltip */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, y: 10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          transition={{ duration: 0.3 }}
          className="absolute pointer-events-auto w-80 bg-[#0c0c0c] border border-white/[0.04] rounded-2xl p-5 shadow-2xl"
          style={tooltipStyle}
        >
          {/* Step counter */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#c4a882]">
              Step {currentStep + 1} of {tourSteps.length}
            </span>
            <button onClick={skipTour} className="text-white/20 hover:text-white/60 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          <h3 className="text-base font-medium text-white mb-1">{step.title}</h3>
          <p className="text-sm text-white/50 leading-relaxed mb-4">{step.description}</p>

          {/* Navigation */}
          <div className="flex items-center gap-2">
            {currentStep > 0 && (
              <button
                onClick={handlePrevious}
                className="px-3 py-2 border border-white/10 text-white/50 rounded-lg text-xs hover:bg-white/5 transition-colors flex items-center gap-1"
              >
                <ArrowLeft className="w-3 h-3" />
                Back
              </button>
            )}
            <div className="flex-1 flex items-center gap-1">
              {tourSteps.map((_, i) => (
                <div
                  key={i}
                  className={`h-1 flex-1 rounded-full transition-colors ${
                    i <= currentStep ? 'bg-[#c4a882]' : 'bg-white/[0.06]'
                  }`}
                />
              ))}
            </div>
            <button
              onClick={handleNext}
              className="px-4 py-2 bg-[#c4a882] text-[#0c0c0c] rounded-lg text-xs font-medium hover:bg-[#d4b892] transition-colors flex items-center gap-1"
            >
              {currentStep === tourSteps.length - 1 ? 'Finish' : 'Next'}
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export { resetTour as resetDashboardTour };
function resetTour() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('dashboard_tour_completed');
    window.location.reload();
  }
}
