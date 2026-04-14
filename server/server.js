import cookieParser from "cookie-parser";
import cors from "cors";
import "dotenv/config";
import express from "express";
import mongoose from "mongoose";

import authRoutes from "./auth/authRoutes.js";
import authMiddleware from "./auth/middleware/auth.js";
import requireRole from "./auth/middleware/requireRole.js";
import classificationRoute from "./routes/classification.js";
import scansRoute from "./routes/scans.js";
import patientsRoute from "./routes/patients.js";
import assignmentsRoute from "./routes/assignments.js";
import sharesRoute from "./routes/shares.js";

const app = express();
const PORT = Number(process.env.PORT ?? 4000);

app.use(
    cors({
        origin: process.env.CLIENT_ORIGIN || "http://localhost:3000",
        credentials: true,
    })
);

app.use(cookieParser());
app.use(express.json({ limit: "25mb" }));

app.use("/api/auth", authRoutes);

app.use(
    "/api/classify",
    authMiddleware,
    requireRole("radiologist", "head_radiologist"),
    classificationRoute
);

app.use("/api/scans", authMiddleware, scansRoute);
app.use("/api/patients", authMiddleware, patientsRoute);
app.use(
    "/api/assignments",
    authMiddleware,
    requireRole("radiologist", "head_radiologist", "patient"),
    assignmentsRoute
);
app.use("/api/shares", authMiddleware, sharesRoute);

app.get(
    "/api/patient-portal",
    authMiddleware,
    requireRole("patient", "clinician", "admin"),
    (req, res) => {
        res.json({ message: "Patient portal access granted", user: req.user });
    }
);

app.get(
    "/api/clinician",
    authMiddleware,
    requireRole("clinician", "admin"),
    (req, res) => {
        res.json({ message: "Clinician access granted", user: req.user });
    }
);

app.get(
    "/api/admin",
    authMiddleware,
    requireRole("admin"),
    (req, res) => {
        res.json({ message: "Admin access granted", user: req.user });
    }
);

app.get("/health", (req, res) => {
    res.json({ status: "OK", message: "Server running" });
});

async function start() {
    const mongoUri = process.env.MONGO_URI?.trim();

    if (!mongoUri) {
        console.error("Missing MONGO_URI");
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
