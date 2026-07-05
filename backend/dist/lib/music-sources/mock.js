"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mockMusicSource = void 0;
const catalog_1 = require("@/lib/catalog");
exports.mockMusicSource = {
    async search(query, limit = 12) {
        const normalized = query.toLowerCase();
        if (!normalized) {
            return catalog_1.demoTracks.slice(0, limit);
        }
        return catalog_1.demoTracks
            .filter((track) => [track.title, track.artist, track.album, track.mood].some((value) => value.toLowerCase().includes(normalized)))
            .slice(0, limit);
    },
    async getTrack(id) {
        const track = (0, catalog_1.findTrack)(id);
        return track ? (0, catalog_1.enrichTrack)(track) : null;
    },
    async getStreamUrl(id) {
        return (0, catalog_1.findTrack)(id) ? `/api/stream/${id}` : null;
    }
};
