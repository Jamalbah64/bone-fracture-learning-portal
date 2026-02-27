import express from "express";
import cors from "cors";
import classificationRoute from "./routes/classification.js";
import "dotenv/config";

const app = express();
const PORT = Number(process.env.PORT ?? 5000);

app.use(cors());
app.use(express.json({ limit: "25mb" }));

app.use("/api/classify", classificationRoute);

app.get("/health", (req, res) => {
    res.json({ status: "OK", message: "Server running" });
});

const server = app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

server.on("close", () => {
  console.log("HTTP server closed");
});

server.on("error", (err) => {
  console.error("HTTP server error:", err);
});

process.on("SIGINT", () => {
  console.log("Received SIGINT, shutting down...");
  server.close(() => process.exit(0));
});

process.on("SIGTERM", () => {
  console.log("Received SIGTERM, shutting down...");
  server.close(() => process.exit(0));
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught exception:", err);
});

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled rejection:", reason);
});
