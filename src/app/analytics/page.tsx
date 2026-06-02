'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, CheckCircle, XCircle, Clock, Package, DollarSign } from 'lucide-react';
import PageTransition from '@/components/PageTransition';

interface AnalyticsData {
  totalItems: number;
  totalPostings: number;
  successfulPostings: number;
  failedPostings: number;
  pendingPostings: number;
  platformStats: { platform: string; count: number; success: number; failed: number }[];
  recentPostings: { id: string; platform: string; status: string; created_at: string }[];
  dailyTrends: { date: string; total: number; success: number; failed: number }[];
  totalRevenue: number;
  soldItems: number;
  avgTimeToSell: number;
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/analytics');
      const json = await res.json();
      if (json.error) throw new Error(json.error);

      // Transform platformStats from object to array for UI compatibility
      const platformStats = Object.entries(json.platformStats || {}).map(([platform, stats]: [string, any]) => ({
        platform,
        count: stats.total,
        success: stats.success,
        failed: stats.failed,
      }));

      setData({
        totalItems: json.totalItems || 0,
        totalPostings: json.totalPostings || 0,
        successfulPostings: json.successfulPostings || 0,
        failedPostings: json.failedPostings || 0,
        pendingPostings: json.pendingPostings || 0,
        platformStats,
        recentPostings: json.recentPostings || [],
        dailyTrends: json.dailyTrends || [],
        totalRevenue: json.totalRevenue || 0,
        soldItems: json.soldItems || 0,
        avgTimeToSell: json.avgTimeToSell || 0,
      });
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const successRate = data && data.totalPostings > 0 
    ? Math.round((data.successfulPostings / data.totalPostings) * 100) 
    : 0;

  const cards = [
    { label: 'Total Items', value: data?.totalItems || 0, icon: Package, color: 'text-accent' },
    { label: 'Total Postings', value: data?.totalPostings || 0, icon: BarChart3, color: 'text-accent' },
    { label: 'Successful', value: data?.successfulPostings || 0, icon: CheckCircle, color: 'text-emerald-400' },
    { label: 'Failed', value: data?.failedPostings || 0, icon: XCircle, color: 'text-red-400' },
    { label: 'Pending', value: data?.pendingPostings || 0, icon: Clock, color: 'text-amber-400' },
    { label: 'Total Revenue', value: `R${data?.totalRevenue?.toFixed(2) || '0.00'}`, icon: DollarSign, color: 'text-green-400' },
    { label: 'Items Sold', value: data?.soldItems || 0, icon: TrendingUp, color: 'text-accent' },
    { label: 'Avg Time to Sell', value: `${data?.avgTimeToSell || 0} days`, icon: Clock, color: 'text-accent' },
    { label: 'Success Rate', value: `${successRate}%`, icon: TrendingUp, color: 'text-accent' },
  ];

  if (loading) {
    return (
      <PageTransition>
        <div className="space-y-6">
          <h2 className="text-2xl font-light text-white tracking-tight">Analytics</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-32 rounded-2xl bg-white/[0.02] animate-pulse" />)}
          </div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-light text-white tracking-tight">Analytics</h2>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {cards.map((card, idx) => (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="rounded-2xl border border-white/[0.04] bg-[#111111] p-5"
            >
              <div className="flex items-center justify-between mb-2">
                <card.icon className={`w-5 h-5 ${card.color}`} />
              </div>
              <p className="text-2xl font-semibold text-white">{card.value}</p>
              <p className="text-xs text-white/40 mt-1">{card.label}</p>
            </motion.div>
          ))}
        </div>

        {/* 7-Day Trend Chart */}
        <div className="rounded-2xl border border-white/[0.04] bg-[#111111] p-6">
          <h3 className="text-sm font-medium text-white mb-4">7-Day Posting Trends</h3>
          {data?.dailyTrends.length === 0 ? (
            <p className="text-white/30 text-sm">No trend data yet</p>
          ) : (
            <div className="space-y-4">
              {data?.dailyTrends.map((trend, idx) => {
                const maxTotal = Math.max(...(data?.dailyTrends.map(t => t.total) || [1]));
                const barWidth = maxTotal > 0 ? (trend.total / maxTotal) * 100 : 0;
                const successWidth = trend.total > 0 ? (trend.success / trend.total) * 100 : 0;
                const failedWidth = trend.total > 0 ? (trend.failed / trend.total) * 100 : 0;
                
                return (
                  <div key={idx} className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-white/60">{trend.date}</span>
                      <span className="text-white font-medium">{trend.total} postings</span>
                    </div>
                    <div className="h-6 rounded-lg bg-white/5 overflow-hidden flex">
                      <div 
                        className="h-full bg-emerald-400 transition-all duration-500" 
                        style={{ width: `${barWidth * (successWidth / 100)}%` }}
                        title={`${trend.success} successful`}
                      />
                      <div 
                        className="h-full bg-red-400 transition-all duration-500" 
                        style={{ width: `${barWidth * (failedWidth / 100)}%` }}
                        title={`${trend.failed} failed`}
                      />
                      <div 
                        className="h-full bg-amber-400 transition-all duration-500" 
                        style={{ width: `${barWidth * ((trend.total - trend.success - trend.failed) / trend.total)}%` }}
                        title={`${trend.total - trend.success - trend.failed} pending`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Platform Performance */}
        <div className="rounded-2xl border border-white/[0.04] bg-[#111111] p-6">
          <h3 className="text-sm font-medium text-white mb-4">Platform Performance</h3>
          {data?.platformStats.length === 0 ? (
            <p className="text-white/30 text-sm">No posting data yet</p>
          ) : (
            <div className="space-y-4">
              {data?.platformStats.map((stat) => (
                <div key={stat.platform} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white font-medium capitalize">{stat.platform.replace('_', ' ')}</span>
                    <span className="text-white/40">{stat.count} postings</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/10 overflow-hidden flex">
                    <div 
                      className="h-full bg-emerald-400" 
                      style={{ width: `${stat.count > 0 ? (stat.success / stat.count) * 100 : 0}%` }}
                    />
                    <div 
                      className="h-full bg-red-400" 
                      style={{ width: `${stat.count > 0 ? (stat.failed / stat.count) * 100 : 0}%` }}
                    />
                  </div>
                  <div className="flex items-center gap-4 text-xs text-white/30">
                    <span className="flex items-center gap-1"><CheckCircle className="w-3 h-3 text-emerald-400" /> {stat.success} successful</span>
                    <span className="flex items-center gap-1"><XCircle className="w-3 h-3 text-red-400" /> {stat.failed} failed</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Postings */}
        <div className="rounded-2xl border border-white/[0.04] bg-[#111111] p-6">
          <h3 className="text-sm font-medium text-white mb-4">Recent Postings</h3>
          {data?.recentPostings.length === 0 ? (
            <p className="text-white/30 text-sm">No recent postings</p>
          ) : (
            <div className="space-y-2">
              {data?.recentPostings.map((posting) => (
                <div key={posting.id} className="flex items-center justify-between py-2 border-b border-white/[0.04] last:border-0">
                  <div className="flex items-center gap-3">
                    <span className={`w-2 h-2 rounded-full ${
                      posting.status === 'posted' ? 'bg-emerald-400' :
                      posting.status === 'failed' ? 'bg-red-400' :
                      'bg-amber-400'
                    }`} />
                    <span className="text-sm text-white capitalize">{posting.platform.replace('_', ' ')}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`text-xs capitalize ${
                      posting.status === 'posted' ? 'text-emerald-300' :
                      posting.status === 'failed' ? 'text-red-300' :
                      'text-amber-300'
                    }`}>{posting.status}</span>
                    <span className="text-xs text-white/30">{new Date(posting.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  );
}
