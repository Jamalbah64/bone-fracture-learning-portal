import crypto from "crypto";
import Session from "../models/session.js";

export function hashToken(token) {
    return crypto.createHash("sha256").update(token).digest("hex");
}

export async function createSession({
    userId,
    jti,
    token,
    role,
    userAgent,
    ipAddress,
    expiresAt,
}) {
    return Session.create({
        userId,
        jti,
        tokenHash: hashToken(token),
        role,
        userAgent: userAgent || "",
        ipAddress: ipAddress || "",
        expiresAt,
    });
}

export async function revokeSessionByJti(jti) {
    return Session.findOneAndUpdate(
        { jti, revoked: false },
        { revoked: true, lastUsedAt: new Date() },
        { new: true }
    );
}

export async function findActiveSessionByJti(jti) {
    return Session.findOne({
        jti,
        revoked: false,
        expiresAt: { $gt: new Date() },
    });
}
