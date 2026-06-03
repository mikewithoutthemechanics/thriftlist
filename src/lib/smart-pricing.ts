import { createClient } from '@supabase/supabase-js';
import { ClothingItem } from './types';

function getSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(supabaseUrl, supabaseServiceKey);
}

export interface PriceRecommendation {
  suggestedPrice: number;
  confidence: number;
  reasoning: string;
  factors: {
    factor: string;
    impact: 'positive' | 'negative' | 'neutral';
    value: number;
  }[];
  priceRange: {
    min: number;
    max: number;
    recommended: number;
  };
}

export interface PriceHistoryData {
  itemId: string;
  priceHistory: { price: number; date: string }[];
  averagePrice: number;
  priceTrend: 'increasing' | 'decreasing' | 'stable';
}

/**
 * Calculate smart price based on market data
 */
export async function calculateSmartPrice(
  item: Partial<ClothingItem>,
  similarItems?: ClothingItem[]
): Promise<PriceRecommendation> {
  const factors: any[] = [];
  let basePrice = item.price || 0;

  // Factor in category average
  if (item.category) {
    const categoryAverage = await getCategoryAveragePrice(item.category);
    if (categoryAverage > 0) {
      const diff = basePrice - categoryAverage;
      factors.push({
        factor: 'Category average',
        impact: diff > 0 ? 'positive' : 'negative',
        value: categoryAverage,
      });
      basePrice = categoryAverage;
    }
  }

  // Factor in brand premium
  if (item.brand) {
    const brandPremium = await getBrandPremium(item.brand);
    if (brandPremium > 0) {
      basePrice *= (1 + brandPremium);
      factors.push({
        factor: 'Brand premium',
        impact: 'positive',
        value: brandPremium,
      });
    }
  }

  // Factor in condition
  if (item.condition) {
    const conditionMultiplier = getConditionMultiplier(item.condition);
    basePrice *= conditionMultiplier;
    factors.push({
      factor: 'Condition',
      impact: conditionMultiplier > 1 ? 'positive' : 'negative',
      value: conditionMultiplier,
    });
  }

  // Factor in similar items
  if (similarItems && similarItems.length > 0) {
    const avgSimilarPrice = similarItems.reduce((sum, i) => sum + (i.price || 0), 0) / similarItems.length;
    const marketAdjustment = (avgSimilarPrice - basePrice) * 0.3; // 30% weight to market
    basePrice += marketAdjustment;
    factors.push({
      factor: 'Market comparison',
      impact: marketAdjustment > 0 ? 'positive' : 'negative',
      value: avgSimilarPrice,
    });
  }

  // Round to nearest 10
  const suggestedPrice = Math.round(basePrice / 10) * 10;

  // Calculate price range
  const priceRange = {
    min: Math.round(suggestedPrice * 0.8),
    max: Math.round(suggestedPrice * 1.2),
    recommended: suggestedPrice,
  };

  // Calculate confidence
  const confidence = Math.min(0.95, 0.5 + (factors.length * 0.1));

  return {
    suggestedPrice,
    confidence,
    reasoning: generateReasoning(factors),
    factors,
    priceRange,
  };
}

/**
 * Get average price for a category from DB, with hardcoded fallback
 */
async function getCategoryAveragePrice(category: string): Promise<number> {
  const fallbackAverages: Record<string, number> = {
    'Tops': 250,
    'Bottoms': 300,
    'Dresses': 450,
    'Outerwear': 600,
    'Shoes': 400,
    'Accessories': 200,
    'Activewear': 350,
    'Swimwear': 300,
    'Formal Wear': 800,
    'Vintage': 500,
  };

  try {
    const { data } = await getSupabase()
      .from('market_pricing')
      .select('avg_price')
      .eq('category', category)
      .limit(10);

    if (data && data.length > 0) {
      const avg = data.reduce((sum: number, row: Record<string, unknown>) => sum + ((row.avg_price as number) || 0), 0) / data.length;
      if (avg > 0) return Math.round(avg);
    }
  } catch (err) {
    console.warn('DB pricing lookup failed, using fallback:', err);
  }

  return fallbackAverages[category] || 0;
}

/**
 * Get brand premium multiplier from DB, with hardcoded fallback
 */
async function getBrandPremium(brand: string): Promise<number> {
  const fallbackPremiums: Record<string, number> = {
    'Nike': 0.2,
    'Adidas': 0.15,
    'Zara': 0.1,
    'H&M': 0.05,
    'Gucci': 0.5,
    'Prada': 0.5,
    'Louis Vuitton': 0.5,
    'Supreme': 0.3,
  };

  try {
    const { data } = await getSupabase()
      .from('market_pricing')
      .select('avg_price')
      .eq('brand', brand)
      .limit(5);

    if (data && data.length > 0) {
      const avgBrandPrice = data.reduce((sum: number, row: Record<string, unknown>) => sum + ((row.avg_price as number) || 0), 0) / data.length;
      if (avgBrandPrice > 300) {
        return Math.min(0.5, (avgBrandPrice - 300) / 300);
      }
    }
  } catch (err) {
    console.warn('DB brand premium lookup failed, using fallback:', err);
  }

  return fallbackPremiums[brand] || 0;
}

/**
 * Get condition multiplier
 */
function getConditionMultiplier(condition: string): number {
  const multipliers: Record<string, number> = {
    'new': 1.0,
    'like_new': 0.9,
    'good': 0.75,
    'fair': 0.6,
    'poor': 0.4,
  };
  return multipliers[condition] || 0.75;
}

/**
 * Generate reasoning text
 */
function generateReasoning(factors: any[]): string {
  if (factors.length === 0) return 'Based on standard market pricing';
  
  const positiveFactors = factors.filter(f => f.impact === 'positive');
  const negativeFactors = factors.filter(f => f.impact === 'negative');
  
  let reasoning = '';
  
  if (positiveFactors.length > 0) {
    reasoning += `Price adjusted up for: ${positiveFactors.map(f => f.factor).join(', ')}. `;
  }
  
  if (negativeFactors.length > 0) {
    reasoning += `Price adjusted down for: ${negativeFactors.map(f => f.factor).join(', ')}. `;
  }
  
  return reasoning.trim();
}

/**
 * Track price history for analytics
 */
export async function trackPriceHistory(itemId: string, oldPrice: number, newPrice: number): Promise<void> {
  // This is already handled by the database trigger in price_history table
  // This function can be used for additional analytics or logging
}

/**
 * Get price trend for an item
 */
export function getPriceTrend(priceHistory: { price: number; date: string }[]): 'increasing' | 'decreasing' | 'stable' {
  if (priceHistory.length < 2) return 'stable';
  
  const recent = priceHistory.slice(-3);
  const firstPrice = recent[0].price;
  const lastPrice = recent[recent.length - 1].price;
  
  const changePercent = ((lastPrice - firstPrice) / firstPrice) * 100;
  
  if (changePercent > 5) return 'increasing';
  if (changePercent < -5) return 'decreasing';
  return 'stable';
}

/**
 * Suggest price adjustment based on time listed
 */
export function suggestPriceAdjustment(
  listedDate: string,
  currentPrice: number,
  originalPrice: number
): { shouldAdjust: boolean; newPrice?: number; reason: string } {
  const daysListed = Math.floor((Date.now() - new Date(listedDate).getTime()) / (1000 * 60 * 60 * 24));
  
  // Suggest price reduction if item has been listed for more than 30 days
  if (daysListed > 30) {
    const reductionPercent = Math.min(0.2, (daysListed - 30) * 0.01); // Max 20% reduction
    const newPrice = Math.round(currentPrice * (1 - reductionPercent) / 10) * 10;
    
    return {
      shouldAdjust: true,
      newPrice,
      reason: `Item has been listed for ${daysListed} days. Consider reducing price by ${Math.round(reductionPercent * 100)}% to increase visibility.`,
    };
  }
  
  // Suggest price increase if selling quickly
  if (daysListed < 7 && currentPrice < originalPrice * 0.8) {
    return {
      shouldAdjust: true,
      newPrice: Math.round(originalPrice * 0.9 / 10) * 10,
      reason: 'Item is selling quickly. Consider increasing price closer to original value.',
    };
  }
  
  return {
    shouldAdjust: false,
    reason: 'Current price is appropriate for listing duration.',
  };
}
