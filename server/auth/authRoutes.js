//Router for the login and registration endpoints
import express from "express";
import { login, register, me } from "./authController.js";
import authMiddleware from "./middleware/auth.js";

const router = express.Router();

//routes for user registration and login.
router.post("/register", register);
router.post("/login", login);
router.get("/me", authMiddleware, me);

export default router;
