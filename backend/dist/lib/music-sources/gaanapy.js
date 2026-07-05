"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.gaanapyMusicSource = void 0;
const baseUrl = process.env.GAANAPY_URL;
async function gaanaFetch(path) {
    if (!baseUrl) {
        throw new Error("GAANAPY_URL is not configured");
    }
    const response = await fetch(`${baseUrl.replace(/\/$/, "")}${path}`, {
        headers: process.env.GAANAPY_TOKEN ? { Authorization: `Bearer ${process.env.GAANAPY_TOKEN}` } : {}
    });
    if (!response.ok) {
        throw new Error(`GaanaPy request failed with ${response.status}`);
    }
    return response.json();
}
function normalize(track) {
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
exports.gaanapyMusicSource = {
    async search(query, limit = 12) {
        const data = await gaanaFetch(`/search?q=${encodeURIComponent(query)}&limit=${limit}`);
        return (data.results || data.tracks || []).map(normalize);
    },
    async getTrack(id) {
        const track = normalize(await gaanaFetch(`/track/${encodeURIComponent(id)}`));
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
        const data = await gaanaFetch(`/stream/${encodeURIComponent(id)}`);
        return data.streamUrl || data.url || null;
    }
};
