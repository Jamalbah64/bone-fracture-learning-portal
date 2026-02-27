//This is the auth controller for handling user authentication and authorization
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

// Registers a new user
async function register(req, res) {
    try {
        const { username, password, role } = req.body;
        // Check if user with the same username already exists
        const existing = await User.findOne({ username });
        if (existing) {
            return res.status(400).json({ error: 'Username already in use' });
        }
        await User.create({ username, password, role });
        res.status(201).json({ message: 'User created' });
    } catch (err) {
        console.error('Registration error:', err);
        res.status(500).json({ error: 'Server error' });
    }
}
// Logs in a user and returns a JWT token
async function login(req, res) {
    try {
        // Validate credentials
        const { username, password } = req.body;
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }
        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }
        // Sign user data into a JWT token
        const token = jwt.sign(
            { userId: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '2h' },
        );
        res.json({ token });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Server error' });
    }
}
module.exports = { register, login };
