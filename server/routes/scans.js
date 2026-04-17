import express from "express";
import mongoose from "mongoose";
import Scan from "../models/Scan.js";
import SharedItem from "../models/SharedItem.js";
import Users from "../models/Users.js";
import loadAccess from "../auth/middleware/accessControl.js";

const router = express.Router();

function canSee(scan, userId, role, accessiblePatients, username) {
    if (role === "head_radiologist") return true;
    if (role === "patient") {
        if (scan.patientUser && scan.patientUser.toString() === userId) return true;
        if (!scan.patientUser && username && scan.patientId === username) return true;
        return false;
    }
    if (role === "radiologist") {
        if (scan.uploadedBy.toString() === userId) return true;
        if (
            accessiblePatients &&
            scan.patientUser &&
            accessiblePatients.some(
                (id) => id.toString() === scan.patientUser.toString()
            )
        )
            return true;
    }
    return false;
}

router.get("/", loadAccess, async (req, res) => {
    try {
        const { userId, role } = req.user;
        const { patientId } = req.query;
        const filter = {};

        if (patientId) filter.patientId = patientId;

        if (role === "patient") {
            const me = await Users.findById(userId).select("username").lean();
            filter.$or = [
                { patientUser: userId },
                ...(me?.username
                    ? [{ patientUser: null, patientId: me.username }]
                    : []),
            ];
        } else if (role === "radiologist") {
            const accessible = req.accessiblePatients || [];
            const sharedScans = await SharedItem.find({
                sharedWith: userId,
                resourceType: "scan",
            })
                .select("resourceId")
                .lean();
            const sharedIds = sharedScans.map((s) => s.resourceId);

            filter.$or = [
                { uploadedBy: userId },
                ...(accessible.length
                    ? [{ patientUser: { $in: accessible } }]
                    : []),
                ...(sharedIds.length ? [{ _id: { $in: sharedIds } }] : []),
            ];
            if (filter.$or.length === 0) filter.$or = [{ uploadedBy: userId }];
        }

        const scans = await Scan.find(filter)
            .sort({ createdAt: -1 })
            .populate("uploadedBy", "username")
            .populate("patientUser", "username")
            .lean();

        return res.json(scans);
    } catch (err) {
        console.error("GET /api/scans error:", err);
        return res.status(500).json({ error: "Server error" });
    }
});

async function getUsernameForPatient(role, userId) {
    if (role !== "patient") return null;
    const me = await Users.findById(userId).select("username").lean();
    return me?.username || null;
}

router.get("/:id", loadAccess, async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ error: "Invalid scan ID" });
        }

        const scan = await Scan.findById(req.params.id)
            .populate("uploadedBy", "username")
            .populate("patientUser", "username")
            .lean();

        if (!scan) return res.status(404).json({ error: "Scan not found" });

        const { userId, role } = req.user;

        if (role !== "head_radiologist") {
            const shared = await SharedItem.findOne({
                resourceType: "scan",
                resourceId: scan._id,
                sharedWith: userId,
            }).lean();

            const username = await getUsernameForPatient(role, userId);
            if (
                !shared &&
                !canSee(scan, userId, role, req.accessiblePatients, username)
            ) {
                return res.status(403).json({ error: "Forbidden" });
            }
        }

        return res.json(scan);
    } catch (err) {
        console.error("GET /api/scans/:id error:", err);
        return res.status(500).json({ error: "Server error" });
    }
});

router.get("/:id/image", loadAccess, async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ error: "Invalid scan ID" });
        }

        const scan = await Scan.findById(req.params.id).lean();
        if (!scan) return res.status(404).json({ error: "Scan not found" });

        const { userId, role } = req.user;
        if (role !== "head_radiologist") {
            const shared = await SharedItem.findOne({
                resourceType: "scan",
                resourceId: scan._id,
                sharedWith: userId,
            }).lean();
            const username = await getUsernameForPatient(role, userId);
            if (
                !shared &&
                !canSee(scan, userId, role, req.accessiblePatients, username)
            ) {
                return res.status(403).json({ error: "Forbidden" });
            }
        }

        const { default: path } = await import("path");
        const { default: fs } = await import("fs");
        const abs = path.resolve(scan.imagePath);
        if (!fs.existsSync(abs)) {
            return res.status(404).json({ error: "Image file not found" });
        }

        return res.sendFile(abs);
    } catch (err) {
        console.error("GET /api/scans/:id/image error:", err);
        return res.status(500).json({ error: "Server error" });
    }
});

export default router;
