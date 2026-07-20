import type { Track, TrackDetails } from "@/types/music";

export type MusicSource = {
  search(query: string, limit?: number): Promise<Track[]>;
  getTrack(id: string): Promise<TrackDetails | null>;
  getStreamUrl(id: string): Promise<string | null>;
  getPlaylist?(id: string): Promise<{ id: string, title: string, cover: string, tracks: Track[] } | null>;
};
