"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.hashPassword = hashPassword;
exports.verifyPassword = verifyPassword;
exports.signToken = signToken;
exports.verifyToken = verifyToken;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const JWT_SECRET = process.env.JWT_SECRET || "chillguys-dev-secret-change-in-prod";
const JWT_EXPIRES_IN = "7d";
/** Hash a plaintext password */
async function hashPassword(password) {
    return bcryptjs_1.default.hash(password, 12);
}
/** Compare plaintext against a stored hash */
async function verifyPassword(password, hash) {
    return bcryptjs_1.default.compare(password, hash);
}
/** Sign and return a JWT token for a user */
function signToken(payload) {
    return jsonwebtoken_1.default.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}
/** Verify and decode a JWT token; returns null on failure */
function verifyToken(token) {
    try {
        return jsonwebtoken_1.default.verify(token, JWT_SECRET);
    }
    catch {
        return null;
    }
}
