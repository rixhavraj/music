import { z } from "zod";

export const searchSchema = z.object({
  q: z.string().trim().min(1).max(80).catch(""),
  limit: z.coerce.number().int().min(1).max(25).catch(12)
});

export const idSchema = z.string().regex(/^[a-zA-Z0-9_-]{3,120}$/);
