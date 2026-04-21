//Router for the login and registration endpoints
import express from "express";
import { logout, login, me, register } from "./authController.js";
import authMiddleware from "./middleware/auth.js";

const router = express.Router();

//routes for user registration and login/logout, and a route to get the current user's info
router.post("/register", register);
router.post("/login", login);
router.post("/logout", authMiddleware, logout);
router.get("/me", authMiddleware, me);
export default router;
