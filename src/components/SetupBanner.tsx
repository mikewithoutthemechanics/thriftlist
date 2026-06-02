'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X, ArrowRight, Wrench } from 'lucide-react';
import EnvGenerator from './EnvGenerator';

interface SetupState {
  overall: 'complete' | 'incomplete' | 'partial';
  steps: any[];
}

export default function SetupBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [guide, setGuide] = useState<SetupState | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const dismissedAt = localStorage.getItem('setup_banner_dismissed');
    if (dismissedAt) {
      const hoursSince = (Date.now() - parseInt(dismissedAt)) / (1000 * 60 * 60);
      if (hoursSince < 24) {
        setDismissed(true);
        return;
      }
    }
    fetchGuide();
  }, []);

  const fetchGuide = async () => {
    try {
      const res = await fetch('/api/setup-guide');
      const data = await res.json();
      setGuide(data);
      setShowBanner(data.overall !== 'complete');
    } catch {
      // ignore
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem('setup_banner_dismissed', Date.now().toString());
  };

  const incompleteRequired = guide?.steps.filter((s: any) => s.required && !s.complete) || [];
  const incompleteOptional = guide?.steps.filter((s: any) => !s.required && !s.complete) || [];

  if (!showBanner || dismissed) return null;

  return (
    <>
      <AnimatePresence>
        {showBanner && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-0 left-0 right-0 z-[60] bg-accent/10 border-b border-accent/20"
          >
            <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-accent flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white/80 font-medium">
                  {incompleteRequired.length > 0
                    ? `Setup Required: ${incompleteRequired.length} critical configuration${incompleteRequired.length > 1 ? 's' : ''} missing`
                    : `Optional Integrations: ${incompleteOptional.length} integration${incompleteOptional.length > 1 ? 's' : ''} available`}
                </p>
                <p className="text-xs text-white/40 mt-0.5">
                  {incompleteRequired.length > 0
                    ? 'Complete the required setup to start using ThriftList.'
                    : 'Add optional integrations to unlock AI optimization, email alerts, and automated posting.'}
                </p>
              </div>
              <button
                onClick={() => setShowModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-accent text-[#0c0c0c] rounded-lg text-xs font-medium hover:bg-accent transition-colors flex-shrink-0"
              >
                <Wrench className="w-3.5 h-3.5" />
                Configure
                <ArrowRight className="w-3 h-3" />
              </button>
              <button
                onClick={handleDismiss}
                className="text-white/30 hover:text-white/60 transition-colors flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Full Setup Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] bg-black/90 backdrop-blur-md flex items-start justify-center p-4 overflow-y-auto"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-[#0c0c0c] border border-white/[0.04] rounded-2xl p-6 max-w-lg w-full my-8 relative shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-medium text-white tracking-tight">Configuration Setup</h2>
                <button onClick={() => { setShowModal(false); fetchGuide(); }} className="text-white/20 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {guide && (
                <div className="space-y-6">
                  {/* Progress Overview */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-white/50">Setup Progress</span>
                      <span className="text-accent">
                        {guide.steps.filter((s: any) => s.complete).length}/{guide.steps.length} complete
                      </span>
                    </div>
                    <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-accent rounded-full transition-all duration-500"
                        style={{ width: `${(guide.steps.filter((s: any) => s.complete).length / guide.steps.length) * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Steps List */}
                  <div className="space-y-2">
                    {guide.steps.map((step: any) => (
                      <div
                        key={step.id}
                        className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                          step.complete
                            ? 'border-emerald-500/20 bg-emerald-500/5'
                            : step.required
                            ? 'border-red-500/10 bg-red-500/[0.02]'
                            : 'border-white/[0.04] bg-[#111111]'
                        }`}
                      >
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          step.complete
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : step.required
                            ? 'bg-red-500/10 text-red-400'
                            : 'bg-white/[0.04] text-white/30'
                        }`}>
                          {step.complete ? '✓' : guide.steps.indexOf(step) + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-white/80">{step.title}</span>
                            {step.required && <span className="text-[10px] text-red-400">Required</span>}
                          </div>
                          <p className="text-xs text-white/40">{step.description}</p>
                        </div>
                        {step.action.link && !step.complete && (
                          <a
                            href={step.action.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] text-accent hover:underline flex-shrink-0"
                          >
                            {step.action.text}
                          </a>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Env Generator */}
                  <div className="border-t border-white/[0.04] pt-6">
                    <h3 className="text-sm font-medium text-white mb-3">Generate .env.local File</h3>
                    <EnvGenerator />
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
