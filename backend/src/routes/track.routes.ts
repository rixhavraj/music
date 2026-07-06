import { Router } from "express";
import { checkRateLimit } from "@/lib/rate-limit";
import { searchSchema, idSchema } from "@/lib/validation";
import { optionalAuth } from "@/lib/middleware";
import {
  recordPlay,
  recordSkip,
  recordLike,
  getRecentlyPlayed,
  getLikedTrackIds,
} from "@/lib/db";
import { searchTracks, getTrackById } from "@/services/music.service";

const router = Router();

// POST /api/track/:id/play  — call when a track starts playing
router.post("/track/:id/play", optionalAuth, (req, res) => {
  const parsed = idSchema.safeParse(req.params.id);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid track id" });
    return;
  }
  const userId = req.user?.userId ?? null;
  recordPlay(parsed.data, userId);
  res.json({ ok: true });
});

// POST /api/track/:id/skip  — call when a track is skipped
router.post("/track/:id/skip", optionalAuth, (req, res) => {
  const parsed = idSchema.safeParse(req.params.id);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid track id" });
    return;
  }
  const userId = req.user?.userId ?? null;
  const skipPosition = typeof req.body?.position === "number" ? req.body.position : undefined;
  recordSkip(parsed.data, userId, skipPosition);
  res.json({ ok: true });
});

// POST /api/track/:id/like  — toggle like
router.post("/track/:id/like", optionalAuth, (req, res) => {
  const parsed = idSchema.safeParse(req.params.id);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid track id" });
    return;
  }
  const userId = req.user?.userId ?? null;
  const result = recordLike(parsed.data, userId);
  res.json({ ok: true, state: result });
});

// GET /api/user/history  — recently played track IDs
router.get("/user/history", optionalAuth, (req, res) => {
  const userId = req.user?.userId ?? null;
  const limit = Math.min(Number(req.query.limit) || 20, 50);
  const ids = getRecentlyPlayed(userId, limit);
  res.json({ trackIds: ids });
});

// GET /api/user/liked  — liked track IDs
router.get("/user/liked", optionalAuth, (req, res) => {
  const userId = req.user?.userId ?? null;
  const ids = getLikedTrackIds(userId);
  res.json({ trackIds: ids });
});

// GET /api/search
router.get("/search", optionalAuth, async (req, res) => {
  const clientIp = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "local";
  const ipKey = Array.isArray(clientIp) ? clientIp[0] : clientIp;
  const rate = checkRateLimit(ipKey);

  if (!rate.ok) {
    res.status(429).json({ error: "Too many requests" });
    return;
  }

  const parsed = searchSchema.safeParse({
    q: req.query.q || "",
    limit: req.query.limit || "12",
  });

  if (!parsed.success || !parsed.data.q) {
    res.json({ query: "", tracks: [] });
    return;
  }

  try {
    const tracks = await searchTracks(parsed.data.q, parsed.data.limit);
    res.setHeader("Cache-Control", "private, max-age=30, stale-while-revalidate=120");
    res.json({ query: parsed.data.q, tracks });
  } catch (error) {
    console.error("Search API error:", error);
    res.status(500).json({ error: "Failed to fetch search results" });
  }
});

// GET /api/track/:id
router.get("/track/:id", optionalAuth, async (req, res) => {
  const clientIp = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "local";
  const ipKey = Array.isArray(clientIp) ? clientIp[0] : clientIp;
  const rate = checkRateLimit(ipKey);

  if (!rate.ok) {
    res.status(429).json({ error: "Too many requests" });
    return;
  }

  const parsed = idSchema.safeParse(req.params.id);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid track id" });
    return;
  }

  try {
    const track = await getTrackById(parsed.data);
    if (!track) {
      res.status(404).json({ error: "Track not found" });
      return;
    }
    res.setHeader("Cache-Control", "private, max-age=60, stale-while-revalidate=300");
    res.json(track);
  } catch (error) {
    console.error("Track API error:", error);
    res.status(500).json({ error: "Failed to fetch track details" });
  }
});

export default router;
