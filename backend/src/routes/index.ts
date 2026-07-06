import { Router } from "express";
import authRoutes from "./auth.routes";
import trackRoutes from "./track.routes";
import recommendationRoutes from "./recommendation.routes";
import streamRoutes from "./stream.routes";
import healthRoutes from "./health.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/", trackRoutes);
router.use("/", recommendationRoutes);
router.use("/", streamRoutes);
router.use("/", healthRoutes);

export default router;
