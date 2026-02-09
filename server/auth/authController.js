//This is the auth controller for handling user authentication and authorization
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

// Registers a new user
async function register(req, res) {
    const { email, password, role } = req.body;
    const user = await User.create({ email, password, role });
    res.status(201).json({ message: 'User created' });
}
// Logs in a user and returns a JWT token
async function login(req, res) {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: 'Invalid credentials' });
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ error: 'Invalid credentials' });
    const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '2h' });
    res.json({ token });
}
module.exports = { register, login };
