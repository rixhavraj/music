"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.idSchema = exports.searchSchema = void 0;
const zod_1 = require("zod");
exports.searchSchema = zod_1.z.object({
    q: zod_1.z.string().trim().min(1).max(80).catch(""),
    limit: zod_1.z.coerce.number().int().min(1).max(25).catch(12)
});
exports.idSchema = zod_1.z.string().regex(/^[a-zA-Z0-9_-]{3,120}$/);
