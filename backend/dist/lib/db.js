"use strict";
/**
 * In-memory user store for the dev backend.
 * In production this would be a PostgreSQL database via Prisma.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createUserId = createUserId;
exports.saveUser = saveUser;
exports.findUserByEmail = findUserByEmail;
exports.findUserById = findUserById;
exports.recordPlay = recordPlay;
exports.recordSkip = recordSkip;
exports.recordLike = recordLike;
exports.getRecentlyPlayed = getRecentlyPlayed;
exports.getFrequentlySkipped = getFrequentlySkipped;
exports.getLikedTrackIds = getLikedTrackIds;
exports.getPlayCount = getPlayCount;
// ─── In-memory stores ─────────────────────────────────────────────────────────
const users = new Map();
const playHistory = [];
const skipHistory = [];
const likedTracks = new Set(); // "userId:trackId"
// ─── Helpers ──────────────────────────────────────────────────────────────────
let _uidCounter = 1;
function createUserId() {
    return `u_${Date.now()}_${_uidCounter++}`;
}
function saveUser(user) {
    users.set(user.id, user);
}
function findUserByEmail(email) {
    for (const user of users.values()) {
        if (user.email === email)
            return user;
    }
    return undefined;
}
function findUserById(id) {
    return users.get(id);
}
// ─── Play tracking ────────────────────────────────────────────────────────────
function recordPlay(trackId, userId) {
    playHistory.push({ trackId, userId, playedAt: new Date() });
}
function recordSkip(trackId, userId, skipPositionSeconds) {
    skipHistory.push({ trackId, userId, skippedAt: new Date(), skipPositionSeconds });
}
function recordLike(trackId, userId) {
    const key = `${userId ?? "anon"}:${trackId}`;
    if (likedTracks.has(key)) {
        likedTracks.delete(key);
        return "unliked";
    }
    else {
        likedTracks.add(key);
        return "liked";
    }
}
// ─── Recommendation data ──────────────────────────────────────────────────────
function getRecentlyPlayed(userId, limit = 20) {
    const filtered = playHistory
        .filter((p) => (userId ? p.userId === userId : true))
        .sort((a, b) => b.playedAt.getTime() - a.playedAt.getTime())
        .map((p) => p.trackId);
    // Deduplicate preserving order
    const seen = new Set();
    const result = [];
    for (const id of filtered) {
        if (!seen.has(id)) {
            seen.add(id);
            result.push(id);
        }
        if (result.length >= limit)
            break;
    }
    return result;
}
function getFrequentlySkipped(userId) {
    const skipCount = new Map();
    for (const s of skipHistory) {
        if (userId && s.userId !== userId)
            continue;
        skipCount.set(s.trackId, (skipCount.get(s.trackId) ?? 0) + 1);
    }
    const skipped = new Set();
    for (const [id, count] of skipCount) {
        if (count >= 2)
            skipped.add(id);
    }
    return skipped;
}
function getLikedTrackIds(userId) {
    const prefix = `${userId ?? "anon"}:`;
    return [...likedTracks]
        .filter((k) => k.startsWith(prefix))
        .map((k) => k.slice(prefix.length));
}
function getPlayCount(trackId) {
    return playHistory.filter((p) => p.trackId === trackId).length;
}
