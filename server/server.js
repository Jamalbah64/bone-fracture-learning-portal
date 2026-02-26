import express from "express";
import cors from "cors";
import classificationRoute from "./routes/classification.js";

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json({ limit: "25mb" }));

app.use("/api/classify", classificationRoute);

app.get("/health", (req, res) => {
    res.json({ status: "OK", message: "Server running" });
});

app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
