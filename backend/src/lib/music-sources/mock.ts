import { demoTracks, enrichTrack, findTrack } from "@/lib/catalog";
import type { MusicSource } from "@/lib/music-sources/types";

export const mockMusicSource: MusicSource = {
  async search(query, limit = 12) {
    const normalized = query.toLowerCase();

    if (!normalized) {
      return demoTracks.slice(0, limit);
    }

    return demoTracks
      .filter((track) =>
        [track.title, track.artist, track.album, track.mood].some((value) =>
          value.toLowerCase().includes(normalized)
        )
      )
      .slice(0, limit);
  },

  async getTrack(id) {
    const track = findTrack(id);
    return track ? enrichTrack(track) : null;
  },

  async getStreamUrl(id) {
    return findTrack(id) ? `/api/stream/${id}` : null;
  }
};
