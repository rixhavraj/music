/**
 * Offline Audio Cache using IndexedDB via Cache API + Service Worker.
 * Stores audio blobs in the browser Cache Storage under "chillguys-audio-v1".
 * Works in both dev and production PWA contexts.
 */

const CACHE_NAME = "chillguys-audio-v1";
const MAX_CACHED_TRACKS = 20;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CachedTrackMeta {
  id: string;
  title: string;
  artist: string;
  cover?: string;
  cachedAt: number; // epoch ms
  sizeBytes: number;
}

// ─── Cache API helpers ────────────────────────────────────────────────────────

function getStreamUrl(trackId: string): string {
  return `/api/stream/${trackId}`;
}

/**
 * Check if a track is already cached.
 */
export async function isTrackCached(trackId: string): Promise<boolean> {
  if (typeof caches === "undefined") return false;
  try {
    const cache = await caches.open(CACHE_NAME);
    const match = await cache.match(getStreamUrl(trackId));
    return match !== undefined;
  } catch {
    return false;
  }
}

/**
 * Download a track audio and store it in the Cache API.
 * Returns the size in bytes, or 0 on failure.
 */
export async function cacheTrack(
  trackId: string,
  meta: Omit<CachedTrackMeta, "cachedAt" | "sizeBytes">,
  onProgress?: (percent: number) => void
): Promise<number> {
  if (typeof caches === "undefined") return 0;

  try {
    const url = getStreamUrl(trackId);
    const response = await fetch(url);
    if (!response.ok || !response.body) return 0;

    // Stream the response to measure size while caching
    const reader = response.body.getReader();
    const contentLength = Number(response.headers.get("content-length") || "0");
    const chunks: Uint8Array[] = [];
    let received = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      received += value.length;
      if (contentLength && onProgress) {
        onProgress(Math.round((received / contentLength) * 100));
      }
    }

    const blob = new Blob(chunks as BlobPart[], { type: "audio/webm" });
    const cachedResponse = new Response(blob, {
      headers: { "Content-Type": "audio/webm", "Content-Length": String(blob.size) },
    });

    const cache = await caches.open(CACHE_NAME);
    await cache.put(url, cachedResponse);

    // Store metadata in localStorage
    saveCacheMeta({ ...meta, id: trackId, cachedAt: Date.now(), sizeBytes: blob.size });

    // Enforce max cached tracks
    await evictOldTracks();

    onProgress?.(100);
    return blob.size;
  } catch (err) {
    console.error("Failed to cache track:", err);
    return 0;
  }
}

/**
 * Remove a cached track.
 */
export async function evictTrack(trackId: string): Promise<void> {
  if (typeof caches === "undefined") return;
  try {
    const cache = await caches.open(CACHE_NAME);
    await cache.delete(getStreamUrl(trackId));
    removeCacheMeta(trackId);
  } catch {
    // ignore
  }
}

/**
 * Clear ALL cached audio.
 */
export async function clearAudioCache(): Promise<void> {
  if (typeof caches === "undefined") return;
  try {
    await caches.delete(CACHE_NAME);
    localStorage.removeItem("chillguys-cache-meta");
  } catch {
    // ignore
  }
}

/**
 * Get total cache size in bytes.
 */
export function getTotalCacheSizeBytes(): number {
  return getCacheMeta().reduce((acc, m) => acc + m.sizeBytes, 0);
}

// ─── Metadata persistence ─────────────────────────────────────────────────────

function getCacheMeta(): CachedTrackMeta[] {
  try {
    return JSON.parse(localStorage.getItem("chillguys-cache-meta") || "[]");
  } catch {
    return [];
  }
}

function saveCacheMeta(meta: CachedTrackMeta): void {
  const existing = getCacheMeta().filter((m) => m.id !== meta.id);
  localStorage.setItem("chillguys-cache-meta", JSON.stringify([meta, ...existing]));
}

function removeCacheMeta(trackId: string): void {
  const existing = getCacheMeta().filter((m) => m.id !== trackId);
  localStorage.setItem("chillguys-cache-meta", JSON.stringify(existing));
}

async function evictOldTracks(): Promise<void> {
  const metas = getCacheMeta();
  if (metas.length <= MAX_CACHED_TRACKS) return;
  // Evict oldest tracks beyond the limit
  const toEvict = metas.slice(MAX_CACHED_TRACKS);
  for (const m of toEvict) {
    await evictTrack(m.id);
  }
}

export { getCacheMeta };
