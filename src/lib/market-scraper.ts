import { createServiceRoleClient } from './supabase-service';

function getSupabase() {
  return createServiceRoleClient();
}

interface MarketPriceEntry {
  platform: string;
  category: string;
  brand?: string;
  avg_price: number;
  min_price: number;
  max_price: number;
  sample_count: number;
  scraped_at: string;
}

const SCRAPE_TARGETS = [
  { platform: 'yaga', url: 'https://yaga.co.za/search?category=', categories: ['Tops', 'Bottoms', 'Dresses', 'Shoes', 'Outerwear'] },
  { platform: 'gumtree', url: 'https://www.gumtree.co.za/s-clothing/', categories: ['Tops', 'Bottoms', 'Dresses', 'Shoes', 'Outerwear'] },
];

/**
 * Scrape market prices from South African platforms.
 * Uses basic HTTP fetching and HTML parsing for price data.
 */
export async function scrapeMarketPrices(): Promise<void> {
  const entries: MarketPriceEntry[] = [];

  for (const target of SCRAPE_TARGETS) {
    for (const category of target.categories) {
      try {
        const prices = await scrapeCategoryPrices(target.platform, target.url, category);
        if (prices.length > 0) {
          const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
          entries.push({
            platform: target.platform,
            category,
            avg_price: Math.round(avg),
            min_price: Math.min(...prices),
            max_price: Math.max(...prices),
            sample_count: prices.length,
            scraped_at: new Date().toISOString(),
          });
        }
      } catch (err) {
        console.warn(`Failed to scrape ${target.platform}/${category}:`, err);
      }
    }
  }

  if (entries.length > 0) {
    const { error } = await getSupabase()
      .from('market_pricing')
      .upsert(entries, { onConflict: 'platform,category' });

    if (error) {
      console.error('Failed to upsert market pricing data:', error);
    } else {
      console.log(`Scraped ${entries.length} market pricing entries`);
    }
  }
}

async function scrapeCategoryPrices(platform: string, baseUrl: string, category: string): Promise<number[]> {
  const url = `${baseUrl}${encodeURIComponent(category.toLowerCase())}`;

  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    },
  });

  if (!res.ok) return [];

  const html = await res.text();
  const prices: number[] = [];

  // Extract prices using common South African Rand patterns (R 100, R100, R 1,000, R1 000)
  const priceRegex = /R\s?(\d{1,3}(?:[,\s]\d{3})*(?:\.\d{2})?)/g;
  let match;
  while ((match = priceRegex.exec(html)) !== null) {
    const priceStr = match[1].replace(/[,\s]/g, '');
    const price = parseFloat(priceStr);
    if (price > 10 && price < 50000) {
      prices.push(price);
    }
  }

  return prices;
}
