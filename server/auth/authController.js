import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/index.js";

const ROLE_ALIASES = {
    clinician: "radiologist",
    admin: "head_radiologist",
};

const ALLOWED_ROLES = ["patient", "radiologist", "head_radiologist"];
const STAFF_ROLES = ["radiologist", "head_radiologist"];

function normalizeRole(role) {
    if (!role) return "patient";
    return ROLE_ALIASES[role] || role;
}

function normalizeStaffId(staffId) {
    return String(staffId ?? "").trim();
}

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

        const existing = await User.findOne({ username });
        if (existing) {
            return res.status(400).json({ error: "Username already in use" });
        }

        await User.create({
            username,
            password,
            role: normalizedRole,
            staffId: STAFF_ROLES.includes(normalizedRole) ? normalizedStaffId : undefined
        });
        return res.status(201).json({ message: "User created" });
    } catch (err) {
        console.error("Registration error:", err && err.stack ? err.stack : err);
        return res.status(500).json({ error: "Server error" });
    }
}

export async function login(req, res) {
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

        const token = jwt.sign(
            { userId: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: "2h" }
        );

        return res.json({ token });
    } catch (err) {
        console.error("Login error:", err && err.stack ? err.stack : err);
        return res.status(500).json({ error: "Server error" });
    }
}

export async function me(req, res) {
    try {
        // auth middleware sets req.user from the token
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const user = await User.findOne({ _id: userId });
        if (!user) return res.status(404).json({ error: 'User not found' });

        return res.json({ id: user._id, username: user.username, role: user.role });
    } catch (err) {
        console.error("Me endpoint error:", err && err.stack ? err.stack : err);
        return res.status(500).json({ error: "Server error" });
    }
}
