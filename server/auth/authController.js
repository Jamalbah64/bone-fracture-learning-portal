import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/Users.js";


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
        console.error("Registration error:", err);
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

        const token = jwt.sign(
            { userId: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: "2h" }
        );

        return res.json({ token });
    } catch (err) {
        console.error("Login error:", err);
        return res.status(500).json({ error: "Server error" });
    }
}
