'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Upload, X, Play, AlertCircle, RefreshCw, ExternalLink, CheckCircle, XCircle, Clock, Tag, Trash2, Send, Loader2, Sparkles, Calendar, Copy } from 'lucide-react';
import { CATEGORIES, SIZES, CONDITIONS, SA_PLATFORMS } from '@/lib/types';
import PageTransition from '@/components/PageTransition';
import ConfirmDialog from '@/components/ConfirmDialog';
import ImageLightbox from '@/components/ImageLightbox';
import { useToast } from '@/components/Toaster';
import { compressImage } from '@/lib/image-compression';
import { createClientBrowser } from '@/lib/supabase';
import { calculateSmartPrice } from '@/lib/smart-pricing';
import { generateOptimizedTitle, generateOptimizedDescription } from '@/lib/ai-optimization';

export default function EditItemPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { toast } = useToast();
  const supabase = createClientBrowser();

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [confirmPost, setConfirmPost] = useState(false);
  const [automationStatus, setAutomationStatus] = useState('');
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [scheduling, setScheduling] = useState(false);
  const [postings, setPostings] = useState<any[]>([]);
  const [postingsLoading, setPostingsLoading] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [lightbox, setLightbox] = useState({ open: false, index: 0 });
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [priceHistory, setPriceHistory] = useState<any[]>([]);
  const [suggestingPrice, setSuggestingPrice] = useState(false);
  const [optimizingTitle, setOptimizingTitle] = useState(false);
  const [optimizingDescription, setOptimizingDescription] = useState(false);

  const [form, setForm] = useState({
    title: '', description: '', price: '', category: '', size: '', brand: '', condition: 'good', color: '', platforms: [] as string[], status: 'ready',
  });

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.title.trim()) e.title = 'Title is required';
    if (!form.description.trim()) e.description = 'Description is required';
    if (!form.price || parseFloat(form.price) <= 0) e.price = 'Price must be greater than 0';
    if (!form.category) e.category = 'Category is required';
    if (!form.size) e.size = 'Size is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  useEffect(() => {
    fetch(`/api/items/${id}`).then(r => r.json()).then(data => {
      const item = data.item;
      setForm({ title: item.title, description: item.description, price: String(item.price), category: item.category, size: item.size, brand: item.brand || '', condition: item.condition, color: item.color || '', platforms: item.platforms || [], status: item.status });
      setPhotos(item.photos || []);
    });
    fetchPostings();
    fetchPriceHistory();
  }, [id]);

  const fetchPostings = () => {
    setPostingsLoading(true);
    fetch(`/api/postings?itemId=${id}`).then(r => r.json()).then(data => { setPostings(data.postings || []); setPostingsLoading(false); });
  };

  const fetchPriceHistory = async () => {
    const { data } = await supabase.from('price_history').select('*').eq('item_id', id).order('changed_at', { ascending: false }).limit(10);
    setPriceHistory(data || []);
  };

  const duplicateItem = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title + ' (Copy)',
          description: form.description,
          price: parseFloat(form.price),
          category: form.category,
          size: form.size,
          brand: form.brand,
          condition: form.condition,
          color: form.color,
          photos,
          platforms: form.platforms,
        }),
      });
      const json = await res.json();
      if (json.success) {
        toast('Item duplicated', 'success');
        router.push(`/items/${json.id}`);
      } else if (json.error === 'Duplicate item detected') {
        toast('Exact copy already exists — modify slightly first', 'warning');
      } else {
        toast(json.error || 'Failed to duplicate', 'error');
      }
    } catch {
      toast('Failed to duplicate item', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    
    if (photos.length + files.length > 10) {
      toast('Maximum 10 photos allowed', 'error');
      return;
    }

    setUploading(true);
    const uploadedUrls: string[] = [];

    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        toast(`Skipping ${file.name} - not an image`, 'warning');
        continue;
      }

      try {
        const compressedBlob = await compressImage(file, 1920, 0.8);
        const compressedFile = new File([compressedBlob], file.name, { type: 'image/jpeg' });
        
        const data = new FormData();
        data.append('file', compressedFile);
        const res = await fetch('/api/upload', { method: 'POST', body: data });
        const json = await res.json();
        if (json.url) {
          uploadedUrls.push(json.url);
        } else {
          toast(`Failed to upload ${file.name}`, 'error');
        }
      } catch (err) {
        toast(`Failed to compress ${file.name}`, 'error');
      }
    }

    if (uploadedUrls.length > 0) {
      setPhotos([...photos, ...uploadedUrls]);
      toast(`${uploadedUrls.length} photo(s) uploaded`, 'success');
    }
    setUploading(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files || []);
    if (files.length === 0) return;
    
    if (photos.length + files.length > 10) {
      toast('Maximum 10 photos allowed', 'error');
      return;
    }

    setUploading(true);
    const uploadedUrls: string[] = [];

    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        toast(`Skipping ${file.name} - not an image`, 'warning');
        continue;
      }

      try {
        const compressedBlob = await compressImage(file, 1920, 0.8);
        const compressedFile = new File([compressedBlob], file.name, { type: 'image/jpeg' });
        
        const data = new FormData();
        data.append('file', compressedFile);
        const res = await fetch('/api/upload', { method: 'POST', body: data });
        const json = await res.json();
        if (json.url) {
          uploadedUrls.push(json.url);
        } else {
          toast(`Failed to upload ${file.name}`, 'error');
        }
      } catch (err) {
        toast(`Failed to compress ${file.name}`, 'error');
      }
    }

    if (uploadedUrls.length > 0) {
      setPhotos([...photos, ...uploadedUrls]);
      toast(`${uploadedUrls.length} photo(s) uploaded`, 'success');
    }
    setUploading(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const removePhoto = (idx: number) => setPhotos(photos.filter((_, i) => i !== idx));
  const togglePlatform = (platformId: string) => setForm(f => ({ ...f, platforms: f.platforms.includes(platformId) ? f.platforms.filter(p => p !== platformId) : [...f.platforms, platformId] }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) { toast('Please fix errors', 'warning'); return; }
    setLoading(true);
    const res = await fetch(`/api/items/${id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, price: parseFloat(form.price), photos, platforms: form.platforms }),
    });
    const json = await res.json();
    setLoading(false);
    if (json.success) toast('Changes saved', 'success');
    else toast(json.error || 'Failed to save', 'error');
  };

  const runAutomation = async () => {
    setConfirmPost(false);
    setAutomationStatus('Starting automation...');
    try {
      const res = await fetch('/api/automation', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ itemId: id, platforms: form.platforms }) });
      const data = await res.json();
      if (data.success) { setAutomationStatus('Automation started. Browser windows will open for each platform.'); toast('Automation started', 'success'); }
      else { setAutomationStatus(data.error || 'Failed to start automation.'); toast(data.error || 'Automation failed', 'error'); }
    } catch (err: any) { setAutomationStatus('Error: ' + err.message); toast(err.message, 'error'); }
  };

  const deleteItem = async () => {
    setConfirmDelete(false);
    await fetch(`/api/items/${id}`, { method: 'DELETE' });
    toast('Item deleted', 'success');
    router.push('/items');
  };

  const markAsSold = async () => {
    await fetch(`/api/items/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, price: parseFloat(form.price), photos, platforms: form.platforms, status: 'sold' }) });
    setForm(f => ({ ...f, status: 'sold' }));
    toast('Marked as sold', 'success');
  };

  const handleSchedule = async () => {
    if (!scheduledDate || !scheduledTime) {
      toast('Please select date and time', 'error');
      return;
    }
    if (form.platforms.length === 0) {
      toast('Please select at least one platform', 'error');
      return;
    }

    setScheduling(true);
    const scheduledAt = new Date(`${scheduledDate}T${scheduledTime}`).toISOString();

    try {
      const res = await fetch('/api/scheduled-postings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId: id, platforms: form.platforms, scheduledAt }),
      });
      const data = await res.json();
      if (data.success) {
        toast('Posting scheduled successfully', 'success');
        setScheduleOpen(false);
        setScheduledDate('');
        setScheduledTime('');
      } else {
        toast(data.error || 'Failed to schedule posting', 'error');
      }
    } catch (err) {
      toast('Failed to schedule posting', 'error');
    } finally {
      setScheduling(false);
    }
  };

  const inputClass = (field: string) => `w-full px-4 py-3 rounded-xl border ${errors[field] ? 'border-red-500/50 focus:ring-red-500/50' : 'border-white/10 focus:ring-[#c4a882]/50'} bg-transparent text-white placeholder-white/20 focus:outline-none focus:border-b-2 focus:ring-0 transition-all text-sm font-light`;
  const labelClass = (field: string) => `block text-[11px] font-semibold uppercase tracking-wider text-white/50 mb-2`;

  return (
    <PageTransition>
      <div className="max-w-2xl">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3 mb-8">
          <Link href="/items" className="p-2 text-white/30 hover:text-white rounded-xl hover:bg-white/5 transition-all"><ArrowLeft className="w-5 h-5" /></Link>
          <h2 className="text-2xl font-light text-white tracking-tight">Edit Item</h2>
        </motion.div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="rounded-2xl border border-white/[0.04] bg-[#111111] p-6 space-y-5">
            <h3 className="text-sm font-medium text-white">Basic Info</h3>
            <div className="relative">
              <label className={labelClass('title')}>Title {errors.title && <span className="text-red-400 text-xs">({errors.title})</span>}</label>
              <input required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className={inputClass('title')} placeholder="Item title" />
              <button
                type="button"
                onClick={async () => {
                  if (!form.description || !form.category) { toast('Fill in description and category first', 'error'); return; }
                  setOptimizingTitle(true);
                  try {
                    const optimized = await generateOptimizedTitle(form.title, form.description, form.category);
                    setForm(f => ({ ...f, title: optimized }));
                    toast('Title optimized with AI', 'success');
                  } catch { toast('Failed to optimize title', 'error'); }
                  setOptimizingTitle(false);
                }}
                disabled={optimizingTitle}
                className="absolute right-2 top-[28px] p-1.5 text-[#c4a882]/60 hover:text-[#c4a882] transition-colors"
                title="Optimize title with AI"
              >
                {optimizingTitle ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              </button>
            </div>
            <div className="relative">
              <label className={labelClass('description')}>Description {errors.description && <span className="text-red-400 text-xs">({errors.description})</span>}</label>
              <textarea required rows={4} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className={inputClass('description')} placeholder="Describe the item..." />
              <button
                type="button"
                onClick={async () => {
                  if (!form.title || !form.category) { toast('Fill in title and category first', 'error'); return; }
                  setOptimizingDescription(true);
                  try {
                    const optimized = await generateOptimizedDescription(form.description, form.title, form.category, form.brand, form.condition);
                    setForm(f => ({ ...f, description: optimized }));
                    toast('Description optimized with AI', 'success');
                  } catch { toast('Failed to optimize description', 'error'); }
                  setOptimizingDescription(false);
                }}
                disabled={optimizingDescription}
                className="absolute right-2 top-[28px] p-1.5 text-[#c4a882]/60 hover:text-[#c4a882] transition-colors"
                title="Optimize description with AI"
              >
                {optimizingDescription ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="relative">
                <label className={labelClass('price')}>Price (R) {errors.price && <span className="text-red-400 text-xs">({errors.price})</span>}</label>
                <input required type="number" step="0.01" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} className={inputClass('price')} placeholder="0.00" />
                <button
                  type="button"
                  onClick={async () => {
                    if (!form.category) { toast('Select a category first', 'error'); return; }
                    setSuggestingPrice(true);
                    try {
                      const result = await calculateSmartPrice({
                        price: parseFloat(form.price) || 0,
                        category: form.category,
                        brand: form.brand,
                        condition: form.condition as 'new' | 'like_new' | 'good' | 'fair' | 'poor',
                      });
                      setForm(f => ({ ...f, price: String(result.suggestedPrice) }));
                      toast(`Smart price: R${result.suggestedPrice}`, 'success');
                    } catch { toast('Failed to calculate price', 'error'); }
                    setSuggestingPrice(false);
                  }}
                  disabled={suggestingPrice}
                  className="absolute right-2 top-[28px] p-1.5 text-[#c4a882]/60 hover:text-[#c4a882] transition-colors"
                  title="Suggest smart price"
                >
                  {suggestingPrice ? <Loader2 className="w-4 h-4 animate-spin" /> : <Tag className="w-4 h-4" />}
                </button>
              </div>
              <div><label className={labelClass('brand')}>Brand</label><input value={form.brand} onChange={e => setForm({ ...form, brand: e.target.value })} className={inputClass('brand')} placeholder="e.g. Nike" /></div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div><label className={labelClass('category')}>Category {errors.category && <span className="text-red-400 text-xs">({errors.category})</span>}</label><select required value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className={inputClass('category')}><option value="">Select...</option>{CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
              <div><label className={labelClass('size')}>Size {errors.size && <span className="text-red-400 text-xs">({errors.size})</span>}</label><select required value={form.size} onChange={e => setForm({ ...form, size: e.target.value })} className={inputClass('size')}><option value="">Select...</option>{SIZES.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
              <div><label className="block text-[11px] font-semibold uppercase tracking-wider text-white/50 mb-2">Condition</label><select required value={form.condition} onChange={e => setForm({ ...form, condition: e.target.value })} className={inputClass('condition')}>{CONDITIONS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}</select></div>
            </div>
            <div><label className="block text-[11px] font-semibold uppercase tracking-wider text-white/50 mb-2">Color</label><input value={form.color} onChange={e => setForm({ ...form, color: e.target.value })} className={inputClass('color')} placeholder="e.g. Navy Blue" /></div>
          </div>

          <div className="rounded-2xl border border-white/[0.04] bg-[#111111] p-6 space-y-4">
            <h3 className="text-sm font-medium text-white">Photos</h3>
            <div 
              className={`flex flex-wrap gap-3 min-h-[100px] p-4 rounded-xl border-2 border-dashed transition-all ${dragOver ? 'border-[#c4a882] bg-[#c4a882]/10' : 'border-white/10'}`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              {photos.map((url, idx) => (
                <motion.div key={url} initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} className="relative group">
                  <img src={url} alt="" className="w-24 h-24 rounded-xl object-cover bg-white/5 cursor-pointer" onClick={() => setLightbox({ open: true, index: idx })} />
                  <button type="button" onClick={() => removePhoto(idx)} className="absolute -top-2 -right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"><X className="w-3 h-3" /></button>
                </motion.div>
              ))}
              <label className="w-24 h-24 rounded-xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center cursor-pointer hover:border-[#c4a882]/50 transition-colors group">
                <Upload className="w-6 h-6 text-white/20 group-hover:text-[#c4a882] transition-colors" />
                <span className="text-xs text-white/20 mt-1 group-hover:text-[#c4a882] transition-colors">{uploading ? '...' : 'Add'}</span>
                <input type="file" accept="image/*" multiple className="hidden" onChange={handlePhotoUpload} disabled={uploading} />
              </label>
            </div>
            <p className="text-xs text-white/30">Drag & drop photos here or click to upload (max 10)</p>
          </div>

          <div className="rounded-2xl border border-white/[0.04] bg-[#111111] p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-white">Posting Platforms</h3>
              <span className="text-xs text-white/30">{form.platforms.length} selected</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {SA_PLATFORMS.map(platform => (
                <motion.button key={platform.id} type="button" whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }} onClick={() => togglePlatform(platform.id)}
                  className={`p-4 rounded-xl border text-left transition-all ${form.platforms.includes(platform.id) ? 'border-[#c4a882]/30 bg-[#c4a882]/10' : 'border-white/[0.04] bg-[#0c0c0c] hover:border-white/[0.08]'}`}>
                  <p className="font-medium text-white text-sm">{platform.name}</p>
                  <p className="text-xs text-white/30 mt-1">{platform.hasApi ? 'API' : 'Browser automation'}</p>
                </motion.button>
              ))}
            </div>
            {form.platforms.length > 0 && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setScheduleOpen(!scheduleOpen)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-[#c4a882]/30 text-[#c4a882] rounded-xl text-sm font-medium hover:bg-[#c4a882]/10 transition-colors"
                >
                  <Calendar className="w-4 h-4" />
                  Schedule Posting
                </button>
                {scheduleOpen && (
                  <div className="absolute top-full left-0 right-0 mt-2 rounded-2xl border border-white/[0.04] bg-[#111111] p-4 space-y-3 shadow-xl z-50">
                    <div>
                      <label className="block text-[11px] font-semibold uppercase tracking-wider text-white/50 mb-2">Date</label>
                      <input
                        type="date"
                        value={scheduledDate}
                        onChange={e => setScheduledDate(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-transparent text-white placeholder-white/20 focus:outline-none focus:border-[#c4a882] text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold uppercase tracking-wider text-white/50 mb-2">Time</label>
                      <input
                        type="time"
                        value={scheduledTime}
                        onChange={e => setScheduledTime(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-transparent text-white placeholder-white/20 focus:outline-none focus:border-[#c4a882] text-sm"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleSchedule}
                        disabled={scheduling}
                        className="flex-1 px-4 py-2 bg-[#c4a882] text-[#0c0c0c] rounded-full font-semibold text-sm hover:bg-[#d4b892] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {scheduling ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Schedule'}
                      </button>
                      <button
                        type="button"
                        onClick={() => { setScheduleOpen(false); setScheduledDate(''); setScheduledTime(''); }}
                        className="flex-1 px-4 py-2 border border-white/10 text-white/70 rounded-full font-medium text-sm hover:bg-white/5 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-white/[0.04] bg-[#111111] p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-white">Posting History</h3>
              <button type="button" onClick={fetchPostings} className="p-1.5 text-white/30 hover:text-white rounded-lg hover:bg-white/5 transition-all"><RefreshCw className="w-4 h-4" /></button>
            </div>
            {postingsLoading ? <div className="space-y-2">{[1, 2].map(i => <div key={i} className="h-10 rounded-lg bg-white/5" />)}</div> :
            postings.length === 0 ? <p className="text-sm text-white/30">No postings yet. Click "Post to Platforms" to start.</p> :
            <div className="space-y-2">{postings.map((p: any) => (
              <div key={p.id} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                <div className="flex items-center gap-3">
                  {p.status === 'posted' ? <CheckCircle className="w-4 h-4 text-[#c4a882]" /> : p.status === 'failed' ? <XCircle className="w-4 h-4 text-red-400" /> : <Clock className="w-4 h-4 text-amber-400" />}
                  <div><p className="text-sm text-white font-medium">{p.platform}</p><p className="text-xs text-white/40">{new Date(p.createdAt).toLocaleString()}</p>{p.error && <p className="text-xs text-red-400 mt-0.5">{p.error}</p>}</div>
                </div>
                {p.url && <a href={p.url} target="_blank" rel="noopener noreferrer" className="p-1.5 text-white/30 hover:text-[#c4a882] rounded-lg hover:bg-white/5 transition-all"><ExternalLink className="w-4 h-4" /></a>}
              </div>
            ))}</div>}
          </div>

          {priceHistory.length > 0 && (
            <div className="rounded-2xl border border-white/[0.04] bg-[#111111] p-6 space-y-4">
              <h3 className="text-sm font-medium text-white">Price History</h3>
              <div className="space-y-2">
                {priceHistory.map((ph: any) => (
                  <div key={ph.id} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                    <div>
                      <p className="text-sm text-white/40">{new Date(ph.changed_at).toLocaleString()}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {ph.old_price && <span className="text-sm text-white/40 line-through">R{ph.old_price}</span>}
                      <span className="text-sm text-[#c4a882] font-medium">R{ph.new_price}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="rounded-2xl border border-[#c4a882]/20 bg-[#c4a882]/5 p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-[#c4a882] mt-0.5 flex-shrink-0" />
            <div><p className="text-sm font-medium text-[#c4a882]">Automation Notice</p><p className="text-sm text-white/40 mt-1 font-light">Non-API platforms require browser automation. You will need to log in manually when the browser opens.</p></div>
          </div>

          <AnimatePresence>{automationStatus && <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="rounded-xl border border-[#c4a882]/20 bg-[#c4a882]/5 p-4 text-sm text-[#c4a882]">{automationStatus}</motion.div>}</AnimatePresence>

          <div className="flex flex-wrap gap-3">
            <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} type="submit" disabled={loading} className="px-8 py-4 bg-[#c4a882] text-[#0c0c0c] rounded-full font-semibold text-sm tracking-wide hover:bg-[#d4b892] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">{loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Save Changes</>}</motion.button>
            <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} type="button" onClick={() => setConfirmPost(true)} disabled={form.platforms.length === 0} className="inline-flex items-center gap-2 px-8 py-4 bg-white text-[#0c0c0c] rounded-full font-semibold text-sm tracking-wide hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"><Send className="w-4 h-4" /> Post to Platforms</motion.button>
            {form.status !== 'sold' && <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} type="button" onClick={markAsSold} className="inline-flex items-center gap-2 px-6 py-4 border border-white/10 text-white/70 rounded-full font-medium text-sm hover:bg-white/5 hover:text-white transition-all"><Tag className="w-4 h-4" /> Mark as Sold</motion.button>}
            <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} type="button" onClick={duplicateItem} disabled={loading} className="inline-flex items-center gap-2 px-6 py-4 border border-white/10 text-white/70 rounded-full font-medium text-sm hover:bg-white/5 hover:text-white transition-all disabled:opacity-50"><Copy className="w-4 h-4" /> Duplicate</motion.button>
            <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} type="button" onClick={() => setConfirmDelete(true)} className="inline-flex items-center gap-2 px-6 py-4 border border-red-500/20 text-red-400 rounded-full font-medium text-sm hover:bg-red-500/10 transition-all"><Trash2 className="w-4 h-4" /> Delete</motion.button>
            <Link href="/items" className="px-8 py-4 border border-white/10 text-white/70 rounded-full font-medium text-sm hover:bg-white/5 hover:text-white transition-all">Cancel</Link>
          </div>
        </form>
      </div>

      <ImageLightbox images={photos} index={lightbox.index} open={lightbox.open} onClose={() => setLightbox({ open: false, index: 0 })} onChange={idx => setLightbox(l => ({ ...l, index: idx }))} />
      <ConfirmDialog open={confirmDelete} title="Delete Item" message="Are you sure you want to delete this item? This cannot be undone." confirmText="Delete" variant="danger" onConfirm={deleteItem} onCancel={() => setConfirmDelete(false)} />
      <ConfirmDialog open={confirmPost} title="Post to Platforms" message={`This will open browser windows for ${form.platforms.length} platform(s). Make sure you are ready to log in manually if needed.`} confirmText="Start Posting" variant="info" onConfirm={runAutomation} onCancel={() => setConfirmPost(false)} />
    </PageTransition>
  );
}
