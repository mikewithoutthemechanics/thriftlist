'use client';

import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Settings2, Save, Shield, AlertCircle, Key, Mail, MapPin, Phone, Repeat, RefreshCw, Share2, PlayCircle, Link2, Unlink, Globe, MessageCircle, Monitor, Sparkles, Navigation, CheckCircle, XCircle } from 'lucide-react';
import PageTransition from '@/components/PageTransition';
import { useToast } from '@/components/Toaster';
import { SA_PLATFORMS } from '@/lib/platforms';

interface AuthState {
  platform: string;
  sessionId: string | null;
  liveViewUrl: string | null;
  loading: boolean;
}

export default function SettingsPage() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingIntegration, setTestingIntegration] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, {status: 'ok' | 'error' | 'warning'; message: string}>>({});
  const [authStates, setAuthStates] = useState<Record<string, AuthState>>({});
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetch('/api/settings').then(r => r.json()).then(data => { setSettings(data.settings || {}); setLoading(false); });
  }, []);

  const updateSetting = (key: string, value: string) => {
    setSettings(s => ({ ...s, [key]: value }));
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(async () => {
      setSaving(true);
      const res = await fetch('/api/settings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key, value }) });
      const json = await res.json();
      setSaving(false);
      if (json.success) toast('Setting saved', 'success');
      else toast('Failed to save', 'error');
    }, 800);
  };

  const sections = [
    {
      title: 'Marketplace Defaults',
      icon: MapPin,
      fields: [
        { key: 'location', label: 'Default Location', placeholder: 'e.g. Johannesburg, South Africa', icon: MapPin, type: 'text' as const },
        { key: 'phone_number', label: 'Contact Phone', placeholder: '+27 82 123 4567', icon: Phone, type: 'text' as const },
        { key: 'default_price', label: 'Default Price (R)', placeholder: '0.00', icon: Settings2, type: 'text' as const },
      ],
    },
    {
      title: 'Platform Emails',
      icon: Mail,
      fields: [
        { key: 'gumtree_email', label: 'Gumtree Email', placeholder: 'your@email.com', icon: Mail, type: 'email' as const },
        { key: 'olx_email', label: 'OLX Email', placeholder: 'your@email.com', icon: Mail, type: 'email' as const },
        { key: 'junkmail_email', label: 'Junk Mail Email', placeholder: 'your@email.com', icon: Mail, type: 'email' as const },
      ],
    },
    {
      title: 'API Keys',
      icon: Key,
      fields: [
        { key: 'yaga_api_key', label: 'Yaga API Key', placeholder: 'Enter your Yaga API key', icon: Key, type: 'password' as const },
        { key: 'gumtree_api_key', label: 'Gumtree API Key', placeholder: 'Enter your Gumtree API key', icon: Key, type: 'password' as const },
        { key: 'webhook_secret', label: 'Webhook Secret', placeholder: 'Secret for platform webhook verification', icon: Key, type: 'password' as const },
      ],
    },
    {
      title: 'Facebook OAuth',
      icon: Globe,
      fields: [
        { key: 'facebook_oauth_name', label: 'Connected Account', placeholder: 'Not connected', icon: Globe, type: 'text' as const, readonly: true },
      ],
    },
    {
      title: 'Platform Authentication',
      icon: Shield,
      description: 'Log in to each platform once to save your session. After clicking "Authenticate", open the Live View link, log in manually, then click "Save Authentication". Your session will be reused for automated posting.',
      isAuthSection: true,
    },
    {
      title: 'Auto-Relist',
      icon: Repeat,
      fields: [
        { key: 'auto_relist_enabled', label: 'Enable Auto-Relist', placeholder: 'true or false', icon: Repeat, type: 'text' as const },
        { key: 'auto_relist_interval', label: 'Relist Interval (days)', placeholder: '7', icon: Settings2, type: 'text' as const },
        { key: 'auto_relist_max', label: 'Max Relists', placeholder: '3', icon: Settings2, type: 'text' as const },
        { key: 'auto_relist_reduction', label: 'Price Reduction (%)', placeholder: '0', icon: Settings2, type: 'text' as const },
      ],
    },
    {
      title: 'Cross-Platform Sync',
      icon: RefreshCw,
      fields: [
        { key: 'cross_platform_sync_enabled', label: 'Enable Sync', placeholder: 'true or false', icon: RefreshCw, type: 'text' as const },
        { key: 'auto_remove_sold', label: 'Auto-Remove Sold Items', placeholder: 'true or false', icon: RefreshCw, type: 'text' as const },
      ],
    },
    {
      title: 'Social Media',
      icon: Share2,
      fields: [
        { key: 'social_media_enabled', label: 'Enable Auto-Post', placeholder: 'true or false', icon: Share2, type: 'text' as const },
        { key: 'social_media_platforms', label: 'Platforms (comma-separated)', placeholder: 'instagram,facebook,twitter', icon: Share2, type: 'text' as const },
      ],
    },
  ];

  const startAuth = async (platformId: string) => {
    setAuthStates(prev => ({ ...prev, [platformId]: { ...prev[platformId], platform: platformId, loading: true } }));
    try {
      const res = await fetch('/api/platform-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform: platformId }),
      });
      const data = await res.json();
      if (data.success) {
        setAuthStates(prev => ({ ...prev, [platformId]: { platform: platformId, sessionId: data.sessionId, liveViewUrl: data.liveViewUrl, loading: false } }));
        toast(`${platformId} auth session started`, 'success');
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      toast(err.message || 'Failed to start auth', 'error');
      setAuthStates(prev => ({ ...prev, [platformId]: { ...prev[platformId], loading: false } }));
    }
  };

  const saveAuth = async (platformId: string) => {
    const state = authStates[platformId];
    if (!state?.sessionId) return;
    setAuthStates(prev => ({ ...prev, [platformId]: { ...prev[platformId], loading: true } }));
    try {
      const res = await fetch('/api/platform-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform: platformId, sessionId: state.sessionId }),
      });
      const data = await res.json();
      if (data.success) {
        toast(`${platformId} authentication saved`, 'success');
        setAuthStates(prev => ({ ...prev, [platformId]: { platform: platformId, sessionId: null, liveViewUrl: null, loading: false } }));
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      toast(err.message || 'Failed to save auth', 'error');
      setAuthStates(prev => ({ ...prev, [platformId]: { ...prev[platformId], loading: false } }));
    }
  };

  const testIntegration = async (id: string) => {
    setTestingIntegration(id);
    try {
      const res = await fetch('/api/health');
      const data = await res.json();
      const check = data.checks?.[id] || data.checks?.[id === 'facebook' ? 'facebook_oauth' : id];
      if (check?.status === 'ok') {
        setTestResults(prev => ({ ...prev, [id]: { status: 'ok', message: 'Connection successful' } }));
        toast(`${id.replace('_', ' ')} connected`, 'success');
      } else {
        setTestResults(prev => ({ ...prev, [id]: { status: 'error', message: check?.error || 'Not configured' } }));
        toast(`${id.replace('_', ' ')} not connected`, 'error');
      }
    } catch {
      setTestResults(prev => ({ ...prev, [id]: { status: 'error', message: 'Failed to test' } }));
      toast('Test failed', 'error');
    }
    setTestingIntegration(null);
  };

  const inputClass = "w-full px-4 py-3 rounded-xl border border-white/10 bg-transparent text-white placeholder-white/20 focus:outline-none focus:border-[accent] text-sm font-light";

  const integrations = [
    { id: 'groq', name: 'Groq AI', icon: Sparkles, envKey: 'GROQ_API_KEY', status: !!process.env.GROQ_API_KEY },
    { id: 'resend', name: 'Resend Email', icon: Mail, envKey: 'RESEND_API_KEY', status: !!process.env.RESEND_API_KEY },
    { id: 'browserbase', name: 'Browserbase', icon: Globe, envKey: 'BROWSERBASE_API_KEY', status: !!process.env.BROWSERBASE_API_KEY && !!process.env.BROWSERBASE_PROJECT_ID },
    { id: 'facebook', name: 'Facebook OAuth', icon: Shield, settingKey: 'facebook_oauth_name', status: !!settings['facebook_oauth_name'] },
  ];

  return (
    <PageTransition>
      <div className="max-w-2xl space-y-6">
        <motion.h2 initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="text-2xl font-light text-white tracking-tight">Settings</motion.h2>

        {/* Integration Status Cards */}
        <div className="rounded-2xl border border-white/[0.04] bg-[#111111] p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-[accent]" />
            <h3 className="font-medium text-white">Integration Status</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {integrations.map(int => {
              const testResult = testResults[int.id];
              const isTesting = testingIntegration === int.id;
              const displayStatus = testResult ? testResult.status === 'ok' : int.status;
              return (
                <div key={int.id} className={`flex flex-col gap-2 p-3 rounded-xl border transition-colors ${
                  displayStatus ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-white/[0.04] bg-[#0c0c0c]'
                }`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      displayStatus ? 'bg-emerald-500/10' : 'bg-white/[0.04]'
                    }`}>
                      <int.icon className={`w-4 h-4 ${displayStatus ? 'text-emerald-400' : 'text-white/20'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${displayStatus ? 'text-white/80' : 'text-white/40'}`}>{int.name}</p>
                      <p className={`text-[10px] uppercase tracking-wider ${displayStatus ? 'text-emerald-400' : 'text-white/20'}`}>
                        {displayStatus ? 'Connected' : 'Not Configured'}
                      </p>
                    </div>
                    {displayStatus ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <XCircle className="w-4 h-4 text-white/10" />}
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => testIntegration(int.id)}
                      disabled={isTesting}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] uppercase tracking-wider bg-white/[0.04] hover:bg-white/[0.08] text-white/50 rounded-lg transition-colors disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3 h-3 ${isTesting ? 'animate-spin' : ''}`} />
                      {isTesting ? 'Testing...' : 'Test Connection'}
                    </button>
                    {testResult && testResult.status !== 'ok' && (
                      <span className="text-[10px] text-red-400 truncate">{testResult.message}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {sections.map((section, idx) => (
          <div key={idx} className="rounded-2xl border border-white/[0.04] bg-[#111111] p-6 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <section.icon className="w-5 h-5 text-[accent]" />
              <h3 className="font-medium text-white">{section.title}</h3>
            </div>
            <p className="text-sm text-white/40 -mt-2 font-light">
              {section.title === 'API Keys' ? 'Configure API keys for platforms that support direct API integration. These are encrypted and stored securely.' : 'Configure your default posting details.'}
            </p>

            {loading ? <div className="space-y-3">{(section as any).fields?.map((_: any, i: number) => <div key={i} className="h-14 rounded-xl bg-white/[0.02]" />)}</div> : (
              <div className="space-y-4">
                {(section as any).isAuthSection ? (
                  <div className="space-y-3">
                    <p className="text-sm text-white/40 font-light">{(section as any).description}</p>
                    <div className="grid grid-cols-1 gap-3">
                      {SA_PLATFORMS.map(platform => {
                        const authState = authStates[platform.id];
                        return (
                          <div key={platform.id} className="flex items-center justify-between p-3 rounded-xl border border-white/[0.04] bg-[#0c0c0c]">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-white/[0.04] flex items-center justify-center">
                                <Globe className="w-4 h-4 text-white/40" />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-white/80">{platform.name}</p>
                                {authState?.liveViewUrl && (
                                  <a href={authState.liveViewUrl} target="_blank" rel="noopener noreferrer" className="text-[11px] text-[accent] hover:underline">
                                    Open Live View
                                  </a>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {authState?.sessionId ? (
                                <button
                                  onClick={() => saveAuth(platform.id)}
                                  disabled={authState.loading}
                                  className="px-3 py-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg text-xs hover:bg-emerald-500/30 transition-colors disabled:opacity-50"
                                >
                                  {authState.loading ? 'Saving...' : 'Save Authentication'}
                                </button>
                              ) : (
                                <button
                                  onClick={() => startAuth(platform.id)}
                                  disabled={authState?.loading}
                                  className="px-3 py-1.5 bg-white/[0.06] text-white/60 rounded-lg text-xs hover:bg-white/[0.1] transition-colors disabled:opacity-50"
                                >
                                  {authState?.loading ? 'Starting...' : 'Authenticate'}
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <>
                    {section.fields?.map(field => (
                      <div key={field.key}>
                        <label className="block text-[11px] font-semibold uppercase tracking-wider text-white/50 mb-2">{field.label}</label>
                        <div className="relative">
                          <field.icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                          {(field as any).type === 'select' ? (
                            <select
                              value={settings[field.key] || (field as any).options?.[0] || ''}
                              onChange={e => updateSetting(field.key, e.target.value)}
                              className={inputClass + ' pl-10 appearance-none cursor-pointer'}
                            >
                              {(field as any).options?.map((opt: string) => (
                                <option key={opt} value={opt} className="bg-[#111111] text-white">{opt}</option>
                              ))}
                            </select>
                          ) : (
                            <input
                              type={field.type || 'text'}
                              value={settings[field.key] || ''}
                              onChange={e => updateSetting(field.key, e.target.value)}
                              placeholder={field.placeholder}
                              readOnly={(field as any).readonly}
                              className={inputClass + ' pl-10' + ((field as any).readonly ? ' opacity-50 cursor-default' : '')}
                            />
                          )}
                        </div>
                      </div>
                    ))}
                  </>
                )}
                {section.title === 'Facebook OAuth' && (
                  <div className="flex items-center gap-3 pt-2">
                    {settings['facebook_oauth_name'] ? (
                      <>
                        <span className="text-sm text-white/60 flex items-center gap-2">
                          <Link2 className="w-4 h-4 text-emerald-400" />
                          Connected as {settings['facebook_oauth_name']}
                        </span>
                        <button
                          onClick={() => updateSetting('facebook_oauth_name', '')}
                          className="text-xs text-red-400 hover:text-red-300 underline"
                        >
                          Disconnect
                        </button>
                      </>
                    ) : (
                      <a
                        href="/api/oauth/facebook"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-[#1877F2]/20 text-[#1877F2] rounded-lg text-sm hover:bg-[#1877F2]/30 transition-colors"
                      >
                        <Link2 className="w-4 h-4" />
                        Connect Facebook
                      </a>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        <div className="rounded-2xl border border-white/[0.04] bg-[#111111] p-6 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <PlayCircle className="w-5 h-5 text-[accent]" />
            <h3 className="font-medium text-white">Tours & Setup</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => { localStorage.removeItem('setup_wizard_completed'); window.location.reload(); }}
              className="px-4 py-2 bg-[accent]/10 text-[accent] rounded-lg text-sm hover:bg-[accent]/20 transition-colors"
            >
              Replay Setup Wizard
            </button>
            <button
              onClick={() => { localStorage.removeItem('dashboard_tour_completed'); window.location.reload(); }}
              className="px-4 py-2 bg-[accent]/10 text-[accent] rounded-lg text-sm hover:bg-[accent]/20 transition-colors"
            >
              Replay Dashboard Tour
            </button>
            <button
              onClick={() => { localStorage.removeItem('onboarding_completed'); window.location.reload(); }}
              className="px-4 py-2 border border-white/10 text-white/50 rounded-lg text-sm hover:bg-white/5 transition-colors"
            >
              Replay Welcome
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-2">
          <Save className={`w-4 h-4 ${saving ? 'text-[accent] animate-pulse' : 'text-[accent]'}`} />
          <span className="text-xs text-white/30">{saving ? 'Saving...' : 'Auto-saved'}</span>
        </div>

        <div className="rounded-2xl border border-[accent]/20 bg-[accent]/5 p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-[accent] mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-[accent] flex items-center gap-2"><Shield className="w-3.5 h-3.5" /> Security Notice</p>
            <p className="text-sm text-white/40 mt-1 font-light">Your credentials and settings are stored per-user in your Supabase database. Do not share your API keys or login credentials.</p>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
