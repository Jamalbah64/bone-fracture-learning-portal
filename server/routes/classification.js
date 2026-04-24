import "dotenv/config";
import express from "express";
import fs from "fs";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import PatientAssignment from "../models/PatientAssignment.js";
import Scan from "../models/scan.js";
import Users from "../models/Users.js";
import { validateMedicalImage } from "../utils/medicalImageValidator.js";

const router = express.Router();
const FASTAPI_URL = process.env.FASTAPI_URL || "http://localhost:8000";

// Get __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Setup multer for file uploads
const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  // Save files to the uploads directory with a unique name
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },

  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    cb(null, `${name}-${timestamp}${ext}`);
  },
});

const upload = multer({
  // Configure multer with storage and file size limit
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
});

// Middleware to handle multer errors
const handleMulterErrors = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    console.error("Multer error:", err.message);
    return res.status(400).json({ error: `File upload error: ${err.message}` });
  }

  if (err) {
    console.error("Unexpected upload error:", err.message);
    return res.status(400).json({ error: `Upload error: ${err.message}` });
  }

  next();
};

function buildModelRunsFromFastApi(fastapiData) {
  const results = fastapiData?.results || {};

  return ["model_a", "model_b", "model_u"].map((modelKey) => {
    const predictions = Array.isArray(results[modelKey])
      ? results[modelKey]
      : [];

    return {
      key: modelKey,
      label: modelKey,
      filename:
        modelKey === "model_b"
          ? fastapiData?.projection2_filename
          : fastapiData?.projection1_filename,
      predictions,
      num_labels: predictions.length,
    };
  });
}

// Main upload route
// Accepts one or two images and sends them to the api for classification
router.post(
  "/",
  upload.fields([
    { name: "projection1", maxCount: 1 },
    { name: "projection2", maxCount: 1 },
  ]),
  handleMulterErrors,
  async (req, res) => {
    const projection1 = req.files?.projection1?.[0] || null;
    const projection2 = req.files?.projection2?.[0] || null;

    if (!projection1) {
      return res.status(400).json({
        error: "Please upload at least one image for Projection 1.",
      });
    }

    const projection1Validation = validateMedicalImage(projection1);

    if (!projection1Validation.valid) {
      fs.unlink(projection1.path, () => { });
      return res.status(400).json({ error: projection1Validation.reason });
    }

    if (projection2) {
      const projection2Validation = validateMedicalImage(projection2);

      if (!projection2Validation.valid) {
        fs.unlink(projection1.path, () => { });
        fs.unlink(projection2.path, () => { });
        return res.status(400).json({ error: projection2Validation.reason });
      }
    }

    const patientUsername = String(req.body?.patientId || "").trim();

    try {
      const formData = new FormData();

      const projection1Buffer = fs.readFileSync(projection1.path);
      const projection1Blob = new Blob([projection1Buffer], {
        type: projection1.mimetype || "application/octet-stream",
      });

      formData.append("projection1", projection1Blob, projection1.originalname);

      if (projection2) {
        const projection2Buffer = fs.readFileSync(projection2.path);
        const projection2Blob = new Blob([projection2Buffer], {
          type: projection2.mimetype || "application/octet-stream",
        });

        formData.append("projection2", projection2Blob, projection2.originalname);
      }

      const fastapiResponse = await fetch(
        `${FASTAPI_URL}/predict-with-visualization`,
        {
          method: "POST",
          body: formData,
        }
      );

      const contentType = fastapiResponse.headers.get("content-type") || "";

      if (!contentType.includes("application/json")) {
        const raw = await fastapiResponse.text();

        console.error("FastAPI returned non-JSON response:", raw.slice(0, 1000));

        return res.status(502).json({
          error: "FastAPI returned non-JSON response",
          details: raw.slice(0, 1000),
        });
      }

      const fastapiData = await fastapiResponse.json();

      if (!fastapiResponse.ok) {
        return res.status(fastapiResponse.status).json({
          error:
            fastapiData.detail ||
            fastapiData.error ||
            "Prediction failed in FastAPI.",
        });
      }

      let patientUser = null;

      if (patientUsername) {
        patientUser = await Users.findOne({
          username: patientUsername,
          role: "patient",
        })
          .select("_id")
          .lean();
      }

      let assignmentCreated = false;

      if (patientUser?._id && req.user?.userId) {
        const existingAssignment = await PatientAssignment.findOne({
          patientUser: patientUser._id,
          radiologist: req.user.userId,
        })
          .select("_id")
          .lean();

        if (!existingAssignment) {
          await PatientAssignment.create({
            patientUser: patientUser._id,
            radiologist: req.user.userId,
            assignedBy: req.user.userId,
          });

          assignmentCreated = true;
        }
      }

      const modelRuns = buildModelRunsFromFastApi(fastapiData);

      const scan = await Scan.create({
        patientUser: patientUser?._id || null,
        patientId: patientUsername || "unassigned",
        uploadedBy: req.user.userId,
        filename: projection1.originalname,
        imagePath: projection1.path,
        projection2Filename: projection2?.originalname || null,
        projection2ImagePath: projection2?.path || null,
        models: modelRuns,
      });

      return res.json({
        ...fastapiData,
        scanId: scan._id,
        patientId: patientUsername || "unassigned",
        patientLinked: Boolean(patientUser?._id),
        assignmentCreated,
      });
    } catch (err) {
      console.error("Classification route error:", err);

      return res.status(500).json({
        error: "Classification failed",
        details: err.message || String(err),
      });
    }
  }
);

export default router;
