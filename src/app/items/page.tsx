'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Trash2, Edit3, Grid3X3, List, Package, Filter, CheckCircle, Copy, Tag, Send, Loader2, CheckSquare, Square, Upload, Download } from 'lucide-react';
import PageTransition from '@/components/PageTransition';
import ConfirmDialog from '@/components/ConfirmDialog';
import ImageLightbox from '@/components/ImageLightbox';
import { useToast } from '@/components/Toaster';
import { createClientBrowser } from '@/lib/supabase';

const STATUS_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'ready', label: 'Ready' },
  { value: 'posted', label: 'Posted' },
  { value: 'sold', label: 'Sold' },
];

export default function InventoryPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [lightbox, setLightbox] = useState<{ open: boolean; images: string[]; index: number }>({ open: false, images: [], index: 0 });
  const [confirm, setConfirm] = useState<{ open: boolean; id: string; title: string }>({ open: false, id: '', title: '' });
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [bulkPosting, setBulkPosting] = useState(false);
  const [confirmBulkPost, setConfirmBulkPost] = useState(false);
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({ current: 0, total: 0, status: '', errors: [] as string[] });
  const [csvImportOpen, setCsvImportOpen] = useState(false);
  const [csvImporting, setCsvImporting] = useState(false);
  const limit = 12;
  const { toast } = useToast();
  const supabase = createClientBrowser();

  const fetchItems = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('limit', String(limit));
    if (search) params.set('search', search);
    if (statusFilter) params.set('status', statusFilter);
    const res = await fetch(`/api/items?${params.toString()}`);
    const data = await res.json();
    setItems(data.items || []);
    setTotal(data.total || 0);
    setLoading(false);
  }, [page, search, statusFilter]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const deleteItem = async () => {
    setConfirm(c => ({ ...c, open: false }));
    await fetch(`/api/items/${confirm.id}`, { method: 'DELETE' });
    toast('Item deleted', 'success');
    fetchItems();
  };

  const markAsSold = async (id: string) => {
    await fetch(`/api/items/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'sold' }),
    });
    toast('Marked as sold', 'success');
    fetchItems();
  };

  const duplicateItem = async (item: any) => {
    const { data, error } = await supabase.from('items').insert({
      user_id: item.user_id,
      title: item.title + ' (Copy)',
      description: item.description,
      price: item.price,
      category: item.category,
      size: item.size,
      brand: item.brand,
      condition: item.condition,
      color: item.color,
      photos: item.photos,
      platforms: item.platforms,
      status: 'ready',
    }).select().single();
    if (error) { toast('Failed to duplicate', 'error'); return; }
    toast('Item duplicated', 'success');
    fetchItems();
  };

  const toggleSelection = (id: string) => {
    setSelectedItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selectedItems.size === items.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(items.map(i => i.id)));
    }
  };

  const handleBulkPost = async () => {
    setConfirmBulkPost(false);
    setBulkPosting(true);
    const selected = Array.from(selectedItems);
    setBulkProgress({ current: 0, total: selected.length, status: 'Starting...', errors: [] });

    let successCount = 0;
    let failCount = 0;
    const errors: string[] = [];

    for (let i = 0; i < selected.length; i++) {
      const itemId = selected[i];
      const item = items.find(i => i.id === itemId);
      
      setBulkProgress({ current: i + 1, total: selected.length, status: `Posting ${item?.title || 'item'}...`, errors });

      try {
        if (!item || !item.platforms?.length) {
          failCount++;
          errors.push(`${item?.title || itemId}: No platforms selected`);
          continue;
        }
        const res = await fetch('/api/automation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ itemId, platforms: item.platforms }),
        });
        const data = await res.json();
        if (data.success) successCount++;
        else {
          failCount++;
          errors.push(`${item?.title || itemId}: ${data.error || 'Failed'}`);
        }
      } catch (err: any) {
        failCount++;
        errors.push(`${item?.title || itemId}: ${err.message}`);
      }
    }

    setBulkProgress({ current: selected.length, total: selected.length, status: 'Complete', errors });
    setBulkPosting(false);
    setSelectedItems(new Set());
    toast(`Posting complete: ${successCount} started, ${failCount} failed`, successCount > 0 ? 'success' : 'error');
    fetchItems();
  };

  const handleBulkMarkSold = async () => {
    const selected = Array.from(selectedItems);
    for (const itemId of selected) {
      await fetch(`/api/items/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'sold' }),
      });
    }
    setSelectedItems(new Set());
    toast(`Marked ${selected.length} items as sold`, 'success');
    fetchItems();
  };

  const handleBulkDelete = async () => {
    setConfirmBulkDelete(false);
    try {
      const promises = Array.from(selectedItems).map(id =>
        fetch(`/api/items/${id}`, { method: 'DELETE' })
      );
      await Promise.all(promises);
      toast(`${selectedItems.size} items deleted`, 'success');
      setSelectedItems(new Set());
      fetchItems();
    } catch (error) {
      toast('Failed to delete items', 'error');
    }
  };

  const handleCsvImport = async (file: File) => {
    setCsvImporting(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/items/import', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Import failed');

      toast(`Imported ${data.imported} items${data.errors.length > 0 ? ` (${data.errors.length} errors)` : ''}`, 'success');
      setCsvImportOpen(false);
      fetchItems();
    } catch (error) {
      toast('Failed to import CSV', 'error');
    } finally {
      setCsvImporting(false);
    }
  };

  const handleCsvExport = async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      
      const res = await fetch(`/api/items/export?${params.toString()}`);
      if (!res.ok) throw new Error('Export failed');
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `thrift-list-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast('CSV exported successfully', 'success');
    } catch (error) {
      toast('Failed to export CSV', 'error');
    }
  };

  const [bulkEditPrice, setBulkEditPrice] = useState(false);
  const [bulkPriceValue, setBulkPriceValue] = useState('');
  const [bulkEditCategory, setBulkEditCategory] = useState(false);
  const [bulkCategoryValue, setBulkCategoryValue] = useState('');
  const [bulkEditCondition, setBulkEditCondition] = useState(false);
  const [bulkConditionValue, setBulkConditionValue] = useState('');

  const handleBulkPriceUpdate = async () => {
    const selected = Array.from(selectedItems);
    const price = parseFloat(bulkPriceValue);
    if (isNaN(price) || price <= 0) {
      toast('Invalid price', 'error');
      return;
    }
    for (const itemId of selected) {
      await fetch(`/api/items/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ price }),
      });
    }
    setBulkPriceValue('');
    setBulkEditPrice(false);
    setSelectedItems(new Set());
    toast(`Updated price for ${selected.length} items`, 'success');
    fetchItems();
  };

  const handleBulkCategoryUpdate = async () => {
    const selected = Array.from(selectedItems);
    if (!bulkCategoryValue) {
      toast('Please select a category', 'error');
      return;
    }
    for (const itemId of selected) {
      await fetch(`/api/items/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: bulkCategoryValue }),
      });
    }
    setBulkCategoryValue('');
    setBulkEditCategory(false);
    setSelectedItems(new Set());
    toast(`Updated category for ${selected.length} items`, 'success');
    fetchItems();
  };

  const handleBulkConditionUpdate = async () => {
    const selected = Array.from(selectedItems);
    if (!bulkConditionValue) {
      toast('Please select a condition', 'error');
      return;
    }
    for (const itemId of selected) {
      await fetch(`/api/items/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ condition: bulkConditionValue }),
      });
    }
    setBulkConditionValue('');
    setBulkEditCondition(false);
    setSelectedItems(new Set());
    toast(`Updated condition for ${selected.length} items`, 'success');
    fetchItems();
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <motion.h2 initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="text-2xl font-light text-white tracking-tight">Inventory</motion.h2>
            <p className="text-white/40 mt-1 text-sm">{total} items total</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleCsvExport}
              className="inline-flex items-center gap-2 px-4 py-2.5 border border-white/10 text-white/70 rounded-full font-semibold text-sm tracking-wide hover:bg-white/5 transition-colors"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
            <button
              onClick={() => setCsvImportOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 border border-white/10 text-white/70 rounded-full font-semibold text-sm tracking-wide hover:bg-white/5 transition-colors"
            >
              <Upload className="w-4 h-4" />
              Import CSV
            </button>
            {selectedItems.size > 0 && (
              <div className="flex items-center gap-2">
                <div className="relative">
                  <button
                    onClick={() => setBulkEditPrice(!bulkEditPrice)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#c4a882] text-[#0c0c0c] rounded-full font-semibold text-sm tracking-wide hover:bg-[#d4b892] transition-colors"
                  >
                    Bulk Actions ({selectedItems.size})
                  </button>
                  {bulkEditPrice && (
                    <div className="absolute top-full mt-2 right-0 w-64 rounded-2xl border border-white/[0.04] bg-[#111111] p-4 space-y-3 shadow-xl z-50">
                      <div>
                        <label className="block text-[11px] font-semibold uppercase tracking-wider text-white/50 mb-2">New Price (R)</label>
                        <input
                          type="number"
                          value={bulkPriceValue}
                          onChange={e => setBulkPriceValue(e.target.value)}
                          placeholder="0.00"
                          className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-transparent text-white placeholder-white/20 focus:outline-none focus:border-[#c4a882] text-sm"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button onClick={handleBulkPriceUpdate} className="flex-1 px-4 py-2 bg-[#c4a882] text-[#0c0c0c] rounded-full font-semibold text-sm hover:bg-[#d4b892] transition-colors">Update</button>
                        <button onClick={() => { setBulkEditPrice(false); setBulkPriceValue(''); }} className="flex-1 px-4 py-2 border border-white/10 text-white/70 rounded-full font-medium text-sm hover:bg-white/5 transition-colors">Cancel</button>
                      </div>
                    </div>
                  )}
                  {bulkEditCategory && (
                    <div className="absolute top-full mt-2 right-0 w-64 rounded-2xl border border-white/[0.04] bg-[#111111] p-4 space-y-3 shadow-xl z-50">
                      <div>
                        <label className="block text-[11px] font-semibold uppercase tracking-wider text-white/50 mb-2">Category</label>
                        <select
                          value={bulkCategoryValue}
                          onChange={e => setBulkCategoryValue(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-transparent text-white focus:outline-none focus:border-[#c4a882] text-sm"
                        >
                          <option value="">Select...</option>
                          {['Tops', 'Bottoms', 'Dresses', 'Outerwear', 'Shoes', 'Accessories', 'Bags', 'Jewelry', 'Activewear', 'Other'].map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={handleBulkCategoryUpdate} className="flex-1 px-4 py-2 bg-[#c4a882] text-[#0c0c0c] rounded-full font-semibold text-sm hover:bg-[#d4b892] transition-colors">Update</button>
                        <button onClick={() => { setBulkEditCategory(false); setBulkCategoryValue(''); }} className="flex-1 px-4 py-2 border border-white/10 text-white/70 rounded-full font-medium text-sm hover:bg-white/5 transition-colors">Cancel</button>
                      </div>
                    </div>
                  )}
                  {bulkEditCondition && (
                    <div className="absolute top-full mt-2 right-0 w-64 rounded-2xl border border-white/[0.04] bg-[#111111] p-4 space-y-3 shadow-xl z-50">
                      <div>
                        <label className="block text-[11px] font-semibold uppercase tracking-wider text-white/50 mb-2">Condition</label>
                        <select
                          value={bulkConditionValue}
                          onChange={e => setBulkConditionValue(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-transparent text-white focus:outline-none focus:border-[#c4a882] text-sm"
                        >
                          <option value="">Select...</option>
                          {['new', 'like_new', 'good', 'fair', 'poor'].map(c => <option key={c} value={c}>{c.replace('_', ' ')}</option>)}
                        </select>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={handleBulkConditionUpdate} className="flex-1 px-4 py-2 bg-[#c4a882] text-[#0c0c0c] rounded-full font-semibold text-sm hover:bg-[#d4b892] transition-colors">Update</button>
                        <button onClick={() => { setBulkEditCondition(false); setBulkConditionValue(''); }} className="flex-1 px-4 py-2 border border-white/10 text-white/70 rounded-full font-medium text-sm hover:bg-white/5 transition-colors">Cancel</button>
                      </div>
                    </div>
                  )}
                </div>
                <button
                  onClick={handleBulkMarkSold}
                  className="inline-flex items-center gap-2 px-4 py-2.5 border border-[#c4a882]/30 text-[#c4a882] rounded-full font-semibold text-sm tracking-wide hover:bg-[#c4a882]/10 transition-colors"
                >
                  Mark Sold
                </button>
                <button
                  onClick={() => setBulkEditCategory(!bulkEditCategory)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 border border-white/10 text-white/70 rounded-full font-semibold text-sm tracking-wide hover:bg-white/5 transition-colors"
                >
                  Set Category
                </button>
                <button
                  onClick={() => setBulkEditCondition(!bulkEditCondition)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 border border-white/10 text-white/70 rounded-full font-semibold text-sm tracking-wide hover:bg-white/5 transition-colors"
                >
                  Set Condition
                </button>
                <button
                  onClick={() => { setConfirmBulkPost(true); }}
                  disabled={bulkPosting}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-white text-[#0c0c0c] rounded-full font-semibold text-sm tracking-wide hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {bulkPosting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Post
                </button>
                <button
                  onClick={() => setConfirmBulkDelete(true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 border border-red-500/20 text-red-400 rounded-full font-semibold text-sm tracking-wide hover:bg-red-500/10 transition-colors"
                >
                  Delete
                </button>
              </div>
            )}
            <Link href="/items/new" className="inline-flex items-center gap-2 px-6 py-2.5 bg-white text-[#0c0c0c] rounded-full font-semibold text-sm tracking-wide hover:bg-white/90 transition-colors self-start">
              <Plus className="w-4 h-4" /> Add Item
            </Link>
          </div>
        </div>

        {/* CSV Import Modal */}
        {csvImportOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#111111] p-6 space-y-4 shadow-2xl">
              <div>
                <h3 className="text-lg font-semibold text-white">Import CSV</h3>
                <p className="text-sm text-white/60 mt-1">Upload a CSV file to import items in bulk.</p>
              </div>
              <div className="space-y-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-white/50">CSV File</label>
                <input
                  type="file"
                  accept=".csv"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) handleCsvImport(file);
                  }}
                  disabled={csvImporting}
                  className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-transparent text-white file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-[#c4a882] file:text-[#0c0c0c] file:text-sm focus:outline-none focus:border-[#c4a882] text-sm"
                />
              </div>
              <div className="text-xs text-white/40 space-y-1">
                <p>Expected columns: title, description, price, category, size, brand, condition, color, photos, platforms</p>
                <p>Photos should be comma-separated URLs. Platforms should be comma-separated.</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCsvImportOpen(false)}
                  disabled={csvImporting}
                  className="flex-1 px-4 py-2 border border-white/10 text-white/70 rounded-full font-medium text-sm hover:bg-white/5 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Bulk Progress */}
        {bulkPosting && (
          <div className="rounded-2xl border border-[#c4a882]/20 bg-[#c4a882]/5 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-[#c4a882]">Bulk Posting Progress</span>
              <span className="text-xs text-white/40">{bulkProgress.current} / {bulkProgress.total}</span>
            </div>
            <div className="h-2 rounded-full bg-white/10 overflow-hidden">
              <div 
                className="h-full bg-[#c4a882] transition-all duration-300" 
                style={{ width: `${(bulkProgress.current / bulkProgress.total) * 100}%` }}
              />
            </div>
            <p className="text-xs text-white/60">{bulkProgress.status}</p>
            {bulkProgress.errors.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs text-red-400 font-medium">Errors:</p>
                {bulkProgress.errors.slice(0, 3).map((error, i) => (
                  <p key={i} className="text-xs text-red-300/60">{error}</p>
                ))}
                {bulkProgress.errors.length > 3 && (
                  <p className="text-xs text-red-300/60">+{bulkProgress.errors.length - 3} more errors</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
            <input
              type="text"
              placeholder="Search items..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-white/10 bg-transparent text-white placeholder-white/20 focus:outline-none focus:border-[#c4a882] text-sm font-light"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-white/30" />
            <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} className="px-3 py-2.5 rounded-xl border border-white/10 bg-transparent text-white text-sm focus:outline-none focus:border-[#c4a882]">
              {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div className="flex gap-1 bg-[#111111] rounded-xl p-1 border border-white/[0.04]">
            <button onClick={() => setView('grid')} className={`p-2 rounded-lg transition-all ${view === 'grid' ? 'bg-[#c4a882]/10 text-[#c4a882]' : 'text-white/30 hover:text-white'}`}><Grid3X3 className="w-4 h-4" /></button>
            <button onClick={() => setView('list')} className={`p-2 rounded-lg transition-all ${view === 'list' ? 'bg-[#c4a882]/10 text-[#c4a882]' : 'text-white/30 hover:text-white'}`}><List className="w-4 h-4" /></button>
          </div>
        </div>

        {/* Items */}
        {loading ? (
          <div className={view === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4' : 'space-y-2'}>
            {Array.from({ length: 8 }).map((_, i) => <div key={i} className={`rounded-2xl shimmer ${view === 'grid' ? 'h-72' : 'h-20'}`} />)}
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-white/[0.04] bg-[#111111] p-12 text-center">
            <Package className="w-12 h-12 text-white/20 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white">No items found</h3>
            <p className="text-white/30 mt-1 mb-4">{search ? 'Try a different search term' : 'Add your first item to get started'}</p>
            {!search && <Link href="/items/new" className="text-[#c4a882] hover:text-[#d4b892] font-medium inline-flex items-center gap-1">Add Item <Plus className="w-4 h-4" /></Link>}
          </div>
        ) : view === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <AnimatePresence>
              {items.map((item, idx) => (
                <motion.div key={item.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ delay: idx * 0.03 }}>
                  <div className="group overflow-hidden h-full flex flex-col rounded-2xl border border-white/[0.04] bg-[#111111]">
                    <div className="relative aspect-square bg-white/[0.02] overflow-hidden cursor-pointer" onClick={() => { if (item.photos?.length) setLightbox({ open: true, images: item.photos, index: 0 }); }}>
                      {item.photos?.[0] ? (
                        <img src={item.photos[0]} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center"><Package className="w-10 h-10 text-white/20" /></div>
                      )}
                      <div className="absolute top-2 left-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleSelection(item.id); }}
                          className={`p-2 rounded-lg backdrop-blur-sm transition-all ${
                            selectedItems.has(item.id) ? 'bg-[#c4a882]/20 text-[#c4a882]' : 'bg-black/40 text-white/40 hover:bg-black/60 hover:text-white/60'
                          }`}
                        >
                          {selectedItems.has(item.id) ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                        </button>
                      </div>
                      <div className="absolute top-2 right-2 flex gap-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full border backdrop-blur-sm ${
                          item.status === 'sold' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
                          item.status === 'posted' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' :
                          'bg-blue-500/20 text-blue-300 border-blue-500/30'
                        }`}>{item.status}</span>
                      </div>
                    </div>
                    <div className="p-4 flex-1 flex flex-col">
                      <h3 className="font-medium text-white truncate">{item.title}</h3>
                      <p className="text-sm text-[#c4a882] mt-1">R{item.price}</p>
                      <p className="text-xs text-white/30 mt-1">{item.category} · {item.size} · {item.condition}</p>
                      <div className="flex gap-2 mt-3 pt-3 border-t border-white/[0.04]">
                        <Link href={`/items/${item.id}`} className="flex-1 text-center py-1.5 rounded-lg bg-white/[0.02] hover:bg-white/[0.05] text-white/60 hover:text-white text-xs font-medium transition-all">Edit</Link>
                        <button onClick={() => setConfirm({ open: true, id: item.id, title: item.title })} className="p-1.5 rounded-lg bg-white/[0.02] hover:bg-red-500/20 text-white/30 hover:text-red-400 transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="rounded-2xl border border-white/[0.04] bg-[#111111] overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-white/[0.04]">
                <tr>
                  <th className="px-4 py-3 font-medium text-white/30 w-10">
                    <button onClick={selectAll} className="text-white/30 hover:text-white transition-colors">
                      {selectedItems.size === items.length ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                    </button>
                  </th>
                  <th className="px-4 py-3 font-medium text-white/30">Item</th>
                  <th className="px-4 py-3 font-medium text-white/30">Category</th>
                  <th className="px-4 py-3 font-medium text-white/30">Price</th>
                  <th className="px-4 py-3 font-medium text-white/30">Status</th>
                  <th className="px-4 py-3 font-medium text-white/30 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                <AnimatePresence>
                  {items.map((item) => (
                    <motion.tr key={item.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-3">
                        <button onClick={() => toggleSelection(item.id)} className="text-white/30 hover:text-white transition-colors">
                          {selectedItems.has(item.id) ? <CheckSquare className="w-4 h-4 text-[#c4a882]" /> : <Square className="w-4 h-4" />}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {item.photos?.[0] ? <img src={item.photos[0]} alt="" className="w-10 h-10 rounded-lg object-cover border border-white/[0.04]" /> : <div className="w-10 h-10 rounded-lg bg-white/[0.02] flex items-center justify-center"><Package className="w-4 h-4 text-white/20" /></div>}
                          <div>
                            <Link href={`/items/${item.id}`} className="text-white hover:text-[#c4a882] transition-colors font-medium text-sm">{item.title}</Link>
                            <p className="text-xs text-white/30">{item.size} · {item.condition}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-white/50 text-sm">{item.category}</td>
                      <td className="px-4 py-3 text-[#c4a882] text-sm font-medium">R{item.price}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${
                          item.status === 'sold' ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' :
                          item.status === 'posted' ? 'bg-amber-500/10 text-amber-300 border-amber-500/20' :
                          'bg-blue-500/10 text-blue-300 border-blue-500/20'
                        }`}>{item.status}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {item.status !== 'sold' && (
                            <button onClick={() => markAsSold(item.id)} className="p-1.5 rounded-lg hover:bg-emerald-500/20 text-white/30 hover:text-emerald-400 transition-all" title="Mark as sold"><Tag className="w-3.5 h-3.5" /></button>
                          )}
                          <button onClick={() => duplicateItem(item)} className="p-1.5 rounded-lg hover:bg-white/[0.05] text-white/30 hover:text-white transition-all" title="Duplicate"><Copy className="w-3.5 h-3.5" /></button>
                          <Link href={`/items/${item.id}`} className="p-1.5 rounded-lg hover:bg-white/[0.05] text-white/30 hover:text-white transition-all"><Edit3 className="w-3.5 h-3.5" /></Link>
                          <button onClick={() => setConfirm({ open: true, id: item.id, title: item.title })} className="p-1.5 rounded-lg hover:bg-red-500/20 text-white/30 hover:text-red-400 transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-4 py-2 rounded-full border border-white/10 text-white/60 hover:bg-white/5 disabled:opacity-30 text-sm">Previous</button>
            <span className="text-sm text-white/40 px-2">Page {page} of {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-4 py-2 rounded-full border border-white/10 text-white/60 hover:bg-white/5 disabled:opacity-30 text-sm">Next</button>
          </div>
        )}
      </div>

      <ConfirmDialog open={confirm.open} title="Delete Item" message={`Are you sure you want to delete "${confirm.title}"? This action cannot be undone.`} confirmText="Delete" variant="danger" onConfirm={deleteItem} onCancel={() => setConfirm(c => ({ ...c, open: false }))} />
      <ConfirmDialog open={confirmBulkPost} title="Post Selected Items" message={`This will start posting automation for ${selectedItems.size} item(s). Browser windows will open for each platform. Make sure you are ready to log in manually if needed.`} confirmText="Start Posting" variant="info" onConfirm={handleBulkPost} onCancel={() => setConfirmBulkPost(false)} />
      <ConfirmDialog open={confirmBulkDelete} title="Delete Selected Items" message={`Are you sure you want to delete ${selectedItems.size} item(s)? This action cannot be undone.`} confirmText="Delete" variant="danger" onConfirm={handleBulkDelete} onCancel={() => setConfirmBulkDelete(false)} />
      <ImageLightbox images={lightbox.images} index={lightbox.index} open={lightbox.open} onClose={() => setLightbox(l => ({ ...l, open: false }))} onChange={idx => setLightbox(l => ({ ...l, index: idx }))} />
    </PageTransition>
  );
}
