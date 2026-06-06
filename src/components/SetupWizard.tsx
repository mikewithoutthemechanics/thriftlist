'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, ArrowRight, ArrowLeft, Check, Sparkles, Mail,
  Globe, Key, Monitor, ExternalLink, RefreshCw, Shield,
  AlertCircle
} from 'lucide-react';

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  status: 'pending' | 'connected' | 'optional';
  action?: string;
  link?: string;
  envKey?: string;
  settingKey?: string;
}

export default function SetupWizard() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [checking, setChecking] = useState(false);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      const data = await res.json();
      setSettings(data.settings || {});
    } catch {
      setSettings({});
    }
  };

  useEffect(() => {
    const wizardDone = localStorage.getItem('setup_wizard_completed');
    if (!wizardDone) {
      fetchSettings().then(() => setIsOpen(true));
    }
  }, []);

  const checkHealth = async () => {
    setChecking(true);
    try {
      const res = await fetch('/api/health');
      await res.json();
      // Refresh settings after health check
      await fetchSettings();
    } catch {
      // ignore
    }
    setChecking(false);
  };

  const getIntegrationStatus = (integration: Integration): 'pending' | 'connected' | 'optional' => {
    if (integration.id === 'facebook_oauth') {
      return settings['facebook_oauth_name'] ? 'connected' : 'optional';
    }
    if (integration.id === 'encryption') {
      return process.env.ENCRYPTION_KEY ? 'connected' : 'optional';
    }
    if (integration.envKey) {
      return process.env[integration.envKey] ? 'connected' : 'optional';
    }
    if (integration.settingKey) {
      return settings[integration.settingKey] ? 'connected' : 'optional';
    }
    return 'optional';
  };

  const integrations: Integration[] = [
    {
      id: 'groq',
      name: 'Groq AI',
      description: 'AI-powered title, description, and price optimization',
      icon: Sparkles,
      status: 'optional',
      action: 'Get API Key',
      link: 'https://console.groq.com/keys',
      envKey: 'GROQ_API_KEY',
    },
    {
      id: 'resend',
      name: 'Resend Email',
      description: 'Email notifications for posting success and failures',
      icon: Mail,
      status: 'optional',
      action: 'Get API Key',
      link: 'https://resend.com/api-keys',
      envKey: 'RESEND_API_KEY',
    },
    {
      id: 'browserbase',
      name: 'Browserbase',
      description: 'Cloud browser automation for Vercel deployment',
      icon: Globe,
      status: 'optional',
      action: 'Get API Key',
      link: 'https://browserbase.com/settings',
      envKey: 'BROWSERBASE_API_KEY',
    },
    {
      id: 'cloakbrowser',
      name: 'CloakBrowser',
      description: 'Local stealth Chromium for anti-detection (local use only)',
      icon: Monitor,
      status: 'optional',
      action: 'Installed',
    },
    {
      id: 'facebook_oauth',
      name: 'Facebook OAuth',
      description: 'Connect your Facebook account for page/group posting',
      icon: Shield,
      status: 'optional',
      action: 'Connect',
      link: '/api/oauth/facebook',
      settingKey: 'facebook_oauth_name',
    },
  ];

  const steps = [
    { title: 'Welcome', type: 'welcome' as const },
    { title: 'AI Setup', type: 'integration' as const, integration: integrations[0] },
    { title: 'Email Setup', type: 'integration' as const, integration: integrations[1] },
    { title: 'Browser Automation', type: 'integration' as const, integration: integrations[2] },
    { title: 'Facebook Connect', type: 'integration' as const, integration: integrations[4] },
    { title: 'Ready', type: 'done' as const },
  ];

  const currentIntegration = steps[currentStep]?.type === 'integration'
    ? steps[currentStep].integration
    : null;

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeWizard();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  const completeWizard = () => {
    localStorage.setItem('setup_wizard_completed', 'true');
    setIsOpen(false);
  };

  const resetWizard = () => {
    localStorage.removeItem('setup_wizard_completed');
    setCurrentStep(0);
    fetchSettings().then(() => setIsOpen(true));
  };

  const openExternal = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.5 }}
        className="bg-[#0c0c0c] border border-white/[0.04] rounded-2xl p-8 max-w-lg w-full relative shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-accent" />
            </div>
            <h2 className="text-lg font-medium text-white tracking-tight">Setup Wizard</h2>
          </div>
          <button onClick={completeWizard} className="text-white/20 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-1.5 mb-8">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                i <= currentStep ? 'bg-accent' : 'bg-white/[0.06]'
              }`}
            />
          ))}
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {/* Welcome Step */}
            {steps[currentStep].type === 'welcome' && (
              <div className="space-y-6">
                <div className="text-center space-y-3">
                  <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto">
                    <Sparkles className="w-8 h-8 text-accent" />
                  </div>
                  <h3 className="text-xl font-light text-white">Welcome to Thrift List</h3>
                  <p className="text-sm text-white/50 leading-relaxed max-w-sm mx-auto">
                    Let&apos;s get your automated clothing listing system configured. This will only take a few minutes.
                  </p>
                </div>
                <div className="space-y-3 rounded-xl border border-white/[0.04] bg-[#111111] p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-white/40">What we&apos;ll set up:</p>
                  <div className="space-y-2">
                    {integrations.slice(0, 4).map(int => (
                      <div key={int.id} className="flex items-center gap-2 text-sm text-white/60">
                        <int.icon className="w-4 h-4 text-white/20" />
                        {int.name}
                        <span className="text-[10px] text-white/20 ml-auto">{int.status === 'optional' ? 'Optional' : 'Recommended'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Integration Step */}
            {currentIntegration && (
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                    <currentIntegration.icon className="w-6 h-6 text-accent" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-white">{currentIntegration.name}</h3>
                    <p className="text-sm text-white/50">{currentIntegration.description}</p>
                  </div>
                </div>

                {/* Status Card */}
                <div className="rounded-xl border border-white/[0.04] bg-[#111111] p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-white/60">Status</span>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                      getIntegrationStatus(currentIntegration) === 'connected'
                        ? 'bg-emerald-500/10 text-emerald-400'
                        : 'bg-white/[0.04] text-white/40'
                    }`}>
                      {getIntegrationStatus(currentIntegration) === 'connected' ? 'Connected' : 'Not Configured'}
                    </span>
                  </div>

                  {currentIntegration.link && (
                    <div className="flex items-center gap-2">
                      {currentIntegration.id === 'facebook_oauth' ? (
                        <a
                          href={currentIntegration.link}
                          className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-accent text-[#0c0c0c] rounded-lg text-sm font-medium hover:bg-accent transition-colors"
                        >
                          <Shield className="w-4 h-4" />
                          Connect Facebook Account
                        </a>
                      ) : (
                        <button
                          onClick={() => openExternal(currentIntegration.link!)}
                          className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 border border-white/10 text-white/70 rounded-lg text-sm hover:bg-white/5 transition-colors"
                        >
                          <ExternalLink className="w-4 h-4" />
                          {currentIntegration.action}
                        </button>
                      )}
                    </div>
                  )}

                  {currentIntegration.id === 'cloakbrowser' && (
                    <p className="text-xs text-white/30">
                      Already installed as an npm dependency. Select it in Settings to use.
                    </p>
                  )}

                  {currentIntegration.envKey && (
                    <div className="space-y-2">
                      <p className="text-xs text-white/40">
                        Add your API key to <code className="text-accent">.env.local</code>:
                      </p>
                      <code className="block text-xs bg-[#0c0c0c] border border-white/[0.04] rounded-lg p-3 text-white/60 font-mono">
                        {currentIntegration.envKey}=your_key_here
                      </code>
                    </div>
                  )}
                </div>

                {/* Help text */}
                <div className="flex items-start gap-2 text-xs text-white/30">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <p>
                    {currentIntegration.id === 'facebook_oauth'
                      ? 'You\'ll be redirected to Facebook to authorize posting access. We only store an encrypted token.'
                      : 'After adding your key, restart the dev server or redeploy to Vercel for changes to take effect.'}
                  </p>
                </div>
              </div>
            )}

            {/* Done Step */}
            {steps[currentStep].type === 'done' && (
              <div className="space-y-6 text-center">
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto">
                  <Check className="w-8 h-8 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-xl font-light text-white">You&apos;re All Set!</h3>
                  <p className="text-sm text-white/50 mt-2">
                    Your integrations are configured. You can always update them in Settings.
                  </p>
                </div>
                <div className="rounded-xl border border-white/[0.04] bg-[#111111] p-4 text-left space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-white/40">Integration Status</p>
                  {integrations.map(int => {
                    const status = getIntegrationStatus(int);
                    return (
                      <div key={int.id} className="flex items-center gap-2 text-sm">
                        <div className={`w-1.5 h-1.5 rounded-full ${
                          status === 'connected' ? 'bg-emerald-400' : 'bg-white/20'
                        }`} />
                        <span className={status === 'connected' ? 'text-white/80' : 'text-white/40'}>
                          {int.name}
                        </span>
                        <span className="text-xs ml-auto text-white/30">
                          {status === 'connected' ? 'Ready' : 'Optional'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex items-center gap-3 mt-8">
          {currentStep > 0 && (
            <button
              onClick={handlePrevious}
              className="px-4 py-2.5 border border-white/10 text-white/50 rounded-xl text-sm hover:bg-white/5 transition-colors flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
          )}
          <div className="flex-1" />
          {currentStep < steps.length - 1 ? (
            <button
              onClick={handleNext}
              className="px-6 py-2.5 bg-accent text-[#0c0c0c] rounded-xl text-sm font-medium hover:bg-accent transition-colors flex items-center gap-2"
            >
              Next
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={completeWizard}
              className="px-6 py-2.5 bg-emerald-500 text-white rounded-xl text-sm font-medium hover:bg-emerald-400 transition-colors flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              Finish
            </button>
          )}
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-center gap-4 mt-4">
          {steps[currentStep].type === 'integration' && (
            <button
              onClick={checkHealth}
              disabled={checking}
              className="text-xs text-white/30 hover:text-white/60 transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 ${checking ? 'animate-spin' : ''}`} />
              {checking ? 'Checking...' : 'Check Status'}
            </button>
          )}
          {currentStep < steps.length - 1 && (
            <button
              onClick={completeWizard}
              className="text-xs text-white/20 hover:text-white/40 transition-colors"
            >
              Skip Setup
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}

// Export reset function for use in settings
export function resetSetupWizard() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('setup_wizard_completed');
    window.location.reload();
  }
}
