"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMusicSource = getMusicSource;
const gaanapy_1 = require("@/lib/music-sources/gaanapy");
const mock_1 = require("@/lib/music-sources/mock");
const saavn_1 = require("@/lib/music-sources/saavn");
const workers_1 = require("@/lib/music-sources/workers");
const ytmusic_1 = require("@/lib/music-sources/ytmusic");
function getMusicSource() {
    if (process.env.MUSIC_SOURCE === "ytmusic") {
        return ytmusic_1.ytmusicMusicSource;
    }
    if (process.env.MUSIC_SOURCE === "workers") {
        return workers_1.workersMusicSource;
    }
    if (process.env.MUSIC_SOURCE === "saavn") {
        return saavn_1.saavnMusicSource;
    }
    return process.env.MUSIC_SOURCE === "gaanapy" ? gaanapy_1.gaanapyMusicSource : mock_1.mockMusicSource;
}
