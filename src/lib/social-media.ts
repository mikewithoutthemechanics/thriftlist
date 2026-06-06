import { createServiceRoleClient } from './supabase-service';
import { ClothingItem } from './types';

function getSupabase() {
  return createServiceRoleClient();
}

export interface SocialMediaPost {
  platform: 'instagram' | 'tiktok' | 'facebook' | 'twitter' | 'pinterest';
  content: string;
  images: string[];
  hashtags: string[];
  scheduledAt?: string;
  status: 'pending' | 'posted' | 'failed';
}

export interface SocialMediaConfig {
  enabled: boolean;
  platforms: ('instagram' | 'tiktok' | 'facebook' | 'twitter' | 'pinterest')[];
  autoPostOnListing: boolean;
  autoPostOnSale: boolean;
  includePrice: boolean;
  includeLink: boolean;
  customHashtags: string[];
}

export interface PostResult {
  platform: string;
  success: boolean;
  postId?: string;
  url?: string;
  error?: string;
}

/**
 * Get user's social media configuration
 */
export async function getSocialMediaConfig(userId: string): Promise<SocialMediaConfig> {
  try {
    const { data, error } = await getSupabase()
      .from('settings')
      .select('value')
      .eq('user_id', userId)
      .eq('key', 'social_media_config')
      .single();

    if (!error && data?.value) {
      return JSON.parse(data.value);
    }
  } catch (err) {
    console.warn('Failed to fetch social media config:', err);
  }

  return {
    enabled: false,
    platforms: ['instagram', 'facebook'],
    autoPostOnListing: true,
    autoPostOnSale: false,
    includePrice: true,
    includeLink: true,
    customHashtags: ['thrift', 'southafrica', 'secondhand'],
  };
}

/**
 * Generate social media content from item
 */
export function generateSocialMediaContent(
  item: Partial<ClothingItem>,
  platform: 'instagram' | 'tiktok' | 'facebook' | 'twitter' | 'pinterest',
  config: SocialMediaConfig
): { content: string; hashtags: string[] } {
  const hashtags = generateHashtags(item, config.customHashtags);
  let content = '';

  switch (platform) {
    case 'instagram':
      content = generateInstagramContent(item, config);
      break;
    case 'tiktok':
      content = generateTikTokContent(item, config);
      break;
    case 'facebook':
      content = generateFacebookContent(item, config);
      break;
    case 'twitter':
      content = generateTwitterContent(item, config);
      break;
    case 'pinterest':
      content = generatePinterestContent(item, config);
      break;
  }

  return { content, hashtags };
}

/**
 * Generate Instagram content
 */
function generateInstagramContent(item: Partial<ClothingItem>, config: SocialMediaConfig): string {
  let content = '';

  if (item.title) {
    content += `${item.title}\n\n`;
  }

  if (item.description) {
    content += `${item.description.substring(0, 2200)}${item.description.length > 2200 ? '...' : ''}\n\n`;
  }

  if (config.includePrice && item.price) {
    content += `💰 R${item.price}\n\n`;
  }

  if (item.brand) {
    content += `Brand: ${item.brand}\n`;
  }

  if (item.size) {
    content += `Size: ${item.size}\n`;
  }

  if (item.condition) {
    content += `Condition: ${item.condition}\n`;
  }

  if (config.includeLink) {
    content += `\n🔗 Link in bio to purchase!`;
  }

  return content;
}

/**
 * Generate TikTok content
 */
function generateTikTokContent(item: Partial<ClothingItem>, config: SocialMediaConfig): string {
  let content = '';

  if (item.title) {
    content += `${item.title} `;
  }

  if (config.includePrice && item.price) {
    content += `💰 R${item.price} `;
  }

  if (item.brand) {
    content += `| ${item.brand} `;
  }

  content += `\n\n#thrift #southafrica #secondhand #fashion`;

  return content;
}

/**
 * Generate Facebook content
 */
function generateFacebookContent(item: Partial<ClothingItem>, config: SocialMediaConfig): string {
  let content = '';

  if (item.title) {
    content += `🛍️ ${item.title}\n\n`;
  }

  if (item.description) {
    content += `${item.description}\n\n`;
  }

  if (item.brand) {
    content += `🏷️ Brand: ${item.brand}\n`;
  }

  if (item.size) {
    content += `📏 Size: ${item.size}\n`;
  }

  if (item.condition) {
    content += `✨ Condition: ${item.condition}\n`;
  }

  if (config.includePrice && item.price) {
    content += `💵 Price: R${item.price}\n`;
  }

  if (config.includeLink) {
    content += `\n👉 Click the link to purchase!`;
  }

  return content;
}

/**
 * Generate Twitter content
 */
function generateTwitterContent(item: Partial<ClothingItem>, config: SocialMediaConfig): string {
  let content = '';
  const maxLength = 280;

  if (item.title) {
    content += `${item.title}`;
  }

  if (config.includePrice && item.price) {
    content += ` 💰 R${item.price}`;
  }

  if (item.brand) {
    content += ` | ${item.brand}`;
  }

  if (config.includeLink) {
    content += `\n🔗 Link in bio`;
  }

  // Ensure it fits Twitter's character limit
  if (content.length > maxLength - 30) {
    content = content.substring(0, maxLength - 33) + '...';
  }

  return content;
}

/**
 * Generate Pinterest content
 */
function generatePinterestContent(item: Partial<ClothingItem>, config: SocialMediaConfig): string {
  let content = '';

  if (item.title) {
    content += `${item.title}`;
  }

  if (item.description) {
    content += ` - ${item.description.substring(0, 500)}`;
  }

  if (config.includePrice && item.price) {
    content += ` | R${item.price}`;
  }

  return content;
}

/**
 * Generate hashtags
 */
function generateHashtags(item: Partial<ClothingItem>, customHashtags: string[]): string[] {
  const hashtags = [...customHashtags];

  if (item.category) {
    hashtags.push(item.category.toLowerCase());
  }

  if (item.brand) {
    hashtags.push(item.brand.toLowerCase().replace(/\s+/g, ''));
  }

  if (item.condition === 'new') {
    hashtags.push('brandnew');
  }

  if (item.condition === 'like_new' || item.condition === 'good') {
    hashtags.push('greatcondition');
  }

  // Add general fashion hashtags
  hashtags.push('fashion', 'style', 'ootd', 'thriftfashion');

  // Remove duplicates and limit to 30
  return [...new Set(hashtags)].slice(0, 30);
}

/**
 * Post to social media
 */
export async function postToSocialMedia(
  post: SocialMediaPost,
  accessToken?: string
): Promise<PostResult> {
  try {
    let result: PostResult = {
      platform: post.platform,
      success: false,
    };

    switch (post.platform) {
      case 'instagram':
        result = await postToInstagram(post, accessToken);
        break;
      case 'tiktok':
        result = await postToTikTok(post, accessToken);
        break;
      case 'facebook':
        result = await postToFacebook(post, accessToken);
        break;
      case 'twitter':
        result = await postToTwitter(post, accessToken);
        break;
      case 'pinterest':
        result = await postToPinterest(post, accessToken);
        break;
    }

    return result;
  } catch (error) {
    return {
      platform: post.platform,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Post to Instagram via Instagram Graph API (requires Facebook Page linked to Instagram)
 */
async function postToInstagram(post: SocialMediaPost, accessToken?: string): Promise<PostResult> {
  if (!accessToken) {
    return { platform: 'instagram', success: false, error: 'Instagram access token not configured. Connect via Settings > Social Media.' };
  }

  try {
    // Step 1: Get Instagram Business Account ID
    const accountsRes = await fetch(
      `https://graph.facebook.com/v19.0/me/accounts?fields=instagram_business_account&access_token=${accessToken}`
    );
    const accountsData = await accountsRes.json();
    const igAccountId = accountsData.data?.[0]?.instagram_business_account?.id;

    if (!igAccountId) {
      return { platform: 'instagram', success: false, error: 'No Instagram Business account linked. Link your Instagram to a Facebook Page first.' };
    }

    // Step 2: Create media container
    const caption = `${post.content}\n\n${post.hashtags.map(t => `#${t}`).join(' ')}`;
    const containerParams: Record<string, string> = {
      caption,
      access_token: accessToken,
    };

    if (post.images.length > 0) {
      containerParams.image_url = post.images[0];
    }

    const containerRes = await fetch(
      `https://graph.facebook.com/v19.0/${igAccountId}/media`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(containerParams),
      }
    );
    const containerData = await containerRes.json();

    if (containerData.error) {
      return { platform: 'instagram', success: false, error: containerData.error.message };
    }

    // Step 3: Publish the container
    const publishRes = await fetch(
      `https://graph.facebook.com/v19.0/${igAccountId}/media_publish`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creation_id: containerData.id,
          access_token: accessToken,
        }),
      }
    );
    const publishData = await publishRes.json();

    if (publishData.error) {
      return { platform: 'instagram', success: false, error: publishData.error.message };
    }

    return {
      platform: 'instagram',
      success: true,
      postId: publishData.id,
      url: `https://www.instagram.com/p/${publishData.id}`,
    };
  } catch (error) {
    return { platform: 'instagram', success: false, error: error instanceof Error ? error.message : 'Instagram API request failed' };
  }
}

/**
 * Post to TikTok via TikTok Content Posting API
 */
async function postToTikTok(post: SocialMediaPost, accessToken?: string): Promise<PostResult> {
  if (!accessToken) {
    return { platform: 'tiktok', success: false, error: 'TikTok access token not configured. Connect via Settings > Social Media.' };
  }

  try {
    // TikTok Content Posting API - create a photo post
    const caption = `${post.content} ${post.hashtags.map(t => `#${t}`).join(' ')}`;

    const postBody: Record<string, unknown> = {
      post_info: {
        title: caption.substring(0, 150),
        privacy_level: 'SELF_ONLY', // start as private, user can change
      },
      source_info: {
        source: 'PULL_FROM_URL',
        photo_cover_index: 0,
        photo_images: post.images.slice(0, 35),
      },
    };

    const res = await fetch('https://open.tiktokapis.com/v2/post/publish/content/init/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json; charset=UTF-8',
      },
      body: JSON.stringify(postBody),
    });

    const data = await res.json();

    if (data.error?.code !== 'ok' && data.error?.code) {
      return { platform: 'tiktok', success: false, error: data.error.message || 'TikTok API error' };
    }

    return {
      platform: 'tiktok',
      success: true,
      postId: data.data?.publish_id,
    };
  } catch (error) {
    return { platform: 'tiktok', success: false, error: error instanceof Error ? error.message : 'TikTok API request failed' };
  }
}

/**
 * Post to Facebook via Graph API
 */
async function postToFacebook(post: SocialMediaPost, accessToken?: string): Promise<PostResult> {
  if (!accessToken) {
    return { platform: 'facebook', success: false, error: 'Facebook access token not configured. Connect via Settings > Social Media.' };
  }

  try {
    const message = `${post.content}\n\n${post.hashtags.map(t => `#${t}`).join(' ')}`;

    const body: Record<string, string> = { message };
    if (post.images.length > 0) {
      body.link = post.images[0];
    }

    const res = await fetch(`https://graph.facebook.com/v19.0/me/feed`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (data.error) {
      return { platform: 'facebook', success: false, error: data.error.message };
    }

    return {
      platform: 'facebook',
      success: true,
      postId: data.id,
      url: `https://facebook.com/${data.id}`,
    };
  } catch (error) {
    return { platform: 'facebook', success: false, error: error instanceof Error ? error.message : 'Facebook API request failed' };
  }
}

/**
 * Post to Twitter/X via Twitter API v2
 */
async function postToTwitter(post: SocialMediaPost, accessToken?: string): Promise<PostResult> {
  if (!accessToken) {
    return { platform: 'twitter', success: false, error: 'Twitter/X access token not configured. Connect via Settings > Social Media.' };
  }

  try {
    const text = `${post.content} ${post.hashtags.slice(0, 5).map(t => `#${t}`).join(' ')}`.substring(0, 280);

    const res = await fetch('https://api.twitter.com/2/tweets', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    });

    const data = await res.json();

    if (data.errors) {
      return { platform: 'twitter', success: false, error: data.errors[0]?.message || 'Twitter API error' };
    }

    return {
      platform: 'twitter',
      success: true,
      postId: data.data?.id,
      url: `https://twitter.com/i/web/status/${data.data?.id}`,
    };
  } catch (error) {
    return { platform: 'twitter', success: false, error: error instanceof Error ? error.message : 'Twitter API request failed' };
  }
}

/**
 * Post to Pinterest via Pinterest API v5
 */
async function postToPinterest(post: SocialMediaPost, accessToken?: string): Promise<PostResult> {
  if (!accessToken) {
    return { platform: 'pinterest', success: false, error: 'Pinterest access token not configured. Connect via Settings > Social Media.' };
  }

  try {
    const pinBody: Record<string, unknown> = {
      title: post.content.substring(0, 100),
      description: `${post.content}\n${post.hashtags.map(t => `#${t}`).join(' ')}`,
      board_id: 'default',
    };

    if (post.images.length > 0) {
      pinBody.media_source = {
        source_type: 'image_url',
        url: post.images[0],
      };
    }

    const res = await fetch('https://api.pinterest.com/v5/pins', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(pinBody),
    });

    const data = await res.json();

    if (!res.ok) {
      return { platform: 'pinterest', success: false, error: data.message || 'Pinterest API error' };
    }

    return {
      platform: 'pinterest',
      success: true,
      postId: data.id,
      url: `https://pinterest.com/pin/${data.id}`,
    };
  } catch (error) {
    return { platform: 'pinterest', success: false, error: error instanceof Error ? error.message : 'Pinterest API request failed' };
  }
}

/**
 * Auto-post item to social media on listing
 */
export async function autoPostOnListing(
  item: Partial<ClothingItem>,
  userId: string
): Promise<PostResult[]> {
  const config = await getSocialMediaConfig(userId);
  
  if (!config.enabled || !config.autoPostOnListing) {
    return [];
  }

  const results: PostResult[] = [];

  for (const platform of config.platforms) {
    const { content, hashtags } = generateSocialMediaContent(item, platform, config);
    const post: SocialMediaPost = {
      platform,
      content,
      images: item.photos || [],
      hashtags,
      status: 'pending',
    };

    const result = await postToSocialMedia(post);
    results.push(result);
  }

  return results;
}

/**
 * Auto-post item to social media on sale
 */
export async function autoPostOnSale(
  item: Partial<ClothingItem>,
  userId: string
): Promise<PostResult[]> {
  const config = await getSocialMediaConfig(userId);
  
  if (!config.enabled || !config.autoPostOnSale) {
    return [];
  }

  const results: PostResult[] = [];

  for (const platform of config.platforms) {
    let content = '';
    const hashtags = generateHashtags(item, config.customHashtags);

    switch (platform) {
      case 'instagram':
        content = `🎉 SOLD! ${item.title}\n\nThank you to the buyer! Check out our other listings for more great items.\n\n`;
        break;
      case 'facebook':
        content = `🎉 SOLD! ${item.title}\n\nThis item has found a new home. Browse our other listings for more great finds!\n\n`;
        break;
      default:
        content = `🎉 SOLD! ${item.title}`;
    }

    content += hashtags.map(tag => `#${tag}`).join(' ');

    const post: SocialMediaPost = {
      platform,
      content,
      images: item.photos || [],
      hashtags,
      status: 'pending',
    };

    const result = await postToSocialMedia(post);
    results.push(result);
  }

  return results;
}

/**
 * Schedule social media posts
 */
export async function scheduleSocialMediaPosts(
  item: Partial<ClothingItem>,
  userId: string,
  scheduledAt: Date
): Promise<void> {
  const config = await getSocialMediaConfig(userId);
  
  if (!config.enabled) {
    return;
  }

  for (const platform of config.platforms) {
    const { content, hashtags } = generateSocialMediaContent(item, platform, config);

    await getSupabase()
      .from('social_media_posts')
      .insert({
        user_id: userId,
        platform,
        content,
        hashtags,
        images: item.photos || [],
        scheduled_at: scheduledAt.toISOString(),
        status: 'scheduled',
      });
  }
}

/**
 * Get social media post analytics
 */
export async function getSocialMediaAnalytics(userId: string): Promise<{
  totalPosts: number;
  successfulPosts: number;
  platformStats: Record<string, { posts: number; engagement: number }>;
}> {
  try {
    const { data, error } = await getSupabase()
      .from('social_media_posts')
      .select('*')
      .eq('user_id', userId);

    if (error || !data) {
      return { totalPosts: 0, successfulPosts: 0, platformStats: {} };
    }

    const totalPosts = data.length;
    const successfulPosts = data.filter((p: Record<string, unknown>) => p.status === 'posted').length;

    const platformStats: Record<string, { posts: number; engagement: number }> = {};
    for (const post of data) {
      const platform = post.platform as string;
      if (!platformStats[platform]) {
        platformStats[platform] = { posts: 0, engagement: 0 };
      }
      platformStats[platform].posts++;
      platformStats[platform].engagement += (post.engagement as number) || 0;
    }

    return { totalPosts, successfulPosts, platformStats };
  } catch (err) {
    console.warn('Failed to fetch social media analytics:', err);
    return { totalPosts: 0, successfulPosts: 0, platformStats: {} };
  }
}
