export type AudioQuality = "low" | "balanced" | "high" | "auto";

export type Track = {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number;
  year: number;
  mood: string;
  color: string;
  cover: string;
  streamUrl?: string;
  source: "mock" | "gaanapy" | "saavn" | "workers" | "ytmusic";
};

export type Playlist = {
  id: string;
  name: string;
  description: string;
  trackIds: string[];
};

export type SearchResponse = {
  query: string;
  tracks: Track[];
};

export type TrackDetails = Track & {
  lyrics: string[];
  tags: string[];
  similarArtists: string[];
  bio: string;
};
