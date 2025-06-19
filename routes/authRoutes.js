import express from "express";
import { installApp, authCallback } from "../controllers/authController.js";

const router = express.Router();
router.get("/auth", installApp);
router.get("/auth/callback", authCallback);

export default router;
