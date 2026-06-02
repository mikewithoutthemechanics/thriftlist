import { NextRequest, NextResponse } from 'next/server';
import { createClientServer } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClientServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Total items
    const { count: totalItems } = await supabase.from('items').select('*', { count: 'exact', head: true }).eq('user_id', user.id);

    // Postings
    const { data: postings } = await supabase.from('postings').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
    const successfulPostings = (postings || []).filter(p => p.status === 'posted').length;
    const failedPostings = (postings || []).filter(p => p.status === 'failed').length;
    const pendingPostings = (postings || []).filter(p => p.status === 'pending').length;

    // Platform stats
    const platformStats: Record<string, { total: number; success: number; failed: number }> = {};
    for (const p of postings || []) {
      if (!platformStats[p.platform]) platformStats[p.platform] = { total: 0, success: 0, failed: 0 };
      platformStats[p.platform].total++;
      if (p.status === 'posted') platformStats[p.platform].success++;
      if (p.status === 'failed') platformStats[p.platform].failed++;
    }

    // Sold items & revenue
    const { data: soldItems } = await supabase
      .from('items')
      .select('price, created_at')
      .eq('user_id', user.id)
      .eq('status', 'sold');
    const totalRevenue = (soldItems || []).reduce((sum, item) => sum + (item.price || 0), 0);
    const soldCount = soldItems?.length || 0;

    // Average time to sell
    const timeToSellDiffs = (soldItems || []).map(item => {
      const created = new Date(item.created_at).getTime();
      const now = Date.now();
      return Math.floor((now - created) / (1000 * 60 * 60 * 24));
    });
    const avgTimeToSell = timeToSellDiffs.length > 0
      ? Math.round(timeToSellDiffs.reduce((sum, diff) => sum + diff, 0) / timeToSellDiffs.length)
      : 0;

    // Daily trends (last 7 days)
    const dailyTrends = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const dayPostings = postings?.filter(p => p.created_at.startsWith(dateStr)) || [];
      dailyTrends.push({
        date: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
        total: dayPostings.length,
        success: dayPostings.filter(p => p.status === 'posted').length,
        failed: dayPostings.filter(p => p.status === 'failed').length,
      });
    }

    return NextResponse.json({
      totalItems: totalItems || 0,
      totalPostings: postings?.length || 0,
      successfulPostings,
      failedPostings,
      pendingPostings,
      platformStats,
      recentPostings: (postings || []).slice(0, 10),
      dailyTrends,
      totalRevenue,
      soldItems: soldCount,
      avgTimeToSell,
    });
  } catch (error) {
    console.error('GET /api/analytics error:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}
