import { gaanapyMusicSource } from "@/lib/music-sources/gaanapy";
import { mockMusicSource } from "@/lib/music-sources/mock";
import { saavnMusicSource } from "@/lib/music-sources/saavn";
import { workersMusicSource } from "@/lib/music-sources/workers";
import { ytmusicMusicSource } from "@/lib/music-sources/ytmusic";
import type { MusicSource } from "@/lib/music-sources/types";

export function getMusicSource(): MusicSource {
  const source = (process.env.MUSIC_SOURCE || "").toLowerCase();

  if (source === "ytmusic") {
    return ytmusicMusicSource;
  }
  if (source === "saavn") {
    return saavnMusicSource;
  }
  if (source === "workers") {
    return workersMusicSource;
  }
  if (source === "gaanapy") {
    return gaanapyMusicSource;
  }

  if (process.env.NODE_ENV === "production" && (!source || source === "mock")) {
    console.warn("WARNING: Production MUSIC_SOURCE is missing or set to mock! Falling back to ytmusic for real audio playback.");
    return ytmusicMusicSource;
  }

  return mockMusicSource;
}
