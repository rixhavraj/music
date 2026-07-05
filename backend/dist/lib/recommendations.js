"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MOOD_KEYWORDS = void 0;
exports.applyQueueRules = applyQueueRules;
exports.generateRecommendations = generateRecommendations;
exports.smartShuffle = smartShuffle;
const db_1 = require("./db");
// ─── Mood definitions ─────────────────────────────────────────────────────────
exports.MOOD_KEYWORDS = {
    happy: ["happy", "upbeat", "cheerful", "joyful", "party", "dance"],
    sad: ["sad", "melancholy", "heartbreak", "emotional", "blue"],
    romantic: ["romantic", "love", "bollywood love", "date night"],
    energetic: ["energetic", "workout", "gym", "power", "motivation", "running"],
    calm: ["calm", "relax", "chill", "lofi", "peaceful", "ambient"],
    focus: ["focus", "study", "concentration", "instrumental", "work"],
    sleep: ["sleep", "lullaby", "night", "meditation", "white noise"],
    party: ["party", "edm", "dance", "club", "hip hop", "bass"],
    rainy: ["rainy", "rain", "monsoon", "cozy", "acoustic"],
    travel: ["travel", "road trip", "adventure", "bollywood", "punjabi"],
};
// ─── Smart queue filter ───────────────────────────────────────────────────────
/**
 * Apply smart queue rules to a list of tracks:
 * - Removes frequently skipped tracks
 * - Limits consecutive tracks from the same artist
 * - Prioritizes liked tracks near the top
 * - No duplicate IDs
 */
function applyQueueRules(tracks, userId, options = {}) {
    const { respectSkips = true, prioritizeLiked = true, maxConsecutiveSameArtist = 2, } = options;
    const skipped = respectSkips ? (0, db_1.getFrequentlySkipped)(userId) : new Set();
    const liked = prioritizeLiked ? new Set((0, db_1.getLikedTrackIds)(userId)) : new Set();
    // Filter out frequently skipped
    let filtered = tracks.filter((t) => !skipped.has(t.id));
    // Deduplicate by ID
    const seen = new Set();
    filtered = filtered.filter((t) => {
        if (seen.has(t.id))
            return false;
        seen.add(t.id);
        return true;
    });
    // Sort: liked first, then rest
    if (prioritizeLiked) {
        filtered.sort((a, b) => {
            const aLiked = liked.has(a.id) ? 0 : 1;
            const bLiked = liked.has(b.id) ? 0 : 1;
            return aLiked - bLiked;
        });
    }
    // Enforce max consecutive same-artist rule
    const result = [];
    const artistRunCount = new Map();
    for (const track of filtered) {
        const artist = track.artist;
        const run = artistRunCount.get(artist) ?? 0;
        if (run >= maxConsecutiveSameArtist) {
            // Push it to the back (add to end of remaining)
            filtered.push(track);
            continue;
        }
        // Reset other artists when we switch
        if (result.length > 0 && result[result.length - 1].artist !== artist) {
            // No reset needed for Map — just track the new one
        }
        artistRunCount.set(artist, run + 1);
        result.push(track);
        if (result.length >= tracks.length)
            break; // safety valve
    }
    return result;
}
/**
 * Generate personalized recommendation playlists based on user history.
 * `allTracks` is the full catalog available to the backend.
 */
function generateRecommendations(allTracks, userId) {
    const recentIds = new Set((0, db_1.getRecentlyPlayed)(userId, 30));
    const skippedIds = (0, db_1.getFrequentlySkipped)(userId);
    const likedIds = new Set((0, db_1.getLikedTrackIds)(userId));
    // Helpers
    const fresh = (t) => !recentIds.has(t.id) && !skippedIds.has(t.id);
    const liked = (t) => likedIds.has(t.id);
    const recent = (t) => recentIds.has(t.id);
    const shuffled = [...allTracks].sort(() => Math.random() - 0.5);
    // 1. Recently Played
    const recentlyPlayedList = [...allTracks]
        .filter(recent)
        .sort(() => Math.random() - 0.5)
        .slice(0, 15);
    // 2. Daily Mix — blend of liked + fresh tracks
    const dailyMix = [
        ...shuffled.filter(liked).slice(0, 5),
        ...shuffled.filter(fresh).slice(0, 10),
    ].slice(0, 15);
    // 3. Discover Weekly — fresh tracks the user hasn't heard
    const discoverWeekly = shuffled.filter(fresh).slice(0, 20);
    // 4. Liked Songs
    const likedSongs = allTracks.filter(liked);
    // 5. Mood-based: Chill Mix
    const chillKeywords = exports.MOOD_KEYWORDS.calm;
    const chillMix = shuffled
        .filter((t) => chillKeywords.some((kw) => t.mood?.toLowerCase().includes(kw) || t.title.toLowerCase().includes(kw)))
        .slice(0, 15);
    // 6. Focus Mix
    const focusKeywords = exports.MOOD_KEYWORDS.focus;
    const focusMix = shuffled
        .filter((t) => focusKeywords.some((kw) => t.mood?.toLowerCase().includes(kw) || t.title.toLowerCase().includes(kw)))
        .slice(0, 15);
    // 7. Party / Energetic Mix
    const partyKeywords = [...exports.MOOD_KEYWORDS.party, ...exports.MOOD_KEYWORDS.energetic];
    const partyMix = shuffled
        .filter((t) => partyKeywords.some((kw) => t.mood?.toLowerCase().includes(kw) || t.title.toLowerCase().includes(kw)))
        .slice(0, 15);
    // 8. Trending — most played (sorted by play count via random for now; replace with real analytics)
    const trendingNow = shuffled.slice(0, 15);
    // 9. Similar Artists — based on liked artists
    const likedArtists = new Set(allTracks.filter(liked).map((t) => t.artist));
    const similarArtists = shuffled
        .filter((t) => !liked(t) && likedArtists.has(t.artist))
        .slice(0, 15);
    return [
        {
            id: "daily-mix",
            name: "Daily Mix",
            description: "Hand-picked for you, refreshed daily",
            emoji: "🎵",
            trackIds: dailyMix.map((t) => t.id),
        },
        {
            id: "recently-played",
            name: "Recently Played",
            description: "Pick up where you left off",
            emoji: "🕐",
            trackIds: recentlyPlayedList.map((t) => t.id),
        },
        {
            id: "discover-weekly",
            name: "Discover Weekly",
            description: "Fresh music you haven't heard yet",
            emoji: "🔭",
            trackIds: discoverWeekly.map((t) => t.id),
        },
        {
            id: "liked-songs",
            name: "Liked Songs",
            description: "Your personal favorites collection",
            emoji: "💚",
            trackIds: likedSongs.map((t) => t.id),
        },
        {
            id: "chill-mix",
            name: "Chill Mix",
            description: "Relax and unwind with smooth sounds",
            emoji: "😌",
            trackIds: chillMix.map((t) => t.id),
        },
        {
            id: "focus-mix",
            name: "Focus Mix",
            description: "Deep work, deep concentration",
            emoji: "🎧",
            trackIds: focusMix.map((t) => t.id),
        },
        {
            id: "party-mix",
            name: "Party Mix",
            description: "High energy anthems to get the party started",
            emoji: "🎉",
            trackIds: partyMix.map((t) => t.id),
        },
        {
            id: "trending-now",
            name: "Trending Now",
            description: "What everyone is listening to",
            emoji: "🔥",
            trackIds: trendingNow.map((t) => t.id),
        },
        {
            id: "similar-artists",
            name: "Similar Artists",
            description: "Artists you'll love based on your taste",
            emoji: "🎤",
            trackIds: similarArtists.map((t) => t.id),
        },
    ];
}
// ─── Smart shuffle ────────────────────────────────────────────────────────────
/**
 * Fisher-Yates shuffle with artist diversity enforcement.
 * Avoids placing the same artist consecutively more than once.
 */
function smartShuffle(tracks) {
    const arr = [...tracks];
    // Regular Fisher-Yates first
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    // Spread same-artist tracks to avoid adjacency
    for (let i = 1; i < arr.length; i++) {
        if (arr[i].artist === arr[i - 1].artist) {
            // Find a non-adjacent slot to swap with
            for (let j = i + 1; j < arr.length; j++) {
                if (arr[j].artist !== arr[i].artist && arr[j].artist !== arr[i - 1].artist) {
                    [arr[i], arr[j]] = [arr[j], arr[i]];
                    break;
                }
            }
        }
    }
    return arr;
}
