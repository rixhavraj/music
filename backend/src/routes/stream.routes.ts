import { Router } from "express";
import { idSchema } from "@/lib/validation";
import { optionalAuth } from "@/lib/middleware";
import { checkRateLimit } from "@/lib/rate-limit";
import { recordPlay } from "@/lib/db";
import { getCachedStreamUrl, makeToneWav, pipeYoutubeStream, invalidateStreamUrl } from "@/services/stream.service";
import { getMusicSource } from "@/lib/music-sources";
import { saavnMusicSource } from "@/lib/music-sources/saavn";

const router = Router();

// YouTube video IDs are exactly 11 URL-safe characters. The frontend also
// ships with local demo tracks (for example, "midnight-arcade"); those are
// not YouTube IDs and must not be sent to yt-dlp, which returns 404 for them.
const isYoutubeVideoId = (id: string) => /^[A-Za-z0-9_-]{11}$/.test(id);

function fallbackTone(id: string, res: any) {
  const frequency = 220 + (id.charCodeAt(0) % 12) * 22;
  res.setHeader("Content-Type", "audio/wav");
  res.setHeader("Cache-Control", "private, max-age=60");
  res.send(makeToneWav(frequency, 30));
}

async function tryAlternativeStream(failedId: string, req: any, res: any): Promise<boolean> {
  const rawTitle = typeof req.query.title === "string" ? req.query.title.trim() : "";
  const rawArtist = typeof req.query.artist === "string" ? req.query.artist.trim() : "";
  const query = [rawTitle, rawArtist].filter(Boolean).join(" ").trim();
  if (!query) return false;

  const providers = [getMusicSource(), saavnMusicSource];
  const seenIds = new Set([failedId]);

  for (const provider of providers) {
    const tracks = await provider.search(query, 8);
    for (const track of tracks) {
      if (seenIds.has(track.id)) continue;
      seenIds.add(track.id);

      try {
        if (isYoutubeVideoId(track.id)) {
          const directUrl = await getCachedStreamUrl(track.id);
          res.setHeader("X-Stream-Fallback-Id", track.id);
          await pipeYoutubeStream(directUrl, req.headers.range, res);
          return true;
        }

        const directUrl = await provider.getStreamUrl(track.id);
        if (!directUrl) continue;
        res.setHeader("X-Stream-Fallback-Id", track.id);
        await pipeYoutubeStream(directUrl, req.headers.range, res);
        return true;
      } catch (error) {
        invalidateStreamUrl(track.id);
        console.error("Alternative stream failed for " + track.id + ":", error);
      }
    }
  }

  return false;
}

// GET /api/stream/:id/url
router.get("/stream/:id/url", optionalAuth, async (req, res) => {
  const parsed = idSchema.safeParse(req.params.id);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid track id" });
    return;
  }

  if (process.env.MUSIC_SOURCE === "ytmusic" && isYoutubeVideoId(parsed.data)) {
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
router.get("/stream/:id", optionalAuth, async (req, res) => {
  // Rate limiting disabled for stream chunk requests to prevent playback stuttering and desync.
  
  const parsed = idSchema.safeParse(req.params.id);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid track id" });
    return;
  }

  // Auto-record play event on stream start
  const userId = req.user?.userId ?? null;
  recordPlay(parsed.data, userId);

  if (process.env.MUSIC_SOURCE === "ytmusic" && isYoutubeVideoId(parsed.data)) {
    try {
      let directUrl = await getCachedStreamUrl(parsed.data);
      try {
        await pipeYoutubeStream(directUrl, req.headers.range, res);
      } catch (streamErr: any) {
        // If forbidden or expired, clear cache, fetch new url and retry once
        if ([403, 404, 410].includes(streamErr.statusCode)) {
          console.log(`Stream URL expired for ${parsed.data}. Invalidating cache and retrying...`);
          invalidateStreamUrl(parsed.data);
          directUrl = await getCachedStreamUrl(parsed.data);
          await pipeYoutubeStream(directUrl, req.headers.range, res);
        } else {
          throw streamErr;
        }
      }
      return;
    } catch (error) {
      console.error("yt-dlp streaming proxy error:", error);
      if (!res.headersSent) {
        try {
          const recovered = await tryAlternativeStream(parsed.data, req, res);
          if (recovered) return;
        } catch (fallbackError) {
          console.error("Alternative stream recovery failed:", fallbackError);
        }

        fallbackTone(parsed.data, res);
      }
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

  // Fallback to tone generation if no configured source can provide audio.
  fallbackTone(parsed.data, res);
});

export default router;

