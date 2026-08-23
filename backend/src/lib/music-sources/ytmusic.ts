import type { MusicSource } from "@/lib/music-sources/types";
import type { Track, TrackDetails } from "@/types/music";
import YTMusic from "ytmusic-api";

let ytInstance: YTMusic | null = null;
let ytInitPromise: Promise<YTMusic> | null = null;

async function getYTMusicClient(): Promise<YTMusic> {
  if (!ytInitPromise) {
    ytInitPromise = (async () => {
      const instance = new YTMusic();
      await instance.initialize();
      ytInstance = instance;
      return instance;
    })();
  }
  return ytInitPromise;
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
  } | null;
  duration: number | null;
  thumbnails?: { url: string; width: number; height: number }[];
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

const playlistFallbacks: Record<string, { title: string; query: string; cover: string }> = {
  "PL4fGSI1pG0MDX4h9Z5Cj4OtzjH8dI76-6": {
    title: "Lofi Hip Hop",
    query: "lofi hip hop chill beats",
    cover: "https://images.unsplash.com/photo-1493225457124-a1a2a5f5f9af?w=500&q=80"
  },
  "PLw-VjHDlEOgs658kAHR_LAaILBXb-sILT": {
    title: "Top 50 This Week",
    query: "top 50 this week global hits",
    cover: "https://images.unsplash.com/photo-1511406361295-0a1ff814c0ce?w=500&q=80"
  },
  "PL9bw4S5ePsEGkUSNf6nB1e2YntOa27tq2": {
    title: "Bollywood Workout",
    query: "bollywood workout energetic songs",
    cover: "https://images.unsplash.com/photo-1614113489855-66422ad300a4?w=500&q=80"
  },
  "PLFgquLnL59alW3xmYiWRaoz0oM3H17Lth": {
    title: "Top Tracks - India",
    query: "top tracks india hindi songs",
    cover: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&q=80"
  }
};

async function fallbackPlaylist(id: string) {
  const fallback = playlistFallbacks[id];
  if (!fallback) return null;

  const tracks = await ytmusicMusicSource.search(fallback.query, 20);
  return {
    id,
    title: fallback.title,
    cover: tracks[0]?.cover || fallback.cover,
    tracks
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
  },

  async getPlaylist(id: string) {
    try {
      const yt = await getYTMusicClient();
      const playlist = (await yt.getPlaylist(id)) as any;
      const videos = (await yt.getPlaylistVideos(id)) as any[];

      if (!playlist || !videos?.length) return fallbackPlaylist(id);

      const cover = playlist.thumbnails?.[playlist.thumbnails.length - 1]?.url || "";
      const tracks = videos.filter((v: any) => v?.videoId).map((v: any) => normalize({
        ...v,
        type: "SONG"
      }));

      if (!tracks.length) return fallbackPlaylist(id);

      return {
        id: playlist.playlistId || id,
        title: playlist.name || "Playlist",
        cover: cover || tracks[0]?.cover || "",
        tracks
      };
    } catch (error) {
      console.error("YTMusic getPlaylist error:", error);
      return fallbackPlaylist(id);
    }
  }
};
