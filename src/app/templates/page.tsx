'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Copy, FileText, Sparkles } from 'lucide-react';
import PageTransition from '@/components/PageTransition';
import ConfirmDialog from '@/components/ConfirmDialog';
import { useToast } from '@/components/Toaster';
import { CATEGORIES, SA_PLATFORMS } from '@/lib/types';

export default function TemplatesPage() {
  const { toast } = useToast();
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<{ open: boolean; id: string; name: string }>({ open: false, id: '', name: '' });

  const [form, setForm] = useState({
    name: '',
    descriptionTemplate: '',
    category: '',
    platforms: [] as string[],
  });

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/templates');
      const data = await res.json();
      setTemplates(data.templates || []);
    } catch (err) {
      toast('Failed to load templates', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.descriptionTemplate) {
      toast('Please fill in required fields', 'error');
      return;
    }

    try {
      const res = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        toast('Template created', 'success');
        setShowCreate(false);
        setForm({ name: '', descriptionTemplate: '', category: '', platforms: [] });
        fetchTemplates();
      } else {
        toast(data.error || 'Failed to create template', 'error');
      }
    } catch (err) {
      toast('Failed to create template', 'error');
    }
  };

  const handleDelete = async () => {
    try {
      const res = await fetch(`/api/templates?id=${confirmDelete.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        toast('Template deleted', 'success');
        setConfirmDelete({ open: false, id: '', name: '' });
        fetchTemplates();
      } else {
        toast(data.error || 'Failed to delete template', 'error');
      }
    } catch (err) {
      toast('Failed to delete template', 'error');
    }
  };

  const togglePlatform = (platformId: string) => {
    setForm(f => ({
      ...f,
      platforms: f.platforms.includes(platformId)
        ? f.platforms.filter(p => p !== platformId)
        : [...f.platforms, platformId],
    }));
  };

  const applyTemplate = async (template: any) => {
    // Copy template to clipboard or open new item with template applied
    const templateText = `Title: [Item Title]\n\nDescription:\n${template.descriptionTemplate}\n\nCategory: ${template.category || 'Any'}\nPlatforms: ${template.platforms?.join(', ') || 'All'}`;
    await navigator.clipboard.writeText(templateText);
    toast('Template copied to clipboard', 'success');
  };

  return (
    <PageTransition>
      <div className="max-w-4xl space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-light text-white tracking-tight">Posting Templates</h2>
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-white text-[#0c0c0c] rounded-full font-semibold text-sm tracking-wide hover:bg-white/90 transition-colors"
          >
            <Plus className="w-4 h-4" /> New Template
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-40 rounded-2xl bg-white/[0.02] animate-pulse" />)}
          </div>
        ) : templates.length === 0 ? (
          <div className="rounded-2xl border border-white/[0.04] bg-[#111111] p-12 text-center">
            <FileText className="w-12 h-12 text-white/20 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white">No templates yet</h3>
            <p className="text-white/30 mt-1 mb-4">Create templates to quickly populate item descriptions</p>
            <button
              onClick={() => setShowCreate(true)}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-accent text-[#0c0c0c] rounded-full font-semibold text-sm tracking-wide hover:bg-accent transition-colors"
            >
              <Plus className="w-4 h-4" /> Create Template
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {templates.map((template, idx) => (
              <motion.div
                key={template.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="rounded-2xl border border-white/[0.04] bg-[#111111] p-5 space-y-4"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium text-white">{template.name}</h3>
                    <p className="text-xs text-white/30 mt-1">{template.category || 'Any category'}</p>
                  </div>
                  <button
                    onClick={() => setConfirmDelete({ open: true, id: template.id, name: template.name })}
                    className="p-1.5 text-white/20 hover:text-red-400 rounded-lg hover:bg-red-500/10 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-sm text-white/60 line-clamp-3 font-light">{template.description_template}</p>
                <div className="flex flex-wrap gap-2">
                  {template.platforms?.map((platformId: string) => (
                    <span key={platformId} className="text-xs px-2 py-1 rounded-full bg-white/5 text-white/50">
                      {SA_PLATFORMS.find(p => p.id === platformId)?.name || platformId}
                    </span>
                  ))}
                </div>
                <button
                  onClick={() => applyTemplate(template)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-accent/30 text-accent rounded-xl text-sm font-medium hover:bg-accent/10 transition-colors"
                >
                  <Copy className="w-4 h-4" /> Copy Template
                </button>
              </motion.div>
            ))}
          </div>
        )}

        <AnimatePresence>
          {showCreate && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
              onClick={() => setShowCreate(false)}
            >
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                onClick={e => e.stopPropagation()}
                className="rounded-2xl border border-white/[0.04] bg-[#111111] p-6 w-full max-w-lg space-y-4"
              >
                <h3 className="text-lg font-medium text-white">New Template</h3>
                <form onSubmit={handleCreate} className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-white/50 mb-2">Template Name</label>
                    <input
                      required
                      value={form.name}
                      onChange={e => setForm({ ...form, name: e.target.value })}
                      placeholder="e.g. Summer Collection"
                      className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-transparent text-white placeholder-white/20 focus:outline-none focus:border-accent text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-white/50 mb-2">Description Template</label>
                    <textarea
                      required
                      rows={4}
                      value={form.descriptionTemplate}
                      onChange={e => setForm({ ...form, descriptionTemplate: e.target.value })}
                      placeholder="Use placeholders like {condition}, {size}, {brand}..."
                      className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-transparent text-white placeholder-white/20 focus:outline-none focus:border-accent text-sm resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-white/50 mb-2">Default Category (optional)</label>
                    <select
                      value={form.category}
                      onChange={e => setForm({ ...form, category: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-transparent text-white focus:outline-none focus:border-accent text-sm"
                    >
                      <option value="">Any category</option>
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-white/50 mb-2">Default Platforms (optional)</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {SA_PLATFORMS.map(platform => (
                        <button
                          key={platform.id}
                          type="button"
                          onClick={() => togglePlatform(platform.id)}
                          className={`p-3 rounded-xl border text-left transition-all text-xs ${
                            form.platforms.includes(platform.id)
                              ? 'border-accent/30 bg-accent/10 text-white'
                              : 'border-white/[0.04] bg-[#0c0c0c] text-white/60 hover:border-white/[0.08]'
                          }`}
                        >
                          {platform.name}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button
                      type="submit"
                      className="flex-1 px-4 py-2.5 bg-accent text-[#0c0c0c] rounded-full font-semibold text-sm hover:bg-accent transition-colors"
                    >
                      Create Template
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowCreate(false)}
                      className="flex-1 px-4 py-2.5 border border-white/10 text-white/70 rounded-full font-medium text-sm hover:bg-white/5 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <ConfirmDialog
          open={confirmDelete.open}
          title="Delete Template"
          message={`Are you sure you want to delete "${confirmDelete.name}"? This action cannot be undone.`}
          confirmText="Delete"
          variant="danger"
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete({ open: false, id: '', name: '' })}
        />
      </div>
    </PageTransition>
  );
}
