import "dotenv/config";
import express from "express";
import fs from "fs";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
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

const storage = multer.diskStorage({ // Save files to the uploads directory with a unique name
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

const upload = multer({ // Configure multer with storage and file size limit
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
});

// Middleware to handle multer errors
const handleMulterErrors = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    console.error("Multer error:", err.message);
    return res.status(400).json({ error: `File upload error: ${err.message}` });
  } else if (err) {
    console.error("Unexpected error:", err.message);
    return res.status(400).json({ error: `Upload error: ${err.message}` });
  }
  next();
};

// Route to handle file upload and classification
router.post("/", upload.single("file"), handleMulterErrors, async (req, res) => {
  try {
    // Validate that a file was uploaded
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // Validate that it's a medical image
    const validation = validateMedicalImage(req.file);
    if (!validation.valid) {
      // Clean up the uploaded file
      fs.unlink(req.file.path, (err) => {
        if (err) console.error("Failed to delete invalid file:", err);
      });
      return res.status(400).json({ error: validation.reason });
    }

    // Read the file and send it to FastAPI
    const fileBuffer = fs.readFileSync(req.file.path);

    // Create FormData with the file using native Node.js FormData
    const formData = new FormData();
    const blob = new Blob([fileBuffer], { type: req.file.mimetype || 'application/octet-stream' });
    formData.append('image', blob, req.file.originalname);

    // Call FastAPI for prediction with the actual image file
    const response = await fetch(`${FASTAPI_URL}/predict-upload`, {
      method: "POST",
      body: formData,
    });

    const contentType = response.headers.get("content-type") || "";
    const data = await response.json();

    console.log("FastAPI Response Status:", response.status);
    console.log("FastAPI Response Data:", data);

    if (!response.ok) {
      return res.status(response.status).json({
        error: data.detail || data.error || "Prediction failed",
      });
    }

    // Return the results with original filename
    return res.json({
      ...data,
      filename: req.file.originalname,
      savedPath: req.file.path,
    });
  } catch (err) {
    console.error("Classification route error:", err);
    return res.status(500).json({
      error: "Classification failed",
      details: err.message || String(err),
    });
  }
});

// Legacy route for filestem-based classification (kept for backward compatibility)
router.post("/legacy", async (req, res) => {
  try {
    const { filestem } = req.body;

    if (!filestem || typeof filestem !== "string") {
      return res.status(400).json({ error: "Missing or invalid filestem" });
    }

    const response = await fetch(`${FASTAPI_URL}/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filestem: filestem.trim() }),
    });

    const contentType = response.headers.get("content-type") || "";

    if (!contentType.includes("application/json")) {
      const raw = await response.text();
      return res.status(502).json({
        error: "FastAPI returned non-JSON content",
        details: raw.slice(0, 300),
      });
    }

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: data.detail || data.error || "Prediction failed",
      });
    }

    return res.json(data);
  } catch (err) {
    console.error("Classification route error:", err);
    return res.status(500).json({
      error: "Classification failed",
      details: err.message || String(err),
    });
  }
});

export default router;
