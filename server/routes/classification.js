import express from "express";
import axios from "axios";
import "dotenv/config";

const router = express.Router();

function decodeBase64Image(input) {
  if (typeof input !== "string" || input.length === 0) return null;

  // Supports either raw base64 or a full data URL.
  const base64 = input.includes("base64,") ? input.split("base64,")[1] : input;

  try {
    return Buffer.from(base64, "base64");
  } catch {
    return null;
  }
}

router.post("/", async (req, res) => {
  try {
    const imageBase64 = req.body?.imageBase64 ?? req.body?.image;
    const imageBuffer = decodeBase64Image(imageBase64);

    if (!imageBuffer) {
      return res.status(400).json({ error: "Missing/invalid imageBase64" });
    }

    const response = await axios.post(
      "https://api-inference.huggingface.co/models/Anwarkh1/Skin_Cancer-Image_Classification",
      imageBuffer,
      {
        headers: {
          Authorization: `Bearer ${process.env.HF_TOKEN}`,
          "Content-Type": "application/octet-stream",
        },
      }
    );

    return res.json(response.data);
  } catch (err) {
    console.error(err.response?.data || err.message);
    return res.status(500).json({ error: "Classification failed" });
  }
});

export default router;