import express from "express";
import { InferenceClient } from "@huggingface/inference";
import "dotenv/config";

const router = express.Router();
const client = new InferenceClient(process.env.HF_API_KEY);

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

    const imageBlob = new Blob([imageBuffer], { type: "image/jpeg" });

    const output = await client.imageClassification({
      data: imageBlob,
      model: "wesleyacheng/dog-breeds-multiclass-image-classification-with-vit",
      provider: "hf-inference",
    });

    const top = Array.isArray(output) && output.length > 0 ? output[0] : null;

    return res.json({
      label: top?.label ?? "Unknown",
      confidence: top?.score ?? 0,
      all: output,
    });
  } catch (err) {
    console.error(err.response?.data || err.message || err);
    return res.status(500).json({ error: "Classification failed" });
  }
});

export default router;