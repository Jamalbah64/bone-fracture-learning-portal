import express from "express";

const app = express();
const PORT = 5000;

app.use(express.json());

app.get("/health", (req, res) => {
    res.json({ status: "OK", message: "Server running" });
});

app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
