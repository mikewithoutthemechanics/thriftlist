import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(supabaseUrl, supabaseServiceKey);
}

export interface PlatformSyncResult {
  platform: string;
  totalItems: number;
  soldItems: number;
  errors: string[];
}

export interface SyncedItem {
  itemId: string;
  platform: string;
  status: 'sold' | 'available' | 'removed';
  platformItemId?: string;
  soldAt?: string;
}

/**
 * Check if an item is sold on a platform by scraping its listing page
 */
export async function checkItemStatusOnPlatform(
  platformItemId: string,
  platform: string
): Promise<{ status: 'sold' | 'available' | 'removed'; soldAt?: string }> {
  const listingUrl = buildListingUrl(platform, platformItemId);
  if (!listingUrl) {
    return { status: 'available' };
  }

  try {
    const res = await fetch(listingUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      redirect: 'follow',
    });

    if (res.status === 404 || res.status === 410) {
      return { status: 'removed' };
    }

    if (!res.ok) {
      return { status: 'available' };
    }

    const html = await res.text();
    const lowerHtml = html.toLowerCase();

    // Check for sold indicators
    const soldIndicators = ['sold', 'verkoop', 'item has been sold', 'no longer available', 'listing has ended', 'expired'];
    for (const indicator of soldIndicators) {
      if (lowerHtml.includes(indicator)) {
        return { status: 'sold', soldAt: new Date().toISOString() };
      }
    }

    // Check for removed/expired indicators
    const removedIndicators = ['removed', 'deleted', 'this listing has been removed', 'page not found', 'does not exist'];
    for (const indicator of removedIndicators) {
      if (lowerHtml.includes(indicator)) {
        return { status: 'removed' };
      }
    }

    return { status: 'available' };
  } catch (error) {
    console.warn(`Failed to check status for ${platform}/${platformItemId}:`, error);
    return { status: 'available' };
  }
}

function buildListingUrl(platform: string, platformItemId: string): string | null {
  switch (platform) {
    case 'facebook_marketplace':
      return `https://www.facebook.com/marketplace/item/${platformItemId}`;
    case 'yaga':
      return `https://yaga.co.za/item/${platformItemId}`;
    case 'gumtree':
      return `https://www.gumtree.co.za/a-clothing/${platformItemId}`;
    case 'olx':
      return `https://www.olx.co.za/item/${platformItemId}`;
    case 'junkmail':
      return `https://www.junkmail.co.za/v/${platformItemId}`;
    default:
      return null;
  }
}

/**
 * Sync inventory from all platforms
 */
export async function syncInventoryFromPlatforms(userId: string): Promise<PlatformSyncResult[]> {
  // Get all postings for the user
  const { data: postings, error } = await getSupabase()
    .from('postings')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'posted');

  if (error) {
    console.error('Failed to fetch postings for sync:', error);
    return [];
  }

  // Group by platform
  const platformPostings: Record<string, any[]> = {};
  postings?.forEach((posting) => {
    if (!platformPostings[posting.platform]) {
      platformPostings[posting.platform] = [];
    }
    platformPostings[posting.platform].push(posting);
  });

  const results: PlatformSyncResult[] = [];

  // Sync each platform
  for (const [platform, postings] of Object.entries(platformPostings)) {
    const result = await syncPlatform(platform, postings);
    results.push(result);
  }

  return results;
}

/**
 * Sync a specific platform
 */
export async function syncPlatform(
  platform: string,
  postings: any[]
): Promise<PlatformSyncResult> {
  const result: PlatformSyncResult = {
    platform,
    totalItems: postings.length,
    soldItems: 0,
    errors: [],
  };

  for (const posting of postings) {
    try {
      // Check if the posting has a platform item ID
      const platformItemId = posting.platform_item_id || posting.url?.split('/').pop();
      
      if (!platformItemId) {
        result.errors.push(`No platform item ID for posting ${posting.id}`);
        continue;
      }

      // Check status on platform
      const status = await checkItemStatusOnPlatform(platformItemId, platform);

      // Update local inventory if item is sold
      if (status.status === 'sold') {
        await markItemAsSold(posting.item_id, platform, status.soldAt);
        result.soldItems++;
      } else if (status.status === 'removed') {
        await updatePostingStatus(posting.id, 'removed');
      }
    } catch (error) {
      result.errors.push(`Failed to sync posting ${posting.id}: ${error}`);
    }
  }

  return result;
}

/**
 * Mark item as sold in local inventory
 */
async function markItemAsSold(
  itemId: string,
  platform: string,
  soldAt?: string
): Promise<void> {
  await getSupabase()
    .from('items')
    .update({
      status: 'sold',
      sold_at: soldAt || new Date().toISOString(),
      sold_on: platform,
    })
    .eq('id', itemId);
}

/**
 * Update posting status
 */
async function updatePostingStatus(
  postingId: string,
  status: string
): Promise<void> {
  await getSupabase()
    .from('postings')
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq('id', postingId);
}

/**
 * Manual sync trigger via webhook
 */
export async function handleWebhookSync(
  platform: string,
  payload: any
): Promise<void> {
  // Parse platform-specific webhook payload
  // This would be called when platforms send webhooks about item status changes
  
  const platformItemId = extractPlatformItemId(platform, payload);
  if (!platformItemId) {
    console.error('Could not extract platform item ID from webhook');
    return;
  }

  // Find corresponding posting
  const { data: posting } = await getSupabase()
    .from('postings')
    .select('*')
    .eq('platform', platform)
    .eq('platform_item_id', platformItemId)
    .single();

  if (!posting) {
    console.error(`No posting found for platform item ID: ${platformItemId}`);
    return;
  }

  // Determine status from webhook payload
  const status = determineStatusFromWebhook(platform, payload);

  if (status === 'sold') {
    await markItemAsSold(posting.item_id, platform, payload.soldAt);
  } else if (status === 'removed') {
    await updatePostingStatus(posting.id, 'removed');
  }
}

/**
 * Extract platform item ID from webhook payload
 */
function extractPlatformItemId(platform: string, payload: any): string | null {
  // Platform-specific extraction logic
  switch (platform) {
    case 'facebook_marketplace':
      return payload.listing_id || payload.id;
    case 'yaga':
      return payload.item_id || payload.id;
    default:
      return payload.id || null;
  }
}

/**
 * Determine status from webhook payload
 */
function determineStatusFromWebhook(platform: string, payload: any): 'sold' | 'available' | 'removed' {
  // Platform-specific status determination
  if (payload.status === 'sold' || payload.sold) {
    return 'sold';
  }
  if (payload.status === 'removed' || payload.deleted) {
    return 'removed';
  }
  return 'available';
}

/**
 * Schedule periodic sync (to be called by a cron job)
 */
export async function schedulePeriodicSync(): Promise<void> {
  // Get all users with active postings
  const { data: users } = await getSupabase()
    .from('postings')
    .select('user_id')
    .eq('status', 'posted')
    .not('user_id', 'is', null);

  if (!users) return;

  // Sync each user's inventory
  const uniqueUserIds = [...new Set(users.map((u: any) => u.user_id))];
  for (const userId of uniqueUserIds) {
    try {
      await syncInventoryFromPlatforms(userId);
    } catch (error) {
      console.error(`Failed to sync inventory for user ${userId}:`, error);
    }
  }
}
