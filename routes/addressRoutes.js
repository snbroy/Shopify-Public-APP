import express from "express";
import { getAddressSuggestions } from "../controllers/addressController.js";

const router = express.Router();

// GET /api/address?q=delhi
router.get("/", getAddressSuggestions);

export default router;
