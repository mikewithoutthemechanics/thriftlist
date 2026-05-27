import { ClothingItem } from './types';

export type { ClothingItem };

export interface PlatformAPIConfig {
  accessToken?: string;
  apiKey?: string;
  apiSecret?: string;
}

export interface PlatformAPIResponse {
  success: boolean;
  url: string | null;
  error?: string;
}

/**
 * Facebook Marketplace API Integration
 * Note: Requires Facebook Graph API access token with marketplace permissions
 */
export async function postToFacebookAPI(
  item: ClothingItem,
  config: PlatformAPIConfig
): Promise<PlatformAPIResponse> {
   if (!config.accessToken) {
     return { success: false, error: 'Facebook access token not configured', url: null };
   }

  try {
    const response = await fetch('https://graph.facebook.com/v19.0/me/feed', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: `${item.title}\n\n${item.description}\n\nPrice: R${item.price}\n\n${item.photos?.[0] || ''}`,
        link: item.photos?.[0] || '',
      }),
    });

    const data = await response.json();
    
     if (data.error) {
       return { success: false, error: data.error.message, url: null };
     }

    return { success: true, url: data.id ? `https://facebook.com/${data.id}` : null };
   } catch (error) {
     return { success: false, error: 'Failed to post to Facebook API', url: null };
   }
}

/**
 * Generic API posting function for platforms with REST APIs
 * This is a template that can be customized for specific platforms
 */
export async function postViaGenericAPI(
  endpoint: string,
  item: ClothingItem,
  config: PlatformAPIConfig,
  headers: Record<string, string> = {}
): Promise<PlatformAPIResponse> {
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
        ...(config.apiKey ? { 'X-API-Key': config.apiKey } : {}),
      },
      body: JSON.stringify({
        title: item.title,
        description: item.description,
        price: item.price,
        category: item.category,
        condition: item.condition,
        photos: item.photos,
        brand: item.brand,
        size: item.size,
        color: item.color,
      }),
    });

    const data = await response.json();
    
     if (!response.ok) {
       return { success: false, error: data.message || 'API request failed', url: null };
     }

    return { success: true, url: data.listingUrl || data.url };
   } catch (error) {
     return { success: false, error: 'API request failed', url: null };
   }
}

/**
 * Check if a platform has API support
 */
export function hasAPISupport(platformId: string): boolean {
  // Currently only Facebook has API integration
  // Add more platforms as their APIs become available
  return platformId === 'facebook_marketplace';
}

/**
 * Get API config from user settings
 */
export function getPlatformAPIConfig(
  platformId: string,
  settings: Record<string, string>
): PlatformAPIConfig {
  return {
    accessToken: settings[`${platformId}_access_token`],
    apiKey: settings[`${platformId}_api_key`],
    apiSecret: settings[`${platformId}_api_secret`],
  };
}
