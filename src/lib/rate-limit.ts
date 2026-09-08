/**
 * In-memory fixed-window rate limiter. Good enough for a single-instance
 * internal tool; would need a shared store (e.g. Redis) behind a load
 * balancer with multiple Node instances.
 *
 * Only failed attempts should be recorded (see `recordFailedAttempt`) —
 * counting successful logins too would eventually lock out a legitimately
 * shared/frequently-used account (e.g. the one admin login for the whole
 * company) even when every attempt used the correct password.
 */

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

export function isRateLimited(
  key: string,
  { limit }: { limit: number },
): { limited: boolean; retryAfterSeconds: number } {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    return { limited: false, retryAfterSeconds: 0 };
  }

  if (bucket.count >= limit) {
    return { limited: true, retryAfterSeconds: Math.ceil((bucket.resetAt - now) / 1000) };
  }

  return { limited: false, retryAfterSeconds: 0 };
}

export function recordFailedAttempt(key: string, windowMs: number): void {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }

  bucket.count += 1;
}

export function clearRateLimit(key: string): void {
  buckets.delete(key);
}
