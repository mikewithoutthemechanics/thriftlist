import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(supabaseUrl, supabaseServiceKey);
}

export interface SyncConfig {
  enabled: boolean;
  autoRemoveSold: boolean;
  syncPlatforms: string[];
  notifyOnSync: boolean;
}

export interface SyncEvent {
  itemId: string;
  platform: string;
  event: 'sold' | 'removed' | 'expired';
  timestamp: string;
  syncedPlatforms: string[];
}

/**
 * Get user's cross-platform sync configuration
 */
export async function getSyncConfig(userId: string): Promise<SyncConfig> {
  const { data, error } = await getSupabase()
    .from('settings')
    .select('value')
    .eq('user_id', userId)
    .eq('key', 'cross_platform_sync_config')
    .single();

  if (error || !data) {
    return {
      enabled: false,
      autoRemoveSold: true,
      syncPlatforms: ['facebook_marketplace', 'yaga', 'gumtree', 'olx', 'junkmail'],
      notifyOnSync: true,
    };
  }

  return JSON.parse(data.value);
}

/**
 * Update cross-platform sync configuration
 */
export async function updateSyncConfig(userId: string, config: SyncConfig): Promise<void> {
  await getSupabase()
    .from('settings')
    .upsert({
      user_id: userId,
      key: 'cross_platform_sync_config',
      value: JSON.stringify(config),
    });
}

/**
 * Handle item sold on a platform - sync to other platforms
 */
export async function handleItemSold(
  itemId: string,
  soldPlatform: string,
  userId: string
): Promise<SyncEvent> {
  const config = await getSyncConfig(userId);
  
  if (!config.enabled) {
    throw new Error('Cross-platform sync is disabled');
  }

  const syncEvent: SyncEvent = {
    itemId,
    platform: soldPlatform,
    event: 'sold',
    timestamp: new Date().toISOString(),
    syncedPlatforms: [],
  };

  // Update item status to sold
  await getSupabase()
    .from('items')
    .update({
      status: 'sold',
      sold_on: soldPlatform,
      sold_at: new Date().toISOString(),
    })
    .eq('id', itemId);

  // Get all active postings for this item on other platforms
  const { data: postings } = await getSupabase()
    .from('postings')
    .select('*')
    .eq('item_id', itemId)
    .eq('user_id', userId)
    .eq('status', 'posted')
    .neq('platform', soldPlatform);

  if (!postings) {
    return syncEvent;
  }

  // Remove or mark as sold on other platforms
  for (const posting of postings) {
    if (config.syncPlatforms.includes(posting.platform)) {
      try {
        // Mark posting as sold
        await getSupabase()
          .from('postings')
          .update({
            status: 'sold',
            updated_at: new Date().toISOString(),
          })
          .eq('id', posting.id);

        syncEvent.syncedPlatforms.push(posting.platform);

        // In production, this would call the platform's API to remove the listing
        // await removeListingFromPlatform(posting.platform, posting.platform_item_id);
      } catch (error) {
        console.error(`Failed to sync sold status to ${posting.platform}:`, error);
      }
    }
  }

  // Log sync event
  await logSyncEvent(userId, syncEvent);

  return syncEvent;
}

/**
 * Handle item removed from a platform
 */
export async function handleItemRemoved(
  itemId: string,
  removedPlatform: string,
  userId: string
): Promise<SyncEvent> {
  const config = await getSyncConfig(userId);
  
  if (!config.enabled) {
    throw new Error('Cross-platform sync is disabled');
  }

  const syncEvent: SyncEvent = {
    itemId,
    platform: removedPlatform,
    event: 'removed',
    timestamp: new Date().toISOString(),
    syncedPlatforms: [],
  };

  // Update posting status
  await getSupabase()
    .from('postings')
    .update({
      status: 'removed',
      updated_at: new Date().toISOString(),
    })
    .eq('item_id', itemId)
    .eq('platform', removedPlatform);

  // Optionally remove from other platforms if autoRemoveSold is enabled
  if (config.autoRemoveSold) {
    const { data: postings } = await getSupabase()
      .from('postings')
      .select('*')
      .eq('item_id', itemId)
      .eq('user_id', userId)
      .eq('status', 'posted')
      .neq('platform', removedPlatform);

    if (postings) {
      for (const posting of postings) {
        if (config.syncPlatforms.includes(posting.platform)) {
          try {
            await getSupabase()
              .from('postings')
              .update({
                status: 'removed',
                updated_at: new Date().toISOString(),
              })
              .eq('id', posting.id);

            syncEvent.syncedPlatforms.push(posting.platform);
          } catch (error) {
            console.error(`Failed to sync removal to ${posting.platform}:`, error);
          }
        }
      }
    }
  }

  await logSyncEvent(userId, syncEvent);

  return syncEvent;
}

/**
 * Sync item status across all platforms
 */
export async function syncItemStatus(
  itemId: string,
  userId: string,
  newStatus: 'sold' | 'removed' | 'expired'
): Promise<SyncEvent> {
  // Get the first platform that has this item posted
  const { data: posting } = await getSupabase()
    .from('postings')
    .select('*')
    .eq('item_id', itemId)
    .eq('user_id', userId)
    .eq('status', 'posted')
    .single();

  if (!posting) {
    throw new Error('No active posting found for this item');
  }

  if (newStatus === 'sold') {
    return await handleItemSold(itemId, posting.platform, userId);
  } else if (newStatus === 'removed') {
    return await handleItemRemoved(itemId, posting.platform, userId);
  } else {
    // Expired
    const syncEvent: SyncEvent = {
      itemId,
      platform: posting.platform,
      event: 'expired',
      timestamp: new Date().toISOString(),
      syncedPlatforms: [],
    };

    await getSupabase()
      .from('postings')
      .update({
        status: 'expired',
        updated_at: new Date().toISOString(),
      })
      .eq('item_id', itemId)
      .eq('user_id', userId);

    await logSyncEvent(userId, syncEvent);

    return syncEvent;
  }
}

/**
 * Log sync event for analytics
 */
async function logSyncEvent(userId: string, event: SyncEvent): Promise<void> {
  await getSupabase()
    .from('sync_events')
    .insert({
      user_id: userId,
      item_id: event.itemId,
      platform: event.platform,
      event: event.event,
      synced_platforms: event.syncedPlatforms,
      timestamp: event.timestamp,
    });
}

/**
 * Get sync history for a user
 */
export async function getSyncHistory(userId: string): Promise<SyncEvent[]> {
  const { data } = await getSupabase()
    .from('sync_events')
    .select('*')
    .eq('user_id', userId)
    .order('timestamp', { ascending: false })
    .limit(50);

  return (data || []).map((e: any) => ({
    itemId: e.item_id,
    platform: e.platform,
    event: e.event,
    timestamp: e.timestamp,
    syncedPlatforms: e.synced_platforms || [],
  }));
}

/**
 * Get sync statistics
 */
export async function getSyncStats(userId: string): Promise<{
  totalSyncs: number;
  successfulSyncs: number;
  platformsSynced: Record<string, number>;
  averageSyncTime: number;
}> {
  const { data } = await getSupabase()
    .from('sync_events')
    .select('*')
    .eq('user_id', userId);

  if (!data) {
    return {
      totalSyncs: 0,
      successfulSyncs: 0,
      platformsSynced: {},
      averageSyncTime: 0,
    };
  }

  const totalSyncs = data.length;
  const successfulSyncs = data.filter((e: any) => e.synced_platforms.length > 0).length;

  const platformsSynced: Record<string, number> = {};
  data.forEach((e: any) => {
    e.synced_platforms.forEach((platform: string) => {
      platformsSynced[platform] = (platformsSynced[platform] || 0) + 1;
    });
  });

  return {
    totalSyncs,
    successfulSyncs,
    platformsSynced,
    averageSyncTime: 0, // Would need to track sync duration
  };
}

/**
 * Manual sync trigger via webhook
 */
export async function handleWebhookSync(
  platform: string,
  platformItemId: string,
  event: 'sold' | 'removed' | 'expired',
  userId: string
): Promise<void> {
  // Find corresponding posting
  const { data: posting } = await getSupabase()
    .from('postings')
    .select('item_id')
    .eq('platform', platform)
    .eq('platform_item_id', platformItemId)
    .eq('user_id', userId)
    .single();

  if (!posting) {
    console.error(`No posting found for platform item ID: ${platformItemId}`);
    return;
  }

  await syncItemStatus(posting.item_id, userId, event);
}
