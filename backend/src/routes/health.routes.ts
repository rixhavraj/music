import { Router } from "express";
import { getCachedTracks } from "@/services/music.service";

const router = Router();

// GET /api/health
router.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    catalogSize: getCachedTracks().length
  });
});

export default router;
