import { Router } from "express";
import rateLimit from "express-rate-limit";
import { hashPassword, verifyPassword, signToken } from "@/lib/auth";
import { createUserId, saveUser, findUserByEmail, findUserById } from "@/lib/db";
import { optionalAuth } from "@/lib/middleware";

const router = Router();

// Auth routes have stricter limits
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: "Too many auth attempts, please wait." },
});

// POST /api/auth/register
router.post("/register", authLimiter, async (req, res) => {
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
router.post("/login", authLimiter, async (req, res) => {
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
router.get("/me", optionalAuth, (req, res) => {
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

export default router;
