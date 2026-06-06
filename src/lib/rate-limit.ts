// Simple in-memory rate limiting
// For production, use Redis or a similar solution

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export interface RateLimitOptions {
  maxRequests: number;
  windowMs: number;
}

async function checkRateLimitUpstash(
  identifier: string,
  options: RateLimitOptions
): Promise<{ success: boolean; remaining: number; resetTime: number }> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    throw new Error('Upstash not configured');
  }

  const now = Date.now();
  const key = `rate:${identifier}:${Math.floor(now / options.windowMs)}`;
  const headers = { Authorization: `Bearer ${token}` };

  const incrRes = await fetch(`${url}/incr/${encodeURIComponent(key)}`, { method: 'POST', headers });
  const incrJson = await incrRes.json();
  const count = Number(incrJson.result || 0);

  if (count === 1) {
    const ttlSeconds = Math.max(1, Math.ceil(options.windowMs / 1000));
    await fetch(`${url}/expire/${encodeURIComponent(key)}/${ttlSeconds}`, { method: 'POST', headers });
  }

  let resetTime = now + options.windowMs;
  try {
    const pttlRes = await fetch(`${url}/pttl/${encodeURIComponent(key)}`, { headers });
    const pttlJson = await pttlRes.json();
    const pttl = Number(pttlJson.result);
    if (pttl > 0) resetTime = now + pttl;
  } catch { }

  const remaining = Math.max(0, options.maxRequests - count);
  return {
    success: count <= options.maxRequests,
    remaining,
    resetTime,
  };
}

export async function checkRateLimit(
  identifier: string,
  options: RateLimitOptions = { maxRequests: 100, windowMs: 60000 }
): Promise<{ success: boolean; remaining: number; resetTime: number }> {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    try {
      return await checkRateLimitUpstash(identifier, options);
    } catch { }
  }

  const now = Date.now();
  
  let record = rateLimitMap.get(identifier);
  
  // Clean up expired records
  if (record && record.resetTime < now) {
    rateLimitMap.delete(identifier);
    record = undefined;
  }
  
  if (!record) {
    record = { count: 0, resetTime: now + options.windowMs };
    rateLimitMap.set(identifier, record);
  }
  
  record.count++;
  const remaining = Math.max(0, options.maxRequests - record.count);
  
  return {
    success: record.count <= options.maxRequests,
    remaining,
    resetTime: record.resetTime,
  };
}

export function getIdentifier(request: Request): string {
  // Try to get IP from various headers
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const cfConnectingIp = request.headers.get('cf-connecting-ip');
  
  const ip = forwarded?.split(',')[0] || realIp || cfConnectingIp || 'unknown';
  return ip;
}
