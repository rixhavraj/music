import type { MusicSource } from "@/lib/music-sources/types";
import type { Track, TrackDetails } from "@/types/music";

type GaanaPyTrack = {
  id: string;
  title?: string;
  name?: string;
  artist?: string;
  album?: string;
  duration?: number;
  artwork?: string;
  image?: string;
};

const baseUrl = process.env.GAANAPY_URL;

async function gaanaFetch<T>(path: string): Promise<T> {
  if (!baseUrl) {
    throw new Error("GAANAPY_URL is not configured");
  }

  const response = await fetch(`${baseUrl.replace(/\/$/, "")}${path}`, {
    headers: process.env.GAANAPY_TOKEN ? { Authorization: `Bearer ${process.env.GAANAPY_TOKEN}` } : {},
    next: { revalidate: 300 }
  });

  if (!response.ok) {
    throw new Error(`GaanaPy request failed with ${response.status}`);
  }

  return response.json() as Promise<T>;
}

function normalize(track: GaanaPyTrack): Track {
  return {
    id: track.id,
    title: track.title || track.name || "Untitled",
    artist: track.artist || "Unknown Artist",
    album: track.album || "Single",
    duration: track.duration || 0,
    year: new Date().getFullYear(),
    mood: "Streaming",
    color: "#246a73",
    cover: track.artwork || track.image || "/covers/midnight-arcade.svg",
    source: "gaanapy"
  };
}

export const gaanapyMusicSource: MusicSource = {
  async search(query, limit = 12) {
    const data = await gaanaFetch<{ results?: GaanaPyTrack[]; tracks?: GaanaPyTrack[] }>(
      `/search?q=${encodeURIComponent(query)}&limit=${limit}`
    );
    return (data.results || data.tracks || []).map(normalize);
  },

  async getTrack(id): Promise<TrackDetails | null> {
    const track = normalize(await gaanaFetch<GaanaPyTrack>(`/track/${encodeURIComponent(id)}`));
    return {
      ...track,
      streamUrl: `/api/stream/${track.id}`,
      lyrics: [],
      tags: [track.album],
      similarArtists: [],
      bio: ""
    };
  },

  async getStreamUrl(id) {
    const data = await gaanaFetch<{ streamUrl?: string; url?: string }>(`/stream/${encodeURIComponent(id)}`);
    return data.streamUrl || data.url || null;
  }
};
