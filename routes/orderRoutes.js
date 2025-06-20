import express from "express";
import createCodOrder from "../controllers/orderController.js";
const router = express.Router();

router.post("/create-cod", createCodOrder);

export default router;
