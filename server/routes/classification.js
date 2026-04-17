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
  // Main classification route
  // Accepts an uploaded image, validates it, forwards to FastAPI predict endpoint,
  // and returns the prediction payload. Optional `model` can be provided either
  // as a multipart form field or as a query parameter and will be forwarded.

  // Ensure a file was uploaded
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  // Validate that this looks like a supported medical image
  const validation = validateMedicalImage(req.file);
  if (!validation.valid) {
    fs.unlink(req.file.path, (err) => { if (err) console.error("Failed to delete invalid file:", err); });
    return res.status(400).json({ error: validation.reason });
  }

  // Determine if a specific model was requested (form field or query)
  const selectedModel = (req.body && req.body.model) || req.query.model || undefined;
  const modelQuery = selectedModel ? `?model=${encodeURIComponent(selectedModel)}` : "";
  const url = `${FASTAPI_URL}/predict-upload${modelQuery}`;

  // Prepare form data to forward the file to FastAPI
  const fileBuffer = fs.readFileSync(req.file.path);
  const formData = new FormData();
  const blob = new Blob([fileBuffer], { type: req.file.mimetype || 'application/octet-stream' });
  formData.append('image', blob, req.file.originalname);

  let fastapiResponse;
  let fastapiData = null;
  try {
    fastapiResponse = await fetch(url, { method: 'POST', body: formData });

    const contentType = fastapiResponse.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      fastapiData = await fastapiResponse.json();
    } else {
      const raw = await fastapiResponse.text();
      console.error('FastAPI returned non-JSON response:', raw.slice(0, 1000));
      return res.status(502).json({ error: 'FastAPI returned non-JSON response', details: raw.slice(0, 1000) });
    }

    if (!fastapiResponse.ok) {
      return res.status(fastapiResponse.status).json({ error: fastapiData.detail || fastapiData.error || 'Prediction failed' });
    }

    // Return FastAPI payload plus original filename
    return res.json({ ...fastapiData, filename: req.file.originalname });
  } catch (err) {
    console.error('Classification route error when calling FastAPI:', err);
    return res.status(500).json({ error: 'Classification failed', details: err.message || String(err) });
  } finally {
    // Always attempt to remove the temporary uploaded file
    fs.unlink(req.file.path, (err) => { if (err) console.error('Failed to delete uploaded file after processing:', err); });
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
