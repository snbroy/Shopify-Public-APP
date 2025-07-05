import express from "express";
import { getAddressSuggestions } from "../controllers/addressController.js";
import { verifyAccessToken } from "../middlewares/authMiddleware.js";

const router = express.Router();

// GET /api/address?q=delhi
router.get("/", verifyAccessToken, getAddressSuggestions);

export default router;
