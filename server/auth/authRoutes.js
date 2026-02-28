//Router for the login and registration endpoints
import express from "express";
import { login, register } from "./authController.js";

const router = express.Router();

//routes for user registration and login.
router.post("/register", register);
router.post("/login", login);

export default router;
