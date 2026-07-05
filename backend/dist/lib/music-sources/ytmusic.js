"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ytmusicMusicSource = void 0;
const ytmusic_api_1 = __importDefault(require("ytmusic-api"));
let ytInstance = null;
async function getYTMusicClient() {
    if (!ytInstance) {
        ytInstance = new ytmusic_api_1.default();
        await ytInstance.initialize();
    }
    return ytInstance;
}
function normalize(track) {
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
exports.ytmusicMusicSource = {
    async search(query, limit = 12) {
        if (!query)
            return [];
        try {
            const yt = await getYTMusicClient();
            const results = (await yt.searchSongs(query));
            return results.map(normalize).slice(0, limit);
        }
        catch (error) {
            console.error("YTMusic search error:", error);
            return [];
        }
    },
    async getTrack(id) {
        try {
            const yt = await getYTMusicClient();
            const songData = (await yt.getSong(id));
            if (!songData)
                return null;
            const track = normalize(songData);
            let lyricsArray = [];
            try {
                const lyrics = (await yt.getLyrics(id));
                if (lyrics && lyrics.length > 0) {
                    lyricsArray = lyrics;
                }
            }
            catch (err) {
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
        }
        catch (error) {
            console.error("YTMusic getTrack error:", error);
            return null;
        }
    },
    // Stream URL extraction is handled by yt-dlp in app/api/stream/[id]/route.ts
    async getStreamUrl(_id) {
        return null;
    }
};
