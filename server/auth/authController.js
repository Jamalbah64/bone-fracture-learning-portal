import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/index.js";


export async function register(req, res) { // Endpoint for user registration
    try { // Extract username, password, and role from the request body
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

export async function login(req, res) { // Endpoint for user login
    try {
        const { username, password } = req.body;

        const user = await User.findOne({ username });
        if (!user) return res.status(400).json({ error: "Invalid credentials" });

        const match = await bcrypt.compare(password, user.password);
        if (!match) return res.status(400).json({ error: "Invalid credentials" });

        const token = jwt.sign(
            { userId: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: "2h" }
        );

        return res.json({
            token,
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
