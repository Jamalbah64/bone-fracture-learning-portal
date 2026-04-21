import express from "express";
import Users from "../models/Users.js";
import PatientAssignment from "../models/PatientAssignment.js";
import Scan from "../models/scan.js";

const router = express.Router();

// Builds entries for scans that reference a patient username (patientId string)
// but have no linked patientUser record yet — e.g. scans uploaded for a patient
// whose account hasn't been registered. Without this, such scans silently
// disappear from the Analytics/Timeline patient lists even though they exist.
async function findOrphanPatients(orphanFilter) {
    const rows = await Scan.aggregate([
        { $match: { ...orphanFilter, patientUser: null, patientId: { $nin: ["", "unassigned"] } } },
        { $group: { _id: "$patientId", count: { $sum: 1 } } },
    ]);
    return rows.map((r) => ({
        _id: `orphan:${r._id}`,
        username: r._id,
        role: "patient",
        scanCount: r.count,
        unregistered: true,
    }));
}

router.get("/", async (req, res) => {
    try {
        const { userId, role } = req.user;

        if (role === "patient") {
            const me = await Users.findById(userId).select("username role").lean();
            if (!me) return res.json([]);
            const scanCount = await Scan.countDocuments({
                $or: [
                    { patientUser: userId },
                    { patientUser: null, patientId: me.username },
                ],
            });
            if (scanCount === 0) return res.json([]);
            return res.json([
                { _id: me._id, username: me.username, role: me.role, scanCount },
            ]);
        }

        if (role === "head_radiologist") {
            const patientIdsWithScans = await Scan.distinct("patientUser", {
                patientUser: { $ne: null },
            });

            const patients = patientIdsWithScans.length
                ? await Users.find({
                      _id: { $in: patientIdsWithScans },
                      role: "patient",
                  })
                      .select("username role")
                      .lean()
                : [];

            const counts = patients.length
                ? await Scan.aggregate([
                      { $match: { patientUser: { $in: patients.map((p) => p._id) } } },
                      { $group: { _id: "$patientUser", count: { $sum: 1 } } },
                  ])
                : [];
            const countMap = Object.fromEntries(
                counts.map((c) => [c._id.toString(), c.count])
            );

            const registered = patients.map((p) => ({
                ...p,
                scanCount: countMap[p._id.toString()] || 0,
            }));

            const orphans = await findOrphanPatients({});
            return res.json([...registered, ...orphans]);
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

            const patients = allIds.length
                ? await Users.find({
                      _id: { $in: allIds },
                      role: "patient",
                  })
                      .select("username role")
                      .lean()
                : [];

            const counts = patients.length
                ? await Scan.aggregate([
                      { $match: { patientUser: { $in: patients.map((p) => p._id) } } },
                      { $group: { _id: "$patientUser", count: { $sum: 1 } } },
                  ])
                : [];
            const countMap = Object.fromEntries(
                counts.map((c) => [c._id.toString(), c.count])
            );

            const registered = patients
                .map((p) => ({
                    ...p,
                    scanCount: countMap[p._id.toString()] || 0,
                }))
                .filter((p) => p.scanCount > 0);

            const orphans = await findOrphanPatients({ uploadedBy: userId });
            return res.json([...registered, ...orphans]);
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
