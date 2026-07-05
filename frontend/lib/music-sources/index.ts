import { gaanapyMusicSource } from "@/lib/music-sources/gaanapy";
import { mockMusicSource } from "@/lib/music-sources/mock";
import { saavnMusicSource } from "@/lib/music-sources/saavn";
import { workersMusicSource } from "@/lib/music-sources/workers";
import { ytmusicMusicSource } from "@/lib/music-sources/ytmusic";
import type { MusicSource } from "@/lib/music-sources/types";

export function getMusicSource(): MusicSource {
  if (process.env.MUSIC_SOURCE === "ytmusic") {
    return ytmusicMusicSource;
  }
  if (process.env.MUSIC_SOURCE === "workers") {
    return workersMusicSource;
  }
  if (process.env.MUSIC_SOURCE === "saavn") {
    return saavnMusicSource;
  }
  return process.env.MUSIC_SOURCE === "gaanapy" ? gaanapyMusicSource : mockMusicSource;
}
