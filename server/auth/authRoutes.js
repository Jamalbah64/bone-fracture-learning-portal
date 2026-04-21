//Router for the login and registration endpoints
import express from "express";
<<<<<<< HEAD
import { logout, login, me, register } from "./authController.js";
=======
import { login, me, register } from "./authController.js";
>>>>>>> cfd71478b51c4686f71dbb91118365a21552ab44
import authMiddleware from "./middleware/auth.js";

const router = express.Router();

<<<<<<< HEAD
//routes for user registration and login/logout, and a route to get the current user's info
router.post("/register", register);
router.post("/login", login);
router.post("/logout", authMiddleware, logout);
router.get("/me", authMiddleware, me);

=======
//routes for user registration and login/logout, and getting current user info
router.post("/register", register);
router.post("/login", login);
router.get("/me", authMiddleware, me); // Protected route to get current user info
router.post("/logout", authMiddleware, (req, res) => {
    return res.json({ message: "Logout successful" });
});
>>>>>>> cfd71478b51c4686f71dbb91118365a21552ab44
export default router;
