// Main server file which bears the responsibility of connecting to the database and starting the Express server. 
// It also includes a simple health check endpoint for status monitoring.

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Import auth routes and middleware
app.use('api/auth', authRoutes);

// Health check endpoint
app.get('/', (req, res) => {
    res.json({ message: 'Bone Fracture Portal API running' });
});

// Connects to MongoDB and starts server
async function start() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');
        app.listen(process.env.PORT || 4000, () => {
            console.log('Server listening on port', process.env.PORT || 4000);
        });
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
start();
