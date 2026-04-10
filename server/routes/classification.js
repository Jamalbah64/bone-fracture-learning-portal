import axios from "axios";
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

    console.log("Received upload from client:", {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      path: uploadedPath,
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

    return res.json(response.data);
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
