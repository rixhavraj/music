import type { MusicSource } from "@/lib/music-sources/types";
import type { Track, TrackDetails } from "@/types/music";
import YTMusic from "ytmusic-api";

let ytInstance: YTMusic | null = null;

async function getYTMusicClient(): Promise<YTMusic> {
  if (!ytInstance) {
    ytInstance = new YTMusic();
    await ytInstance.initialize();
  }
  return ytInstance;
}

type YTMusicSearchTrack = {
  type: string;
  videoId: string;
  name: string;
  artist: {
    name: string;
    artistId?: string;
  };
  album?: {
    name: string;
    albumId?: string;
  };
  duration: number;
  thumbnails: { url: string; width: number; height: number }[];
};

function normalize(track: YTMusicSearchTrack): Track {
  const coverObj = track.thumbnails?.[track.thumbnails.length - 1];
  const cover = coverObj?.url || "/covers/midnight-arcade.svg";

  return {
    id: track.videoId,
    title: track.name || "Untitled",
    artist: track.artist?.name || "Unknown Artist",
    album: track.album?.name || "Single",
    duration: track.duration || 0,
    year: new Date().getFullYear(),
    mood: "Streaming",
    color: "#246a73",
    cover: cover,
    source: "ytmusic"
  };
}

export const ytmusicMusicSource: MusicSource = {
  async search(query, limit = 12) {
    if (!query) return [];
    try {
      const yt = await getYTMusicClient();
      const results = (await yt.searchSongs(query)) as YTMusicSearchTrack[];
      return results.map(normalize).slice(0, limit);
    } catch (error) {
      console.error("YTMusic search error:", error);
      return [];
    }
  },

  async getTrack(id): Promise<TrackDetails | null> {
    try {
      const yt = await getYTMusicClient();
      const songData = (await yt.getSong(id)) as YTMusicSearchTrack;
      if (!songData) return null;

      const track = normalize(songData);

      let lyricsArray: string[] = [];
      try {
        const lyrics = (await yt.getLyrics(id)) as string[];
        if (lyrics && lyrics.length > 0) {
          lyricsArray = lyrics;
        }
      } catch (err) {
        console.error("No lyrics for YTMusic track", id, err);
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
      console.error("YTMusic getTrack error:", error);
      return null;
    }
  },

  // Stream URL extraction is handled by yt-dlp in app/api/stream/[id]/route.ts
  async getStreamUrl(_id: string) {
    return null;
  }
};
