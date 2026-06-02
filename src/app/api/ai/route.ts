import { NextRequest, NextResponse } from 'next/server';
import { createClientServer } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClientServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { type, data } = await request.json();
    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: 'Groq API key not configured' }, { status: 500 });
    }

    let prompt = '';
    let systemPrompt = '';

    if (type === 'description') {
      const { title, category, size, condition, brand, color } = data;
      systemPrompt = 'You are an expert e-commerce copywriter for South African clothing marketplaces. Write compelling, professional product descriptions that are concise, honest, and highlight key details. Keep descriptions under 200 words.';
      prompt = `Write a product description for:
- Item: ${title}
- Brand: ${brand || 'Not specified'}
- Category: ${category}
- Size: ${size}
- Condition: ${condition}
- Color: ${color || 'Not specified'}

Include details about the condition, any notable features, and why someone would want this item. Be honest about condition if it's not new.`;
    } else if (type === 'title') {
      const { category, brand, size, condition, color } = data;
      systemPrompt = 'You are an expert e-commerce copywriter. Write short, SEO-friendly titles for clothing listings on South African marketplaces. Keep titles under 60 characters.';
      prompt = `Write a catchy, search-friendly title for:
- ${brand || 'Unbranded'} ${category}
- Size: ${size}
- Condition: ${condition}
- Color: ${color || 'Not specified'}`;
    } else if (type === 'price') {
      const { category, condition, brand } = data;

      // Try to get from local market pricing database first
      try {
        const { data: localPrice } = await supabase
          .from('market_pricing')
          .select('avg_price, min_price, max_price')
          .eq('category', category)
          .eq('brand', brand || 'Generic')
          .eq('condition', condition || 'good')
          .maybeSingle();

        if (localPrice?.avg_price) {
          return NextResponse.json({ 
            result: localPrice.avg_price.toString(),
            source: 'local_database',
            range: { min: localPrice.min_price, max: localPrice.max_price }
          });
        }
      } catch (err) {
        console.warn('Local pricing lookup failed:', err);
      }

      systemPrompt = 'You are a pricing expert for South African secondhand clothing marketplaces. Suggest realistic price ranges in Rand (R). Consider condition, brand, and category. Respond with just the number.';
      prompt = `Suggest a fair price in South African Rand for:
- ${brand || 'Unbranded'} ${category}
- Condition: ${condition}

Consider current market rates on Yaga, Facebook Marketplace, and Gumtree. Respond with just the number, no currency symbol.`;
    } else if (type === 'optimize_listing') {
      const { item } = data;
      systemPrompt = 'You are an expert e-commerce optimizer for South African clothing marketplaces. Analyze the listing and provide an optimized version. Return ONLY a JSON object with keys: optimizedTitle, optimizedDescription, suggestedPrice, suggestedTags (array). Be concise.';
      prompt = `Optimize this clothing listing for South African marketplaces:
- Title: ${item.title || ''}
- Description: ${item.description || ''}
- Price: R${item.price || 0}
- Category: ${item.category || ''}
- Brand: ${item.brand || ''}
- Size: ${item.size || ''}
- Condition: ${item.condition || ''}
- Color: ${item.color || ''}

Return JSON only.`;
    } else if (type === 'optimize_title') {
      const { currentTitle, description, category } = data;
      systemPrompt = 'You are an SEO expert for South African clothing marketplaces. Write a short, search-friendly, click-worthy title. Keep under 60 characters. Return just the title string.';
      prompt = `Optimize this listing title:
- Current: ${currentTitle}
- Category: ${category}
- Description: ${description?.substring(0, 200) || ''}

Return only the improved title.`;
    } else if (type === 'optimize_description') {
      const { currentDescription, title, category, brand, condition } = data;
      systemPrompt = 'You are an expert e-commerce copywriter. Write a compelling, honest product description for South African clothing marketplaces. Keep under 200 words. Return just the description text.';
      prompt = `Optimize this product description:
- Title: ${title}
- Category: ${category}
- Brand: ${brand || 'Not specified'}
- Condition: ${condition || 'Not specified'}
- Current description: ${currentDescription?.substring(0, 300) || ''}

Return only the improved description.`;
    } else if (type === 'analyze_pricing') {
      const { category, brand, condition } = data;
      systemPrompt = 'You are a pricing analyst for South African secondhand clothing. Analyze market data and return a JSON object with: suggestedPrice (number), priceRangeMin (number), priceRangeMax (number), marketAverage (number), confidence (0-1), reasoning (string). Return JSON only.';
      prompt = `Analyze market pricing for:
- Category: ${category}
- Brand: ${brand || 'Generic'}
- Condition: ${condition || 'good'}

Consider Yaga, Facebook Marketplace, and Gumtree South Africa. Return JSON only.`;
    } else if (type === 'generate_tags') {
      const { title, description, category } = data;
      systemPrompt = 'You are an SEO expert. Generate relevant hashtags and keywords for a clothing listing. Return a JSON array of strings. Include South Africa relevant tags.';
      prompt = `Generate SEO tags/hashtags for:
- Title: ${title}
- Category: ${category}
- Description: ${description?.substring(0, 200) || ''}

Return JSON array only, e.g. ["tag1", "tag2"].`;
    } else if (type === 'platform_description') {
      const { description, title, platform } = data;
      systemPrompt = `You are an expert copywriter for South African online marketplaces. Rewrite the product description to match the tone and style of ${platform}. Keep all factual details (size, condition, brand, color) but adjust the tone. Keep under 200 words.`;
      prompt = `Rewrite this clothing listing description for ${platform}:

Original title: ${title}
Original description: ${description}

Platform tone guide:
- facebook_marketplace: casual, friendly, conversational, use emojis sparingly
- yaga: trendy, youthful, fashion-forward, Gen-Z friendly, use hashtags
- gumtree: straightforward, factual, no fluff, clear bullet points preferred
- olx: direct, price-focused, minimal, practical
- junkmail: honest, simple, community-focused

Return only the rewritten description text, no explanation.`;
    } else if (type === 'parse_photo') {
      const { imageBase64 } = data;
      systemPrompt = 'You are a clothing item identifier. Analyze the photo and return ONLY a JSON object with: title (string), category (one of: Tops,Bottoms,Dresses,Outerwear,Shoes,Accessories,Activewear,Swimwear,Formal Wear,Vintage), brand (string or empty), color (string), size (string or empty), condition (one of: new,like_new,good,fair,poor), material (string), description (string). Be accurate. Return JSON only.';
      const visionMessages = [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Analyze this clothing item photo and extract all details. Return JSON only.' },
            { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${imageBase64}` } },
          ],
        },
      ];

      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'llama-3.2-90b-vision-preview',
          messages: visionMessages,
          max_tokens: 500,
          temperature: 0.3,
        }),
      });

      const json = await response.json();
      const result = json.choices?.[0]?.message?.content;
      if (!result) {
        return NextResponse.json({ error: 'Failed to parse photo' }, { status: 500 });
      }

      let parsed;
      try {
        const cleaned = result.replace(/```json\n?|\n?```/g, '').trim();
        parsed = JSON.parse(cleaned);
      } catch {
        parsed = { raw: result };
      }

      return NextResponse.json({ result: parsed });
    }

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt },
        ],
        max_tokens: 300,
        temperature: 0.7,
      }),
    });

    const json = await response.json();
    const result = json.choices?.[0]?.message?.content;

    if (!result) {
      return NextResponse.json({ error: 'Failed to generate AI response' }, { status: 500 });
    }

    return NextResponse.json({ result: result.trim() });
  } catch (error) {
    console.error('AI API error:', error);
    return NextResponse.json({ error: 'Failed to process AI request' }, { status: 500 });
  }
}
