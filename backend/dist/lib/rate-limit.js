"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkRateLimit = checkRateLimit;
exports.requestKey = requestKey;
const buckets = new Map();
function checkRateLimit(key, limit = 60, windowMs = 60_000) {
    const now = Date.now();
    const bucket = buckets.get(key);
    if (!bucket || bucket.resetAt <= now) {
        buckets.set(key, { count: 1, resetAt: now + windowMs });
        return { ok: true, remaining: limit - 1, resetAt: now + windowMs };
    }
    if (bucket.count >= limit) {
        return { ok: false, remaining: 0, resetAt: bucket.resetAt };
    }
    bucket.count += 1;
    return { ok: true, remaining: limit - bucket.count, resetAt: bucket.resetAt };
}
function requestKey(request) {
    return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
}
