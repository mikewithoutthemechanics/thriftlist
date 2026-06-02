'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, Upload, X, Sparkles, AlertCircle, CheckCircle, Loader2, Wand2, Tag, DollarSign, Calendar, Camera, SwitchCamera } from 'lucide-react';
import { CATEGORIES, SIZES, CONDITIONS, SA_PLATFORMS } from '@/lib/types';
import { optimizeFullListing } from '@/lib/ai-optimization';
import AnimatedCard from '@/components/AnimatedCard';
import PageTransition from '@/components/PageTransition';
import ConfirmDialog from '@/components/ConfirmDialog';
import { useToast } from '@/components/Toaster';

export default function NewItemPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [nextRoute, setNextRoute] = useState('');

  const [aiLoading, setAiLoading] = useState<'description' | 'title' | 'price' | 'photo' | 'magic' | null>(null);
  const [aiSuggestions, setAiSuggestions] = useState({
    title: '',
    price: '',
  });
  const [photoParsing, setPhotoParsing] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<'user' | 'environment'>('environment');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [scheduleDate, setScheduleDate] = useState('');
  const [dragPhotoIndex, setDragPhotoIndex] = useState<number | null>(null);

  const magicOptimize = async () => {
    if (!form.title || !form.category || !form.size || !form.condition) {
      toast('Please fill in at least title, category, size, and condition first', 'warning');
      return;
    }
    setAiLoading('magic');
    try {
      const result = await optimizeFullListing({
        title: form.title,
        description: form.description,
        price: parseFloat(form.price) || 0,
        category: form.category,
        brand: form.brand,
        size: form.size,
        condition: form.condition as any,
        color: form.color,
      });
      if (result) {
        setForm(f => ({
          ...f,
          title: result.title || f.title,
          description: result.description || f.description,
          price: result.price ? String(result.price) : f.price,
        }));
        toast('Listing optimized with AI', 'success');
      } else {
        toast('Could not optimize listing', 'error');
      }
    } catch {
      toast('Optimization failed', 'error');
    } finally {
      setAiLoading(null);
    }
  };

  const [form, setForm] = useState({
    title: '', description: '', price: '', category: '', size: '', brand: '', condition: 'good', color: '', platforms: [] as string[],
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

  const handleChange = (field: string, value: any) => {
    setForm(f => ({ ...f, [field]: value }));
    setHasChanges(true);
    if (errors[field]) setErrors(err => { const n = { ...err }; delete n[field]; return n; });
  };

  const startCamera = async () => {
    setCameraOpen(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: cameraFacing },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (err) {
      toast('Could not access camera. Please allow camera permissions.', 'error');
      setCameraOpen(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setCameraOpen(false);
  };

  const switchCamera = async () => {
    const next = cameraFacing === 'user' ? 'environment' : 'user';
    setCameraFacing(next);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: next },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch {
      toast('Could not switch camera', 'error');
    }
  };

  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;

    // Compress: max 1200px on longest side
    const MAX_DIM = 1200;
    let w = video.videoWidth;
    let h = video.videoHeight;
    if (w > h && w > MAX_DIM) { h = Math.round(h * (MAX_DIM / w)); w = MAX_DIM; }
    else if (h > MAX_DIM) { w = Math.round(w * (MAX_DIM / h)); h = MAX_DIM; }

    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, w, h);

    stopCamera();

    // Convert compressed canvas to blob and upload
    canvas.toBlob(async (blob) => {
      if (!blob) return;
      setUploading(true);
      const data = new FormData();
      data.append('file', blob, `camera-photo-${Date.now()}.jpg`);
      try {
        const res = await fetch('/api/upload', { method: 'POST', body: data });
        const json = await res.json();
        if (json.url) {
          setPhotos(p => [...p, json.url]);
          toast('Photo captured!', 'success');
          // Auto-parse with AI
          parsePhoto(json.url);
        } else {
          toast(json.error || 'Upload failed', 'error');
        }
      } catch {
        toast('Upload failed', 'error');
      } finally {
        setUploading(false);
      }
    }, 'image/jpeg', 0.85);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    if (photos.length + files.length > 10) { toast('Maximum 10 photos total', 'error'); return; }

    setUploading(true);
    let uploaded = 0;
    for (const file of files) {
      if (!file.type.startsWith('image/')) { toast(`Skipped ${file.name} (not an image)`, 'warning'); continue; }
      if (file.size > 5 * 1024 * 1024) { toast(`Skipped ${file.name} (over 5MB)`, 'warning'); continue; }
      const data = new FormData();
      data.append('file', file);
      try {
        const res = await fetch('/api/upload', { method: 'POST', body: data });
        const json = await res.json();
        if (json.url) { setPhotos(p => [...p, json.url]); uploaded++; }
        else toast(`${file.name}: ${json.error || 'Upload failed'}`, 'error');
      } catch {
        toast(`${file.name}: Upload failed`, 'error');
      }
    }
    if (uploaded > 0) { setHasChanges(true); toast(`${uploaded} photo(s) uploaded`, 'success'); }
    setUploading(false);
  };

  const removePhoto = (idx: number) => { setPhotos(p => p.filter((_, i) => i !== idx)); setHasChanges(true); };

  const movePhoto = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    setPhotos(prev => {
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
    setHasChanges(true);
  };

  const parsePhoto = async (photoUrl: string) => {
    setPhotoParsing(true);
    try {
      // Fetch image and convert to base64
      const res = await fetch(photoUrl);
      const blob = await res.blob();
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve) => {
        reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
        reader.readAsDataURL(blob);
      });

      const aiRes = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'parse_photo',
          data: { imageBase64: base64 },
        }),
      });
      const json = await aiRes.json();
      const r = json.result;
      if (r?.title) {
        setForm(f => ({
          ...f,
          title: r.title || f.title,
          description: r.description || f.description,
          brand: r.brand || f.brand,
          color: r.color || f.color,
          size: r.size || f.size,
          condition: (r.condition as any) || f.condition,
          category: r.category || f.category,
        }));
        toast('Photo parsed! Details auto-filled.', 'success');
      } else {
        toast(json.error || 'Could not parse photo', 'error');
      }
    } catch (err) {
      toast('Photo parsing failed', 'error');
    } finally {
      setPhotoParsing(false);
    }
  };

  const togglePlatform = (id: string) => {
    setForm(f => ({ ...f, platforms: f.platforms.includes(id) ? f.platforms.filter(p => p !== id) : [...f.platforms, id] }));
    setHasChanges(true);
  };

  const generateAIDescription = async () => {
    if (!form.title || !form.category || !form.size || !form.condition) {
      toast('Please fill in title, category, size, and condition first', 'warning');
      return;
    }
    setAiLoading('description');
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'description',
          data: { title: form.title, category: form.category, size: form.size, condition: form.condition, brand: form.brand, color: form.color },
        }),
      });
      const json = await res.json();
      if (json.result) {
        handleChange('description', json.result);
        toast('Description generated', 'success');
      } else {
        toast(json.error || 'Failed to generate description', 'error');
      }
    } catch (err) {
      toast('Failed to generate description', 'error');
    } finally {
      setAiLoading(null);
    }
  };

  const generateAITitle = async () => {
    if (!form.category || !form.size || !form.condition) {
      toast('Please fill in category, size, and condition first', 'warning');
      return;
    }
    setAiLoading('title');
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'title',
          data: { category: form.category, size: form.size, condition: form.condition, brand: form.brand, color: form.color },
        }),
      });
      const json = await res.json();
      if (json.result) {
        setAiSuggestions(s => ({ ...s, title: json.result }));
        toast('Title suggestion generated', 'success');
      } else {
        toast(json.error || 'Failed to generate title', 'error');
      }
    } catch (err) {
      toast('Failed to generate title', 'error');
    } finally {
      setAiLoading(null);
    }
  };

  const generateAIPrice = async () => {
    if (!form.category || !form.condition) {
      toast('Please fill in category and condition first', 'warning');
      return;
    }
    setAiLoading('price');
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'price',
          data: { category: form.category, condition: form.condition, brand: form.brand },
        }),
      });
      const json = await res.json();
      if (json.result) {
        setAiSuggestions(s => ({ ...s, price: json.result }));
        toast('Price suggestion generated', 'success');
      } else {
        toast(json.error || 'Failed to generate price', 'error');
      }
    } catch (err) {
      toast('Failed to generate price', 'error');
    } finally {
      setAiLoading(null);
    }
  };

  const applySuggestion = (field: 'title' | 'price') => {
    handleChange(field, aiSuggestions[field]);
    setAiSuggestions(s => ({ ...s, [field]: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) { toast('Please fix the errors', 'warning'); return; }
    setLoading(true);

    // Create item
    const res = await fetch('/api/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, price: parseFloat(form.price), photos, platforms: form.platforms }),
    });
    const json = await res.json();

    if (json.success && scheduleDate) {
      // Also schedule the posting
      await fetch('/api/scheduled-postings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId: json.id,
          platforms: form.platforms,
          scheduledAt: new Date(scheduleDate).toISOString(),
        }),
      });
    }

    setLoading(false);
    if (json.success) {
      toast(scheduleDate ? 'Item saved & scheduled' : 'Item created successfully', 'success');
      router.push('/items');
    } else {
      toast(json.error || 'Failed to create item', 'error');
    }
  };

  const inputClass = (field: string) => `w-full px-4 py-3 rounded-xl border ${errors[field] ? 'border-red-500/50 focus:ring-red-500/50' : 'border-white/10 focus:ring-[accent]/50'} bg-transparent text-white placeholder-white/20 focus:outline-none focus:border-b-2 focus:ring-0 transition-all text-sm font-light`;
  const labelClass = (field: string) => `block text-[11px] font-semibold uppercase tracking-wider text-white/50 mb-2`;

  return (
    <PageTransition>
      <div className="max-w-2xl">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3 mb-8">
          <Link href="/items" className="p-2 text-white/30 hover:text-white rounded-xl hover:bg-white/5 transition-all" onClick={e => { if (hasChanges) { e.preventDefault(); setNextRoute('/items'); setShowLeaveConfirm(true); } }}>
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h2 className="text-2xl font-light text-white tracking-tight">Add New Item</h2>
        </motion.div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div data-tour="ai-buttons" className="rounded-2xl border border-white/[0.04] bg-[#111111] p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-white">Basic Info</h3>
              <button
                type="button"
                onClick={magicOptimize}
                disabled={aiLoading === 'magic'}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[accent]/10 border border-[accent]/20 text-[accent] rounded-lg text-xs font-medium hover:bg-[accent]/20 transition-colors disabled:opacity-50"
              >
                {aiLoading === 'magic' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                Magic Optimize
              </button>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className={labelClass('title')}>Title {errors.title && <span className="text-red-400 text-xs">({errors.title})</span>}</label>
                <button type="button" onClick={generateAITitle} disabled={aiLoading === 'title'} className="text-[11px] font-medium uppercase tracking-wider text-[accent] hover:text-[accent] transition-colors flex items-center gap-1.5 disabled:opacity-50">
                  {aiLoading === 'title' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
                  AI Suggest
                </button>
              </div>
              {aiSuggestions.title && (
                <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="mb-2 p-3 rounded-lg bg-[accent]/10 border border-[accent]/20">
                  <p className="text-sm text-white/70 mb-2">{aiSuggestions.title}</p>
                  <button type="button" onClick={() => applySuggestion('title')} className="text-xs font-medium text-[accent] hover:text-[accent]">Use this title</button>
                </motion.div>
              )}
              <input 
                id="title"
                value={form.title} 
                onChange={e => handleChange('title', e.target.value)} 
                className={inputClass('title')} 
                placeholder="e.g. Vintage Levi's Denim Jacket"
                aria-invalid={!!errors.title}
                aria-describedby={errors.title ? 'title-error' : undefined}
              />
              {errors.title && <span id="title-error" className="sr-only">{errors.title}</span>}
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className={labelClass('description')}>Description {errors.description && <span className="text-red-400 text-xs">({errors.description})</span>}</label>
                <button type="button" onClick={generateAIDescription} disabled={aiLoading === 'description'} className="text-[11px] font-medium uppercase tracking-wider text-[accent] hover:text-[accent] transition-colors flex items-center gap-1.5 disabled:opacity-50">
                  {aiLoading === 'description' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
                  AI Generate
                </button>
              </div>
              <textarea 
                id="description"
                rows={5} 
                value={form.description} 
                onChange={e => handleChange('description', e.target.value)} 
                className={inputClass('description')} 
                placeholder="Describe the item, material, fit, flaws..."
                aria-invalid={!!errors.description}
                aria-describedby={errors.description ? 'description-error' : undefined}
              />
              {errors.description && <span id="description-error" className="sr-only">{errors.description}</span>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className={labelClass('price')}>Price (R) {errors.price && <span className="text-red-400 text-xs">({errors.price})</span>}</label>
                  <button type="button" onClick={generateAIPrice} disabled={aiLoading === 'price'} className="text-[11px] font-medium uppercase tracking-wider text-[accent] hover:text-[accent] transition-colors flex items-center gap-1.5 disabled:opacity-50">
                    {aiLoading === 'price' ? <Loader2 className="w-3 h-3 animate-spin" /> : <DollarSign className="w-3 h-3" />}
                    AI Suggest
                  </button>
                </div>
                {aiSuggestions.price && (
                  <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="mb-2 p-3 rounded-lg bg-[accent]/10 border border-[accent]/20">
                    <p className="text-sm text-white/70 mb-2">R{aiSuggestions.price}</p>
                    <button type="button" onClick={() => applySuggestion('price')} className="text-xs font-medium text-[accent] hover:text-[accent]">Use this price</button>
                  </motion.div>
                )}
                <input 
                id="price"
                type="number" 
                step="0.01" 
                value={form.price} 
                onChange={e => handleChange('price', e.target.value)} 
                className={inputClass('price')} 
                placeholder="0.00"
                aria-invalid={!!errors.price}
                aria-describedby={errors.price ? 'price-error' : undefined}
              />
              {errors.price && <span id="price-error" className="sr-only">{errors.price}</span>}
              </div>
              <div>
                <label className={labelClass('brand')}>Brand</label>
                <input value={form.brand} onChange={e => handleChange('brand', e.target.value)} className={inputClass('brand')} placeholder="e.g. Nike, Zara" />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className={labelClass('category')} htmlFor="category">Category {errors.category && <span className="text-red-400 text-xs">({errors.category})</span>}</label>
                <select 
                  id="category"
                  value={form.category} 
                  onChange={e => handleChange('category', e.target.value)} 
                  className={inputClass('category')}
                  aria-invalid={!!errors.category}
                  aria-describedby={errors.category ? 'category-error' : undefined}
                >
                  <option value="">Select...</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                {errors.category && <span id="category-error" className="sr-only">{errors.category}</span>}
              </div>
              <div>
                <label className={labelClass('size')} htmlFor="size">Size {errors.size && <span className="text-red-400 text-xs">({errors.size})</span>}</label>
                <select 
                  id="size"
                  value={form.size} 
                  onChange={e => handleChange('size', e.target.value)} 
                  className={inputClass('size')}
                  aria-invalid={!!errors.size}
                  aria-describedby={errors.size ? 'size-error' : undefined}
                >
                  <option value="">Select...</option>
                  {SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                {errors.size && <span id="size-error" className="sr-only">{errors.size}</span>}
              </div>
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-white/50 mb-2">Condition</label>
                <select value={form.condition} onChange={e => handleChange('condition', e.target.value)} className={inputClass('condition')}>
                  {CONDITIONS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-white/50 mb-2">Color</label>
              <input value={form.color} onChange={e => handleChange('color', e.target.value)} className={inputClass('color')} placeholder="e.g. Navy Blue" />
            </div>
          </div>

          <div className="rounded-2xl border border-white/[0.04] bg-[#111111] p-6 space-y-4">
            <h3 className="text-sm font-medium text-white">Photos</h3>
            <div className="flex flex-wrap gap-3">
              {photos.map((url, idx) => (
                <motion.div
                  key={url}
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  draggable
                  onDragStart={() => setDragPhotoIndex(idx)}
                  onDragOver={(e) => { e.preventDefault(); }}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (dragPhotoIndex !== null) {
                      movePhoto(dragPhotoIndex, idx);
                      setDragPhotoIndex(null);
                    }
                  }}
                  className={`relative group cursor-move ${dragPhotoIndex === idx ? 'opacity-50' : ''}`}
                >
                  <img src={url} alt="" className="w-24 h-24 rounded-xl object-cover bg-white/5" />
                  <span className="absolute top-1 left-1 px-1.5 py-0.5 bg-black/50 text-white text-[9px] font-bold rounded-md">{idx + 1}</span>
                  <button type="button" onClick={() => removePhoto(idx)} className="absolute -top-2 -right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"><X className="w-3 h-3" /></button>
                  <button type="button" onClick={() => parsePhoto(url)} disabled={photoParsing} className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-[accent] text-black text-[10px] font-bold rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg whitespace-nowrap">
                    {photoParsing ? 'Scanning...' : 'Scan'}
                  </button>
                </motion.div>
              ))}
              <button
                type="button"
                onClick={startCamera}
                disabled={uploading}
                className="w-24 h-24 rounded-xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center hover:border-[accent]/50 transition-colors group disabled:opacity-50"
              >
                <Camera className="w-6 h-6 text-white/20 group-hover:text-[accent] transition-colors" />
                <span className="text-xs text-white/20 mt-1 group-hover:text-[accent] transition-colors">Camera</span>
              </button>
              <label className="w-24 h-24 rounded-xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center cursor-pointer hover:border-[accent]/50 transition-colors group">
                <Upload className="w-6 h-6 text-white/20 group-hover:text-[accent] transition-colors" />
                <span className="text-xs text-white/20 mt-1 group-hover:text-[accent] transition-colors">{uploading ? '...' : 'Add'}</span>
                <input type="file" accept="image/*" multiple className="hidden" onChange={handlePhotoUpload} disabled={uploading} />
              </label>
            </div>
          </div>

          {/* Camera Modal */}
          {cameraOpen && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4">
              <div className="relative w-full max-w-2xl aspect-[4/3] rounded-2xl overflow-hidden bg-black border border-white/10">
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                <canvas ref={canvasRef} className="hidden" />

                {/* Close */}
                <button onClick={stopCamera} className="absolute top-4 right-4 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors">
                  <X className="w-5 h-5" />
                </button>

                {/* Switch camera */}
                <button onClick={switchCamera} className="absolute top-4 left-4 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors">
                  <SwitchCamera className="w-5 h-5" />
                </button>

                {/* Capture */}
                <div className="absolute bottom-6 left-0 right-0 flex justify-center">
                  <button
                    onClick={capturePhoto}
                    disabled={uploading}
                    className="w-16 h-16 rounded-full border-4 border-white/30 bg-white/20 hover:bg-white/40 transition-colors disabled:opacity-50 flex items-center justify-center"
                  >
                    <div className="w-12 h-12 rounded-full bg-white" />
                  </button>
                </div>

                <p className="absolute bottom-20 left-0 right-0 text-center text-xs text-white/60">
                  Tap the shutter to capture
                </p>
              </div>
            </motion.div>
          )}

          <div data-tour="platform-select" className="rounded-2xl border border-white/[0.04] bg-[#111111] p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-white">Platforms</h3>
              <button
                type="button"
                onClick={() => {
                  const allIds = SA_PLATFORMS.map(p => p.id);
                  if (form.platforms.length === allIds.length) {
                    setForm(f => ({ ...f, platforms: [] }));
                  } else {
                    setForm(f => ({ ...f, platforms: allIds }));
                  }
                }}
                className="text-[11px] font-medium text-[accent] hover:text-[accent] transition-colors"
              >
                {form.platforms.length === SA_PLATFORMS.length ? 'Clear All' : 'Select All'}
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {SA_PLATFORMS.map(platform => (
                <motion.button key={platform.id} type="button" whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }} onClick={() => togglePlatform(platform.id)}
                  className={`p-4 rounded-xl border text-left transition-all ${form.platforms.includes(platform.id) ? 'border-[accent]/30 bg-[accent]/10' : 'border-white/[0.04] bg-[#0c0c0c] hover:border-white/[0.08]'}`}>
                  <p className="font-medium text-white text-sm">{platform.name}</p>
                  <p className="text-xs text-white/30 mt-1">{platform.hasApi ? 'API' : 'Browser automation'}</p>
                </motion.button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-white/[0.04] bg-[#111111] p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[accent]" />
              <h3 className="text-sm font-medium text-white">Schedule Posting</h3>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="datetime-local"
                value={scheduleDate}
                onChange={e => setScheduleDate(e.target.value)}
                className="flex-1 px-4 py-3 rounded-xl border border-white/10 bg-transparent text-white focus:outline-none focus:border-[accent] text-sm font-light"
              />
              {scheduleDate && (
                <button type="button" onClick={() => setScheduleDate('')} className="text-xs text-white/40 hover:text-white underline">Clear</button>
              )}
            </div>
            {scheduleDate && (
              <p className="text-xs text-[accent]">
                Item will be posted automatically at {new Date(scheduleDate).toLocaleString()}
              </p>
            )}
            <p className="text-xs text-white/30">
              Note: Scheduled postings currently process once per day. Pick a date — the exact time may vary slightly.
            </p>
          </div>

          <div className="rounded-2xl border border-[accent]/20 bg-[accent]/5 p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-[accent] mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-[accent]">Automation Notice</p>
              <p className="text-sm text-white/40 mt-1 font-light">Posting runs via Browserbase cloud automation. Authenticate each platform in Settings &gt; Platform Authentication before posting.</p>
            </div>
          </div>

          <div className="flex gap-3">
            <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} type="submit" disabled={loading}
              className="px-8 py-4 bg-[accent] text-[#0c0c0c] rounded-full font-semibold text-sm tracking-wide hover:bg-[accent] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CheckCircle className="w-4 h-4" /> {scheduleDate ? 'Save & Schedule' : 'Save Item'}</>}
            </motion.button>
            <Link href="/items" onClick={e => { if (hasChanges) { e.preventDefault(); setNextRoute('/items'); setShowLeaveConfirm(true); } }}
              className="px-8 py-4 border border-white/10 text-white/70 rounded-full font-medium text-sm hover:bg-white/5 hover:border-white/20 hover:text-white transition-all">
              Cancel
            </Link>
          </div>
        </form>
      </div>

      <ConfirmDialog open={showLeaveConfirm} title="Unsaved Changes" message="You have unsaved changes. Are you sure you want to leave?" confirmText="Leave" variant="warning"
        onConfirm={() => { setShowLeaveConfirm(false); setHasChanges(false); router.push(nextRoute); }} onCancel={() => setShowLeaveConfirm(false)} />
    </PageTransition>
  );
}
