import "dotenv/config";
import express from "express";

const router = express.Router();
const FASTAPI_URL = process.env.FASTAPI_URL || "http://localhost:8000";

router.post("/", async (req, res) => {
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

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: data.detail || "Prediction failed",
      });
    }

    return res.json(data);
  } catch (err) {
    console.error(err.message || err);
    return res.status(500).json({ error: "Classification failed" });
  }
});

export default router;
