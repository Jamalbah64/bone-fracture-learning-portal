import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import User from "../models/index.js";
import { AUTH_COOKIE_NAME, getCookieOptions } from "./cookies.js";
import {
    createSession,
    revokeSessionByJti,
} from "./sessionService.js";

function getTokenExpiryDate(hours = 2) {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + hours);
    return expiresAt;
}

export async function register(req, res) {
    try {
        const { username, password, role } = req.body;

        const existing = await User.findOne({ username });
        if (existing) {
            return res.status(400).json({ error: "Username already in use" });
        }

        await User.create({ username, password, role });
        return res.status(201).json({ message: "User created" });
    } catch (err) {
        console.error("Registration error:", err && err.stack ? err.stack : err);
        return res.status(500).json({ error: "Server error" });
    }
}

export async function login(req, res) {
    try {
        const { username, password } = req.body;

        const user = await User.findOne({ username });
        if (!user) return res.status(400).json({ error: "Invalid credentials" });

        const match = await bcrypt.compare(password, user.password);
        if (!match) return res.status(400).json({ error: "Invalid credentials" });

        const jti = crypto.randomUUID();
        const expiresAt = getTokenExpiryDate(2);

        const token = jwt.sign(
            {
                userId: String(user._id),
                role: user.role,
                jti,
            },
            process.env.JWT_SECRET,
            { expiresIn: "2h" }
        );

        await createSession({
            userId: user._id,
            jti,
            token,
            role: user.role,
            userAgent: req.get("user-agent") || "",
            ipAddress: req.ip || req.connection?.remoteAddress || "",
            expiresAt,
        });

        res.cookie(AUTH_COOKIE_NAME, token, getCookieOptions());

        return res.json({
            message: "Login successful",
            user: {
                id: user._id,
                username: user.username,
                role: user.role,
            },
        });
    } catch (err) {
        console.error("Login error:", err && err.stack ? err.stack : err);
        return res.status(500).json({ error: "Server error" });
    }
}

export async function logout(req, res) {
    try {
        const jti = req.user?.jti;

        if (jti) {
            await revokeSessionByJti(jti);
        }

        res.clearCookie(AUTH_COOKIE_NAME, {
            ...getCookieOptions(),
            maxAge: undefined,
        });

        return res.json({ message: "Logout successful" });
    } catch (err) {
        console.error("Logout error:", err && err.stack ? err.stack : err);
        return res.status(500).json({ error: "Server error" });
    }
}

export async function me(req, res) {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ error: "Unauthorized" });

        const user = await User.findOne({ _id: userId });
        if (!user) return res.status(404).json({ error: "User not found" });

        return res.json({
            id: user._id,
            username: user.username,
            role: user.role,
        });
    } catch (err) {
        console.error("Me endpoint error:", err && err.stack ? err.stack : err);
        return res.status(500).json({ error: "Server error" });
    }
}
