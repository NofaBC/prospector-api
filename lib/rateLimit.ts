import { env } from './env';

interface TokenBucket {
  tokens: number;
  lastRefill: number;
}

const buckets = new Map<string, TokenBucket>();

/**
 * Token bucket rate limiter
 * @param key - Unique key (e.g., IP + seedUrl)
 * @returns true if allowed, false if rate limited
 */
export function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const windowMs = env.rateLimitWindow * 1000; // Convert to milliseconds
  const maxTokens = env.rateLimitMax;
  const refillRate = maxTokens / (windowMs / 1000); // Tokens per second

  let bucket = buckets.get(key);

  if (!bucket) {
    // First request from this key
    bucket = {
      tokens: maxTokens - 1,
      lastRefill: now
    };
    buckets.set(key, bucket);
    return true;
  }

  // Refill tokens based on time elapsed
  const timeSinceRefill = now - bucket.lastRefill;
  const tokensToAdd = (timeSinceRefill / 1000) * refillRate;
  bucket.tokens = Math.min(maxTokens, bucket.tokens + tokensToAdd);
  bucket.lastRefill = now;

  if (bucket.tokens >= 1) {
    bucket.tokens -= 1;
    return true;
  }

  return false;
}

/**
 * Get retry-after time in seconds
 */
export function getRetryAfter(key: string): number {
  const bucket = buckets.get(key);
  if (!bucket) return 0;

  const windowMs = env.rateLimitWindow * 1000;
  const maxTokens = env.rateLimitMax;
  const refillRate = maxTokens / (windowMs / 1000);
  
  const timeToNextToken = (1 - bucket.tokens) / refillRate;
  return Math.ceil(timeToNextToken);
}

/**
 * Create rate limit key from request
 */
export function createRateLimitKey(ip: string, seedUrl: string): string {
  return `${ip}:${seedUrl}`;
}

/**
 * Clean up old buckets (call periodically)
 */
export function cleanupOldBuckets(): void {
  const now = Date.now();
  const maxAge = env.rateLimitWindow * 2 * 1000; // Keep for 2x window duration

  for (const [key, bucket] of buckets.entries()) {
    if (now - bucket.lastRefill > maxAge) {
      buckets.delete(key);
    }
  }
}
