import type { Request, Response, NextFunction } from "express";

type Key = string;
const buckets = new Map<Key, { tokens: number; last: number }>();

export function rateLimit(maxPerMinute: number) {
  const refillPerMs = maxPerMinute / 60000;
  return (req: Request, res: Response, next: NextFunction) => {
    const key = `${req.ip}:${req.path}`;
    const now = Date.now();
    const bucket = buckets.get(key) || { tokens: maxPerMinute, last: now };
    const elapsed = now - bucket.last;
    bucket.tokens = Math.min(maxPerMinute, bucket.tokens + elapsed * refillPerMs);
    bucket.last = now;
    if (bucket.tokens < 1) {
      buckets.set(key, bucket);
      return res.status(429).json({ error: "Too many requests" });
    }
    bucket.tokens -= 1;
    buckets.set(key, bucket);
    next();
  };
}

