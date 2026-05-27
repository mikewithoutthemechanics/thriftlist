// Simple in-memory rate limiting
// For production, use Redis or a similar solution

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export interface RateLimitOptions {
  maxRequests: number;
  windowMs: number;
}

export function checkRateLimit(
  identifier: string,
  options: RateLimitOptions = { maxRequests: 100, windowMs: 60000 }
): { success: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const windowStart = now - options.windowMs;
  
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
