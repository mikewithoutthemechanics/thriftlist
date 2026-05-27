'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight, ArrowLeft, Check } from 'lucide-react';

interface OnboardingStep {
  title: string;
  description: string;
  content?: React.ReactNode;
}

const onboardingSteps: OnboardingStep[] = [
  {
    title: 'Gratitude & Purpose',
    description: 'Your automated clothing listing companion for South African marketplaces. We empower you to sell smarter by distributing across multiple platforms simultaneously.',
  },
  {
    title: 'Curate Collection',
    description: 'Begin by acquiring your merchandise. Include imagery, narrative, and valuation. Our system optimizes up to ten photographs automatically.',
  },
  {
    title: 'Select Venues',
    description: 'Indicate your preferred platforms. Distribution channels include Facebook Marketplace, Yaga, Gumtree, OLX, Junk Mail, and WhatsApp Communities.',
  },
  {
    title: 'Automated Distribution',
    description: 'Activate "Post to Platforms" and our system executes the publication. For non-API platforms, a browser instance facilitates completion.',
  },
  {
    title: 'Performance Intelligence',
    description: 'Monitor publication history, analyze revenue streams, and assess performance metrics via the Intelligence dashboard.',
  },
  {
    title: 'Commence',
    description: 'Initiate curating your collection and observe your enterprise flourish. Access this orientation permanently through Configuration.',
  },
];

export default function Onboarding() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    const completed = localStorage.getItem('onboarding_completed');
    if (!completed) {
      setIsOpen(true);
    }
  }, []);

  const handleNext = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeOnboarding();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    completeOnboarding();
  };

  const completeOnboarding = () => {
    localStorage.setItem('onboarding_completed', 'true');
    setIsCompleted(true);
    setIsOpen(false);
  };

  const resetOnboarding = () => {
    localStorage.removeItem('onboarding_completed');
    setCurrentStep(0);
    setIsOpen(true);
    setIsCompleted(false);
  };

  if (!isOpen) {
    return null;
  }

  const step = onboardingSteps[currentStep];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="bg-[#0a0a0a] border border-[#d4af37]/20 rounded-sm p-8 md:p-12 max-w-lg w-full relative"
      >
        {/* Art Deco corners */}
        <div className="absolute top-4 left-4 w-8 h-8 border-l border-t border-[#d4af37]/30" />
        <div className="absolute top-4 right-4 w-8 h-8 border-r border-t border-[#d4af37]/30" />
        <div className="absolute bottom-4 left-4 w-8 h-8 border-l border-b border-[#d4af37]/30" />
        <div className="absolute bottom-4 right-4 w-8 h-8 border-r border-b border-[#d4af37]/30" />

        <button
          onClick={handleSkip}
          className="absolute top-4 right-4 text-white/30 hover:text-white transition-colors p-1"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="space-y-8">
          {/* Step indicator */}
          <div className="flex items-center gap-2">
            {onboardingSteps.map((_, index) => (
              <div
                key={index}
                className={`h-px flex-1 transition-all duration-500 ${
                  index <= currentStep ? 'bg-[#d4af37]' : 'bg-white/[0.08]'
                }`}
              />
            ))}
          </div>

          {/* Content */}
          <div>
            <motion.h2 
              key={currentStep}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-2xl font-light text-white mb-3 tracking-wide font-serif"
            >
              {step.title}
            </motion.h2>
            <motion.p 
              key={`desc-${currentStep}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.5 }}
              className="text-white/50 leading-relaxed font-light"
            >
              {step.description}
            </motion.p>
          </div>

          {/* Navigation */}
          <div className="flex gap-4 pt-4">
            {currentStep > 0 && (
              <button
                onClick={handlePrevious}
                className="flex-1 px-6 py-3 border border-white/15 text-white/60 rounded-sm text-sm font-light hover:border-[#d4af37]/30 hover:text-white transition-all duration-300 flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Recede
              </button>
            )}
            <button
              onClick={handleNext}
              className="flex-1 px-6 py-3 bg-[#d4af37] text-[#0a0a0a] rounded-sm text-sm font-medium tracking-wide hover:bg-[#e6c388] transition-colors duration-300 flex items-center justify-center gap-2"
            >
              {currentStep === onboardingSteps.length - 1 ? (
                <>
                  <Check className="w-4 h-4" />
                  Conclude
                </>
              ) : (
                <>
                  Advance
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>

          <button
            onClick={handleSkip}
            className="absolute bottom-[-40px] left-1/2 -translate-x-1/2 text-xs text-white/30 hover:text-white transition-colors"
          >
            Bypass Orientation
          </button>
        </div>
      </motion.div>
    </div>
  );
}