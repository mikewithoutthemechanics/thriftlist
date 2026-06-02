'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Package, DollarSign, Send, TrendingUp, ArrowRight, Shirt, Plus,
  ShoppingBag, Zap, Calendar, BarChart3, Upload, Globe, CheckCircle2,
  XCircle, Clock, AlertCircle, ChevronRight, Activity, Target
} from 'lucide-react';
import { createClientBrowser } from '@/lib/supabase';

interface Item {
  id: string;
  title: string;
  price: number;
  category: string;
  size: string;
  status: string;
  photos: string[];
  created_at: string;
}

interface PlatformStatus {
  id: string;
  name: string;
  connected: boolean;
  lastPost: string | null;
  health: 'healthy' | 'warning' | 'error';
}

function timeAgo(dateStr: string | null): string | null {
  if (!dateStr) return null;
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

function calcTrend(current: number, previous: number): { trend: 'up' | 'down' | 'neutral'; label: string } {
  if (previous === 0) return current > 0 ? { trend: 'up', label: 'New' } : { trend: 'neutral', label: '0%' };
  const pct = Math.round(((current - previous) / previous) * 100);
  if (pct > 0) return { trend: 'up', label: `+${pct}%` };
  if (pct < 0) return { trend: 'down', label: `${pct}%` };
  return { trend: 'neutral', label: '0%' };
}

const quickActions = [
  { icon: Plus, label: 'Add Item', href: '/items/new', color: 'bg-accent', textColor: 'text-[#0c0c0c]', desc: 'Create a new listing' },
  { icon: Calendar, label: 'Schedule', href: '/postings', color: 'bg-white/5', textColor: 'text-white', desc: 'Plan future posts', border: 'border-white/10' },
  { icon: BarChart3, label: 'Analytics', href: '/analytics', color: 'bg-white/5', textColor: 'text-white', desc: 'View performance', border: 'border-white/10' },
  { icon: Upload, label: 'Bulk Import', href: '/items/import', color: 'bg-white/5', textColor: 'text-white', desc: 'Upload CSV file', border: 'border-white/10' },
];

function StatCard({ label, value, icon: Icon, trend, trendLabel, delay }: {
  label: string;
  value: string | number;
  icon: typeof Package;
  trend?: 'up' | 'down' | 'neutral';
  trendLabel?: string;
  delay: number;
}) {
  const trendColors = {
    up: 'text-emerald-400',
    down: 'text-red-400',
    neutral: 'text-white/40',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: delay * 0.08, ease: [0.22, 1, 0.36, 1] }}
      className="group relative"
    >
      <div className="rounded-[22px] p-5 bg-[#111111]/80 border border-white/[0.04] hover:border-accent/20 hover:shadow-lg hover:shadow-accent/5 hover:-translate-y-0.5 transition-all duration-300 backdrop-blur-sm">
        <div className="flex items-start justify-between mb-3">
          <div className="w-10 h-10 rounded-[14px] bg-white/[0.03] border border-white/[0.04] flex items-center justify-center group-hover:bg-accent/10 group-hover:border-accent/20 group-hover:shadow-md group-hover:shadow-accent/10 transition-all duration-300">
            <Icon className="w-4 h-4 text-white/30 group-hover:text-accent transition-colors duration-300" />
          </div>
          {trend && (
            <div className={`flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider ${trendColors[trend]}`}>
              <TrendingUp className={`w-3 h-3 ${trend === 'down' ? 'rotate-180' : ''}`} />
              {trendLabel}
            </div>
          )}
        </div>
        <p className="text-2xl font-semibold text-white tracking-tight">{value}</p>
        <p className="text-[10px] text-white/40 mt-1 font-semibold uppercase tracking-widest">{label}</p>
      </div>
    </motion.div>
  );
}

function PlatformCard({ platform }: { platform: PlatformStatus }) {
  const healthColors = {
    healthy: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
    warning: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
    error: 'text-red-400 bg-red-400/10 border-red-400/20',
  };

  const healthIcons = {
    healthy: CheckCircle2,
    warning: AlertCircle,
    error: XCircle,
  };

  const HealthIcon = healthIcons[platform.health];

  return (
    <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/[0.02] border border-white/[0.04] hover:border-white/[0.08] hover:bg-white/[0.04] transition-all duration-200">
      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shadow-sm ${healthColors[platform.health]}`}>
        <HealthIcon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white truncate">{platform.name}</p>
        <p className="text-[10px] text-white/40 mt-0.5">
          {platform.connected ? `Last post ${platform.lastPost}` : 'Not connected'}
        </p>
      </div>
      <div className={`w-2.5 h-2.5 rounded-full ${platform.connected ? 'bg-emerald-400 shadow-sm shadow-emerald-400/40' : 'bg-red-400 shadow-sm shadow-red-400/40'}`} />
    </div>
  );
}

function ActivityItem({ item, index }: { item: Item; index: number }) {
  const statusConfig: Record<string, { color: string; bg: string; label: string }> = {
    sold: { color: 'text-emerald-400', bg: 'bg-emerald-400/10', label: 'Sold' },
    posted: { color: 'text-amber-400', bg: 'bg-amber-400/10', label: 'Posted' },
    draft: { color: 'text-white/40', bg: 'bg-white/5', label: 'Draft' },
  };

  const config = statusConfig[item.status] || statusConfig.draft;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: index * 0.05 }}
    >
      <Link
        href={`/items/${item.id}`}
        className="flex items-center gap-4 p-4 hover:bg-white/[0.03] transition-all duration-200 group rounded-2xl mx-1 my-1"
      >
        {item.photos?.[0] ? (
          <img src={item.photos[0]} alt="" className="w-12 h-12 rounded-xl object-cover bg-white/5 shadow-sm" />
        ) : (
          <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center shadow-sm">
            <Shirt className="w-5 h-5 text-white/10" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white group-hover:text-accent transition-colors duration-200 truncate">
            {item.title}
          </p>
          <p className="text-xs text-white/40 mt-0.5">
            {item.category} · {item.size} · R{item.price}
          </p>
        </div>
        <span className={`text-[10px] font-semibold uppercase tracking-wider px-3 py-1 rounded-full ${config.bg} ${config.color}`}>
          {config.label}
        </span>
        <ChevronRight className="w-4 h-4 text-white/10 group-hover:text-accent group-hover:translate-x-0.5 transition-all duration-200" />
      </Link>
    </motion.div>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState<{ total: number; totalValue: number; posted: number; sold: number; totalTrend: { trend: 'up' | 'down' | 'neutral'; label: string }; valueTrend: { trend: 'up' | 'down' | 'neutral'; label: string }; postedTrend: { trend: 'up' | 'down' | 'neutral'; label: string }; soldTrend: { trend: 'up' | 'down' | 'neutral'; label: string } }>({ total: 0, totalValue: 0, posted: 0, sold: 0, totalTrend: { trend: 'neutral', label: '0%' }, valueTrend: { trend: 'neutral', label: '0%' }, postedTrend: { trend: 'neutral', label: '0%' }, soldTrend: { trend: 'neutral', label: '0%' } });
  const [recent, setRecent] = useState<Item[]>([]);
  const [platforms, setPlatforms] = useState<PlatformStatus[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClientBrowser();

  useEffect(() => {
    const fetchData = async () => {
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000).toISOString();
      const fourteenDaysAgo = new Date(now.getTime() - 14 * 86400000).toISOString();

      // Items
      const { data: items } = await supabase.from('items').select('*').order('created_at', { ascending: false });
      const list = (items as Item[]) || [];
      const totalValue = list.reduce((s, i) => s + (i.price || 0), 0);
      const posted = list.filter((i) => i.status === 'posted').length;
      const sold = list.filter((i) => i.status === 'sold').length;

      // Trends: compare last 7 days vs previous 7 days
      const recentItems = list.filter(i => i.created_at >= sevenDaysAgo);
      const prevItems = list.filter(i => i.created_at >= fourteenDaysAgo && i.created_at < sevenDaysAgo);
      const totalTrend = calcTrend(recentItems.length, prevItems.length);
      const recentValue = recentItems.reduce((s, i) => s + (i.price || 0), 0);
      const prevValue = prevItems.reduce((s, i) => s + (i.price || 0), 0);
      const valueTrend = calcTrend(recentValue, prevValue);

      const recentPosted = recentItems.filter(i => i.status === 'posted').length;
      const prevPosted = prevItems.filter(i => i.status === 'posted').length;
      const postedTrend = calcTrend(recentPosted, prevPosted);

      const recentSold = recentItems.filter(i => i.status === 'sold').length;
      const prevSold = prevItems.filter(i => i.status === 'sold').length;
      const soldTrend = calcTrend(recentSold, prevSold);

      setStats({ total: list.length, totalValue, posted, sold, totalTrend, valueTrend, postedTrend, soldTrend });
      setRecent(list.slice(0, 5));

      // Platform status from cookies + postings
      const { data: cookies } = await supabase.from('platform_cookies').select('platform, updated_at');
      const { data: lastPosts } = await supabase
        .from('postings')
        .select('platform, created_at')
        .order('created_at', { ascending: false });

      const cookieMap = new Map((cookies || []).map((c: any) => [c.platform, c.updated_at]));
      const lastPostMap = new Map<string, string>();
      (lastPosts || []).forEach((p: any) => { if (!lastPostMap.has(p.platform)) lastPostMap.set(p.platform, p.created_at); });

      const platformList: PlatformStatus[] = [
        { id: 'facebook_marketplace', name: 'Facebook Marketplace', connected: cookieMap.has('facebook_marketplace'), lastPost: timeAgo(lastPostMap.get('facebook_marketplace') || null), health: 'healthy' },
        { id: 'yaga', name: 'Yaga', connected: cookieMap.has('yaga'), lastPost: timeAgo(lastPostMap.get('yaga') || null), health: 'healthy' },
        { id: 'gumtree', name: 'Gumtree', connected: cookieMap.has('gumtree'), lastPost: timeAgo(lastPostMap.get('gumtree') || null), health: 'healthy' },
        { id: 'olx', name: 'OLX', connected: cookieMap.has('olx'), lastPost: timeAgo(lastPostMap.get('olx') || null), health: 'healthy' },
        { id: 'junkmail', name: 'Junk Mail', connected: cookieMap.has('junkmail'), lastPost: timeAgo(lastPostMap.get('junkmail') || null), health: 'healthy' },
      ];
      setPlatforms(platformList);

      // Real activity feed from postings
      const { data: recentPostings } = await supabase
        .from('postings')
        .select('platform, status, created_at, error')
        .order('created_at', { ascending: false })
        .limit(5);

      const activityList = (recentPostings || []).map((p: any) => {
        const isSuccess = p.status === 'posted';
        return {
          icon: isSuccess ? CheckCircle2 : p.status === 'failed' ? AlertCircle : Clock,
          text: isSuccess ? `Posted to ${p.platform}` : p.status === 'failed' ? `Failed to post to ${p.platform}: ${p.error?.substring(0, 40) || 'Unknown error'}` : `Pending post to ${p.platform}`,
          time: timeAgo(p.created_at) || 'recently',
          color: isSuccess ? 'text-emerald-400' : p.status === 'failed' ? 'text-red-400' : 'text-amber-400',
        };
      });
      setActivities(activityList.length > 0 ? activityList : [{ icon: Zap, text: 'No recent activity', time: '', color: 'text-white/30' }]);

      setLoading(false);
    };
    fetchData();
  }, []);

  const statCards = [
    { label: 'Total Items', value: stats.total, icon: Package, trend: stats.totalTrend.trend, trendLabel: stats.totalTrend.label },
    { label: 'Inventory Value', value: `R${stats.totalValue.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`, icon: DollarSign, trend: stats.valueTrend.trend, trendLabel: stats.valueTrend.label },
    { label: 'Posted Live', value: stats.posted, icon: Globe, trend: stats.postedTrend.trend, trendLabel: stats.postedTrend.label },
    { label: 'Sold', value: stats.sold, icon: Target, trend: stats.soldTrend.trend, trendLabel: stats.soldTrend.label },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-accent mb-2">
            Dashboard
          </p>
          <h1 className="text-3xl font-light text-white tracking-tight">
            Your Inventory
          </h1>
          <p className="text-sm text-white/40 mt-1">Track, manage, and grow your resale business.</p>
        </div>
        <Link
          href="/items/new"
          data-tour="new-item"
          className="inline-flex items-center gap-2 px-6 py-3 bg-accent text-[#0c0c0c] rounded-2xl font-bold text-sm tracking-wide hover:bg-accent transition-all duration-300 hover:shadow-[0_8px_30px_rgba(196,168,130,0.35)] hover:-translate-y-0.5 active:translate-y-0"
        >
          <Plus className="w-4 h-4" /> Add Item
        </Link>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {statCards.map((s, i) => (
          <StatCard key={s.label} {...s} delay={i} />
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-sm font-medium text-white/60 uppercase tracking-wider mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {quickActions.map((action, i) => (
            <motion.div
              key={action.label}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 + i * 0.06 }}
            >
              <Link
                href={action.href}
                className={`block p-5 rounded-2xl ${action.color} ${action.border ? `border ${action.border}` : ''} hover:scale-[1.02] transition-all duration-300 group`}
              >
                <action.icon className={`w-5 h-5 ${action.textColor} mb-3 group-hover:scale-110 transition-transform duration-300`} />
                <p className={`text-sm font-semibold ${action.textColor}`}>{action.label}</p>
                <p className={`text-xs mt-1 ${action.textColor === 'text-[#0c0c0c]' ? 'text-[#0c0c0c]/60' : 'text-white/40'}`}>{action.desc}</p>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Items - 2 cols */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-white/60 uppercase tracking-wider">Recent Items</h2>
            <Link
              href="/items"
              className="text-sm text-accent hover:text-accent font-medium transition-colors duration-300 inline-flex items-center gap-1"
            >
              View All <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="rounded-[22px] border border-white/5 overflow-hidden bg-[#0c0c0c]/80 shadow-xl shadow-black/20 backdrop-blur-sm">
            {loading ? (
              <div className="divide-y divide-white/5">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="p-4 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-white/5 animate-pulse" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-32 bg-white/5 rounded-lg animate-pulse" />
                      <div className="h-3 w-48 bg-white/5 rounded-lg animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            ) : recent.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4">
                  <ShoppingBag className="w-8 h-8 text-white/10" />
                </div>
                <p className="text-white/30 text-sm font-light">No items yet.</p>
                <p className="text-white/20 text-xs mt-1">Add your first item to get started.</p>
                <Link
                  href="/items/new"
                  className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 bg-accent text-[#0c0c0c] rounded-xl text-sm font-bold hover:bg-accent transition-all hover:shadow-lg hover:shadow-accent/20 hover:-translate-y-0.5"
                >
                  <Plus className="w-4 h-4" /> Add First Item
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {recent.map((item, idx) => (
                  <ActivityItem key={item.id} item={item} index={idx} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar - Platforms + Activity */}
        <div className="space-y-6">
          {/* Platform Status */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-medium text-white/60 uppercase tracking-wider">Platforms</h2>
              <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-400/10 px-3 py-1 rounded-full uppercase tracking-wider shadow-sm shadow-emerald-400/10">
                {platforms.filter((p) => p.connected).length}/{platforms.length} Active
              </span>
            </div>
            <div className="rounded-[22px] border border-white/5 p-4 bg-[#0c0c0c]/80 space-y-2 shadow-xl shadow-black/20 backdrop-blur-sm">
              {platforms.map((platform) => (
                <PlatformCard key={platform.id} platform={platform} />
              ))}
            </div>
          </div>

          {/* Mini Activity Feed */}
          <div>
            <h2 className="text-sm font-medium text-white/60 uppercase tracking-wider mb-4">Activity</h2>
            <div className="rounded-[22px] border border-white/5 p-4 bg-[#0c0c0c]/80 shadow-xl shadow-black/20 backdrop-blur-sm">
              <div className="space-y-4">
                {activities.map((activity, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-white/[0.03] border border-white/[0.04] flex items-center justify-center flex-shrink-0 shadow-sm">
                      <activity.icon className={`w-4 h-4 ${activity.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white/80">{activity.text}</p>
                      {activity.time && <p className="text-[10px] text-white/40 mt-0.5">{activity.time}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
