'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Package, DollarSign, Send, TrendingUp, ArrowRight, Shirt, Plus, ShoppingBag } from 'lucide-react';
import { createClientBrowser } from '@/lib/supabase';

export default function DashboardPage() {
  const [stats, setStats] = useState({ total: 0, totalValue: 0, posted: 0, sold: 0 });
  const [recent, setRecent] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClientBrowser();

  useEffect(() => {
    const fetchData = async () => {
      const { data: items } = await supabase
        .from('items')
        .select('*')
        .order('created_at', { ascending: false });
      const list = items || [];
      const totalValue = list.reduce((s: number, i: any) => s + (i.price || 0), 0);
      const posted = list.filter((i: any) => i.status === 'posted').length;
      const sold = list.filter((i: any) => i.status === 'sold').length;
      setStats({ total: list.length, totalValue, posted, sold });
      setRecent(list.slice(0, 5));
      setLoading(false);
    };
    fetchData();
  }, []);

  const statCards = [
    { label: 'Total Items', value: stats.total, icon: Package, color: 'bg-[#1a1a1a]' },
    { label: 'Value', value: `R${stats.totalValue.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`, icon: DollarSign, color: 'bg-[#1a1a1a]' },
    { label: 'Posted', value: stats.posted, icon: Send, color: 'bg-[#1a1a1a]' },
    { label: 'Sold', value: stats.sold, icon: TrendingUp, color: 'bg-[#1a1a1a]' },
  ];

  const statusStyle = (status: string) => {
    switch (status) {
      case 'sold':
        return 'text-emerald-400/80';
      case 'posted':
        return 'text-amber-400/80';
      default:
        return 'text-white/40';
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#c4a882] mb-2">
            Dashboard
          </p>
          <h1 className="text-3xl font-light text-white tracking-tight">
            Your Inventory
          </h1>
        </div>
        <Link
          href="/items/new"
          data-tour="new-item"
          className="inline-flex items-center gap-2 px-6 py-3 bg-[#c4a882] text-[#0c0c0c] rounded-full font-semibold text-sm tracking-wide hover:bg-[#d4b892] transition-colors duration-300"
        >
          <Plus className="w-4 h-4" /> Add Item
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {statCards.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className={`${s.color} rounded-2xl p-5 border border-white/5`}>
              <s.icon className="w-5 h-5 text-white/20 mb-3" />
              <p className="text-2xl font-light text-white tracking-tight">
                {loading ? (
                  <span className="inline-block w-16 h-7 rounded bg-white/5 animate-pulse" />
                ) : (
                  s.value
                )}
              </p>
              <p className="text-xs text-white/30 mt-1 font-medium uppercase tracking-wider">
                {s.label}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Recent Items */}
      <div>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-light text-white tracking-tight">Recent Items</h2>
          <Link
            href="/items"
            className="text-sm text-[#c4a882] hover:text-[#d4b892] font-medium transition-colors duration-300 inline-flex items-center gap-1"
          >
            View All <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="rounded-2xl border border-white/5 overflow-hidden">
          {loading ? (
            <div className="divide-y divide-white/5">
              {[1, 2, 3].map(i => (
                <div key={i} className="p-4 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-white/5 animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-32 bg-white/5 rounded animate-pulse" />
                    <div className="h-3 w-48 bg-white/5 rounded animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ) : recent.length === 0 ? (
            <div className="p-12 text-center">
              <ShoppingBag className="w-8 h-8 text-white/10 mx-auto mb-4" />
              <p className="text-white/30 text-sm font-light">No items yet.</p>
              <Link
                href="/items/new"
                className="text-[#c4a882] hover:text-[#d4b892] text-sm mt-2 inline-block font-medium transition-colors duration-300"
              >
                Add your first item
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {recent.map((item, idx) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Link
                    href={`/items/${item.id}`}
                    className="flex items-center gap-4 p-4 hover:bg-white/[0.02] transition-colors duration-200 group"
                  >
                    {item.photos?.[0] ? (
                      <img
                        src={item.photos[0]}
                        alt=""
                        className="w-12 h-12 rounded-lg object-cover bg-white/5"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-white/5 flex items-center justify-center">
                        <Shirt className="w-5 h-5 text-white/10" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white group-hover:text-[#c4a882] transition-colors duration-200 truncate">
                        {item.title}
                      </p>
                      <p className="text-xs text-white/30 mt-0.5">
                        {item.category} · {item.size} · R{item.price}
                      </p>
                    </div>
                    <span className={`text-xs font-medium uppercase tracking-wider ${statusStyle(item.status)}`}>
                      {item.status}
                    </span>
                    <ArrowRight className="w-4 h-4 text-white/10 group-hover:text-[#c4a882] group-hover:translate-x-0.5 transition-all duration-200" />
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
