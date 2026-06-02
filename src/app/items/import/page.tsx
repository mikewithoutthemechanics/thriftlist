'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, Upload, Download, CheckCircle, AlertCircle, Loader2, FileSpreadsheet, XCircle } from 'lucide-react';
import PageTransition from '@/components/PageTransition';
import { useToast } from '@/components/Toaster';

export default function BulkImportPage() {
  const router = useRouter();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{ imported: number; total: number; errors: any[] } | null>(null);

  const handleFile = (f: File) => {
    if (!f.name.endsWith('.csv')) {
      toast('Please upload a CSV file', 'error');
      return;
    }
    setFile(f);
    setResult(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const handleSubmit = async () => {
    if (!file) { toast('Please select a CSV file', 'warning'); return; }
    setUploading(true);
    setResult(null);
    const data = new FormData();
    data.append('file', file);
    try {
      const res = await fetch('/api/items/import', { method: 'POST', body: data });
      const json = await res.json();
      if (json.success) {
        setResult({ imported: json.imported, total: json.total, errors: json.errors || [] });
        toast(`Imported ${json.imported} of ${json.total} items`, json.errors?.length ? 'warning' : 'success');
      } else {
        toast(json.error || 'Import failed', 'error');
      }
    } catch {
      toast('Import failed', 'error');
    } finally {
      setUploading(false);
    }
  };

  const downloadTemplate = () => {
    const link = document.createElement('a');
    link.href = '/templates/bulk-upload-template.csv';
    link.download = 'bulk-upload-template.csv';
    link.click();
    toast('Template downloaded', 'success');
  };

  return (
    <PageTransition>
      <div className="max-w-2xl">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3 mb-8">
          <Link href="/items" className="p-2 text-white/30 hover:text-white rounded-xl hover:bg-white/5 transition-all">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h2 className="text-2xl font-light text-white tracking-tight">Bulk Import</h2>
        </motion.div>

        <div className="space-y-6">
          {/* Template */}
          <div className="rounded-2xl border border-white/[0.04] bg-[#111111] p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-white">CSV Template</h3>
              <FileSpreadsheet className="w-4 h-4 text-accent" />
            </div>
            <p className="text-sm text-white/40 font-light">
              Download the template, fill it with your items, then upload it below. Each row becomes one item.
            </p>
            <div className="rounded-xl border border-white/[0.04] bg-[#0c0c0c] p-4 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-white/30">Required Columns</p>
              <code className="block text-sm text-accent font-mono">
                title, description, price, category, size, brand, condition, color, photos, platforms
              </code>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <p className="text-xs text-white/30"><span className="text-white/50">category:</span> Tops, Bottoms, Dresses, Outerwear, Shoes, Accessories, Activewear, Swimwear, Formal Wear, Vintage</p>
                <p className="text-xs text-white/30"><span className="text-white/50">condition:</span> new, like_new, good, fair, poor</p>
                <p className="text-xs text-white/30"><span className="text-white/50">size:</span> XS, S, M, L, XL, XXL, 3XL, One Size</p>
                <p className="text-xs text-white/30"><span className="text-white/50">platforms:</span> facebook_marketplace, yaga, gumtree, olx, junkmail</p>
                <p className="text-xs text-white/30 col-span-2"><span className="text-white/50">photos:</span> comma-separated URLs (optional)</p>
              </div>
            </div>
            <button
              type="button"
              onClick={downloadTemplate}
              className="inline-flex items-center gap-2 px-4 py-2.5 border border-accent/30 text-accent rounded-xl text-sm font-medium hover:bg-accent/10 transition-colors"
            >
              <Download className="w-4 h-4" />
              Download Template
            </button>
          </div>

          {/* Upload */}
          <div className="rounded-2xl border border-white/[0.04] bg-[#111111] p-6 space-y-4">
            <h3 className="text-sm font-medium text-white">Upload CSV</h3>
            <div
              className={`relative rounded-xl border-2 border-dashed transition-all p-8 text-center ${
                dragOver ? 'border-accent bg-accent/10' : file ? 'border-accent/30 bg-accent/5' : 'border-white/10'
              }`}
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onClick={() => fileRef.current?.click()}
            >
              <input
                ref={fileRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
              />
              <Upload className={`w-8 h-8 mx-auto mb-3 ${file ? 'text-accent' : 'text-white/20'}`} />
              {file ? (
                <div>
                  <p className="text-sm text-white font-medium">{file.name}</p>
                  <p className="text-xs text-white/30 mt-1">{(file.size / 1024).toFixed(1)} KB</p>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setFile(null); setResult(null); }}
                    className="mt-2 text-xs text-red-400 hover:text-red-300 underline"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div>
                  <p className="text-sm text-white/50">Drag & drop a CSV file here or click to browse</p>
                  <p className="text-xs text-white/30 mt-1">.csv files only</p>
                </div>
              )}
            </div>

            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              type="button"
              onClick={handleSubmit}
              disabled={!file || uploading}
              className="w-full px-6 py-3 bg-accent text-[#0c0c0c] rounded-full font-semibold text-sm tracking-wide hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Upload className="w-4 h-4" /> Import Items</>}
            </motion.button>
          </div>

          {/* Results */}
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-white/[0.04] bg-[#111111] p-6 space-y-4"
            >
              <div className="flex items-center gap-3">
                {result.errors.length === 0 ? (
                  <CheckCircle className="w-5 h-5 text-accent" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-amber-400" />
                )}
                <h3 className="text-sm font-medium text-white">Import Results</h3>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-xl bg-[#0c0c0c] border border-white/[0.04] p-4 text-center">
                  <p className="text-2xl font-light text-accent">{result.total}</p>
                  <p className="text-xs text-white/30 mt-1">Total Rows</p>
                </div>
                <div className="rounded-xl bg-[#0c0c0c] border border-white/[0.04] p-4 text-center">
                  <p className="text-2xl font-light text-accent">{result.imported}</p>
                  <p className="text-xs text-white/30 mt-1">Imported</p>
                </div>
                <div className="rounded-xl bg-[#0c0c0c] border border-white/[0.04] p-4 text-center">
                  <p className="text-2xl font-light text-red-400">{result.errors.length}</p>
                  <p className="text-xs text-white/30 mt-1">Errors</p>
                </div>
              </div>
              {result.errors.length > 0 && (
                <div className="rounded-xl bg-red-500/5 border border-red-500/20 p-4 space-y-2 max-h-48 overflow-y-auto">
                  {result.errors.map((err, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm">
                      <XCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                      <span className="text-white/60">{err.row}: <span className="text-red-400">{err.error}</span></span>
                    </div>
                  ))}
                </div>
              )}
              {result.imported > 0 && (
                <Link
                  href="/items"
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-accent/10 border border-accent/20 text-accent rounded-xl text-sm font-medium hover:bg-accent/20 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  View Items
                </Link>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </PageTransition>
  );
}
