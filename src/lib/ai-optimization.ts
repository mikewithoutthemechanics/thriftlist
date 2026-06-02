import { ClothingItem } from './types';

export interface OptimizationResult {
  optimizedTitle?: string;
  optimizedDescription?: string;
  suggestedPrice?: number;
  suggestedCategory?: string;
  suggestedTags?: string[];
  confidence: number;
  reasoning?: string;
}

export interface PriceAnalysis {
  currentPrice: number;
  suggestedPrice: number;
  priceRange: { min: number; max: number };
  marketAverage: number;
  confidence: number;
  factors: string[];
}

/**
 * Optimize item listing using AI
 */
export async function optimizeListing(item: Partial<ClothingItem>): Promise<OptimizationResult> {
  try {
    const response = await fetch('/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'optimize_listing',
        data: { item },
      }),
    });

    const data = await response.json();
    return data.result || {};
  } catch (error) {
    console.error('Failed to optimize listing:', error);
    return { confidence: 0 };
  }
}

/**
 * Generate optimized title using AI
 */
export async function generateOptimizedTitle(
  currentTitle: string,
  description: string,
  category: string
): Promise<string> {
  try {
    const response = await fetch('/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'optimize_title',
        data: { currentTitle, description, category },
      }),
    });

    const data = await response.json();
    return data.result || currentTitle;
  } catch (error) {
    console.error('Failed to generate optimized title:', error);
    return currentTitle;
  }
}

/**
 * Generate optimized description using AI
 */
export async function generateOptimizedDescription(
  currentDescription: string,
  title: string,
  category: string,
  brand?: string,
  condition?: string
): Promise<string> {
  try {
    const response = await fetch('/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'optimize_description',
        data: { currentDescription, title, category, brand, condition },
      }),
    });

    const data = await response.json();
    return data.result || currentDescription;
  } catch (error) {
    console.error('Failed to generate optimized description:', error);
    return currentDescription;
  }
}

/**
 * Analyze similar listings for pricing intelligence
 */
export async function analyzeMarketPricing(
  category: string,
  brand?: string,
  condition?: string
): Promise<PriceAnalysis> {
  try {
    const response = await fetch('/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'analyze_pricing',
        data: { category, brand, condition },
      }),
    });

    const data = await response.json();
    return data.result || {
      currentPrice: 0,
      suggestedPrice: 0,
      priceRange: { min: 0, max: 0 },
      marketAverage: 0,
      confidence: 0,
      factors: [],
    };
  } catch (error) {
    console.error('Failed to analyze market pricing:', error);
    return {
      currentPrice: 0,
      suggestedPrice: 0,
      priceRange: { min: 0, max: 0 },
      marketAverage: 0,
      confidence: 0,
      factors: [],
    };
  }
}

/**
 * Generate SEO keywords/tags for listing
 */
export async function generateTags(
  title: string,
  description: string,
  category: string
): Promise<string[]> {
  try {
    const response = await fetch('/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'generate_tags',
        data: { title, description, category },
      }),
    });

    const data = await response.json();
    return data.result || [];
  } catch (error) {
    console.error('Failed to generate tags:', error);
    return [];
  }
}

/**
 * Rewrite description for a specific platform's tone
 */
export async function rewriteDescriptionForPlatform(
  description: string,
  title: string,
  platform: string
): Promise<string> {
  try {
    const response = await fetch('/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'platform_description',
        data: { description, title, platform },
      }),
    });
    const data = await response.json();
    return data.result || description;
  } catch (error) {
    console.error('Failed to rewrite description:', error);
    return description;
  }
}

/**
 * Optimize entire listing in one call (title + description + price)
 */
export async function optimizeFullListing(
  item: Partial<ClothingItem>
): Promise<{ title: string; description: string; price: number } | null> {
  try {
    const response = await fetch('/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'optimize_listing',
        data: { item },
      }),
    });
    const data = await response.json();
    const result = data.result;
    if (!result) return null;

    // Parse JSON if result is a string
    let parsed = result;
    if (typeof result === 'string') {
      try {
        const cleaned = result.replace(/```json\n?|\n?```/g, '').trim();
        parsed = JSON.parse(cleaned);
      } catch {
        return null;
      }
    }

    return {
      title: parsed.optimizedTitle || item.title || '',
      description: parsed.optimizedDescription || item.description || '',
      price: parsed.suggestedPrice || item.price || 0,
    };
  } catch (error) {
    console.error('Failed to optimize full listing:', error);
    return null;
  }
}

/**
 * Batch optimize multiple items
 */
export async function batchOptimizeListings(
  items: Partial<ClothingItem>[]
): Promise<OptimizationResult[]> {
  const results = await Promise.all(
    items.map(item => optimizeListing(item))
  );
  return results;
}
