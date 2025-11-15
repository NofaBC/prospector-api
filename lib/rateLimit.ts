import { getEnvVarAsNumberWithDefault } from './env';

interface TokenBucket {
tokens: number;
lastRefill: number;
}

const buckets = new Map<string, TokenBucket>();

const WINDOW = getEnvVarAsNumberWithDefault('RATE_LIMIT_WINDOW', 600); // 10 minutes default
const MAX_TOKENS = getEnvVarAsNumberWithDefault('RATE_LIMIT_MAX', 60); // 60 requests per window
const REFILL_INTERVAL = 10000; // 10 seconds

export const checkRateLimit = (key: string): boolean => {
const now = Date.now();
let bucket = buckets.get(key);

if (!bucket) {
// Create new bucket
bucket = {
tokens: MAX_TOKENS - 1,
lastRefill: now
};
buckets.set(key, bucket);
return true;
}

// Calculate how many tokens to refill
const timePassed = now - bucket.lastRefill;
const refillTokens = Math.floor(timePassed / REFILL_INTERVAL);

if (refillTokens > 0) {
bucket.tokens = Math.min(MAX_TOKENS, bucket.tokens + refillTokens);
bucket.lastRefill = now;
}

// Check if we have tokens
if (bucket.tokens > 0) {
bucket.tokens--;
return true;
}

return false;
};

export const getRetryAfter = (key: string): number => {
const bucket = buckets.get(key);
if (!bucket) return 10; // Default to 10 seconds if no bucket exists

// Calculate next refill time
const nextRefillTime = bucket.lastRefill + REFILL_INTERVAL;
const retryAfter = Math.ceil((nextRefillTime - Date.now()) / 1000);
return Math.max(1, retryAfter);
};

// Cleanup old buckets periodically
setInterval(() => {
const now = Date.now();
for (const [key, bucket] of buckets.entries()) {
if (now - bucket.lastRefill > WINDOW * 1000) {
buckets.delete(key);
}
}
}, 60000); // Clean up every minute
