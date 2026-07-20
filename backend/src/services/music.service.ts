import { getMusicSource } from "@/lib/music-sources";
import type { Track } from "@/types/music";
import { isOriginalTrack, filterOriginalTracks } from "@/lib/music-filter";

// In-memory track catalog cache for recommendations
let cachedTracks: Track[] = [];

export function getCachedTracks(): Track[] {
  return cachedTracks;
}

export function addToCatalogCache(tracks: Track[]) {
  if (cachedTracks.length < 100) {
    const seen = new Set(cachedTracks.map((t) => t.id));
    for (const t of tracks) {
      if (!seen.has(t.id)) {
        seen.add(t.id);
        cachedTracks.push(t);
      }
    }
  }
}

export async function seedCatalogIfEmpty() {
  if (cachedTracks.length < 10) {
    try {
      const source = getMusicSource();
      // Increase search limit to ensure we get enough original songs after filtering
      const [t1, t2, t3] = await Promise.all([
        source.search("Trending Hindi Songs", 40),
        source.search("Bollywood Pop", 40),
        source.search("Chill Lo-fi", 20),
      ]);
      const all = filterOriginalTracks([...t1, ...t2, ...t3]);
      const seen = new Set<string>();
      cachedTracks = all.filter((t) => {
        if (seen.has(t.id)) return false;
        seen.add(t.id);
        return true;
      });
    } catch (error) {
      console.error("Error seeding catalog cache:", error);
      cachedTracks = [];
    }
  }
}

export async function searchTracks(query: string, limit: number): Promise<Track[]> {
  // Fetch more tracks than requested to compensate for any filtered AI / remix tracks
  const searchLimit = Math.max(limit * 3, 30);
  const tracks = await getMusicSource().search(query, searchLimit);
  const filtered = filterOriginalTracks(tracks).slice(0, limit);
  addToCatalogCache(filtered);
  return filtered;
}

export async function getTrackById(id: string): Promise<Track | null> {
  const track = await getMusicSource().getTrack(id);
  if (!track || !isOriginalTrack(track)) {
    return null;
  }
  return track;
}

export async function getPlaylistById(id: string): Promise<{ id: string, title: string, cover: string, tracks: Track[] } | null> {
  const source = getMusicSource();
  if (source.getPlaylist) {
    const playlist = await source.getPlaylist(id);
    if (!playlist) return null;
    playlist.tracks = filterOriginalTracks(playlist.tracks);
    addToCatalogCache(playlist.tracks);
    return playlist;
  }
  return null;
}

