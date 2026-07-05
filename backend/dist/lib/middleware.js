"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.optionalAuth = optionalAuth;
exports.requireAuth = requireAuth;
const auth_1 = require("./auth");
/**
 * Middleware that optionally attaches the authenticated user to req.user.
 * Does NOT reject unauthenticated requests — routes themselves decide if auth is required.
 */
function optionalAuth(req, _res, next) {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith("Bearer ")) {
        const token = authHeader.slice(7);
        const payload = (0, auth_1.verifyToken)(token);
        if (payload) {
            req.user = payload;
        }
    }
    next();
}
/**
 * Middleware that rejects requests without a valid JWT.
 */
function requireAuth(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
        res.status(401).json({ error: "Authentication required" });
        return;
    }
    const token = authHeader.slice(7);
    const payload = (0, auth_1.verifyToken)(token);
    if (!payload) {
        res.status(401).json({ error: "Invalid or expired token" });
        return;
    }
    req.user = payload;
    next();
}
