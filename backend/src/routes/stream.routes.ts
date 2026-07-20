import { Router } from "express";
import { idSchema } from "@/lib/validation";
import { optionalAuth } from "@/lib/middleware";
import { checkRateLimit } from "@/lib/rate-limit";
import { recordPlay } from "@/lib/db";
import { getCachedStreamUrl, makeToneWav, pipeYoutubeStream, invalidateStreamUrl } from "@/services/stream.service";
import { getMusicSource } from "@/lib/music-sources";

const router = Router();

// GET /api/stream/:id/url
router.get("/stream/:id/url", optionalAuth, async (req, res) => {
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

  if (process.env.MUSIC_SOURCE === "ytmusic") {
    try {
      let directUrl = await getCachedStreamUrl(parsed.data);
      try {
        await pipeYoutubeStream(directUrl, req.headers.range, res);
      } catch (streamErr: any) {
        // If forbidden or expired, clear cache, fetch new url and retry once
        if ([403, 404, 410].includes(streamErr.statusCode)) {
          console.log(`Stream URL expired for ${parsed.data}. Invaliding cache and retrying...`);
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
        res.status(404).json({ error: "Stream not available" });
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

  // Fallback to tone generation if not ytmusic
  const frequency = 220 + (parsed.data.charCodeAt(0) % 12) * 22;
  res.setHeader("Content-Type", "audio/wav");
  res.setHeader("Cache-Control", "private, max-age=3600");
  res.send(makeToneWav(frequency));
});

export default router;

