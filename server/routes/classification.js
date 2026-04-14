import axios from "axios";
import crypto from "crypto";
import "dotenv/config";
import express from "express";
import FormData from "form-data";
import fs from "fs";
import multer from "multer";
import path from "path";
import PatientAssignment from "../models/PatientAssignment.js";
import Scan from "../models/Scan.js";
import Users from "../models/Users.js";

const router = express.Router();
const FASTAPI_URL = process.env.FASTAPI_URL || "http://localhost:8000";

const uploadDir = path.resolve("uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const scanDir = path.resolve("uploads", "scans");
if (!fs.existsSync(scanDir)) {
  fs.mkdirSync(scanDir, { recursive: true });
}

const allowedExtensions = [".png", ".jpg", ".jpeg", ".tif", ".tiff", ".dcm", ".dicom"];
const allowedMimeTypes = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/tiff",
  "application/dicom",
  "application/dicom+json",
  "application/x-dicom",
  "application/octet-stream",
];

const upload = multer({
  dest: uploadDir,
  limits: {
    fileSize: 25 * 1024 * 1024,
    files: 1,
  },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();

    if (!allowedExtensions.includes(ext)) {
      return cb(new Error("Invalid image. Please upload only X-rays, MRIs, or CT scans."));
    }

    const mimeOk = !file.mimetype || allowedMimeTypes.includes(file.mimetype);

    if (!mimeOk) {
      return cb(new Error("Unsupported file type. Please upload JPG, PNG, TIFF, or DICOM images."));
    }

    cb(null, true);
  },
});

router.post("/", upload.single("image"), async (req, res) => {
  let uploadedPath = null;

  try {
    if (!req.file) {
      return res.status(400).json({ error: "No medical image uploaded" });
    }

    uploadedPath = req.file.path;
    const patientId = (req.body.patientId || "").trim() || "unassigned";

    console.log("Received upload from client:", {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      path: uploadedPath,
      patientId,
    });

    const form = new FormData();
    form.append("image", fs.createReadStream(uploadedPath), {
      filename: req.file.originalname,
      contentType: req.file.mimetype || "application/octet-stream",
    });

    const response = await axios.post(`${FASTAPI_URL}/predict-upload`, form, {
      headers: form.getHeaders(),
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
      validateStatus: () => true,
    });

    console.log("FastAPI response status:", response.status);
    console.log("FastAPI response data:", response.data);

    if (response.status >= 400) {
      return res.status(response.status).json({
        error: response.data?.detail || response.data?.error || "Prediction failed",
      });
    }

    const ext = path.extname(req.file.originalname) || ".png";
    const hash = crypto.randomBytes(8).toString("hex");
    const permName = `${Date.now()}-${hash}${ext}`;
    const permPath = path.join(scanDir, permName);
    fs.copyFileSync(uploadedPath, permPath);

    let patientUser = null;
    if (patientId !== "unassigned") {
      const patient = await Users.findOne({
        username: patientId,
        role: "patient",
      });
      if (patient) patientUser = patient._id;
    }

    const apiData = response.data;
    const modelSlots = [
      { key: "model_a", label: "Fracture model A" },
      { key: "model_b", label: "Fracture model B" },
      { key: "model_c", label: "Fracture model C" },
    ];
    const models = modelSlots.map((slot) => ({
      ...slot,
      filename: apiData.filename,
      predictions: apiData.predictions ?? [],
      num_labels: apiData.num_labels ?? 0,
    }));

    const scan = await Scan.create({
      patientUser,
      patientId,
      uploadedBy: req.user.userId,
      filename: apiData.filename || req.file.originalname,
      imagePath: permPath,
      models,
    });

    if (patientUser) {
      const alreadyAssigned = await PatientAssignment.findOne({
        patientUser,
        radiologist: req.user.userId,
      });
      if (!alreadyAssigned) {
        await PatientAssignment.create({
          patientUser,
          radiologist: req.user.userId,
          assignedBy: req.user.userId,
        });
      }
    }

    return res.json({ ...apiData, scanId: scan._id });
  } catch (err) {
    console.error("Classification route error:", err.response?.data || err.message || err);

    return res.status(err.response?.status || 500).json({
      error:
        err.response?.data?.detail ||
        err.response?.data?.error ||
        err.message ||
        "Classification failed",
    });
  } finally {
    if (uploadedPath && fs.existsSync(uploadedPath)) {
      fs.unlinkSync(uploadedPath);
    }
  }
});

export default router;
