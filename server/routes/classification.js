const express = require("express");
const axios = require("axios");
const router = express.Router();
require("dotenv").config();

router.post("/", async (req, res) => {
  try {
    const image = req.body.image; 

    const response = await axios.post(
      "https://api-inference.huggingface.co/models/Anwarkh1/Skin_Cancer-Image_Classification",
      image,
      {
        headers: {
          Authorization: `Bearer ${process.env.HF_TOKEN}`,
          "Content-Type": "application/octet-stream",
        },
      }
    );

    res.json(response.data);
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ error: "Classification failed" });
  }
});

module.exports = router;