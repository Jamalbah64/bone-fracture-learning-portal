//Router for the login and registration endpoints
import express from "express";
import { login, me, register } from "./authController.js";
import authMiddleware from "./middleware/auth.js";

const router = express.Router();

//routes for user registration and login/logout, and getting current user info
router.post("/register", register);
router.post("/login", login);
router.get("/me", authMiddleware, me); // Protected route to get current user info
router.post("/logout", authMiddleware, (req, res) => {
    return res.json({ message: "Logout successful" });
});
export default router;
