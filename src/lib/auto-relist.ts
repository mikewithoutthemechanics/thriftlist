import { createServiceRoleClient } from './supabase-service';

function getSupabase() {
  return createServiceRoleClient();
}

export interface RelistConfig {
  enabled: boolean;
  intervalDays: number;
  maxRelists: number;
  priceReductionPercent?: number;
  platforms?: string[];
}

export interface RelistResult {
  itemId: string;
  platform: string;
  success: boolean;
  newPostingId?: string;
  error?: string;
}

/**
 * Get user's auto-relist configuration
 */
export async function getRelistConfig(userId: string): Promise<RelistConfig> {
  const { data, error } = await getSupabase()
    .from('settings')
    .select('value')
    .eq('user_id', userId)
    .eq('key', 'auto_relist_config')
    .single();

  if (error || !data) {
    return {
      enabled: false,
      intervalDays: 7,
      maxRelists: 3,
    };
  }

  return JSON.parse(data.value);
}

/**
 * Update auto-relist configuration
 */
export async function updateRelistConfig(userId: string, config: RelistConfig): Promise<void> {
  await getSupabase()
    .from('settings')
    .upsert({
      user_id: userId,
      key: 'auto_relist_config',
      value: JSON.stringify(config),
    });
}

/**
 * Check if an item should be auto-relisted
 */
export async function shouldAutoRelist(
  itemId: string,
  userId: string
): Promise<{ shouldRelist: boolean; reason?: string }> {
  const config = await getRelistConfig(userId);
  
  if (!config.enabled) {
    return { shouldRelist: false, reason: 'Auto-relist is disabled' };
  }

  // Get item and posting history
  const { data: item } = await getSupabase()
    .from('items')
    .select('*, postings(*)')
    .eq('id', itemId)
    .eq('user_id', userId)
    .single();

  if (!item) {
    return { shouldRelist: false, reason: 'Item not found' };
  }

  // Only relist items that are not sold
  if (item.status === 'sold') {
    return { shouldRelist: false, reason: 'Item is already sold' };
  }

  // Check if max relists reached
  const relistCount = item.postings?.filter((p: any) => p.status === 'posted').length || 0;
  if (relistCount >= config.maxRelists) {
    return { shouldRelist: false, reason: 'Maximum relist limit reached' };
  }

  // Check if enough time has passed since last posting
  const lastPosted = item.postings?.find((p: any) => p.status === 'posted');
  if (lastPosted) {
    const daysSinceLastPost = Math.floor(
      (Date.now() - new Date(lastPosted.created_at).getTime()) / (1000 * 60 * 60 * 24)
    );
    
    if (daysSinceLastPost < config.intervalDays) {
      return { 
        shouldRelist: false, 
        reason: `Only ${daysSinceLastPost} days since last post (requires ${config.intervalDays})` 
      };
    }
  }

  return { shouldRelist: true };
}

/**
 * Auto-relist an item
 */
export async function autoRelistItem(
  itemId: string,
  userId: string
): Promise<RelistResult[]> {
  const { shouldRelist, reason } = await shouldAutoRelist(itemId, userId);
  
  if (!shouldRelist) {
    throw new Error(reason || 'Item does not meet relist criteria');
  }

  const config = await getRelistConfig(userId);
  const results: RelistResult[] = [];

  // Get item details
  const { data: item } = await getSupabase()
    .from('items')
    .select('*')
    .eq('id', itemId)
    .eq('user_id', userId)
    .single();

  if (!item) {
    throw new Error('Item not found');
  }

  // Optionally reduce price
  let updatedPrice = item.price;
  if (config.priceReductionPercent) {
    updatedPrice = Math.round(item.price * (1 - config.priceReductionPercent / 100));
    
    await getSupabase()
      .from('items')
      .update({ price: updatedPrice })
      .eq('id', itemId);
  }

  // Determine which platforms to relist on
  const platforms = config.platforms || item.platforms || [];

  // Relist on each platform
  for (const platform of platforms) {
    try {
      // Create new posting record
      const { data: postingData, error: postingError } = await getSupabase()
        .from('postings')
        .insert({
          user_id: userId,
          item_id: itemId,
          platform,
          status: 'pending',
        })
        .select()
        .single();

      if (postingError) {
        results.push({
          itemId,
          platform,
          success: false,
          error: postingError.message,
        });
        continue;
      }

      // Queue the relist through the automation system
      await getSupabase()
        .from('automation_queue')
        .insert({
          item_id: itemId,
          platforms: JSON.stringify([platform]),
          user_id: userId,
          status: 'pending',
          action: 'relist',
          metadata: JSON.stringify({ postingId: postingData.id, newPrice: updatedPrice }),
        });

      results.push({
        itemId,
        platform,
        success: true,
        newPostingId: postingData.id,
      });
    } catch (error) {
      results.push({
        itemId,
        platform,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return results;
}

/**
 * Batch auto-relist multiple items
 */
export async function batchAutoRelist(userId: string): Promise<RelistResult[]> {
  // Get all items for the user
  const { data: items } = await getSupabase()
    .from('items')
    .select('id')
    .eq('user_id', userId)
    .neq('status', 'sold');

  if (!items) return [];

  const allResults: RelistResult[] = [];

  for (const item of items) {
    try {
      const results = await autoRelistItem(item.id, userId);
      allResults.push(...results);
    } catch (error) {
      console.error(`Failed to auto-relist item ${item.id}:`, error);
    }
  }

  return allResults;
}

/**
 * Schedule periodic auto-relist (to be called by cron job)
 */
export async function scheduleAutoRelist(): Promise<void> {
  // Get all users with auto-relist enabled
  const { data: configs } = await getSupabase()
    .from('settings')
    .select('user_id, value')
    .eq('key', 'auto_relist_config');

  if (!configs) return;

  for (const config of configs) {
    const userId = config.user_id;
    const relistConfig: RelistConfig = JSON.parse(config.value);

    if (relistConfig.enabled) {
      try {
        await batchAutoRelist(userId);
      } catch (error) {
        console.error(`Failed to auto-relist for user ${userId}:`, error);
      }
    }
  }
}

/**
 * Get relist statistics for a user
 */
export async function getRelistStats(userId: string): Promise<{
  totalRelists: number;
  successfulRelists: number;
  failedRelists: number;
  averageTimeToRelist: number;
}> {
  const { data: postings } = await getSupabase()
    .from('postings')
    .select('created_at, status')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });

  if (!postings) {
    return {
      totalRelists: 0,
      successfulRelists: 0,
      failedRelists: 0,
      averageTimeToRelist: 0,
    };
  }

  const totalRelists = postings.length;
  const successfulRelists = postings.filter((p: any) => p.status === 'posted').length;
  const failedRelists = postings.filter((p: any) => p.status === 'failed').length;

  // Calculate average time between relists
  let averageTimeToRelist = 0;
  if (postings.length > 1) {
    const timeDiffs: number[] = [];
    for (let i = 1; i < postings.length; i++) {
      const diff = new Date(postings[i].created_at).getTime() - new Date(postings[i - 1].created_at).getTime();
      timeDiffs.push(diff);
    }
    averageTimeToRelist = timeDiffs.reduce((sum, diff) => sum + diff, 0) / timeDiffs.length;
  }

  return {
    totalRelists,
    successfulRelists,
    failedRelists,
    averageTimeToRelist: Math.round(averageTimeToRelist / (1000 * 60 * 60 * 24)), // Convert to days
  };
}
