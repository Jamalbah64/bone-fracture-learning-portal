// Middleware to protect routes by verifying JWT tokens from cookies and validating user sessions

import jwt from "jsonwebtoken";
import { AUTH_COOKIE_NAME } from "../cookies.js";
import { findActiveSessionByJti, hashToken } from "../sessionService.js";

export default async function authMiddleware(req, res, next) {
    try {
        const token = req.cookies?.[AUTH_COOKIE_NAME];

        if (!token) {
            return res.status(401).json({ error: "Missing authentication cookie" });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (!decoded?.jti) {
            return res.status(401).json({ error: "Invalid token payload" });
        }

        const session = await findActiveSessionByJti(decoded.jti);

        if (!session) {
            return res.status(401).json({ error: "Session expired or revoked" });
        }

        if (session.tokenHash !== hashToken(token)) {
            return res.status(401).json({ error: "Session token mismatch" });
        }

        session.lastUsedAt = new Date();
        await session.save();

        req.user = {
            userId: decoded.userId,
            role: decoded.role,
            jti: decoded.jti,
        };

        next();
    } catch (err) {
        return res.status(401).json({ error: "Invalid or expired authentication" });
    }
}
