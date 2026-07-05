"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.saavnMusicSource = void 0;
const baseUrl = process.env.SAAVN_API_URL || "https://jiosaavn-api-beta.vercel.app";
async function saavnFetch(path) {
    const response = await fetch(`${baseUrl.replace(/\/$/, "")}${path}`);
    if (!response.ok) {
        throw new Error(`Saavn API request failed with ${response.status}`);
    }
    return response.json();
}
function normalize(track) {
    const coverObj = track.image?.find((img) => img.quality === "500x500") || track.image?.[track.image.length - 1];
    const cover = coverObj?.link || "/covers/midnight-arcade.svg";
    return {
        id: track.id,
        title: track.name || "Untitled",
        artist: track.primaryArtists || "Unknown Artist",
        album: track.album?.name || "Single",
        duration: parseInt(track.duration, 10) || 0,
        year: parseInt(track.year, 10) || new Date().getFullYear(),
        mood: "Streaming",
        color: "#246a73",
        cover: cover,
        source: "saavn"
    };
}
exports.saavnMusicSource = {
    async search(query, limit = 12) {
        if (!query)
            return [];
        try {
            const data = await saavnFetch(`/search/songs?query=${encodeURIComponent(query)}&limit=${limit}`);
            return (data.data?.results || []).map(normalize);
        }
        catch (error) {
            console.error("Saavn search error:", error);
            return [];
        }
    },
    async getTrack(id) {
        try {
            const data = await saavnFetch(`/songs?id=${id}`);
            const trackData = data.data?.[0];
            if (!trackData)
                return null;
            const track = normalize(trackData);
            let lyricsArray = [];
            try {
                const lyricsData = await saavnFetch(`/lyrics?id=${id}`);
                if (lyricsData.data?.lyrics) {
                    lyricsArray = lyricsData.data.lyrics.split("\n").map((line) => line.trim()).filter(Boolean);
                }
            }
            catch (err) {
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
        }
        catch (error) {
            console.error("Saavn getTrack error:", error);
            return null;
        }
    },
    async getStreamUrl(id) {
        try {
            const data = await saavnFetch(`/songs?id=${id}`);
            const trackData = data.data?.[0];
            if (!trackData)
                return null;
            const streamObj = trackData.downloadUrl?.find((d) => d.quality === "320kbps") ||
                trackData.downloadUrl?.find((d) => d.quality === "160kbps") ||
                trackData.downloadUrl?.[trackData.downloadUrl.length - 1];
            return streamObj?.link || null;
        }
        catch (error) {
            console.error("Saavn getStreamUrl error:", error);
            return null;
        }
    }
};
