import express from "express";
import Users from "../models/Users.js";
import PatientAssignment from "../models/PatientAssignment.js";
import Scan from "../models/Scan.js";

const router = express.Router();

router.get("/", async (req, res) => {
    try {
        const { userId, role } = req.user;

        if (role === "patient") {
            const me = await Users.findById(userId).select("username role").lean();
            if (!me) return res.json([]);
            const scanCount = await Scan.countDocuments({ patientUser: userId });
            return res.json([
                { _id: me._id, username: me.username, role: me.role, scanCount },
            ]);
        }

        if (role === "head_radiologist") {
            const patients = await Users.find({ role: "patient" })
                .select("username role")
                .lean();

            const counts = await Scan.aggregate([
                { $match: { patientUser: { $in: patients.map((p) => p._id) } } },
                { $group: { _id: "$patientUser", count: { $sum: 1 } } },
            ]);
            const countMap = Object.fromEntries(
                counts.map((c) => [c._id.toString(), c.count])
            );

            return res.json(
                patients.map((p) => ({
                    ...p,
                    scanCount: countMap[p._id.toString()] || 0,
                }))
            );
        }

        if (role === "radiologist") {
            const assignments = await PatientAssignment.find({
                radiologist: userId,
            }).lean();
            const assignedIds = assignments.map((a) => a.patientUser);

            const uploadedScans = await Scan.distinct("patientUser", {
                uploadedBy: userId,
                patientUser: { $ne: null },
            });

            const allIds = [
                ...new Set([
                    ...assignedIds.map(String),
                    ...uploadedScans.map(String),
                ]),
            ];

            if (allIds.length === 0) return res.json([]);

            const patients = await Users.find({
                _id: { $in: allIds },
                role: "patient",
            })
                .select("username role")
                .lean();

            const counts = await Scan.aggregate([
                { $match: { patientUser: { $in: patients.map((p) => p._id) } } },
                { $group: { _id: "$patientUser", count: { $sum: 1 } } },
            ]);
            const countMap = Object.fromEntries(
                counts.map((c) => [c._id.toString(), c.count])
            );

            return res.json(
                patients.map((p) => ({
                    ...p,
                    scanCount: countMap[p._id.toString()] || 0,
                }))
            );
        }

        return res.json([]);
    } catch (err) {
        console.error("GET /api/patients error:", err);
        return res.status(500).json({ error: "Server error" });
    }
});

router.get("/search", async (req, res) => {
    try {
        const { q } = req.query;
        if (!q || q.length < 1) return res.json([]);

        const { role } = req.user;
        if (role === "patient") return res.status(403).json({ error: "Forbidden" });

        const users = await Users.find({
            username: { $regex: q, $options: "i" },
        })
            .select("username role")
            .limit(20)
            .lean();

        return res.json(users);
    } catch (err) {
        console.error("GET /api/patients/search error:", err);
        return res.status(500).json({ error: "Server error" });
    }
});

export default router;
