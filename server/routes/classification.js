import "dotenv/config";
import express from "express";
import FormData from "form-data";
import fs from "fs";
import multer from "multer";
import path from "path";

const router = express.Router();
const FASTAPI_URL = process.env.FASTAPI_URL || "http://localhost:8000";

const uploadDir = path.resolve("uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const allowedExtensions = [".png", ".jpg", ".jpeg", ".tif", ".tiff", ".dcm", ".dicom"];
const allowedMimeTypes = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/tiff",
  "application/dicom",
  "application/octet-stream",
];

function looksMedicalFilename(name = "") {
  const lower = name.toLowerCase();
  return ["xray", "x-ray", "radiograph", "mri", "ct", "dicom", "scan"].some((term) =>
    lower.includes(term)
  );
}

const upload = multer({
  dest: uploadDir,
  limits: {
    fileSize: 25 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();

    if (!allowedExtensions.includes(ext)) {
      return cb(
        new Error("Invalid image. Please upload only X-rays, MRIs, or CT scans.")
      );
    }

    const mimeOk = !file.mimetype || allowedMimeTypes.includes(file.mimetype);
    const nameOk = looksMedicalFilename(file.originalname);

    if (!mimeOk && !nameOk) {
      return cb(
        new Error("This file does not appear to be a supported medical image.")
      );
    }

    cb(null, true);
  },
});

router.post("/", upload.single("image"), async (req, res) => {
  let uploadedPath = null;

  try {
    const patientId = (req.body.patientId || "").trim();

    if (!patientId) {
      if (req.file?.path) fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: "Missing patient ID" });
    }

    if (!req.file) {
      return res.status(400).json({ error: "No medical image uploaded" });
    }

    uploadedPath = req.file.path;

    const form = new FormData();
    form.append("patientId", patientId);
    form.append("image", fs.createReadStream(uploadedPath), req.file.originalname);

    const response = await fetch(`${FASTAPI_URL}/predict-upload`, {
      method: "POST",
      headers: form.getHeaders(),
      body: form,
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: data.detail || data.error || "Prediction failed",
      });
    }

    return res.json(data);
  } catch (err) {
    console.error(err.message || err);
    return res.status(500).json({
      error: err.message || "Classification failed",
    });
  } finally {
    if (uploadedPath && fs.existsSync(uploadedPath)) {
      fs.unlinkSync(uploadedPath);
    }
  }
});

export default router;
