import { Router } from "express";
import { optionalAuth } from "@/lib/middleware";
import { getMusicSource } from "@/lib/music-sources";
import { generateRecommendations, applyQueueRules, smartShuffle, MOOD_KEYWORDS } from "@/lib/recommendations";
import { getCachedTracks, seedCatalogIfEmpty } from "@/services/music.service";

const router = Router();

// GET /api/recommendations  — personalized playlists
router.get("/recommendations", optionalAuth, async (req, res) => {
  const userId = req.user?.userId ?? null;

  await seedCatalogIfEmpty();

  const playlists = generateRecommendations(getCachedTracks(), userId);
  res.setHeader("Cache-Control", "private, max-age=60, stale-while-revalidate=300");
  res.json({ playlists });
});

// GET /api/mood/:mood  — mood-based playlist
router.get("/mood/:mood", optionalAuth, async (req, res) => {
  const mood = req.params.mood.toLowerCase();
  const keywords = MOOD_KEYWORDS[mood];
  if (!keywords) {
    res.status(400).json({ error: `Unknown mood. Valid moods: ${Object.keys(MOOD_KEYWORDS).join(", ")}` });
    return;
  }

  try {
    const searchQuery = keywords.slice(0, 2).join(" ");
    const tracks = await getMusicSource().search(searchQuery, 20);
    const userId = req.user?.userId ?? null;
    const smartQueue = applyQueueRules(tracks, userId, { respectSkips: true, prioritizeLiked: true });
    res.setHeader("Cache-Control", "private, max-age=120");
    res.json({ mood, tracks: smartQueue });
  } catch (error) {
    console.error("Mood playlist error:", error);
    res.status(500).json({ error: "Failed to generate mood playlist" });
  }
});

// GET /api/smart-queue  — smart-shuffled version of a search result
router.get("/smart-queue", optionalAuth, async (req, res) => {
  const query = String(req.query.q || "Trending Hindi Songs");
  const limit = Math.min(Number(req.query.limit) || 30, 50);

  try {
    const tracks = await getMusicSource().search(query, limit);
    const userId = req.user?.userId ?? null;
    const queue = smartShuffle(applyQueueRules(tracks, userId));
    res.setHeader("Cache-Control", "private, max-age=60");
    res.json({ tracks: queue });
  } catch (error) {
    console.error("Smart queue error:", error);
    res.status(500).json({ error: "Failed to build smart queue" });
  }
});

export default router;
