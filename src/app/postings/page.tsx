'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Send, CheckCircle, XCircle, Clock, ExternalLink, Package, ArrowRight } from 'lucide-react';
import AnimatedCard from '@/components/AnimatedCard';
import PageTransition from '@/components/PageTransition';
import { createClientBrowser } from '@/lib/supabase';

interface Posting {
  id: string;
  itemId: string;
  itemTitle: string;
  platform: string;
  status: string;
  url?: string;
  error?: string;
  createdAt: string;
}

export default function PostingsPage() {
  const [postings, setPostings] = useState<Posting[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClientBrowser();
    const fetch = async () => {
      const { data, error } = await supabase.from('postings').select('*, items(title)').order('created_at', { ascending: false });
      if (error) { console.error(error); setLoading(false); return; }
      setPostings((data || []).map((row: any) => ({
        id: row.id, itemId: row.item_id, itemTitle: row.items?.title,
        platform: row.platform, status: row.status, url: row.url, error: row.error, createdAt: row.created_at,
      })));
      setLoading(false);
    };
    fetch();
  }, []);

  const getStatusIcon = (status: string) => {
    if (status === 'posted') return <CheckCircle className="w-4 h-4 text-emerald-400" />;
    if (status === 'failed') return <XCircle className="w-4 h-4 text-red-400" />;
    return <Clock className="w-4 h-4 text-amber-400" />;
  };

  const getStatusClass = (status: string) => {
    if (status === 'posted') return 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20';
    if (status === 'failed') return 'bg-red-500/10 text-red-300 border-red-500/20';
    return 'bg-amber-500/10 text-amber-300 border-amber-500/20';
  };

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <motion.h2 initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="text-2xl font-bold text-white">Postings</motion.h2>
            <p className="text-white/40 mt-1">Track your marketplace posting activity</p>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">{[1, 2, 3, 4, 5].map(i => <div key={i} className="h-20 rounded-2xl shimmer" />)}</div>
        ) : postings.length === 0 ? (
          <AnimatedCard className="p-12 text-center">
            <Send className="w-12 h-12 text-white/20 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white">No postings yet</h3>
            <p className="text-white/30 mt-1 mb-4">Post an item to a marketplace to see activity here</p>
            <Link href="/items" className="text-emerald-400 hover:underline font-medium inline-flex items-center gap-1">Go to Inventory <ArrowRight className="w-4 h-4" /></Link>
          </AnimatedCard>
        ) : (
          <AnimatedCard glass className="overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-white/5"><tr>
                <th className="px-6 py-3 font-medium text-white/30">Status</th>
                <th className="px-6 py-3 font-medium text-white/30">Item</th>
                <th className="px-6 py-3 font-medium text-white/30">Platform</th>
                <th className="px-6 py-3 font-medium text-white/30">Date</th>
                <th className="px-6 py-3 font-medium text-white/30 text-right">Actions</th>
              </tr></thead>
              <tbody className="divide-y divide-white/5">
                {postings.map((posting, idx) => (
                  <motion.tr key={posting.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }} whileHover={{ backgroundColor: 'rgba(255,255,255,0.02)' }} className="transition-colors">
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusClass(posting.status)}`}>
                        {getStatusIcon(posting.status)}{posting.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <Link href={`/items/${posting.itemId}`} className="text-white hover:text-emerald-400 transition-colors font-medium">{posting.itemTitle || 'Unknown Item'}</Link>
                      {posting.error && <p className="text-xs text-red-400 mt-1">{posting.error}</p>}
                    </td>
                    <td className="px-6 py-4 text-white/60">{posting.platform}</td>
                    <td className="px-6 py-4 text-white/40">{new Date(posting.createdAt).toLocaleString()}</td>
                    <td className="px-6 py-4 text-right">
                      {posting.url ? (
                        <a href={posting.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-emerald-400 transition-all text-xs"><ExternalLink className="w-3.5 h-3.5" /> View</a>
                      ) : <span className="text-white/20 text-xs">No link</span>}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </AnimatedCard>
        )}
      </div>
    </PageTransition>
  );
}
