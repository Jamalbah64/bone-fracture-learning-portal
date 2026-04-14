import express from "express";
import mongoose from "mongoose";
import SharedItem from "../models/SharedItem.js";
import Scan from "../models/Scan.js";
import Users from "../models/Users.js";
import Notification from "../models/notification.js";

const router = express.Router();

router.get("/", async (req, res) => {
    try {
        const { userId } = req.user;
        const { direction } = req.query;

        let filter;
        if (direction === "sent") {
            filter = { sharedBy: userId };
        } else {
            filter = { sharedWith: userId };
        }

        const items = await SharedItem.find(filter)
            .populate("sharedBy", "username role")
            .populate("sharedWith", "username role")
            .sort({ createdAt: -1 })
            .lean();

        const scanIds = items
            .filter((i) => i.resourceType === "scan")
            .map((i) => i.resourceId);

        const scans = await Scan.find({ _id: { $in: scanIds } })
            .populate("patientUser", "username")
            .populate("uploadedBy", "username")
            .lean();
        const scanMap = Object.fromEntries(
            scans.map((s) => [s._id.toString(), s])
        );

        const enriched = items.map((item) => ({
            ...item,
            resource:
                item.resourceType === "scan"
                    ? scanMap[item.resourceId.toString()] || null
                    : null,
        }));

        return res.json(enriched);
    } catch (err) {
        console.error("GET /api/shares error:", err);
        return res.status(500).json({ error: "Server error" });
    }
});

router.post("/", async (req, res) => {
    try {
        const { userId, role } = req.user;
        const { resourceType, resourceId, sharedWithUsername, message } = req.body;

        if (resourceType !== "scan") {
            return res.status(400).json({ error: "resourceType must be 'scan'" });
        }
        if (!mongoose.Types.ObjectId.isValid(resourceId)) {
            return res.status(400).json({ error: "Invalid resourceId" });
        }
        if (!sharedWithUsername) {
            return res.status(400).json({ error: "sharedWithUsername is required" });
        }

        const scan = await Scan.findById(resourceId).lean();
        if (!scan) return res.status(404).json({ error: "Scan not found" });

        const isOwner = scan.uploadedBy.toString() === userId;
        const isHead = role === "head_radiologist";
        if (!isOwner && !isHead) {
            return res.status(403).json({
                error: "You can only share scans you uploaded (or be a head radiologist)",
            });
        }

        const targetUser = await Users.findOne({ username: sharedWithUsername });
        if (!targetUser) {
            return res.status(404).json({ error: "User not found" });
        }
        if (targetUser._id.toString() === userId) {
            return res.status(400).json({ error: "Cannot share with yourself" });
        }

        const existing = await SharedItem.findOne({
            resourceType: "scan",
            resourceId: scan._id,
            sharedWith: targetUser._id,
        });
        if (existing) {
            return res.json({ message: "Already shared", share: existing });
        }

        const share = await SharedItem.create({
            resourceType: "scan",
            resourceId: scan._id,
            sharedBy: userId,
            sharedWith: targetUser._id,
            message: message || "",
        });

        const sharingUser = await Users.findById(userId).select("username").lean();
        await Notification.create({
            user: targetUser._id,
            message: `A scan has been shared with you by ${sharingUser?.username || "a colleague"}`,
            type: "info",
        });

        return res.status(201).json(share);
    } catch (err) {
        console.error("POST /api/shares error:", err);
        return res.status(500).json({ error: "Server error" });
    }
});

router.delete("/:id", async (req, res) => {
    try {
        const { userId, role } = req.user;

        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ error: "Invalid share ID" });
        }

        const share = await SharedItem.findById(req.params.id);
        if (!share) return res.status(404).json({ error: "Share not found" });

        const canRevoke =
            share.sharedBy.toString() === userId ||
            role === "head_radiologist";
        if (!canRevoke) {
            return res.status(403).json({ error: "Forbidden" });
        }

        await share.deleteOne();
        return res.json({ message: "Share revoked" });
    } catch (err) {
        console.error("DELETE /api/shares/:id error:", err);
        return res.status(500).json({ error: "Server error" });
    }
});

export default router;
