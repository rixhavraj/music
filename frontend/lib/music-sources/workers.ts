import type { MusicSource } from "@/lib/music-sources/types";
import type { Track, TrackDetails } from "@/types/music";

type WorkersSearchTrack = {
  id: string;
  title: string;
  img: string;
};

const baseUrl = process.env.WORKERS_API_URL || "https://musicapi.x007.workers.dev";
const searchEngine = process.env.WORKERS_SEARCH_ENGINE || "seevn";

// In-memory cache to store metadata of search results for subsequent getTrack requests
const trackCache = new Map<string, Track>();

async function workersFetch<T>(path: string): Promise<T> {
  const response = await fetch(`${baseUrl.replace(/\/$/, "")}${path}`, {
    next: { revalidate: 300 }
  });

  if (!response.ok) {
    throw new Error(`Workers API request failed with ${response.status}`);
  }

  return response.json() as Promise<T>;
}

function normalize(track: WorkersSearchTrack): Track {
  let title = track.title || "Untitled";
  let artist = "Unknown Artist";
  const album = "Single";

  // Attempt to parse "Song Title - Artist" format
  if (title.includes(" - ")) {
    const parts = title.split(" - ");
    title = parts[0].trim();
    artist = parts[1].trim();
  }

  return {
    id: track.id,
    title,
    artist,
    album,
    duration: 0,
    year: new Date().getFullYear(),
    mood: "Streaming",
    color: "#246a73",
    cover: track.img || "/covers/midnight-arcade.svg",
    source: "workers"
  };
}

export const workersMusicSource: MusicSource = {
  async search(query, limit = 12) {
    if (!query) return [];
    try {
      const data = await workersFetch<{ status: number; response?: WorkersSearchTrack[] }>(
        `/search?q=${encodeURIComponent(query)}&searchEngine=${searchEngine}`
      );
      
      const tracks = (data.response || []).map(normalize).slice(0, limit);
      for (const track of tracks) {
        trackCache.set(track.id, track);
      }
      return tracks;
    } catch (error) {
      console.error("Workers search error:", error);
      return [];
    }
  },

  async getTrack(id): Promise<TrackDetails | null> {
    try {
      const cached = trackCache.get(id);
      const track: Track = cached || {
        id,
        title: "Streaming Track",
        artist: "Unknown Artist",
        album: "Single",
        duration: 0,
        year: new Date().getFullYear(),
        mood: "Streaming",
        color: "#246a73",
        cover: "/covers/midnight-arcade.svg",
        source: "workers"
      };

      let lyricsArray: string[] = [];
      try {
        const lyricsData = await workersFetch<{ status: number; response?: string }>(
          `/lyrics?id=${encodeURIComponent(id)}`
        );
        if (lyricsData.response) {
          // Clean up HTML tags from lyrics response
          lyricsArray = lyricsData.response
            .replace(/<p>/g, "")
            .split("</p>")
            .map((line) => line.trim())
            .filter(Boolean);
        }
      } catch (err) {
        console.error("No lyrics for track", id, err);
      }

      return {
        ...track,
        streamUrl: `/api/stream/${track.id}`,
        lyrics: lyricsArray,
        tags: [track.album],
        similarArtists: [],
        bio: ""
      };
    } catch (error) {
      console.error("Workers getTrack error:", error);
      return null;
    }
  },

  async getStreamUrl(id) {
    try {
      const data = await workersFetch<{ status: number; response?: string }>(
        `/fetch?id=${encodeURIComponent(id)}`
      );
      return data.response || null;
    } catch (error) {
      console.error("Workers getStreamUrl error:", error);
      return null;
    }
  }
};
