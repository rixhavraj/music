"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.demoPlaylists = exports.demoTracks = void 0;
exports.findTrack = findTrack;
exports.enrichTrack = enrichTrack;
exports.demoTracks = [
    {
        id: "midnight-arcade",
        title: "Midnight Arcade",
        artist: "Naya Vale",
        album: "Neon Weather",
        duration: 214,
        year: 2026,
        mood: "Late drive",
        color: "#246a73",
        cover: "/covers/midnight-arcade.svg",
        source: "mock"
    },
    {
        id: "paper-sun",
        title: "Paper Sun",
        artist: "The Room Tone",
        album: "Tiny Signals",
        duration: 189,
        year: 2025,
        mood: "Warm indie",
        color: "#b95f3d",
        cover: "/covers/paper-sun.svg",
        source: "mock"
    },
    {
        id: "monsoon-loop",
        title: "Monsoon Loop",
        artist: "Asha North",
        album: "Rain Index",
        duration: 236,
        year: 2026,
        mood: "Focus",
        color: "#2f6f5e",
        cover: "/covers/monsoon-loop.svg",
        source: "mock"
    },
    {
        id: "glass-floors",
        title: "Glass Floors",
        artist: "Ivy Circuit",
        album: "Soft Machines",
        duration: 201,
        year: 2024,
        mood: "Electronic",
        color: "#6c4a7f",
        cover: "/covers/glass-floors.svg",
        source: "mock"
    },
    {
        id: "silver-line",
        title: "Silver Line",
        artist: "Kite Assembly",
        album: "Afterglow Maps",
        duration: 247,
        year: 2025,
        mood: "Uplift",
        color: "#5b6f2f",
        cover: "/covers/silver-line.svg",
        source: "mock"
    },
    {
        id: "low-orbit",
        title: "Low Orbit",
        artist: "Mina Sol",
        album: "Tidal Systems",
        duration: 228,
        year: 2026,
        mood: "Ambient pop",
        color: "#7a4d2e",
        cover: "/covers/low-orbit.svg",
        source: "mock"
    }
];
exports.demoPlaylists = [
    {
        id: "quick-mix",
        name: "Quick Mix",
        description: "Recent favorites with a steady pulse.",
        trackIds: ["midnight-arcade", "glass-floors", "silver-line"]
    },
    {
        id: "rain-focus",
        name: "Rain Focus",
        description: "Low-noise tracks for long sessions.",
        trackIds: ["monsoon-loop", "low-orbit", "paper-sun"]
    }
];
function findTrack(id) {
    return exports.demoTracks.find((track) => track.id === id);
}
function enrichTrack(track) {
    return {
        ...track,
        streamUrl: `/api/stream/${track.id}`,
        lyrics: [
            "Static on the stairwell",
            "City lights in time",
            "I keep the signal open",
            "You keep the silver line"
        ],
        tags: [track.mood, track.year.toString(), track.album],
        similarArtists: ["Mira Coast", "After Fields", "The Quiet Grid"],
        bio: `${track.artist} blends crisp electronic textures with melodic, human-scale songwriting.`
    };
}
