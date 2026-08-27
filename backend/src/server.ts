import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import rateLimit from "express-rate-limit";
import { writeFileSync, existsSync } from "fs";
import apiRouter from "./routes";

// ─── Environment ───────────────────────────────────────────────────────────────

dotenv.config({ path: path.join(__dirname, "../.env.local") });
if (!process.env.MUSIC_SOURCE) {
  dotenv.config({ path: path.join(__dirname, "../../frontend/.env.local") });
}
console.log("Loaded MUSIC_SOURCE:", process.env.MUSIC_SOURCE);

// ─── YouTube Cookies Setup ────────────────────────────────────────────────────

// Initialize cookies for yt-dlp from environment or local file
let cookiePath: string | undefined;

if (process.env.YOUTUBE_COOKIES) {
  // Render/production: write env var to /tmp/cookies.txt
  cookiePath = "/tmp/cookies.txt";
  try {
    writeFileSync(cookiePath, process.env.YOUTUBE_COOKIES, "utf-8");
    console.log("[Cookies] Wrote YOUTUBE_COOKIES to", cookiePath);
  } catch (err) {
    console.error("[Cookies] Failed to write cookies to", cookiePath, err);
    cookiePath = undefined;
  }
} else {
  // Local development: check for cookies.txt in project root
  const localCookiesPath = path.join(process.cwd(), "cookies.txt");
  if (existsSync(localCookiesPath)) {
    cookiePath = localCookiesPath;
    console.log("[Cookies] Found local cookies at", localCookiesPath);
  } else {
    console.warn(
      "[Cookies] No YOUTUBE_COOKIES env var and no local cookies.txt found. " +
      "YouTube extraction may fail due to age-restricted or protected content."
    );
  }
}

// Set the environment variable for yt-dlp to use
if (cookiePath) {
  process.env.YTDLP_COOKIES_PATH = cookiePath;
} else {
  delete process.env.YTDLP_COOKIES_PATH;
}


// ─── App setup ─────────────────────────────────────────────────────────────────

const app = express();
const PORT = process.env.PORT || 3001;

const ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "https://music-orean.vercel.app",
  ...(process.env.CORS_ORIGIN ? [process.env.CORS_ORIGIN] : []),
];

const isAllowedOrigin = (origin?: string) =>
  !origin ||
  ALLOWED_ORIGINS.includes(origin) ||
  /^https:\/\/[a-z0-9-]+\.vercel\.app$/i.test(origin);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Postman, same-origin server calls)
    if (isAllowedOrigin(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS blocked: ${origin}`));
    }
  },
  credentials: true,
}));
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

// ─── Routes ───────────────────────────────────────────────────────────────────

app.use("/api", apiRouter);

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
