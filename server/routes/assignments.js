import express from "express";
import mongoose from "mongoose";
import PatientAssignment from "../models/PatientAssignment.js";
import Users from "../models/Users.js";
import Notification from "../models/notification.js";

const router = express.Router();

router.get("/", async (req, res) => {
    try {
        const { userId, role } = req.user;
        let filter = {};

        if (role === "radiologist") {
            filter.radiologist = userId;
        } else if (role === "patient") {
            filter.patientUser = userId;
        }

        const assignments = await PatientAssignment.find(filter)
            .populate("patientUser", "username role")
            .populate("radiologist", "username role staffId")
            .populate("assignedBy", "username")
            .sort({ createdAt: -1 })
            .lean();

        return res.json(assignments);
    } catch (err) {
        console.error("GET /api/assignments error:", err);
        return res.status(500).json({ error: "Server error" });
    }
});

router.post("/", async (req, res) => {
    try {
        const { userId, role } = req.user;

        if (role !== "head_radiologist" && role !== "radiologist") {
            return res.status(403).json({ error: "Forbidden" });
        }

        const { patientUsername, radiologistId } = req.body;

        if (!patientUsername) {
            return res.status(400).json({ error: "patientUsername is required" });
        }

        const patient = await Users.findOne({
            username: patientUsername,
            role: "patient",
        });
        if (!patient) {
            return res.status(404).json({ error: "Patient not found" });
        }

        let targetRadiologistId;

        if (role === "head_radiologist" && radiologistId) {
            if (!mongoose.Types.ObjectId.isValid(radiologistId)) {
                return res.status(400).json({ error: "Invalid radiologist ID" });
            }
            const rad = await Users.findOne({
                _id: radiologistId,
                role: { $in: ["radiologist", "head_radiologist"] },
            });
            if (!rad) {
                return res.status(404).json({ error: "Radiologist not found" });
            }
            targetRadiologistId = rad._id;
        } else {
            targetRadiologistId = userId;
        }

        const existing = await PatientAssignment.findOne({
            patientUser: patient._id,
            radiologist: targetRadiologistId,
        });
        if (existing) {
            return res.json({ message: "Assignment already exists", assignment: existing });
        }

        const assignment = await PatientAssignment.create({
            patientUser: patient._id,
            radiologist: targetRadiologistId,
            assignedBy: userId,
        });

        await Notification.create({
            user: targetRadiologistId,
            message: `You have been assigned patient "${patient.username}"`,
            type: "assignment",
        });

        const populated = await PatientAssignment.findById(assignment._id)
            .populate("patientUser", "username role")
            .populate("radiologist", "username role staffId")
            .populate("assignedBy", "username")
            .lean();

        return res.status(201).json(populated);
    } catch (err) {
        console.error("POST /api/assignments error:", err);
        return res.status(500).json({ error: "Server error" });
    }
});

router.delete("/:id", async (req, res) => {
    try {
        const { role } = req.user;
        if (role !== "head_radiologist") {
            return res.status(403).json({ error: "Only head radiologists can remove assignments" });
        }

        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ error: "Invalid assignment ID" });
        }

        const deleted = await PatientAssignment.findByIdAndDelete(req.params.id);
        if (!deleted) {
            return res.status(404).json({ error: "Assignment not found" });
        }
        return res.json({ message: "Assignment removed" });
    } catch (err) {
        console.error("DELETE /api/assignments/:id error:", err);
        return res.status(500).json({ error: "Server error" });
    }
});

export default router;
