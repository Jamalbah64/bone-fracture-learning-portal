const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

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
