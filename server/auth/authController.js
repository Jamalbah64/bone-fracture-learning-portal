import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import User from "../models/index.js";
import Scan from "../models/Scan.js";
import PatientAssignment from "../models/PatientAssignment.js";
import { AUTH_COOKIE_NAME, getCookieOptions } from "./cookies.js";
import {
    createSession,
    revokeSessionByJti,
} from "./sessionService.js";

// When a new patient registers, claim any scans that were previously uploaded
// for their username (before they had an account) by linking patientUser to
// the new account and auto-creating assignments for the uploading radiologists.
async function linkOrphanScans(newUser) {
    if (!newUser || newUser.role !== "patient" || !newUser._id) return;
    try {
        const orphanScans = await Scan.find({
            patientId: newUser.username,
            patientUser: null,
        })
            .select("_id uploadedBy")
            .lean();
        if (orphanScans.length === 0) return;

        await Scan.updateMany(
            { _id: { $in: orphanScans.map((s) => s._id) } },
            { $set: { patientUser: newUser._id } }
        );

        const uploaderIds = [
            ...new Set(orphanScans.map((s) => String(s.uploadedBy))),
        ];
        await Promise.all(
            uploaderIds.map(async (radId) => {
                const exists = await PatientAssignment.findOne({
                    patientUser: newUser._id,
                    radiologist: radId,
                });
                if (!exists) {
                    await PatientAssignment.create({
                        patientUser: newUser._id,
                        radiologist: radId,
                        assignedBy: radId,
                    });
                }
            })
        );
    } catch (err) {
        console.error("linkOrphanScans error:", err);
    }
}

function getTokenExpiryDate(hours = 2) {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + hours);
    return expiresAt;
}

const ALLOWED_ROLES = ["patient", "clinician", "radiologist", "head_radiologist"];
const STAFF_ROLES = ["radiologist", "head_radiologist"];

function normalizeRole(role) {
    if (!role) return "patient";
    return role;
}

function normalizeStaffId(staffId) {
    return String(staffId ?? "").trim();
}

<<<<<<< HEAD
export async function register(req, res) {
    try {
        const { username, password, role, staffId } = req.body;
        const normalizedRole = normalizeRole(role);
        const normalizedStaffId = normalizeStaffId(staffId);
        if (!ALLOWED_ROLES.includes(normalizedRole)) {
            return res.status(400).json({ error: "Invalid role" });
        }
        if (STAFF_ROLES.includes(normalizedRole)) {
            if (!normalizedStaffId) {
                return res.status(400).json({ error: "Staff ID is required for radiologist roles" });
            }
            if (!/^\d+$/.test(normalizedStaffId)) {
                return res.status(400).json({ error: "Staff ID must be numeric" });
            }
            const existingStaffId = await User.findOne({ staffId: normalizedStaffId });
            if (existingStaffId) {
                return res.status(400).json({ error: "Staff ID already in use" });
            }
        }
=======
export async function register(req, res) { // Endpoint for user registration
    try { // Extract username, password, and role from the request body
        const { username, password, role } = req.body;
>>>>>>> cfd71478b51c4686f71dbb91118365a21552ab44

        const existing = await User.findOne({ username });
        if (existing) {
            return res.status(400).json({ error: "Username already in use" });
        }

        const createdUser = await User.create({
            username,
            password,
            role: normalizedRole,
            staffId: STAFF_ROLES.includes(normalizedRole) ? normalizedStaffId : undefined
        });
        await linkOrphanScans(createdUser);
        return res.status(201).json({ message: "User created" });
    } catch (err) {
        console.error("Registration error:", err && err.stack ? err.stack : err);
        return res.status(500).json({ error: "Server error" });
    }
}

export async function login(req, res) { // Endpoint for user login
    try {
        const { username, password, staffId } = req.body;
        const normalizedStaffId = normalizeStaffId(staffId);

        const user = await User.findOne({ username });
        if (!user) return res.status(400).json({ error: "Invalid credentials" });
        if (STAFF_ROLES.includes(user.role) && user.staffId !== normalizedStaffId) {
            return res.status(400).json({ error: "Invalid credentials" });
        }

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

<<<<<<< HEAD
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
=======
        return res.json({
            token,
>>>>>>> cfd71478b51c4686f71dbb91118365a21552ab44
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
