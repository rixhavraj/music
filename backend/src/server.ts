import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { spawn } from "child_process";
import rateLimit from "express-rate-limit";

import { checkRateLimit } from "./lib/rate-limit";
import { searchSchema, idSchema } from "./lib/validation";
import { getMusicSource } from "./lib/music-sources";
import { hashPassword, verifyPassword, signToken } from "./lib/auth";
import { optionalAuth } from "./lib/middleware";
import {
  createUserId,
  saveUser,
  findUserByEmail,
  findUserById,
  recordPlay,
  recordSkip,
  recordLike,
  getRecentlyPlayed,
  getLikedTrackIds,
} from "./lib/db";
import { generateRecommendations, applyQueueRules, smartShuffle, MOOD_KEYWORDS } from "./lib/recommendations";
import type { Track } from "./types/music";

// ─── Environment ───────────────────────────────────────────────────────────────

dotenv.config({ path: path.join(__dirname, "../.env.local") });
if (!process.env.MUSIC_SOURCE) {
  dotenv.config({ path: path.join(__dirname, "../../frontend/.env.local") });
}

// ─── App setup ─────────────────────────────────────────────────────────────────

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Global rate limiter: 300 req / 15 min per IP
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." },
});
app.use(globalLimiter);

// Auth routes have stricter limits
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: "Too many auth attempts, please wait." },
});

const YTDLP_PATH = "C:\\Users\\rixha\\AppData\\Local\\Microsoft\\WinGet\\Links\\yt-dlp.exe";

// In-memory track catalog cache for recommendations (populated on first search)
let cachedTracks: Track[] = [];

// ─── Helpers ───────────────────────────────────────────────────────────────────

function makeToneWav(frequency: number, durationSeconds = 10) {
  const sampleRate = 44_100;
  const sampleCount = sampleRate * durationSeconds;
  const buffer = new ArrayBuffer(44 + sampleCount * 2);
  const view = new DataView(buffer);

  function writeString(offset: number, value: string) {
    for (let index = 0; index < value.length; index += 1) {
      view.setUint8(offset + index, value.charCodeAt(index));
    }
  }

  writeString(0, "RIFF");
  view.setUint32(4, 36 + sampleCount * 2, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, "data");
  view.setUint32(40, sampleCount * 2, true);

  for (let index = 0; index < sampleCount; index += 1) {
    const fade = Math.min(index / 2000, (sampleCount - index) / 2000, 1);
    const sample = Math.sin((2 * Math.PI * frequency * index) / sampleRate) * 0.16 * fade;
    view.setInt16(44 + index * 2, sample * 32767, true);
  }

  return Buffer.from(buffer);
}

// ─── Auth routes ───────────────────────────────────────────────────────────────

// POST /api/auth/register
app.post("/api/auth/register", authLimiter, async (req, res) => {
  const { email, password, name } = req.body as { email?: string; password?: string; name?: string };

  if (!email || !password) {
    res.status(400).json({ error: "Email and password are required" });
    return;
  }
  if (password.length < 8) {
    res.status(400).json({ error: "Password must be at least 8 characters" });
    return;
  }
  if (findUserByEmail(email)) {
    res.status(409).json({ error: "An account with this email already exists" });
    return;
  }

  const id = createUserId();
  const passwordHash = await hashPassword(password);
  const user = { id, email, passwordHash, name, createdAt: new Date() };
  saveUser(user);

  const token = signToken({ userId: id, email });
  res.status(201).json({ token, user: { id, email, name } });
});

// POST /api/auth/login
app.post("/api/auth/login", authLimiter, async (req, res) => {
  const { email, password } = req.body as { email?: string; password?: string };

  if (!email || !password) {
    res.status(400).json({ error: "Email and password are required" });
    return;
  }

  const user = findUserByEmail(email);
  if (!user) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  const token = signToken({ userId: user.id, email: user.email });
  res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
});

// GET /api/auth/me
app.get("/api/auth/me", optionalAuth, (req, res) => {
  if (!req.user) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  const user = findUserById(req.user.userId);
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json({ id: user.id, email: user.email, name: user.name, createdAt: user.createdAt });
});

// ─── Music tracking routes ──────────────────────────────────────────────────────

// POST /api/track/:id/play  — call when a track starts playing
app.post("/api/track/:id/play", optionalAuth, (req, res) => {
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
app.post("/api/track/:id/skip", optionalAuth, (req, res) => {
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
app.post("/api/track/:id/like", optionalAuth, (req, res) => {
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
app.get("/api/user/history", optionalAuth, (req, res) => {
  const userId = req.user?.userId ?? null;
  const limit = Math.min(Number(req.query.limit) || 20, 50);
  const ids = getRecentlyPlayed(userId, limit);
  res.json({ trackIds: ids });
});

// GET /api/user/liked  — liked track IDs
app.get("/api/user/liked", optionalAuth, (req, res) => {
  const userId = req.user?.userId ?? null;
  const ids = getLikedTrackIds(userId);
  res.json({ trackIds: ids });
});

// ─── Recommendations ────────────────────────────────────────────────────────────

// GET /api/recommendations  — personalized playlists
app.get("/api/recommendations", optionalAuth, async (req, res) => {
  const userId = req.user?.userId ?? null;

  // Seed the catalog if empty — search for popular tracks
  if (cachedTracks.length < 10) {
    try {
      const source = getMusicSource();
      const [t1, t2, t3] = await Promise.all([
        source.search("Trending Hindi Songs", 20),
        source.search("Bollywood Pop", 20),
        source.search("Chill Lo-fi", 10),
      ]);
      const all = [...t1, ...t2, ...t3];
      const seen = new Set<string>();
      cachedTracks = all.filter((t) => {
        if (seen.has(t.id)) return false;
        seen.add(t.id);
        return true;
      });
    } catch {
      cachedTracks = [];
    }
  }

  const playlists = generateRecommendations(cachedTracks, userId);
  res.setHeader("Cache-Control", "private, max-age=60, stale-while-revalidate=300");
  res.json({ playlists });
});

// GET /api/mood/:mood  — mood-based playlist
app.get("/api/mood/:mood", optionalAuth, async (req, res) => {
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
app.get("/api/smart-queue", optionalAuth, async (req, res) => {
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

// ─── Original music routes ──────────────────────────────────────────────────────

// GET /api/search
app.get("/api/search", optionalAuth, async (req, res) => {
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
    const tracks = await getMusicSource().search(parsed.data.q, parsed.data.limit);
    // Update catalog cache opportunistically
    if (cachedTracks.length < 50) {
      const seen = new Set(cachedTracks.map((t) => t.id));
      for (const t of tracks) {
        if (!seen.has(t.id)) { seen.add(t.id); cachedTracks.push(t); }
      }
    }
    res.setHeader("Cache-Control", "private, max-age=30, stale-while-revalidate=120");
    res.json({ query: parsed.data.q, tracks });
  } catch (error) {
    console.error("Search API error:", error);
    res.status(500).json({ error: "Failed to fetch search results" });
  }
});

// GET /api/track/:id
app.get("/api/track/:id", optionalAuth, async (req, res) => {
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
    const track = await getMusicSource().getTrack(parsed.data);
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

interface StreamCache {
  url: string;
  expiresAt: number;
}
const streamUrlCache = new Map<string, StreamCache>();

async function getCachedStreamUrl(id: string): Promise<string> {
  const cached = streamUrlCache.get(id);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.url;
  }
  
  return new Promise((resolve, reject) => {
    const { exec } = require("child_process");
    exec(`"${YTDLP_PATH}" -g --format "bestaudio" "https://www.youtube.com/watch?v=${id}"`, (err: any, stdout: string) => {
      if (err || !stdout.trim()) {
        reject(err || new Error("No URL returned from yt-dlp"));
        return;
      }
      const directUrl = stdout.trim();
      streamUrlCache.set(id, {
        url: directUrl,
        expiresAt: Date.now() + 30 * 60 * 1000, // 30 minutes cache
      });
      resolve(directUrl);
    });
  });
}

// GET /api/stream/:id/url
app.get("/api/stream/:id/url", optionalAuth, async (req, res) => {
  const parsed = idSchema.safeParse(req.params.id);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid track id" });
    return;
  }

  if (process.env.MUSIC_SOURCE === "ytmusic") {
    try {
      const directUrl = await getCachedStreamUrl(parsed.data);
      res.json({ url: directUrl });
      return;
    } catch (error) {
      console.error("yt-dlp URL resolution error:", error);
      res.status(500).json({ error: "Failed to resolve stream URL" });
      return;
    }
  }

  res.json({ url: `/api/stream/${parsed.data}` });
});

// GET /api/stream/:id
app.get("/api/stream/:id", optionalAuth, async (req, res) => {
  const clientIp = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "local";
  const ipKey = Array.isArray(clientIp) ? clientIp[0] : clientIp;
  const rate = checkRateLimit(`stream:${ipKey}`, 120, 60_000);

  if (!rate.ok) {
    res.status(429).json({ error: "Too many requests" });
    return;
  }

  const parsed = idSchema.safeParse(req.params.id);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid track id" });
    return;
  }

  // Auto-record play event on stream start
  const userId = req.user?.userId ?? null;
  recordPlay(parsed.data, userId);

  if (process.env.MUSIC_SOURCE === "ytmusic") {
    try {
      const directUrl = await getCachedStreamUrl(parsed.data);
      
      const range = req.headers.range;
      const headers: Record<string, string> = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      };
      if (range) {
        headers["Range"] = range;
      }

      const followRedirectsGet = (urlStr: string, opts: any, cb: (res: any) => void): any => {
        const protocol = urlStr.startsWith("https") ? require("https") : require("http");
        return protocol.get(urlStr, opts, (youtubeRes: any) => {
          if (youtubeRes.statusCode >= 300 && youtubeRes.statusCode < 400 && youtubeRes.headers.location) {
            return followRedirectsGet(youtubeRes.headers.location, opts, cb);
          }
          cb(youtubeRes);
        });
      };

      const reqYt = followRedirectsGet(directUrl, { headers }, (youtubeRes: any) => {
        if (youtubeRes.headers["content-type"]) {
          res.setHeader("Content-Type", youtubeRes.headers["content-type"]);
        }
        if (youtubeRes.headers["content-length"]) {
          res.setHeader("Content-Length", youtubeRes.headers["content-length"]);
        }
        if (youtubeRes.headers["content-range"]) {
          res.setHeader("Content-Range", youtubeRes.headers["content-range"]);
        }
        res.setHeader("Accept-Ranges", "bytes");
        res.setHeader("Access-Control-Allow-Origin", "*");
        
        res.status(youtubeRes.statusCode || 200);
        youtubeRes.pipe(res);
      });

      reqYt.on("error", (err: any) => {
        console.error("HTTP proxy stream connection error:", err);
        if (!res.headersSent) {
          res.status(500).json({ error: "Streaming failed" });
        }
      });

      res.on("close", () => {
        reqYt.destroy();
      });
      return;
    } catch (error) {
      console.error("yt-dlp streaming proxy error:", error);
      res.status(404).json({ error: "Stream not available" });
      return;
    }
  }

  if (process.env.MUSIC_SOURCE !== "ytmusic" && process.env.MUSIC_SOURCE !== "mock") {
    try {
      const directUrl = await getMusicSource().getStreamUrl(parsed.data);
      if (directUrl) {
        res.redirect(directUrl);
        return;
      }
    } catch (error) {
      console.error("Streaming URL resolution error:", error);
    }
  }

  // Fallback to tone generation if not ytmusic
  const frequency = 220 + (parsed.data.charCodeAt(0) % 12) * 22;
  res.setHeader("Content-Type", "audio/wav");
  res.setHeader("Cache-Control", "private, max-age=3600");
  res.send(makeToneWav(frequency));
});

// ─── Health check ──────────────────────────────────────────────────────────────

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString(), catalogSize: cachedTracks.length });
});

// ─── Start ────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`🎵 ChillGuys backend running on http://127.0.0.1:${PORT}`);
  console.log(`   Auth:          POST /api/auth/register | /api/auth/login`);
  console.log(`   Tracking:      POST /api/track/:id/play | /skip | /like`);
  console.log(`   Recommend:     GET  /api/recommendations`);
  console.log(`   Mood playlist: GET  /api/mood/:mood`);
  console.log(`   Smart queue:   GET  /api/smart-queue?q=...`);
  console.log(`   Search:        GET  /api/search?q=...`);
  console.log(`   Stream:        GET  /api/stream/:id`);
});
