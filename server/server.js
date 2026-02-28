
import cors from "cors";
import "dotenv/config";
import express from "express";
import mongoose from "mongoose";

import authRoutes from "./auth/authRoutes.js";
import classificationRoute from "./routes/classification.js";

const app = express();
const PORT = Number(process.env.PORT ?? 4000);

app.use(cors());
app.use(express.json({ limit: "25mb" }));

app.use("/api/classify", classificationRoute);
app.use("/api/auth", authRoutes);

app.get("/health", (req, res) => {
    res.json({ status: "OK", message: "Server running" });
});

async function start() {
    const mongoUri = process.env.MONGO_URI?.trim();
    if (!mongoUri) {
        console.error("Missing MONGO_URI (check server .env location and name)");
        process.exit(1);
    }

    try {

        await mongoose.connect(mongoUri);
        console.log("Connected to MongoDB");

        app.listen(PORT, () => {
            console.log(`Server listening on port ${PORT}`);
        });
    } catch (err) {
        console.error("MongoDB connection error:", err);
        process.exit(1);
    }
}

start();
