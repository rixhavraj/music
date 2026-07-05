/**
 * In-memory user store for the dev backend.
 * In production this would be a PostgreSQL database via Prisma.
 */

export interface UserRecord {
  id: string;
  email: string;
  passwordHash: string;
  name?: string;
  createdAt: Date;
}

export interface PlayEvent {
  trackId: string;
  userId: string | null;
  playedAt: Date;
}

export interface SkipEvent {
  trackId: string;
  userId: string | null;
  skippedAt: Date;
  skipPositionSeconds?: number;
}

export interface LikeEvent {
  trackId: string;
  userId: string | null;
}

// ─── In-memory stores ─────────────────────────────────────────────────────────

const users = new Map<string, UserRecord>();
const playHistory: PlayEvent[] = [];
const skipHistory: SkipEvent[] = [];
const likedTracks = new Set<string>(); // "userId:trackId"

// ─── Helpers ──────────────────────────────────────────────────────────────────

let _uidCounter = 1;
export function createUserId(): string {
  return `u_${Date.now()}_${_uidCounter++}`;
}

export function saveUser(user: UserRecord): void {
  users.set(user.id, user);
}

export function findUserByEmail(email: string): UserRecord | undefined {
  for (const user of users.values()) {
    if (user.email === email) return user;
  }
  return undefined;
}

export function findUserById(id: string): UserRecord | undefined {
  return users.get(id);
}

// ─── Play tracking ────────────────────────────────────────────────────────────

export function recordPlay(trackId: string, userId: string | null): void {
  playHistory.push({ trackId, userId, playedAt: new Date() });
}

export function recordSkip(trackId: string, userId: string | null, skipPositionSeconds?: number): void {
  skipHistory.push({ trackId, userId, skippedAt: new Date(), skipPositionSeconds });
}

export function recordLike(trackId: string, userId: string | null): "liked" | "unliked" {
  const key = `${userId ?? "anon"}:${trackId}`;
  if (likedTracks.has(key)) {
    likedTracks.delete(key);
    return "unliked";
  } else {
    likedTracks.add(key);
    return "liked";
  }
}

// ─── Recommendation data ──────────────────────────────────────────────────────

export function getRecentlyPlayed(userId: string | null, limit = 20): string[] {
  const filtered = playHistory
    .filter((p) => (userId ? p.userId === userId : true))
    .sort((a, b) => b.playedAt.getTime() - a.playedAt.getTime())
    .map((p) => p.trackId);
  // Deduplicate preserving order
  const seen = new Set<string>();
  const result: string[] = [];
  for (const id of filtered) {
    if (!seen.has(id)) { seen.add(id); result.push(id); }
    if (result.length >= limit) break;
  }
  return result;
}

export function getFrequentlySkipped(userId: string | null): Set<string> {
  const skipCount = new Map<string, number>();
  for (const s of skipHistory) {
    if (userId && s.userId !== userId) continue;
    skipCount.set(s.trackId, (skipCount.get(s.trackId) ?? 0) + 1);
  }
  const skipped = new Set<string>();
  for (const [id, count] of skipCount) {
    if (count >= 2) skipped.add(id);
  }
  return skipped;
}

export function getLikedTrackIds(userId: string | null): string[] {
  const prefix = `${userId ?? "anon"}:`;
  return [...likedTracks]
    .filter((k) => k.startsWith(prefix))
    .map((k) => k.slice(prefix.length));
}

export function getPlayCount(trackId: string): number {
  return playHistory.filter((p) => p.trackId === trackId).length;
}
